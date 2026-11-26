import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { AttendanceStatus } from '../../types/api';
import { formatAttendanceRate, formatStatusLabel } from '../../lib/formatters';
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatTile,
  StatusBadge,
} from '../ui/Primitives';

function statusBadgeVariant(status: AttendanceStatus) {
  switch (status) {
    case 'present':
      return 'success' as const;
    case 'late':
      return 'warning' as const;
    case 'absent':
      return 'danger' as const;
    case 'excused':
      return 'neutral' as const;
  }
}

export function StudentAttendance() {
  const { state } = useApp();
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  if (!state) return null;
  const attendance = state.attendance ?? { items: [], rate: null };

  const courseCodes = useMemo(
    () => Array.from(new Set(attendance.items.map((i) => i.code))).sort(),
    [attendance.items]
  );

  const filtered = useMemo(
    () =>
      attendance.items.filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        if (courseFilter !== 'all' && item.code !== courseFilter) return false;
        return true;
      }),
    [attendance.items, statusFilter, courseFilter]
  );

  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0, excused: 0 };
    for (const item of attendance.items) c[item.status] += 1;
    return c;
  }, [attendance.items]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={state.semester}
        title="Attendance History"
        description="Present and late marks count toward your attendance percentage; excused absences are excluded. Unmarked sessions are never fabricated as 0%."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Attendance Rate"
          value={formatAttendanceRate(attendance.rate)}
          detail={
            attendance.rate === null
              ? 'No non-excused marks recorded yet'
              : 'Computed server-side from recorded sessions'
          }
          tone={
            attendance.rate === null
              ? 'neutral'
              : attendance.rate < 80
                ? 'danger'
                : 'teal'
          }
        />
        <StatTile label="Present" value={String(counts.present)} detail="Sessions attended on time" />
        <StatTile
          label="Late"
          value={String(counts.late)}
          detail="Counted in attendance rate"
          tone={counts.late > 0 ? 'amber' : 'neutral'}
        />
        <StatTile
          label="Absent / Excused"
          value={`${counts.absent} / ${counts.excused}`}
          detail="Excused marks excluded from denominator"
          tone={counts.absent > 0 ? 'danger' : 'neutral'}
        />
      </div>

      <SectionCard
        title="Session Attendance Log"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by course"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="rounded-lg bg-[var(--surface)] border border-[var(--border-strong)] px-2.5 py-1.5 text-xs text-[var(--ink)]"
            >
              <option value="all">All courses</option>
              {courseCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | AttendanceStatus)}
              className="rounded-lg bg-[var(--surface)] border border-[var(--border-strong)] px-2.5 py-1.5 text-xs text-[var(--ink)]"
            >
              <option value="all">All statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
            </select>
          </div>
        }
        noPadding
      >
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No attendance marks recorded"
              description={
                attendance.items.length === 0
                  ? 'Marks appear here after your lecturers create and record attendance sessions.'
                  : 'No sessions match the selected filters.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-muted)]">
                  <th className="py-3 px-5 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Course</th>
                  <th className="py-3 px-4 font-medium">Session Title</th>
                  <th className="py-3 px-5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {filtered.map((item) => (
                  <tr key={`${item.session_id}-${item.code}`}>
                    <td className="py-3 px-5 font-mono text-xs tabular-nums text-[var(--ink-secondary)] whitespace-nowrap">
                      {item.session_date}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-[var(--accent)] whitespace-nowrap">
                      {item.code}
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--ink)]">{item.title}</td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <StatusBadge variant={statusBadgeVariant(item.status)}>
                        {formatStatusLabel(item.status)}
                      </StatusBadge>
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
