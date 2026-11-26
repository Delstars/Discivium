import { useMemo, useState } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import { formatTimeRange, weekdayName } from '../../lib/formatters';
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  SectionCard,
  StatusBadge,
  inputClass,
  primaryBtnClass,
} from '../ui/Primitives';

export function StudentRegistration() {
  const { state, executeAction } = useApp();
  const [query, setQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [registeringId, setRegisteringId] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  if (!state) return null;
  const catalogue = state.catalogue ?? [];
  const currentCredits = (state.timetable ?? []).reduce((sum, s) => sum + s.credits, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogue.filter((c) => {
      if (onlyAvailable && (c.enrolled || c.occupied >= c.capacity)) return false;
      if (!q) return true;
      return (
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.lecturer.toLowerCase().includes(q) ||
        c.room.toLowerCase().includes(q)
      );
    });
  }, [catalogue, query, onlyAvailable]);

  const handleRegister = async (courseId: number, code: string) => {
    setServerError(null);
    setRegisteringId(courseId);
    try {
      await executeAction('register', { course_id: courseId }, `Registered for ${code}.`);
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err.message
          : 'Registration rejected by server. Check prerequisites, schedule, or seat limits.'
      );
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${state.semester} · Current load: ${currentCredits} / 18 credits`}
        title="Course Registration Catalogue"
        description="Server-validated module registration enforcing prerequisites, timetable clashes, seat capacity, closed results, and the 18-credit semester cap."
      />

      {serverError && (
        <ErrorBanner
          title="Registration conflict or rule rejection"
          message={serverError}
          onDismiss={() => setServerError(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search
            className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search course catalogue"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by code, title, lecturer, or room…"
            className={`${inputClass} pl-9`}
          />
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-[var(--ink-secondary)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          <span>Show open, unenrolled offerings only</span>
        </label>
      </div>

      <SectionCard noPadding>
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No matching offerings"
              description="Try clearing your search filter to view all Fall 2026 courses."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-muted)]">
                  <th className="py-3 px-5 font-medium">Course</th>
                  <th className="py-3 px-4 font-medium">Lecturer</th>
                  <th className="py-3 px-4 font-medium">Schedule &amp; Room</th>
                  <th className="py-3 px-4 font-medium">Prerequisites</th>
                  <th className="py-3 px-4 font-medium text-right">Credits</th>
                  <th className="py-3 px-4 font-medium">Seats</th>
                  <th className="py-3 px-5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {filtered.map((course) => {
                  const seatPct =
                    course.capacity > 0
                      ? Math.min(100, Math.round((course.occupied / course.capacity) * 100))
                      : 100;
                  const full = course.occupied >= course.capacity;
                  return (
                    <tr key={course.id} className="hover:bg-[var(--surface-subtle)]/50">
                      <td className="py-3.5 px-5">
                        <p className="font-mono text-xs font-semibold text-[var(--accent)]">
                          {course.code}
                        </p>
                        <p className="text-sm font-medium text-[var(--ink)]">{course.title}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--ink-secondary)] whitespace-nowrap">
                        {course.lecturer}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--ink-secondary)] whitespace-nowrap">
                        <p className="font-medium text-[var(--ink)]">
                          {weekdayName(course.weekday)} · {formatTimeRange(course.start_min, course.end_min)}
                        </p>
                        <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                          Room {course.room}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--ink-secondary)]">
                        {course.prerequisites.length === 0 ? (
                          <span className="text-[var(--ink-muted)]">None</span>
                        ) : (
                          <div className="space-y-0.5">
                            {course.prerequisites.map((p) => (
                              <p key={p.id} className="font-mono text-[11px]">
                                {p.code}{' '}
                                <span className="font-sans text-[var(--ink-muted)]">
                                  ({p.title})
                                </span>
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-right text-[var(--ink)]">
                        {course.credits}
                      </td>
                      <td className="py-3.5 px-4 min-w-[110px]">
                        <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-[var(--ink-secondary)]">
                          <span>
                            {course.occupied}/{course.capacity}
                          </span>
                          <span>{seatPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--surface-subtle)] mt-1 overflow-hidden">
                          <div
                            className={`h-full ${
                              full ? 'bg-[var(--danger)]' : 'bg-[var(--teal)]'
                            }`}
                            style={{ width: `${seatPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {course.enrolled ? (
                          <StatusBadge variant="success">
                            <Check className="w-3 h-3 mr-1" /> Enrolled
                          </StatusBadge>
                        ) : (
                          <button
                            type="button"
                            disabled={registeringId === course.id}
                            onClick={() => handleRegister(course.id, course.code)}
                            className={primaryBtnClass}
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            {registeringId === course.id ? 'Checking…' : 'Register'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
