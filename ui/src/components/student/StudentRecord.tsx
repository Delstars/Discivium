import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  buildGradeDistribution,
  formatGpa,
  formatIsoDateTimeUae,
} from '../../lib/formatters';
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatTile,
  StatusBadge,
  primaryBtnClass,
} from '../ui/Primitives';

export function StudentRecord() {
  const { state, executeDownload } = useApp();
  const [downloading, setDownloading] = useState(false);

  if (!state) return null;
  const record = state.record ?? {
    results: [],
    gpa: null,
    attempted_credits: 0,
    earned_credits: 0,
    programme: [],
  };

  const distribution = useMemo(
    () => buildGradeDistribution(record.results),
    [record.results]
  );

  const handleDownloadCsv = async () => {
    setDownloading(true);
    try {
      await executeDownload('/api/transcript', 'discivium-record.csv');
    } catch {
      // Handled by AppContext toast.
    } finally {
      setDownloading(false);
    }
  };

  const programmeSummary =
    record.programme.length > 0
      ? record.programme.map((p) => `${p.name} (${p.department})`).join(' · ')
      : 'No programme assigned yet';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Scholar Passport · ${state.user.name} (@${state.user.username})`}
        title="Academic Record"
        description="Server-derived academic standing computed solely from lecturer-released course results. Fictional coursework record — not an official university transcript."
        actions={
          <button
            type="button"
            disabled={downloading}
            onClick={handleDownloadCsv}
            className={primaryBtnClass}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            {downloading ? 'Preparing CSV…' : 'Download Fictional CSV'}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Cumulative GPA"
          value={formatGpa(record.gpa)}
          detail="4.00 scale · Derived server-side"
          tone={record.gpa !== null ? 'teal' : 'neutral'}
        />
        <StatTile
          label="Released Courses"
          value={String(record.results.length)}
          detail="Final immutable lecturer releases"
          tone="accent"
        />
        <StatTile
          label="Earned Credits"
          value={String(record.earned_credits)}
          detail="Courses passed at 60% or above"
        />
        <StatTile
          label="Attempted Credits"
          value={String(record.attempted_credits)}
          detail={programmeSummary}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Released Course Results Table */}
        <div className="lg:col-span-8">
          <SectionCard
            title="Released Course Results"
            subtitle="Results appear only after all published assignments in a module are graded and released by the lecturer."
            noPadding
          >
            {record.results.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No released course results yet"
                  description="Once a lecturer grades all published assignments for a course and releases your final course result, it will appear here and contribute to your GPA."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-muted)]">
                      <th className="py-3 px-5 font-medium">Course</th>
                      <th className="py-3 px-4 font-medium text-right">Credits</th>
                      <th className="py-3 px-4 font-medium text-right">Percentage</th>
                      <th className="py-3 px-4 font-medium text-right">Grade</th>
                      <th className="py-3 px-4 font-medium text-right">Points</th>
                      <th className="py-3 px-5 font-medium text-right">Released (UAE)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-sm">
                    {record.results.map((r) => (
                      <tr key={r.course_id}>
                        <td className="py-3.5 px-5">
                          <p className="font-mono text-xs font-semibold text-[var(--accent)]">
                            {r.code}
                          </p>
                          <p className="text-sm font-medium text-[var(--ink)]">{r.title}</p>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-right text-[var(--ink-secondary)]">
                          {r.credits}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-right text-[var(--ink)]">
                          {r.percentage.toFixed(2)}%
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <StatusBadge
                            variant={
                              r.percentage >= 80
                                ? 'success'
                                : r.percentage >= 60
                                  ? 'accent'
                                  : 'danger'
                            }
                          >
                            {r.letter}
                          </StatusBadge>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-right text-[var(--ink-secondary)]">
                          {r.grade_points.toFixed(1)}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs tabular-nums text-right text-[var(--ink-muted)] whitespace-nowrap">
                          {formatIsoDateTimeUae(r.released_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Grade Distribution */}
        <div className="lg:col-span-4 space-y-6">
          <SectionCard
            title="Grade Distribution"
            subtitle="Computed directly from released results."
          >
            {distribution.length === 0 ? (
              <EmptyState
                title="No distribution data"
                description="Grade buckets will appear once at least one final course result is released."
              />
            ) : (
              <div className="space-y-3">
                {distribution.map((bucket) => (
                  <div key={bucket.letter} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-[var(--ink)]">
                        Grade {bucket.letter}
                      </span>
                      <span className="font-mono tabular-nums text-[var(--ink-muted)]">
                        {bucket.count} course(s) · {bucket.percentage}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full"
                        style={{ width: `${bucket.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]/60 p-4 text-xs text-[var(--ink-secondary)] leading-relaxed">
            <p className="font-semibold text-[var(--ink)]">Fictional Record Notice</p>
            <p className="mt-1">
              The CSV export downloaded from <code>GET /api/transcript</code> is a local fictional
              record generated for coursework demonstration and is not an official university
              transcript or accredited credential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
