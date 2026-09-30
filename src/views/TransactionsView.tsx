import React, { useState } from 'react';
import { ArrowLeft, Search, ArrowUpRight, ArrowDownRight, TrendingUp, CalendarCheck, Sparkles, Filter } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionsViewProps {
  transactions: Transaction[];
  onBack: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ transactions, onBack }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filterTabs = [
    { id: 'all', label: 'All Transactions' },
    { id: 'recharge', label: 'Recharges' },
    { id: 'withdrawal', label: 'Withdrawals' },
    { id: 'order', label: 'Orders' },
    { id: 'checkin', label: 'Check-ins' },
    { id: 'referral', label: 'Commissions' },
  ];

  const filtered = transactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        tx.id.toLowerCase().includes(s) ||
        tx.description.toLowerCase().includes(s) ||
        tx.status.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transaction Ledger</h2>
          <p className="text-xs text-slate-500">Chronological history of all wallet movements</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === tab.id
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Tx ID, description, or status..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Transactions List */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No transactions found matching your criteria.
          </div>
        ) : (
          filtered.map(tx => (
            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === 'recharge'
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60'
                      : tx.type === 'withdrawal'
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60'
                      : tx.type === 'referral'
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-950/60'
                      : tx.type === 'checkin'
                      ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60'
                      : 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/60'
                  }`}
                >
                  {tx.type === 'recharge' ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : tx.type === 'withdrawal' ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : tx.type === 'checkin' ? (
                    <CalendarCheck className="w-5 h-5" />
                  ) : tx.type === 'referral' ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {tx.description}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {tx.id} · {new Date(tx.createdAt).toLocaleDateString()} at{' '}
                    {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`text-xs font-mono font-bold ${
                    tx.netAmount >= 0 ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-200'
                  }`}
                >
                  {tx.netAmount >= 0 ? `+₹${tx.netAmount.toFixed(2)}` : `-₹${Math.abs(tx.netAmount).toFixed(2)}`}
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider block mt-0.5 ${
                    tx.status === 'completed'
                      ? 'text-emerald-500'
                      : tx.status === 'pending'
                      ? 'text-amber-500'
                      : tx.status === 'processing'
                      ? 'text-blue-500'
                      : 'text-red-500'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
