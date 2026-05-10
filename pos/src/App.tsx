import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Zap, CreditCard, Banknote, LogIn, LogOut, Coffee, History, X, AlertTriangle, Printer, CheckCircle2 } from 'lucide-react';
import { getProducts, getProductByBarcode, createTransaction, getTransactions, cancelTransaction, getShopConfig } from './api';
import { useAuth } from './AuthContext';
import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return `http://${hostname}:5000`;
  }
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
  isShortcut: boolean;
  stockQty: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [suspendedBills, setSuspendedBills] = useState<{ id: number, items: CartItem[], total: number, time: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [barcode, setBarcode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PROMPTPAY'>('CASH');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<{ show: boolean, id: string }>({ show: false, id: '' });
  const [cancelPassword, setCancelPassword] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [shopConfig, setShopConfig] = useState<any>(null);

  useEffect(() => {
    if (shopConfig?.name) {
      document.title = `${shopConfig.name} POS | ระบบขายหน้าร้าน`;
    }
  }, [shopConfig]);

  const [lastCreatedTransaction, setLastCreatedTransaction] = useState<any>(null);
  const [showErrorModal, setShowErrorModal] = useState<{ show: boolean, title: string, message: string }>({ show: false, title: '', message: '' });
  const [lastTransaction, setLastTransaction] = useState<{ total: number, change: number, method: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const errorTimeoutRef = useRef<any>(null);

  const showError = (title: string, message: string) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setShowErrorModal({ show: true, title, message });
    errorTimeoutRef.current = setTimeout(() => {
      setShowErrorModal({ show: false, title: '', message: '' });
      barcodeInputRef.current?.focus();
    }, 3000);
  };

  // Use a ref to always have the latest products state without re-running effects
  const productsRef = useRef<Product[]>([]);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code.startsWith('Numpad') && e.code.length === 7) {
        const num = parseInt(e.code.replace('Numpad', ''));
        const shortcutProducts = productsRef.current.filter(p => p.isShortcut);
        if (num >= 1 && num <= 9 && shortcutProducts[num - 1]) {
          addToCart(shortcutProducts[num - 1]);
        }
      }

      if (e.key === 'F5') {
        e.preventDefault();
        setCart([]);
      }
      if (e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) setShowCheckoutModal(true);
      }
      if (e.key === 'Escape') {
        setShowCheckoutModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length]); // Re-bind when cart length changes to keep closure fresh

  useEffect(() => {
    // Socket.io Setup
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('productUpdate', (data) => {
      console.log('Product update received:', data);
      setIsUpdating(true);
      loadProducts();
      setTimeout(() => setIsUpdating(false), 1000);
    });

    socket.on('newTransaction', (data) => {
      console.log('New transaction notification:', data);
      loadProducts(); // Refresh stock after transaction
    });

    socket.on('transactionCancelled', (data) => {
      console.log('Transaction cancelled notification:', data);
      loadProducts(); // Refresh stock after cancellation
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadProducts();
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      // Load products (Critical)
      const prodRes = await getProducts();
      setProducts(prodRes.data);
      
      // Load shop config (Optional/Graceful failure)
      try {
        const shopRes = await getShopConfig();
        setShopConfig(shopRes.data);
      } catch (shopErr) {
        console.warn('Failed to load shop config, using defaults');
      }
    } catch (err) {
      console.error('Failed to load products');
      showError('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อฐานข้อมูลสินค้าได้');
    }
  };

  const openHistory = async () => {
    try {
      const res = await getTransactions();
      setHistory(res.data);
      setShowHistoryModal(true);
    } catch (err) {
      showError('ข้อผิดพลาด', 'ไม่สามารถโหลดประวัติการขายได้');
    }
  };

  const handleCancelBill = async () => {
    if (!showCancelConfirm.id || !cancelPassword) return;
    try {
      await cancelTransaction(showCancelConfirm.id, cancelPassword);
      showError('สำเร็จ', 'ยกเลิกบิลและคืนสต็อกเรียบร้อยแล้ว');
      setShowCancelConfirm({ show: false, id: '' });
      setCancelPassword('');
      // Refresh history and products
      openHistory();
      loadProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'รหัสผ่านไม่ถูกต้อง หรือเกิดข้อผิดพลาด');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('debug_mode');
    setSuspendedBills([]);
    signOut(auth);
    window.location.reload();
  };

  const suspendBill = () => {
    if (cart.length === 0) return;
    const newSuspendedBill = {
      id: Date.now(),
      items: [...cart],
      total: totalAmount,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };
    setSuspendedBills(prev => [newSuspendedBill, ...prev]);
    setCart([]);
    showError('พักบิลสำเร็จ', `บันทึกบิลเวลา ${newSuspendedBill.time} เรียบร้อยแล้ว`);
  };

  const resumeBill = (id: number) => {
    const bill = suspendedBills.find(b => b.id === id);
    if (bill) {
      if (cart.length > 0) {
        const currentAsSuspended = {
          id: Date.now(),
          items: [...cart],
          total: totalAmount,
          time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        };
        setSuspendedBills(prev => [currentAsSuspended, ...prev.filter(b => b.id !== id)]);
      } else {
        setSuspendedBills(prev => prev.filter(b => b.id !== id));
      }
      setCart(bill.items);
    }
  };

  const addToCart = (product: Product) => {
    // 1. Get the absolute latest data from our state or the passed object
    const latestInfo = productsRef.current.find(p => p.id === product.id) || product;
    const stockLimit = Number(latestInfo.stockQty);

    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === latestInfo.id);
      const currentInCart = existing ? existing.quantity : 0;
      
      // 2. STRICT VALIDATION
      if (currentInCart >= stockLimit) {
        showError('สินค้าไม่เพียงพอ', `${latestInfo.name}\nคงเหลือ: ${stockLimit} | ในตะกร้า: ${currentInCart}`);
        return prevCart;
      }

      if (existing) {
        return prevCart.map(item =>
          item.id === latestInfo.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...latestInfo, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;
    try {
      const res = await getProductByBarcode(barcode);
      const product = res.data;
      
      // Update local products state
      setProducts(prev => {
        const exists = prev.find(p => p.id === product.id);
        if (exists) return prev.map(p => p.id === product.id ? product : p);
        return [...prev, product];
      });
      
      addToCart(product);
      setBarcode('');
    } catch (err) {
      showError('ไม่พบสินค้า', `ไม่พบบาร์โค้ด: ${barcode}\nกรุณาตรวจสอบอีกครั้ง`);
      setBarcode('');
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || !user) return;
    
    const receivedNum = parseFloat(receivedAmount);
    if (paymentMethod === 'CASH' && (isNaN(receivedNum) || receivedNum < totalAmount)) {
      showError('ยอดเงินไม่ถูกต้อง', 'กรุณาระบุจำนวนเงินที่รับมาให้ถูกต้อง');
      return;
    }

    try {
      const res = await createTransaction({
        totalAmount,
        paymentMethod,
        receivedAmount: receivedNum || totalAmount,
        changeAmount: (receivedNum || totalAmount) - totalAmount,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      });

      // Update local stock immediately
      setProducts(prev => prev.map(p => {
        const itemInCart = cart.find(item => item.id === p.id);
        if (itemInCart) return { ...p, stockQty: p.stockQty - itemInCart.quantity };
        return p;
      }));

      setLastTransaction({
        total: totalAmount,
        change: Math.max(0, (receivedNum || totalAmount) - totalAmount),
        method: paymentMethod
      });
      
      setLastCreatedTransaction(res.data);
      setCart([]);
      setReceivedAmount('');
      setShowCheckoutModal(false);
      setShowSuccessModal(true);
      loadProducts(); // Force refresh stock from DB
    } catch (err: any) {
      showError('การชำระเงินล้มเหลว', err.response?.data?.error || 'เกิดข้อผิดพลาดในการชำระเงิน');
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-bold">กำลังเริ่มต้นระบบ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_32px_128px_-24px_rgba(0,0,0,0.5)] w-full max-w-xl">
          <div className="text-center mb-12">
            <div className="w-28 h-28 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-indigo-500/40 transform -rotate-6">
              <LogIn size={56} />
            </div>
            <h1 className="text-5xl font-black text-slate-800 tracking-tighter">POS LOGIN</h1>
            <p className="text-slate-400 font-bold text-lg mt-3 uppercase tracking-widest">ระบบขายหน้าร้าน</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full px-8 py-6 bg-slate-50 rounded-3xl border-4 border-transparent focus:border-indigo-500 focus:bg-white transition-all text-2xl font-black text-slate-800 outline-none shadow-inner"
                placeholder="admin@shoppp.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-8 py-6 bg-slate-50 rounded-3xl border-4 border-transparent focus:border-indigo-500 focus:bg-white transition-all text-2xl font-black text-slate-800 outline-none shadow-inner"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            {loginError && (
              <div className="bg-red-50 text-red-500 py-4 px-6 rounded-2xl font-black text-center border-2 border-red-100 animate-shake">
                {loginError}
              </div>
            )}
            <button 
              type="submit"
              className="w-full py-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-3xl shadow-2xl shadow-indigo-500/30 transition-all transform active:scale-95 flex items-center justify-center space-x-4"
            >
              <span>เข้าสู่ระบบ</span>
              <Zap size={32} fill="currentColor" />
            </button>
          </form>
          <div className="mt-12 text-center">
            <p className="text-slate-300 text-xs font-black uppercase tracking-[0.5em]">© 2026 POS System v1.0</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Cart */}
        <div className="w-[550px] flex flex-col bg-white border-r border-slate-200 shadow-2xl z-10">
          <div className="p-8 bg-slate-900 text-white flex justify-between items-center shadow-lg">
            <div>
              <h1 className="text-3xl font-black tracking-tight flex items-center">
                <ShoppingCart className="mr-3 text-indigo-400" size={32} /> ตะกร้า
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={openHistory}
                className="p-3 hover:bg-slate-800 rounded-2xl transition text-slate-400 hover:text-blue-400 bg-slate-800/50"
                title="ประวัติการขาย"
              >
                <History size={24} />
              </button>
              <button 
                onClick={suspendBill}
                disabled={cart.length === 0}
                className="p-3 hover:bg-slate-800 rounded-2xl transition text-slate-400 hover:text-orange-400 bg-slate-800/50 disabled:opacity-20"
                title="พักบิล"
              >
                <Coffee size={24} />
              </button>
              <button 
                onClick={() => {
                  loadProducts();
                  setCart([]);
                }} 
                className="p-3 hover:bg-slate-800 rounded-2xl transition text-slate-400 hover:text-indigo-400 bg-slate-800/50"
                title="รีเฟรช"
              >
                <Zap size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="group flex justify-between items-center p-4 bg-white rounded-[1.5rem] border-2 border-slate-50 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
              <div className="flex-1">
                <p className="text-xl font-black text-slate-900 leading-tight">{item.name}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <span className="text-sm font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">{item.price.toLocaleString()} ฿</span>
                  <div className="flex items-center bg-indigo-50 px-3 py-1 rounded-xl">
                    <span className="text-sm font-black text-indigo-600">x {item.quantity}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-300">Stock: {products.find(p => p.id === item.id)?.stockQty}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <p className="text-2xl font-black text-slate-900">{(item.price * item.quantity).toLocaleString()} ฿</p>
                <button onClick={() => removeFromCart(item.id)} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-200 py-20">
              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart size={64} />
              </div>
              <p className="text-2xl font-black uppercase tracking-widest">ว่างเปล่า</p>
              <p className="text-sm font-bold text-slate-300 mt-2">ยังไม่มีสินค้าในตะกร้า</p>
            </div>
          )}
        </div>

        <div className="p-8 border-t-2 border-slate-50 space-y-6 bg-slate-50/30">
          <div className="flex justify-between items-end">
            <span className="text-xl font-black text-slate-400 uppercase tracking-widest">ยอดรวม</span>
            <div className="text-right">
              <span className="text-6xl font-black text-indigo-600 tracking-tighter">{totalAmount.toLocaleString()}</span>
              <span className="text-2xl font-black text-indigo-600 ml-2">฿</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setPaymentMethod('CASH')} className={`py-6 rounded-3xl border-3 flex flex-col items-center transition-all ${paymentMethod === 'CASH' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-inner' : 'border-transparent bg-white shadow-sm text-slate-300 hover:bg-slate-50'}`}>
              <Banknote size={32} />
              <span className="text-sm mt-3 font-black uppercase tracking-widest">เงินสด</span>
            </button>
            <button onClick={() => setPaymentMethod('PROMPTPAY')} className={`py-6 rounded-3xl border-3 flex flex-col items-center transition-all ${paymentMethod === 'PROMPTPAY' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-inner' : 'border-transparent bg-white shadow-sm text-slate-300 hover:bg-slate-50'}`}>
              <CreditCard size={32} />
              <span className="text-sm mt-3 font-black uppercase tracking-widest">QR Code</span>
            </button>
          </div>

          <button 
            onClick={() => setShowCheckoutModal(true)}
            disabled={cart.length === 0}
            className="w-full py-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-[2rem] font-black text-3xl shadow-2xl shadow-indigo-200 transition-all transform active:scale-[0.98]"
          >
            ชำระเงิน (F10)
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-10 space-y-10 overflow-y-auto">
        {/* Barcode Search */}
        <div className="max-w-4xl mx-auto w-full">
          <form onSubmit={handleBarcodeSubmit}>
            <div className="relative flex items-center group">
              <Search className={`absolute left-8 ${isUpdating ? 'text-indigo-500 animate-pulse' : 'text-slate-300'} group-focus-within:text-indigo-500 transition-colors`} size={32} />
              <input 
                ref={barcodeInputRef}
                type="text" 
                placeholder={isUpdating ? "กำลังอัปเดตข้อมูลสินค้า..." : "สแกนบาร์โค้ด หรือ ค้นหา..."}
                className={`w-full pl-20 pr-10 py-8 bg-white rounded-[2.5rem] shadow-2xl text-3xl font-black outline-none focus:ring-8 focus:ring-indigo-50 transition-all placeholder:text-slate-200 ${isUpdating ? 'border-4 border-indigo-400' : 'border-4 border-transparent'}`}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
              <div className="absolute right-8 flex items-center space-x-2">
                 <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200">Barcode Mode</span>
              </div>
            </div>
          </form>
        </div>

        {/* Shortcut Grid */}
        <div className="flex-1 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-4xl font-black tracking-tight flex items-center text-slate-800">
              <Zap className="mr-4 text-indigo-600" size={40} fill="currentColor" /> สินค้าขายดี
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged in as</p>
                <p className="font-bold text-slate-600">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-400 hover:text-red-500 hover:border-red-100 transition-all font-black text-sm uppercase tracking-widest shadow-sm">Logout</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 pb-10">
            {products.filter(p => p.isShortcut).map((p, idx) => {
              const inCart = cart.find(item => item.id === p.id)?.quantity || 0;
              const isOutOfStock = Number(p.stockQty) <= inCart;
              
              return (
                <button 
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={isOutOfStock}
                  className={`relative group p-8 rounded-[3rem] border-4 transition-all duration-300 flex flex-col items-center ${isOutOfStock ? 'bg-slate-50 grayscale opacity-60 cursor-not-allowed border-transparent' : 'bg-white border-transparent hover:border-indigo-100 hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-2 shadow-xl shadow-slate-200/50'}`}
                >
                  <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl font-black bg-slate-50 text-indigo-600 mb-6 shadow-inner transition-transform group-hover:scale-110">
                    {p.name.charAt(0)}
                  </div>
                  <p className="font-black text-xl text-slate-800 line-clamp-2 h-14 text-center leading-tight">{p.name}</p>
                  <p className="text-indigo-600 font-black text-3xl mt-4 tracking-tighter">{p.price.toLocaleString()}<span className="text-sm ml-1">฿</span></p>
                  
                  <div className="mt-4 flex flex-col items-center w-full">
                    <div className={`w-full py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center ${Number(p.stockQty) <= 5 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                      {Number(p.stockQty) <= 0 ? 'Out of Stock' : `Stock: ${p.stockQty}`}
                    </div>
                    {inCart > 0 && (
                      <div className="mt-2 bg-indigo-600 text-white w-full py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg shadow-indigo-100">
                        In Cart: {inCart}
                      </div>
                    )}
                  </div>

                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-[3rem] backdrop-blur-[2px]">
                      <span className="bg-red-600 text-white px-6 py-2 rounded-2xl text-sm font-black rotate-[-15deg] shadow-xl uppercase tracking-widest">
                        {Number(p.stockQty) <= 0 ? 'Sold Out' : 'Max Limit'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    {/* Suspended Bills Bottom Bar */}
    {suspendedBills.length > 0 && (
      <div className="bg-white border-t-4 border-orange-100 flex items-center px-8 py-4 space-x-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50">
        <div className="flex-shrink-0 flex items-center space-x-3 border-r-2 border-slate-100 pr-6">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Coffee size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">บิลที่พักไว้</p>
            <p className="text-2xl font-black text-orange-600">{suspendedBills.length}</p>
          </div>
        </div>
        
        <div className="flex-1 flex space-x-4 overflow-x-auto py-2 scrollbar-hide">
          {suspendedBills.map(bill => (
            <button 
              key={bill.id}
              onClick={() => resumeBill(bill.id)}
              className="flex-shrink-0 px-6 py-4 bg-slate-50 border-2 border-transparent hover:border-orange-500 hover:bg-white rounded-[2rem] shadow-sm transition-all text-left flex items-center space-x-6 group"
            >
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-orange-400 transition-colors">{bill.time}</p>
                <p className="text-2xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">{bill.total.toLocaleString()} ฿</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-orange-500 group-hover:border-orange-100 transition-all">
                 <Zap size={18} fill="currentColor" />
              </div>
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl flex items-center justify-center z-[150] p-6">
          <div className="bg-white rounded-[4rem] shadow-[0_32px_128px_-24px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-12 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-black tracking-tighter">ชำระเงิน</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mt-1">Checkout Process</p>
              </div>
              <div className="text-right">
                <p className="text-6xl font-black text-indigo-400 tracking-tighter">{totalAmount.toLocaleString()} ฿</p>
              </div>
            </div>
            <div className="p-12 space-y-10">
              {paymentMethod === 'CASH' && (
                <div className="space-y-6">
                  <label className="block text-sm font-black uppercase tracking-[0.3em] text-slate-400 ml-4">เงินที่รับมา (Received Amount)</label>
                  <input autoFocus type="number" className="w-full px-10 py-10 bg-slate-50 rounded-[2.5rem] text-7xl font-black outline-none focus:ring-12 focus:ring-indigo-50 border-4 border-transparent focus:border-indigo-500 transition-all text-center shadow-inner" placeholder="0" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} />
                  
                  <div className="p-10 bg-indigo-600 rounded-[3rem] text-white flex justify-between items-center shadow-2xl shadow-indigo-200">
                    <span className="text-2xl font-black uppercase tracking-widest">เงินทอน</span>
                    <span className="text-7xl font-black tracking-tighter">{Math.max(0, (Number(receivedAmount) || 0) - totalAmount).toLocaleString()} ฿</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'PROMPTPAY' && (
                <div className="text-center py-10 space-y-6">
                   <div className="w-64 h-64 bg-slate-50 rounded-[3rem] mx-auto flex items-center justify-center border-4 border-dashed border-slate-200">
                      <CreditCard size={128} className="text-slate-200" />
                   </div>
                   <p className="text-2xl font-black text-slate-800">กรุณาสแกน QR Code เพื่อชำระเงิน</p>
                   <p className="text-slate-400 font-bold uppercase tracking-widest">ยอดชำระ: {totalAmount.toLocaleString()} ฿</p>
                </div>
              )}

              <div className="flex space-x-6 pt-4">
                <button onClick={() => setShowCheckoutModal(false)} className="flex-1 py-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[2.5rem] font-black text-2xl transition-all">ยกเลิก</button>
                <button onClick={handleCheckout} className="flex-[2] py-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black text-4xl shadow-2xl shadow-indigo-200 transition-all transform active:scale-95">ยืนยัน (OK)</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[120] p-6">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden border-8 border-white">
            {/* Left: List */}
            <div className="w-2/5 border-r-4 border-slate-50 flex flex-col">
              <div className="p-10 border-b-4 border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-3xl font-black tracking-tighter">ประวัติการขาย</h2>
                <button onClick={() => setShowHistoryModal(false)} className="p-4 hover:bg-white rounded-3xl transition-all shadow-sm border border-slate-100"><X size={32} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {history.map(bill => (
                  <button 
                    key={bill.id}
                    onClick={() => setSelectedBill(bill)}
                    className={`w-full p-6 rounded-[2rem] border-4 text-left transition-all ${selectedBill?.id === bill.id ? 'border-indigo-600 bg-indigo-50 shadow-xl scale-[1.02]' : 'border-slate-50 hover:border-indigo-100 bg-white'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`text-3xl font-black tracking-tighter ${bill.status === 'CANCELLED' ? 'line-through text-slate-300' : 'text-slate-900'}`}>{bill.totalAmount.toLocaleString()} ฿</p>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(bill.createdAt).toLocaleString('th-TH')}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full shadow-sm ${bill.paymentMethod === 'CASH' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>{bill.paymentMethod}</span>
                        {bill.status === 'CANCELLED' && <span className="text-[10px] font-black px-4 py-1.5 rounded-full bg-red-100 text-red-600 uppercase tracking-widest shadow-sm">CANCELLED</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Right: Detail */}
            <div className="w-3/5 flex flex-col bg-slate-50/30">
              {selectedBill ? (
                <div className="flex-1 flex flex-col">
                  <div className="p-12 space-y-8">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Transaction ID</p>
                        <p className="font-mono text-sm bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">{selectedBill.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Operator</p>
                        <div className="flex items-center space-x-3 justify-end">
                          <span className="font-black text-xl text-slate-800">{selectedBill.user?.name}</span>
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black">
                            {selectedBill.user?.name?.charAt(0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-[3rem] border-4 border-white shadow-2xl overflow-hidden">
                      <div className="p-6 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.3em] flex justify-between">
                        <span>รายการสินค้า</span>
                        <span>จำนวน | ราคา</span>
                      </div>
                      <div className="p-8 space-y-6 max-h-[40vh] overflow-y-auto">
                        {selectedBill.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center group">
                            <div className="flex items-center space-x-4">
                               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                  {item.product?.name?.charAt(0)}
                               </div>
                               <span className="font-black text-xl text-slate-700">{item.product?.name}</span>
                            </div>
                            <span className="font-black text-xl">{item.quantity} <span className="text-xs text-slate-300 mx-2">x</span> {item.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-10 bg-slate-50 border-t-4 border-white flex justify-between items-center">
                        <span className="font-black text-2xl uppercase tracking-widest text-slate-400">Total</span>
                        <span className="text-6xl font-black text-indigo-600 tracking-tighter">{selectedBill.totalAmount.toLocaleString()} ฿</span>
                      </div>
                    </div>

                    <div className="flex space-x-6">
                      <button 
                        onClick={() => window.print()}
                        className="flex-1 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl hover:bg-black transition-all flex items-center justify-center space-x-4 shadow-xl shadow-slate-200"
                      >
                        <Printer size={32} />
                        <span>พิมพ์ใบเสร็จ (Print)</span>
                      </button>
                      {selectedBill.status !== 'CANCELLED' && (
                        <button 
                          onClick={() => setShowCancelConfirm({ show: true, id: selectedBill.id })}
                          className="flex-1 py-8 bg-red-50 text-red-600 border-4 border-dashed border-red-200 rounded-[2.5rem] font-black text-2xl hover:bg-red-100 hover:border-red-300 transition-all flex items-center justify-center space-x-4 shadow-xl shadow-red-100/50"
                        >
                          <AlertTriangle size={32} />
                          <span>ยกเลิกบิล</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Formal Receipt Template for History (Hidden in UI) */}
                  {selectedBill && (
                    <div className="hidden print:block fixed inset-0 bg-white z-[999] p-12 text-slate-900 font-serif">
                      <div className="text-center border-b-4 border-slate-900 pb-8 mb-8">
                        <h1 className="text-6xl font-black tracking-tighter uppercase mb-2">{shopConfig?.name || 'SHOP PP'}</h1>
                        <p className="text-sm font-bold tracking-[0.3em] text-slate-500 uppercase">Premium Quality & Service</p>
                        <p className="text-xs mt-4 text-slate-400">{shopConfig?.address || '123 Market Street, City Center'} | Tel: {shopConfig?.phone || '02-xxx-xxxx'}</p>
                      </div>

                      <div className="flex justify-between items-start mb-12">
                        <div>
                          <h2 className="text-2xl font-black uppercase mb-4">Sales Receipt</h2>
                          <div className="space-y-1">
                            <p className="text-sm flex items-center"><span className="w-24 font-black text-slate-400 uppercase text-[10px]">Bill ID:</span> <span className="font-mono font-bold">{selectedBill.id}</span></p>
                            <p className="text-sm flex items-center"><span className="w-24 font-black text-slate-400 uppercase text-[10px]">Cashier:</span> <span className="font-bold">{selectedBill.user?.name}</span></p>
                            <p className="text-sm flex items-center"><span className="w-24 font-black text-slate-400 uppercase text-[10px]">Payment:</span> <span className="font-black text-indigo-600 uppercase">{selectedBill.paymentMethod}</span></p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Date of Issue</p>
                          <p className="text-xl font-bold">{new Date(selectedBill.createdAt).toLocaleString('th-TH')}</p>
                        </div>
                      </div>

                      <table className="w-full border-collapse mb-12">
                        <thead>
                          <tr className="border-y-2 border-slate-900 bg-slate-50">
                            <th className="py-4 text-left font-black uppercase text-xs px-4">Item Description</th>
                            <th className="py-4 text-center font-black uppercase text-xs px-4">Qty</th>
                            <th className="py-4 text-right font-black uppercase text-xs px-4">Price</th>
                            <th className="py-4 text-right font-black uppercase text-xs px-4">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {selectedBill.items.map((item: any) => (
                            <tr key={item.id}>
                              <td className="py-4 px-4 font-bold text-sm">{item.product?.name}</td>
                              <td className="py-4 px-4 text-center font-bold">{item.quantity}</td>
                              <td className="py-4 px-4 text-right font-mono">{item.price.toLocaleString()}</td>
                              <td className="py-4 px-4 text-right font-black">{(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-900">
                             <td colSpan={3} className="py-4 px-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">Sub Total</td>
                             <td className="py-4 px-4 text-right font-bold">{selectedBill.totalAmount.toLocaleString()}</td>
                          </tr>
                          {selectedBill.receivedAmount > 0 && (
                            <>
                              <tr>
                                 <td colSpan={3} className="py-2 px-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">Received</td>
                                 <td className="py-2 px-4 text-right font-bold">{selectedBill.receivedAmount.toLocaleString()}</td>
                              </tr>
                              <tr>
                                 <td colSpan={3} className="py-2 px-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">Change</td>
                                 <td className="py-2 px-4 text-right font-bold">{selectedBill.changeAmount.toLocaleString()}</td>
                              </tr>
                            </>
                          )}
                          <tr className="border-t-2 border-slate-900 bg-slate-50">
                            <td colSpan={3} className="py-6 px-4 text-right text-sm font-black uppercase tracking-widest">Grand Total (THB)</td>
                            <td className="py-6 px-4 text-right text-4xl font-black border-b-4 border-double border-slate-900">
                              {selectedBill.totalAmount.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>

                      </table>

                      <div className="text-center mt-24 mb-12">
                        <p className="text-sm font-bold italic mb-2">"Thank you for your business!"</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">This is a computer-generated document. No signature required.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-24 mt-32">
                        <div className="text-center pt-8 border-t border-slate-200">
                          <p className="text-[10px] font-black uppercase tracking-widest">Customer Signature</p>
                        </div>
                        <div className="text-center pt-8 border-t border-slate-200">
                          <p className="text-[10px] font-black uppercase tracking-widest">Authorized Collector</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-200 flex-col space-y-8">
                  <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <History size={96} opacity={0.1} />
                  </div>
                  <p className="text-3xl font-black uppercase tracking-widest">เลือกบิลเพื่อดูรายละเอียด</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm.show && (
        <div className="fixed inset-0 bg-red-900/60 backdrop-blur-xl flex items-center justify-center z-[160] p-6">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-lg overflow-hidden p-12 space-y-10 animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-200 rotate-12">
                <AlertTriangle size={48} />
              </div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter">ยืนยันการยกเลิก</h2>
              <p className="text-slate-400 text-lg font-bold">กรุณาใส่รหัสผ่านแอดมินเพื่อยืนยัน</p>
            </div>
            <input 
              autoFocus
              type="password"
              placeholder="รหัสผ่านแอดมิน"
              className="w-full px-10 py-8 bg-slate-50 rounded-[2rem] border-4 border-transparent focus:border-red-500 outline-none font-black text-center text-4xl tracking-[0.5em] transition-all shadow-inner"
              value={cancelPassword}
              onChange={(e) => setCancelPassword(e.target.value)}
            />
            <div className="flex space-x-6">
              <button onClick={() => setShowCancelConfirm({ show: false, id: '' })} className="flex-1 py-6 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[2rem] font-black text-xl transition-all">กลับ</button>
              <button onClick={handleCancelBill} className="flex-[2] py-6 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-red-200 transition-all transform active:scale-95 uppercase tracking-widest">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-indigo-900/90 backdrop-blur-2xl flex items-center justify-center z-[200] p-6">
          <div className="bg-white rounded-[5rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,0.6)] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-500">
            <div className="p-16 text-center space-y-10">
              <div className="w-40 h-40 bg-green-100 text-green-600 rounded-[3rem] flex items-center justify-center mx-auto mb-8 animate-bounce shadow-2xl shadow-green-200 transform rotate-12">
                <Zap size={80} fill="currentColor" />
              </div>
              <div>
                <h2 className="text-6xl font-black text-slate-800 tracking-tighter">สำเร็จ!</h2>
                <p className="text-slate-400 font-bold mt-3 uppercase tracking-[0.5em] text-sm">Payment Successful</p>
              </div>

              <div className="bg-slate-50 rounded-[3.5rem] p-10 space-y-6 border-2 border-slate-100 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-black uppercase tracking-widest text-sm">ยอดชำระ</span>
                  <span className="text-4xl font-black text-slate-800 tracking-tighter">{lastTransaction?.total.toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-black uppercase tracking-widest text-sm">วิธีชำระ</span>
                  <span className="text-lg font-black bg-indigo-600 text-white px-6 py-2 rounded-2xl shadow-lg">
                    {lastTransaction?.method === 'CASH' ? 'เงินสด (CASH)' : 'QR CODE'}
                  </span>
                </div>
                {lastTransaction?.method === 'CASH' && (
                  <div className="pt-8 border-t-4 border-white flex justify-between items-center">
                    <span className="text-green-600 font-black uppercase tracking-widest text-lg">เงินทอน</span>
                    <span className="text-6xl font-black text-green-600 tracking-tighter">{lastTransaction?.change.toLocaleString()} ฿</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-6">
                <button 
                  onClick={() => {
                    setShowSuccessModal(false);
                    setTimeout(() => barcodeInputRef.current?.focus(), 100);
                  }}
                  className="flex-1 py-10 bg-slate-900 hover:bg-black text-white rounded-[3rem] font-black text-4xl shadow-[0_24px_48px_rgba(0,0,0,0.3)] transition-all transform active:scale-95"
                >
                  เสร็จสิ้น (Close)
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-12 py-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[3rem] font-black shadow-[0_24px_48px_rgba(79,70,229,0.3)] transition-all transform active:scale-95 flex items-center justify-center"
                >
                  <Printer size={48} />
                </button>
              </div>
            </div>

            {/* Formal Receipt Template (Hidden in UI) */}
            {lastCreatedTransaction && (
              <div className="hidden print:block fixed inset-0 bg-white z-[999] p-12 text-slate-900 font-serif">
                <div className="text-center border-b-4 border-slate-900 pb-8 mb-8">
                  <h1 className="text-6xl font-black tracking-tighter uppercase mb-2">{shopConfig?.name || 'SHOP PP'}</h1>
                  <p className="text-sm font-bold tracking-[0.3em] text-slate-500 uppercase">Premium Quality & Service</p>
                  <p className="text-xs mt-4 text-slate-400">{shopConfig?.address || '123 Market Street, City Center'} | Tel: {shopConfig?.phone || '02-xxx-xxxx'}</p>
                </div>

                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h2 className="text-2xl font-black uppercase mb-4">Sales Receipt</h2>
                    <div className="space-y-1">
                      <p className="text-sm flex items-center"><span className="w-24 font-black text-slate-400 uppercase text-[10px]">Bill ID:</span> <span className="font-mono font-bold">{lastCreatedTransaction.id}</span></p>
                      <p className="text-sm flex items-center"><span className="w-24 font-black text-slate-400 uppercase text-[10px]">Cashier:</span> <span className="font-bold">{user?.email}</span></p>
                      <p className="text-sm flex items-center"><span className="w-24 font-black text-slate-400 uppercase text-[10px]">Payment:</span> <span className="font-black text-indigo-600 uppercase">{lastCreatedTransaction.paymentMethod}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Date of Issue</p>
                    <p className="text-xl font-bold">{new Date(lastCreatedTransaction.createdAt).toLocaleString('th-TH')}</p>
                  </div>
                </div>

                <table className="w-full border-collapse mb-12">
                  <thead>
                    <tr className="border-y-2 border-slate-900 bg-slate-50">
                      <th className="py-4 text-left font-black uppercase text-xs px-4">Item Description</th>
                      <th className="py-4 text-center font-black uppercase text-xs px-4">Qty</th>
                      <th className="py-4 text-right font-black uppercase text-xs px-4">Price</th>
                      <th className="py-4 text-right font-black uppercase text-xs px-4">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {lastCreatedTransaction.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-4 px-4 font-bold text-sm">{item.product?.name || 'Unknown Product'}</td>
                        <td className="py-4 px-4 text-center font-bold">{item.quantity}</td>
                        <td className="py-4 px-4 text-right font-mono">{item.price?.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right font-black">{(item.price * item.quantity)?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-900">
                      <td colSpan={3} className="py-4 px-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">Sub Total</td>
                      <td className="py-4 px-4 text-right font-bold">{lastCreatedTransaction.totalAmount.toLocaleString()}</td>
                    </tr>
                    {lastCreatedTransaction.receivedAmount > 0 && (
                      <>
                        <tr>
                          <td colSpan={3} className="py-2 px-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">Received</td>
                          <td className="py-2 px-4 text-right font-bold">{lastCreatedTransaction.receivedAmount.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="py-2 px-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">Change</td>
                          <td className="py-2 px-4 text-right font-bold">{lastCreatedTransaction.changeAmount.toLocaleString()}</td>
                        </tr>
                      </>
                    )}
                    <tr className="border-t-2 border-slate-900 bg-slate-50">
                      <td colSpan={3} className="py-6 px-4 text-right text-sm font-black uppercase tracking-widest">Grand Total (THB)</td>
                      <td className="py-6 px-4 text-right text-4xl font-black border-b-4 border-double border-slate-900">
                        {lastCreatedTransaction.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="text-center mt-24 mb-12">
                  <p className="text-sm font-bold italic mb-2">"Thank you for your business!"</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">This is a computer-generated document. No signature required.</p>
                </div>

                <div className="grid grid-cols-2 gap-24 mt-32">
                  <div className="text-center pt-8 border-t border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest">Customer Signature</p>
                  </div>
                  <div className="text-center pt-8 border-t border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest">Authorized Collector</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Modal (Auto-closes in 3s) */}
      {showErrorModal.show && (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-xl flex items-center justify-center z-[210] p-6">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-500">
            <div className="p-12 text-center space-y-8">
              <div className="w-32 h-32 bg-red-100 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 animate-pulse shadow-xl shadow-red-200">
                <AlertTriangle size={64} />
              </div>
              <div>
                <h2 className="text-5xl font-black text-red-600 tracking-tighter">{showErrorModal.title}</h2>
                <p className="text-slate-500 font-black text-xl mt-4 whitespace-pre-line leading-relaxed">{showErrorModal.message}</p>
              </div>
              <div className="pt-6">
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-red-500 h-full animate-[progress_3s_linear_forwards]"></div>
                </div>
                <p className="text-[10px] text-slate-300 font-black mt-4 uppercase tracking-[0.5em]">Auto-closing...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
