'use client';

import { useEffect, useState } from 'react';
import { 
  fetchCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  LayoutGrid, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Tag,
  Box,
  X,
  ChevronRight,
  Package,
  AlertCircle
} from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Category Form State
  const [catName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: any) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: catName });
      } else {
        await createCategory({ name: catName });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`ไม่สามารถจัดการหมวดหมู่ได้: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? (ต้องไม่มีสินค้าในหมวดหมู่นี้เหลืออยู่)')) return;
    
    try {
      await deleteCategory(id);
      loadData();
    } catch (err: any) {
      alert(`ไม่สามารถลบหมวดหมู่ได้: ${err.message}`);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">จัดการหมวดหมู่สินค้า</h1>
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">จัดระเบียบสินค้าของคุณด้วยหมวดหมู่ที่เหมาะสม</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all transform active:scale-95"
        >
          <Plus size={20} />
          <span>เพิ่มหมวดหมู่ใหม่</span>
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ค้นหาตามชื่อหมวดหมู่..." 
              className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-indigo-100 outline-none transition-all text-sm font-medium shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
             <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest">
                ทั้งหมด {filteredCategories.length} รายการ
             </div>
          </div>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full py-20 text-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">กำลังโหลดข้อมูล...</p>
             </div>
          ) : filteredCategories.length > 0 ? (
            filteredCategories.map((c) => (
              <div key={c.id} className="group bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => handleOpenEditModal(c)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">{c.name}</h3>
                  <div className="flex items-center space-x-2">
                    <Package size={14} className="text-slate-300" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {c._count?.products || 0} สินค้าในหมวดหมู่
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 mb-4">
                  <Tag size={40} />
               </div>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">ไม่พบรายการหมวดหมู่</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl overflow-hidden border-8 border-white animate-in zoom-in slide-in-from-bottom-10 duration-500">
            <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black tracking-tighter">{editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</h2>
                <p className="text-indigo-200 font-bold uppercase tracking-widest text-[10px] mt-1">Category Details</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">ชื่อหมวดหมู่</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="ระบุชื่อหมวดหมู่..."
                  className="w-full px-6 py-4 bg-slate-50 border-4 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all font-black text-lg text-slate-800 shadow-inner"
                  value={catName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </div>

              <div className="flex space-x-6 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-6 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-3xl font-black text-sm uppercase tracking-widest transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-lg uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all transform active:scale-95"
                >
                  {editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
