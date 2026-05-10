'use client';

import { useEffect, useState } from 'react';
import { fetchUsers, updateUserRole, deleteUser, createUserAccount, updateUser } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  Trash2, 
  Mail, 
  Calendar,
  X,
  User as UserIcon,
  MoreVertical,
  ChevronRight,
  ShieldAlert,
  Edit,
  Key
} from 'lucide-react';

export default function StaffPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF'
  });

  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    password: '',
    role: 'STAFF'
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleRole = async (user: any) => {
    const newRole = user.role === 'ADMIN' ? 'STAFF' : 'ADMIN';
    if (!confirm(`คุณต้องการเปลี่ยนสิทธิ์ของ ${user.name} เป็น ${newRole} ใช่หรือไม่?`)) return;

    try {
      await updateUserRole(user.id, newRole);
      loadUsers();
    } catch (err: any) {
      alert(`ไม่สามารถเปลี่ยนสิทธิ์ได้: ${err.message}`);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ ${user.name}? (การดำเนินการนี้จะลบเฉพาะข้อมูลในระบบ ไม่ได้ลบ Account Firebase)`)) return;

    try {
      await deleteUser(user.id);
      loadUsers();
    } catch (err: any) {
      alert(`ไม่สามารถลบผู้ใช้ได้: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserAccount(formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'STAFF' });
      loadUsers();
    } catch (err: any) {
      alert(`ไม่สามารถสร้างบัญชีได้: ${err.message}`);
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      password: '',
      role: user.role
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const data: any = {
        name: editFormData.name,
        role: editFormData.role
      };
      if (editFormData.password) {
        data.password = editFormData.password;
      }
      await updateUser(editingUser.id, data);
      setIsEditModalOpen(false);
      loadUsers();
    } catch (err: any) {
      alert(`ไม่สามารถอัปเดตข้อมูลได้: ${err.message}`);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">จัดการเจ้าหน้าที่</h1>
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">บริหารจัดการผู้ใช้งานและสิทธิ์การเข้าถึงระบบ</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all transform active:scale-95"
        >
          <UserPlus size={20} />
          <span>เพิ่มเจ้าหน้าที่ใหม่</span>
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ค้นหาตามชื่อ หรือ อีเมล..." 
              className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-indigo-100 outline-none transition-all text-sm font-medium shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
             <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest">
                เจ้าหน้าที่ทั้งหมด {filteredUsers.length} คน
             </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ข้อมูลเจ้าหน้าที่</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Username / Email</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">สิทธิ์การใช้งาน</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">วันที่เข้าร่วม</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">กำลังโหลดข้อมูล...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 ${u.role === 'ADMIN' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'} rounded-2xl flex items-center justify-center font-black group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/10`}>
                          {u.role === 'ADMIN' ? <ShieldCheck size={24} /> : <UserIcon size={24} />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-lg tracking-tight leading-tight">{u.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Employee ID: {u.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{u.username || u.email?.split('@')[0]}</span>
                        <div className="flex items-center space-x-1 mt-1">
                           <Mail size={10} className="text-slate-300" />
                           <span className="text-[10px] font-bold text-slate-400 italic">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {u.role === 'ADMIN' ? <Shield size={12} /> : <UserIcon size={12} />}
                        <span>{u.role}</span>
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2 text-slate-400 font-bold text-xs">
                        <Calendar size={14} className="text-slate-300" />
                        <span>{new Date(u.createdAt).toLocaleDateString('th-TH')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u)}
                          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-rose-100"
                          title="ลบผู้ใช้งาน"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                            <UsersIcon size={40} />
                         </div>
                         <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">ไม่พบข้อมูลพนักงานที่ค้นหา</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl overflow-hidden border-8 border-white animate-in zoom-in slide-in-from-bottom-10 duration-500">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black tracking-tighter">เพิ่มเจ้าหน้าที่ใหม่</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Employee Registration</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">ชื่อ-นามสกุล</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={18} />
                    <input
                      type="text"
                      required
                      placeholder="ระบุชื่อ-นามสกุล..."
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-4 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all font-black text-lg text-slate-800 shadow-inner"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">อีเมล (Email)</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={18} />
                    <input
                      type="email"
                      required
                      placeholder="example@shoppp.com"
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-4 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all font-bold text-slate-800 shadow-inner"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">รหัสผ่าน (Password)</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={18} />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-4 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all font-black text-lg text-slate-800 shadow-inner tracking-widest"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 ml-2 italic">ความยาวอย่างน้อย 6 ตัวอักษร</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">บทบาท (Role)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'STAFF' })}
                      className={`py-4 rounded-2xl border-4 font-black transition-all ${formData.role === 'STAFF' ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-inner' : 'bg-slate-50 border-transparent text-slate-400'}`}
                    >
                      STAFF (เจ้าหน้าที่)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                      className={`py-4 rounded-2xl border-4 font-black transition-all ${formData.role === 'ADMIN' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-inner' : 'bg-slate-50 border-transparent text-slate-400'}`}
                    >
                      ADMIN (ผู้ดูแล)
                    </button>
                  </div>
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
                  สร้างบัญชีเจ้าหน้าที่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl overflow-hidden border-8 border-white animate-in zoom-in slide-in-from-bottom-10 duration-500">
            <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black tracking-tighter">แก้ไขข้อมูลเจ้าหน้าที่</h2>
                <p className="text-indigo-200 font-bold uppercase tracking-widest text-[10px] mt-1">Update Employee Information</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">ชื่อ-นามสกุล</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={18} />
                    <input
                      type="text"
                      required
                      placeholder="ระบุชื่อ-นามสกุล..."
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-4 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all font-black text-lg text-slate-800 shadow-inner"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">เปลี่ยนรหัสผ่าน (ใหม่)</label>
                  <div className="relative group">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={18} />
                    <input
                      type="password"
                      placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน"
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-4 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all font-black text-lg text-slate-800 shadow-inner tracking-widest"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 ml-2 italic">ปล่อยว่างไว้หากต้องการใช้รหัสผ่านเดิม</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-2">บทบาท (Role)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, role: 'STAFF' })}
                      className={`py-4 rounded-2xl border-4 font-black transition-all ${editFormData.role === 'STAFF' ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-inner' : 'bg-slate-50 border-transparent text-slate-400'}`}
                    >
                      STAFF (เจ้าหน้าที่)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, role: 'ADMIN' })}
                      className={`py-4 rounded-2xl border-4 font-black transition-all ${editFormData.role === 'ADMIN' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-inner' : 'bg-slate-50 border-transparent text-slate-400'}`}
                    >
                      ADMIN (ผู้ดูแล)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-6 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-6 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-3xl font-black text-sm uppercase tracking-widest transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-lg uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all transform active:scale-95"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
