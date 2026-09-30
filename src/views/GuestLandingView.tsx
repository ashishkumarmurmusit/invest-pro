import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Phone,
  User as UserIcon,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  Layers,
  ChevronRight,
  Flame,
  Check,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AdBanner } from '../components/ads/AdBanner';
import { Advertisement, Product } from '../types';
import { apiRequest } from '../services/api';
import { OfficialTelegramCard } from '../components/telegram/OfficialTelegramCard';

interface GuestLandingViewProps {
  products: Product[];
  ads: Advertisement[];
}

// Live withdrawal social proof stream
const RECENT_WITHDRAWALS = [
  { name: 'Rahul S.', mobile: '98***4210', amount: 4500, bank: 'HDFC Bank', time: 'Just now' },
  { name: 'Priya K.', mobile: '97***8912', amount: 12000, bank: 'State Bank of India', time: '2 mins ago' },
  { name: 'Amit V.', mobile: '91***3341', amount: 2800, bank: 'ICICI Bank', time: '4 mins ago' },
  { name: 'Deepak M.', mobile: '99***7654', amount: 7500, bank: 'Axis Bank', time: '6 mins ago' },
  { name: 'Sunita R.', mobile: '93***2190', amount: 15000, bank: 'Kotak Mahindra', time: '8 mins ago' },
  { name: 'Vikram S.', mobile: '94***1180', amount: 6200, bank: 'Punjab National Bank', time: '11 mins ago' },
  { name: 'Ananya B.', mobile: '95***4321', amount: 9800, bank: 'Bank of Baroda', time: '14 mins ago' },
];

