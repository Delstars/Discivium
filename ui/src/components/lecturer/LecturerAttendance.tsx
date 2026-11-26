import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import type { CourseItem, AttendanceStatus } from '../../types/api';
import { formatStatusLabel } from '../../lib/formatters';
import { EmptyState, ErrorBanner, Field, SectionCard, StatusBadge, inputClass, primaryBtnClass } from '../ui/Primitives';

export function LecturerAttendance({ course, active }: { course: CourseItem; active: boolean }) {
  const { executeAction } = useApp();
  const [attDate, setAttDate] = useState('2026-11-25');
  const [attTitle, setAttTitle] = useState('');
  const [attBusy, setAttBusy] = useState(false);
  const [attError, setAttError] = useState<string | null>(null);
  const [markingKey, setMarkingKey] = useState<string | null>(null);
  const [markError, setMarkError] = useState<string | null>(null);
  const roster = course.roster ?? [];
  const sessions = course.attendance_sessions ?? [];
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attDate.trim() || !attTitle.trim()) {
      setAttError('Enter both session date (YYYY-MM-DD) and title.');
      return;
    }
    setAttError(null);
    setAttBusy(true);
    try {
      await executeAction(
        'attendance-session',
        { course_id: course.id, date: attDate.trim(), title: attTitle.trim() },
        `Created attendance session "${attTitle.trim()}".`
      );
      setAttTitle('');
    } catch (err) {
      setAttError(err instanceof ApiError ? err.message : 'Unable to create session.');
    } finally {
      setAttBusy(false);
    }
  };

  const handleMarkAttendance = async (
    sessionId: number,
    studentId: number,
    status: AttendanceStatus
  ) => {
    const key = `${sessionId}-${studentId}`;
    setMarkError(null);
    setMarkingKey(key);
    try {
      await executeAction(
        'attendance-mark',
        { session_id: sessionId, student_id: studentId, status },
        `Attendance updated to ${formatStatusLabel(status)}.`
      );
    } catch (err) {
      setMarkError(err instanceof ApiError ? err.message : 'Unable to record attendance.');
    } finally {
      setMarkingKey(null);
    }
  };
  return (<>
      {/* Tab 3: Roster & Attendance */}
      {active && (
        <div className="space-y-6">
          <SectionCard
            title="Create Attendance Session"
            subtitle="Open a dated lecture or lab session, then mark attendance per enrolled student."
          >
            <form onSubmit={handleCreateSession} className="space-y-4">
              {attError && (
                <ErrorBanner message={attError} onDismiss={() => setAttError(null)} />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <Field id="att-date" label="Session Date (YYYY-MM-DD)" required>
                    <input
                      id="att-date"
                      type="date"
                      value={attDate}
                      onChange={(e) => setAttDate(e.target.value)}
                      className={inputClass}
                      disabled={attBusy}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-6">
                  <Field id="att-title" label="Session Title" required>
                    <input
                      id="att-title"
                      type="text"
                      maxLength={120}
                      value={attTitle}
                      onChange={(e) => setAttTitle(e.target.value)}
                      placeholder="e.g. Week 09 — Architecture Tradeoffs Studio"
                      className={inputClass}
                      disabled={attBusy}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={attBusy}
                    className={`${primaryBtnClass} w-full py-2.5`}
                  >
                    {attBusy ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </SectionCard>

          {markError && (
            <ErrorBanner message={markError} onDismiss={() => setMarkError(null)} />
          )}

          {sessions.length === 0 ? (
            <EmptyState
              title="No attendance sessions yet"
              description="Create your first attendance session above to record student presence, tardiness, or excused absences."
            />
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <SectionCard
                  key={session.id}
                  title={session.title}
                  subtitle={`Session date: ${session.session_date} · ${session.marks.length}/${roster.length} marked`}
                >
                  {roster.length === 0 ? (
                    <p className="text-xs text-[var(--ink-muted)]">
                      No students enrolled in this course to mark.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--border)]">
                      {roster.map((student) => {
                        const existing = session.marks.find(
                          (m) => m.student_id === student.id
                        );
                        const busyKey = `${session.id}-${student.id}`;
                        const isSaving = markingKey === busyKey;
                        return (
                          <div
                            key={student.id}
                            className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-sm font-medium text-[var(--ink)]">
                                {student.name}
                              </span>
                              {existing ? (
                                <StatusBadge
                                  variant={
                                    existing.status === 'present'
                                      ? 'success'
                                      : existing.status === 'late'
                                        ? 'warning'
                                        : existing.status === 'absent'
                                          ? 'danger'
                                          : 'neutral'
                                  }
                                >
                                  {formatStatusLabel(existing.status)}
                                </StatusBadge>
                              ) : (
                                <StatusBadge variant="neutral">Unmarked</StatusBadge>
                              )}
                            </div>

                            <div
                              className="flex flex-wrap gap-1.5"
                              role="group"
                              aria-label={`Attendance status for ${student.name}`}
                            >
                              {(
                                ['present', 'late', 'absent', 'excused'] as AttendanceStatus[]
                              ).map((st) => {
                                const selected = existing?.status === st;
                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() =>
                                      handleMarkAttendance(session.id, student.id, st)
                                    }
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                                      selected
                                        ? 'bg-[var(--accent)] text-white border-transparent'
                                        : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)]'
                                    }`}
                                  >
                                    {selected && (
                                      <Check
                                        className="w-3 h-3 inline mr-1"
                                        aria-hidden="true"
                                      />
                                    )}
                                    {formatStatusLabel(st)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>
              ))}
            </div>
          )}
        </div>
      )}
  </>);
}
