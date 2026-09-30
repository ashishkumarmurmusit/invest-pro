import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  CreditCard,
  Zap,
  ExternalLink,
  Smartphone,
  Globe,
  AlertCircle,
  RefreshCw,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../services/api';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialAmount?: string;
}

export type UpiChannel = 'upi1' | 'upi2' | 'upi3' | 'upi4' | 'upi5' | 'upi6';

interface ChannelConfig {
  id: UpiChannel;
  name: string;
  isEnabled: boolean;
  notice?: string;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAmount = '500',
}) => {
  const { user, reloadProfile } = useAuth();
  const { activeTheme } = useTheme();

  const [step, setStep] = useState<'input' | 'gateway' | 'submitting' | 'submitted'>('input');
  const [amount, setAmount] = useState(initialAmount);
  const [selectedChannel, setSelectedChannel] = useState<UpiChannel>('upi1');

  // Channel enablement state from server
  const [channelsConfig, setChannelsConfig] = useState<{
    upi1: ChannelConfig;
    upi2: ChannelConfig;
    upi3: ChannelConfig;
    upi4: ChannelConfig;
    upi5: ChannelConfig;
    upi6: ChannelConfig;
  }>({
    upi1: { id: 'upi1', name: 'UPI 1 (Manual UPI QR)', isEnabled: true },
    upi2: { id: 'upi2', name: 'UPI 2 (Razorpay Instant)', isEnabled: true },
    upi3: { id: 'upi3', name: 'UPI 3 (Custom Web API Gateway)', isEnabled: true },
    upi4: { id: 'upi4', name: 'UPI 4 (Direct Fast Channel)', isEnabled: true },
    upi5: { id: 'upi5', name: 'UPI 5 (Merchant VIP Gateway)', isEnabled: true },
    upi6: { id: 'upi6', name: 'UPI 6 (Express Backup Gateway)', isEnabled: true },
  });

  // Recharge response details
  const [rechargeData, setRechargeData] = useState<any>(null);
  const [activeGatewayTab, setActiveGatewayTab] = useState<UpiChannel>('upi1');

  // UPI 1 Manual State
  const [utrNumber, setUtrNumber] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // UPI 3 Web API State
  const [webApiUtr, setWebApiUtr] = useState('');
  const [verifyingWebApi, setVerifyingWebApi] = useState(false);

  // General Loading & Error State
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [completedVia, setCompletedVia] = useState<string>('UPI 1');

  const presets = ['200', '500', '1000', '2500', '5000', '10000', '25000'];

  // Fetch active channels on mount
  useEffect(() => {
    if (!isOpen) return;
    if (initialAmount) setAmount(initialAmount);

    const loadSettings = async () => {
      try {
        const res = await apiRequest<any>('/wallet/summary');
        if (res.channels) {
          setChannelsConfig({
            upi1: {
              id: 'upi1',
              name: res.channels.upi1?.name || 'UPI 1 (Manual UPI QR)',
              isEnabled: res.channels.upi1?.isEnabled !== false,
              notice: res.channels.upi1?.notice,
            },
            upi2: {
              id: 'upi2',
              name: res.channels.upi2?.name || 'UPI 2 (Razorpay Instant)',
              isEnabled: res.channels.upi2?.isEnabled !== false,
              notice: res.channels.upi2?.notice,
            },
            upi3: {
              id: 'upi3',
              name: res.channels.upi3?.name || 'UPI 3 (Custom Web API Gateway)',
              isEnabled: res.channels.upi3?.isEnabled !== false,
              notice: res.channels.upi3?.notice,
            },
            upi4: {
              id: 'upi4',
              name: res.channels.upi4?.name || 'UPI 4 (Direct Fast Channel)',
              isEnabled: Boolean(res.channels.upi4?.isEnabled),
              notice: res.channels.upi4?.notice,
            },
            upi5: {
              id: 'upi5',
              name: res.channels.upi5?.name || 'UPI 5 (Merchant VIP Gateway)',
              isEnabled: Boolean(res.channels.upi5?.isEnabled),
              notice: res.channels.upi5?.notice,
            },
            upi6: {
              id: 'upi6',
              name: res.channels.upi6?.name || 'UPI 6 (Express Backup Gateway)',
              isEnabled: Boolean(res.channels.upi6?.isEnabled),
              notice: res.channels.upi6?.notice,
            },
          });

          // Auto-select the first enabled channel
          const allChs: UpiChannel[] = ['upi1', 'upi2', 'upi3', 'upi4', 'upi5', 'upi6'];
          const firstEnabled = allChs.find(ch => res.channels[ch]?.isEnabled !== false && res.channels[ch]?.isEnabled !== undefined);
          if (firstEnabled) {
            setSelectedChannel(firstEnabled);
          }
        }
      } catch {
        // use defaults
      }
    };

    loadSettings();
  }, [isOpen, initialAmount]);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('input');
    setError(null);
    setUtrNumber('');
    setWebApiUtr('');
    setProofImage('');
    setRechargeData(null);
    setSelectedChannel('upi1');
    setActiveGatewayTab('upi1');
    onClose();
  };

  // Helper to load Razorpay Checkout Script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise(resolve => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Launch Razorpay Checkout Popup for UPI 2
  const launchRazorpayCheckout = async (data: any) => {
    setRazorpayLoading(true);
    setError(null);

    const keyId = data?.upi2?.razorpayKeyId || data?.razorpayKeyId;
    if (!keyId) {
      setError('Razorpay Key ID is not configured. Please use UPI 1 or UPI 3.');
      setRazorpayLoading(false);
      return;
    }

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      setError('Could not load Razorpay SDK. Please use UPI 1 (Manual UPI QR).');
      setRazorpayLoading(false);
      return;
    }

    try {
      const options = {
        key: keyId,
        amount: Math.round(Number(data.amount) * 100), // in paise
        currency: 'INR',
        name: 'Nexus Wallet Recharge',
        description: `Deposit Order #${data.rechargeId.slice(-8)}`,
        image: activeTheme.logoUrl || undefined,
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
          contact: user?.mobile || '',
        },
        theme: {
          color: activeTheme.primaryColor || '#4F46E5',
        },
        handler: async function (response: any) {
          try {
            setStep('submitting');
            await apiRequest('/wallet/recharge/verify-razorpay', {
              method: 'POST',
              body: JSON.stringify({
                rechargeId: data.rechargeId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            await reloadProfile();
            setCompletedVia('UPI 2 (Razorpay Instant)');
            setStep('submitted');
            if (onSuccess) onSuccess();
          } catch (err: any) {
            setError(err.message || 'Payment received but verification failed. Please contact support.');
            setStep('gateway');
          }
        },
        modal: {
          ondismiss: function () {
            setRazorpayLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError(`Payment Failed: ${response.error?.description || 'Transaction cancelled'}`);
        setRazorpayLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(`Razorpay Gateway Error: ${err.message}. You can use UPI 1 below.`);
    } finally {
      setRazorpayLoading(false);
    }
  };

  const handleInitiateRecharge = async () => {
    const num = Number(amount);
    if (isNaN(num) || num < 50) {
      setError('Minimum recharge amount is ₹50.00');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest('/wallet/recharge/initiate', {
        method: 'POST',
        body: JSON.stringify({
          amount: num,
          paymentMethod: 'upi',
          selectedChannel,
        }),
      });

      setRechargeData(res);
      setActiveGatewayTab(selectedChannel);
      setStep('gateway');

      // Auto-launch Razorpay if UPI 2 is chosen
      if (selectedChannel === 'upi2' && (res.upi2?.razorpayKeyId || res.razorpayKeyId)) {
        setTimeout(() => {
          launchRazorpayCheckout(res);
        }, 100);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate recharge order.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUpi = (upiId: string) => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Submit UPI 1 UTR Proof
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.trim().length < 6) {
      setError('Please enter a valid 12-digit UPI Transaction / UTR Reference Number.');
      return;
    }

    setStep('submitting');
    setError(null);

    try {
      await apiRequest('/wallet/recharge/submit', {
        method: 'POST',
        body: JSON.stringify({
          rechargeId: rechargeData.rechargeId,
          utrNumber: utrNumber.trim(),
          proofImage,
        }),
      });

      await reloadProfile();
      setCompletedVia('UPI 1 (Manual UPI QR)');
      setStep('submitted');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment proof.');
      setStep('gateway');
    }
  };

  // Verify UPI 3 Web API Payment
  const handleVerifyWebApi = async () => {
    setVerifyingWebApi(true);
    setError(null);

    try {
      await apiRequest('/wallet/recharge/verify-web-api', {
        method: 'POST',
        body: JSON.stringify({
          rechargeId: rechargeData.rechargeId,
          webApiRef: rechargeData.upi3?.merchantRef || `WEB_API_${Date.now()}`,
          utrNumber: webApiUtr.trim() || undefined,
        }),
      });

      await reloadProfile();
      setCompletedVia('UPI 3 (Custom Web API Gateway)');
      setStep('submitted');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Web API verification pending. You can also submit UTR via UPI 1.');
    } finally {
      setVerifyingWebApi(false);
    }
  };

  const enabledChannelsCount = [
    channelsConfig.upi1.isEnabled,
    channelsConfig.upi2.isEnabled,
    channelsConfig.upi3.isEnabled,
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl p-5 sm:p-7 shadow-2xl border transition-all max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: activeTheme.cardColor,
          borderColor: activeTheme.mode === 'dark' ? '#334155' : '#E2E8F0',
        }}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 1: AMOUNT SELECTION & DYNAMIC CHANNELS PICKER   */}
        {/* ==================================================== */}
        {step === 'input' && (
          <div className="space-y-5">
            <div>
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-purple-600" />
                Wallet Balance Deposit
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Recharge Account
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your preferred payment channel to instantly deposit funds
              </p>
            </div>

            {/* Current Balance Indicator */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">Current Balance:</span>
              <span className="text-sm font-bold font-mono text-emerald-600">
                ₹{user?.walletBalance.toFixed(2) || '0.00'}
              </span>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Deposit Amount (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  min="50"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount (min ₹50)"
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{
                    borderColor: activeTheme.mode === 'dark' ? '#334155' : '#CBD5E1',
                  }}
                />
              </div>

              {/* Quick Select Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {presets.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                      amount === p
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    ₹{p}
                  </button>
                ))}
              </div>
            </div>

            {/* ==================================================== */}
            {/* DYNAMIC UPI CHANNELS (ONLY SHOW ENABLED ONES)        */}
            {/* ==================================================== */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Select Recharge Channel</span>
                <span className="text-[10px] text-purple-600 font-bold uppercase">
                  {enabledChannelsCount} Active Channel{enabledChannelsCount !== 1 ? 's' : ''}
                </span>
              </label>

              <div className="space-y-2">
                {/* 1. UPI 1: Custom UPI (Manual UPI QR) */}
                {channelsConfig.upi1.isEnabled && (
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('upi1')}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                      selectedChannel === 'upi1'
                        ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-500/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedChannel === 'upi1' ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-purple-600'
                    }`}>
                      <QrCode className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-purple-600 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded-md">
                          UPI 1
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Manual UPI QR & VPA
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        PhonePe · Google Pay · Paytm · Direct UPI ID & QR Code
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        QR Scan
                      </span>
                    </div>
                  </button>
                )}

                {/* 2. UPI 2: Razorpay (Razorpay Instant Auto) */}
                {channelsConfig.upi2.isEnabled && (
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('upi2')}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                      selectedChannel === 'upi2'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedChannel === 'upi2' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-blue-600'
                    }`}>
                      <CreditCard className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-blue-600 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded-md">
                          UPI 2
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Razorpay Automated Checkout
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Instant Auto-Credit · Fast UPI, Cards & Netbanking
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> Instant
                      </span>
                    </div>
                  </button>
                )}

                {/* 3. UPI 3: Custom Web API (Custom Web API) */}
                {channelsConfig.upi3.isEnabled && (
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('upi3')}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                      selectedChannel === 'upi3'
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedChannel === 'upi3' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-emerald-600'
                    }`}>
                      <Globe className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded-md">
                          UPI 3
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Custom Web API Gateway
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Merchant Web Gateway Checkout Link
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[9px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                        Web API
                      </span>
                    </div>
                  </button>
                )}

                {/* 4. UPI 4: Direct Fast Channel */}
                {channelsConfig.upi4.isEnabled && (
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('upi4')}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                      selectedChannel === 'upi4'
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-500/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedChannel === 'upi4' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-amber-500'
                    }`}>
                      <Smartphone className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-amber-600 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded-md">
                          UPI 4
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {channelsConfig.upi4.name || 'Direct Fast Channel'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        High Speed UPI Corridor · Instant Pay & Submit UTR
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        Fast UPI
                      </span>
                    </div>
                  </button>
                )}

                {/* 5. UPI 5: Merchant VIP Gateway */}
                {channelsConfig.upi5.isEnabled && (
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('upi5')}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                      selectedChannel === 'upi5'
                        ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 ring-2 ring-teal-500/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedChannel === 'upi5' ? 'bg-teal-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-teal-500'
                    }`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-teal-600 bg-teal-100 dark:bg-teal-950 px-1.5 py-0.5 rounded-md">
                          UPI 5
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {channelsConfig.upi5.name || 'Merchant VIP Gateway'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Priority Dedicated Merchant Route
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[9px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                        VIP Route
                      </span>
                    </div>
                  </button>
                )}

                {/* 6. UPI 6: Express Backup Gateway */}
                {channelsConfig.upi6.isEnabled && (
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('upi6')}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                      selectedChannel === 'upi6'
                        ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 ring-2 ring-rose-500/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedChannel === 'upi6' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-rose-500'
                    }`}>
                      <Zap className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-rose-600 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded-md">
                          UPI 6
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {channelsConfig.upi6.name || 'Express Backup Gateway'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        24/7 Dedicated High Availability Backup
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                        Express
                      </span>
                    </div>
                  </button>
                )}

                {enabledChannelsCount === 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-300 text-xs text-center">
                    Payment gateways are temporarily offline for routine maintenance. Please check back shortly.
                  </div>
                )}
              </div>
            </div>

            {/* Submit Proceed Button */}
            <button
              type="button"
              disabled={loading || enabledChannelsCount === 0}
              onClick={handleInitiateRecharge}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: activeTheme.buttonColor }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting {selectedChannel.toUpperCase()} Gateway...
                </>
              ) : (
                <>
                  Proceed to Pay ₹{amount}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 2: GATEWAY PAYMENT SCREEN WITH ACTIVE TABS     */}
        {/* ==================================================== */}
        {step === 'gateway' && rechargeData && (
          <div className="space-y-4">
            {/* Header with Amount and Order ID */}
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Secure Deposit
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Order #{rechargeData.rechargeId.slice(-8)}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Payable Amount</span>
                <div className="text-base font-mono font-bold text-emerald-600">
                  ₹{rechargeData.amount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Channel Switcher Tabs (Only Show Enabled Ones) */}
            {enabledChannelsCount > 1 && (
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-bold">
                {channelsConfig.upi1.isEnabled && (
                  <button
                    type="button"
                    onClick={() => setActiveGatewayTab('upi1')}
                    className={`flex-1 min-w-[65px] py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeGatewayTab === 'upi1'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    UPI 1
                  </button>
                )}

                {channelsConfig.upi2.isEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveGatewayTab('upi2');
                      if (rechargeData.upi2?.razorpayKeyId || rechargeData.razorpayKeyId) {
                        launchRazorpayCheckout(rechargeData);
                      }
                    }}
                    className={`flex-1 min-w-[65px] py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeGatewayTab === 'upi2'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    UPI 2
                  </button>
                )}

                {channelsConfig.upi3.isEnabled && (
                  <button
                    type="button"
                    onClick={() => setActiveGatewayTab('upi3')}
                    className={`flex-1 min-w-[65px] py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeGatewayTab === 'upi3'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    UPI 3
                  </button>
                )}

                {channelsConfig.upi4.isEnabled && (
                  <button
                    type="button"
                    onClick={() => setActiveGatewayTab('upi4')}
                    className={`flex-1 min-w-[65px] py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeGatewayTab === 'upi4'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    UPI 4
                  </button>
                )}

                {channelsConfig.upi5.isEnabled && (
                  <button
                    type="button"
                    onClick={() => setActiveGatewayTab('upi5')}
                    className={`flex-1 min-w-[65px] py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeGatewayTab === 'upi5'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    UPI 5
                  </button>
                )}

                {channelsConfig.upi6.isEnabled && (
                  <button
                    type="button"
                    onClick={() => setActiveGatewayTab('upi6')}
                    className={`flex-1 min-w-[65px] py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeGatewayTab === 'upi6'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    UPI 6
                  </button>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* MANUAL UPI / QR FLOW (UPI 1, UPI 4, UPI 5, UPI 6)   */}
            {/* ---------------------------------------------------- */}
            {(activeGatewayTab === 'upi1' || activeGatewayTab === 'upi4' || activeGatewayTab === 'upi5' || activeGatewayTab === 'upi6') && (
              <form onSubmit={handleSubmitProof} className="space-y-4 animate-in fade-in duration-150">
                {/* UPI ID Copy Card */}
                <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                      Step 1: Pay to Official UPI ID
                    </span>
                    <span className="text-[9px] font-bold bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full">
                      {channelsConfig[activeGatewayTab]?.name || 'Manual UPI'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/60">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] text-slate-400 block font-sans">Official Receiver UPI ID</span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate block">
                        {rechargeData[activeGatewayTab]?.upiId || rechargeData.upi1?.upiId || rechargeData.upiId}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyUpi(rechargeData[activeGatewayTab]?.upiId || rechargeData.upi1?.upiId || rechargeData.upiId)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[10px] text-purple-800 dark:text-purple-300 flex items-center justify-between">
                    <span>Payee Name: <strong className="font-semibold">{rechargeData[activeGatewayTab]?.upiPayeeName || rechargeData.upi1?.upiPayeeName || rechargeData.upiPayeeName}</strong></span>
                    <a
                      href={rechargeData[activeGatewayTab]?.upiDeepLink || rechargeData.upi1?.upiDeepLink || rechargeData.upiDeepLink}
                      className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Smartphone className="w-3 h-3" /> Open in App
                    </a>
                  </div>
                </div>

                {/* QR Code Scan Section */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Or Scan Dynamic UPI QR Code
                  </span>

                  <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 w-36 h-36 flex items-center justify-center">
                    <img
                      src={rechargeData[activeGatewayTab]?.qrCodeUrl || rechargeData.upi1?.qrCodeUrl || rechargeData.qrCodeUrl}
                      alt="UPI Payment QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="text-[10px] text-slate-400">
                    PhonePe · Google Pay · Paytm · BHIM · CRED
                  </div>
                </div>

                {/* UTR Number Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Step 2: Enter 12-Digit UTR / Reference Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={utrNumber}
                    onChange={e => setUtrNumber(e.target.value.replace(/\s+/g, ''))}
                    placeholder="e.g. 429182910291 (From UPI payment receipt)"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{
                      borderColor: activeTheme.mode === 'dark' ? '#334155' : '#CBD5E1',
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: activeTheme.buttonColor }}
                  >
                    Submit UPI 1 Payment
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 2: UPI 2 (RAZORPAY AUTOMATED CHECKOUT GATEWAY)  */}
            {/* ---------------------------------------------------- */}
            {activeGatewayTab === 'upi2' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-3.5 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-md">
                    <CreditCard className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full uppercase">
                      <Zap className="w-3 h-3" /> UPI 2: Razorpay Instant
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Automated Payment & Instant Balance Credit
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Pay via Google Pay, PhonePe, UPI Apps, Cards, or Netbanking. Your wallet balance will be credited instantly upon completion.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={razorpayLoading}
                      onClick={() => launchRazorpayCheckout(rechargeData)}
                      className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {razorpayLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Opening Razorpay Checkout...
                        </>
                      ) : (
                        <>
                          Pay ₹{rechargeData.amount.toFixed(2)} with Razorpay
                          <ExternalLink className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {channelsConfig.upi1.isEnabled && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveGatewayTab('upi1')}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
                    >
                      Or Switch to UPI 1 (Manual UPI QR) Instead →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 3: UPI 3 (CUSTOM WEB API GATEWAY)               */}
            {/* ---------------------------------------------------- */}
            {activeGatewayTab === 'upi3' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-md">
                    <Globe className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full uppercase">
                      UPI 3: Custom Web API Gateway
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      External Web API Merchant Checkout
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Click below to open the Web API checkout portal, complete payment, and click Verify.
                    </p>
                  </div>

                  {/* Web API Order Details */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-xs text-left space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Order Ref:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{rechargeData.upi3?.merchantRef || rechargeData.rechargeId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount:</span>
                      <span className="font-bold text-emerald-600">₹{rechargeData.amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* External Checkout Button */}
                  <a
                    href={rechargeData.upi3?.webPaymentLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    Open Web API Checkout Page
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Optional Web API UTR or Instant Verify */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Confirm & Complete Web API Deposit
                  </span>

                  <input
                    type="text"
                    value={webApiUtr}
                    onChange={e => setWebApiUtr(e.target.value.replace(/\s+/g, ''))}
                    placeholder="Enter UTR / Transaction Reference ID (optional)"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <button
                    type="button"
                    disabled={verifyingWebApi}
                    onClick={handleVerifyWebApi}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {verifyingWebApi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Verifying Web API Deposit...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        I Have Paid · Verify & Credit Wallet
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 3: SUBMITTING STATE                             */}
        {/* ==================================================== */}
        {step === 'submitting' && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Verifying Payment & Updating Wallet...
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Please do not close this window while we verify your transaction and credit your balance.
            </p>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 4: SUBMITTED SUCCESS STATE                      */}
        {/* ==================================================== */}
        {step === 'submitted' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Deposit Processed!
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {completedVia.includes('Instant')
                  ? `₹${amount} has been instantly credited to your wallet balance.`
                  : `Your payment reference has been submitted. Your balance will be credited within a few minutes upon admin confirmation.`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1.5 font-mono max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="text-slate-900 dark:text-white font-bold">
                  {rechargeData?.rechargeId || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="text-emerald-600 font-bold">₹{amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Channel:</span>
                <span className="text-purple-600 font-bold">{completedVia}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="https://t.me/investpro_india"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl border border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Need Instant Approval? Chat on Official Telegram</span>
              </a>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl font-bold text-xs text-white shadow-md cursor-pointer"
                style={{ backgroundColor: activeTheme.buttonColor }}
              >
                Done & Return to Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
