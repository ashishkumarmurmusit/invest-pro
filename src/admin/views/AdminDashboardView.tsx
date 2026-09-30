import React, { useEffect, useState } from 'react';
import {
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Package,
  Layers,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Key,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { EditUserCredentialsModal } from '../components/EditUserCredentialsModal';
import { CreateTestUserModal } from '../components/CreateTestUserModal';

export const AdminDashboardView: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showCreateTestUser, setShowCreateTestUser] = useState(false);

  const fetchDashboardData = () => {
    apiRequest('/admin/dashboard', {}, true)
      .then(res => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Loading executive dashboard metrics...
      </div>
    );
  }

  const { metrics, revenueChart, recentTransactions, recentUsers } = data;

  return (
    <div className="space-y-6">
      {/* Metrics Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Registered Users</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {metrics.totalUsers}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <span>{metrics.activeUsers} active accounts</span>
          </div>
        </div>

        {/* Total Recharges */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Verified Recharges</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            ₹{metrics.totalRecharge.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400">Lifetime gateway volume</div>
        </div>

        {/* Total Withdrawals */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Settled Withdrawals</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            ₹{metrics.totalWithdrawals.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400">Settled to bank accounts</div>
        </div>

        {/* Pending Withdrawals */}
        <div
          onClick={() => onNavigate('withdrawals')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 cursor-pointer hover:border-amber-600/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Pending Withdrawals</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            {metrics.pendingWithdrawalsCount} Requests
          </div>
          <div className="text-[11px] text-amber-300 font-mono">
            ₹{metrics.pendingWithdrawalsAmount.toFixed(2)} awaiting payout
          </div>
        </div>
      </div>

      {/* Volume Chart & Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Volume Chart Visual */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">7-Day Transaction Volume Flow</h3>
              <p className="text-xs text-slate-400">Comparative recharge vs payout trends</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Recharge
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Withdrawal
              </span>
            </div>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
            {revenueChart.map((col: any) => (
              <div key={col.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center gap-1.5 h-40">
                  {/* Recharge Bar */}
                  <div
                    className="w-full max-w-[20px] bg-purple-600 hover:bg-purple-500 rounded-t-md transition-all relative group"
                    style={{ height: `${Math.min(100, Math.max(15, (col.recharge / 800) * 100))}%` }}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-black px-1.5 py-0.5 rounded text-white pointer-events-none whitespace-nowrap">
                      ₹{col.recharge}
                    </span>
                  </div>
                  {/* Withdrawal Bar */}
                  <div
                    className="w-full max-w-[20px] bg-blue-600 hover:bg-blue-500 rounded-t-md transition-all relative group"
                    style={{ height: `${Math.min(100, Math.max(15, (col.withdrawal / 800) * 100))}%` }}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-black px-1.5 py-0.5 rounded text-white pointer-events-none whitespace-nowrap">
                      ₹{col.withdrawal}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">{col.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick System Stats */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">System Deployments</h3>
            <p className="text-xs text-slate-400">Inventory and contract health</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-300">Active Node Products</span>
              </div>
              <span className="font-mono font-bold text-white">{metrics.totalProducts}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-slate-300">Total User Contracts</span>
              </div>
              <span className="font-mono font-bold text-white">{metrics.totalOrders}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-300">Escrow Security</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-400">100% Intact</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('products')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
          >
            Manage Product Inventory
          </button>
        </div>
      </div>

      {/* Recent Activity: Users & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Users */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent Registered Users</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreateTestUser(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
                title="Create a test user account with pre-filled balance"
              >
                <Sparkles className="w-3 h-3" />
                <span>+ Test User</span>
              </button>
              <button
                onClick={() => onNavigate('users')}
                className="text-xs text-purple-400 hover:underline font-semibold"
              >
                View All
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{u.fullName}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    ID: <strong className="text-purple-300">{u.mobile}</strong> · {u.email}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      ₹{u.walletBalance.toFixed(2)}
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-semibold">
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  {/* Change ID & Password action button */}
                  <button
                    type="button"
                    onClick={() => setEditingUser(u)}
                    className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 hover:text-white transition-all cursor-pointer"
                    title="Change User ID & Password"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Ledger Transactions */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Live Transaction Stream</h3>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-purple-400 hover:underline"
            >
              View Ledger
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {recentTransactions.slice(0, 5).map((t: any) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{t.description}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {t.id} · {new Date(t.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-mono font-bold ${t.netAmount >= 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {t.netAmount >= 0 ? `+₹${t.netAmount.toFixed(2)}` : `-₹${Math.abs(t.netAmount).toFixed(2)}`}
                  </div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit User Credentials Modal */}
      {editingUser && (
        <EditUserCredentialsModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={(updated) => {
            setEditingUser(null);
            fetchDashboardData();
          }}
        />
      )}

      {/* Quick Test User Registration Modal */}
      {showCreateTestUser && (
        <CreateTestUserModal
          onClose={() => setShowCreateTestUser(false)}
          onSuccess={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
};
