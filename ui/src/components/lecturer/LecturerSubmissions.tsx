import React, { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import type { AssignmentItem, CourseItem, SubmissionItem } from '../../types/api';
import { asBoolean, formatIsoDateTimeUae } from '../../lib/formatters';
import {
  EmptyState,
  ErrorBanner,
  Field,
  Modal,
  PageHeader,
  SectionCard,
  StatusBadge,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
} from '../ui/Primitives';

interface QueueRow {
  course: CourseItem;
  assignment: AssignmentItem;
  submission: SubmissionItem;
}

export function LecturerSubmissions() {
  const { state, navigate, executeAction, executeDownload } = useApp();
  const [filter, setFilter] = useState<'ungraded' | 'graded' | 'all'>('ungraded');
  const [query, setQuery] = useState('');
  const [gradeTarget, setGradeTarget] = useState<QueueRow | null>(null);
  const [score, setScore] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state) return null;
  const courses = state.courses ?? [];

  const allRows = useMemo<QueueRow[]>(() => {
    const list: QueueRow[] = [];
    for (const course of courses) {
      for (const assignment of course.assignments) {
        for (const submission of assignment.submissions) {
          list.push({ course, assignment, submission });
        }
      }
    }
    return list.sort(
      (a, b) => Date.parse(b.submission.submitted_at) - Date.parse(a.submission.submitted_at)
    );
  }, [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows.filter((row) => {
      if (filter === 'ungraded' && row.submission.status === 'graded') return false;
      if (filter === 'graded' && row.submission.status !== 'graded') return false;
      if (!q) return true;
      return (
        row.course.code.toLowerCase().includes(q) ||
        row.assignment.title.toLowerCase().includes(q) ||
        row.submission.name.toLowerCase().includes(q) ||
        row.submission.filename.toLowerCase().includes(q)
      );
    });
  }, [allRows, filter, query]);

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeTarget) return;
    const numeric = Number(score);
    if (
      score.trim() === '' ||
      !Number.isInteger(numeric) ||
      numeric < 0 ||
      numeric > gradeTarget.assignment.max_points
    ) {
      setError(`Score must be an integer between 0 and ${gradeTarget.assignment.max_points}.`);
      return;
    }
    if (!comment.trim()) {
      setError('Enter written feedback to release this grade.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await executeAction(
        'grade',
        {
          submission_id: gradeTarget.submission.id,
          score: numeric,
          comment: comment.trim(),
        },
        `Graded ${gradeTarget.submission.name} (${numeric}/${gradeTarget.assignment.max_points}).`
      );
      setGradeTarget(null);
      setScore('');
      setComment('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to submit grade.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${state.semester} · Assigned Courses Queue`}
        title="Submission Grading Queue"
        description="Download original submitted PDF/DOCX documents and release grades and feedback across your assigned courses."
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          className="inline-flex gap-1 p-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]"
          role="group"
          aria-label="Filter submission queue"
        >
          {(
            [
              ['ungraded', 'Needs Grading'],
              ['graded', 'Graded'],
              ['all', 'All Submissions'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === id
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search
            className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search submissions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by student, course, or file…"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      <SectionCard noPadding>
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No submissions in this view"
              description={
                allRows.length === 0
                  ? 'Student uploads across your assigned courses will queue here.'
                  : 'Switch filter tabs or clear the search box to see other submissions.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-muted)]">
                  <th className="py-3 px-5 font-medium">Course &amp; Assignment</th>
                  <th className="py-3 px-4 font-medium">Student</th>
                  <th className="py-3 px-4 font-medium">File</th>
                  <th className="py-3 px-4 font-medium">Submitted (UAE)</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {filtered.map((row) => (
                  <tr key={row.submission.id} className="hover:bg-[var(--surface-subtle)]/50">
                    <td className="py-3.5 px-5">
                      <button
                        type="button"
                        onClick={() => navigate('course', row.course.id)}
                        className="font-mono text-xs font-semibold text-[var(--accent)] hover:underline"
                      >
                        {row.course.code}
                      </button>
                      <p className="text-xs font-medium text-[var(--ink)] mt-0.5">
                        {row.assignment.title}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[var(--ink)] whitespace-nowrap">
                      {row.submission.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[var(--ink-secondary)]">
                      {row.submission.filename}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-[var(--ink-muted)] whitespace-nowrap">
                      {formatIsoDateTimeUae(row.submission.submitted_at)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {row.submission.status === 'graded' ? (
                        <StatusBadge variant="success">
                          {row.submission.score}/{row.assignment.max_points}
                        </StatusBadge>
                      ) : (
                        <StatusBadge variant={asBoolean(row.submission.late) ? 'warning' : 'accent'}>
                          {asBoolean(row.submission.late) ? 'Late · Pending' : 'Needs grading'}
                        </StatusBadge>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            executeDownload(
                              `/api/download?id=${row.submission.id}`,
                              row.submission.filename
                            )
                          }
                          className={secondaryBtnClass}
                        >
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          Download
                        </button>
                        {row.submission.status !== 'graded' && (
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setScore('');
                              setComment('');
                              setGradeTarget(row);
                            }}
                            className={primaryBtnClass}
                          >
                            Grade
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Modal
        open={gradeTarget !== null}
        onClose={() => {
          if (!busy) setGradeTarget(null);
        }}
        title="Grade Student Submission"
        subtitle={
          gradeTarget
            ? `${gradeTarget.course.code} · ${gradeTarget.assignment.title} · ${gradeTarget.submission.name}`
            : undefined
        }
      >
        {gradeTarget && (
          <form onSubmit={handleGrade} className="space-y-4">
            {error && <ErrorBanner message={error} />}
            <Field
              id="queue-grade-score"
              label={`Score (0–${gradeTarget.assignment.max_points})`}
              required
            >
              <input
                id="queue-grade-score"
                type="number"
                min={0}
                max={gradeTarget.assignment.max_points}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className={`${inputClass} font-mono tabular-nums`}
                disabled={busy}
              />
            </Field>
            <Field id="queue-grade-comment" label="Feedback" required>
              <textarea
                id="queue-grade-comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write constructive feedback for the student…"
                className={inputClass}
                disabled={busy}
              />
            </Field>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setGradeTarget(null)}
                className={secondaryBtnClass}
              >
                Cancel
              </button>
              <button type="submit" disabled={busy} className={primaryBtnClass}>
                {busy ? 'Releasing…' : 'Release Grade'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
