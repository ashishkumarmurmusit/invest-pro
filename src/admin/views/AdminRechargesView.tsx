import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  AlertTriangle,
  Eye,
  Loader2,
  Sparkles,
  QrCode,
  Settings,
  CreditCard,
  Save,
  Copy,
  Upload,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Sliders,
  DollarSign,
  HelpCircle,
  Globe
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { RechargeRequest } from '../../types';

export const AdminRechargesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'gateway'>('queue');
  const [recharges, setRecharges] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Approval & Rejection Modals
  const [approveModalRecharge, setApproveModalRecharge] = useState<RechargeRequest | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Gateway & Custom UPI Configuration State
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingGateway, setSavingGateway] = useState(false);
  const [gatewaySettings, setGatewaySettings] = useState({
    paymentGatewayMode: 'all_channels',
    // UPI 1
    upi1Enabled: true,
    upi1Name: 'UPI 1 (Custom UPI QR)',
    upiId: 'payment.nexus@okaxis',
    upiPayeeName: 'Nexus Official Payments',
    qrCodeUrl: '',
    upi1Notice: 'Pay via PhonePe, GPay, Paytm, BHIM and submit your 12-digit UTR number.',
    // UPI 2
    upi2Enabled: true,
    upi2Name: 'UPI 2 (Razorpay Instant)',
    razorpayKeyId: '',
    razorpayKeySecret: '',
    upi2Notice: 'Automated 1-click UPI & Card payment with instant wallet credit.',
    // UPI 3
    upi3Enabled: true,
    upi3Name: 'UPI 3 (Custom Web API Gateway)',
    customWebApiUrl: 'https://api.upi-gateway.example/v1/create-order',
    customWebApiMerchantKey: '',
    customWebApiSecret: '',
    customGatewayWebhookUrl: '',
    upi3Notice: 'Fast Web API gateway redirect with automated real-time verification.',
    // UPI 4
    upi4Enabled: true,
    upi4Name: 'UPI 4 (Direct Fast Channel)',
    upi4UpiId: 'fastpay.nexus@okaxis',
    upi4PayeeName: 'Nexus FastPay Merchant',
    upi4QrCodeUrl: '',
    upi4Notice: 'Scan directly using any UPI app and submit 12-digit UTR for quick credit.',
    // UPI 5
    upi5Enabled: true,
    upi5Name: 'UPI 5 (Merchant VIP Gateway)',
    upi5UpiId: 'vip.nexus@icici',
    upi5PayeeName: 'Nexus VIP Treasury',
    upi5QrCodeUrl: '',
    upi5Notice: 'VIP high-priority deposit corridor with rapid manual/automated verification.',
    // UPI 6
    upi6Enabled: true,
    upi6Name: 'UPI 6 (Express Backup Gateway)',
    upi6UpiId: 'express.nexus@upi',
    upi6PayeeName: 'Nexus Express Gateway',
    upi6QrCodeUrl: '',
    upi6Notice: '24/7 dedicated high-availability backup UPI payment channel.',
    // Limits
    minRecharge: 50,
    maxRecharge: 500000,
    rechargeNotice: 'Select UPI 1 for direct QR scan, UPI 2 for instant Razorpay, or UPI 3 for Web API gateway.'
  });

  const fetchRecharges = async () => {
    try {
      const res = await apiRequest<{ recharges: RechargeRequest[] }>('/admin/recharges', {}, true);
      setRecharges(res.recharges || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await apiRequest<{ settings: any }>('/admin/settings', {}, true);
      if (res.settings) {
        setGatewaySettings(prev => ({
          ...prev,
          paymentGatewayMode: res.settings.paymentGatewayMode || 'all_channels',
          upi1Enabled: res.settings.upi1Enabled !== false,
          upi1Name: res.settings.upi1Name || prev.upi1Name,
          upiId: res.settings.upiId || 'payment.nexus@okaxis',
          upiPayeeName: res.settings.upiPayeeName || 'Nexus Official Payments',
          qrCodeUrl: res.settings.qrCodeUrl || '',
          upi1Notice: res.settings.upi1Notice || prev.upi1Notice,
          upi2Enabled: res.settings.upi2Enabled !== false,
          upi2Name: res.settings.upi2Name || prev.upi2Name,
          razorpayKeyId: res.settings.razorpayKeyId || '',
          razorpayKeySecret: res.settings.razorpayKeySecret || '',
          upi2Notice: res.settings.upi2Notice || prev.upi2Notice,
          upi3Enabled: res.settings.upi3Enabled !== false,
          upi3Name: res.settings.upi3Name || prev.upi3Name,
          customWebApiUrl: res.settings.customWebApiUrl || 'https://api.upi-gateway.example/v1/create-order',
          customWebApiMerchantKey: res.settings.customWebApiMerchantKey || '',
          customWebApiSecret: res.settings.customWebApiSecret || '',
          customGatewayWebhookUrl: res.settings.customGatewayWebhookUrl || '',
          upi3Notice: res.settings.upi3Notice || prev.upi3Notice,
          upi4Enabled: res.settings.upi4Enabled !== undefined ? Boolean(res.settings.upi4Enabled) : prev.upi4Enabled,
          upi4Name: res.settings.upi4Name || prev.upi4Name,
          upi4UpiId: res.settings.upi4UpiId || prev.upi4UpiId,
          upi4PayeeName: res.settings.upi4PayeeName || prev.upi4PayeeName,
          upi4QrCodeUrl: res.settings.upi4QrCodeUrl || '',
          upi4Notice: res.settings.upi4Notice || prev.upi4Notice,
          upi5Enabled: res.settings.upi5Enabled !== undefined ? Boolean(res.settings.upi5Enabled) : prev.upi5Enabled,
          upi5Name: res.settings.upi5Name || prev.upi5Name,
          upi5UpiId: res.settings.upi5UpiId || prev.upi5UpiId,
          upi5PayeeName: res.settings.upi5PayeeName || prev.upi5PayeeName,
          upi5QrCodeUrl: res.settings.upi5QrCodeUrl || '',
          upi5Notice: res.settings.upi5Notice || prev.upi5Notice,
          upi6Enabled: res.settings.upi6Enabled !== undefined ? Boolean(res.settings.upi6Enabled) : prev.upi6Enabled,
          upi6Name: res.settings.upi6Name || prev.upi6Name,
          upi6UpiId: res.settings.upi6UpiId || prev.upi6UpiId,
          upi6PayeeName: res.settings.upi6PayeeName || prev.upi6PayeeName,
          upi6QrCodeUrl: res.settings.upi6QrCodeUrl || '',
          upi6Notice: res.settings.upi6Notice || prev.upi6Notice,
          minRecharge: res.settings.minRecharge || 50,
          maxRecharge: res.settings.maxRecharge || 500000,
          rechargeNotice: res.settings.rechargeNotice || prev.rechargeNotice
        }));
      }
    } catch {
      // ignore
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecharges();
    fetchSettings();
  }, []);

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

  const handleApprove = async () => {
    if (!approveModalRecharge) return;

    const id = approveModalRecharge.id;
    const amount = approveModalRecharge.amount;
    const userName = approveModalRecharge.userName;

    setActionLoading(id);
    try {
      await apiRequest(`/admin/recharges/${id}/approve`, {
        method: 'POST',
      }, true);
      showToast(`Recharge of ₹${amount.toFixed(2)} for ${userName} approved successfully! User wallet credited.`, 'success');
      setApproveModalRecharge(null);
      fetchRecharges();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve recharge', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalId) return;

    setActionLoading(rejectModalId);
    try {
      await apiRequest(`/admin/recharges/${rejectModalId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ remarks: rejectReason }),
      }, true);
      showToast('Recharge request rejected and user notified.', 'success');
      setRejectModalId(null);
      setRejectReason('');
      fetchRecharges();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject recharge', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewaySettings.upiId) {
      showToast('Please specify a valid UPI ID for UPI 1.', 'error');
      return;
    }

    setSavingGateway(true);
    try {
      await apiRequest('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(gatewaySettings),
      }, true);
      showToast('UPI 1, UPI 2 (Razorpay), and UPI 3 (Web API) Gateway settings updated successfully!', 'success');
      fetchSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to update gateway settings', 'error');
    } finally {
      setSavingGateway(false);
    }
  };

  const filtered = recharges.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.txId.toLowerCase().includes(s) ||
      r.userName.toLowerCase().includes(s) ||
      r.userMobile.includes(s) ||
      (r.utrNumber && r.utrNumber.toLowerCase().includes(s))
    );
  });

  const pendingCount = recharges.filter(r => r.status === 'pending').length;
  const completedCount = recharges.filter(r => r.status === 'completed').length;
  const rejectedCount = recharges.filter(r => r.status === 'rejected').length;

  const dynamicQrLink = gatewaySettings.upiId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
        `upi://pay?pa=${gatewaySettings.upiId}&pn=${encodeURIComponent(
          gatewaySettings.upiPayeeName || 'Nexus'
        )}&cu=INR`
      )}`
    : '';

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
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

      {/* Header & Main Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-purple-400" />
            Recharge & Gateway Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verify user recharge payment proofs & configure custom UPI IDs, Razorpay, and payment gateway options
          </p>
        </div>

        {/* Top View Toggle Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Verified Recharge Queue
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gateway')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'gateway'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            UPI & Gateway Setup
          </button>

          <button
            onClick={() => {
              fetchRecharges();
              fetchSettings();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RECHARGE VERIFICATION QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'queue' && (
        <div className="space-y-5">
          {/* Quick Stats & Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by UTR, Member, Mobile, Tx ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Status Filter Badges */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All ({recharges.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Pending ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved ({completedCount})
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'rejected'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-red-400 hover:text-red-300'
                }`}
              >
                Rejected ({rejectedCount})
              </button>
            </div>
          </div>

          {/* Recharges Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Tx ID / Date</th>
                    <th className="p-4">Member Info</th>
                    <th className="p-4">Recharge Amount</th>
                    <th className="p-4">Submitted UTR / Proof</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                          <span>Loading recharge records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500">
                        No recharge requests found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(r => (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Tx ID */}
                        <td className="p-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{r.txId}</span>
                            <button
                              onClick={() => copyToClipboard(r.txId, `tx-${r.id}`)}
                              className="text-slate-500 hover:text-white"
                              title="Copy Tx ID"
                            >
                              {copiedKey === `tx-${r.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(r.createdAt).toLocaleString()}
                          </div>
                        </td>

                        {/* Member */}
                        <td className="p-4">
                          <div className="font-bold text-white">{r.userName}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.userMobile}</div>
                        </td>

                        {/* Amount */}
                        <td className="p-4 font-mono font-bold text-emerald-400 text-base">
                          +₹{r.amount.toFixed(2)}
                        </td>

                        {/* UTR & Screenshot */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {r.utrNumber ? (
                              <div className="flex items-center gap-1 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-800/60">
                                <span className="font-mono font-bold text-purple-300 text-xs select-all">
                                  {r.utrNumber}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(r.utrNumber!, `utr-${r.id}`)}
                                  className="text-purple-400 hover:text-white"
                                  title="Copy UTR"
                                >
                                  {copiedKey === `utr-${r.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">No UTR Submitted</span>
                            )}

                            {r.proofImage && (
                              <button
                                onClick={() => setSelectedProofImg(r.proofImage!)}
                                className="p-1 text-purple-300 hover:text-white bg-purple-900/60 hover:bg-purple-800 rounded-md transition-colors flex items-center gap-1 text-[10px] font-semibold"
                                title="View Screenshot"
                              >
                                <Eye className="w-3.5 h-3.5" /> Proof
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {r.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-bold text-[10px]">
                              <Clock className="w-3 h-3 animate-pulse" /> PENDING REVIEW
                            </span>
                          )}
                          {r.status === 'completed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> APPROVED & CREDITED
                            </span>
                          )}
                          {r.status === 'rejected' && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-950 text-red-400 border border-red-800 font-bold text-[10px]">
                                <XCircle className="w-3 h-3" /> REJECTED
                              </span>
                              {r.adminRemarks && (
                                <div className="text-[9px] text-slate-400 mt-1 max-w-[140px] truncate" title={r.adminRemarks}>
                                  {r.adminRemarks}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Verification Action */}
                        <td className="p-4 text-right">
                          {r.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={actionLoading === r.id}
                                onClick={() => setApproveModalRecharge(r)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-sm flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {actionLoading === r.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                Approve & Credit
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading === r.id}
                                onClick={() => {
                                  setRejectModalId(r.id);
                                  setRejectReason('');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs shadow-sm flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">
                              {r.verifiedAt ? new Date(r.verifiedAt).toLocaleDateString() : 'Settled'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: UPI & PAYMENT GATEWAY CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'gateway' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Gateway Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveGateway} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5" /> Multi-Channel UPI Gateway Configuration
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    UPI Gateway Setup (Options 1 to 6)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure and customize all recharge options. Enable or disable any channel at will.
                  </p>
                </div>

                {/* Quick Global Toggles */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setGatewaySettings(prev => ({
                        ...prev,
                        upi1Enabled: true,
                        upi2Enabled: true,
                        upi3Enabled: true,
                        upi4Enabled: true,
                        upi5Enabled: true,
                        upi6Enabled: true,
                      }))
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    Enable All (1-6)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGatewaySettings(prev => ({
                        ...prev,
                        upi2Enabled: false,
                        upi3Enabled: false,
                        upi4Enabled: false,
                        upi5Enabled: false,
                        upi6Enabled: false,
                      }))
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    Only Keep Option 1
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Currently Active Channels in User Modal:</span>
                <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                  {[
                    gatewaySettings.upi1Enabled,
                    gatewaySettings.upi2Enabled,
                    gatewaySettings.upi3Enabled,
                    gatewaySettings.upi4Enabled,
                    gatewaySettings.upi5Enabled,
                    gatewaySettings.upi6Enabled,
                  ].filter(Boolean).length} of 6 Enabled
                </span>
              </div>

              {/* 1. CHANNEL 1: UPI 1 (Custom UPI QR) */}
              <div className={`p-4 rounded-2xl border transition-all space-y-4 ${
                gatewaySettings.upi1Enabled
                  ? 'bg-slate-950 border-purple-900/50'
                  : 'bg-slate-950/60 border-slate-800 opacity-80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                    <QrCode className="w-4 h-4 text-purple-400" />
                    Option 1: UPI 1 (Custom UPI QR & Manual Verification)
                  </div>
                  <button
                    type="button"
                    onClick={() => setGatewaySettings(p => ({ ...p, upi1Enabled: !p.upi1Enabled }))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      gatewaySettings.upi1Enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80 shadow-xs'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                    title={gatewaySettings.upi1Enabled ? 'Click to Disable Option 1' : 'Click to Enable Option 1'}
                  >
                    <span className={`w-2 h-2 rounded-full ${gatewaySettings.upi1Enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>{gatewaySettings.upi1Enabled ? 'Active (Enabled)' : 'Disabled (Hidden)'}</span>
                  </button>
                </div>

                {!gatewaySettings.upi1Enabled && (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-xs">
                    ⚠️ Option 1 is disabled. Users will not see this option in the recharge modal.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Receiver UPI ID (VPA) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required={gatewaySettings.upi1Enabled}
                      value={gatewaySettings.upiId}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, upiId: e.target.value.trim() })}
                      placeholder="e.g. payment.nexus@okaxis, receiver@paytm"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Money will be transferred to this UPI ID by users.
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Payee Business / Merchant Name
                    </label>
                    <input
                      type="text"
                      value={gatewaySettings.upiPayeeName}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, upiPayeeName: e.target.value })}
                      placeholder="e.g. Nexus Official Payments"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Appears as receiver name in PhonePe / GPay
                    </span>
                  </div>
                </div>

                {/* Custom QR Code Image Override */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="block text-slate-300 font-semibold text-xs">
                    Custom QR Code Image URL (Optional)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      value={gatewaySettings.qrCodeUrl}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, qrCodeUrl: e.target.value })}
                      placeholder="Leave empty to auto-generate dynamic QR from UPI ID"
                      className="flex-1 w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    />
                    <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload QR</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = event => {
                              if (event.target?.result) {
                                setGatewaySettings({
                                  ...gatewaySettings,
                                  qrCodeUrl: String(event.target.result),
                                });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. CHANNEL 2: UPI 2 (RAZORPAY AUTOMATED GATEWAY) */}
              <div className={`p-4 rounded-2xl border transition-all space-y-4 ${
                gatewaySettings.upi2Enabled
                  ? 'bg-slate-950 border-blue-900/50'
                  : 'bg-slate-950/60 border-slate-800 opacity-80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    Option 2: UPI 2 (Razorpay Fast Instant Gateway)
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGatewaySettings({
                          ...gatewaySettings,
                          razorpayKeyId: 'rzp_test_1DP5mmOlF5G5ag',
                          razorpayKeySecret: 'sample_secret_key_123',
                        });
                      }}
                      className="text-[10px] text-blue-400 hover:text-blue-300 underline font-semibold cursor-pointer"
                    >
                      + Load Test Key
                    </button>

                    <button
                      type="button"
                      onClick={() => setGatewaySettings(p => ({ ...p, upi2Enabled: !p.upi2Enabled }))}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                        gatewaySettings.upi2Enabled
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80 shadow-xs'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                      title={gatewaySettings.upi2Enabled ? 'Click to Disable Option 2' : 'Click to Enable Option 2'}
                    >
                      <span className={`w-2 h-2 rounded-full ${gatewaySettings.upi2Enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      <span>{gatewaySettings.upi2Enabled ? 'Active (Enabled)' : 'Disabled (Hidden)'}</span>
                    </button>
                  </div>
                </div>

                {!gatewaySettings.upi2Enabled && (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-xs">
                    ⚠️ Option 2 is disabled. Users will not see Razorpay in the recharge modal.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span>Razorpay Key ID</span>
                      {gatewaySettings.razorpayKeyId ? (
                        <span className="text-emerald-400 text-[10px] font-bold">✓ Ready</span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Optional</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={gatewaySettings.razorpayKeyId}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, razorpayKeyId: e.target.value.trim() })}
                      placeholder="e.g. rzp_live_xxxxxxxx or rzp_test_xxxx"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Enables automated instant wallet deposits without manual UTR checking
                    </span>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Razorpay Key Secret</label>
                    <input
                      type="password"
                      value={gatewaySettings.razorpayKeySecret}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, razorpayKeySecret: e.target.value.trim() })}
                      placeholder="••••••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Used for backend automated signature verification
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. CHANNEL 3: UPI 3 (CUSTOM WEB API GATEWAY) */}
              <div className={`p-4 rounded-2xl border transition-all space-y-4 ${
                gatewaySettings.upi3Enabled
                  ? 'bg-slate-950 border-emerald-900/50'
                  : 'bg-slate-950/60 border-slate-800 opacity-80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    Option 3: UPI 3 (Custom Web API Gateway)
                  </div>
                  <button
                    type="button"
                    onClick={() => setGatewaySettings(p => ({ ...p, upi3Enabled: !p.upi3Enabled }))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      gatewaySettings.upi3Enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80 shadow-xs'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                    title={gatewaySettings.upi3Enabled ? 'Click to Disable Option 3' : 'Click to Enable Option 3'}
                  >
                    <span className={`w-2 h-2 rounded-full ${gatewaySettings.upi3Enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>{gatewaySettings.upi3Enabled ? 'Active (Enabled)' : 'Disabled (Hidden)'}</span>
                  </button>
                </div>

                {!gatewaySettings.upi3Enabled && (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-xs">
                    ⚠️ Option 3 is disabled. Users will not see Web API Gateway in the recharge modal.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">
                      Custom Web API Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={gatewaySettings.customWebApiUrl}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, customWebApiUrl: e.target.value.trim() })}
                      placeholder="https://api.upi-gateway.example/v1/create-order"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Endpoint or payment gateway checkout URL for external merchant API
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Merchant / API Client Key
                    </label>
                    <input
                      type="text"
                      value={gatewaySettings.customWebApiMerchantKey}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, customWebApiMerchantKey: e.target.value.trim() })}
                      placeholder="e.g. CF_KEY_xxxx or API_MID_992"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      API Secret / Webhook URL
                    </label>
                    <input
                      type="text"
                      value={gatewaySettings.customGatewayWebhookUrl}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, customGatewayWebhookUrl: e.target.value.trim() })}
                      placeholder="https://api.yourdomain.com/webhook"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 4. CHANNEL 4: UPI 4 (DIRECT FAST CHANNEL) */}
              <div className={`p-4 rounded-2xl border transition-all space-y-4 ${
                gatewaySettings.upi4Enabled
                  ? 'bg-slate-950 border-amber-900/50'
                  : 'bg-slate-950/60 border-slate-800 opacity-80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    Option 4: UPI 4 (Direct Fast Channel)
                  </div>
                  <button
                    type="button"
                    onClick={() => setGatewaySettings(p => ({ ...p, upi4Enabled: !p.upi4Enabled }))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      gatewaySettings.upi4Enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80 shadow-xs'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                    title={gatewaySettings.upi4Enabled ? 'Click to Disable Option 4' : 'Click to Enable Option 4'}
                  >
                    <span className={`w-2 h-2 rounded-full ${gatewaySettings.upi4Enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>{gatewaySettings.upi4Enabled ? 'Active (Enabled)' : 'Disabled (Hidden)'}</span>
                  </button>
                </div>

                {!gatewaySettings.upi4Enabled && (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-xs">
                    ⚠️ Option 4 is disabled. Users will not see this fast channel in the recharge modal.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Receiver UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={gatewaySettings.upi4UpiId}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, upi4UpiId: e.target.value.trim() })}
                      placeholder="e.g. fastpay.nexus@okaxis"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Payee Business Name
                    </label>
                    <input
                      type="text"
                      value={gatewaySettings.upi4PayeeName}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, upi4PayeeName: e.target.value })}
                      placeholder="e.g. Nexus FastPay Merchant"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 5. CHANNEL 5: UPI 5 (MERCHANT VIP GATEWAY) */}
              <div className={`p-4 rounded-2xl border transition-all space-y-4 ${
                gatewaySettings.upi5Enabled
                  ? 'bg-slate-950 border-teal-900/50'
                  : 'bg-slate-950/60 border-slate-800 opacity-80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    Option 5: UPI 5 (Merchant VIP Gateway)
                  </div>
                  <button
                    type="button"
                    onClick={() => setGatewaySettings(p => ({ ...p, upi5Enabled: !p.upi5Enabled }))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      gatewaySettings.upi5Enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80 shadow-xs'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                    title={gatewaySettings.upi5Enabled ? 'Click to Disable Option 5' : 'Click to Enable Option 5'}
                  >
                    <span className={`w-2 h-2 rounded-full ${gatewaySettings.upi5Enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>{gatewaySettings.upi5Enabled ? 'Active (Enabled)' : 'Disabled (Hidden)'}</span>
                  </button>
                </div>

                {!gatewaySettings.upi5Enabled && (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-xs">
                    ⚠️ Option 5 is disabled. Users will not see VIP Gateway in the recharge modal.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Receiver UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={gatewaySettings.upi5UpiId}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, upi5UpiId: e.target.value.trim() })}
                      placeholder="e.g. vip.nexus@icici"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      VIP Treasury Name
                    </label>
                    <input
                      type="text"
                      value={gatewaySettings.upi5PayeeName}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, upi5PayeeName: e.target.value })}
                      placeholder="e.g. Nexus VIP Treasury"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* 6. CHANNEL 6: UPI 6 (EXPRESS BACKUP GATEWAY) */}
              <div className={`p-4 rounded-2xl border transition-all space-y-4 ${
                gatewaySettings.upi6Enabled
                  ? 'bg-slate-950 border-rose-900/50'
                  : 'bg-slate-950/60 border-slate-800 opacity-80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    Option 6: UPI 6 (Express Backup Gateway)
                  </div>
                  <button
                    type="button"
                    onClick={() => setGatewaySettings(p => ({ ...p, upi6Enabled: !p.upi6Enabled }))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      gatewaySettings.upi6Enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80 shadow-xs'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                    title={gatewaySettings.upi6Enabled ? 'Click to Disable Option 6' : 'Click to Enable Option 6'}
                  >
                    <span className={`w-2 h-2 rounded-full ${gatewaySettings.upi6Enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>{gatewaySettings.upi6Enabled ? 'Active (Enabled)' : 'Disabled (Hidden)'}</span>
                  </button>
                </div>

                {!gatewaySettings.upi6Enabled && (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-xs">
                    ⚠️ Option 6 is disabled. Users will not see Express Backup in the recharge modal.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Backup Receiver UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={gatewaySettings.upi6UpiId}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, upi6UpiId: e.target.value.trim() })}
                      placeholder="e.g. express.nexus@upi"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Express Merchant Name
                    </label>
                    <input
                      type="text"
                      value={gatewaySettings.upi6PayeeName}
                      onChange={e => setGatewaySettings({ ...gatewaySettings, upi6PayeeName: e.target.value })}
                      placeholder="e.g. Nexus Express Gateway"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Limits & User Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Minimum Recharge (₹)</label>
                  <input
                    type="number"
                    value={gatewaySettings.minRecharge}
                    onChange={e => setGatewaySettings({ ...gatewaySettings, minRecharge: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Maximum Recharge (₹)</label>
                  <input
                    type="number"
                    value={gatewaySettings.maxRecharge}
                    onChange={e => setGatewaySettings({ ...gatewaySettings, maxRecharge: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingGateway}
                  className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingGateway ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save All UPI Gateway Settings (Options 1 - 6)
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Mobile UI Preview for User Recharge */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-purple-400" /> Live User Payment Preview
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {[
                    gatewaySettings.upi1Enabled,
                    gatewaySettings.upi2Enabled,
                    gatewaySettings.upi3Enabled,
                    gatewaySettings.upi4Enabled,
                    gatewaySettings.upi5Enabled,
                    gatewaySettings.upi6Enabled,
                  ].filter(Boolean).length} / 6 Active
                </span>
              </div>

              {/* Channels Status Summary in Preview */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">User Modal Channels:</span>
                {[
                  { num: 1, name: 'Option 1: UPI 1 (Manual QR)', enabled: gatewaySettings.upi1Enabled, color: 'text-purple-400' },
                  { num: 2, name: 'Option 2: UPI 2 (Razorpay Instant)', enabled: gatewaySettings.upi2Enabled, color: 'text-blue-400' },
                  { num: 3, name: 'Option 3: UPI 3 (Custom Web API)', enabled: gatewaySettings.upi3Enabled, color: 'text-emerald-400' },
                  { num: 4, name: 'Option 4: UPI 4 (Direct Fast Channel)', enabled: gatewaySettings.upi4Enabled, color: 'text-amber-400' },
                  { num: 5, name: 'Option 5: UPI 5 (Merchant VIP)', enabled: gatewaySettings.upi5Enabled, color: 'text-teal-400' },
                  { num: 6, name: 'Option 6: UPI 6 (Express Backup)', enabled: gatewaySettings.upi6Enabled, color: 'text-rose-400' },
                ].map(opt => (
                  <div
                    key={opt.num}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                      opt.enabled
                        ? 'bg-slate-950 border border-slate-800 text-white'
                        : 'bg-slate-950/40 border border-slate-800/40 text-slate-500'
                    }`}
                  >
                    <span className={`font-semibold flex items-center gap-1.5 ${opt.enabled ? opt.color : 'text-slate-500 line-through'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${opt.enabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      {opt.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        opt.enabled
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {opt.enabled ? 'Shown' : 'Hidden'}
                    </span>
                  </div>
                ))}
              </div>

              {gatewaySettings.paymentGatewayMode === 'razorpay' ? (
                /* Razorpay Mode Preview */
                <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-blue-900/50 space-y-4 text-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      ⚡ Automated Checkout
                    </span>
                    <h4 className="text-sm font-bold text-white">Razorpay Instant Window</h4>
                    <p className="text-[11px] text-slate-400">
                      Users tap "Proceed to Pay" and Razorpay's verified payment popup opens directly on their screen:
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-sm">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-white">
                      Razorpay Checkout Active
                    </div>
                    <div className="text-[10px] font-mono text-blue-300 bg-slate-900 p-2 rounded-lg border border-blue-900/60 truncate">
                      Key ID: {gatewaySettings.razorpayKeyId || '⚠️ Missing (Enter Key ID above)'}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Verification & Instant Deposit
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500">
                    Supports: UPI (PhonePe/GPay/Paytm) · Debit/Credit Cards · Netbanking · Wallets
                  </div>
                </div>
              ) : (
                /* Manual UPI QR Mode Preview */
                <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                      Fast UPI Deposit
                    </span>
                    <h4 className="text-sm font-bold text-white">Scan & Pay via any UPI App</h4>
                  </div>

                  {/* QR Code Container */}
                  <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl shadow-md flex items-center justify-center">
                    <img
                      src={gatewaySettings.qrCodeUrl || dynamicQrLink}
                      alt="Active UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Active UPI ID Box */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Official UPI ID (VPA):</span>
                      <span className="text-purple-400 font-bold">1-Click Copy</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="font-mono font-bold text-white text-xs select-all truncate">
                        {gatewaySettings.upiId}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(gatewaySettings.upiId, 'preview-upi')}
                        className="px-2 py-1 rounded bg-purple-600 text-white text-[10px] font-bold shrink-0"
                      >
                        {copiedKey === 'preview-upi' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Payee: <span className="text-slate-200 font-semibold">{gatewaySettings.upiPayeeName}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500">
                    Supported: PhonePe · Google Pay · Paytm · BHIM · CRED
                  </div>
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-900/40 text-xs space-y-2">
              <div className="font-bold text-purple-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Zero Unauthorized Deposits Guarantee
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {gatewaySettings.paymentGatewayMode === 'razorpay'
                  ? 'In Razorpay mode, transactions are verified automatically via API signature, instantly crediting the user balance and logging them in your dashboard.'
                  : 'In Manual UPI mode, users submit their 12-digit UTR number and receipt screenshot, and deposits are only credited when you click Approve in the queue.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPROVE RECHARGE MODAL */}
      {/* ========================================================================= */}
      {approveModalRecharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Approve & Credit Recharge</h3>
                  <p className="text-xs text-slate-400">{approveModalRecharge.txId}</p>
                </div>
              </div>
              <button
                onClick={() => setApproveModalRecharge(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">User Full Name:</span>
                <span className="font-semibold text-white">{approveModalRecharge.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mobile Number:</span>
                <span className="font-mono text-white">{approveModalRecharge.userMobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Submitted UTR Number:</span>
                <span className="font-mono font-bold text-purple-400">
                  {approveModalRecharge.utrNumber || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                <span className="text-slate-300">Amount to Credit:</span>
                <span className="text-emerald-400 font-mono text-base">
                  +₹{approveModalRecharge.amount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-amber-950/30 p-3 rounded-xl border border-amber-900/40">
              💡 Please ensure that you have checked your Bank/UPI app statement and confirmed receipt of ₹{approveModalRecharge.amount.toFixed(2)} with UTR #{approveModalRecharge.utrNumber || 'N/A'} before approving.
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setApproveModalRecharge(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading === approveModalRecharge.id}
                onClick={handleApprove}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md flex items-center justify-center gap-1"
              >
                {actionLoading === approveModalRecharge.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm & Credit Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECT RECHARGE MODAL */}
      {/* ========================================================================= */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-950 text-red-400 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reject Recharge Request</h3>
                  <p className="text-xs text-slate-400">Order #{rejectModalId}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Rejection Reason (will be shown to the user)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Invalid UTR number / Payment not credited to admin UPI / Amount mismatch"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading === rejectModalId}
                onClick={handleReject}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white shadow-md flex items-center justify-center gap-1"
              >
                {actionLoading === rejectModalId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREENSHOT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {selectedProofImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl">
            <button
              onClick={() => setSelectedProofImg(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-xs font-bold text-white mb-3">User Submitted Payment Screenshot:</div>
            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[70vh]">
              <img
                src={selectedProofImg}
                alt="Payment Proof"
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
