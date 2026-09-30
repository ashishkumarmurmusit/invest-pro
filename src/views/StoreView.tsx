import React, { useState } from 'react';
import { Zap, Cpu, Flame, Radio, ShieldCheck, Check, Sparkles, AlertCircle, ArrowRight, Loader2, Lock, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AdBanner } from '../components/ads/AdBanner';
import { Advertisement, AdsterraSettings, Product } from '../types';
import { apiRequest } from '../services/api';

interface StoreViewProps {
  products: Product[];
  ads: Advertisement[];
  adsterra?: AdsterraSettings;
  onOpenRecharge: () => void;
  onRefreshOrders?: () => void;
  onNavigateToInvestments?: () => void;
}

export const StoreView: React.FC<StoreViewProps> = ({
  products,
  ads,
  adsterra,
  onOpenRecharge,
  onRefreshOrders,
  onNavigateToInvestments,
}) => {
  const { user, reloadProfile } = useAuth();
  const { activeTheme } = useTheme();

  const [filterType, setFilterType] = useState<'all' | 'daily_withdrawal' | 'locking_cycle'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buying, setBuying] = useState(false);
  const [buySuccess, setBuySuccess] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  const storeAd = ads.find(a => a.position === 'store_banner');

  const getProductIcon = (iconType: string) => {
    switch (iconType) {
      case 'cpu':
        return <Cpu className="w-6 h-6 text-indigo-500" />;
      case 'flame':
        return <Flame className="w-6 h-6 text-amber-500" />;
      case 'radio':
        return <Radio className="w-6 h-6 text-purple-500" />;
      case 'solar':
        return <Zap className="w-6 h-6 text-amber-500" />;
      default:
        return <Zap className="w-6 h-6 text-emerald-500" />;
    }
  };

  const handleBuy = async (product: Product) => {
    if (!user) {
      setBuyError('Please sign in to deploy asset nodes.');
      return;
    }

    if (user.walletBalance < product.price) {
      setBuyError(`Insufficient balance (₹${user.walletBalance.toFixed(2)}). Please recharge.`);
      return;
    }

    setBuying(true);
    setBuyError(null);

    try {
      const res = await apiRequest('/products/buy', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id }),
      });
      setBuySuccess(`Successfully invested in ${product.name}! Order ID: ${res.order.id}`);
      await reloadProfile();
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      setBuyError(err.message || 'Failed to complete node purchase.');
    } finally {
      setBuying(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (filterType === 'all') return true;
    return (p.planType || 'daily_withdrawal') === filterType;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> High-Yield Investment Market
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Investment Plans & Nodes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose between Locking Cycle Plans and Daily Withdrawal Income Streams
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Plans ({products.length})
          </button>
          <button
            onClick={() => setFilterType('locking_cycle')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'locking_cycle'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-600 dark:text-amber-400 hover:text-amber-500'
            }`}
          >
            <Lock className="w-3 h-3" /> Locking Cycle
          </button>
          <button
            onClick={() => setFilterType('daily_withdrawal')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'daily_withdrawal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500'
            }`}
          >
            <Zap className="w-3 h-3" /> Daily Withdrawal
          </button>
        </div>
      </div>

      {/* Store Advertisement */}
      {storeAd ? (
        <AdBanner
          ad={storeAd}
          adsterraSlotName="storeBanner"
          adsterra={adsterra}
        />
      ) : (
        adsterra?.isEnabled && adsterra.slots.storeBanner.isEnabled && adsterra.slots.storeBanner.scriptCode && (
          <AdBanner
            adsterraSlotName="storeBanner"
            adsterra={adsterra}
          />
        )
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map(prod => {
          const isLocking = prod.planType === 'locking_cycle';

          return (
            <div
              key={prod.id}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all space-y-5"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {getProductIcon(prod.iconType)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isLocking
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    }`}>
                      {isLocking ? '🔒 Locking Cycle' : '⚡ Daily Withdrawal'}
                    </span>
                    {prod.badge && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase">
                        {prod.badge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{prod.subtitle}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed line-clamp-2">
                    {prod.description}
                  </p>
                </div>

                {/* Yield Breakdown Card */}
                <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Plan Type:</span>
                    <span className={`font-bold ${isLocking ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {isLocking ? 'Fixed Lock Period' : '24h Daily Payout'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Cycle Duration:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {prod.durationDays} Days
                    </span>
                  </div>

                  {!isLocking ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Daily Withdrawal Profit:</span>
                      <span className="font-bold font-mono text-emerald-600">
                        +₹{prod.dailyReturn.toFixed(2)} / day
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Maturity Unlock:</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Day {prod.durationDays}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs border-t pt-1.5 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Total Payout at End:</span>
                    <span className="font-bold font-mono text-blue-600 dark:text-blue-400 text-sm">
                      ₹{prod.totalReturn.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Investment Price</span>
                    <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
                      ₹{prod.price.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Stock: <span className="font-mono font-semibold">{prod.stock} units</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(prod);
                    setBuySuccess(null);
                    setBuyError(null);
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: activeTheme.buttonColor }}
                >
                  <span>Invest Now (₹{prod.price.toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PRODUCT DETAILS & BUY MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all"
            style={{
              backgroundColor: activeTheme.cardColor,
              borderColor: activeTheme.mode === 'dark' ? '#334155' : '#E2E8F0',
            }}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ✕
            </button>

            {buySuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Investment Plan Activated!
                </h3>
                <p className="text-xs text-slate-500">{buySuccess}</p>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      if (onNavigateToInvestments) onNavigateToInvestments();
                    }}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm hover:opacity-95"
                    style={{ backgroundColor: activeTheme.buttonColor }}
                  >
                    View in Investment Section
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {getProductIcon(selectedProduct.iconType)}
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      selectedProduct.planType === 'locking_cycle'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {selectedProduct.planType === 'locking_cycle' ? '🔒 Locking Cycle Plan' : '⚡ Daily Withdrawal Plan'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedProduct.subtitle}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedProduct.description}
                </p>

                {buyError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                    {buyError}
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Investment Capital:</span>
                    <span className="font-mono font-bold">₹{selectedProduct.price.toFixed(2)}</span>
                  </div>

                  {selectedProduct.planType === 'locking_cycle' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Locking Cycle:</span>
                        <span className="font-bold text-amber-600">{selectedProduct.durationDays} Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Maturity Payout:</span>
                        <span className="font-mono font-bold text-amber-600">
                          ₹{selectedProduct.totalReturn.toFixed(2)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Daily Return Profit:</span>
                        <span className="font-mono font-bold text-emerald-600">
                          +₹{selectedProduct.dailyReturn.toFixed(2)} / day
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Contract Lifecycle:</span>
                        <span className="font-semibold">{selectedProduct.durationDays} Days</span>
                      </div>
                      <div className="flex justify-between border-t pt-1.5 dark:border-slate-800 font-bold">
                        <span>Total Expected Return:</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                          ₹{selectedProduct.totalReturn.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* User wallet balance state */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-slate-500">Your Wallet Balance:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    ₹{user?.walletBalance.toFixed(2) || '0.00'}
                  </span>
                </div>

                {user && user.walletBalance < selectedProduct.price && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-xs text-amber-800 dark:text-amber-300">
                    <span>Insufficient wallet balance.</span>
                    <button
                      onClick={() => {
                        setSelectedProduct(null);
                        onOpenRecharge();
                      }}
                      className="font-bold underline"
                    >
                      Recharge Now
                    </button>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleBuy(selectedProduct)}
                    disabled={buying || (user ? user.walletBalance < selectedProduct.price : false)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{ backgroundColor: activeTheme.buttonColor }}
                  >
                    {buying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Activating Plan...
                      </>
                    ) : (
                      <>
                        Confirm Investment (₹{selectedProduct.price.toFixed(2)})
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
