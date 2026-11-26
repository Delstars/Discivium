import { useMemo } from 'react';
import { ArrowRight, BookOpen, CalendarDays, FileCheck2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatTimeRange, weekdayName } from '../../lib/formatters';
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatTile,
  StatusBadge,
  primaryBtnClass,
  secondaryBtnClass,
} from '../ui/Primitives';

export function LecturerOverview() {
  const { state, navigate } = useApp();
  if (!state) return null;

  const courses = state.courses ?? [];
  const timetable = state.timetable ?? [];

  const stats = useMemo(() => {
    let assignments = 0;
    let ungraded = 0;
    let graded = 0;
    let totalEnrollments = 0;
    for (const c of courses) {
      assignments += c.assignments.length;
      totalEnrollments += (c.roster ?? []).length;
      for (const a of c.assignments) {
        for (const s of a.submissions) {
          if (s.status === 'graded') graded += 1;
          else ungraded += 1;
        }
      }
    }
    return { assignments, ungraded, graded, totalEnrollments };
  }, [courses]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${state.semester} · Assigned Faculty Scope`}
        title={`Teaching Overview — ${state.user.name}`}
        description="Manage only the courses assigned to your faculty account: publish assignments and resources, grade submissions, record attendance, and facilitate course polls."
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('submissions')}
              className={secondaryBtnClass}
            >
              <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
              Submission Queue ({stats.ungraded})
            </button>
            <button
              type="button"
              onClick={() => navigate('timetable')}
              className={secondaryBtnClass}
            >
              <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
              Weekly Timetable
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Assigned Courses"
          value={String(courses.length)}
          detail="Scoped strictly to your teaching assignments"
          tone="accent"
        />
        <StatTile
          label="Enrolled Roster Seats"
          value={String(stats.totalEnrollments)}
          detail="Active student seats across assigned courses"
        />
        <StatTile
          label="Pending Grading"
          value={String(stats.ungraded)}
          detail={`${stats.graded} submission(s) already graded`}
          tone={stats.ungraded > 0 ? 'amber' : 'teal'}
        />
        <StatTile
          label="Published Assignments"
          value={String(stats.assignments)}
          detail="Across your active course workspaces"
        />
      </div>

      <SectionCard
        title="Your Assigned Courses"
        subtitle="Select a course to publish assignments/resources, download and grade work, mark attendance, or release final results."
        action={
          <button
            type="button"
            onClick={() => navigate('courses')}
            className="text-xs font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
          >
            All assigned courses
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        }
      >
        {courses.length === 0 ? (
          <EmptyState
            title="No assigned courses"
            description="Courses assigned to your faculty account by campus administration will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => {
              const slot = timetable.find((t) => t.id === course.id);
              const pendingCount = course.assignments.reduce(
                (acc, a) => acc + a.submissions.filter((s) => s.status !== 'graded').length,
                0
              );
              const rosterCount = (course.roster ?? []).length;
              return (
                <div
                  key={course.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]/35 p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[var(--accent)]">
                        {course.code}
                      </span>
                      {pendingCount > 0 ? (
                        <StatusBadge variant="warning">{pendingCount} to grade</StatusBadge>
                      ) : (
                        <StatusBadge variant="neutral">Up to date</StatusBadge>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-[var(--ink)]">{course.title}</h3>
                    <p className="text-xs text-[var(--ink-secondary)]">
                      {slot
                        ? `${weekdayName(slot.weekday)} · ${formatTimeRange(slot.start_min, slot.end_min)} · Room ${slot.room}`
                        : 'No scheduled room slot'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border)]">
                    <span className="text-xs text-[var(--ink-muted)] font-mono tabular-nums">
                      {rosterCount} student(s) · {course.assignments.length} task(s) ·{' '}
                      {course.resources.length} file(s)
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('course', course.id)}
                      className={primaryBtnClass}
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      Manage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export function LecturerCoursesList() {
  const { state, navigate } = useApp();
  if (!state) return null;
  const courses = state.courses ?? [];
  const timetable = state.timetable ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${state.semester} · Assigned Courses Only`}
        title="Assigned Courses"
        description="Only courses assigned to you are returned by the server. Courses taught by other faculty members are isolated server-side."
      />

      {courses.length === 0 ? (
        <EmptyState
          title="No assigned courses"
          description="You do not currently have any course offerings assigned for Fall 2026."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => {
            const slot = timetable.find((t) => t.id === course.id);
            const releasedCount = (course.released_results ?? []).length;
            const rosterCount = (course.roster ?? []).length;
            return (
              <SectionCard key={course.id}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[var(--accent)]">
                      {course.code}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                      {rosterCount} enrolled · {releasedCount} result(s) released
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
                    {course.title}
                  </h2>
                  <p className="text-xs text-[var(--ink-secondary)]">
                    {slot
                      ? `${weekdayName(slot.weekday)} · ${formatTimeRange(slot.start_min, slot.end_min)} · Room ${slot.room}`
                      : 'Schedule unavailable'}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('course', course.id)}
                      className={primaryBtnClass}
                    >
                      Open Course Workspace
                    </button>
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
