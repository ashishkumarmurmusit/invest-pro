import React, { useState, useEffect } from 'react';
import { CalendarCheck, Sparkles, Check, Clock, Gift, Award, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AdBanner } from '../components/ads/AdBanner';
import { Advertisement, CheckinStatus } from '../types';
import { apiRequest } from '../services/api';

interface CheckinViewProps {
  ads: Advertisement[];
  onOpenRecharge: () => void;
}

export const CheckinView: React.FC<CheckinViewProps> = ({ ads }) => {
  const { user, reloadProfile } = useAuth();
  const { activeTheme } = useTheme();

  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const checkinAd = ads.find(a => a.position === 'checkin_banner');

  const fetchStatus = async () => {
    try {
      const data = await apiRequest<CheckinStatus>('/checkin/status');
      setStatus(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleClaim = async () => {
    if (!user) return;
    setClaiming(true);
    setClaimError(null);
    setClaimSuccess(null);

    try {
      const res = await apiRequest('/checkin/claim', { method: 'POST' });
      setClaimSuccess(res.message);
      await reloadProfile();
      await fetchStatus();
    } catch (err: any) {
      setClaimError(err.message || 'Check-in claim failed.');
    } finally {
      setClaiming(false);
    }
  };

  const schedule = status?.rewardSchedule || [1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 10.0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Daily Rewards
        </span>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          7-Day Streak Check-in
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Claim daily cash rewards every 24 hours. Keep your streak alive to unlock the ₹100.00 bonus!
        </p>
      </div>

      {checkinAd && <AdBanner ad={checkinAd} />}

      {/* Main Streak Card */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${activeTheme.primaryColor} 0%, #312E81 100%)`,
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Current Streak: {status?.currentStreak || 0} Days</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {status?.alreadyClaimedToday ? 'Today’s Reward Claimed' : 'Reward Ready to Claim!'}
            </h3>
            <p className="text-xs text-white/80 max-w-md">
              {status?.alreadyClaimedToday
                ? 'Great job keeping your streak active today. Check back tomorrow for the next multiplier!'
                : `Claim your Day ${status?.nextDayNumber || 1} bonus directly to your wallet balance.`}
            </p>
          </div>

          <div className="shrink-0">
            {status?.alreadyClaimedToday ? (
              <div className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold">
                <Check className="w-5 h-5 text-emerald-400" />
                Claimed for Today
              </div>
            ) : (
              <button
                type="button"
                disabled={claiming}
                onClick={handleClaim}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-slate-900 font-extrabold text-sm shadow-lg hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {claiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    Claiming Bonus...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 text-blue-600" />
                    Claim Day {status?.nextDayNumber || 1} (₹{schedule[(status?.nextDayNumber || 1) - 1]?.toFixed(2)})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {claimSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          {claimSuccess}
        </div>
      )}

      {claimError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
          {claimError}
        </div>
      )}

      {/* 7-Day Interactive Progress Timeline */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          7-Day Reward Multiplier Schedule
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {schedule.map((amount, idx) => {
            const dayNum = idx + 1;
            const isCompleted = (status?.currentStreak || 0) >= dayNum;
            const isToday = status?.nextDayNumber === dayNum && !status?.alreadyClaimedToday;

            return (
              <div
                key={dayNum}
                className={`p-4 rounded-2xl border text-center transition-all flex flex-col justify-between space-y-2 ${
                  isCompleted
                    ? 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20'
                    : isToday
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold">Day {dayNum}</span>
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isToday ? (
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                  ) : null}
                </div>

                <div className="py-2">
                  <span
                    className={`text-lg font-extrabold font-mono block ${
                      isCompleted
                        ? 'text-emerald-600'
                        : isToday
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    +₹{amount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">Cash Bonus</span>
                </div>

                <div className="text-[10px] font-semibold text-slate-400">
                  {isCompleted ? (
                    <span className="text-emerald-600">Claimed</span>
                  ) : isToday ? (
                    <span className="text-purple-600 font-bold">Today</span>
                  ) : (
                    <span>Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Check-in History */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Your Check-in History
        </h4>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800">
          {(!status?.history || status.history.length === 0) ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No daily check-in claims yet. Start your streak today!
            </div>
          ) : (
            status.history.map(item => (
              <div key={item.id} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold text-xs">
                    D{item.dayNumber}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Day {item.dayNumber} Streak Reward
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.date} · Verified Claim
                    </div>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-600">
                  +₹{item.rewardAmount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