export const GuestLandingView: React.FC<GuestLandingViewProps> = ({
  products,
  ads,
}) => {
  const { login, register } = useAuth();
  const { activeTheme } = useTheme();

  // Auth Card Tab: 'login' | 'register'
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginId, setLoginId] = useState('9876543210');
  const [loginPwd, setLoginPwd] = useState('password123');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPwd, setRegPwd] = useState('');
  const [regConfirmPwd, setRegConfirmPwd] = useState('');
  const [regRefCode, setRegRefCode] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regTerms, setRegTerms] = useState(true);
  const [showRegPwd, setShowRegPwd] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Ref to scroll to auth form
  const authCardRef = useRef<HTMLDivElement>(null);

  // Ad placement
  const runningAd = ads.find(a => a.position === 'home_top') || ads[0];

  const scrollToAuth = (selectedPlanName?: string) => {
    if (authCardRef.current) {
      authCardRef.current.scrollIntoView({ behavior: 'smooth' });
      if (selectedPlanName) {
        setSuccessMsg(`Sign in or create an account to activate "${selectedPlanName}".`);
      }
    }
  };

  const handleSendOtp = async () => {
    if (!regMobile || regMobile.length < 8) {
      setErrorMsg('Please enter a valid mobile number first.');
      return;
    }
    setErrorMsg(null);
    setSendingOtp(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string; otpHint: string }>('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ mobile: regMobile }),
      });
      setOtpSent(true);
      setRegOtp(res.otpHint || '1234');
      setSuccessMsg(`OTP sent! Use demo OTP: ${res.otpHint || '1234'}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      await login(loginId, loginPwd);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (regPwd !== regConfirmPwd) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!regTerms) {
      setErrorMsg('Please accept Terms & Conditions.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        fullName: regFullName,
        mobile: regMobile,
        password: regPwd,
        confirmPassword: regConfirmPwd,
        referralCode: regRefCode,
        otp: regOtp || '1234',
        termsAccepted: regTerms,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoginId('9876543210');
    setLoginPwd('password123');
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await login('9876543210', 'password123');
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ========================================================================= */}
      {/* 2-COLUMN MAIN LAYOUT: LEFT STATS & STOCKS, RIGHT LOGIN/REGISTRATION FORM */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ======================================================= */}
        {/* LEFT COLUMN: WITHDRAWAL TOTAL, AD RUNNING, STOCK PLANS  */}
        {/* ======================================================= */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. TODAY'S TOTAL WITHDRAWAL CARD */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white border border-slate-700/60 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Today's Live Payout Ledger
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Updated just now
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider">
                  Today's Total Platform Withdrawals
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400 tracking-tight mt-1">
                  ₹2,48,750.00
                </div>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>418 successful payouts dispatched directly to bank accounts today</span>
                </p>
              </div>

              {/* Recent Community Payouts Snapshot */}
              <div className="pt-3 border-t border-slate-700/60 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  Recent Successful Transfers:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {RECENT_WITHDRAWALS.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-200 truncate">
                          {item.name} <span className="text-[10px] text-slate-400 font-mono">({item.mobile})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{item.bank}</div>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <span className="text-emerald-400 font-bold block">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] text-slate-400">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. RUNNING ADVERTISEMENT CONTAINER */}
          {runningAd ? (
            <div className="rounded-2xl overflow-hidden shadow-sm">
              <AdBanner
                ad={runningAd}
                onAdClick={() => scrollToAuth()}
              />
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-blue-900 dark:text-blue-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  <strong className="font-bold">Exclusive Bonus:</strong> Sign up today to unlock daily login rewards & 10% referral rebate.
                </span>
              </div>
              <button
                type="button"
                onClick={() => scrollToAuth()}
                className="font-bold underline shrink-0 ml-2"
              >
                Join Now
              </button>
            </div>
          )}

          {/* Official Telegram Channel Card */}
          <OfficialTelegramCard />

          {/* 3. TODAY'S STOCK DETAILS (INVESTMENT AMOUNT, PROFIT, DURATION) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> Active Yield Nodes
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Today's Verified Stock & Node Plans
                </h3>
                <p className="text-xs text-slate-500">
                  Clear daily profit rates, investment amounts, and lock duration cycles
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {products.map(prod => (
                <div
                  key={prod.id}
                  className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {prod.name}
                          </h4>
                          {prod.badge && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                              {prod.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{prod.subtitle}</p>
                      </div>
                    </div>

                    {/* Stock specs grid: Investment Amount, Daily Profit, Duration, Total Return */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Investment</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                          ₹{prod.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Daily Profit</span>
                        <span className="font-mono font-bold text-emerald-600 text-sm">
                          +₹{prod.dailyReturn.toFixed(2)}/d
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          {prod.durationDays} Days
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Total Return</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                          ₹{prod.totalReturn.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {prod.stock} Units Open
                    </span>
                    <button
                      type="button"
                      onClick={() => scrollToAuth(prod.name)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
                      style={{ backgroundColor: activeTheme.buttonColor }}
                    >
                      Invest Now <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* RIGHT COLUMN: LOGIN / REGISTRATION PAGE ON THE SIDE     */}
        {/* ======================================================= */}
        <div className="lg:col-span-5 lg:sticky lg:top-20" ref={authCardRef}>
          <div
            className="rounded-3xl p-6 sm:p-7 border shadow-xl transition-all"
            style={{
              backgroundColor: activeTheme.cardColor,
              borderColor: activeTheme.mode === 'dark' ? '#1E293B' : '#E2E8F0',
            }}
          >
            {/* Header */}
            <div className="text-center space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div
                className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center font-extrabold text-white text-base shadow-sm mb-2"
                style={{ backgroundColor: activeTheme.primaryColor }}
              >
                {activeTheme.logoText.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Member Portal Access
              </h3>
              <p className="text-xs text-slate-500">
                Sign in to manage your investment portfolio and withdraw funds
              </p>
            </div>

            {/* Toggle Tabs: Sign In / Create Account */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl my-5">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  authTab === 'login'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  authTab === 'register'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ================================= */}
            {/* SIGN IN FORM                     */}
            {/* ================================= */}
            {authTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number / Email
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={loginId}
                      onChange={e => setLoginId(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showLoginPwd ? 'text' : 'password'}
                      required
                      placeholder="Enter password"
                      value={loginPwd}
                      onChange={e => setLoginPwd(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPwd(!showLoginPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl font-bold text-xs text-white shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ backgroundColor: activeTheme.buttonColor }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In to Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Instant 1-Click Demo Login Button for Seamless Testing */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    1-Click Demo Account Login
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-1.5">
                    Demo credentials: <span className="font-mono">9876543210</span> / <span className="font-mono">password123</span>
                  </p>
                </div>
              </form>
            )}

            {/* ================================= */}
            {/* REGISTER FORM                    */}
            {/* ================================= */}
            {authTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number (for payout verification)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="10-digit mobile number"
                      value={regMobile}
                      onChange={e => setRegMobile(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* OTP Verification Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      OTP Verification
                    </label>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || !regMobile}
                      className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline disabled:opacity-50"
                    >
                      {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter 4-digit OTP (e.g. 1234)"
                    value={regOtp}
                    onChange={e => setRegOtp(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type={showRegPwd ? 'text' : 'password'}
                      required
                      placeholder="Min 6 chars"
                      value={regPwd}
                      onChange={e => setRegPwd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm
                    </label>
                    <input
                      type={showRegPwd ? 'text' : 'password'}
                      required
                      placeholder="Repeat password"
                      value={regConfirmPwd}
                      onChange={e => setRegConfirmPwd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NEXUS987"
                    value={regRefCode}
                    onChange={e => setRegRefCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <input
                    type="checkbox"
                    checked={regTerms}
                    onChange={e => setRegTerms(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    I agree to the Terms of Service & Privacy Policy
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl font-bold text-xs text-white shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ backgroundColor: activeTheme.buttonColor }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Free Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
