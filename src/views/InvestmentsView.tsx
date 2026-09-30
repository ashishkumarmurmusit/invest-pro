import React, { useState, useEffect } from 'react';
import {
  Layers,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Coins,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowRightLeft,
  Wallet,
  Loader2,
  Check,
  AlertCircle,
  Lock,
  Flame,
  Timer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AdBanner } from '../components/ads/AdBanner';
import { Advertisement, NavTab, Order } from '../types';
import { apiRequest } from '../services/api';

interface InvestmentsViewProps {
  orders: Order[];
  ads: Advertisement[];
  onSelectTab: (tab: NavTab) => void;
  onOpenRecharge: () => void;
  onRefreshOrders?: () => void;
}

export const InvestmentsView: React.FC<InvestmentsViewProps> = ({
  orders,
  ads,
  onSelectTab,
  onOpenRecharge,
  onRefreshOrders,
}) => {
  const { user, reloadProfile } = useAuth();
  const { activeTheme } = useTheme();

  // Live ticking timer every second
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [transferringId, setTransferringId] = useState<string | null>(null);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);
  const [transferErrorMsg, setTransferErrorMsg] = useState<string | null>(null);

  const activeOrders = orders.filter(o => o.status === 'active');
  const completedOrders = orders.filter(o => o.status === 'completed');

  const totalInvestedAmount = orders.reduce((sum, o) => sum + o.price, 0);
  const totalCollectedProfit = orders.reduce((sum, o) => sum + (o.collectedReturns || 0), 0);
  const totalDailyYield = activeOrders
    .filter(o => o.planType !== 'locking_cycle')
    .reduce((sum, o) => sum + o.dailyReturn, 0);

  // Helper function to calculate precise real-time state for each order
  const getOrderTransferState = (ord: Order, nowMs: number) => {
    const isLocking = ord.planType === 'locking_cycle';
    const collected = ord.collectedReturns || 0;
    const remainingTotal = Math.max(0, ord.totalReturn - collected);

    if (remainingTotal <= 0 || ord.status === 'completed') {
      return { claimable: 0, isLocked: false, isCompleted: true, remainingMs: 0, isMatured: false };
    }

    if (isLocking) {
      const endMs = new Date(ord.endDate).getTime();
      const isMatured = nowMs >= endMs;
      const remainingMs = Math.max(0, endMs - nowMs);
      return {
        claimable: isMatured ? remainingTotal : 0,
        isLocked: !isMatured,
        isCompleted: false,
        remainingMs,
        isMatured,
      };
    } else {
      // Daily Plan
      if (!ord.lastClaimDate) {
        // First claim upon activation is ready to transfer
        return {
          claimable: Math.min(ord.dailyReturn, remainingTotal),
          isLocked: false,
          isCompleted: false,
          remainingMs: 0,
          isMatured: false,
        };
      }

      const nextAvailableMs = ord.nextClaimAvailableAt
        ? new Date(ord.nextClaimAvailableAt).getTime()
        : new Date(ord.lastClaimDate).getTime() + 24 * 60 * 60 * 1000;

      const remainingMs = Math.max(0, nextAvailableMs - nowMs);

      if (remainingMs > 0) {
        // 24-hour timer is running -> amount is strictly 0!
        return {
          claimable: 0,
          isLocked: true,
          isCompleted: false,
          remainingMs,
          isMatured: false,
        };
      } else {
        // 24-hour timer expired -> next ₹100 (dailyReturn) is ready to claim!
        return {
          claimable: Math.min(ord.dailyReturn, remainingTotal),
          isLocked: false,
          isCompleted: false,
          remainingMs: 0,
          isMatured: false,
        };
      }
    }
  };

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Compute total transferable profit across active plans in real time
  const totalClaimableProfit = activeOrders.reduce((sum, ord) => {
    const state = getOrderTransferState(ord, currentTime);
    return sum + state.claimable;
  }, 0);

  const investmentAd = ads.find(a => a.position === 'home_middle') || ads[0];

  const handleTransfer = async (orderId?: string) => {
    setTransferErrorMsg(null);
    setTransferSuccessMsg(null);
    setTransferringId(orderId || 'all');

    try {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        transferredAmount: number;
        newBalance: number;
      }>('/products/transfer', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });

      setTransferSuccessMsg(`₹${res.transferredAmount.toFixed(2)} transferred directly to your Main Wallet! Available balance is now ₹${res.newBalance.toFixed(2)}.`);
      
      // Update global user balance and orders
      await reloadProfile();
      if (onRefreshOrders) {
        onRefreshOrders();
      }

      setTimeout(() => setTransferSuccessMsg(null), 6000);
    } catch (err: any) {
      setTransferErrorMsg(err.message || 'Transfer to Main Wallet failed.');
      setTimeout(() => setTransferErrorMsg(null), 5000);
    } finally {
      setTransferringId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <Layers className="w-3.5 h-3.5 text-purple-600" /> Capital & Profit Settlement
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Investment Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            24-Hour Automated Daily Payouts & Locking Capital Cycles with Instant Wallet Transfer
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectTab('store')}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
          style={{ backgroundColor: activeTheme.buttonColor }}
        >
          + Invest in New Plan <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Notifications / Toast Feedback */}
      {transferSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">{transferSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] shrink-0 ml-2"
          >
            View Wallet
          </button>
        </div>
      )}

      {transferErrorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{transferErrorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MASTER CAPITAL & PROFIT SETTLEMENT CARD (TRANSFER TO MAIN WALLET)      */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
              Accumulated Profit Ready To Claim
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl sm:text-4xl font-extrabold font-mono ${
                totalClaimableProfit > 0 ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                ₹{totalClaimableProfit.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">
                {totalClaimableProfit > 0 ? 'Ready to transfer now' : 'All transferred (24h cooldown active)'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Click Transfer to move today's ₹100 daily earnings directly into your Main Wallet balance.
            </p>
          </div>

          <button
            type="button"
            disabled={totalClaimableProfit <= 0 || transferringId !== null}
            onClick={() => handleTransfer()}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm text-white shadow-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: activeTheme.primaryColor }}
          >
            {transferringId === 'all' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Transferring to Wallet...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                Transfer (₹{totalClaimableProfit.toFixed(2)}) to Main Wallet
              </>
            )}
          </button>
        </div>

        {/* 4 Financial Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block font-medium">Total Capital Invested</span>
            <span className="text-base font-extrabold font-mono text-white mt-0.5 block">
              ₹{totalInvestedAmount.toFixed(2)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block font-medium">Daily Stream Yield</span>
            <span className="text-base font-extrabold font-mono text-emerald-400 mt-0.5 block">
              +₹{totalDailyYield.toFixed(2)} / day
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block font-medium">Total Profit Transferred</span>
            <span className="text-base font-extrabold font-mono text-amber-400 mt-0.5 block">
              ₹{totalCollectedProfit.toFixed(2)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block font-medium">Active Plans</span>
            <span className="text-base font-extrabold font-mono text-purple-400 mt-0.5 block">
              {activeOrders.length} Running
            </span>
          </div>
        </div>
      </div>

      {/* Optional Ad Banner */}
      {investmentAd && (
        <AdBanner ad={investmentAd} onAdClick={() => onSelectTab('store')} />
      )}

      {/* ========================================================================= */}
      {/* 2. ACTIVE PLANS & TRANSFER OPTION FOR EACH ACTIVE PLAN                     */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            Active Deployed Plans ({activeOrders.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            24-Hour Countdown & Live Claim
          </span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No Active Investment Plans Deployed
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Deploy a plan from the Store (e.g. ₹500 plan). You will earn ₹100 every 24 hours for up to 64 days, transferable directly to your Main Wallet!
            </p>
            <button
              type="button"
              onClick={() => onSelectTab('store')}
              className="mt-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs"
              style={{ backgroundColor: activeTheme.buttonColor }}
            >
              Go to Store & Invest
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map(ord => {
              const startDate = new Date(ord.startDate).getTime();
              const isLocking = ord.planType === 'locking_cycle';
              const daysCompleted = ord.daysClaimed || (ord.collectedReturns ? Math.floor(ord.collectedReturns / ord.dailyReturn) : 0);
              const progressPercent = Math.min(100, Math.round((daysCompleted / ord.durationDays) * 100));

              // Real-time calculation using current timestamp
              const { claimable, isLocked, remainingMs, isMatured } = getOrderTransferState(ord, currentTime);

              return (
                <div
                  key={ord.id}
                  className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Top Bar of the Order Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                        isLocking
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                      }`}>
                        {isLocking ? <Lock className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {ord.productName}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                            isLocking
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border border-emerald-300 dark:border-emerald-800'
                          }`}>
                            {isLocking ? '🔒 Locking Cycle' : '⚡ 24h Daily Payout'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Order #{ord.id} · Deployed on {new Date(ord.startDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Capital Display */}
                    <div className="flex items-center justify-between sm:flex-col sm:items-end">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">
                        Invested Capital
                      </span>
                      <span className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                        ₹{ord.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {!isLocking ? (
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Daily Income Rate</span>
                        <span className="font-mono font-bold text-emerald-600 text-sm">
                          +₹{ord.dailyReturn.toFixed(2)} / 24h
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Locking Period</span>
                        <span className="font-mono font-bold text-amber-600 text-sm">
                          {ord.durationDays} Days Fixed
                        </span>
                      </div>
                    )}

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Ready to Transfer
                      </span>
                      <span className={`font-mono font-extrabold text-sm ${
                        claimable > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}>
                        ₹{claimable.toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {isLocking ? 'Maturity Timer' : 'Next 24h Claim Timer'}
                      </span>
                      <span className={`font-mono font-bold text-sm flex items-center gap-1 ${
                        isLocked ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        <Timer className="w-3.5 h-3.5 shrink-0" />
                        {isLocked ? formatCountdown(remainingMs) : 'Claim Ready!'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Total Contract Payout</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        ₹{ord.totalReturn.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* 24-Hour Timer Status Card */}
                  {isLocked && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                        <span className="text-amber-900 dark:text-amber-300 font-medium">
                          {isLocking
                            ? `Capital locked for cycle duration. Matures on ${new Date(ord.endDate).toLocaleDateString()}.`
                            : `Today's ₹${ord.dailyReturn.toFixed(2)} has been transferred! Next ₹${ord.dailyReturn.toFixed(2)} profit unlocks in:`}
                        </span>
                      </div>
                      <div className="font-mono font-extrabold text-amber-700 dark:text-amber-300 text-sm px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-900/50 self-start sm:self-auto">
                        ⏳ {formatCountdown(remainingMs)}
                      </div>
                    </div>
                  )}

                  {/* Progress & Transfer Action */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        Cycle Progress: <strong className="text-slate-800 dark:text-slate-200">Claim {daysCompleted} of {ord.durationDays} Days</strong> ({progressPercent}%)
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        Transferred to Wallet: ₹{(ord.collectedReturns || 0).toFixed(2)} / ₹{ord.totalReturn.toFixed(2)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLocking ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Action button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <span className="text-[11px] text-slate-500">
                        {isLocking
                          ? isMatured
                            ? '✅ Locking cycle complete! You can now transfer your maturity payout.'
                            : `🔒 Locked in ${ord.durationDays}-day cycle. Full ₹${ord.totalReturn.toFixed(2)} unlocks upon maturity.`
                          : isLocked
                          ? `⏱️ Transferred! 24-hour cycle timer is running. Ready amount is ₹0.00 until next payout.`
                          : `⚡ Today's ₹${ord.dailyReturn.toFixed(2)} is ready! Click to transfer directly to your Main Wallet.`}
                      </span>

                      <button
                        type="button"
                        disabled={claimable <= 0 || transferringId !== null}
                        onClick={() => handleTransfer(ord.id)}
                        className={`px-5 py-2.5 rounded-2xl font-bold text-xs text-white shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                          claimable > 0
                            ? 'hover:opacity-95 active:scale-95 cursor-pointer'
                            : 'opacity-40 cursor-not-allowed'
                        }`}
                        style={{ backgroundColor: claimable > 0 ? activeTheme.buttonColor : '#64748B' }}
                      >
                        {transferringId === ord.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Transferring ₹{ord.dailyReturn.toFixed(2)}...
                          </>
                        ) : isLocking ? (
                          isMatured ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Unlock ₹{claimable.toFixed(2)} to Wallet
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              Locked (Matures in {formatCountdown(remainingMs)})
                            </>
                          )
                        ) : isLocked ? (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            Claim in {formatCountdown(remainingMs)}
                          </>
                        ) : (
                          <>
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Transfer ₹{claimable.toFixed(2)} to Wallet
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Orders Accordion */}
      {completedOrders.length > 0 && (
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Completed & Fully Settled Plans ({completedOrders.length})
          </h4>
          <div className="space-y-2">
            {completedOrders.map(ord => (
              <div
                key={ord.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block">{ord.productName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Invested: ₹{ord.price.toFixed(2)} · Completed {ord.durationDays} Days Cycle
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Payout Settled</span>
                  <span className="font-mono font-bold text-emerald-600">₹{ord.totalReturn.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
