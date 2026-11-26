import React, { useState } from 'react';
import { Award, Download, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import type { CourseItem, AssignmentItem, SubmissionItem } from '../../types/api';
import { asBoolean, formatIsoDateTimeUae, normalizeDueAtUae } from '../../lib/formatters';
import { ConfirmDialog, EmptyState, ErrorBanner, Field, Modal, SectionCard, StatusBadge, inputClass, primaryBtnClass, secondaryBtnClass } from '../ui/Primitives';

export function LecturerCoursework({ course, active, pubOpen, setPubOpen }: { course: CourseItem; active: boolean; pubOpen: boolean; setPubOpen: (value: boolean) => void }) {
  const { executeAction, executeDownload } = useApp();
  const [pubTitle, setPubTitle] = useState('');
  const [pubDesc, setPubDesc] = useState('');
  const [pubDue, setPubDue] = useState('2026-12-15T23:59');
  const [pubMax, setPubMax] = useState('30');
  const [pubPolicy, setPubPolicy] = useState<'strict' | 'allow_late'>('strict');
  const [pubBusy, setPubBusy] = useState(false);
  const [pubError, setPubError] = useState<string | null>(null);

  // Grade submission modal
  const [gradeTarget, setGradeTarget] = useState<{
    assignment: AssignmentItem;
    submission: SubmissionItem;
  } | null>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeComment, setGradeComment] = useState('');
  const [gradeBusy, setGradeBusy] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);

  // Release final course result confirmation
  const [releaseStudent, setReleaseStudent] = useState<{ id: number; name: string } | null>(null);
  const [releaseBusy, setReleaseBusy] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const roster = course.roster ?? [];
  const releasedResults = course.released_results ?? [];
  const courseHasReleasedResults = releasedResults.length > 0;
  const handlePublishAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const maxPts = Number(pubMax);
    if (!pubTitle.trim() || !pubDesc.trim() || !pubDue || !Number.isInteger(maxPts) || maxPts < 1) {
      setPubError('Complete title, description, UAE deadline, and valid maximum marks (1–1000).');
      return;
    }
    setPubError(null);
    setPubBusy(true);
    try {
      await executeAction(
        'publish',
        {
          course_id: course.id,
          title: pubTitle.trim(),
          description: pubDesc.trim(),
          due_at: normalizeDueAtUae(pubDue),
          max_points: maxPts,
          policy: pubPolicy,
        },
        `Published assignment "${pubTitle.trim()}".`
      );
      setPubTitle('');
      setPubDesc('');
      setPubOpen(false);
    } catch (err) {
      setPubError(err instanceof ApiError ? err.message : 'Unable to publish assignment.');
    } finally {
      setPubBusy(false);
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeTarget) return;
    const score = Number(gradeScore);
    if (
      gradeScore.trim() === '' ||
      !Number.isInteger(score) ||
      score < 0 ||
      score > gradeTarget.assignment.max_points
    ) {
      setGradeError(`Enter an integer score between 0 and ${gradeTarget.assignment.max_points}.`);
      return;
    }
    if (!gradeComment.trim()) {
      setGradeError('Provide written feedback before releasing a grade.');
      return;
    }
    setGradeError(null);
    setGradeBusy(true);
    try {
      await executeAction(
        'grade',
        {
          submission_id: gradeTarget.submission.id,
          score,
          comment: gradeComment.trim(),
        },
        `Released grade (${score}/${gradeTarget.assignment.max_points}) to ${gradeTarget.submission.name}.`
      );
      setGradeTarget(null);
      setGradeScore('');
      setGradeComment('');
    } catch (err) {
      setGradeError(err instanceof ApiError ? err.message : 'Unable to grade submission.');
    } finally {
      setGradeBusy(false);
    }
  };

  const handleConfirmReleaseResult = async () => {
    if (!releaseStudent) return;
    setReleaseError(null);
    setReleaseBusy(true);
    try {
      await executeAction(
        'release-result',
        { course_id: course.id, student_id: releaseStudent.id },
        `Final course result released for ${releaseStudent.name}.`
      );
      setReleaseStudent(null);
    } catch (err) {
      setReleaseError(err instanceof ApiError ? err.message : 'Unable to release course result.');
    } finally {
      setReleaseBusy(false);
    }
  };
  return (<>
      {/* Tab 1: Coursework, Submissions & Final Result Release */}
      {active && (
        <div className="space-y-6">
          {courseHasReleasedResults && (
            <div className="rounded-xl border border-[var(--amber)]/30 bg-[var(--amber-soft)] px-4 py-3 text-xs text-[var(--amber)]">
              One or more final course results have been released for {course.code}. Publishing
              additional assignments is locked server-side to preserve grade calculation integrity.
            </div>
          )}

          {course.assignments.length === 0 ? (
            <EmptyState
              title="No assignments published yet"
              description="Publish an assignment with a UAE deadline, maximum marks, and strict or allow-late policy."
              action={
                <button
                  type="button"
                  disabled={courseHasReleasedResults}
                  onClick={() => setPubOpen(true)}
                  className={primaryBtnClass}
                >
                  Publish First Assignment
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              {course.assignments.map((a) => (
                <SectionCard
                  key={a.id}
                  title={a.title}
                  subtitle={`Due ${formatIsoDateTimeUae(a.due_at)} · Max ${a.max_points} marks · ${
                    a.policy === 'strict' ? 'Strict deadline' : 'Late allowed'
                  }`}
                  action={
                    <StatusBadge variant="neutral">
                      {a.submissions.length} submission(s)
                    </StatusBadge>
                  }
                >
                  <p className="text-sm text-[var(--ink-secondary)] whitespace-pre-wrap mb-4">
                    {a.description}
                  </p>

                  {a.submissions.length === 0 ? (
                    <p className="text-xs text-[var(--ink-muted)] py-3 border-t border-[var(--border)]">
                      No student submissions received yet for this assignment.
                    </p>
                  ) : (
                    <div className="overflow-x-auto border-t border-[var(--border)] pt-3">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-muted)]">
                            <th className="py-2 pr-4 font-medium">Student</th>
                            <th className="py-2 px-3 font-medium">Document</th>
                            <th className="py-2 px-3 font-medium">Submitted (UAE)</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 pl-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] text-xs">
                          {a.submissions.map((sub) => (
                            <tr key={sub.id}>
                              <td className="py-3 pr-4 font-medium text-[var(--ink)]">
                                {sub.name}
                              </td>
                              <td className="py-3 px-3 font-mono text-[var(--ink-secondary)]">
                                {sub.filename}
                              </td>
                              <td className="py-3 px-3 font-mono tabular-nums text-[var(--ink-muted)] whitespace-nowrap">
                                {formatIsoDateTimeUae(sub.submitted_at)}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                {sub.status === 'graded' ? (
                                  <StatusBadge variant="success">
                                    Graded {sub.score}/{a.max_points}
                                  </StatusBadge>
                                ) : (
                                  <StatusBadge variant={asBoolean(sub.late) ? 'warning' : 'accent'}>
                                    {asBoolean(sub.late) ? 'Submitted (Late)' : 'Needs grading'}
                                  </StatusBadge>
                                )}
                              </td>
                              <td className="py-3 pl-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      executeDownload(`/api/download?id=${sub.id}`, sub.filename)
                                    }
                                    className={secondaryBtnClass}
                                  >
                                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                                    File
                                  </button>
                                  {sub.status !== 'graded' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGradeError(null);
                                        setGradeScore('');
                                        setGradeComment('');
                                        setGradeTarget({ assignment: a, submission: sub });
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
              ))}
            </div>
          )}

          {/* Final Course Result Release Workflow */}
          <SectionCard
            title="Final Course Result Release"
            subtitle="Requires all published assignments for the student to be graded. Once released, the final percentage is immutable and feeds the student's GPA."
            noPadding
          >
            {roster.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No students enrolled"
                  description="Students enrolled in this course will appear here for final result release."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-muted)]">
                      <th className="py-3 px-5 font-medium">Student</th>
                      <th className="py-3 px-4 font-medium">Graded Progress</th>
                      <th className="py-3 px-4 font-medium">Released Standing</th>
                      <th className="py-3 px-5 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-sm">
                    {roster.map((student) => {
                      const rel = releasedResults.find((r) => r.student_id === student.id);
                      const gradedAssignments = course.assignments.filter((a) =>
                        a.submissions.some(
                          (s) => s.student_id === student.id && s.status === 'graded'
                        )
                      ).length;
                      return (
                        <tr key={student.id}>
                          <td className="py-3.5 px-5 font-medium text-[var(--ink)]">
                            {student.name}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-[var(--ink-secondary)]">
                            {gradedAssignments} / {course.assignments.length} assignments graded
                          </td>
                          <td className="py-3.5 px-4">
                            {rel ? (
                              <span className="inline-flex items-center gap-2 text-xs">
                                <StatusBadge variant="success">
                                  {rel.percentage.toFixed(2)}%
                                </StatusBadge>
                                <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                                  {formatIsoDateTimeUae(rel.released_at)}
                                </span>
                              </span>
                            ) : (
                              <StatusBadge variant="neutral">Not released</StatusBadge>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {rel ? (
                              <span className="inline-flex items-center gap-1 text-xs text-[var(--ink-muted)]">
                                <Lock className="w-3 h-3" aria-hidden="true" />
                                Immutable
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setReleaseError(null);
                                  setReleaseStudent(student);
                                }}
                                className={secondaryBtnClass}
                              >
                                <Award className="w-3.5 h-3.5" aria-hidden="true" />
                                Release Final Result
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
      )}
      {/* Modal: Publish Assignment */}
      <Modal
        open={pubOpen}
        onClose={() => {
          if (!pubBusy) setPubOpen(false);
        }}
        title={`Publish Assignment — ${course.code}`}
        subtitle="Published immediately to all enrolled students. Deadline interpreted in UAE Standard Time (UTC+4)."
      >
        <form onSubmit={handlePublishAssignment} className="space-y-4">
          {pubError && <ErrorBanner message={pubError} />}
          <Field id="pub-title" label="Assignment Title" required>
            <input
              id="pub-title"
              type="text"
              maxLength={200}
              value={pubTitle}
              onChange={(e) => setPubTitle(e.target.value)}
              placeholder="e.g. Architecture Decision Record & Layered Diagram"
              className={inputClass}
              disabled={pubBusy}
            />
          </Field>

          <Field id="pub-desc" label="Instructions & Deliverables" required>
            <textarea
              id="pub-desc"
              rows={4}
              value={pubDesc}
              onChange={(e) => setPubDesc(e.target.value)}
              placeholder="Specify expected PDF/DOCX structure, rubric weights, and submission constraints…"
              className={inputClass}
              disabled={pubBusy}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              id="pub-due"
              label="Deadline (UAE Time, UTC+4)"
              hint="Stored with explicit +04:00 timezone offset."
              required
            >
              <input
                id="pub-due"
                type="datetime-local"
                value={pubDue}
                onChange={(e) => setPubDue(e.target.value)}
                className={inputClass}
                disabled={pubBusy}
              />
            </Field>

            <Field id="pub-max" label="Maximum Marks (1–1000)" required>
              <input
                id="pub-max"
                type="number"
                min={1}
                max={1000}
                value={pubMax}
                onChange={(e) => setPubMax(e.target.value)}
                className={`${inputClass} font-mono tabular-nums`}
                disabled={pubBusy}
              />
            </Field>
          </div>

          <Field id="pub-policy" label="Deadline Policy" required>
            <select
              id="pub-policy"
              value={pubPolicy}
              onChange={(e) => setPubPolicy(e.target.value as 'strict' | 'allow_late')}
              className={inputClass}
              disabled={pubBusy}
            >
              <option value="strict">Strict — Reject uploads after deadline (HTTP 409)</option>
              <option value="allow_late">Allow Late — Accept and flag late submissions</option>
            </select>
          </Field>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={pubBusy}
              onClick={() => setPubOpen(false)}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={pubBusy} className={primaryBtnClass}>
              {pubBusy ? 'Publishing…' : 'Publish Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Grade Submission */}
      <Modal
        open={gradeTarget !== null}
        onClose={() => {
          if (!gradeBusy) setGradeTarget(null);
        }}
        title="Grade Submission & Release Feedback"
        subtitle={
          gradeTarget
            ? `${gradeTarget.submission.name} · ${gradeTarget.assignment.title}`
            : undefined
        }
      >
        {gradeTarget && (
          <form onSubmit={handleGradeSubmit} className="space-y-4">
            {gradeError && <ErrorBanner message={gradeError} />}
            <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
              <span className="font-mono truncate">{gradeTarget.submission.filename}</span>
              <button
                type="button"
                onClick={() =>
                  executeDownload(
                    `/api/download?id=${gradeTarget.submission.id}`,
                    gradeTarget.submission.filename
                  )
                }
                className="text-[var(--accent)] font-semibold hover:underline shrink-0"
              >
                Download file
              </button>
            </div>

            <Field
              id="grade-score"
              label={`Score (0 to ${gradeTarget.assignment.max_points})`}
              hint="Each submission can be graded only once."
              required
            >
              <input
                id="grade-score"
                type="number"
                min={0}
                max={gradeTarget.assignment.max_points}
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                className={`${inputClass} font-mono tabular-nums`}
                disabled={gradeBusy}
              />
            </Field>

            <Field id="grade-comment" label="Written Feedback" required>
              <textarea
                id="grade-comment"
                rows={4}
                value={gradeComment}
                onChange={(e) => setGradeComment(e.target.value)}
                placeholder="Provide clear, constructive academic feedback…"
                className={inputClass}
                disabled={gradeBusy}
              />
            </Field>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={gradeBusy}
                onClick={() => setGradeTarget(null)}
                className={secondaryBtnClass}
              >
                Cancel
              </button>
              <button type="submit" disabled={gradeBusy} className={primaryBtnClass}>
                {gradeBusy ? 'Saving…' : 'Release Grade & Feedback'}
              </button>
            </div>
          </form>
        )}
      </Modal>
      {/* Confirm Release Final Course Result */}
      <ConfirmDialog
        open={releaseStudent !== null}
        onClose={() => {
          if (!releaseBusy) setReleaseStudent(null);
        }}
        onConfirm={handleConfirmReleaseResult}
        title="Release Final Course Result"
        description={
          releaseStudent
            ? `Release the final course result for ${releaseStudent.name} in ${course.code}? The server computes total earned / total available marks across all published assignments.`
            : ''
        }
        note="This action is permanent and immutable. Once any result is released for this course, new assignments and new enrollments are locked."
        confirmLabel="Release Final Result"
        busy={releaseBusy}
        error={releaseError}
      />
  </>);
}
