'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  fetchProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  fetchCategories
} from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  MoreVertical, 
  AlertTriangle, 
  CheckCircle2, 
  Barcode,
  ArrowUpDown,
  X,
  Zap,
  Tag,
  Box,
  ChevronRight,
  LayoutGrid,
  Settings2
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Product Form State
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: '',
    costPrice: '',
    stockQty: '',
    lowStockThreshold: '5',
    categoryId: '',
    isShortcut: false
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()]);
      setProducts(prods);
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
    setEditingProduct(null);
    setFormData({ 
      name: '', 
      barcode: '', 
      price: '', 
      costPrice: '',
      stockQty: '', 
      lowStockThreshold: '5', 
      categoryId: '',
      isShortcut: false 
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      price: product.price.toString(),
      costPrice: (product.costPrice || '').toString(),
      stockQty: product.stockQty.toString(),
      lowStockThreshold: (product.lowStockThreshold || 5).toString(),
      categoryId: product.categoryId || '',
      isShortcut: product.isShortcut || false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?')) return;
    
    try {
      await deleteProduct(id);
      loadData();
    } catch (err: any) {
      alert(`ไม่สามารถลบสินค้าได้: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const priceNum = parseFloat(formData.price);
    const costPriceNum = formData.costPrice ? parseFloat(formData.costPrice) : null;
    const qtyNum = parseInt(formData.stockQty);
    const thresholdNum = parseInt(formData.lowStockThreshold);
    
    if (isNaN(priceNum) || isNaN(qtyNum) || isNaN(thresholdNum)) {
      alert('กรุณากรอกราคาและจำนวนเป็นตัวเลข');
      return;
    }

    try {
      const payload = {
        ...formData,
        price: priceNum,
        costPrice: costPriceNum,
        stockQty: qtyNum,
        lowStockThreshold: thresholdNum,
        categoryId: formData.categoryId || null
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`ไม่สามารถ${editingProduct ? 'แก้ไข' : 'เพิ่ม'}สินค้าได้: ${err.message}`);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  );

  return (
    <DashboardLayout>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">จัดการสินค้า</h1>
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">บริหารจัดการสต็อกและรายการสินค้าทั้งหมดในระบบ</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard/categories"
            className="flex items-center justify-center space-x-3 px-6 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all transform active:scale-95"
          >
            <LayoutGrid size={20} />
            <span>จัดการหมวดหมู่</span>
          </Link>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all transform active:scale-95"
          >
            <Plus size={20} />
            <span>เพิ่มสินค้าใหม่</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ค้นหาตามชื่อ หรือ บาร์โค้ด..." 
              className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-indigo-100 outline-none transition-all text-sm font-medium shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
             <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest">
                ทั้งหมด {filteredProducts.length} รายการ
             </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ข้อมูลสินค้า</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">หมวดหมู่</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ราคา (ต้นทุน/ขาย)</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">สต็อกปัจจุบัน</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">สถานะ</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">กำลังโหลดสินค้า...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isLowStock = p.stockQty <= (p.lowStockThreshold || 5);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 ${isLowStock ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-600'} rounded-2xl flex items-center justify-center font-black group-hover:scale-110 transition-transform shadow-sm`}>
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-lg tracking-tight leading-tight">{p.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                               <Barcode size={12} className="text-slate-300" />
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.barcode || 'ไม่มีบาร์โค้ด'}</span>
                               {p.isShortcut && <Zap size={10} className="text-amber-500 fill-amber-500 ml-1" />}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-2">
                           <Tag size={12} className="text-indigo-400" />
                           <span className="text-xs font-bold text-slate-600">{p.category?.name || 'ทั่วไป'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-sm font-black text-slate-800 tracking-tight">{p.price.toLocaleString()} ฿</span>
                           <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ทุน: {p.costPrice || 0} ฿</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-3">
                           <div className={`px-4 py-2 rounded-xl text-sm font-black tracking-tight shadow-sm ${isLowStock ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-800 border border-slate-100'}`}>
                             {p.stockQty}
                           </div>
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">PCS</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {isLowStock ? (
                          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full border border-rose-100 shadow-sm animate-pulse">
                            <AlertTriangle size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">สต็อกต่ำ</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
                            <CheckCircle2 size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">ปกติ</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleOpenEditModal(p)}
                            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)}
                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-rose-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                   <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                            <Box size={40} />
                         </div>
                         <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">ไม่พบรายการสินค้าที่ค้นหา</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl overflow-hidden border-8 border-white animate-in zoom-in slide-in-from-bottom-10 duration-500">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black tracking-tighter">{editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Product Details</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">ชื่อสินค้า</label>
                  <input
                    type="text"
                    required
                    placeholder="ระบุชื่อสินค้า..."
                    className="w-full px-6 py-4 bg-slate-50 border-4 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all font-black text-lg text-slate-800 shadow-inner"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">รหัสบาร์โค้ด</label>
                    <div className="relative group">
                       <Barcode className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={18} />
                       <input
                        type="text"
                        placeholder="Scan..."
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-4 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all font-bold text-slate-800 shadow-inner"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">หมวดหมู่</label>
                    <select
                      className="w-full px-6 py-4 bg-slate-50 border-4 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all font-bold text-slate-800 shadow-inner appearance-none cursor-pointer"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      <option value="">ไม่มีหมวดหมู่</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">ราคาต้นทุน (฿)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-6 py-4 bg-slate-50 border-4 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all font-black text-slate-800 shadow-inner"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">ราคาขาย (฿)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      className="w-full px-6 py-4 bg-slate-50 border-4 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all font-black text-2xl text-indigo-600 shadow-inner"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">จำนวนคงเหลือ</label>
                    <input
                      type="number"
                      required
                      className="w-full px-6 py-4 bg-slate-50 border-4 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all font-black text-slate-800 shadow-inner"
                      value={formData.stockQty}
                      onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">แจ้งเตือนสต็อกต่ำ</label>
                    <input
                      type="number"
                      required
                      className="w-full px-6 py-4 bg-slate-50 border-4 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all font-black text-rose-500 shadow-inner"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 shadow-inner group/check">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      id="isShortcut"
                      className="w-8 h-8 rounded-xl border-4 border-slate-200 text-indigo-600 focus:ring-indigo-500 appearance-none cursor-pointer checked:bg-indigo-600 checked:border-indigo-600 transition-all"
                      checked={formData.isShortcut}
                      onChange={(e) => setFormData({ ...formData, isShortcut: e.target.checked })}
                    />
                    {formData.isShortcut && <CheckCircle2 className="absolute text-white pointer-events-none" size={18} />}
                  </div>
                  <label htmlFor="isShortcut" className="text-sm font-black text-slate-600 cursor-pointer uppercase tracking-tight group-hover/check:text-indigo-600 transition-colors">แสดงเป็นสินค้าปุ่มลัดในหน้า POS</label>
                </div>
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
                  {editingProduct ? 'บันทึกการแก้ไข' : 'บันทึกสินค้า'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
