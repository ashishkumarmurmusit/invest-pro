import React, { useState } from 'react';
import { ShieldCheck, Lock, User, KeyRound, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onExitToPublic: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onExitToPublic }) => {
  const { loginAdmin } = useAdmin();
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('SuperAdmin@123');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginAdmin(username, password, twoFactorCode);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = (role: 'super' | 'admin' | 'finance' | 'content') => {
    switch (role) {
      case 'super':
        setUsername('superadmin');
        setPassword('SuperAdmin@123');
        break;
      case 'admin':
        setUsername('admin');
        setPassword('Admin@123');
        break;
      case 'finance':
        setUsername('finance');
        setPassword('Finance@123');
        break;
      case 'content':
        setUsername('content');
        setPassword('Content@123');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 mx-auto flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-purple-400">
            Internal Operations Console
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">Private Admin Gateway</h1>
          <p className="text-xs text-slate-400">
            Authorized personnel only. All access attempts are recorded in the audit log.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Username or Work Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                placeholder="superadmin or admin@nexus.io"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Two-Factor Authentication (Optional Simulation)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="6-digit OTP code (Optional or 123456)"
                value={twoFactorCode}
                onChange={e => setTwoFactorCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating Role...' : 'Access Admin Dashboard'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Role Fill Presets for seamless testing */}
        <div className="pt-2 border-t border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2 text-center">
            Quick Test Admin Credentials
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickRole('super')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-purple-300 font-semibold"
            >
              👑 Super Admin
              <span className="block text-[10px] text-slate-400 font-normal">Full privileges</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('finance')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-emerald-300 font-semibold"
            >
              💳 Finance Admin
              <span className="block text-[10px] text-slate-400 font-normal">Recharge & Payouts</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('content')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-indigo-300 font-semibold"
            >
              🎨 Content Admin
              <span className="block text-[10px] text-slate-400 font-normal">Products & Ads</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('admin')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-cyan-300 font-semibold"
            >
              🛠 Operations Admin
              <span className="block text-[10px] text-slate-400 font-normal">Users & General</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onExitToPublic}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Return to Public Website
          </button>
        </div>
      </div>
    </div>
  );
};
