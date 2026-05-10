'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchProducts, createRestockBill, fetchRestockBills, fetchShopConfig } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/lib/AuthContext';
import { 
  Truck, 
  Plus, 
  Search, 
  Trash2, 
  ChevronRight, 
  FileText, 
  Barcode,
  Package,
  History,
  CheckCircle2,
  X,
  AlertCircle,
  Zap,
  Clock,
  User as UserIcon,
  Printer
} from 'lucide-react';

export default function RestockPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [restockBills, setRestockBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Current Bill State
  const [currentItems, setCurrentItems] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastBill, setLastBill] = useState<any>(null);

  // View state
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [shopConfig, setShopConfig] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, bills] = await Promise.all([
        fetchProducts(), 
        fetchRestockBills()
      ]);
      setProducts(prods);
      setRestockBills(bills);

      // Fetch shop config optionally
      try {
        const config = await fetchShopConfig();
        setShopConfig(config);
      } catch (e) {
        console.warn('Failed to load shop config');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  ).slice(0, 8);

  const addItemToBill = (product: any) => {
    const existing = currentItems.find(item => item.productId === product.id);
    if (existing) {
      setCurrentItems(currentItems.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCurrentItems([...currentItems, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        costPrice: product.costPrice || 0,
        barcode: product.barcode
      }]);
    }
    setSearchQuery('');
    setShowProductSearch(false);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    
    const product = products.find(p => p.barcode === barcodeInput);
    if (product) {
      addItemToBill(product);
      setBarcodeInput('');
    } else {
      alert('ไม่พบสินค้าที่มีบาร์โค้ดนี้');
      setBarcodeInput('');
    }
  };

  const removeItem = (productId: string) => {
    setCurrentItems(currentItems.filter(item => item.productId !== productId));
  };

  const updateItem = (productId: string, field: string, value: any) => {
    setCurrentItems(currentItems.map(item => 
      item.productId === productId ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotal = () => {
    return currentItems.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);
  };

  const handleSubmitBill = async () => {
    if (currentItems.length === 0) return;
    if (!user) return;

    setIsSaving(true);
    try {
      const payload = {
        note,
        items: currentItems.map(item => ({
          productId: item.productId,
          quantity: parseInt(item.quantity),
          costPrice: parseFloat(item.costPrice)
        }))
      };

      const res = await createRestockBill(payload);
      setLastBill(res);
      setShowSuccessModal(true);
      setCurrentItems([]);
      setNote('');
      loadData();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center z-[200] p-6">
          <div className="bg-white rounded-[5rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,0.6)] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-500">
            <div className="p-16 text-center space-y-10">
              <div className="w-40 h-40 bg-green-100 text-green-600 rounded-[3rem] flex items-center justify-center mx-auto mb-8 animate-bounce shadow-2xl shadow-green-200 transform rotate-12">
                <CheckCircle2 size={80} />
              </div>
              <div>
                <h2 className="text-6xl font-black text-slate-800 tracking-tighter">สำเร็จ!</h2>
                <p className="text-slate-400 font-bold mt-3 uppercase tracking-[0.5em] text-sm">Restock Successful</p>
              </div>

              <div className="bg-slate-50 rounded-[3.5rem] p-10 space-y-6 border-2 border-slate-100 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-black uppercase tracking-widest text-sm">รวมต้นทุน</span>
                  <span className="text-4xl font-black text-slate-800 tracking-tighter">{lastBill?.totalCost?.toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-black uppercase tracking-widest text-sm">จำนวนรายการ</span>
                  <span className="text-xl font-black text-indigo-600">
                    {lastBill?.items?.length} รายการ
                  </span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  setActiveTab('HISTORY');
                }}
                className="w-full py-10 bg-slate-900 hover:bg-black text-white rounded-[3rem] font-black text-4xl shadow-[0_24px_48px_rgba(0,0,0,0.3)] transition-all transform active:scale-95"
              >
                เสร็จสิ้น (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">เติมของ / สต็อก</h1>
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">บันทึกการนำเข้าสินค้าเพื่อเพิ่มจำนวนสต็อกในระบบ</p>
        </div>
        
        <div className="flex bg-white p-2 rounded-2xl shadow-xl border border-slate-100">
           <button 
            onClick={() => setActiveTab('NEW')}
            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'NEW' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-indigo-600'}`}
           >
             ทำรายการใหม่
           </button>
           <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-indigo-600'}`}
           >
             ประวัติการเติม
           </button>
        </div>
      </div>

      {activeTab === 'NEW' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* Left: Bill Entry */}
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50 overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <Truck size={24} />
                      </div>
                      <h3 className="font-black text-xl text-slate-800 tracking-tight">รายการสินค้าที่นำเข้า</h3>
                   </div>
                   <div className="flex items-center space-x-3">
                      <div className="relative group hidden sm:block">
                        <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={16} />
                        <form onSubmit={handleBarcodeSubmit}>
                          <input 
                            type="text"
                            placeholder="ยิงบาร์โค้ด..."
                            className="pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl outline-none font-bold text-[10px] w-32 focus:w-48 focus:border-indigo-500 shadow-sm transition-all uppercase tracking-widest"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                          />
                        </form>
                      </div>

                      <div className="relative">
                        <button 
                          onClick={() => setShowProductSearch(!showProductSearch)}
                          className="flex items-center space-x-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all"
                        >
                          <Plus size={16} />
                          <span>เพิ่มสินค้า</span>
                        </button>
                      
                        {showProductSearch && (
                          <div className="absolute right-0 mt-4 w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-100 z-20 p-4 animate-in fade-in zoom-in duration-200">
                            <div className="relative group mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={18} />
                                <input 
                                  autoFocus
                                  type="text"
                                  placeholder="ค้นหาสินค้าที่ต้องการเติม..."
                                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {filteredProducts.map(p => (
                                  <button 
                                    key={p.id}
                                    onClick={() => addItemToBill(p)}
                                    className="w-full p-4 hover:bg-slate-50 rounded-2xl text-left transition-colors flex items-center space-x-4 group"
                                  >
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                        {p.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-700 text-sm">{p.name}</p>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Stock: {p.stockQty}</p>
                                    </div>
                                  </button>
                                ))}
                                {filteredProducts.length === 0 && (
                                  <p className="text-center py-8 text-slate-400 font-bold text-xs uppercase tracking-widest">ไม่พบสินค้า</p>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                   </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">สินค้า</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">จำนวนที่รับ</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ต้นทุนต่อหน่วย (฿)</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ราคารวม</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentItems.map((item) => (
                        <tr key={item.productId} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-6">
                             <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">
                                   {item.name.charAt(0)}
                                </div>
                                <div>
                                   <p className="font-black text-slate-800 text-sm">{item.name}</p>
                                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center mt-1">
                                      <Barcode size={10} className="mr-1" /> {item.barcode || 'NO BARCODE'}
                                   </p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex justify-center">
                                <input 
                                  type="number"
                                  className="w-24 px-4 py-2 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none text-center font-black text-slate-800"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.productId, 'quantity', e.target.value)}
                                />
                             </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex justify-center">
                                <input 
                                  type="number"
                                  step="0.01"
                                  className="w-32 px-4 py-2 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none text-center font-black text-slate-800"
                                  value={item.costPrice}
                                  onChange={(e) => updateItem(item.productId, 'costPrice', e.target.value)}
                                />
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right font-black text-indigo-600 tracking-tight">
                             {(item.quantity * item.costPrice).toLocaleString()} ฿
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button onClick={() => removeItem(item.productId)} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                <Trash2 size={18} />
                             </button>
                          </td>
                        </tr>
                      ))}
                      {currentItems.length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-8 py-20 text-center">
                              <div className="flex flex-col items-center justify-center space-y-4">
                                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                    <Package size={40} />
                                 </div>
                                 <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">ยังไม่มีรายการสินค้า</p>
                                 <button 
                                    onClick={() => setShowProductSearch(true)}
                                    className="text-xs font-black text-indigo-500 uppercase tracking-widest hover:underline"
                                 >+ คลิกเพื่อเพิ่มสินค้า</button>
                              </div>
                           </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
           </div>

           {/* Right: Summary & Action */}
           <div className="space-y-8">
              <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-10 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                 <h4 className="font-black text-2xl mb-10 tracking-tight relative z-10 flex items-center">
                    <Zap className="mr-3 text-indigo-400" size={28} fill="currentColor" /> สรุปใบนำเข้า
                 </h4>
                 
                 <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-center border-b border-white/10 pb-6">
                       <span className="text-slate-400 font-black uppercase tracking-widest text-xs">จำนวนรายการ</span>
                       <span className="text-2xl font-black">{currentItems.length} ชนิด</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-6">
                       <span className="text-slate-400 font-black uppercase tracking-widest text-xs">จำนวนชิ้นทั้งหมด</span>
                       <span className="text-2xl font-black">{currentItems.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0)} ชิ้น</span>
                    </div>
                    <div className="py-6">
                       <span className="text-slate-400 font-black uppercase tracking-widest text-xs block mb-4">ต้นทุนรวมทั้งสิ้น</span>
                       <div className="flex items-end space-x-2">
                          <span className="text-6xl font-black text-indigo-400 tracking-tighter">{calculateTotal().toLocaleString()}</span>
                          <span className="text-2xl font-black text-indigo-400 mb-2">฿</span>
                       </div>
                    </div>
                    
                    <div className="pt-4 space-y-4">
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">หมายเหตุ / บันทึกเพิ่มเติม</label>
                       <textarea 
                        className="w-full bg-white/5 border-2 border-white/10 rounded-3xl p-6 text-sm outline-none focus:border-indigo-500 transition-all min-h-[100px]"
                        placeholder="ระบุข้อมูลเพิ่มเติม (เช่น ชื่อซัพพลายเออร์, เลขที่ใบส่งของ)..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                       />
                    </div>

                    <button 
                      onClick={handleSubmitBill}
                      disabled={currentItems.length === 0 || isSaving}
                      className="w-full py-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[2.5rem] font-black text-2xl uppercase tracking-widest shadow-2xl shadow-indigo-500/20 transition-all transform active:scale-95 mt-6 flex items-center justify-center space-x-4"
                    >
                      {isSaving ? (
                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>บันทึกการเติมของ</span>
                          <CheckCircle2 size={28} />
                        </>
                      )}
                    </button>
                 </div>
              </div>

              <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 flex items-start space-x-4">
                 <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                    <AlertCircle size={24} />
                 </div>
                 <div>
                    <p className="font-black text-indigo-900 text-sm uppercase tracking-tight mb-1">ข้อควรรู้</p>
                    <p className="text-indigo-600/70 text-xs font-bold leading-relaxed">การบันทึกใบนำเข้าจะเป็นการ "เพิ่ม" จำนวนสต็อกเข้าไปจากที่มีอยู่เดิมทันที และจะมีการอัปเดตราคาต้นทุนล่าสุดของสินค้านั้นๆ ด้วย</p>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-280px)] min-h-[600px]">
           {/* History List */}
           <div className={`bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50 flex flex-col overflow-hidden transition-all duration-500 ${selectedBill ? 'lg:w-1/2' : 'w-full'}`}>
              <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                 <h3 className="font-black text-xl text-slate-800 tracking-tight">ประวัติการนำเข้าสินค้า</h3>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2">
                 <div className="divide-y divide-slate-50">
                    {restockBills.map((bill) => (
                      <div 
                        key={bill.id}
                        onClick={() => setSelectedBill(bill)}
                        className={`p-6 rounded-[2rem] transition-all cursor-pointer flex justify-between items-center group my-1 border-2 ${selectedBill?.id === bill.id ? 'bg-indigo-50 border-indigo-100 shadow-lg' : 'hover:bg-slate-50 border-transparent'}`}
                      >
                         <div className="flex items-center space-x-5">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                               <FileText size={24} />
                            </div>
                            <div>
                               <p className="font-black text-xl text-slate-800 tracking-tight">{bill.totalCost.toLocaleString()} ฿</p>
                               <div className="flex items-center space-x-3 mt-1">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                                    <Clock size={10} className="mr-1" /> {new Date(bill.createdAt).toLocaleString('th-TH')}
                                  </span>
                                  <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center">
                                    <UserIcon size={10} className="mr-1" /> {bill.user?.name}
                                  </span>
                               </div>
                            </div>
                         </div>
                         <ChevronRight size={20} className={`transition-all ${selectedBill?.id === bill.id ? 'text-indigo-600 translate-x-1' : 'text-slate-200'}`} />
                      </div>
                    ))}
                    {restockBills.length === 0 && (
                       <div className="py-20 text-center space-y-4">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                             <History size={40} />
                          </div>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">ไม่พบประวัติการเติมของ</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Detail Panel */}
           {selectedBill ? (
              <div className="lg:w-1/2 bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-10 duration-500">
                 <div className="p-8 border-b border-slate-50 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="relative z-10">
                       <h2 className="text-3xl font-black tracking-tighter">รายละเอียดบิลนำเข้า</h2>
                       <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-1">{selectedBill.id}</p>
                    </div>
                    <button onClick={() => setSelectedBill(null)} className="relative z-10 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors"><X size={24} /></button>
                 </div>
                 
                 <div className="p-10 space-y-8 flex-1 overflow-y-auto">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2 flex items-center">
                         <History size={12} className="mr-2 text-indigo-400" /> บันทึกช่วยจำ
                       </p>
                       <p className="font-bold text-slate-700 italic">{selectedBill.note || 'ไม่มีหมายเหตุ'}</p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-2xl shadow-slate-200/40 overflow-hidden">
                       <div className="p-6 bg-slate-50/50 border-b border-slate-50 flex justify-between items-center">
                          <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">รายการสินค้าที่นำเข้า</h4>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedBill.items.length} Items</span>
                       </div>
                       <table className="min-w-full">
                          <thead>
                             <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">สินค้า</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">จำนวน</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">ราคาทุน</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {selectedBill.items.map((item: any) => (
                               <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="px-6 py-5">
                                     <span className="font-black text-slate-700 tracking-tight">{item.product?.name}</span>
                                  </td>
                                  <td className="px-6 py-5 text-center font-black text-slate-800 tracking-tight">{item.quantity}</td>
                                  <td className="px-6 py-5 text-right font-black text-indigo-600 tracking-tighter">{item.costPrice.toLocaleString()} ฿</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                       <div className="p-10 bg-indigo-50/50 flex justify-between items-center border-t border-white">
                          <span className="font-black text-indigo-900 uppercase tracking-widest text-xs">ต้นทุนรวมทั้งหมด</span>
                          <span className="text-5xl font-black text-indigo-600 tracking-tighter">{selectedBill.totalCost.toLocaleString()} ฿</span>
                       </div>
                    </div>

                    <button 
                      onClick={() => window.print()}
                      className="w-full py-6 bg-slate-900 text-white rounded-[2rem] hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center space-x-3 font-black uppercase tracking-widest text-sm"
                    >
                      <Printer size={20} />
                      <span>พิมพ์ใบนำเข้า (Print Bill)</span>
                    </button>
                 </div>

                 {/* Formal Print Template (Hidden in UI) */}
                 <div className="hidden print:block fixed inset-0 bg-white z-[999] p-12 text-slate-900 font-serif">
                    <div className="border-b-4 border-slate-900 pb-8 mb-8 flex justify-between items-end">
                       <div>
                          <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">{shopConfig?.name || 'RESTOCK BILL'}</h1>
                          <p className="text-sm font-bold tracking-widest text-slate-500 uppercase">Official Document / {shopConfig?.name || 'ShopPP'} Inventory</p>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-black uppercase text-slate-400 mb-1">Bill Reference</p>
                          <p className="text-lg font-bold font-mono">{selectedBill.id}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-12">
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Issuer Details</p>
                          <p className="text-xl font-bold">{selectedBill.user?.name}</p>
                          <p className="text-sm text-slate-500">Authorized Personnel</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Date & Time</p>
                          <p className="text-xl font-bold">{new Date(selectedBill.createdAt).toLocaleString('th-TH')}</p>
                          <p className="text-sm text-slate-500 font-mono">{selectedBill.createdAt}</p>
                       </div>
                    </div>

                    <table className="w-full border-collapse mb-12">
                       <thead>
                          <tr className="border-y-2 border-slate-900 bg-slate-50">
                             <th className="py-4 text-left font-black uppercase text-xs px-4">Description</th>
                             <th className="py-4 text-center font-black uppercase text-xs px-4">Qty</th>
                             <th className="py-4 text-right font-black uppercase text-xs px-4">Unit Cost</th>
                             <th className="py-4 text-right font-black uppercase text-xs px-4">Amount</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-200">
                          {selectedBill.items.map((item: any) => (
                             <tr key={item.id}>
                                <td className="py-4 px-4 font-bold text-sm">{item.product?.name}</td>
                                <td className="py-4 px-4 text-center font-bold">{item.quantity}</td>
                                <td className="py-4 px-4 text-right font-mono">{item.costPrice.toLocaleString()}</td>
                                <td className="py-4 px-4 text-right font-black">{(item.costPrice * item.quantity).toLocaleString()}</td>
                             </tr>
                          ))}
                       </tbody>
                       <tfoot>
                          <tr className="border-t-2 border-slate-900">
                             <td colSpan={3} className="py-6 px-4 text-right text-sm font-black uppercase tracking-widest">Total Cost (THB)</td>
                             <td className="py-6 px-4 text-right text-3xl font-black border-b-4 border-double border-slate-900">
                                {selectedBill.totalCost.toLocaleString()}
                             </td>
                          </tr>
                       </tfoot>
                    </table>

                    <div className="mb-12">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Notes / Remarks</p>
                       <div className="p-6 bg-slate-50 border-l-4 border-slate-300 italic text-sm text-slate-600">
                          {selectedBill.note || 'No additional notes provided for this transaction.'}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-24 mt-24">
                       <div className="text-center pt-8 border-t border-slate-300">
                          <p className="text-xs font-black uppercase tracking-widest mb-8">Issued By</p>
                          <div className="h-12"></div>
                          <p className="font-bold">( {selectedBill.user?.name} )</p>
                       </div>
                       <div className="text-center pt-8 border-t border-slate-300">
                          <p className="text-xs font-black uppercase tracking-widest mb-8">Verified By</p>
                          <div className="h-12"></div>
                          <p className="font-bold">( ........................................ )</p>
                       </div>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="lg:w-1/2 bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/60 border border-slate-50 flex items-center justify-center text-slate-200 flex-col space-y-8 p-20">
                 <div className="w-48 h-48 bg-slate-50 rounded-full flex items-center justify-center shadow-inner">
                    <Truck size={96} opacity={0.1} />
                 </div>
                 <div className="text-center">
                    <p className="text-2xl font-black text-slate-300 uppercase tracking-widest">กรุณาเลือกบิล</p>
                    <p className="text-[10px] font-bold text-slate-200 mt-2 uppercase tracking-[0.3em]">เพื่อดูรายละเอียดการนำเข้าสินค้า</p>
                 </div>
              </div>
           )}
        </div>
      )}
    </DashboardLayout>
  );
}
