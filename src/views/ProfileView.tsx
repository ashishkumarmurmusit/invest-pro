import React, { useState } from 'react';
import {
  User as UserIcon,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Package,
  History,
  Users,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CalendarCheck,
  CreditCard,
  Send,
  ExternalLink,
  Headphones
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AdBanner } from '../components/ads/AdBanner';
import { Advertisement, NavTab, Order, Transaction } from '../types';
import { OfficialTelegramCard } from '../components/telegram/OfficialTelegramCard';

interface ProfileViewProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenRecharge: () => void;
  onOpenWithdraw: () => void;
  onOpenBank: () => void;
  orders: Order[];
  transactions: Transaction[];
  ads: Advertisement[];
  onOpenTransactions: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onSelectTab,
  onOpenRecharge,
  onOpenWithdraw,
  onOpenBank,
  orders,
  transactions,
  ads,
  onOpenTransactions,
}) => {
  const { user, logout, openAuthModal } = useAuth();
  const { activeTheme } = useTheme();

  const profileAd = ads.find(a => a.position === 'profile_banner');

  if (!user) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
          <UserIcon className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Not Signed In</h3>
          <p className="text-xs text-slate-500 mt-1">Please sign in to view your profile and financial records.</p>
        </div>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm"
          style={{ backgroundColor: activeTheme.buttonColor }}
        >
          Sign In
        </button>
      </div>
    );
  }

  const rechargeTx = transactions.filter(t => t.type === 'recharge' && t.status === 'completed');
  const withdrawTx = transactions.filter(t => t.type === 'withdrawal');

  return (
    <div className="space-y-6 pb-12">
      {/* User Header Profile Card */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${activeTheme.primaryColor} 0%, #1E1B4B 100%)`,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-extrabold border border-white/30 shrink-0">
            {user.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold truncate">{user.fullName}</h2>
            <p className="text-xs text-white/80 font-mono mt-0.5">
              Mobile: {user.mobile}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/30 uppercase tracking-wider">
                Verified Member
              </span>
              <span className="text-[11px] text-white/70 font-mono">
                Ref: {user.referralCode}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Ribbon inside Profile */}
        <div className="mt-6 pt-5 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-white/80">Available Balance</span>
            <div className="text-2xl font-mono font-extrabold tabular-nums">
              ₹{user.walletBalance.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRecharge}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-sm hover:bg-slate-100"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
              Recharge
            </button>
            <button
              onClick={onOpenWithdraw}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md border border-white/30"
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-white" />
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {profileAd && <AdBanner ad={profileAd} />}

      {/* Account Navigation Grid */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
        {/* Bank Account */}
        <button
          onClick={onOpenBank}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Bank Account Details
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {user.bankAccount ? `${user.bankAccount.bankName} (${user.bankAccount.maskedAccountNumber})` : 'Not linked yet'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Node Orders */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Active Node Deployments ({orders.length})
              </div>
              <div className="text-[11px] text-slate-500">
                {orders.length > 0 ? `${orders[0].productName}` : 'No active nodes'}
              </div>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('store')}
            className="text-xs font-bold text-purple-600 hover:underline"
          >
            Deploy Node
          </button>
        </div>

        {/* Full Ledger & Transactions */}
        <button
          onClick={onOpenTransactions}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Complete Transaction Ledger
              </div>
              <div className="text-[11px] text-slate-500">
                Recharges, withdrawals, daily check-ins, commissions
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Referral Organization */}
        <button
          onClick={() => onSelectTab('team')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Referral Team & Network
              </div>
              <div className="text-[11px] text-slate-500">
                Invite friends and review commission reports
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Official Telegram Channel & 24/7 Support Desk */}
        <a
          href="https://t.me/investpro_india"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full p-4 flex items-center justify-between hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Official Telegram Channel</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600">
                  24/7 Support
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                @investpro_india · Join for all updates & help
              </div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-sky-500" />
        </a>

        {/* Security & KYC */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Account Security & Encryption
              </div>
              <div className="text-[11px] text-slate-500">
                SHA-256 Hashing, 2FA Ready, Escrow Protection
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
            Active
          </span>
        </div>
      </div>

      {/* Official Telegram Channel Banner Card */}
      <OfficialTelegramCard />

      {/* Logout Button */}
      <button
        type="button"
        onClick={logout}
        className="w-full p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-xs font-bold text-red-600 hover:bg-red-100/60 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out of Account
      </button>
    </div>
  );
};
