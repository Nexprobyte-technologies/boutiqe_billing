import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter } from 'lucide-react';
import { AuditLog } from '../../types';
import { api } from '../../services/api';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [userFilter, setUserFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [userFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs(undefined, userFilter || undefined);
      if (res.success) setLogs(res.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-wide">Security &amp; Operational Audit Trail</h1>
          <p className="text-xs text-stone-500">Immutable chronological ledger of system actions, sales transactions &amp; inventory changes</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs">
        <input
          type="text"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          placeholder="Filter audit logs by staff member..."
          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Log ID &amp; Timestamp</th>
                <th className="py-3 px-3">Staff User</th>
                <th className="py-3 px-3">Action Type</th>
                <th className="py-3 px-3">Target Entity</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">Loading audit records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">No logs found.</td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-stone-50/60 font-sans">
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-stone-900 text-[11px]">{l.id}</p>
                      <p className="text-[10px] text-stone-400 font-mono">
                        {new Date(l.timestamp).toLocaleString()}
                      </p>
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-800">{l.user}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-600">
                      {l.entity}: <span className="font-bold text-stone-800">{l.entityId}</span>
                    </td>
                    <td className="py-3 px-4 text-stone-700 max-w-md truncate text-[11px]">{l.details}</td>
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
