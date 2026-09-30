import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Code2,
  Globe,
  Radio,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  X,
  Play,
  Layers,
  Zap,
  LayoutTemplate
} from 'lucide-react';
import { Advertisement, AdsterraSettings } from '../../types';
import { useAdmin } from '../../context/AdminContext';
import { apiRequest } from '../../services/api';
import { AdsterraScriptSlot } from '../../components/ads/AdsterraScriptSlot';

export const AdminAdManagerView: React.FC = () => {
  const { admin } = useAdmin();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [adsterra, setAdsterra] = useState<AdsterraSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'adsterra' | 'banners'>('adsterra');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSuperAdmin = admin?.role === 'super_admin';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const fetchAds = async () => {
    try {
      const res = await apiRequest<{ ads: Advertisement[]; adsterra: AdsterraSettings }>('/admin/ads', {}, true);
      setAds(res.ads || []);
      if (res.adsterra) {
        setAdsterra(res.adsterra);
      } else {
        setAdsterra({
          isEnabled: true,
          popunderScript: '',
          socialBarScript: '',
          directLinkUrl: '',
          slots: {
            headerBanner: { isEnabled: true, scriptCode: '', bannerSize: '728x90' },
            homeTopBanner: { isEnabled: true, scriptCode: '', bannerSize: '728x90' },
            homeMiddleBanner: { isEnabled: true, scriptCode: '', bannerSize: '300x250' },
            storeBanner: { isEnabled: true, scriptCode: '', bannerSize: '468x60' },
            productBanner: { isEnabled: true, scriptCode: '', bannerSize: '320x50' },
            footerBanner: { isEnabled: true, scriptCode: '', bannerSize: '728x90' },
            sidebarBanner: { isEnabled: true, scriptCode: '', bannerSize: '160x600' },
          },
          updatedAt: new Date().toISOString(),
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleOpenAdd = () => {
    setEditingAd({
      title: '',
      position: 'home_top',
      adType: 'promo_banner',
      scriptCode: '',
      badgeText: 'SPECIAL OFFER',
      headline: '',
      subtext: '',
      buttonText: 'View Now',
      actionUrl: '/store',
      priority: 5,
      mobileVisible: true,
      desktopVisible: true,
      isEnabled: true,
    });
    setIsAdModalOpen(true);
  };

  const handleOpenEdit = (ad: Advertisement) => {
    setEditingAd({ ...ad });
    setIsAdModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this advertisement?')) return;
    try {
      await apiRequest(`/admin/ads/${id}`, { method: 'DELETE' }, true);
      showToast('Advertisement deleted.', 'success');
      fetchAds();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete ad', 'error');
    }
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingAd.id) {
        await apiRequest(`/admin/ads/${editingAd.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingAd),
        }, true);
      } else {
        await apiRequest('/admin/ads', {
          method: 'POST',
          body: JSON.stringify(editingAd),
        }, true);
      }
      showToast('Ad saved successfully!', 'success');
      setIsAdModalOpen(false);
      fetchAds();
    } catch (err: any) {
      showToast(err.message || 'Failed to save ad', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAdsterra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adsterra) return;
    setSaving(true);
    try {
      await apiRequest('/admin/ads/adsterra-settings', {
        method: 'POST',
        body: JSON.stringify(adsterra),
      }, true);
      showToast('Ad network scripts and slots saved successfully! Ads are live across your platform.', 'success');
      fetchAds();
    } catch (err: any) {
      showToast(err.message || 'Failed to update ad script settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdStatus = async (ad: Advertisement) => {
    try {
      await apiRequest(`/admin/ads/${ad.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isEnabled: !ad.isEnabled }),
      }, true);
      showToast(`Ad status updated to ${!ad.isEnabled ? 'Active' : 'Disabled'}.`, 'success');
      fetchAds();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-500" />
        <p className="text-sm">Loading advertisement controls & script slots...</p>
      </div>
    );
  }

  const activeAdsCount = ads.filter(a => a.isEnabled).length;

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

      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Globe className="w-6 h-6 text-purple-400" />
              Advertisement & Script Slots Manager
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
              {activeAdsCount} Active Promos
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage Adsterra & custom third-party ad scripts, banner slots, and custom promotional bars
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('adsterra')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'adsterra'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Ad Script Slots (Adsterra / Custom)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('banners')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'banners'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutTemplate className="w-4 h-4" />
              Custom Promo Bars & Banners ({ads.length})
            </button>
          </div>

          {activeTab === 'banners' && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Promo Banner
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ADSTERRA.COM & SCRIPT ADS SETUP                                   */}
      {/* ========================================================================= */}
      {activeTab === 'adsterra' && adsterra && (
        <form onSubmit={handleSaveAdsterra} className="space-y-6">
          {/* Main Network Controls */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Script-Based Ad Delivery
                </span>
                <h3 className="text-lg font-bold text-white">
                  Adsterra & Third-Party HTML/JS Script Slots
                </h3>
                <p className="text-xs text-slate-400">
                  Paste script code tags generated from <strong className="text-purple-300">adsterra.com</strong> or any ad network. The app renders and executes them automatically.
                </p>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-semibold">Enable Script Ads:</span>
                <button
                  type="button"
                  onClick={() => setAdsterra({ ...adsterra, isEnabled: !adsterra.isEnabled })}
                  className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer ${
                    adsterra.isEnabled ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                      adsterra.isEnabled ? 'left-8' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Global Scripts (Popunder, Social Bar, Direct Link) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                <Radio className="w-4 h-4 text-purple-400" />
                1. Global Scripts & Full-Site Formats
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Popunder / OnClick Script */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Popunder / OnClick Script Code
                    </label>
                    <span className="text-[10px] text-slate-500">Adsterra Popunder</span>
                  </div>
                  <textarea
                    rows={3}
                    value={adsterra.popunderScript}
                    onChange={e => setAdsterra({ ...adsterra, popunderScript: e.target.value })}
                    placeholder="Paste <script type='text/javascript' src='//...'></script>"
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Triggers once per visitor on first click/interaction across all pages.
                  </p>
                </div>

                {/* Social Bar / In-Page Push Script */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-blue-400" />
                      Social Bar / Floating Push Script
                    </label>
                    <span className="text-[10px] text-slate-500">Adsterra Social Bar</span>
                  </div>
                  <textarea
                    rows={3}
                    value={adsterra.socialBarScript}
                    onChange={e => setAdsterra({ ...adsterra, socialBarScript: e.target.value })}
                    placeholder="Paste <script type='text/javascript' src='//...'></script>"
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Displays high-converting floating notifications and web widgets.
                  </p>
                </div>

                {/* Direct Link URL */}
                <div className="md:col-span-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      Direct Link / Smartlink URL (Optional)
                    </label>
                    <span className="text-[10px] text-slate-500">Adsterra Directlink</span>
                  </div>
                  <input
                    type="url"
                    value={adsterra.directLinkUrl}
                    onChange={e => setAdsterra({ ...adsterra, directLinkUrl: e.target.value.trim() })}
                    placeholder="https://www.highrevenuegate.com/xxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Use this URL inside custom buttons, promo banners, or reward redirect links.
                  </p>
                </div>
              </div>
            </div>

            {/* Individual Banner Placement Slots */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-purple-400" />
                  2. In-Page Banner Script Slots
                </div>
                <span className="text-[10px] text-slate-400">7 Dedicated Placements</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* 1. Header Banner */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Top Header Banner</span>
                      <span className="text-[10px] text-purple-400 font-mono">728x90 / Leaderboard</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adsterra.slots.headerBanner.isEnabled}
                        onChange={e =>
                          setAdsterra({
                            ...adsterra,
                            slots: {
                              ...adsterra.slots,
                              headerBanner: { ...adsterra.slots.headerBanner, isEnabled: e.target.checked },
                            },
                          })
                        }
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-[11px] text-slate-300">Active</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={adsterra.slots.headerBanner.scriptCode}
                    onChange={e =>
                      setAdsterra({
                        ...adsterra,
                        slots: {
                          ...adsterra.slots,
                          headerBanner: { ...adsterra.slots.headerBanner, scriptCode: e.target.value },
                        },
                      })
                    }
                    placeholder="Paste Adsterra 728x90 script snippet here..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* 2. Home Top Banner */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Home Top Slot (Primary)</span>
                      <span className="text-[10px] text-purple-400 font-mono">728x90 or Responsive Banner</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adsterra.slots.homeTopBanner.isEnabled}
                        onChange={e =>
                          setAdsterra({
                            ...adsterra,
                            slots: {
                              ...adsterra.slots,
                              homeTopBanner: { ...adsterra.slots.homeTopBanner, isEnabled: e.target.checked },
                            },
                          })
                        }
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-[11px] text-slate-300">Active</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={adsterra.slots.homeTopBanner.scriptCode}
                    onChange={e =>
                      setAdsterra({
                        ...adsterra,
                        slots: {
                          ...adsterra.slots,
                          homeTopBanner: { ...adsterra.slots.homeTopBanner, scriptCode: e.target.value },
                        },
                      })
                    }
                    placeholder="Paste script snippet for Home Top slot..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* 3. Home Middle Banner */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Home Middle Banner</span>
                      <span className="text-[10px] text-purple-400 font-mono">300x250 / Rectangle</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adsterra.slots.homeMiddleBanner.isEnabled}
                        onChange={e =>
                          setAdsterra({
                            ...adsterra,
                            slots: {
                              ...adsterra.slots,
                              homeMiddleBanner: { ...adsterra.slots.homeMiddleBanner, isEnabled: e.target.checked },
                            },
                          })
                        }
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-[11px] text-slate-300">Active</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={adsterra.slots.homeMiddleBanner.scriptCode}
                    onChange={e =>
                      setAdsterra({
                        ...adsterra,
                        slots: {
                          ...adsterra.slots,
                          homeMiddleBanner: { ...adsterra.slots.homeMiddleBanner, scriptCode: e.target.value },
                        },
                      })
                    }
                    placeholder="Paste script snippet for Home Middle slot..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* 4. Store Banner */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Store Page Banner</span>
                      <span className="text-[10px] text-purple-400 font-mono">468x60 / Banner</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adsterra.slots.storeBanner.isEnabled}
                        onChange={e =>
                          setAdsterra({
                            ...adsterra,
                            slots: {
                              ...adsterra.slots,
                              storeBanner: { ...adsterra.slots.storeBanner, isEnabled: e.target.checked },
                            },
                          })
                        }
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-[11px] text-slate-300">Active</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={adsterra.slots.storeBanner.scriptCode}
                    onChange={e =>
                      setAdsterra({
                        ...adsterra,
                        slots: {
                          ...adsterra.slots,
                          storeBanner: { ...adsterra.slots.storeBanner, scriptCode: e.target.value },
                        },
                      })
                    }
                    placeholder="Paste script snippet for Store Page..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* 5. Product Page Banner */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Product Details Banner</span>
                      <span className="text-[10px] text-purple-400 font-mono">320x50 / Mobile Leaderboard</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adsterra.slots.productBanner.isEnabled}
                        onChange={e =>
                          setAdsterra({
                            ...adsterra,
                            slots: {
                              ...adsterra.slots,
                              productBanner: { ...adsterra.slots.productBanner, isEnabled: e.target.checked },
                            },
                          })
                        }
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-[11px] text-slate-300">Active</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={adsterra.slots.productBanner.scriptCode}
                    onChange={e =>
                      setAdsterra({
                        ...adsterra,
                        slots: {
                          ...adsterra.slots,
                          productBanner: { ...adsterra.slots.productBanner, scriptCode: e.target.value },
                        },
                      })
                    }
                    placeholder="Paste script snippet for Product page..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* 6. Footer Banner */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Footer Banner</span>
                      <span className="text-[10px] text-purple-400 font-mono">728x90 / Leaderboard</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adsterra.slots.footerBanner.isEnabled}
                        onChange={e =>
                          setAdsterra({
                            ...adsterra,
                            slots: {
                              ...adsterra.slots,
                              footerBanner: { ...adsterra.slots.footerBanner, isEnabled: e.target.checked },
                            },
                          })
                        }
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-[11px] text-slate-300">Active</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={adsterra.slots.footerBanner.scriptCode}
                    onChange={e =>
                      setAdsterra({
                        ...adsterra,
                        slots: {
                          ...adsterra.slots,
                          footerBanner: { ...adsterra.slots.footerBanner, scriptCode: e.target.value },
                        },
                      })
                    }
                    placeholder="Paste script snippet for Footer slot..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save All Script Ads Settings
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOM PROMOTIONAL BANNERS & BARS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map(ad => (
              <div
                key={ad.id}
                className={`p-5 rounded-3xl bg-slate-900 border transition-all space-y-4 flex flex-col justify-between ${
                  ad.isEnabled ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/40">
                      {ad.position.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ad.isEnabled
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ad.isEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{ad.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{ad.headline || ad.subtext || 'No headline'}</p>
                  </div>

                  {/* Ad Preview Card */}
                  <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-900/40 text-xs text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-300">{ad.badgeText || 'PROMO'}</span>
                      <span className="text-[10px] font-bold bg-white text-slate-900 px-2 py-0.5 rounded-md">
                        {ad.buttonText || 'Click'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleAdStatus(ad)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {ad.isEnabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {ad.isEnabled ? 'Disable' : 'Enable'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(ad)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROMO BANNER MODAL */}
      {isAdModalOpen && editingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAdModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white">
                {editingAd.id ? 'Edit Promotional Banner' : 'Create New Promotional Banner'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure your custom interactive promotion bar with badge, headline, and link
              </p>
            </div>

            <form onSubmit={handleSaveAd} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Internal Campaign Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingAd.title}
                  onChange={e => setEditingAd({ ...editingAd, title: e.target.value })}
                  placeholder="e.g. VIP Club Launch Promo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Position Slot</label>
                  <select
                    value={editingAd.position}
                    onChange={e => setEditingAd({ ...editingAd, position: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="home_top">Home Top Banner</option>
                    <option value="home_middle">Home Middle Banner</option>
                    <option value="home_bottom">Home Bottom Banner</option>
                    <option value="store_banner">Store Banner</option>
                    <option value="product_banner">Product Details Banner</option>
                    <option value="profile_banner">Profile Banner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={editingAd.badgeText}
                    onChange={e => setEditingAd({ ...editingAd, badgeText: e.target.value })}
                    placeholder="e.g. 50% BONUS"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Headline Text <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingAd.headline}
                  onChange={e => setEditingAd({ ...editingAd, headline: e.target.value })}
                  placeholder="e.g. Deposit ₹1000 & Get ₹200 Free Bonus Today!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subtext / Description</label>
                <textarea
                  rows={2}
                  value={editingAd.subtext}
                  onChange={e => setEditingAd({ ...editingAd, subtext: e.target.value })}
                  placeholder="e.g. Instant recharge verification active for all UPI & netbanking payments."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Button CTA Text</label>
                  <input
                    type="text"
                    value={editingAd.buttonText}
                    onChange={e => setEditingAd({ ...editingAd, buttonText: e.target.value })}
                    placeholder="e.g. Claim Now"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Action URL / Path</label>
                  <input
                    type="text"
                    value={editingAd.actionUrl}
                    onChange={e => setEditingAd({ ...editingAd, actionUrl: e.target.value })}
                    placeholder="e.g. /store or https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Custom Script Override (Optional) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Custom Ad Script Override (Optional)</span>
                  <span className="text-[10px] text-slate-500">Adsterra / JS Script</span>
                </label>
                <textarea
                  rows={2}
                  value={editingAd.scriptCode || ''}
                  onChange={e => setEditingAd({ ...editingAd, scriptCode: e.target.value })}
                  placeholder="Leave empty to use custom gradient card or paste <script> tag"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white shadow-md flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
