'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { fetchShopConfig, updateShopConfig } from '@/lib/api';
import { Store, Save, Building2, Phone, MapPin, Globe, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    name: '',
    address: '',
    phone: '',
    logo: ''
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await fetchShopConfig();
      setConfig(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateShopConfig(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">กำลังโหลดการตั้งค่า...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-slate-800">ตั้งค่าร้านค้า</h1>
        <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">จัดการข้อมูลพื้นฐานของร้านเพื่อใช้ในระบบและใบเสร็จ</p>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleSave} className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50 overflow-hidden">
          <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Store size={24} />
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-800 tracking-tight">ข้อมูลทั่วไปของร้าน</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Shop Information Details</p>
              </div>
            </div>
            {success && (
              <div className="flex items-center space-x-2 text-emerald-500 animate-in fade-in slide-in-from-right-4">
                <CheckCircle2 size={20} />
                <span className="font-black text-xs uppercase tracking-widest">บันทึกสำเร็จ</span>
              </div>
            )}
          </div>

          <div className="p-12 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  <Building2 size={14} className="mr-2 text-indigo-500" /> ชื่อร้านค้า (Shop Name)
                </label>
                <input 
                  type="text"
                  required
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none font-black text-slate-800 transition-all shadow-inner"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="เช่น ShopPP POS"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  <Phone size={14} className="mr-2 text-indigo-500" /> เบอร์โทรศัพท์ (Phone Number)
                </label>
                <input 
                  type="text"
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none font-black text-slate-800 transition-all shadow-inner"
                  value={config.phone || ''}
                  onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  placeholder="เช่น 02-xxx-xxxx"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                <MapPin size={14} className="mr-2 text-indigo-500" /> ที่อยู่ร้านค้า (Shop Address)
              </label>
              <textarea 
                rows={3}
                className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none font-black text-slate-800 transition-all shadow-inner resize-none"
                value={config.address || ''}
                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                placeholder="ระบุที่อยู่ของร้าน..."
              />
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                disabled={saving}
                className="w-full md:w-auto px-12 py-6 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] transition-all transform active:scale-95 flex items-center justify-center space-x-4 shadow-2xl shadow-slate-200"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save size={20} />
                    <span>บันทึกข้อมูลการตั้งค่า</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-10 p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100 flex items-start space-x-6">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
            <Globe size={28} />
          </div>
          <div>
            <h4 className="font-black text-indigo-900 text-sm uppercase tracking-tight mb-2">ข้อมูลนี้จะถูกนำไปใช้อย่างไร?</h4>
            <p className="text-indigo-600/70 text-xs font-bold leading-relaxed">
              ชื่อร้านและที่อยู่จะปรากฏที่ส่วนหัวของใบเสร็จ (Receipt) และใบนำเข้าสินค้า (Restock Bill) เพื่อให้เอกสารดูเป็นทางการและน่าเชื่อถือมากขึ้น ข้อมูลนี้จะถูกแชร์ให้พนักงานทุกคนในระบบเห็นในรูปแบบเดียวกัน
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
