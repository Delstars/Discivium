import React, { useMemo, useState } from 'react';
import { AlertTriangle, Lock, Send, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import {
  asBoolean,
  formatAttendanceRate,
  formatGpa,
  formatIsoDateTimeUae,
  formatStatusLabel,
} from '../../lib/formatters';
import {
  EmptyState,
  ErrorBanner,
  Field,
  PageHeader,
  SectionCard,
  StatTile,
  StatusBadge,
  inputClass,
  primaryBtnClass,
} from '../ui/Primitives';

export function AdvisorWorkspace() {
  const { state, executeAction } = useApp();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  if (!state) return null;
  const advisees = state.advisees ?? [];

  const activeAdvisee = useMemo(() => {
    if (advisees.length === 0) return null;
    if (selectedId !== null) {
      const found = advisees.find((a) => a.id === selectedId);
      if (found) return found;
    }
    return advisees[0];
  }, [advisees, selectedId]);

  const consentedCount = advisees.filter((a) => asBoolean(a.consent)).length;
  const flaggedCount = advisees.filter(
    (a) => asBoolean(a.consent) && (a.risk_reasons?.length ?? 0) > 0
  ).length;

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdvisee || !noteText.trim()) {
      setNoteError('Write an advising note before submitting.');
      return;
    }
    setNoteError(null);
    setSavingNote(true);
    try {
      await executeAction(
        'advising-note',
        { student_id: activeAdvisee.id, note: noteText.trim() },
        `Shared advising note recorded for ${activeAdvisee.name}.`
      );
      setNoteText('');
    } catch (err) {
      setNoteError(err instanceof ApiError ? err.message : 'Unable to save advising note.');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${state.semester} · Consent-Gated Academic Advising`}
        title={`Advisor Workspace — ${state.user.name}`}
        description="Inspect assigned students' released academic records, attendance, and deterministic threshold flags only when the student has granted explicit consent. Finance data is never exposed to advisors."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="Assigned Students"
          value={String(advisees.length)}
          detail="Students linked to your advisor account"
          tone="accent"
        />
        <StatTile
          label="Active Consent"
          value={`${consentedCount} / ${advisees.length}`}
          detail="Students permitting academic record visibility"
          tone="teal"
        />
        <StatTile
          label="Threshold Flags"
          value={String(flaggedCount)}
          detail="Deterministic rule flags (Attendance < 80% or GPA < 2.0)"
          tone={flaggedCount > 0 ? 'amber' : 'neutral'}
        />
      </div>

      {advisees.length === 0 ? (
        <EmptyState
          title="No students assigned"
          description="Campus administration can link advisees to your advisor account."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Assigned Student Selector */}
          <div className="lg:col-span-4">
            <SectionCard title="Assigned Advisees" noPadding>
              <div className="divide-y divide-[var(--border)]">
                {advisees.map((student) => {
                  const granted = asBoolean(student.consent);
                  const selected = activeAdvisee?.id === student.id;
                  const flags = student.risk_reasons ?? [];
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(student.id);
                        setNoteError(null);
                      }}
                      className={`w-full text-left px-4 py-3.5 transition-colors flex flex-col gap-1.5 ${
                        selected
                          ? 'bg-[var(--accent-soft)]/50'
                          : 'hover:bg-[var(--surface-subtle)]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--ink)]">
                          {student.name}
                        </span>
                        <StatusBadge variant={granted ? 'success' : 'neutral'}>
                          {granted ? 'Consent active' : 'Withheld'}
                        </StatusBadge>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[var(--ink-muted)]">
                        <span className="font-mono">Student #{student.id}</span>
                        {granted && flags.length > 0 && (
                          <span className="text-[var(--danger)] font-medium">
                            {flags.length} threshold flag(s)
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* Active Advisee Detail */}
          <div className="lg:col-span-8 space-y-6">
            {activeAdvisee && !asBoolean(activeAdvisee.consent) && (
              <SectionCard
                title={activeAdvisee.name}
                subtitle="Private academic fields withheld server-side"
                action={<StatusBadge variant="neutral">Consent withheld</StatusBadge>}
              >
                <div className="py-8 px-4 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--ink-muted)]">
                    <Lock className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    Academic and attendance records are withheld
                  </p>
                  <p className="text-xs text-[var(--ink-secondary)] max-w-md mx-auto leading-relaxed">
                    {activeAdvisee.name} has not enabled advising consent. In compliance with
                    server-side privacy boundaries, GPA, course results, attendance, threshold
                    flags, and advising note submission are unavailable until consent is granted by
                    the student.
                  </p>
                </div>
              </SectionCard>
            )}

            {activeAdvisee && asBoolean(activeAdvisee.consent) && (
              <>
                <SectionCard
                  title={activeAdvisee.name}
                  subtitle={
                    activeAdvisee.record && activeAdvisee.record.programme.length > 0
                      ? activeAdvisee.record.programme
                          .map((p) => `${p.name} · ${p.department}`)
                          .join(' | ')
                      : `Student #${activeAdvisee.id}`
                  }
                  action={
                    <StatusBadge variant="success">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Consent active
                    </StatusBadge>
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    <div className="rounded-lg bg-[var(--surface-subtle)]/60 border border-[var(--border)] p-3.5">
                      <p className="text-xs text-[var(--ink-muted)]">Released GPA</p>
                      <p className="font-mono text-xl font-semibold tabular-nums text-[var(--ink)] mt-1">
                        {formatGpa(activeAdvisee.record?.gpa)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--surface-subtle)]/60 border border-[var(--border)] p-3.5">
                      <p className="text-xs text-[var(--ink-muted)]">Attendance Rate</p>
                      <p className="font-mono text-xl font-semibold tabular-nums text-[var(--ink)] mt-1">
                        {formatAttendanceRate(activeAdvisee.attendance?.rate)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--surface-subtle)]/60 border border-[var(--border)] p-3.5">
                      <p className="text-xs text-[var(--ink-muted)]">Earned / Attempted Credits</p>
                      <p className="font-mono text-xl font-semibold tabular-nums text-[var(--ink)] mt-1">
                        {activeAdvisee.record?.earned_credits ?? 0} /{' '}
                        {activeAdvisee.record?.attempted_credits ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* Deterministic Threshold Flags */}
                  <div className="rounded-lg border border-[var(--border)] p-3.5 mb-5 space-y-2">
                    <p className="text-xs font-semibold text-[var(--ink)]">
                      Deterministic Threshold Rules (Non-AI)
                    </p>
                    {activeAdvisee.risk_reasons && activeAdvisee.risk_reasons.length > 0 ? (
                      <ul className="space-y-1.5">
                        {activeAdvisee.risk_reasons.map((reason) => (
                          <li
                            key={reason}
                            className="flex items-center gap-2 text-xs text-[var(--danger)] font-medium"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-[var(--teal)]">
                        No deterministic risk thresholds triggered (attendance below 80% or GPA
                        below 2.0).
                      </p>
                    )}
                  </div>

                  {/* Released Course Results */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-[var(--ink)]">
                      Released Course Results
                    </h3>
                    {!activeAdvisee.record || activeAdvisee.record.results.length === 0 ? (
                      <p className="text-xs text-[var(--ink-muted)]">
                        No final course results released yet for this student.
                      </p>
                    ) : (
                      <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[var(--border)] text-[var(--ink-muted)] bg-[var(--surface-subtle)]/50">
                              <th className="py-2.5 px-3 font-medium">Course</th>
                              <th className="py-2.5 px-3 font-medium text-right">Credits</th>
                              <th className="py-2.5 px-3 font-medium text-right">Percentage</th>
                              <th className="py-2.5 px-3 font-medium text-right">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {activeAdvisee.record.results.map((r) => (
                              <tr key={r.course_id}>
                                <td className="py-2.5 px-3">
                                  <span className="font-mono font-semibold text-[var(--accent)]">
                                    {r.code}
                                  </span>{' '}
                                  <span className="text-[var(--ink)]">{r.title}</span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                  {r.credits}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                  {r.percentage.toFixed(2)}%
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-semibold">
                                  {r.letter}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Attendance History */}
                  {activeAdvisee.attendance && activeAdvisee.attendance.items.length > 0 && (
                    <div className="space-y-2 mt-5">
                      <h3 className="text-xs font-semibold text-[var(--ink)]">
                        Attendance Marks ({activeAdvisee.attendance.items.length})
                      </h3>
                      <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[var(--border)] text-[var(--ink-muted)] bg-[var(--surface-subtle)]/50">
                              <th className="py-2 px-3 font-medium">Date</th>
                              <th className="py-2 px-3 font-medium">Course</th>
                              <th className="py-2 px-3 font-medium">Session</th>
                              <th className="py-2 px-3 font-medium text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {activeAdvisee.attendance.items.map((item) => (
                              <tr key={`${item.session_id}-${item.code}`}>
                                <td className="py-2 px-3 font-mono tabular-nums">
                                  {item.session_date}
                                </td>
                                <td className="py-2 px-3 font-mono font-semibold text-[var(--accent)]">
                                  {item.code}
                                </td>
                                <td className="py-2 px-3">{item.title}</td>
                                <td className="py-2 px-3 text-right">
                                  {formatStatusLabel(item.status)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* Shared Advising Notes */}
                <SectionCard
                  title="Shared Advising Notes"
                  subtitle={`Notes recorded here are shared directly with ${activeAdvisee.name} and trigger a student notification.`}
                >
                  <form
                    onSubmit={handleSaveNote}
                    className="space-y-3 pb-5 border-b border-[var(--border)]"
                  >
                    {noteError && (
                      <ErrorBanner message={noteError} onDismiss={() => setNoteError(null)} />
                    )}
                    <Field id="advisor-note-input" label="Add shared advising note" required>
                      <textarea
                        id="advisor-note-input"
                        rows={3}
                        maxLength={2000}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Summarize degree progress guidance, course recommendations, or follow-up milestones…"
                        className={inputClass}
                        disabled={savingNote}
                      />
                    </Field>
                    <div className="flex justify-end">
                      <button type="submit" disabled={savingNote} className={primaryBtnClass}>
                        <Send className="w-3.5 h-3.5" aria-hidden="true" />
                        {savingNote ? 'Saving…' : 'Save Shared Note'}
                      </button>
                    </div>
                  </form>

                  <div className="pt-4">
                    {!activeAdvisee.notes || activeAdvisee.notes.length === 0 ? (
                      <EmptyState
                        title="No shared advising notes yet"
                        description="Record your first consultation note above."
                      />
                    ) : (
                      <div className="divide-y divide-[var(--border)]">
                        {activeAdvisee.notes.map((n) => (
                          <div key={n.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                            <p className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                              {formatIsoDateTimeUae(n.created_at)}
                            </p>
                            <p className="text-sm text-[var(--ink-secondary)] whitespace-pre-wrap leading-relaxed">
                              {n.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SectionCard>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
