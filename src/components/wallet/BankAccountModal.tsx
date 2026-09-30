import React, { useState, useEffect } from 'react';
import { X, Building2, Shield, Lock, CheckCircle2, Loader2, QrCode, Edit3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BankAccountModal: React.FC<BankAccountModalProps> = ({ isOpen, onClose }) => {
  const { user, updateBank } = useAuth();
  const { activeTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'bank' | 'upi'>('upi');
  const [holderName, setHolderName] = useState('');
  const [accountNum, setAccountNum] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user?.bankAccount) {
      setHolderName(user.bankAccount.accountHolderName || user.fullName);
      setAccountNum('');
      setIfsc(user.bankAccount.ifscCode || '');
      setBankName(user.bankAccount.bankName || '');
      setUpiId(user.bankAccount.upiId || '');
      setIsEditing(!user.bankAccount.accountNumber && !user.bankAccount.upiId);
    } else {
      setHolderName(user?.fullName || '');
      setIsEditing(true);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeTab === 'upi') {
      if (!upiId || upiId.trim().length < 4 || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g. yourname@okaxis, 9876543210@paytm).');
        return;
      }
    } else {
      if (!holderName || !accountNum || !ifsc || !bankName) {
        setError('All bank fields (Holder Name, Bank Name, A/C No, IFSC) are required.');
        return;
      }
      if (accountNum.length < 8) {
        setError('Account number must be at least 8 digits.');
        return;
      }
    }

    setSubmitting(true);

    try {
      await updateBank({
        accountHolderName: holderName.trim() || user?.fullName || '',
        accountNumber: accountNum ? accountNum.trim() : (user?.bankAccount?.accountNumber || ''),
        ifscCode: ifsc.trim().toUpperCase(),
        bankName: bankName.trim(),
        upiId: upiId.trim(),
      });
      setSavedSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to save payout destination details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: activeTheme.cardColor,
          borderColor: activeTheme.mode === 'dark' ? '#334155' : '#E2E8F0',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <Lock className="w-3 h-3" /> Payout Destination Setup
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Withdrawal Account & UPI
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Save your UPI ID or Bank Account to receive fast withdrawals.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        {savedSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Payout details securely saved & verified!
          </div>
        )}

        {/* Existing Card View */}
        {user?.bankAccount && !isEditing ? (
          <div className="space-y-4">
            {/* UPI Info Card */}
            {user.bankAccount.upiId && (
              <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5" /> Instant UPI ID
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                  {user.bankAccount.upiId}
                </div>
              </div>
            )}

            {/* Bank Info Card */}
            {user.bankAccount.accountNumber && (
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Bank Account
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Bank Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{user.bankAccount.bankName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Account Holder</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{user.bankAccount.accountHolderName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Account Number</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{user.bankAccount.maskedAccountNumber}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">IFSC Code</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{user.bankAccount.ifscCode}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit / Update Payout Details
            </button>
          </div>
        ) : (
          /* EDIT / ADD FORM WITH UPI AND BANK TABS */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setActiveTab('upi')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'upi'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" /> UPI ID (Instant)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bank')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'bank'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Bank Account
              </button>
            </div>

            {activeTab === 'upi' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your UPI ID / VPA <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={e => setUpiId(e.target.value.trim())}
                    placeholder="e.g. 9876543210@paytm, user@okaxis"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{
                      borderColor: activeTheme.mode === 'dark' ? '#334155' : '#CBD5E1',
                    }}
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Admin can directly scan or pay to this UPI ID on PhonePe / GPay / Paytm
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Holder Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={holderName}
                    onChange={e => setHolderName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{
                      borderColor: activeTheme.mode === 'dark' ? '#334155' : '#CBD5E1',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India, HDFC, ICICI"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{
                      borderColor: activeTheme.mode === 'dark' ? '#334155' : '#CBD5E1',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Account Number (Full)
                  </label>
                  <input
                    type="password"
                    required
                    value={accountNum}
                    onChange={e => setAccountNum(e.target.value.replace(/\s+/g, ''))}
                    placeholder="Enter full bank account number"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{
                      borderColor: activeTheme.mode === 'dark' ? '#334155' : '#CBD5E1',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    required
                    value={ifsc}
                    onChange={e => setIfsc(e.target.value.toUpperCase().trim())}
                    placeholder="e.g. SBIN0001234"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{
                      borderColor: activeTheme.mode === 'dark' ? '#334155' : '#CBD5E1',
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {user?.bankAccount && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                style={{ backgroundColor: activeTheme.buttonColor }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Payout Details'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
