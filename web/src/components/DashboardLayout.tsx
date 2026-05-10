'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  Users, 
  LogOut, 
  Bell,
  Menu,
  X,
  Truck,
  LayoutGrid,
  AlertTriangle,
  ArrowRight,
  Settings
} from 'lucide-react';
import { useState } from 'react';
import { fetchProducts, fetchShopConfig } from '@/lib/api';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [shopConfig, setShopConfig] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [products, config] = await Promise.all([
          fetchProducts(),
          fetchShopConfig().catch(() => null)
        ]);
        
        const lowStock = products.filter((p: any) => p.stockQty <= (p.lowStockThreshold || 5));
        setLowStockItems(lowStock);
        if (config) setShopConfig(config);
      } catch (err) {
        console.error('Failed to load initial layout data', err);
      }
    };
    if (user) loadInitialData();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const menuItems = [
    { name: 'หน้าหลักสรุปผล', href: '/dashboard', icon: LayoutDashboard },
    { name: 'จัดการสินค้า', href: '/dashboard/products', icon: Package },
    { name: 'จัดการหมวดหมู่', href: '/dashboard/categories', icon: LayoutGrid },
    { name: 'เติมของ/สต็อก', href: '/dashboard/restock', icon: Truck },
    { name: 'ประวัติการขาย', href: '/dashboard/transactions', icon: History },
    { name: 'จัดการเจ้าหน้าที่', href: '/dashboard/staff', icon: Users },
    { name: 'ตั้งค่าร้านค้า', href: '/dashboard/settings', icon: Settings },
  ];
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-600 font-black uppercase tracking-widest text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col shadow-2xl`}>
        <div className="p-8 flex items-center space-x-4 border-b border-slate-800/50">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <LayoutDashboard size={24} />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white uppercase truncate">
            {shopConfig?.name ? (
              <>
                {shopConfig.name.split(' ')[0]} <span className="text-indigo-500">{shopConfig.name.split(' ').slice(1).join(' ')}</span>
              </>
            ) : (
              <>ShopPP <span className="text-indigo-500">POS</span></>
            )}
          </span>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto mt-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-4">เมนูหลัก</p>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all group ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <item.icon size={22} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} transition-colors`} />
                <span className="font-bold tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800/50 space-y-4">
          <div className="flex items-center space-x-3 px-4 py-2 bg-slate-800/30 rounded-2xl border border-slate-800/50">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-black text-xs">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate">{user.email?.split('@')[0]}</p>
              <p className="text-[10px] font-bold text-slate-500 truncate">Administrator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all font-black text-sm uppercase tracking-widest border border-red-500/20 shadow-lg shadow-red-500/5"
          >
            <LogOut size={18} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex justify-between items-center z-40 sticky top-0">
          <div className="flex items-center space-x-4 lg:hidden">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          <div className="flex-1"></div>

          <div className="flex items-center space-x-6">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`relative p-2.5 rounded-2xl transition-all ${isNotificationOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
              >
                <Bell size={22} />
                {lowStockItems.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotificationOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                      <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest">การแจ้งเตือน</h5>
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg">{lowStockItems.length} ใหม่</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {lowStockItems.length > 0 ? (
                        lowStockItems.map((item) => (
                          <Link 
                            key={item.id} 
                            href="/dashboard/products"
                            onClick={() => setIsNotificationOpen(false)}
                            className="flex items-center p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 group"
                          >
                            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                              <AlertTriangle size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-800 truncate">{item.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">สินค้าใกล้หมด: เหลือ {item.stockQty} ชิ้น</p>
                            </div>
                            <ArrowRight size={14} className="text-slate-200 group-hover:text-indigo-400 transition-colors ml-2" />
                          </Link>
                        ))
                      ) : (
                        <div className="p-10 text-center">
                          <div className="w-12 h-12 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell size={24} />
                          </div>
                          <p className="text-xs font-bold text-slate-400">ไม่มีการแจ้งเตือนใหม่</p>
                        </div>
                      )}
                    </div>
                    {lowStockItems.length > 0 && (
                      <Link 
                        href="/dashboard/products" 
                        onClick={() => setIsNotificationOpen(false)}
                        className="block p-4 text-center text-[10px] font-black text-indigo-500 hover:bg-indigo-50 transition-colors uppercase tracking-widest border-t border-slate-50"
                      >
                        ดูสินค้าทั้งหมด
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div className="h-8 w-[2px] bg-slate-100 hidden sm:block"></div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800">{user.email}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ยินดีต้อนรับ</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>


        <div className="flex-1 overflow-y-auto p-8 lg:p-12 pb-24">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </div>
        
        {/* Footer info */}
        <div className="absolute bottom-6 right-8 text-right hidden lg:block">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">© 2026 {shopConfig?.name || 'ShopPP'} POS System v1.0</p>
        </div>
      </main>
    </div>
  );
}
