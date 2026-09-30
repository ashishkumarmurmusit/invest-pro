import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeConfig } from '../types';
import { apiRequest } from '../services/api';

const DEFAULT_THEME: ThemeConfig = {
  preset: 'blue',
  primaryColor: '#2563EB',
  secondaryColor: '#1D4ED8',
  backgroundColor: '#F8FAFC',
  textColor: '#0F172A',
  buttonColor: '#2563EB',
  cardColor: '#FFFFFF',
  headerColor: '#FFFFFF',
  sidebarColor: '#0F172A',
  bottomNavColor: '#FFFFFF',
  borderRadius: '16px',
  mode: 'light',
  websiteName: 'Nexus Global',
  logoText: 'NEXUS',
  logoUrl: '',
  tagline: 'Smart Digital Assets & High-Yield Node Investments',
};

interface ThemeContextType {
  theme: ThemeConfig;
  previewTheme: ThemeConfig | null;
  setPreviewTheme: (t: ThemeConfig | null) => void;
  activeTheme: ThemeConfig;
  refreshTheme: () => Promise<void>;
  updateThemeOnServer: (themeData: Partial<ThemeConfig>) => Promise<void>;
  resetThemeOnServer: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [previewTheme, setPreviewTheme] = useState<ThemeConfig | null>(null);

  const activeTheme = previewTheme || theme;

  const refreshTheme = async () => {
    try {
      const data = await apiRequest<{ theme: ThemeConfig; settings: any }>('/theme');
      if (data && data.theme) {
        setTheme(data.theme);
      }
    } catch {
      // fallback to default
    }
  };

  useEffect(() => {
    refreshTheme();
  }, []);

  // Apply CSS variables to root document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', activeTheme.primaryColor);
    root.style.setProperty('--color-secondary', activeTheme.secondaryColor);
    root.style.setProperty('--color-bg-app', activeTheme.backgroundColor);
    root.style.setProperty('--color-text-main', activeTheme.textColor);
    root.style.setProperty('--color-btn-main', activeTheme.buttonColor);
    root.style.setProperty('--color-card-bg', activeTheme.cardColor);
    root.style.setProperty('--color-header-bg', activeTheme.headerColor);
    root.style.setProperty('--color-sidebar-bg', activeTheme.sidebarColor);
    root.style.setProperty('--color-bottomnav-bg', activeTheme.bottomNavColor);
    root.style.setProperty('--theme-border-radius', activeTheme.borderRadius);

    if (activeTheme.websiteName) {
      document.title = activeTheme.websiteName;
    }

    if (activeTheme.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [activeTheme]);

  const updateThemeOnServer = async (themeData: Partial<ThemeConfig>) => {
    const res = await apiRequest<{ theme: ThemeConfig }>('/admin/theme', {
      method: 'POST',
      body: JSON.stringify(themeData),
    }, true);
    if (res && res.theme) {
      setTheme(res.theme);
      setPreviewTheme(null);
    }
  };

  const resetThemeOnServer = async () => {
    const res = await apiRequest<{ theme: ThemeConfig }>('/admin/theme/reset', {
      method: 'POST',
    }, true);
    if (res && res.theme) {
      setTheme(res.theme);
      setPreviewTheme(null);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        previewTheme,
        setPreviewTheme,
        activeTheme,
        refreshTheme,
        updateThemeOnServer,
        resetThemeOnServer,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
