import React, { useState } from 'react';
import { X, Sparkles, UserPlus, Copy, Check, ExternalLink, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../services/api';

interface CreateTestUserModalProps {
  onClose: () => void;
  onSuccess: (newUser: any) => void;
}

export const CreateTestUserModal: React.FC<CreateTestUserModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [balance, setBalance] = useState('500');
  const [namePrefix, setNamePrefix] = useState('Test User');
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ success: boolean; message: string; user: any }>(
        '/admin/users/create-test-user',
        {
          method: 'POST',
          body: JSON.stringify({
            initialBalance: Number(balance) || 0,
            prefix: namePrefix.trim() || 'Test User',
          }),
        },
        true
      );

      setCreatedUser(res.user);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Failed to create test user.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!createdUser) return;
    const text = `=== TEST USER CREDENTIALS ===\nUser ID (Mobile): ${createdUser.mobile}\nPassword: ${createdUser.rawPassword}\nName: ${createdUser.fullName}\nBalance: ₹${createdUser.walletBalance}\nReferral Code: ${createdUser.referralCode}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestLogin = () => {
    if (!createdUser) return;
    // Call test-login endpoint to get valid session token
    apiRequest<{ success: boolean; token: string; user: any }>(
      `/admin/users/${createdUser.id}/test-login`,
      { method: 'POST' },
      true
    )
      .then(res => {
        localStorage.setItem('user_token', res.token);
        localStorage.setItem('user_data', JSON.stringify(res.user));
        window.open('/', '_blank');
      })
      .catch(err => {
        alert(err.message || 'Failed to start test session');
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Quick Test User Registration</h3>
              <p className="text-xs text-slate-400">Instantly generate a test account with simulated balance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
            {error}
          </div>
        )}

        {!createdUser ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account Name Label
              </label>
              <input
                type="text"
                required
                value={namePrefix}
                onChange={e => setNamePrefix(e.target.value)}
                placeholder="e.g. Test Investor, QA Tester"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Initial Simulated Wallet Balance (₹ INR)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[100, 500, 1000, 5000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBalance(String(amt))}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                      balance === String(amt)
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="0"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                placeholder="Custom initial balance"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Automatic Generation
              </div>
              <p className="text-[11px]">
                A randomized Indian 10-digit mobile number and safe test password will be generated automatically.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
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
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-lg transition-all flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Generate Test User Now</span>
              </button>
            </div>
          </form>
        ) : (
          /* Results Card */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-center space-y-1">
              <span className="inline-flex p-2 rounded-full bg-emerald-500/20 text-emerald-400 mb-1">
                <Check className="w-5 h-5" />
              </span>
              <h4 className="text-sm font-bold text-emerald-300">Test User Created Successfully!</h4>
              <p className="text-xs text-slate-400">
                You can use these credentials to log in or test the user panel directly.
              </p>
            </div>

            {/* Credentials Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Full Name:</span>
                <span className="text-white font-bold">{createdUser.fullName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-sans">User ID (Mobile):</span>
                <span className="text-purple-300 font-bold text-sm">{createdUser.mobile}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Password:</span>
                <span className="text-amber-300 font-bold text-sm">{createdUser.rawPassword}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Initial Balance:</span>
                <span className="text-emerald-400 font-bold text-sm">₹{createdUser.walletBalance.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Referral Code:</span>
                <span className="text-sky-300 font-bold">{createdUser.referralCode}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyAll}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={handleTestLogin}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Test Login as User</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              Done & Return to Directory
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
