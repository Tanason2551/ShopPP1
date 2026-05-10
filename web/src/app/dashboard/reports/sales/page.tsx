'use client';

import { useEffect, useState } from 'react';
import { fetchSalesReportByProduct, fetchShopConfig } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Printer, 
  ArrowLeft, 
  FileText, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';

export default function SalesReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [shopConfig, setShopConfig] = useState<any>(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      const [data, config] = await Promise.all([
        fetchSalesReportByProduct(startDate, endDate),
        fetchShopConfig()
      ]);
      setReportData(data);
      setShopConfig(config);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadReport();
    }
  }, [user, authLoading]);

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
           <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
           <p className="text-slate-400 font-black uppercase tracking-widest text-xs">กำลังเตรียมรายงาน...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = reportData.reduce((sum, item) => sum + item.revenue, 0);
  const totalQty = reportData.reduce((sum, item) => sum + item.quantity, 0);
  const totalProfit = reportData.reduce((sum, item) => sum + item.profit, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 print:bg-white print:p-0">
      {/* Header - Hidden on Print */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-white hover:bg-slate-100 rounded-2xl shadow-sm border border-slate-200 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800">รายงานยอดขายแยกตามสินค้า</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Sales Report by Product</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
           <button 
            onClick={handlePrint}
            className="flex items-center space-x-3 px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all transform active:scale-95"
           >
             <Printer size={18} />
             <span>พิมพ์รายงาน</span>
           </button>
        </div>
      </div>

      {/* Filter - Hidden on Print */}
      <div className="max-w-6xl mx-auto mb-10 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 print:hidden">
         <div className="flex flex-col md:flex-row items-end gap-6">
            <div className="flex-1 space-y-3">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">วันที่เริ่มต้น</label>
               <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="date" 
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-100 transition-all"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
               </div>
            </div>
            <div className="flex-1 space-y-3">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">วันที่สิ้นสุด</label>
               <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="date" 
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-100 transition-all"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
               </div>
            </div>
            <button 
              onClick={loadReport}
              className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all"
            >
              ค้นหาข้อมูล
            </button>
         </div>
      </div>

      {/* Report Content */}
      <div className="max-w-6xl mx-auto bg-white p-12 md:p-20 rounded-[3rem] shadow-2xl border border-slate-50 print:shadow-none print:border-none print:p-0 formal-report">
        {/* Report Letterhead */}
        <div className="text-center mb-10 space-y-2">
           <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">{shopConfig?.name || 'SHOP PP'}</h2>
           <div className="h-1 w-20 bg-slate-900 mx-auto"></div>
           <p className="text-slate-700 font-bold uppercase tracking-widest text-lg mt-4">รายงานสรุปยอดขายแยกตามรายการสินค้า</p>
           <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mt-2">Official Sales Report Document</p>
           <p className="text-slate-600 text-sm font-medium mt-6">
              ระยะเวลา: {startDate ? new Date(startDate).toLocaleDateString('th-TH') : 'เริ่มต้น'} - {endDate ? new Date(endDate).toLocaleDateString('th-TH') : 'ปัจจุบัน'}
           </p>
           <p className="text-slate-400 text-[10px] uppercase tracking-widest">พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p>
        </div>

        {/* Summary Boxes */}
        <div className="grid grid-cols-3 gap-6 mb-10">
           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">จำนวนที่ขายได้รวม</p>
              <p className="text-xl font-bold text-slate-800 tracking-tight">{totalQty.toLocaleString()} <span className="text-xs font-normal">ชิ้น</span></p>
           </div>
           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ยอดขายรวมสุทธิ</p>
              <p className="text-xl font-bold text-slate-900 tracking-tight">{totalRevenue.toLocaleString()} <span className="text-xs font-normal">฿</span></p>
           </div>
           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">กำไรเบื้องต้นรวม</p>
              <p className="text-xl font-bold text-slate-900 tracking-tight">{totalProfit.toLocaleString()} <span className="text-xs font-normal">฿</span></p>
           </div>
        </div>

        {/* Report Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
           <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-900 border-b border-slate-900">
                 <tr>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">ลำดับ</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">ชื่อสินค้า / บาร์โค้ด</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">ราคาต่อหน่วย</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">จำนวนที่ขาย</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-right">ยอดขายรวม</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-right">กำไรสุทธิ</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                 {reportData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                       <td className="px-4 py-3 text-sm font-medium text-slate-500">{idx + 1}</td>
                       <td className="px-4 py-3">
                          <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                          <p className="text-[10px] font-medium text-slate-400">{item.barcode}</p>
                       </td>
                       <td className="px-4 py-3 text-center text-sm font-medium text-slate-700">{item.unitPrice.toLocaleString()} ฿</td>
                       <td className="px-4 py-3 text-center text-sm font-bold text-slate-800">{item.quantity.toLocaleString()}</td>
                       <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{item.revenue.toLocaleString()} ฿</td>
                       <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{item.profit.toLocaleString()} ฿</td>
                    </tr>
                 ))}
                 {reportData.length === 0 && (
                    <tr>
                       <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium italic text-sm">ไม่พบข้อมูลการขายในช่วงเวลาที่กำหนด</td>
                    </tr>
                 )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-900">
                 <tr>
                    <td colSpan={3} className="px-4 py-4 text-right uppercase tracking-wider text-[10px] text-slate-500">ยอดรวมทั้งสิ้น</td>
                    <td className="px-4 py-4 text-center text-sm text-slate-900">{totalQty.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right text-sm text-slate-900">{totalRevenue.toLocaleString()} ฿</td>
                    <td className="px-4 py-4 text-right text-sm text-slate-900">{totalProfit.toLocaleString()} ฿</td>
                 </tr>
              </tfoot>
           </table>
        </div>

        {/* Footer for Print */}
        <div className="mt-20 hidden print:flex justify-between items-end border-t border-dashed border-slate-200 pt-8">
           <div className="text-center space-y-8 w-56">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ผู้ออกรายงาน</p>
              <div className="border-b border-slate-900 w-full"></div>
              <p className="text-sm font-bold text-slate-800">{user?.displayName || user?.email}</p>
           </div>
           <div className="text-center space-y-8 w-56">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ผู้อนุมัติ</p>
              <div className="border-b border-slate-900 w-full"></div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">( ........................................ )</p>
           </div>
        </div>
      </div>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap');
        
        .formal-report {
          font-family: 'Sarabun', sans-serif !important;
          font-size: 16px; /* Standard size for Thai documents */
          line-height: 1.5;
        }

        @media print {
          body {
            background: white !important;
          }
          .formal-report {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            margin: 1.5cm;
            size: A4;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
