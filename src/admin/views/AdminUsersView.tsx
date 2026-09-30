import React, { useEffect, useState } from 'react';
import { Search, UserCheck, UserX, DollarSign, Building2, CheckCircle2, AlertCircle, Loader2, Key, Sparkles, ExternalLink } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { EditUserCredentialsModal } from '../components/EditUserCredentialsModal';
import { CreateTestUserModal } from '../components/CreateTestUserModal';

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingCredentialsUser, setEditingCredentialsUser] = useState<any>(null);
  const [showCreateTestUser, setShowCreateTestUser] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await apiRequest(`/admin/users?search=${encodeURIComponent(search)}`, {}, true);
      setUsers(res.users);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleToggleStatus = async (user: any) => {
    try {
      const res = await apiRequest(`/admin/users/${user.id}/toggle-status`, { method: 'POST' }, true);
      user.isActive = res.isActive;
      setUsers([...users]);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleTestLogin = async (user: any) => {
    try {
      const res = await apiRequest<{ success: boolean; token: string; user: any }>(
        `/admin/users/${user.id}/test-login`,
        { method: 'POST' },
        true
      );
      localStorage.setItem('user_token', res.token);
      localStorage.setItem('user_data', JSON.stringify(res.user));
      window.open('/', '_blank');
    } catch (err: any) {
      alert(err.message || 'Failed to start test session');
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const num = Number(adjustAmount);
    if (isNaN(num) || num === 0) return;

    setAdjustLoading(true);
    setMessage(null);

    try {
      const res = await apiRequest(`/admin/users/${selectedUser.id}/adjust-balance`, {
        method: 'POST',
        body: JSON.stringify({ amount: num, reason: adjustReason }),
      }, true);
      selectedUser.walletBalance = res.newBalance;
      setMessage(`Balance updated successfully! New balance: ₹${res.newBalance.toFixed(2)}`);
      setAdjustAmount('');
      setAdjustReason('');
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust balance');
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Registered User Directory</h2>
          <p className="text-xs text-slate-400">Search members, review bank credentials, change login ID/passwords and test accounts</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowCreateTestUser(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
            title="Create a fresh test user with simulated balance"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>+ Quick Test User</span>
          </button>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, phone, referral..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">User Details</th>
                <th className="p-4">Mobile / Referral</th>
                <th className="p-4">Wallet Balance</th>
                <th className="p-4">Bank Account</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{u.fullName}</div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="p-4 font-mono">
                      <div>{u.mobile}</div>
                      <span className="text-[10px] text-purple-400 font-bold">Code: {u.referralCode}</span>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400 text-sm">
                      ₹{u.walletBalance.toFixed(2)}
                    </td>
                    <td className="p-4">
                      {u.bankAccount ? (
                        <div className="text-[11px]">
                          <span className="font-semibold text-white block">{u.bankAccount.bankName}</span>
                          <span className="text-slate-400 font-mono">{u.bankAccount.maskedAccountNumber}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Unlinked</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Change ID & Password Button */}
                      <button
                        onClick={() => {
                          setEditingCredentialsUser(u);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 hover:text-white font-semibold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                        title="Change User ID & Password"
                      >
                        <Key className="w-3 h-3" />
                        <span>ID / Password</span>
                      </button>

                      {/* Test Login Button */}
                      <button
                        onClick={() => handleTestLogin(u)}
                        className="px-2.5 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-800/80 text-sky-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                        title="Simulate / Test Login as this User directly in user panel"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Test Login</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setMessage(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-semibold text-[11px]"
                      >
                        Adjust Balance
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] ${
                          u.isActive
                            ? 'bg-red-950/60 hover:bg-red-900/80 text-red-300'
                            : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300'
                        }`}
                      >
                        {u.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Balance Adjustment Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Manual Balance Adjustment</h3>
                <p className="text-xs text-slate-400">{selectedUser.fullName} ({selectedUser.mobile})</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between text-xs">
              <span className="text-slate-400">Current Balance:</span>
              <span className="font-mono font-bold text-emerald-400">
                ₹{selectedUser.walletBalance.toFixed(2)}
              </span>
            </div>

            {message && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs">
                {message}
              </div>
            )}

            <form onSubmit={handleAdjustBalance} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adjustment Delta (₹ INR, use negative to deduct)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 500 or -250"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Audit Reason / Justification
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP deposit credit or manual dispute resolution"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {adjustLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Credentials Modal */}
      {editingCredentialsUser && (
        <EditUserCredentialsModal
          user={editingCredentialsUser}
          onClose={() => setEditingCredentialsUser(null)}
          onSuccess={(updated) => {
            setEditingCredentialsUser(null);
            fetchUsers();
          }}
        />
      )}

      {/* Create Test User Modal */}
      {showCreateTestUser && (
        <CreateTestUserModal
          onClose={() => setShowCreateTestUser(false)}
          onSuccess={() => {
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};
