import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Share2, Award, ChevronRight, TrendingUp, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AdBanner } from '../components/ads/AdBanner';
import { Advertisement, ReferralData } from '../types';
import { apiRequest } from '../services/api';

interface TeamViewProps {
  ads: Advertisement[];
}

export const TeamView: React.FC<TeamViewProps> = ({ ads }) => {
  const { user } = useAuth();
  const { activeTheme } = useTheme();

  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeLevelTab, setActiveLevelTab] = useState<'1' | '2' | '3'>('1');

  const refAd = ads.find(a => a.position === 'referral_banner');

  const fetchReferrals = async () => {
    try {
      const res = await apiRequest<ReferralData>('/referral');
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleCopyCode = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!user) return;
    const url = `${window.location.origin}?ref=${user.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const currentLevelMembers =
    activeLevelTab === '1'
      ? data?.level1.members || []
      : activeLevelTab === '2'
      ? data?.level2.members || []
      : data?.level3.members || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          Affiliate Program
        </span>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Refer & Earn Team Hub
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Build your organization across 3 tiers. Receive continuous commission on every node recharge.
        </p>
      </div>

      {refAd && <AdBanner ad={refAd} />}

      {/* Main Referral Invite Card */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${activeTheme.primaryColor} 0%, #4338CA 100%)`,
        }}
      >
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-white/80 font-medium">Total Team Commissions Earned</span>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums">
                ₹{data ? data.totalCommission.toFixed(2) : '0.00'}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-white/80 font-medium">Total Active Team Size</span>
              <div className="text-2xl font-extrabold font-mono">
                {data ? data.totalTeamSize : 0} Members
              </div>
            </div>
          </div>

          {/* Copy Bar */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-white/80 block mb-1">Your Personal Referral Code:</span>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/20 border border-white/30">
                <span className="font-mono font-bold tracking-widest text-sm">
                  {user?.referralCode || 'NEXUS987'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-white/80 block mb-1">Direct Invite Link:</span>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/20 border border-white/30">
                <span className="font-mono text-xs truncate max-w-[200px]">
                  {window.location.origin}?ref={user?.referralCode || 'NEXUS987'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Tier Multi-Level Commission Structure */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          3-Tier Multi-Level Commission Structure
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Level 1 (Direct)</span>
              <span className="text-xs font-extrabold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                {data?.rates.level1 || 10}% Commission
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Users who register directly using your referral code.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
              <span className="text-slate-400">Team Members:</span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {data?.level1.count || 0}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Level 2 (Indirect)</span>
              <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                {data?.rates.level2 || 5}% Commission
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Users invited by your Level 1 direct team members.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
              <span className="text-slate-400">Team Members:</span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {data?.level2.count || 0}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Level 3 (Sub-Tier)</span>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                {data?.rates.level3 || 2}% Commission
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Users invited by your Level 2 indirect team members.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
              <span className="text-slate-400">Team Members:</span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {data?.level3.count || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Member Lists & Level Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Team Member Directory</h4>
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              onClick={() => setActiveLevelTab('1')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeLevelTab === '1'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Level 1 ({data?.level1.count || 0})
            </button>
            <button
              onClick={() => setActiveLevelTab('2')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeLevelTab === '2'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Level 2 ({data?.level2.count || 0})
            </button>
            <button
              onClick={() => setActiveLevelTab('3')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeLevelTab === '3'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Level 3 ({data?.level3.count || 0})
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800">
          {currentLevelMembers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No members in Level {activeLevelTab} yet. Share your invite link to build your team!
            </div>
          ) : (
            currentLevelMembers.map(m => (
              <div key={m.id} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                    {m.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{m.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {m.mobile || '••••'} · Joined {new Date(m.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                  Active Member
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
