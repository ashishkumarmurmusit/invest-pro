import React from 'react';
import { Send, CheckCircle2, Headphones, Sparkles, ExternalLink, MessageCircle } from 'lucide-react';

interface OfficialTelegramCardProps {
  onOpenModal?: () => void;
  telegramUrl?: string;
  telegramUsername?: string;
  className?: string;
}

export const OfficialTelegramCard: React.FC<OfficialTelegramCardProps> = ({
  onOpenModal,
  telegramUrl = 'https://t.me/investpro_india',
  telegramUsername = 'investpro_india',
  className = '',
}) => {
  const activeTelegramLink = telegramUrl || 'https://t.me/investpro_india';
  const displayHandle = telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white shadow-md border border-sky-400/30 ${className}`}
    >
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-sky-100 border border-white/25 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Official Community</span>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <h3 className="text-base sm:text-lg font-bold tracking-tight">
              Official Telegram Channel
            </h3>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[9px] font-bold">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300" /> Verified
            </span>
          </div>

          <p className="text-[11px] sm:text-xs text-sky-100 max-w-xl leading-relaxed">
            Join our Official Telegram Channel for 24/7 priority customer support, daily withdrawal payout proofs, official platform announcements, and exclusive community rewards.
          </p>

          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 pt-0.5 text-[10px] sm:text-[11px] text-sky-100 font-medium">
            <span className="flex items-center gap-1">
              <Headphones className="w-3 h-3 text-sky-200" /> 24/7 Member Support
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Live Daily Proofs
            </span>
            <span className="font-mono text-white font-bold">{displayHandle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-1 md:pt-0">
          <a
            href={activeTelegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-sky-600" />
            <span>Join Official Telegram</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {onOpenModal && (
            <button
              type="button"
              onClick={onOpenModal}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md active:scale-95 transition-all border border-white/25 cursor-pointer"
              title="View Telegram Community Details"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
