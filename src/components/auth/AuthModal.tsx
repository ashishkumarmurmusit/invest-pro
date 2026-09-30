import React, { useState } from 'react';
import { X, Lock, Phone, User as UserIcon, Shield, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../services/api';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, register, openAuthModal } = useAuth();
  const { activeTheme } = useTheme();

  // Login form state
  const [loginId, setLoginId] = useState('9876543210');
  const [loginPwd, setLoginPwd] = useState('password123');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPwd, setRegPwd] = useState('');
  const [regConfirmPwd, setRegConfirmPwd] = useState('');
  const [regRefCode, setRegRefCode] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regTerms, setRegTerms] = useState(true);

  // OTP sending state
  const [otpSent, setOtpSent] = useState(false);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSendOtp = async () => {
    if (!regMobile || regMobile.length < 8) {
      setError('Please enter a valid mobile number first.');
      return;
    }
    setError(null);
    setSendingOtp(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string; otpHint: string }>('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ mobile: regMobile }),
      });
      setOtpSent(true);
      setOtpHint(res.otpHint || '1234');
      setRegOtp(res.otpHint || '1234');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(loginId, loginPwd);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPwd !== regConfirmPwd) {
      setError('Passwords do not match.');
      return;
    }

    if (!regTerms) {
      setError('Please accept Terms & Conditions.');
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
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login('9876543210', 'password123');
    } catch (err: any) {
      setError(err.message || 'Quick demo login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickTestRegister = () => {
    setError(null);
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const randPhone = '98' + Math.floor(10000000 + Math.random() * 90000000);
    setRegFullName(`Test User #${randSuffix}`);
    setRegMobile(randPhone);
    setRegPwd('Test@123');
    setRegConfirmPwd('Test@123');
    setRegOtp('1234');
    setOtpSent(true);
    setOtpHint('1234');
    setRegTerms(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl border transition-all"
        style={{
          backgroundColor: activeTheme.cardColor,
          borderColor: activeTheme.mode === 'dark' ? '#334155' : '#E2E8F0',
        }}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
          <button
            onClick={() => {
              openAuthModal('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authModalMode === 'login'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              openAuthModal('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authModalMode === 'register'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        {authModalMode === 'login' ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mobile Number or Email
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210 or user@demo.com"
                  value={loginId}
                  onChange={e => setLoginId(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password recovery: Please contact your platform administrator or use demo password: password123')}
                  className="text-[11px] text-purple-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPwd}
                  onChange={e => setLoginPwd(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white shadow-md hover:opacity-95 active:scale-[0.98] transition-all"
              style={{ backgroundColor: activeTheme.buttonColor }}
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>

            {/* Quick Demo Login Option */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100/60 transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                Demo 1-Click Login (Alex Rivera)
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Quick Test Registration Option */}
            <div className="pb-1">
              <button
                type="button"
                onClick={handleQuickTestRegister}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-emerald-400 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Fill randomized valid credentials for instant test registration"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Fill Test Registration Data (1-Click Test)</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Smith"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={regMobile}
                    onChange={e => setRegMobile(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  {sendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
              {otpHint && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                  Verification OTP code: <span className="font-mono font-bold">{otpHint}</span> (auto-filled)
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                OTP Verification Code
              </label>
              <input
                type="text"
                placeholder="Enter 4-digit code"
                value={regOtp}
                onChange={e => setRegOtp(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 chars"
                  value={regPwd}
                  onChange={e => setRegPwd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repeat pwd"
                  value={regConfirmPwd}
                  onChange={e => setRegConfirmPwd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white uppercase font-mono"
              />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={regTerms}
                onChange={e => setRegTerms(e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                I agree to the <span className="text-purple-600 underline">Terms & Conditions</span> and confirm I am of legal age.
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white shadow-md hover:opacity-95 active:scale-[0.98] transition-all mt-2"
              style={{ backgroundColor: activeTheme.buttonColor }}
            >
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
