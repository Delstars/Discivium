import { useMemo, useState } from 'react';
import { CalendarDays, List } from 'lucide-react';
import type { TimetableSlot } from '../../types/api';
import { formatTimeRange, WEEKDAYS, weekdayName } from '../../lib/formatters';
import { EmptyState, SectionCard } from './Primitives';

interface TimetableViewProps {
  slots: TimetableSlot[];
  semester: string;
  onSelectCourse?: (courseId: number) => void;
  compact?: boolean;
}

export function TimetableView({
  slots,
  semester,
  onSelectCourse,
  compact = false,
}: TimetableViewProps) {
  const [mode, setMode] = useState<'grid' | 'list'>('grid');

  const sorted = useMemo(
    () =>
      [...slots].sort((a, b) =>
        a.weekday !== b.weekday ? a.weekday - b.weekday : a.start_min - b.start_min
      ),
    [slots]
  );

  const visibleDays = useMemo(() => {
    const hasWeekend = sorted.some((s) => s.weekday >= 5);
    return hasWeekend ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];
  }, [sorted]);

  const byDay = useMemo(() => {
    const map = new Map<number, TimetableSlot[]>();
    for (const day of visibleDays) map.set(day, []);
    for (const slot of sorted) {
      const list = map.get(slot.weekday) ?? [];
      list.push(slot);
      map.set(slot.weekday, list);
    }
    return map;
  }, [sorted, visibleDays]);

  return (
    <SectionCard
      title="Weekly Timetable"
      subtitle={`${semester} · All sessions scheduled in UAE Standard Time (GST, UTC+4)`}
      action={
        <div
          className="inline-flex items-center p-0.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]"
          role="group"
          aria-label="Timetable view mode"
        >
          <button
            type="button"
            onClick={() => setMode('grid')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === 'grid'
                ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
            Week Grid
          </button>
          <button
            type="button"
            onClick={() => setMode('list')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === 'list'
                ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            <List className="w-3.5 h-3.5" aria-hidden="true" />
            List View
          </button>
        </div>
      }
    >
      {sorted.length === 0 ? (
        <EmptyState
          title="No scheduled sessions"
          description="Timetable entries appear here once courses are assigned or registered for the active semester."
        />
      ) : (
        <>
          {/* Desktop Week Grid (automatically falls back to list on narrow screens unless list chosen) */}
          {mode === 'grid' && (
            <div
              className={`hidden md:grid gap-3 ${
                visibleDays.length > 5 ? 'grid-cols-7' : 'grid-cols-5'
              }`}
            >
              {visibleDays.map((day) => {
                const daySlots = byDay.get(day) ?? [];
                return (
                  <div
                    key={day}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)]/55 flex flex-col min-h-[150px]"
                  >
                    <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--ink)]">
                        {WEEKDAYS[day]}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                        {daySlots.length}
                      </span>
                    </div>
                    <div className="p-2.5 space-y-2 flex-1">
                      {daySlots.length === 0 ? (
                        <p className="text-[11px] text-[var(--ink-muted)] py-3 text-center">
                          No sessions
                        </p>
                      ) : (
                        daySlots.map((slot) => (
                          <button
                            key={`${slot.id}-${slot.weekday}-${slot.start_min}`}
                            type="button"
                            disabled={!onSelectCourse}
                            onClick={() => onSelectCourse?.(slot.id)}
                            className="w-full text-left rounded-lg bg-[var(--surface)] border border-[var(--border)] p-2.5 hover:border-[var(--accent)] transition-colors disabled:cursor-default"
                          >
                            <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-[var(--accent)] font-semibold">
                              <span>{slot.code}</span>
                              <span className="text-[var(--ink-muted)] font-normal">
                                {slot.room}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-[var(--ink)] mt-1 line-clamp-2">
                              {slot.title}
                            </p>
                            <p className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums mt-1.5">
                              {formatTimeRange(slot.start_min, slot.end_min)}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Responsive List View (always visible on mobile, or on desktop when List mode selected) */}
          <div className={mode === 'grid' ? 'md:hidden' : 'block'}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-muted)]">
                    <th className="py-2.5 pr-4 font-medium">Day</th>
                    <th className="py-2.5 px-4 font-medium">Time (UAE)</th>
                    <th className="py-2.5 px-4 font-medium">Course</th>
                    {!compact && <th className="py-2.5 px-4 font-medium">Room</th>}
                    <th className="py-2.5 pl-4 font-medium text-right">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-sm">
                  {sorted.map((slot) => (
                    <tr
                      key={`list-${slot.id}-${slot.weekday}-${slot.start_min}`}
                      className="hover:bg-[var(--surface-subtle)]/60"
                    >
                      <td className="py-3 pr-4 text-xs font-medium text-[var(--ink)] whitespace-nowrap">
                        {weekdayName(slot.weekday)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs tabular-nums text-[var(--ink-secondary)] whitespace-nowrap">
                        {formatTimeRange(slot.start_min, slot.end_min)}
                      </td>
                      <td className="py-3 px-4">
                        {onSelectCourse ? (
                          <button
                            type="button"
                            onClick={() => onSelectCourse(slot.id)}
                            className="text-left group"
                          >
                            <span className="font-mono text-xs font-semibold text-[var(--accent)] group-hover:underline">
                              {slot.code}
                            </span>
                            <span className="text-xs text-[var(--ink)] ml-2">{slot.title}</span>
                          </button>
                        ) : (
                          <div>
                            <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                              {slot.code}
                            </span>
                            <span className="text-xs text-[var(--ink-secondary)] ml-2">
                              {slot.title}
                            </span>
                          </div>
                        )}
                      </td>
                      {!compact && (
                        <td className="py-3 px-4 font-mono text-xs text-[var(--ink-secondary)] whitespace-nowrap">
                          {slot.room}
                        </td>
                      )}
                      <td className="py-3 pl-4 font-mono text-xs tabular-nums text-right text-[var(--ink-secondary)]">
                        {slot.credits}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </SectionCard>
  );
}
