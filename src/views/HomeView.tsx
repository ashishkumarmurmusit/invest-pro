import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  CalendarCheck,
  Users,
  Building2,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Zap,
  Volume2,
  Gift,
  Clock,
  ShieldCheck,
  Layers,
  ArrowRight,
  Flame,
  CheckCircle2,
  Percent,
  Coins,
  History,
  Tag,
  X,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AdBanner } from '../components/ads/AdBanner';
import { Advertisement, CheckinStatus, AdsterraSettings, NavTab, Order, Product, Transaction } from '../types';
import { apiRequest } from '../services/api';
import { TelegramJoinModal } from '../components/telegram/TelegramJoinModal';
import { OfficialTelegramCard } from '../components/telegram/OfficialTelegramCard';

interface HomeViewProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenRecharge: (amount?: string) => void;
  onOpenWithdraw: () => void;
  onOpenBank: () => void;
  products: Product[];
  recentTransactions: Transaction[];
  ads: Advertisement[];
  orders?: Order[];
  adsterra?: AdsterraSettings;
  announcementTicker?: string;
  onBuyProduct: (product: Product) => void;
}

// Live community withdrawal events for real-time social proof in INR
const LIVE_COMMUNITY_WITHDRAWALS = [
  { name: 'Rahul S.', mobile: '98***4210', amount: 4500, bank: 'HDFC Bank', time: '1 min ago' },
  { name: 'Priya K.', mobile: '97***8912', amount: 12000, bank: 'State Bank of India', time: 'Just now' },
  { name: 'Amit V.', mobile: '91***3341', amount: 2800, bank: 'ICICI Bank', time: '3 mins ago' },
  { name: 'Deepak M.', mobile: '99***7654', amount: 7500, bank: 'Axis Bank', time: '4 mins ago' },
  { name: 'Sunita R.', mobile: '93***2190', amount: 15000, bank: 'Kotak Mahindra', time: '6 mins ago' },
  { name: 'Vikram S.', mobile: '94***1180', amount: 6200, bank: 'Punjab National Bank', time: '8 mins ago' },
];

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectTab,
  onOpenRecharge,
  onOpenWithdraw,
  onOpenBank,
  products,
  recentTransactions,
  ads,
  orders = [],
  adsterra,
  announcementTicker,
  onBuyProduct,
}) => {
  const { user, reloadProfile } = useAuth();
  const { activeTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  // In-page Daily Checkin status
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null);
  const [claimingCheckin, setClaimingCheckin] = useState(false);
  const [checkinClaimMsg, setCheckinClaimMsg] = useState<string | null>(null);

  // Live Withdrawal Notification Popup (Portrait style at the side)
  const [liveToastIndex, setLiveToastIndex] = useState(0);
  const [showLiveToast, setShowLiveToast] = useState(true);
  const [dismissedToast, setDismissedToast] = useState(false);

  // Official Telegram Modal State
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  // Filter ads by placement
  const topAd = ads.find(a => a.position === 'home_top');
  const midAd = ads.find(a => a.position === 'home_middle');
  const bottomAd = ads.find(a => a.position === 'home_bottom');

  // Rotate live withdrawal notification popup every 4.5 seconds
  useEffect(() => {
    if (dismissedToast) return;
    const timer = setInterval(() => {
      setShowLiveToast(false);
      setTimeout(() => {
        setLiveToastIndex(prev => (prev + 1) % LIVE_COMMUNITY_WITHDRAWALS.length);
        setShowLiveToast(true);
      }, 400);
    }, 4500);
    return () => clearInterval(timer);
  }, [dismissedToast]);

  const fetchCheckinStatus = async () => {
    try {
      const res = await apiRequest<CheckinStatus>('/checkin/status');
      setCheckinStatus(res);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCheckinStatus();
  }, [user]);

  const handleCopyLink = () => {
    if (!user) return;
    const url = `${window.location.origin}?ref=${user.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimHomeCheckin = async () => {
    if (!user) return;
    setClaimingCheckin(true);
    setCheckinClaimMsg(null);
    try {
      const res = await apiRequest('/checkin/claim', { method: 'POST' });
      setCheckinClaimMsg(res.message);
      await reloadProfile();
      await fetchCheckinStatus();
      setTimeout(() => setCheckinClaimMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Check-in claim failed.');
    } finally {
      setClaimingCheckin(false);
    }
  };

  // Withdrawals history specifically
  const userWithdrawals = recentTransactions.filter(t => t.type === 'withdrawal');

  // Active investments calculation
  const totalDailyYield = orders
    .filter(o => o.status === 'active')
    .reduce((sum, o) => sum + o.dailyReturn, 0);

  const totalInvestedAmount = orders.reduce((sum, o) => sum + o.price, 0);
  const totalCollectedProfit = orders.reduce((sum, o) => sum + (o.collectedReturns || 0), 0);

  const currentToast = LIVE_COMMUNITY_WITHDRAWALS[liveToastIndex];

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Official Telegram Daily & Login Modal */}
      <TelegramJoinModal
        isOpen={isTelegramModalOpen ? true : undefined}
        onClose={() => setIsTelegramModalOpen(false)}
      />

      {/* ========================================================================= */}
      {/* 1. LIVE WITHDRAWAL SIDE POPUP (COMPACT RESIZED PORTRAIT AT THE SIDE)       */}
      {/* ========================================================================= */}
      {!dismissedToast && (
        <div className="fixed bottom-24 right-4 z-40 w-40 sm:w-44 pointer-events-none">
          <div
            className={`transition-all duration-500 transform ${
              showLiveToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
            }`}
          >
            <div className="pointer-events-auto bg-slate-900 text-white border border-blue-500/40 p-2.5 rounded-2xl shadow-2xl flex flex-col items-center text-center relative group">
              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => setDismissedToast(true)}
                className="absolute top-1.5 right-1.5 p-0.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                title="Dismiss"
              >
                <X className="w-2.5 h-2.5" />
              </button>

              {/* Header Badge */}
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-bold uppercase tracking-wider mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Payout
              </div>

              {/* Bank Icon Avatar */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs mb-1.5">
                <Building2 className="w-4 h-4 text-white" />
              </div>

              {/* Member Details */}
              <div className="font-bold text-[11px] text-slate-100 leading-tight">
                {currentToast.name}
              </div>
              <span className="text-[9px] text-slate-400 font-mono">
                {currentToast.mobile}
              </span>

              {/* Payout Amount (Portrait Prominent Center) */}
              <div className="my-1.5 py-0.5 px-2 w-full rounded-lg bg-slate-800/90 border border-slate-700/60">
                <span className="text-[8px] text-slate-400 block uppercase font-medium">Withdrew</span>
                <span className="text-sm font-extrabold font-mono text-emerald-400 block">
                  ₹{currentToast.amount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Destination Bank & Status */}
              <div className="text-[9px] text-slate-300 font-medium truncate max-w-full">
                {currentToast.bank}
              </div>
              <div className="flex items-center gap-1 text-[8px] text-emerald-400 mt-0.5">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span>Success · {currentToast.time}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. GLOBAL ANNOUNCEMENT TICKER (OPAQUE & READABLE)    */}
      {/* ==================================================== */}
      {announcementTicker && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-blue-600 text-white shadow-sm overflow-hidden text-xs font-semibold">
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
          </div>
          <div className="truncate text-white font-medium">
            <span>{announcementTicker}</span>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. COMPACT 3RD-PARTY / 2ND-PARTY AD SPACE            */}
      {/* ==================================================== */}
      {topAd ? (
        <AdBanner
          ad={topAd}
          adsterraSlotName="homeTopBanner"
          adsterra={adsterra}
          onAdClick={() => onSelectTab('store')}
        />
      ) : (
        adsterra?.isEnabled && adsterra.slots.homeTopBanner.isEnabled && adsterra.slots.homeTopBanner.scriptCode && (
          <AdBanner
            adsterraSlotName="homeTopBanner"
            adsterra={adsterra}
          />
        )
      )}

      {/* ==================================================== */}
      {/* 4. QUICK ACTIONS & HUB BANNER WITH WALLET BALANCE   */}
      {/* ==================================================== */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7 text-white shadow-lg transition-all"
        style={{
          background: `linear-gradient(135deg, ${activeTheme.primaryColor} 0%, ${activeTheme.secondaryColor} 100%)`,
        }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Smart Node Investment Platform</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Welcome, {user?.fullName || 'Valued Member'}
            </h2>

            {/* Available Wallet Balance Shown Below Greeting */}
            <div className="pt-2 pb-1">
              <span className="text-[11px] text-white/80 uppercase tracking-wider block font-semibold">
                Available Wallet Balance
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white drop-shadow-xs">
                ₹{user?.walletBalance.toFixed(2) || '0.00'}
              </div>
            </div>

            <div className="text-xs text-white/80 pt-0.5">
              Member ID: <span className="font-mono font-semibold">{user?.mobile || 'Guest'}</span> · Referral Code:{' '}
              <span className="font-mono font-bold uppercase">{user?.referralCode || 'NEXUS987'}</span>
            </div>
          </div>

          {/* Quick Action Deposit & Withdrawal Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenRecharge()}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 font-bold text-xs shadow-sm hover:bg-slate-100 active:scale-95 transition-all"
            >
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
              Recharge Wallet
            </button>
            <button
              onClick={onOpenWithdraw}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md active:scale-95 transition-all border border-white/25"
            >
              <ArrowDownRight className="w-4 h-4 text-white" />
              Withdraw Funds
            </button>
            <button
              onClick={onOpenBank}
              className="hidden sm:flex items-center justify-center p-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md active:scale-95 transition-all border border-white/20"
              title="Bank Account"
            >
              <Building2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Top-Up Preset Shortcuts in INR */}
        <div className="relative z-10 mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-white/80 text-[11px] font-medium">Quick Recharge Presets:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {['500', '1000', '2500', '5000', '10000'].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => onOpenRecharge(amt)}
                className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-xs font-mono font-bold text-[11px] text-white transition-colors"
              >
                +₹{Number(amt).toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Official Telegram Channel Card */}
      <OfficialTelegramCard onOpenModal={() => setIsTelegramModalOpen(true)} />

      {/* ==================================================== */}
      {/* 5. USER'S ACTIVE INVESTMENT PORTFOLIO                */}
      {/* ==================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Active Investment Portfolio
              </h3>
              <p className="text-[11px] text-slate-500">
                Running nodes, active investment days, and cumulative daily returns
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('store')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            + Deploy New Node <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Investment Summary Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Active Nodes</span>
            <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
              {orders.length} Units
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Daily Return</span>
            <span className="text-base font-extrabold font-mono text-emerald-600">
              +₹{totalDailyYield.toFixed(2)}/day
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Invested</span>
            <span className="text-base font-extrabold font-mono text-blue-600 dark:text-blue-400">
              ₹{totalInvestedAmount.toFixed(2)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Profit Collected</span>
            <span className="text-base font-extrabold font-mono text-amber-500">
              ₹{totalCollectedProfit.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Running Active Orders List */}
        {orders.length === 0 ? (
          <div className="py-7 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            You currently have no active deployed investments. Choose a stock plan below to start earning daily returns!
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.map(ord => {
              const startDate = new Date(ord.startDate);
              const now = new Date();
              const diffDays = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
              const remainingDays = Math.max(0, ord.durationDays - diffDays);

              return (
                <div
                  key={ord.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{ord.productName}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-semibold">
                          Active
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Invested: ₹{ord.price.toFixed(2)} · Running {diffDays} of {ord.durationDays} Days ({remainingDays} days left)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Daily Yield</span>
                      <span className="font-mono font-bold text-emerald-600">+₹{ord.dailyReturn.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Est. Total Return</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">₹{ord.totalReturn.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 6. TODAY'S INVESTMENT STOCKS & PLANS                 */}
      {/* ==================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> High-Return Stock Catalog
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Investment Stock Plans & Daily Profit
            </h3>
            <p className="text-xs text-slate-500">
              Transparent daily yield returns with automated wallet payout cycles
            </p>
          </div>
          <button
            onClick={() => onSelectTab('store')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
          >
            All Plans <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Stock / Plan Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(prod => {
            const isLocking = prod.planType === 'locking_cycle';

            return (
              <div
                key={prod.id}
                className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isLocking
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}>
                        {isLocking ? '🔒 Locking Cycle' : '⚡ Daily Withdrawal'}
                      </span>
                      {prod.badge && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                          {prod.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {prod.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{prod.subtitle}</p>
                  </div>

                  {/* Investment & Profit Details */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Investment Price:</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        ₹{prod.price.toFixed(2)}
                      </span>
                    </div>

                    {!isLocking ? (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Daily Return / Profit:</span>
                        <span className="font-bold font-mono text-emerald-600">
                          +₹{prod.dailyReturn.toFixed(2)} / day
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Maturity Unlock:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          Day {prod.durationDays}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Investment Duration:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {prod.durationDays} Days
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5 font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Total Return at End:</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400">
                        ₹{prod.totalReturn.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Stock Units</span>
                    <span className="text-xs font-semibold font-mono text-slate-600 dark:text-slate-300">
                      {prod.stock} Available
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBuyProduct(prod)}
                    className="px-4 py-2 rounded-xl font-bold text-xs text-white shadow-xs hover:opacity-95 transition-opacity"
                    style={{ backgroundColor: activeTheme.buttonColor }}
                  >
                    Invest (₹{prod.price.toFixed(2)})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 7. SPECIAL OFFERS & LIMITED PROMOTIONS               */}
      {/* ==================================================== */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Special Offers & Deals
            </h3>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Limited Time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 text-white border border-blue-500/30 shadow-md space-y-3">
            <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 uppercase">
              <Percent className="w-3 h-3 text-amber-400" /> 10% Extra Cashback
            </div>
            <h4 className="text-sm sm:text-base font-bold">
              First Recharge Cashback Offer
            </h4>
            <p className="text-xs text-blue-200/80 leading-relaxed">
              Deposit ₹500 or more to instantly unlock a 10% instant rebate credit in your wallet!
            </p>
            <button
              onClick={() => onOpenRecharge('500')}
              className="mt-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-sm hover:bg-slate-100 flex items-center gap-1.5"
            >
              Claim Cashback Offer <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-md space-y-3">
            <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 uppercase">
              <Gift className="w-3 h-3 text-emerald-400" /> 7-Day Streak ₹100 Reward
            </div>
            <h4 className="text-sm sm:text-base font-bold">
              Daily Check-in Loyalty Bonus
            </h4>
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              Maintain your daily check-in consecutive streak to claim up to ₹100.00 cash rewards!
            </p>
            <button
              onClick={() => onSelectTab('checkin')}
              className="mt-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-sm hover:bg-slate-100 flex items-center gap-1.5"
            >
              Open Daily Check-in <CalendarCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 8. COMPACT SECOND AD PLACEMENT (MID-BANNER)          */}
      {/* ==================================================== */}
      {midAd ? (
        <AdBanner
          ad={midAd}
          adsterraSlotName="homeMiddleBanner"
          adsterra={adsterra}
          onAdClick={() => onSelectTab('team')}
        />
      ) : (
        adsterra?.isEnabled && adsterra.slots.homeMiddleBanner.isEnabled && adsterra.slots.homeMiddleBanner.scriptCode && (
          <AdBanner
            adsterraSlotName="homeMiddleBanner"
            adsterra={adsterra}
          />
        )
      )}

      {/* ==================================================== */}
      {/* 9. IN-PAGE DAILY CHECK-IN STREAK GLANCE              */}
      {/* ==================================================== */}
      {checkinStatus && (
        <div className="p-4 sm:p-5 rounded-3xl border border-blue-200/80 dark:border-blue-800/40 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Daily Check-in Streak
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900/60 text-blue-900 dark:text-blue-300">
                  {checkinStatus.currentStreak} Days
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                {checkinStatus.alreadyClaimedToday
                  ? 'Today’s bonus collected! Keep the streak alive tomorrow.'
                  : `Day ${checkinStatus.nextDayNumber} reward ready: +₹${checkinStatus.rewardSchedule[(checkinStatus.nextDayNumber - 1) || 0]?.toFixed(2)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {checkinClaimMsg && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Claimed!
              </span>
            )}
            {checkinStatus.alreadyClaimedToday ? (
              <button
                onClick={() => onSelectTab('checkin')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
              >
                View Streak
              </button>
            ) : (
              <button
                onClick={handleClaimHomeCheckin}
                disabled={claimingCheckin}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95 transition-opacity"
                style={{ backgroundColor: activeTheme.buttonColor }}
              >
                {claimingCheckin ? 'Claiming...' : 'Claim Today’s Bonus'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 10. WITHDRAWAL HISTORY SNAPSHOT                      */}
      {/* ==================================================== */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Withdrawal History
            </h3>
          </div>
          <button
            onClick={onOpenWithdraw}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Withdraw Now
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {userWithdrawals.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No withdrawal records yet. Payouts processed to your bank will be listed here.
            </div>
          ) : (
            userWithdrawals.slice(0, 4).map(w => (
              <div key={w.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {w.description}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {w.id} · {new Date(w.createdAt).toLocaleDateString()} at{' '}
                      {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    ₹{w.amount.toFixed(2)}
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider block mt-0.5 ${
                      w.status === 'completed'
                        ? 'text-emerald-500'
                        : w.status === 'pending'
                        ? 'text-amber-500'
                        : w.status === 'processing'
                        ? 'text-blue-500'
                        : 'text-red-500'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 11. REFERRAL SHARE BOX                               */}
      {/* ==================================================== */}
      {user && (
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Referral Accelerator
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Invite friends to earn 10% direct commission
            </h4>
            <p className="text-xs text-slate-500">
              Your referral code: <span className="font-mono font-bold text-blue-600">{user.referralCode}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Link Copied!' : 'Copy Referral Link'}
            </button>
            <button
              onClick={() => onSelectTab('team')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              View Team
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 12. COMPACT BOTTOM AD PLACEMENT                     */}
      {/* ==================================================== */}
      {bottomAd ? (
        <AdBanner
          ad={bottomAd}
          adsterraSlotName="footerBanner"
          adsterra={adsterra}
        />
      ) : (
        adsterra?.isEnabled && adsterra.slots.footerBanner.isEnabled && adsterra.slots.footerBanner.scriptCode && (
          <AdBanner
            adsterraSlotName="footerBanner"
            adsterra={adsterra}
          />
        )
      )}
    </div>
  );
};
