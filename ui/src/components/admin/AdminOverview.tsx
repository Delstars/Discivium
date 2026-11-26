import { useMemo } from 'react';
import { ArrowRight, BookOpen, Building2, FileSpreadsheet, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatAedFromFils,
  formatIsoDateTimeUae,
  formatRoleLabel,
  formatStatusLabel,
} from '../../lib/formatters';
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatTile,
  StatusBadge,
  secondaryBtnClass,
} from '../ui/Primitives';

export function AdminOverview() {
  const { state, navigate } = useApp();
  if (!state) return null;

  const gov = state.governance;
  const finance = state.finance ?? [];
  const requests = state.requests ?? [];

  const summary = useMemo(() => {
    const people = gov?.people ?? [];
    const students = people.filter((p) => p.role === 'student').length;
    const lecturers = people.filter((p) => p.role === 'lecturer').length;
    const advisors = people.filter((p) => p.role === 'advisor').length;
    const admins = people.filter((p) => p.role === 'admin').length;
    const openRequests = requests.filter(
      (r) => r.status === 'pending' || r.status === 'in_review'
    ).length;
    const unpaidFils = finance
      .filter((f) => f.status === 'unpaid')
      .reduce((sum, f) => sum + f.amount_fils, 0);
    const paidFils = finance
      .filter((f) => f.status === 'paid')
      .reduce((sum, f) => sum + f.amount_fils, 0);
    return {
      totalUsers: people.length,
      students,
      lecturers,
      advisors,
      admins,
      courses: gov?.courses.length ?? 0,
      enrollments: gov?.enrollments.length ?? 0,
      programmes: gov?.programmes.length ?? 0,
      openRequests,
      unpaidFils,
      paidFils,
    };
  }, [gov, finance, requests]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${state.semester} · Campus Administration`}
        title="Campus Overview"
        description="Institution-wide operational metrics derived strictly from live server governance, finance ledger, and service request records."
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('directory')}
              className={secondaryBtnClass}
            >
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              User Directory
            </button>
            <button
              type="button"
              onClick={() => navigate('academics')}
              className={secondaryBtnClass}
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              Academic Setup
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Active Accounts"
          value={String(summary.totalUsers)}
          detail={`${summary.students} students · ${summary.lecturers} lecturers · ${summary.advisors} advisors · ${summary.admins} admin`}
          tone="accent"
        />
        <StatTile
          label="Courses & Enrollments"
          value={`${summary.courses} / ${summary.enrollments}`}
          detail={`${summary.programmes} academic programme(s) configured`}
        />
        <StatTile
          label="Open Service Requests"
          value={String(summary.openRequests)}
          detail={`${requests.length} total request(s) recorded`}
          tone={summary.openRequests > 0 ? 'amber' : 'teal'}
        />
        <StatTile
          label="Unpaid Ledger (Demo)"
          value={formatAedFromFils(summary.unpaidFils)}
          detail={`${formatAedFromFils(summary.paidFils)} settled (fictional AED)`}
          tone={summary.unpaidFils > 0 ? 'amber' : 'teal'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <SectionCard
            title="Recent Service Requests"
            action={
              <button
                type="button"
                onClick={() => navigate('requests')}
                className="text-xs font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                Open queue
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            }
          >
            {requests.length === 0 ? (
              <EmptyState
                title="No service requests"
                description="Student requests submitted through Campus Services will appear here for administrative review."
              />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {requests.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--ink)] truncate">{r.subject}</p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {r.student_name} · REQ-{r.id}
                      </p>
                    </div>
                    <StatusBadge
                      variant={
                        r.status === 'resolved'
                          ? 'success'
                          : r.status === 'in_review'
                            ? 'accent'
                            : r.status === 'pending'
                              ? 'warning'
                              : r.status === 'rejected'
                                ? 'danger'
                                : 'neutral'
                      }
                    >
                      {formatStatusLabel(r.status)}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-6">
          <SectionCard
            title="Recent Audit Trail"
            action={
              <button
                type="button"
                onClick={() => navigate('audit')}
                className="text-xs font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                Full audit log
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            }
          >
            {!gov || gov.audit.length === 0 ? (
              <EmptyState
                title="No audit events recorded"
                description="Server-recorded governance and learning events appear here."
              />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {gov.audit.slice(0, 6).map((entry) => (
                  <div
                    key={entry.id}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-[var(--ink)]">{entry.actor_name}</span>
                      <span className="text-[var(--ink-muted)]"> · </span>
                      <span className="font-mono text-[var(--accent)]">{entry.action}</span>
                      {entry.entity_id !== null && (
                        <span className="font-mono text-[var(--ink-muted)]">
                          {' '}
                          #{entry.entity_id}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)] whitespace-nowrap">
                      {formatIsoDateTimeUae(entry.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Quick Operational Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => navigate('finance')}
          className="text-left rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 hover:border-[var(--accent)] transition-colors flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">
                Finance &amp; Payment Ledger
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                Issue fictional AED invoices and review settled receipts
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--ink-muted)]" />
        </button>

        <button
          type="button"
          onClick={() => navigate('requests')}
          className="text-left rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 hover:border-[var(--accent)] transition-colors flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-[var(--teal)] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">
                Campus Service Requests Queue
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                Review, resolve, or reject student requests with legal state transitions
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--ink-muted)]" />
        </button>
      </div>

      {/* Role breakdown reference */}
      <SectionCard title="Directory Role Breakdown" subtitle="Read-only account summary (no credentials stored or returned in API views).">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {(
            [
              ['student', summary.students],
              ['lecturer', summary.lecturers],
              ['advisor', summary.advisors],
              ['admin', summary.admins],
            ] as const
          ).map(([roleKey, count]) => (
            <div
              key={roleKey}
              className="rounded-lg bg-[var(--surface-subtle)]/60 border border-[var(--border)] px-3.5 py-2.5 flex items-center justify-between"
            >
              <span className="text-[var(--ink-secondary)]">{formatRoleLabel(roleKey)}</span>
              <span className="font-mono font-semibold tabular-nums text-[var(--ink)]">{count}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
