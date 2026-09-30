import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  ArrowDownRight,
  Building2,
  QrCode,
  Search,
  Copy,
  Check,
  Filter,
  Loader2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Wallet,
  X
} from 'lucide-react';
import { apiRequest } from '../../services/api';

export const AdminWithdrawalsView: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'upi' | 'bank'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchWithdrawals = async () => {
    try {
      const res = await apiRequest(`/admin/withdrawals?status=${statusFilter}`, {}, true);
      setWithdrawals(res.withdrawals || []);
    } catch (err: any) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUpdateStatus = async (status: 'processing' | 'completed' | 'failed') => {
    if (!selectedWithdrawal) return;
    setUpdating(true);

    try {
      await apiRequest(
        `/admin/withdrawals/${selectedWithdrawal.id}/status`,
        {
          method: 'POST',
          body: JSON.stringify({ status, remarks }),
        },
        true
      );
      showToast(
        status === 'completed'
          ? `Payout of ₹${selectedWithdrawal.finalAmount.toFixed(2)} to ${selectedWithdrawal.userName} marked as COMPLETED!`
          : status === 'failed'
          ? `Withdrawal #${selectedWithdrawal.id} rejected and ₹${selectedWithdrawal.amount.toFixed(2)} refunded to user balance.`
          : `Withdrawal marked as PROCESSING.`,
        status === 'failed' ? 'error' : 'success'
      );
      setSelectedWithdrawal(null);
      setRemarks('');
      fetchWithdrawals();
    } catch (err: any) {
      showToast(err.message || 'Failed to update withdrawal status.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = withdrawals.filter(w => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    const isUpi = w.payoutMethod === 'upi' || (!w.bankAccount?.accountNumber && w.upiId);
    if (methodFilter === 'upi' && !isUpi) return false;
    if (methodFilter === 'bank' && isUpi) return false;

    if (!search) return true;
    const s = search.toLowerCase();
    const acNum = (w.bankAccount?.accountNumber || '').toLowerCase();
    const ifsc = (w.bankAccount?.ifscCode || '').toLowerCase();
    const upi = (w.upiId || w.bankAccount?.upiId || '').toLowerCase();
    const bName = (w.bankAccount?.bankName || '').toLowerCase();
    const hName = (w.bankAccount?.accountHolderName || '').toLowerCase();
    const uName = (w.userName || '').toLowerCase();
    const uMobile = (w.userMobile || '').toLowerCase();
    const txId = (w.txId || '').toLowerCase();

    return (
      txId.includes(s) ||
      uName.includes(s) ||
      uMobile.includes(s) ||
      acNum.includes(s) ||
      ifsc.includes(s) ||
      upi.includes(s) ||
      bName.includes(s) ||
      hName.includes(s)
    );
  });

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const processingCount = withdrawals.filter(w => w.status === 'processing').length;
  const completedCount = withdrawals.filter(w => w.status === 'completed').length;
  const failedCount = withdrawals.filter(w => w.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              : 'bg-red-950/80 border-red-700 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowDownRight className="w-6 h-6 text-purple-400" />
            Withdrawal Payouts (Bank & UPI)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review user withdrawal requests, copy full Bank Account / UPI ID details, and disburse payouts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Badges */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition-all ${
                statusFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({withdrawals.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition-all flex items-center gap-1 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Clock className="w-3 h-3" /> Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition-all ${
                statusFilter === 'processing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-400 hover:text-blue-300'
              }`}
            >
              Processing ({processingCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition-all ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              Settled ({completedCount})
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition-all ${
                statusFilter === 'failed'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-red-400 hover:text-red-300'
              }`}
            >
              Failed ({failedCount})
            </button>
          </div>

          <button
            onClick={() => fetchWithdrawals()}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Payout Method Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Bank A/C No, IFSC, UPI ID, Member, Tx ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl w-full sm:w-auto text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Method:</span>
          <button
            onClick={() => setMethodFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              methodFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setMethodFilter('upi')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              methodFilter === 'upi' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3 h-3 text-purple-400" /> UPI Only
          </button>
          <button
            onClick={() => setMethodFilter('bank')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              methodFilter === 'bank' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3 h-3 text-emerald-400" /> Bank Only
          </button>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Tx ID / Date</th>
                <th className="p-4">Member Info</th>
                <th className="p-4">Payout Method & Destination Details</th>
                <th className="p-4">Gross Request</th>
                <th className="p-4">Net Payout (Disburse)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                      <span>Loading withdrawal payout requests...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    No withdrawal payout requests matching the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(w => {
                  const isUpi = w.payoutMethod === 'upi' || (!w.bankAccount?.accountNumber && w.upiId);
                  const activeUpi = w.upiId || w.bankAccount?.upiId;
                  const activeAccountNum = w.bankAccount?.accountNumber;
                  const activeIfsc = w.bankAccount?.ifscCode;
                  const activeHolder = w.bankAccount?.accountHolderName || w.userName;
                  const activeBankName = w.bankAccount?.bankName || 'Bank Account';

                  return (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Tx ID & Date */}
                      <td className="p-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{w.txId}</span>
                          <button
                            onClick={() => copyToClipboard(w.txId, `tx-${w.id}`)}
                            className="text-slate-500 hover:text-white transition-colors"
                            title="Copy Tx ID"
                          >
                            {copiedKey === `tx-${w.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(w.createdAt).toLocaleString()}
                        </div>
                      </td>

                      {/* Member Info */}
                      <td className="p-4">
                        <div className="font-bold text-white">{w.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <span>{w.userMobile}</span>
                          <button
                            onClick={() => copyToClipboard(w.userMobile, `mob-${w.id}`)}
                            className="text-slate-500 hover:text-white"
                            title="Copy Mobile"
                          >
                            {copiedKey === `mob-${w.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Destination Details (Full Account Number / UPI ID with Copy) */}
                      <td className="p-4">
                        {isUpi && activeUpi ? (
                          <div className="space-y-1 bg-purple-950/40 p-2.5 rounded-xl border border-purple-800/60 max-w-xs">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-300 uppercase">
                                <QrCode className="w-3 h-3" /> Instant UPI ID
                              </span>
                              <span className="text-[9px] font-bold text-purple-400 bg-purple-900/60 px-1.5 py-0.2 rounded">
                                GPay / PhonePe / Paytm
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-bold text-white text-xs select-all break-all">
                                {activeUpi}
                              </span>
                              <button
                                onClick={() => copyToClipboard(activeUpi, `upi-${w.id}`)}
                                className="px-2 py-1 rounded bg-purple-700 hover:bg-purple-600 text-white text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                                title="Copy UPI ID"
                              >
                                {copiedKey === `upi-${w.id}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-300" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copy
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="text-[10px] text-slate-400 truncate">
                              Payee: <span className="text-slate-200 font-semibold">{activeHolder}</span>
                            </div>
                          </div>
                        ) : activeAccountNum ? (
                          <div className="space-y-1.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 max-w-sm">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase">
                                <Building2 className="w-3 h-3" /> {activeBankName}
                              </span>
                              <span className="text-[9px] font-semibold text-slate-400 font-mono">
                                IMPS / NEFT
                              </span>
                            </div>

                            {/* Full Unmasked Account Number with Copy */}
                            <div className="flex items-center justify-between gap-2 bg-slate-900/90 px-2 py-1.5 rounded-lg border border-slate-700/80">
                              <div>
                                <div className="text-[9px] text-slate-400 uppercase font-semibold">Account Number:</div>
                                <div className="font-mono font-bold text-white text-xs select-all">
                                  {activeAccountNum}
                                </div>
                              </div>
                              <button
                                onClick={() => copyToClipboard(activeAccountNum, `acc-${w.id}`)}
                                className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                                title="Copy Account Number"
                              >
                                {copiedKey === `acc-${w.id}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-300" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copy A/C
                                  </>
                                )}
                              </button>
                            </div>

                            {/* IFSC & Holder with Copy */}
                            <div className="flex items-center justify-between text-[11px] pt-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">IFSC:</span>
                                <span className="font-mono font-bold text-purple-300">{activeIfsc}</span>
                                <button
                                  onClick={() => copyToClipboard(activeIfsc, `ifsc-${w.id}`)}
                                  className="text-slate-500 hover:text-purple-300"
                                  title="Copy IFSC"
                                >
                                  {copiedKey === `ifsc-${w.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              <span className="text-slate-300 font-medium truncate max-w-[110px]" title={activeHolder}>
                                {activeHolder}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-amber-500 text-[11px] italic">
                            No payout destination recorded
                          </div>
                        )}
                      </td>

                      {/* Gross Amount */}
                      <td className="p-4 font-mono text-slate-400">
                        <div className="font-semibold text-slate-200">₹{w.amount.toFixed(2)}</div>
                        <div className="text-[10px] text-red-400">Fee (5%): -₹{w.fee.toFixed(2)}</div>
                      </td>

                      {/* Net Payout */}
                      <td className="p-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-400 text-base">
                            ₹{w.finalAmount.toFixed(2)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(w.finalAmount.toFixed(2), `amt-${w.id}`)}
                            className="text-slate-500 hover:text-emerald-400 transition-colors"
                            title="Copy Exact Net Amount"
                          >
                            {copiedKey === `amt-${w.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 block">Pay to user</span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            w.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : w.status === 'pending'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                              : w.status === 'processing'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {w.status === 'pending' && <Clock className="w-3 h-3" />}
                          {w.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                          {w.status === 'failed' && <XCircle className="w-3 h-3" />}
                          {w.status}
                        </span>
                        {w.remarks && (
                          <div className="text-[9px] text-slate-400 mt-1 max-w-[130px] truncate" title={w.remarks}>
                            Ref: {w.remarks}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        {w.status === 'completed' || w.status === 'failed' ? (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {w.updatedAt ? new Date(w.updatedAt).toLocaleDateString() : 'Settled'}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setRemarks(w.remarks || '');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            Process Payout
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Payout Modal (Full Copy Dashboard for Admin) */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Payout Disbursement Console
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Send Payment to {selectedWithdrawal.userName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Exact Payout Amount Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-slate-950 border border-purple-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-purple-300">
                  Exact Amount to Transfer (INR):
                </span>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                  ₹{selectedWithdrawal.finalAmount.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-400">
                  Gross: ₹{selectedWithdrawal.amount.toFixed(2)} · Fee Deducted: ₹{selectedWithdrawal.fee.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(selectedWithdrawal.finalAmount.toFixed(2), 'modal-amt')
                }
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-sm transition-all"
              >
                {copiedKey === 'modal-amt' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" /> Copied Amount
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy ₹{selectedWithdrawal.finalAmount.toFixed(2)}
                  </>
                )}
              </button>
            </div>

            {/* Destination Credentials with One-Click Copy */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                User Payment Destination Details:
              </span>

              {selectedWithdrawal.payoutMethod === 'upi' ||
              (!selectedWithdrawal.bankAccount?.accountNumber && selectedWithdrawal.upiId) ? (
                /* UPI Destination Card */
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4" /> User UPI ID (VPA)
                    </span>
                    <span className="text-[10px] text-slate-400">Open GPay / PhonePe to Pay</span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="font-mono font-bold text-base text-white select-all">
                      {selectedWithdrawal.upiId || selectedWithdrawal.bankAccount?.upiId}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          selectedWithdrawal.upiId || selectedWithdrawal.bankAccount?.upiId,
                          'modal-upi'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'modal-upi' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy UPI
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-500">Registered Name:</span>
                      <div className="font-semibold text-white">{selectedWithdrawal.userName}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Registered Mobile:</span>
                      <div className="font-mono text-white">{selectedWithdrawal.userMobile}</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Bank Account Destination Card */
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" /> {selectedWithdrawal.bankAccount?.bankName}
                    </span>
                    <span className="text-[10px] text-slate-400">IMPS / NEFT Transfer</span>
                  </div>

                  {/* Account Number Box */}
                  <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                        Account Number:
                      </span>
                      <div className="font-mono font-bold text-base text-white select-all">
                        {selectedWithdrawal.bankAccount?.accountNumber || 'N/A'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          selectedWithdrawal.bankAccount?.accountNumber,
                          'modal-acc'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'modal-acc' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy A/C
                        </>
                      )}
                    </button>
                  </div>

                  {/* IFSC Code Box */}
                  <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                        IFSC Code:
                      </span>
                      <div className="font-mono font-bold text-sm text-purple-300 select-all">
                        {selectedWithdrawal.bankAccount?.ifscCode || 'N/A'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          selectedWithdrawal.bankAccount?.ifscCode,
                          'modal-ifsc'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'modal-ifsc' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy IFSC
                        </>
                      )}
                    </button>
                  </div>

                  {/* Account Holder Name */}
                  <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Account Holder Name:</span>
                      <div className="font-semibold text-white">
                        {selectedWithdrawal.bankAccount?.accountHolderName ||
                          selectedWithdrawal.userName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          selectedWithdrawal.bankAccount?.accountHolderName ||
                            selectedWithdrawal.userName,
                          'modal-holder'
                        )
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1"
                    >
                      {copiedKey === 'modal-holder' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      Copy Name
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Settlement Remarks / Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bank / UPI Settlement Reference / UTR Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. IMPS-982103984920 or UPI Ref 4291823901"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                This reference number will be visible to the user in their transaction history.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('processing')}
                  className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  Mark In Processing
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus('completed')}
                  className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Confirm Payout Complete
                </button>
              </div>

              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus('failed')}
                className="w-full py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-red-400" />
                Reject Payout & Auto-Refund ₹{selectedWithdrawal.amount.toFixed(2)} to User Balance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
