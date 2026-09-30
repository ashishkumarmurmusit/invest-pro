import React, { createContext, useContext, useEffect, useState } from 'react';
import { BankAccount, User } from '../types';
import { apiRequest, getUserToken, setUserToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  reloadProfile: () => Promise<void>;
  updateBank: (data: { accountHolderName?: string; accountNumber?: string; ifscCode?: string; bankName?: string; upiId?: string }) => Promise<BankAccount>;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const reloadProfile = async () => {
    const token = getUserToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      if (data && data.user) {
        setUser(data.user);
      }
    } catch {
      setUserToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isLoggedOut = localStorage.getItem('nexus_user_logged_out') === 'true';
    if (!getUserToken() && !isLoggedOut) {
      setUserToken('demo-token-alex-123');
    }
    reloadProfile();
  }, []);

  const login = async (identifier: string, password: string) => {
    localStorage.removeItem('nexus_user_logged_out');
    const data = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setUserToken(data.token);
    setUser(data.user);
    sessionStorage.setItem('just_logged_in', 'true');
    setIsAuthModalOpen(false);
  };

  const register = async (payload: any) => {
    localStorage.removeItem('nexus_user_logged_out');
    const data = await apiRequest<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setUserToken(data.token);
    setUser(data.user);
    sessionStorage.setItem('just_logged_in', 'true');
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.setItem('nexus_user_logged_out', 'true');
    sessionStorage.removeItem('just_logged_in');
    setUserToken(null);
    setUser(null);
  };

  const updateBank = async (data: { accountHolderName?: string; accountNumber?: string; ifscCode?: string; bankName?: string; upiId?: string }) => {
    const res = await apiRequest<{ bankAccount: BankAccount }>('/wallet/bank', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.bankAccount && user) {
      setUser({ ...user, bankAccount: res.bankAccount });
    }
    return res.bankAccount;
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        reloadProfile,
        updateBank,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
