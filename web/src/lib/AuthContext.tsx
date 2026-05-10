'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout to prevent black screen if Firebase hangs
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Firebase Auth initialization timed out');
        setLoading(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      setUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [loading]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading ? (
        <div className="h-screen flex items-center justify-center bg-slate-900">
           <div className="flex flex-col items-center space-y-6">
              <div className="w-20 h-20 border-8 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_50px_rgba(79,70,229,0.3)]"></div>
              <p className="text-indigo-300 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Initializing ShopPP Secure Auth...</p>
           </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
