import React from 'react';
import { Bell, UserCircle, ShieldCheck, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NavTab } from '../../types';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNotifications: () => void;
  onOpenRecharge: () => void;
  unreadNotifsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNotifications,
  onOpenRecharge,
  unreadNotifsCount,
}) => {
  const { user, openAuthModal } = useAuth();
  const { activeTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-30 w-full border-b transition-colors backdrop-blur-md"
      style={{
        backgroundColor: `${activeTheme.headerColor}F2`,
        borderColor: activeTheme.mode === 'dark' ? '#1E293B' : '#E2E8F0',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none"
        >
          {activeTheme.logoUrl ? (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 shadow-sm shrink-0 border border-slate-200 dark:border-slate-700">
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
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm transition-transform group-hover:scale-105 shrink-0"
              style={{ backgroundColor: activeTheme.primaryColor }}
            >
              {(activeTheme.logoText || activeTheme.websiteName || 'NX').slice(0, 2).toUpperCase()}
            </div>
          )}
          <span
            className="navbar-brand-title font-bold tracking-tight text-base sm:text-lg"
            style={{ color: activeTheme.textColor }}
          >
            {activeTheme.websiteName}
          </span>
        </button>

        {/* Zone 2: Primary Actions at the top: Official Telegram, Recharge and Notification */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Official Telegram Link (Compact) */}
          <a
            href="https://t.me/investpro_india"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200/80 dark:border-sky-800 text-[10px] sm:text-[11px] font-bold transition-all shadow-2xs"
            title="Official Telegram Channel & 24/7 Support"
          >
            <Send className="w-3 h-3 text-sky-500" />
            <span className="hidden sm:inline">Official Telegram</span>
            <span className="sm:hidden font-mono text-[10px]">TG</span>
          </a>

          {user ? (
            <>
              {/* Notification icon */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="text-xs font-semibold px-3 py-2 text-slate-700 dark:text-slate-200 hover:text-slate-900"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="text-xs font-semibold px-4 py-2 rounded-lg text-white shadow-sm hover:opacity-95 transition-opacity"
                style={{ backgroundColor: activeTheme.primaryColor }}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
