import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminRole, AdminUser } from '../types';
import { apiRequest, getAdminToken, setAdminToken } from '../services/api';

interface AdminContextType {
  admin: AdminUser | null;
  loading: boolean;
  isAdminAuthenticated: boolean;
  loginAdmin: (username: string, password: string, twoFactorCode?: string) => Promise<void>;
  logoutAdmin: () => void;
  reloadAdminProfile: () => Promise<void>;
  hasRole: (roles: AdminRole[]) => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdminSession = async () => {
    const token = getAdminToken();
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest<{ admin: AdminUser }>('/admin/me', {}, true);
      if (data && data.admin) {
        setAdmin(data.admin);
      }
    } catch {
      setAdminToken(null);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminSession();
  }, []);

  const loginAdmin = async (username: string, password: string, twoFactorCode?: string) => {
    const data = await apiRequest<{ token: string; admin: AdminUser }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, twoFactorCode }),
    }, true);
    setAdminToken(data.token);
    setAdmin(data.admin);
  };

  const logoutAdmin = async () => {
    try {
      await apiRequest('/admin/logout', { method: 'POST' }, true);
    } catch {
      // ignore
    }
    setAdminToken(null);
    setAdmin(null);
  };

  const hasRole = (roles: AdminRole[]): boolean => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    return roles.includes(admin.role);
  };

  return (
    <AdminContext.Provider
      value={{
        admin,
        loading,
        isAdminAuthenticated: !!admin,
        loginAdmin,
        logoutAdmin,
        reloadAdminProfile: checkAdminSession,
        hasRole,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
}
