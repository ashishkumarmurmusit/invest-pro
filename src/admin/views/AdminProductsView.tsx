import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Zap, Loader2, Lock, Flame, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { apiRequest } from '../../services/api';

export const AdminProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await apiRequest<{ products: Product[] }>('/admin/products', {}, true);
      setProducts(res.products || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct({
      name: '',
      subtitle: '',
      planType: 'locking_cycle',
      price: 500,
      dailyReturn: 60,
      durationDays: 25,
      totalReturn: 1500,
      description: '',
      badge: 'Locking Cycle',
      colorScheme: 'purple',
      iconType: 'solar',
      stock: 500,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct({
      ...p,
      planType: p.planType || 'daily_withdrawal',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiRequest(`/admin/products/${id}`, { method: 'DELETE' }, true);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handlePlanTypeChange = (type: 'locking_cycle' | 'daily_withdrawal') => {
    if (type === 'locking_cycle') {
      setEditingProduct({
        ...editingProduct,
        planType: 'locking_cycle',
        badge: editingProduct.badge || 'Locking Cycle',
        durationDays: editingProduct.durationDays || 25,
        totalReturn: editingProduct.totalReturn || (editingProduct.price * 3),
      });
    } else {
      const daily = editingProduct.dailyReturn || 100;
      const days = editingProduct.durationDays || 65;
      setEditingProduct({
        ...editingProduct,
        planType: 'daily_withdrawal',
        badge: editingProduct.badge || 'Daily Payout',
        dailyReturn: daily,
        durationDays: days,
        totalReturn: Number((daily * days).toFixed(2)),
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingProduct.id) {
        // Edit
        await apiRequest(`/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingProduct),
        }, true);
      } else {
        // Create
        await apiRequest('/admin/products', {
          method: 'POST',
          body: JSON.stringify(editingProduct),
        }, true);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Product & Investment Plan Management</h2>
          <p className="text-xs text-slate-400">Configure Locking Cycles, Daily Withdrawal plans, prices, durations, and returns</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Investment Plan
        </button>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <div
            key={p.id}
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                    {p.planType === 'locking_cycle' ? <Lock className="w-4 h-4 text-amber-400" /> : <Zap className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      p.planType === 'locking_cycle'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {p.planType === 'locking_cycle' ? '🔒 Locking Cycle' : '⚡ Daily Withdrawal'}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                  {p.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="mt-3">
                <h4 className="font-bold text-sm text-white">{p.name}</h4>
                <p className="text-[11px] text-slate-400">{p.subtitle}</p>
              </div>

              {/* Financial Metrics */}
              <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Price:</span>
                  <span className="font-bold font-mono text-white">₹{p.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cycle Duration:</span>
                  <span className="font-bold text-slate-200">{p.durationDays} Days</span>
                </div>
                {p.planType === 'daily_withdrawal' ? (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily Return:</span>
                    <span className="font-bold font-mono text-emerald-400">+₹{p.dailyReturn.toFixed(2)} / day</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payout Type:</span>
                    <span className="font-semibold text-amber-400">Maturity Unlock</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-800 pt-1 font-bold">
                  <span className="text-slate-300">Total Return:</span>
                  <span className="font-mono text-purple-400">₹{p.totalReturn.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Stock: <span className="font-mono text-white font-semibold">{p.stock}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Edit Plan"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-400 transition-colors"
                  title="Delete Plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Edit / Add Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingProduct.id ? 'Edit Investment Plan' : 'Create New Investment Plan'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Option 1 & 2 Selector: Locking Cycle vs Daily Withdrawal */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  Investment Plan Type & Return Model <span className="text-purple-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handlePlanTypeChange('locking_cycle')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2 transition-all ${
                      editingProduct.planType === 'locking_cycle'
                        ? 'border-amber-500 bg-amber-950/40 text-white ring-2 ring-amber-500/30'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-white">1. Locking Cycle</div>
                      <div className="text-[10px] text-slate-400">Capital locked for fixed days, 100% total return at maturity</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlanTypeChange('daily_withdrawal')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2 transition-all ${
                      editingProduct.planType === 'daily_withdrawal'
                        ? 'border-emerald-500 bg-emerald-950/40 text-white ring-2 ring-emerald-500/30'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-white">2. Daily Withdrawal</div>
                      <div className="text-[10px] text-slate-400">Daily profit withdrawal directly to user wallet every 24h</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Plan Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 25-Day Capital Lock Vault or 65-Day Daily Income Node"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subtitle / Category</label>
                <input
                  type="text"
                  placeholder="e.g. High Compound Yield or 24h Daily Payout Node"
                  value={editingProduct.subtitle}
                  onChange={e => setEditingProduct({ ...editingProduct, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              {/* Dynamic Inputs Based on Plan Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Investment Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingProduct.price}
                    onChange={e => {
                      const newPrice = Number(e.target.value);
                      if (editingProduct.planType === 'daily_withdrawal') {
                        setEditingProduct({
                          ...editingProduct,
                          price: newPrice,
                        });
                      } else {
                        setEditingProduct({
                          ...editingProduct,
                          price: newPrice,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingProduct.durationDays}
                    onChange={e => {
                      const newDays = Number(e.target.value);
                      if (editingProduct.planType === 'daily_withdrawal') {
                        setEditingProduct({
                          ...editingProduct,
                          durationDays: newDays,
                          totalReturn: Number((editingProduct.dailyReturn * newDays).toFixed(2)),
                        });
                      } else {
                        setEditingProduct({
                          ...editingProduct,
                          durationDays: newDays,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                  />
                </div>

                {editingProduct.planType === 'daily_withdrawal' ? (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Daily Profit (₹/day)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0"
                      value={editingProduct.dailyReturn}
                      onChange={e => {
                        const newDaily = Number(e.target.value);
                        setEditingProduct({
                          ...editingProduct,
                          dailyReturn: newDaily,
                          totalReturn: Number((newDaily * editingProduct.durationDays).toFixed(2)),
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Total Maturity Payout (₹)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0"
                      value={editingProduct.totalReturn}
                      onChange={e => setEditingProduct({ ...editingProduct, totalReturn: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Payout Preview Summary */}
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-200">
                {editingProduct.planType === 'locking_cycle' ? (
                  <span>
                    🔒 <strong>Locking Cycle Summary:</strong> User deposits ₹{editingProduct.price}. Funds lock for {editingProduct.durationDays} days. On day {editingProduct.durationDays}, full <strong>₹{editingProduct.totalReturn}</strong> unlocks and transfers to wallet.
                  </span>
                ) : (
                  <span>
                    ⚡ <strong>Daily Withdrawal Summary:</strong> User deposits ₹{editingProduct.price}. Generates <strong>₹{editingProduct.dailyReturn}/day</strong> for {editingProduct.durationDays} days. Total payout = <strong>₹{editingProduct.totalReturn}</strong>.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Stock Units</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Locking Cycle, Daily Payout, VIP"
                    value={editingProduct.badge || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prodActive"
                  checked={editingProduct.isActive}
                  onChange={e => setEditingProduct({ ...editingProduct, isActive: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <label htmlFor="prodActive" className="text-slate-300 font-medium">
                  Plan Active & Visible in User Catalog
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white shadow-md flex items-center justify-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Investment Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
