import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Palette,
  Megaphone,
  Settings,
  ShieldAlert,
  LogOut,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useTheme } from '../context/ThemeContext';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminUsersView } from './views/AdminUsersView';
import { AdminProductsView } from './views/AdminProductsView';
import { AdminWithdrawalsView } from './views/AdminWithdrawalsView';
import { AdminRechargesView } from './views/AdminRechargesView';
import { AdminThemeManagerView } from './views/AdminThemeManagerView';
import { AdminAdManagerView } from './views/AdminAdManagerView';
import { AdminSettingsView } from './views/AdminSettingsView';
import { AdminAuditLogsView } from './views/AdminAuditLogsView';

interface AdminLayoutProps {
  onExitToPublic: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onExitToPublic }) => {
  const { admin, logoutAdmin, hasRole } = useAdmin();
  const { activeTheme } = useTheme();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'finance_admin', 'content_admin'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['super_admin', 'admin'] },
    { id: 'products', label: 'Products & Nodes', icon: Package, roles: ['super_admin', 'admin', 'content_admin'] },
    { id: 'recharge', label: 'Verified Recharges', icon: ArrowUpRight, roles: ['super_admin', 'finance_admin'] },
    { id: 'withdrawals', label: 'Withdrawal Payouts', icon: ArrowDownRight, roles: ['super_admin', 'finance_admin'] },
    { id: 'theme', label: 'Theme & Appearance', icon: Palette, roles: ['super_admin', 'admin'] },
    { id: 'ads', label: 'Advertisement Manager', icon: Megaphone, roles: ['super_admin', 'content_admin'] },
    { id: 'settings', label: 'Website Settings', icon: Settings, roles: ['super_admin'] },
    { id: 'auditLogs', label: 'Security Audit Logs', icon: ShieldAlert, roles: ['super_admin'] },
  ];

  const visibleNav = navItems.filter(item => hasRole(item.roles as any));

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboardView onNavigate={setCurrentView} />;
      case 'users':
        return <AdminUsersView />;
      case 'products':
        return <AdminProductsView />;
      case 'withdrawals':
        return <AdminWithdrawalsView />;
      case 'recharge':
        return <AdminRechargesView />;
      case 'theme':
        return <AdminThemeManagerView />;
      case 'ads':
        return <AdminAdManagerView />;
      case 'settings':
        return <AdminSettingsView />;
      case 'auditLogs':
        return <AdminAuditLogsView />;
      default:
        return <AdminDashboardView onNavigate={setCurrentView} />;
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 font-bold border border-purple-700/60 text-[10px]">👑 SUPER ADMIN</span>;
      case 'finance_admin':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700/60 text-[10px]">💳 FINANCE ADMIN</span>;
      case 'content_admin':
        return <span className="px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 font-bold border border-indigo-700/60 text-[10px]">🎨 CONTENT ADMIN</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 font-bold border border-cyan-700/60 text-[10px]">🛠 OPERATIONS ADMIN</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* 1. Left Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div className="p-4 sm:p-5">
          {/* Admin Wordmark Header */}
          <div className="flex items-center gap-2.5 pb-5 border-b border-slate-800">
            {activeTheme.logoUrl ? (
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 shadow-md">
                <img
                  src={activeTheme.logoUrl}
                  alt={activeTheme.websiteName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shadow-md shrink-0">
                {(activeTheme.logoText || activeTheme.websiteName || 'NX').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="font-bold text-sm tracking-tight text-white block truncate">
                {activeTheme.websiteName || 'NEXUS CONTROL'}
              </span>
              <span className="text-[10px] font-mono text-purple-400">Admin Console</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 space-y-1">
            {visibleNav.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/40">
          <button
            onClick={onExitToPublic}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" /> Return to Website
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </button>

          <button
            onClick={logoutAdmin}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-red-900/60 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out Admin
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Section:</span>
            <span className="text-xs font-bold text-white capitalize">{currentView}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-white block">{admin?.fullName}</span>
              <span className="text-[10px] text-slate-400 font-mono">{admin?.email}</span>
            </div>
            {getRoleBadge(admin?.role)}
          </div>
        </header>

        {/* Dynamic View Body */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};
