import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatIsoDateTimeUae } from '../../lib/formatters';
import { EmptyState, PageHeader, SectionCard, inputClass } from '../ui/Primitives';

export function AdminAudit() {
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  if (!state) return null;
  const audit = state.governance?.audit ?? [];

  const actionTypes = useMemo(
    () => Array.from(new Set(audit.map((a) => a.action))).sort(),
    [audit]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return audit.filter((entry) => {
      if (actionFilter !== 'all' && entry.action !== actionFilter) return false;
      if (!q) return true;
      return (
        entry.actor_name.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        String(entry.entity_id ?? '').includes(q) ||
        String(entry.id).includes(q)
      );
    });
  }, [audit, query, actionFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance · Immutable Event Trail"
        title="System Audit History"
        description="Server-recorded audit trail (latest 200 events) searchable by actor, action identifier, or target entity ID."
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search
            className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search audit log by actor or action"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actor, action, or entity ID…"
            className={`${inputClass} pl-9`}
          />
        </div>

        <select
          aria-label="Filter by audit action"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg bg-[var(--surface)] border border-[var(--border-strong)] px-3 py-2 text-xs text-[var(--ink)]"
        >
          <option value="all">All actions ({audit.length})</option>
          {actionTypes.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>

      <SectionCard noPadding>
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No audit events match your filter"
              description="Clear the search query or action filter to view all recorded events."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-muted)]">
                  <th className="py-3 px-5 font-medium">Event ID</th>
                  <th className="py-3 px-4 font-medium">Timestamp (UAE)</th>
                  <th className="py-3 px-4 font-medium">Actor</th>
                  <th className="py-3 px-4 font-medium">Action</th>
                  <th className="py-3 px-5 font-medium text-right">Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[var(--surface-subtle)]/50">
                    <td className="py-3 px-5 font-mono tabular-nums text-[var(--ink-muted)]">
                      #{entry.id}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[var(--ink-secondary)] whitespace-nowrap">
                      {formatIsoDateTimeUae(entry.created_at)}
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--ink)]">
                      {entry.actor_name}{' '}
                      <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                        (#{entry.actor_id})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[var(--accent)]">
                      {entry.action}
                    </td>
                    <td className="py-3 px-5 font-mono tabular-nums text-right text-[var(--ink-secondary)]">
                      {entry.entity_id ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
