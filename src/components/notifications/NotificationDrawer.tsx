import React from 'react';
import { X, CheckCheck, Bell, Wallet, ArrowDownRight, Users, CalendarCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { NotificationItem } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../services/api';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onRefresh: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh,
}) => {
  const { activeTheme } = useTheme();

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      onRefresh();
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/read/${id}`, { method: 'POST' });
      onRefresh();
    } catch {
      // ignore
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'recharge':
        return <Wallet className="w-4 h-4 text-emerald-500" />;
      case 'withdrawal':
        return <ArrowDownRight className="w-4 h-4 text-amber-500" />;
      case 'referral':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'checkin':
        return <CalendarCheck className="w-4 h-4 text-indigo-500" />;
      case 'order':
        return <Sparkles className="w-4 h-4 text-cyan-500" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm h-full shadow-2xl flex flex-col border-l transition-all"
        style={{
          backgroundColor: activeTheme.cardColor,
          borderColor: activeTheme.mode === 'dark' ? '#334155' : '#E2E8F0',
        }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No notifications yet.
            </div>
          ) : (
            notifications.map(item => (
              <div
                key={item.id}
                onClick={() => !item.isRead && handleMarkRead(item.id)}
                className={`pt-2.5 first:pt-0 cursor-pointer group transition-colors rounded-xl p-2.5 ${
                  !item.isRead ? 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                      {new Date(item.createdAt).toLocaleDateString()} ·{' '}
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
