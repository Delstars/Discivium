import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CalendarDays, Check, Clock, FileCheck2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatAedFromFils,
  formatAttendanceRate,
  formatGpa,
  formatIsoDateTimeUae,
  formatTimeRange,
  isPastDeadline,
  weekdayName,
} from '../../lib/formatters';
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatTile,
  StatusBadge,
  secondaryBtnClass,
} from '../ui/Primitives';

export function StudentOverview() {
  const { state, navigate, executeAction } = useApp();
  const [markingId, setMarkingId] = useState<number | null>(null);

  if (!state) return null;
  const courses = state.courses ?? [];
  const timetable = state.timetable ?? [];
  const record = state.record;
  const attendance = state.attendance;
  const finance = state.finance ?? [];
  const notifications = state.notifications ?? [];

  const upcomingDeadlines = useMemo(() => {
    const items = courses.flatMap((course) =>
      course.assignments.map((a) => ({
        course,
        assignment: a,
        submission: a.submissions[0] ?? null,
      }))
    );
    return items.sort(
      (x, y) => Date.parse(x.assignment.due_at) - Date.parse(y.assignment.due_at)
    );
  }, [courses]);

  const unpaidFils = useMemo(
    () => finance.filter((i) => i.status === 'unpaid').reduce((sum, i) => sum + i.amount_fils, 0),
    [finance]
  );

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const programmeLine =
    record && record.programme.length > 0
      ? record.programme.map((p) => `${p.name} · ${p.department}`).join(' | ')
      : 'No programme assigned yet';

  const handleMarkRead = async (id: number) => {
    setMarkingId(id);
    try {
      await executeAction('notification-read', { notification_id: id });
    } catch {
      // Handled via AppContext error reporting.
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${state.semester} · ${programmeLine}`}
        title={`Welcome, ${state.user.name}`}
        description="Your active modules, upcoming coursework deadlines in UAE time, released academic standing, and campus notifications."
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('assignments')}
              className={secondaryBtnClass}
            >
              <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
              View Assignments
            </button>
            <button
              type="button"
              onClick={() => navigate('registration')}
              className={secondaryBtnClass}
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              Course Registration
            </button>
          </>
        }
      />

      {/* Real-Data Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Enrolled Modules"
          value={String(courses.length)}
          detail={`${timetable.reduce((acc, s) => acc + s.credits, 0)} scheduled credits this term`}
          tone="accent"
        />
        <StatTile
          label="Released GPA"
          value={formatGpa(record?.gpa)}
          detail={
            record && record.results.length > 0
              ? `${record.earned_credits} earned / ${record.attempted_credits} attempted credits`
              : 'Computed only from lecturer-released results'
          }
          tone={record?.gpa !== null && record?.gpa !== undefined ? 'teal' : 'neutral'}
        />
        <StatTile
          label="Attendance Rate"
          value={formatAttendanceRate(attendance?.rate)}
          detail={
            attendance && attendance.items.length > 0
              ? `${attendance.items.length} recorded session mark(s)`
              : 'No attendance marks recorded yet'
          }
          tone={
            attendance?.rate !== null && attendance?.rate !== undefined && attendance.rate < 80
              ? 'danger'
              : 'neutral'
          }
        />
        <StatTile
          label="Unpaid Balance (Demo)"
          value={formatAedFromFils(unpaidFils)}
          detail={
            unpaidFils > 0
              ? `${finance.filter((f) => f.status === 'unpaid').length} unpaid fictional invoice(s)`
              : 'All fictional invoices settled'
          }
          tone={unpaidFils > 0 ? 'amber' : 'teal'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Enrolled Modules + Upcoming Deadlines */}
        <div className="lg:col-span-8 space-y-6">
          <SectionCard
            title="Current Modules"
            subtitle="Open any module to access resources, coursework submission, discussion, and polls."
            action={
              <button
                type="button"
                onClick={() => navigate('courses')}
                className="text-xs font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                All modules
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            }
          >
            {courses.length === 0 ? (
              <EmptyState
                title="No active course enrollments"
                description="Register for Fall 2026 modules in the Registration Catalogue to populate your coursework and timetable."
                action={
                  <button
                    type="button"
                    onClick={() => navigate('registration')}
                    className={secondaryBtnClass}
                  >
                    Browse Registration Catalogue
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {courses.map((course) => {
                  const slot = timetable.find((t) => t.id === course.id);
                  const pendingTasks = course.assignments.filter(
                    (a) => a.submissions.length === 0
                  ).length;
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => navigate('course', course.id)}
                      className="text-left rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]/40 hover:bg-[var(--surface-subtle)] hover:border-[var(--accent)] p-4 transition-colors space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-[var(--accent)]">
                          {course.code}
                        </span>
                        <span className="text-[11px] text-[var(--ink-muted)] font-mono tabular-nums">
                          {course.assignments.length} task(s) · {course.resources.length} resource(s)
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[var(--ink)] leading-snug">
                        {course.title}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-secondary)] pt-1 border-t border-[var(--border)]">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                          {slot
                            ? `${weekdayName(slot.weekday, true)} ${formatTimeRange(slot.start_min, slot.end_min)} · ${slot.room}`
                            : 'Schedule unavailable'}
                        </span>
                        {pendingTasks > 0 && (
                          <StatusBadge variant="warning">{pendingTasks} to submit</StatusBadge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Upcoming & Recent Deadlines"
            subtitle="All deadlines are displayed in UAE Standard Time (UTC+4)."
            action={
              <button
                type="button"
                onClick={() => navigate('assignments')}
                className="text-xs font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                Open assignments
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            }
          >
            {upcomingDeadlines.length === 0 ? (
              <EmptyState
                title="No published assignments yet"
                description="When lecturers publish coursework for your enrolled modules, deadlines and submission statuses will appear here."
              />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {upcomingDeadlines.slice(0, 6).map(({ course, assignment, submission }) => {
                  const overdue = !submission && isPastDeadline(assignment.due_at);
                  return (
                    <div
                      key={assignment.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
                          <span className="font-mono font-semibold text-[var(--accent)]">
                            {course.code}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Max {assignment.max_points} marks</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {assignment.policy === 'strict'
                              ? 'Strict deadline'
                              : 'Late submissions allowed'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('course', course.id)}
                          className="text-sm font-semibold text-[var(--ink)] hover:text-[var(--accent)] text-left"
                        >
                          {assignment.title}
                        </button>
                        <p className="text-xs text-[var(--ink-secondary)] inline-flex items-center gap-1.5 font-mono tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                          Due {formatIsoDateTimeUae(assignment.due_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {submission ? (
                          submission.status === 'graded' ? (
                            <StatusBadge variant="success">
                              Graded: {submission.score}/{assignment.max_points}
                            </StatusBadge>
                          ) : (
                            <StatusBadge variant="accent">Submitted</StatusBadge>
                          )
                        ) : overdue ? (
                          <StatusBadge variant="danger">Past deadline</StatusBadge>
                        ) : (
                          <StatusBadge variant="warning">Pending submission</StatusBadge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Notifications Feed */}
        <div className="lg:col-span-4">
          <SectionCard
            title="Notification Feed"
            subtitle={
              unreadCount > 0 ? `${unreadCount} unread notification(s)` : 'All notifications read'
            }
          >
            {notifications.length === 0 ? (
              <EmptyState
                title="No notifications yet"
                description="Published coursework, released grades, registration confirmations, and advising updates appear here."
              />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {notifications.slice(0, 10).map((n) => (
                  <div key={n.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                    <p
                      className={`text-xs leading-relaxed ${
                        n.read_at
                          ? 'text-[var(--ink-secondary)]'
                          : 'text-[var(--ink)] font-medium'
                      }`}
                    >
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--ink-muted)]">
                      <span className="font-mono tabular-nums">
                        {formatIsoDateTimeUae(n.created_at)}
                      </span>
                      {!n.read_at ? (
                        <button
                          type="button"
                          disabled={markingId === n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className="text-[var(--accent)] font-medium hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          {markingId === n.id ? 'Saving…' : 'Mark read'}
                        </button>
                      ) : (
                        <span>Read</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
