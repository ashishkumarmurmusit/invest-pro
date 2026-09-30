import React, { useState, useEffect } from 'react';
import {
  Send,
  X,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Bell,
  Gift,
  ArrowRight,
  Headphones
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TelegramJoinModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  telegramUrl?: string;
  telegramUsername?: string;
}

export const TelegramJoinModal: React.FC<TelegramJoinModalProps> = ({
  isOpen: forcedIsOpen,
  onClose: forcedOnClose,
  telegramUrl = 'https://t.me/investpro_india',
  telegramUsername = 'investpro_india',
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgainToday, setDontShowAgainToday] = useState(true);

  const activeTelegramLink = telegramUrl || 'https://t.me/investpro_india';
  const activeDisplayHandle = telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`;

  // Automatically check if popup should appear on login or daily login
  useEffect(() => {
    if (forcedIsOpen !== undefined) {
      setIsOpen(forcedIsOpen);
      return;
    }

    if (!user) {
      setIsOpen(false);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const lastShownDate = localStorage.getItem('telegram_modal_last_shown_date');
    const isJustLoggedIn = sessionStorage.getItem('just_logged_in') === 'true';

    // Show popup if user just logged in or if today's daily popup hasn't been shown yet
    if (isJustLoggedIn || lastShownDate !== todayStr) {
      // Small timeout for smooth appearance after home view mounts
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [user, forcedIsOpen]);

  const handleClose = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dontShowAgainToday) {
      localStorage.setItem('telegram_modal_last_shown_date', todayStr);
    }
    sessionStorage.removeItem('just_logged_in');
    setIsOpen(false);
    if (forcedOnClose) forcedOnClose();
  };

  const handleJoin = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('telegram_modal_last_shown_date', todayStr);
    sessionStorage.removeItem('just_logged_in');
    window.open(activeTelegramLink, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
    if (forcedOnClose) forcedOnClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-sky-200 dark:border-sky-900/60 overflow-hidden flex flex-col relative transform transition-all scale-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="telegram-modal-title"
      >
        {/* Top Decorative Banner with Telegram Branding */}
        <div className="relative bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white p-6 pb-7 text-center overflow-hidden">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-44 h-44 bg-blue-900/30 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Big Telegram Paper Plane Badge */}
          <div className="w-16 h-16 rounded-2xl bg-white text-sky-500 shadow-xl mx-auto flex items-center justify-center mb-3 relative group">
            <Send className="w-8 h-8 text-sky-500 ml-0.5 -mt-0.5 transform -rotate-12 transition-transform group-hover:scale-110" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-sky-100 border border-white/20 uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Official Community Announcement</span>
          </div>

          <h3 id="telegram-modal-title" className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Official Telegram Channel
          </h3>
          <p className="text-xs text-sky-100 font-mono mt-0.5">
            {activeDisplayHandle}
          </p>
        </div>

        {/* Modal Body & Benefits */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 text-center">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Get <strong className="text-sky-600 dark:text-sky-400">24/7 Member Support</strong>, daily withdrawal proofs, all system updates, and exclusive VIP bonuses!
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Join for official announcements, instant recharge/withdrawal help, and daily income alerts.
            </p>
          </div>

          {/* Feature Highlight List */}
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  24/7 Priority Member Support
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Instant help for UTR verification, recharge approvals & withdrawal updates.
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Daily Official Platform Updates
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Stay updated with new high-yield stock plans, system maintenance, and news.
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Exclusive Gift Codes & Community Rewards
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Daily lucky red-envelope codes and member bonuses posted regularly.
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleJoin}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Join Official Telegram Channel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <a
              href={activeTelegramLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                const todayStr = new Date().toISOString().split('T')[0];
                localStorage.setItem('telegram_modal_last_shown_date', todayStr);
                sessionStorage.removeItem('just_logged_in');
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Ask Help / Chat on Telegram</span>
            </a>
          </div>

          {/* Footer Controls */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgainToday}
                onChange={e => setDontShowAgainToday(e.target.checked)}
                className="rounded accent-sky-500 cursor-pointer"
              />
              <span className="text-[11px]">Don't show again today</span>
            </label>

            <button
              type="button"
              onClick={handleClose}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Continue to App →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
