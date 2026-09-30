import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, FileText } from 'lucide-react';
import { AuditLog } from '../../types';
import { apiRequest } from '../../services/api';

export const AdminAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiRequest('/admin/audit-logs', {}, true)
      .then(res => setLogs(res.auditLogs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(s) ||
      l.adminEmail.toLowerCase().includes(s) ||
      l.details.toLowerCase().includes(s) ||
      (l.targetId && l.targetId.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">System Security & Audit Trail</h2>
          <p className="text-xs text-slate-400">
            Immutable log of all administrative actions, financial overrides, and access events
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search action, admin, or target ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Admin Operator</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">Target Type & ID</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                    No matching audit log entries.
                  </td>
                </tr>
              ) : (
                filtered.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="text-white font-bold block">{l.adminEmail}</span>
                      <span className="text-[10px] text-purple-400 uppercase">{l.adminRole}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 font-bold border border-purple-800/80">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      <span className="uppercase text-[10px] text-slate-500 block">{l.targetType}</span>
                      {l.targetId || 'N/A'}
                    </td>
                    <td className="p-4 text-slate-300 font-sans text-xs max-w-md">
                      {l.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
