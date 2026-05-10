'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Zap, LayoutDashboard, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full -mr-64 -mt-64 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full -ml-48 -mb-48 blur-3xl animate-pulse"></div>

      <div className="max-w-xl w-full bg-white rounded-[4rem] shadow-[0_32px_128px_-24px_rgba(0,0,0,0.5)] p-12 lg:p-16 relative z-10 border-8 border-white/10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-indigo-500/40 transform -rotate-6 group hover:rotate-0 transition-transform duration-500">
            <LayoutDashboard size={48} />
          </div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">ShopPP <span className="text-indigo-600">POS</span></h1>
          <p className="text-slate-400 font-bold mt-4 uppercase tracking-[0.3em] text-xs">ระบบจัดการร้านค้าสวัสดิการ</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-5 rounded-3xl text-sm mb-10 border-4 border-rose-100/50 flex items-center justify-center space-x-3 font-black uppercase tracking-tight animate-shake">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-10">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={24} />
              <input
                type="email"
                required
                className="w-full pl-16 pr-8 py-6 bg-slate-50 rounded-[2.5rem] border-4 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all text-xl font-black text-slate-800 shadow-inner"
                placeholder="admin@shoppp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Security Password</label>
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={24} />
              <input
                type="password"
                required
                className="w-full pl-16 pr-8 py-6 bg-slate-50 rounded-[2.5rem] border-4 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all text-xl font-black text-slate-800 shadow-inner tracking-[0.5em]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-[2.5rem] font-black text-2xl uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center space-x-4"
          >
            {loading ? (
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>เข้าสู่ระบบ</span>
                <Zap size={24} fill="currentColor" />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-16 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">© 2026 ShopPP School Management v1.0</p>
        </div>
      </div>

      <style jsx global>{`
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
