import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { AuthModal } from './components/auth/AuthModal';
import { RechargeModal } from './components/wallet/RechargeModal';
import { WithdrawModal } from './components/wallet/WithdrawModal';
import { BankAccountModal } from './components/wallet/BankAccountModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { HomeView } from './views/HomeView';
import { StoreView } from './views/StoreView';
import { CheckinView } from './views/CheckinView';
import { TeamView } from './views/TeamView';
import { ProfileView } from './views/ProfileView';
import { TransactionsView } from './views/TransactionsView';
import { GuestLandingView } from './views/GuestLandingView';
import { InvestmentsView } from './views/InvestmentsView';
import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Advertisement, AdsterraSettings, NavTab, NotificationItem, Product, Transaction } from './types';
import { apiRequest } from './services/api';
import { AdsterraGlobalScripts } from './components/ads/AdsterraGlobalScripts';
import { SupportWidget } from './components/support/SupportWidget';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { activeTheme } = useTheme();
  const { isAdminAuthenticated } = useAdmin();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [showTransactionsView, setShowTransactionsView] = useState(false);

  // URL route state
  const [path, setPath] = useState(window.location.pathname);

  // Modals state
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [rechargePreset, setRechargePreset] = useState<string>('50');
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);

  // App Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [adsterra, setAdsterra] = useState<AdsterraSettings | undefined>(undefined);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [announcementTicker, setAnnouncementTicker] = useState<string>('');

  // Handle URL change
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
  };

  // Fetch Public Data
  const fetchData = async () => {
    try {
      const [prodRes, adsRes] = await Promise.all([
        apiRequest<{ products: Product[] }>('/products'),
        apiRequest<{ ads: Advertisement[]; adsterra: AdsterraSettings }>('/ads'),
      ]);
      setProducts(prodRes.products || []);
      setAds(adsRes.ads || []);
      setAdsterra(adsRes.adsterra);
    } catch {
      // ignore
    }
  };

  // Fetch Authenticated User Data
  const fetchUserData = async () => {
    if (!user) return;
    try {
      const [txRes, ordRes, notifRes] = await Promise.all([
        apiRequest<{ transactions: Transaction[] }>('/transactions'),
        apiRequest<{ orders: any[] }>('/products/user/orders'),
        apiRequest<{ notifications: NotificationItem[]; unreadCount: number; announcementTicker: string }>('/notifications'),
      ]);
      setTransactions(txRes.transactions || []);
      setOrders(ordRes.orders || []);
      setNotifications(notifRes.notifications || []);
      setUnreadNotifsCount(notifRes.unreadCount || 0);
      setAnnouncementTicker(notifRes.announcementTicker || '');
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchData();
  }, [path, currentTab]);

  useEffect(() => {
    fetchUserData();
  }, [user, path, currentTab]);

  // Check if current route is private admin route
  const isAdminRoute = path.startsWith('/admin');

  if (isAdminRoute) {
    if (!isAdminAuthenticated) {
      return (
        <AdminLogin
          onLoginSuccess={() => navigateTo('/admin/dashboard')}
          onExitToPublic={() => navigateTo('/')}
        />
      );
    }
    return (
      <AdminLayout
        onExitToPublic={() => navigateTo('/')}
      />
    );
  }

  const renderPublicView = () => {
    // When logged out, display dedicated guest landing page with withdrawal stats, stock plans, ad, and side login/registration
    if (!user) {
      return (
        <GuestLandingView
          products={products}
          ads={ads}
        />
      );
    }

    if (showTransactionsView) {
      return (
        <TransactionsView
          transactions={transactions}
          onBack={() => setShowTransactionsView(false)}
        />
      );
    }

    switch (currentTab) {
      case 'home':
        return (
          <HomeView
            onSelectTab={tab => {
              setShowTransactionsView(false);
              setCurrentTab(tab);
            }}
            onOpenRecharge={(amt) => {
              if (amt) setRechargePreset(amt);
              setIsRechargeOpen(true);
            }}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onOpenBank={() => setIsBankOpen(true)}
            products={products}
            recentTransactions={transactions}
            ads={ads}
            orders={orders}
            adsterra={adsterra}
            announcementTicker={announcementTicker}
            onBuyProduct={_prod => {
              setCurrentTab('store');
            }}
          />
        );
      case 'investments':
        return (
          <InvestmentsView
            orders={orders}
            ads={ads}
            onSelectTab={tab => {
              setShowTransactionsView(false);
              setCurrentTab(tab);
            }}
            onOpenRecharge={() => setIsRechargeOpen(true)}
            onRefreshOrders={fetchUserData}
          />
        );
      case 'store':
        return (
          <StoreView
            products={products}
            ads={ads}
            adsterra={adsterra}
            onOpenRecharge={() => setIsRechargeOpen(true)}
            onRefreshOrders={fetchUserData}
            onNavigateToInvestments={() => setCurrentTab('investments')}
          />
        );
      case 'checkin':
        return (
          <CheckinView
            ads={ads}
            onOpenRecharge={() => setIsRechargeOpen(true)}
          />
        );
      case 'team':
        return <TeamView ads={ads} />;
      case 'profile':
        return (
          <ProfileView
            onSelectTab={tab => {
              setShowTransactionsView(false);
              setCurrentTab(tab);
            }}
            onOpenRecharge={() => setIsRechargeOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onOpenBank={() => setIsBankOpen(true)}
            orders={orders}
            transactions={transactions}
            ads={ads}
            onOpenTransactions={() => setShowTransactionsView(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{
        backgroundColor: activeTheme.backgroundColor,
        color: activeTheme.textColor,
      }}
    >
      {/* Adsterra Global Popunder & Social Bar Script Handler */}
      <AdsterraGlobalScripts adsterra={adsterra} />

      {/* Top Bar Contract (Wordmark - Navigation - Quick Action/Balance) */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={tab => {
          setShowTransactionsView(false);
          setCurrentTab(tab);
        }}
        onOpenNotifications={() => setIsNotifsOpen(true)}
        onOpenRecharge={() => setIsRechargeOpen(true)}
        unreadNotifsCount={unreadNotifsCount}
      />

      {/* Main Responsive Body Viewport */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-24">
        {renderPublicView()}
      </main>

      {/* Mobile Bottom Navigation (Ergonomic thumb zone) - Only displayed when logged in */}
      {user && (
        <BottomNav
          currentTab={currentTab}
          onSelectTab={tab => {
            setShowTransactionsView(false);
            setCurrentTab(tab);
          }}
        />
      )}

      {/* Global Modals */}
      <AuthModal />

      <RechargeModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        onSuccess={fetchUserData}
        initialAmount={rechargePreset}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onOpenBankModal={() => {
          setIsWithdrawOpen(false);
          setIsBankOpen(true);
        }}
        onSuccess={fetchUserData}
      />

      <BankAccountModal
        isOpen={isBankOpen}
        onClose={() => setIsBankOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        notifications={notifications}
        onRefresh={fetchUserData}
      />

      {/* Floating 24/7 Member Support & Telegram Widget */}
      {!isAdminRoute && (
        <SupportWidget />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <AppContent />
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
