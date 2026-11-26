import React, { useMemo, useState } from 'react';
import { Download, Search, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import {
  asBoolean,
  formatIsoDateTimeUae,
  isPastDeadline,
} from '../../lib/formatters';
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

type AssignmentFilter = 'all' | 'upcoming' | 'past_due' | 'submitted' | 'graded';

export function StudentAssignments() {
  const { state, navigate, executeUpload, executeDownload } = useApp();
  const [filter, setFilter] = useState<AssignmentFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!state) return null;
  const courses = state.courses ?? [];

  const allItems = useMemo(() => {
    return courses
      .flatMap((course) =>
        course.assignments.map((assignment) => ({
          course,
          assignment,
          submission: assignment.submissions[0] ?? null,
          pastDue: isPastDeadline(assignment.due_at),
        }))
      )
      .sort((a, b) => Date.parse(a.assignment.due_at) - Date.parse(b.assignment.due_at));
  }, [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (filter === 'upcoming' && (item.submission || item.pastDue)) return false;
      if (filter === 'past_due' && (item.submission || !item.pastDue)) return false;
      if (filter === 'submitted' && (!item.submission || item.submission.status === 'graded'))
        return false;
      if (filter === 'graded' && item.submission?.status !== 'graded') return false;

      if (!q) return true;
      return (
        item.course.code.toLowerCase().includes(q) ||
        item.course.title.toLowerCase().includes(q) ||
        item.assignment.title.toLowerCase().includes(q)
      );
    });
  }, [allItems, filter, query]);

  const activeTarget = allItems.find((i) => i.assignment.id === selectedAssignmentId) ?? null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId || !file) {
      setUploadError('Select a PDF or DOCX file to submit.');
      return;
    }
    setUploadError(null);
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('assignment_id', String(selectedAssignmentId));
      formData.append('file', file);
      await executeUpload(
        'submit',
        formData,
        (pct) => setProgress(pct),
        `Submitted ${file.name}.`
      );
      setSelectedAssignmentId(null);
      setFile(null);
      setProgress(null);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Submission upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${state.semester} · UAE Standard Time (UTC+4)`}
        title="Assignments & Coursework"
        description="Track deadlines across all enrolled modules, upload real PDF or DOCX submissions, and inspect lecturer feedback once released."
      />

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]"
          role="group"
          aria-label="Filter assignments by status"
        >
          {(
            [
              ['all', 'All'],
              ['upcoming', 'Upcoming'],
              ['past_due', 'Past Due'],
              ['submitted', 'Submitted'],
              ['graded', 'Graded'],
            ] as Array<[AssignmentFilter, string]>
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
            aria-label="Search assignments"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search course or title…"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching assignments"
          description={
            allItems.length === 0
              ? 'No coursework has been published for your enrolled modules yet.'
              : 'Adjust the status filter or search term to view other assignments.'
          }
        />
      ) : (
        <div className="space-y-3.5">
          {filtered.map(({ course, assignment, submission, pastDue }) => (
            <SectionCard key={assignment.id}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
                    <button
                      type="button"
                      onClick={() => navigate('course', course.id)}
                      className="font-mono font-semibold text-[var(--accent)] hover:underline"
                    >
                      {course.code}
                    </button>
                    <span aria-hidden="true">·</span>
                    <span>{course.title}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">Max {assignment.max_points}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {assignment.policy === 'strict' ? 'Strict policy' : 'Late allowed'}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-[var(--ink)]">
                    {assignment.title}
                  </h2>
                  <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                    {assignment.description}
                  </p>
                  <p className="font-mono text-xs tabular-nums text-[var(--ink-muted)] pt-1">
                    Deadline: {formatIsoDateTimeUae(assignment.due_at)}
                  </p>
                </div>

                <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
                  {submission ? (
                    submission.status === 'graded' ? (
                      <StatusBadge variant="success">
                        Graded · {submission.score}/{assignment.max_points}
                      </StatusBadge>
                    ) : (
                      <StatusBadge variant="accent">
                        {asBoolean(submission.late) ? 'Submitted (Late)' : 'Submitted'}
                      </StatusBadge>
                    )
                  ) : pastDue ? (
                    <StatusBadge variant={assignment.policy === 'strict' ? 'danger' : 'warning'}>
                      {assignment.policy === 'strict'
                        ? 'Past due (Strict)'
                        : 'Past due (Late allowed)'}
                    </StatusBadge>
                  ) : (
                    <StatusBadge variant="neutral">Pending</StatusBadge>
                  )}

                  {!submission ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssignmentId(assignment.id);
                        setFile(null);
                        setUploadError(null);
                        setProgress(null);
                      }}
                      className={primaryBtnClass}
                    >
                      <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                      Submit PDF / DOCX
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        executeDownload(`/api/download?id=${submission.id}`, submission.filename)
                      }
                      className={secondaryBtnClass}
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      Download Submission
                    </button>
                  )}
                </div>
              </div>

              {submission && submission.status === 'graded' && submission.comment && (
                <div className="mt-4 pt-3.5 border-t border-[var(--border)]">
                  <p className="text-xs font-semibold text-[var(--teal)]">
                    Released Feedback · Score {submission.score}/{assignment.max_points}
                  </p>
                  <p className="text-sm text-[var(--ink-secondary)] mt-1 whitespace-pre-wrap">
                    {submission.comment}
                  </p>
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      )}

      <Modal
        open={selectedAssignmentId !== null}
        onClose={() => {
          if (!uploading) setSelectedAssignmentId(null);
        }}
        title="Upload Assignment Submission"
        subtitle={
          activeTarget
            ? `${activeTarget.course.code} — ${activeTarget.assignment.title}`
            : undefined
        }
      >
        <form onSubmit={handleUpload} className="space-y-4">
          {uploadError && <ErrorBanner message={uploadError} />}
          <Field
            id="asg-upload-file"
            label="PDF or DOCX file (max 100 MB)"
            hint="Server validates real PDF header (%PDF-) or DOCX structure and enforces deadline policy."
            required
          >
            <input
              id="asg-upload-file"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={uploading}
              className="block w-full text-xs text-[var(--ink-secondary)] file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border file:border-[var(--border-strong)] file:bg-[var(--surface-subtle)] file:text-xs file:font-semibold file:text-[var(--ink)]"
            />
          </Field>

          {uploading && (
            <div className="space-y-1.5" role="status">
              <div className="flex justify-between text-xs text-[var(--ink-secondary)]">
                <span>Uploading…</span>
                <span className="font-mono tabular-nums">
                  {progress !== null ? `${progress}%` : 'Working'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                <div
                  className={`h-full bg-[var(--accent)] ${
                    progress === null ? 'w-1/2 animate-pulse' : ''
                  }`}
                  style={progress !== null ? { width: `${progress}%` } : undefined}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => setSelectedAssignmentId(null)}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={uploading || !file} className={primaryBtnClass}>
              {uploading ? 'Uploading…' : 'Submit File'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
