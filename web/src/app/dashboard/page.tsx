'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchDailySummary, fetchTransactions, fetchProducts, fetchUsers, fetchDeepSummary } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { io } from 'socket.io-client';
import { 
  TrendingUp, 
  AlertCircle, 
  Users as UsersIcon, 
  Zap, 
  ArrowRight, 
  Clock, 
  DollarSign, 
  ShoppingCart,
  Plus,
  Box,
  FileText,
  Trophy,
  CreditCard,
  BarChart3
} from 'lucide-react';

const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return `http://${hostname}:5000`;
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>({ totalRevenue: 0, totalTransactions: 0 });
  const [deepSummary, setDeepSummary] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [summaryData, deepData, transactionsData, products, users] = await Promise.all([
        fetchDailySummary(),
        fetchDeepSummary(),
        fetchTransactions(),
        fetchProducts(),
        fetchUsers()
      ]);
      setSummary(summaryData);
      setDeepSummary(deepData);
      setRecentTransactions(transactionsData.slice(0, 5));
      
      const lowStock = products.filter((p: any) => p.stockQty <= (p.lowStockThreshold || 5));
      setLowStockProducts(lowStock);
      setStaffCount(users.length);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const socket = io(SOCKET_URL);
    socket.on('newTransaction', (transaction) => {
      setSummary((prev: any) => ({
        totalRevenue: prev.totalRevenue + transaction.totalAmount,
        totalTransactions: prev.totalTransactions + 1,
      }));
      setRecentTransactions((prev) => [transaction, ...prev.slice(0, 4)]);
      // Refresh deep summary for real-time updates too
      fetchDeepSummary().then(setDeepSummary);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">กำลังเตรียมข้อมูลสรุป...</p>
      </div>
    </DashboardLayout>
  );

  const stats = [
    {
      title: 'ยอดขายรวมวันนี้',
      value: `${summary.totalRevenue.toLocaleString()} ฿`,
      subValue: `จาก ${summary.totalTransactions} รายการ`,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      lightColor: 'bg-indigo-50'
    },
    {
      title: 'สินค้าใกล้หมด',
      value: `${lowStockProducts.length} รายการ`,
      subValue: 'สต็อกต่ำกว่าเกณฑ์',
      icon: AlertCircle,
      color: 'bg-rose-500',
      textColor: lowStockProducts.length > 0 ? 'text-rose-600' : 'text-slate-400',
      lightColor: 'bg-rose-50',
      href: '/dashboard/products'
    },
    {
      title: 'เจ้าหน้าที่',
      value: `${staffCount} คน`,
      subValue: 'ลงทะเบียนในระบบ',
      icon: UsersIcon,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      lightColor: 'bg-amber-50',
      href: '/dashboard/staff'
    },
    {
      title: 'สถานะเซิร์ฟเวอร์',
      value: 'Online',
      subValue: `ล่าสุด: ${new Date().toLocaleTimeString('th-TH')}`,
      icon: Zap,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      lightColor: 'bg-emerald-50',
      pulse: true
    }
  ];

  const maxTrend = deepSummary?.trends ? Math.max(...deepSummary.trends.map((t: any) => t.amount), 1) : 1;

  return (
    <DashboardLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-slate-800">แดชบอร์ดสรุปผล</h1>
        <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">สรุปข้อมูลการขายและสต็อกสินค้าวันนี้</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {stats.map((stat, idx) => (
          <div key={idx} className="group bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 hover:-translate-y-2 transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 ${stat.lightColor} ${stat.textColor} rounded-2xl group-hover:scale-110 transition-transform`}>
                <stat.icon size={28} />
              </div>
              {stat.pulse && (
                <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-1">{stat.title}</p>
              <h3 className={`text-3xl font-black tracking-tighter ${stat.textColor}`}>{stat.value}</h3>
              <p className="text-slate-400 text-xs font-bold mt-2">{stat.subValue}</p>
            </div>
            {stat.href && (
              <Link href={stat.href} className="mt-6 flex items-center text-xs font-black text-indigo-500 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                ดูรายละเอียด <ArrowRight size={14} className="ml-2" />
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
        {/* Sales Trends (Last 7 Days) */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center space-x-4 bg-slate-50/30">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <BarChart3 size={24} />
            </div>
            <div>
              <h4 className="font-black text-xl text-slate-800 tracking-tight">แนวโน้มยอดขาย (7 วันล่าสุด)</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales Performance Trends</p>
            </div>
          </div>
          <div className="p-10 h-64 flex items-end justify-between space-x-4">
            {deepSummary?.trends.map((t: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div 
                  className="w-full bg-indigo-100 rounded-t-xl group-hover:bg-indigo-500 transition-all duration-500 relative cursor-pointer"
                  style={{ height: `${(t.amount / maxTrend) * 150}px`, minHeight: '4px' }}
                >
                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                      {t.amount.toLocaleString()} ฿
                   </div>
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-4 rotate-[-45deg] lg:rotate-0">
                  {new Date(t.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center space-x-4 bg-slate-50/30">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Trophy size={24} />
            </div>
            <div>
              <h4 className="font-black text-xl text-slate-800 tracking-tight">สินค้าขายดี</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Selling Products</p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            {deepSummary?.topProducts.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                    i === 0 ? 'bg-amber-100 text-amber-600' : 
                    i === 1 ? 'bg-slate-100 text-slate-400' : 
                    i === 2 ? 'bg-orange-50 text-orange-400' : 'bg-slate-50 text-slate-300'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-black text-slate-700 text-sm leading-tight">{p.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ขายได้ {p.quantity} ชิ้น</p>
                  </div>
                </div>
                <p className="font-black text-indigo-600 text-sm">{p.revenue.toLocaleString()} ฿</p>
              </div>
            ))}
            {(!deepSummary?.topProducts || deepSummary.topProducts.length === 0) && (
              <div className="py-10 text-center text-slate-300 italic text-sm">ยังไม่มีข้อมูลสินค้าขายดี</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Transactions Feed */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div className="flex items-center space-x-4">
               <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Clock size={24} />
               </div>
               <div>
                  <h4 className="font-black text-xl text-slate-800 tracking-tight">รายการขายล่าสุด</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">อัปเดตแบบ Real-time</p>
               </div>
            </div>
            <Link href="/dashboard/transactions" className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm uppercase tracking-widest">ทั้งหมด</Link>
          </div>
          
          <div className="divide-y divide-slate-50 px-4">
            {recentTransactions.map((t, idx) => (
              <div key={t.id || idx} className="p-6 hover:bg-slate-50/50 transition-all rounded-[2rem] flex justify-between items-center group my-1">
                <div className="flex items-center space-x-5">
                  <div className={`w-14 h-14 ${t.paymentMethod === 'CASH' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} rounded-2xl flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform`}>
                    {t.paymentMethod === 'CASH' ? <DollarSign size={24} /> : <Zap size={24} />}
                  </div>
                  <div>
                    <p className="font-black text-xl text-slate-800 tracking-tight">{t.totalAmount.toLocaleString()} ฿</p>
                    <div className="flex items-center space-x-3 mt-1">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(t.createdAt).toLocaleTimeString('th-TH')}</span>
                       <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{t.user?.name || 'Staff'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                   <div className="hidden sm:flex flex-col items-end mr-4">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${t.paymentMethod === 'CASH' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'} uppercase tracking-widest shadow-sm`}>{t.paymentMethod}</span>
                   </div>
                   <Link href="/dashboard/transactions" className="p-3 text-slate-200 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm">
                     <ArrowRight size={20} />
                   </Link>
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                   <ShoppingCart size={40} />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">ยังไม่มีรายการขายในขณะนี้</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Low Stock */}
        <div className="space-y-10">
          <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl shadow-indigo-200/20 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:scale-150"></div>
            <h4 className="font-black text-2xl mb-8 tracking-tight relative z-10 flex items-center">
               <Zap className="mr-3 text-indigo-400" size={28} fill="currentColor" /> จัดการด่วน
            </h4>
            <div className="space-y-4 relative z-10">
              <Link 
                href="/dashboard/products" 
                className="w-full py-5 px-6 bg-white/10 hover:bg-white hover:text-slate-900 rounded-2xl text-sm font-black transition-all flex items-center group/btn"
              >
                <div className="w-8 h-8 bg-white/10 group-hover/btn:bg-slate-100 rounded-lg flex items-center justify-center mr-4 transition-colors">
                  <Plus size={18} />
                </div>
                เพิ่มสินค้าใหม่
              </Link>
              <Link 
                href="/dashboard/products" 
                className="w-full py-5 px-6 bg-white/10 hover:bg-white hover:text-slate-900 rounded-2xl text-sm font-black transition-all flex items-center group/btn"
              >
                <div className="w-8 h-8 bg-white/10 group-hover/btn:bg-slate-100 rounded-lg flex items-center justify-center mr-4 transition-colors">
                  <Box size={18} />
                </div>
                ตรวจเช็คสต็อกทั้งหมด
              </Link>
              <Link 
                href="/dashboard/reports/sales"
                className="w-full py-5 px-6 bg-white/10 hover:bg-white hover:text-slate-900 rounded-2xl text-sm font-black transition-all flex items-center group/btn text-left"
              >
                <div className="w-8 h-8 bg-white/10 group-hover/btn:bg-slate-100 rounded-lg flex items-center justify-center mr-4 transition-colors">
                  <FileText size={18} />
                </div>
                พิมพ์รายงานสรุป
              </Link>
            </div>
          </div>
          
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50">
            <h4 className="font-black text-xl text-slate-800 mb-8 flex items-center">
               <AlertCircle className="mr-3 text-rose-500" size={24} /> แจ้งเตือนสินค้า
            </h4>
            <div className="space-y-6">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between group p-4 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100">
                    <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                          {p.name.charAt(0)}
                       </div>
                       <div>
                          <p className="font-black text-slate-700 text-sm leading-tight">{p.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">คงเหลือ: {p.stockQty}</p>
                       </div>
                    </div>
                    <Link href="/dashboard/products" className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ArrowRight size={18} />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center">
                   <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap size={28} fill="currentColor" />
                   </div>
                   <p className="text-emerald-600 font-black text-xs uppercase tracking-widest">สต็อกสินค้าเพียงพอ</p>
                </div>
              )}
              {lowStockProducts.length > 5 && (
                <Link href="/dashboard/products" className="block py-4 text-center bg-slate-50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-dashed border-slate-200">
                   ดูอีก {lowStockProducts.length - 5} รายการที่เหลือ
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
