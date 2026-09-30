import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Advertisement, AdsterraSettings } from '../../types';
import { apiRequest } from '../../services/api';
import { AdsterraScriptSlot } from './AdsterraScriptSlot';

interface AdBannerProps {
  ad?: Advertisement;
  adsterraSlotName?: 'headerBanner' | 'homeTopBanner' | 'homeMiddleBanner' | 'storeBanner' | 'productBanner' | 'footerBanner' | 'sidebarBanner';
  adsterra?: AdsterraSettings;
  className?: string;
  onAdClick?: (ad: Advertisement) => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  ad,
  adsterraSlotName,
  adsterra,
  className = '',
  onAdClick,
}) => {
  // 1. Direct Custom Script Ad / Adsterra Script from Advertisement object
  if (ad && (ad.adType === 'adsterra_script' || ad.bannerType === 'adsterra_script' || (ad.scriptCode && ad.scriptCode.trim()))) {
    if (!ad.isEnabled) return null;
    return (
      <AdsterraScriptSlot
        scriptCode={ad.scriptCode!}
        slotTitle={ad.title || 'Custom Script Ad'}
        className={className}
      />
    );
  }

  // 2. Global Script Slot Placement (e.g. Header, Home Top, Store, Footer)
  if (adsterraSlotName && adsterra && adsterra.isEnabled) {
    const slot = adsterra.slots[adsterraSlotName];
    if (slot && slot.isEnabled && slot.scriptCode && slot.scriptCode.trim()) {
      return (
        <AdsterraScriptSlot
          scriptCode={slot.scriptCode}
          bannerSize={slot.bannerSize}
          slotTitle={`Ad Script (${slot.bannerSize})`}
          className={className}
        />
      );
    }
  }

  // 3. Custom Promotional Banner Bar Rendering
  if (!ad || !ad.isEnabled) return null;

  const handleClick = () => {
    if (ad.id) {
      apiRequest(`/ads/click/${ad.id}`, { method: 'POST' }).catch(() => {});
    }
    if (onAdClick) {
      onAdClick(ad);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative overflow-hidden rounded-2xl cursor-pointer group transition-all duration-300 hover:shadow-lg border border-purple-500/20 shadow-sm ${className}`}
      style={{
        background: 'linear-gradient(135deg, #4C1D95 0%, #312E81 50%, #1E1B4B 100%)',
      }}
    >
      {/* Decorative background glow accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          {ad.badgeText && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-400/20 border border-purple-300/30 text-purple-200 text-[10px] font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-purple-300" />
              {ad.badgeText}
            </div>
          )}
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug group-hover:text-purple-200 transition-colors">
            {ad.headline}
          </h3>
          {ad.subtext && (
            <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed line-clamp-2">
              {ad.subtext}
            </p>
          )}
        </div>

        <div className="shrink-0 flex items-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-purple-50 transition-all shadow-sm group-hover:scale-105">
            {ad.buttonText || 'Explore'}
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
};
