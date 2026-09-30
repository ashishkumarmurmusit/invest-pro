import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, Building2, AlertCircle, CheckCircle2, ShieldCheck, Loader2, QrCode, ArrowRight, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../services/api';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBankModal: () => void;
  onSuccess?: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onOpenBankModal,
  onSuccess,
}) => {
  const { user, reloadProfile } = useAuth();
  const { activeTheme } = useTheme();

  const [amount, setAmount] = useState('100');
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    if (user?.bankAccount?.upiId) {
      setUpiId(user.bankAccount.upiId);
      setPayoutMethod('upi');
    } else if (user?.bankAccount?.accountNumber) {
      setPayoutMethod('bank');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;
  const feePercent = 5; // 5% fee
  const fee = Number(((numAmount * feePercent) / 100).toFixed(2));
  const finalAmount = Math.max(0, Number((numAmount - fee).toFixed(2)));

  const handleClose = () => {
    setError(null);
    setSuccessData(null);
    onClose();
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (numAmount < 100) {
      setError('Minimum withdrawal amount is ₹100.00.');
      return;
    }

    if (!user || numAmount > user.walletBalance) {
      setError(`Insufficient balance. You currently have ₹${user?.walletBalance.toFixed(2) || '0.00'}.`);
      return;
    }

    if (payoutMethod === 'upi') {
      const activeUpi = (upiId || user?.bankAccount?.upiId || '').trim();
      if (!activeUpi || !activeUpi.includes('@')) {
        setError('Please enter a valid UPI ID (e.g. 9876543210@paytm, user@okaxis) to receive payout.');
        return;
      }
    } else {
      if (!user?.bankAccount?.accountNumber) {
        setError('Please add your Bank Account details before requesting bank transfer.');
        return;
      }
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest('/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amount: numAmount,
          payoutMethod,
          upiId: upiId.trim(),
        }),
      });
      setSuccessData(res.withdrawal);
      await reloadProfile();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Withdrawal request failed.');
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
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {successData ? (
          /* SUCCESS VIEW */
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                Pending Admin Disbursement
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                Withdrawal Submitted!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your withdrawal request has been routed to the admin queue. Admin will disburse ₹{successData.finalAmount.toFixed(2)} to your {successData.payoutMethod === 'upi' ? `UPI ID (${successData.upiId})` : 'Bank Account'}.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-purple-600">{successData.txId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payout Method:</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase">
                  {successData.payoutMethod === 'upi' ? `⚡ UPI (${successData.upiId})` : `🏦 Bank (${successData.bankAccount?.bankName})`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Gross:</span>
                <span className="font-mono font-bold">₹{successData.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Platform Fee (5%):</span>
                <span className="font-mono text-red-500">-₹{successData.fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5 dark:border-slate-800 font-bold">
                <span className="text-slate-700 dark:text-slate-300">Net Receivable Amount:</span>
                <span className="font-mono text-emerald-600 text-sm">
                  ₹{successData.finalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href="https://t.me/investpro_india"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl border border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Track Payout on Official Telegram Support</span>
              </a>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 rounded-xl font-bold text-xs text-white shadow-sm hover:opacity-95"
                style={{ backgroundColor: activeTheme.buttonColor }}
              >
                Done / Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                Direct Cash Outflow
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Request Payout Disbursement
              </h3>
              <p className="text-xs text-slate-500">
                Receive instant payouts to your UPI ID or Bank Account
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Wallet Available Balance */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">Available Wallet Balance:</span>
              <span className="text-sm font-bold font-mono text-emerald-600">
                ₹{user?.walletBalance.toFixed(2) || '0.00'}
              </span>
            </div>

            {/* Payout Method Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Payout Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('upi')}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2 transition-all ${
                    payoutMethod === 'upi'
                      ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 ring-2 ring-purple-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">1. Instant UPI ID</div>
                    <div className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutMethod('bank')}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2 transition-all ${
                    payoutMethod === 'bank'
                      ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 ring-2 ring-purple-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">2. Bank Transfer</div>
                    <div className="text-[10px] text-slate-500">IMPS / NEFT A/C</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Dynamic Destination Field */}
            {payoutMethod === 'upi' ? (
              <div className="space-y-1.5 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white">
                    Receiver UPI ID (VPA) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={onOpenBankModal}
                    className="text-[10px] font-bold text-purple-600 hover:underline"
                  >
                    Manage Payouts
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={e => setUpiId(e.target.value.trim())}
                  placeholder="e.g. 9876543210@paytm or user@okaxis"
                  className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            ) : (
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Destination Bank</span>
                  <button
                    type="button"
                    onClick={onOpenBankModal}
                    className="text-[10px] font-bold text-purple-600 hover:underline"
                  >
                    {user?.bankAccount?.accountNumber ? 'Change Account' : '+ Add Bank Account'}
                  </button>
                </div>
                {user?.bankAccount?.accountNumber ? (
                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-white">{user.bankAccount.bankName}</div>
                    <div className="font-mono text-purple-600 dark:text-purple-400">{user.bankAccount.maskedAccountNumber} ({user.bankAccount.ifscCode})</div>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-600">
                    No bank account added. Click "+ Add Bank Account" above.
                  </div>
                )}
              </div>
            )}

            {/* Withdrawal Amount Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Withdrawal Amount (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                  ₹
                </span>
                <input
                  type="number"
                  min="100"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount (min ₹100)"
                  className="w-full pl-8 pr-4 py-2.5 rounded-2xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{
                    borderColor: activeTheme.mode === 'dark' ? '#334155' : '#CBD5E1',
                  }}
                />
              </div>
            </div>

            {/* Fee and Net Calculation */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Platform Handling Fee (5%):</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">₹{fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 dark:border-slate-800 font-bold">
                <span>Net Disbursement Payout:</span>
                <span className="font-mono text-emerald-600 text-sm">
                  ₹{finalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || (user ? numAmount > user.walletBalance : false)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: activeTheme.buttonColor }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  Confirm Withdrawal (₹{numAmount.toFixed(2)})
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
