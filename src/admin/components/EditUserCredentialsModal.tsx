import React, { useState } from 'react';
import { X, Key, Lock, Phone, Mail, User, ShieldAlert, Check, Copy, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { apiRequest } from '../../services/api';

interface EditUserCredentialsModalProps {
  user: {
    id: string;
    fullName: string;
    mobile: string;
    email: string;
    walletBalance: number;
    isActive: boolean;
  };
  onClose: () => void;
  onSuccess: (updatedUser: any) => void;
}

export const EditUserCredentialsModal: React.FC<EditUserCredentialsModalProps> = ({
  user,
  onClose,
  onSuccess,
}) => {
  const [mobile, setMobile] = useState(user.mobile);
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoginLoading, setTestLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGeneratePassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const generated = `User@${randomDigits}`;
    setNewPassword(generated);
    setShowPassword(true);
  };

  const handleCopyCredentials = () => {
    const text = `User ID (Mobile): ${mobile}\nPassword: ${newPassword || '[Unchanged]'}\nName: ${fullName}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await apiRequest<{ success: boolean; message: string; user: any }>(
        `/admin/users/${user.id}/update-credentials`,
        {
          method: 'POST',
          body: JSON.stringify({
            mobile,
            fullName,
            email,
            newPassword: newPassword.trim() || undefined,
          }),
        },
        true
      );

      setSuccessMsg(res.message || 'Credentials updated successfully!');
      setTimeout(() => {
        onSuccess(res.user);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update user credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setTestLoginLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ success: boolean; token: string; user: any }>(
        `/admin/users/${user.id}/test-login`,
        { method: 'POST' },
        true
      );
      // Store user token to simulate login as this user
      localStorage.setItem('user_token', res.token);
      localStorage.setItem('user_data', JSON.stringify(res.user));
      // Open main user app in a new tab
      window.open('/', '_blank');
      setSuccessMsg(`Test session generated for ${res.user.fullName}! User view opened in new tab.`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate test login session.');
    } finally {
      setTestLoginLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Change User ID & Password</h3>
              <p className="text-xs text-slate-400">Update login ID, mobile number, or set a new password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Quick Info Badge */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Account Target</span>
            <span className="font-semibold text-white">{user.fullName}</span>
            <span className="text-slate-500 text-[11px] block font-mono">UID: {user.id}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Balance</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              ₹{user.walletBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Mobile / User Login ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-purple-400" /> User ID / Mobile Number (Login ID)
              </span>
              <span className="text-[10px] text-purple-400 font-normal">Primary Login Credential</span>
            </label>
            <input
              type="text"
              required
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" /> Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Password Section */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> New Password
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3" /> Auto-Generate
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep existing password"
                className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-600 placeholder:font-sans placeholder:text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Tip: If you don't want to change the password, leave this field empty.
            </p>
          </div>

          {/* Quick Copy Credentials button if password changed */}
          {newPassword && (
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-amber-300">
                New password entered: <strong className="font-mono text-white">{newPassword}</strong>
              </span>
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold transition-all"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-3">
            <button
              type="button"
              onClick={handleTestLogin}
              disabled={testLoginLoading}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-sky-950 hover:bg-sky-900 border border-sky-800/80 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              title="Test Login as this User directly in user panel"
            >
              {testLoginLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              <span>Test Login as User</span>
            </button>

            <div className="flex-1 flex gap-2 w-full justify-end">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Credentials'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
