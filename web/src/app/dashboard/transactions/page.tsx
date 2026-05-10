'use client';

import { useEffect, useState } from 'react';
import { fetchTransactions, cancelTransaction, fetchShopConfig } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  History, 
  RefreshCw, 
  Search, 
  ChevronRight, 
  DollarSign, 
  Zap, 
  Calendar, 
  User as UserIcon, 
  CreditCard, 
  X, 
  AlertTriangle,
  FileText,
  Clock,
  Printer
} from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showCancelModal, setShowCancelConfirm] = useState<{ show: boolean, id: string }>({ show: false, id: '' });
  const [cancelPassword, setCancelPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [shopConfig, setShopConfig] = useState<any>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await fetchTransactions();
      setTransactions(data);

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

  const handleCancel = async () => {
    if (!showCancelModal.id || !cancelPassword) return;
    try {
      await cancelTransaction(showCancelModal.id, cancelPassword);
      setShowCancelConfirm({ show: false, id: '' });
      setCancelPassword('');
      setSelectedBill(null);
      loadTransactions();
    } catch (err: any) {
      alert(err.message || 'รหัสผ่านไม่ถูกต้อง');
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.user?.name && t.user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">ประวัติการขาย</h1>
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">ตรวจสอบข้อมูลการขายและจัดการบิลย้อนหลัง</p>
        </div>
        <button 
          onClick={loadTransactions}
          className="flex items-center justify-center space-x-3 px-8 py-4 bg-white hover:bg-slate-50 text-slate-600 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200/50 border border-slate-100 transition-all transform active:scale-95"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-280px)] min-h-[600px]">
        {/* Left: Transaction List */}
        <div className={`bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50 flex flex-col overflow-hidden transition-all duration-500 ${selectedBill ? 'lg:w-1/2' : 'w-full'}`}>
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between gap-6">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาตาม Transaction ID หรือ ชื่อพนักงาน..." 
                className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-indigo-100 outline-none transition-all text-sm font-medium shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="divide-y divide-slate-50 px-4 py-2">
              {loading ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">กำลังโหลดข้อมูลประวัติ...</p>
                </div>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedBill(t)}
                    className={`p-6 rounded-[2rem] transition-all cursor-pointer flex justify-between items-center group my-1 border-2 ${selectedBill?.id === t.id ? 'bg-indigo-50 border-indigo-100 shadow-lg' : 'hover:bg-slate-50 border-transparent'}`}
                  >
                    <div className="flex items-center space-x-5">
                      <div className={`w-14 h-14 ${t.status === 'CANCELLED' ? 'bg-rose-50 text-rose-300' : (t.paymentMethod === 'CASH' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600')} rounded-2xl flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform`}>
                        {t.status === 'CANCELLED' ? <X size={24} /> : (t.paymentMethod === 'CASH' ? <DollarSign size={24} /> : <Zap size={24} />)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className={`font-black text-xl tracking-tight ${t.status === 'CANCELLED' ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{t.totalAmount.toLocaleString()} ฿</p>
                          {t.status === 'CANCELLED' && <span className="text-[10px] font-black px-2 py-0.5 bg-rose-50 text-rose-500 rounded-md uppercase tracking-widest">Cancelled</span>}
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                             <Clock size={10} className="mr-1" /> {new Date(t.createdAt).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                           <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center">
                             <UserIcon size={10} className="mr-1" /> {t.user?.name || 'Staff'}
                           </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className={`transition-all ${selectedBill?.id === t.id ? 'text-indigo-600 translate-x-1' : 'text-slate-200'}`} />
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                     <History size={40} />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">ไม่พบประวัติการขายในระบบ</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Bill Details */}
        {selectedBill ? (
          <div className="lg:w-1/2 bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-10 duration-500">
            <div className="p-8 border-b border-slate-50 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-black tracking-tighter">รายละเอียดบิล</h2>
                <div className="flex items-center space-x-2 mt-1">
                   <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">{selectedBill.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBill(null)} className="relative z-10 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/10">
               <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-white rounded-3xl border border-slate-50 shadow-sm">
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2 flex items-center">
                      <UserIcon size={12} className="mr-2 text-indigo-400" /> พนักงานที่ทำรายการ
                    </p>
                    <p className="font-black text-lg text-slate-800 tracking-tight">{selectedBill.user?.name || 'Unknown Staff'}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">{selectedBill.user?.email}</p>
                  </div>
                  <div className="p-6 bg-white rounded-3xl border border-slate-50 shadow-sm">
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2 flex items-center">
                      <Calendar size={12} className="mr-2 text-indigo-400" /> วันเวลาที่ทำรายการ
                    </p>
                    <p className="font-black text-lg text-slate-800 tracking-tight">{new Date(selectedBill.createdAt).toLocaleDateString('th-TH')}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">{new Date(selectedBill.createdAt).toLocaleTimeString('th-TH')}</p>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-2xl shadow-slate-200/40 overflow-hidden">
                  <div className="p-6 bg-slate-50/50 border-b border-slate-50 flex justify-between items-center">
                     <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center">
                        <FileText size={16} className="mr-2 text-indigo-600" /> รายการสินค้า
                     </h4>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedBill.items.length} Items</span>
                  </div>
                  <div className="p-2">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">สินค้า</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">จำนวน</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">รวม</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedBill.items.map((item: any) => (
                          <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-5">
                               <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                     {item.product?.name?.charAt(0)}
                                  </div>
                                  <span className="font-black text-slate-700 tracking-tight">{item.product?.name}</span>
                               </div>
                            </td>
                            <td className="px-6 py-5 text-center font-black text-slate-800 tracking-tight">{item.quantity}</td>
                            <td className="px-6 py-5 text-right font-black text-indigo-600 tracking-tighter">{(item.price * item.quantity).toLocaleString()} ฿</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-10 bg-indigo-50/50 flex justify-between items-center border-t border-white">
                     <div className="flex flex-col">
                        <span className="font-black text-indigo-900 uppercase tracking-widest text-xs mb-1">ยอดรวมทั้งสิ้น</span>
                        <div className="flex items-center space-x-3">
                           <span className={`text-[10px] font-black px-3 py-1 rounded-full ${selectedBill.paymentMethod === 'CASH' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'} uppercase tracking-widest shadow-sm`}>
                             {selectedBill.paymentMethod}
                           </span>
                        </div>
                     </div>
                     <span className="text-5xl font-black text-indigo-600 tracking-tighter">{selectedBill.totalAmount.toLocaleString()} ฿</span>
                  </div>
               </div>

               <div className="flex space-x-6">
                 {selectedBill.status !== 'CANCELLED' ? (
                   <>
                    <button 
                      onClick={() => setShowCancelConfirm({ show: true, id: selectedBill.id })}
                      className="flex-1 py-6 bg-rose-50 text-rose-600 border-4 border-dashed border-rose-200 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-rose-100 hover:border-rose-300 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-rose-100/50"
                    >
                      <AlertTriangle size={20} />
                      <span>ยกเลิกบิล (Admin)</span>
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="p-6 bg-slate-900 text-white rounded-[2rem] hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center space-x-3 px-10"
                    >
                      <Printer size={24} />
                      <span className="font-black uppercase tracking-widest text-xs">Print Receipt</span>
                    </button>
                   </>
                 ) : (
                   <div className="w-full py-8 bg-rose-50 text-rose-500 rounded-[2.5rem] text-center border-4 border-white shadow-inner">
                     <p className="font-black uppercase tracking-[0.5em] text-sm">บิลนี้ถูกยกเลิกแล้วเมื่อ {new Date(selectedBill.updatedAt || selectedBill.createdAt).toLocaleString('th-TH')}</p>
                   </div>
                 )}
               </div>

               {/* Formal Receipt Template (Hidden in UI) */}
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
            </div>
          </div>
        ) : (
          <div className="lg:w-1/2 bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/60 border border-slate-50 flex items-center justify-center text-slate-200 flex-col space-y-8 p-20">
            <div className="w-48 h-48 bg-slate-50 rounded-full flex items-center justify-center shadow-inner relative group">
              <History size={96} opacity={0.1} className="transition-transform group-hover:rotate-180 duration-1000" />
              <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 rounded-full transition-colors"></div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-slate-300 uppercase tracking-widest">กรุณาเลือกบิล</p>
              <p className="text-[10px] font-bold text-slate-200 mt-2 uppercase tracking-[0.3em]">เพื่อดูรายละเอียดการขายและข้อมูลรายการสินค้า</p>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal.show && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[160] p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-lg overflow-hidden border-8 border-white animate-in zoom-in slide-in-from-bottom-10 duration-500">
            <div className="p-12 text-center space-y-10">
              <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-rose-200 rotate-12">
                <AlertTriangle size={48} />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter">ยืนยันการยกเลิก</h2>
                <p className="text-slate-400 text-lg font-bold">กรุณาใส่รหัสผ่านแอดมินเพื่อยืนยันการยกเลิกบิลนี้ และคืนสินค้าเข้าสต็อก</p>
              </div>
              
              <input 
                type="password"
                autoFocus
                placeholder="Admin Password"
                className="w-full px-10 py-8 bg-slate-50 rounded-[2rem] border-4 border-transparent focus:border-rose-500 outline-none font-black text-center text-4xl tracking-[0.5em] transition-all shadow-inner"
                value={cancelPassword}
                onChange={(e) => setCancelPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCancel()}
              />
              
              <div className="flex space-x-6">
                <button 
                  onClick={() => { setShowCancelConfirm({ show: false, id: '' }); setCancelPassword(''); }} 
                  className="flex-1 py-6 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-3xl font-black text-sm uppercase tracking-widest transition-all"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleCancel} 
                  className="flex-[2] py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-3xl font-black text-lg uppercase tracking-widest shadow-2xl shadow-rose-200 transition-all transform active:scale-95"
                >
                  ยืนยันการยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </DashboardLayout>
  );
}
