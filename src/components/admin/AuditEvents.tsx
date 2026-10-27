import React, { useState } from 'react';
import { useInstitution } from '../../context/InstitutionContext';
import { storageEngine, useStorageSubscription } from '../../lib/storageEngine';
import { formatDateTime, exportToCSV } from '../../lib/utils';
import { EmptyState } from '../common/EmptyState';

export const AuditEvents: React.FC = () => {
  useStorageSubscription();
  const { terminology } = useInstitution();
  const [filterAction, setFilterAction] = useState<string>('All');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const events = storageEngine.listAuditEvents(100);

  const filteredEvents = events.filter(e => {
    if (filterAction !== 'All' && e.action !== filterAction) return false;
    return true;
  });

  const uniqueActions = Array.from(new Set(events.map(e => e.action)));

  const handleExportCSV = () => {
    const rows = filteredEvents.map(e => ({
      ID: e.id,
      Timestamp: formatDateTime(e.created_at),
      Action: e.action,
      EntityType: e.entity_type,
      EntityID: e.entity_id,
      Actor: e.actor?.full_name || 'System',
      Reason: e.reason || '',
      Metadata: JSON.stringify(e.metadata || {})
    }));
    exportToCSV('ShiftBridge_Compliance_Audit_Log.csv', rows);
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Compliance Audit Trail</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              Immutable Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Forensic event log recording managerial overrides, attendance corrections, and schedule changes
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold flex items-center gap-1.5 transition-colors border border-slate-200 self-start sm:self-auto"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">file_download</span>
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* 2. Action Filter Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Action:</span>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-container"
          >
            <option value="All">All Actions ({events.length})</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Event Stream Table */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon="policy"
          title="No Audit Records Found"
          description="No forensic compliance events matching your filter."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Action Code</th>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Target &amp; Scope</th>
                  <th className="px-6 py-3.5">Auditable Reason</th>
                  <th className="px-6 py-3.5 text-right">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map(event => {
                  const isExpanded = expandedEventId === event.id;

                  return (
                    <React.Fragment key={event.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {formatDateTime(event.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono text-[11px] font-bold text-slate-800">
                            {event.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800 block text-[12px]">
                            {event.actor?.full_name || 'System Auto'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono capitalize">
                            {event.actor?.role || 'Daemon'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
                            {event.entity_type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px] block">
                            {event.entity_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700 max-w-xs">
                          {event.reason || <span className="text-slate-400 italic">Standard workflow</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                            className="text-primary-container font-bold hover:underline text-[11px]"
                            type="button"
                          >
                            {isExpanded ? 'Hide Payload' : 'View Payload'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Metadata Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={6} className="px-6 py-3">
                            <pre className="p-3 bg-slate-900 text-teal-300 rounded-xl text-[11px] font-mono overflow-x-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
