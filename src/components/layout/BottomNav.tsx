import React from 'react';
import { Home, Layers, ShoppingBag, CalendarCheck, Users, User as UserIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { NavTab } from '../../types';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { activeTheme } = useTheme();

  const tabs: Array<{ id: NavTab; label: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'investments', label: 'Investment', icon: Layers },
    { id: 'store', label: 'Store', icon: ShoppingBag },
    { id: 'checkin', label: 'Check-in', icon: CalendarCheck },
    { id: 'team', label: 'Refer & Earn', icon: Users },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg transition-colors pb-safe shadow-lg"
      style={{
        backgroundColor: `${activeTheme.bottomNavColor}FA`,
        borderColor: activeTheme.mode === 'dark' ? '#1E293B' : '#E2E8F0',
      }}
    >
      <div className="max-w-3xl mx-auto grid grid-cols-6 items-center h-16 px-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="flex flex-col items-center justify-center h-full w-full min-h-[44px] transition-transform active:scale-95 focus:outline-none"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'scale-110' : 'text-slate-400 dark:text-slate-500'
                  }`}
                  style={{
                    color: isActive ? activeTheme.primaryColor : undefined,
                  }}
                />
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: activeTheme.primaryColor }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
                  isActive ? 'font-bold' : 'text-slate-500 dark:text-slate-400'
                }`}
                style={{
                  color: isActive ? activeTheme.primaryColor : undefined,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
