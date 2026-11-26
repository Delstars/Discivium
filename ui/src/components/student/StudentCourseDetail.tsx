import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Download,
  FileText,
  MessageSquare,
  Send,
  Upload,
  Vote,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import {
  asBoolean,
  formatIsoDateTimeUae,
  formatTimeRange,
  isPastDeadline,
  weekdayName,
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

type CourseTab = 'coursework' | 'resources' | 'discussion' | 'polls';

export function StudentCoursesList() {
  const { state, navigate } = useApp();
  if (!state) return null;
  const courses = state.courses ?? [];
  const timetable = state.timetable ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={state.semester}
        title="My Enrolled Courses"
        description="Select a module to open resources, coursework submissions, internal discussion, and course polls."
        actions={
          <button
            type="button"
            onClick={() => navigate('registration')}
            className={secondaryBtnClass}
          >
            Browse Registration Catalogue
          </button>
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          title="You are not enrolled in any courses"
          description="Use the Registration Catalogue to enroll in Fall 2026 offerings."
          action={
            <button
              type="button"
              onClick={() => navigate('registration')}
              className={primaryBtnClass}
            >
              Open Registration
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => {
            const slot = timetable.find((t) => t.id === course.id);
            const openPolls = course.workspace.forms.filter((f) => asBoolean(f.open)).length;
            return (
              <SectionCard key={course.id} className="hover:border-[var(--accent)] transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[var(--accent)]">
                      {course.code}
                    </span>
                    <span className="text-xs text-[var(--ink-muted)] font-mono tabular-nums">
                      {slot ? `${slot.credits} credits · ${slot.room}` : state.semester}
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
                    {course.title}
                  </h2>
                  <p className="text-xs text-[var(--ink-secondary)]">
                    {slot
                      ? `${weekdayName(slot.weekday)} · ${formatTimeRange(slot.start_min, slot.end_min)}`
                      : 'Schedule not attached'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-muted)] pt-2 border-t border-[var(--border)]">
                    <span>{course.assignments.length} assignment(s)</span>
                    <span aria-hidden="true">·</span>
                    <span>{course.resources.length} resource(s)</span>
                    <span aria-hidden="true">·</span>
                    <span>{course.workspace.messages.length} message(s)</span>
                    {openPolls > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <StatusBadge variant="accent">{openPolls} open poll</StatusBadge>
                      </>
                    )}
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => navigate('course', course.id)}
                      className={primaryBtnClass}
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
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

export function StudentCourseDetail({ courseId }: { courseId: number }) {
  const { state, navigate, executeAction, executeUpload, executeDownload } = useApp();
  const [tab, setTab] = useState<CourseTab>('coursework');
  const [submitAssignmentId, setSubmitAssignmentId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [messageBody, setMessageBody] = useState('');
  const [postingMessage, setPostingMessage] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  const [pollChoices, setPollChoices] = useState<Record<number, number>>({});
  const [submittingPollId, setSubmittingPollId] = useState<number | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  const course = useMemo(
    () => (state?.courses ?? []).find((c) => c.id === courseId) ?? null,
    [state?.courses, courseId]
  );

  const slot = useMemo(
    () => (state?.timetable ?? []).find((t) => t.id === courseId) ?? null,
    [state?.timetable, courseId]
  );

  if (!state) return null;

  if (!course) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('courses')}
          className={secondaryBtnClass}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Courses
        </button>
        <EmptyState
          title="Course not available"
          description="You do not have access to this course record, or you are not currently enrolled in it."
        />
      </div>
    );
  }

  const activeAssignment =
    course.assignments.find((a) => a.id === submitAssignmentId) ?? null;

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitAssignmentId || !selectedFile) {
      setUploadError('Select a PDF or DOCX document before submitting.');
      return;
    }
    setUploadError(null);
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('assignment_id', String(submitAssignmentId));
      formData.append('file', selectedFile);
      await executeUpload(
        'submit',
        formData,
        (pct) => setUploadProgress(pct),
        `Submitted ${selectedFile.name}.`
      );
      setSubmitAssignmentId(null);
      setSelectedFile(null);
      setUploadProgress(null);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim()) {
      setMessageError('Enter a message before posting.');
      return;
    }
    setMessageError(null);
    setPostingMessage(true);
    try {
      await executeAction(
        'message',
        { course_id: course.id, body: messageBody.trim() },
        'Message posted to course discussion.'
      );
      setMessageBody('');
    } catch (err) {
      setMessageError(err instanceof ApiError ? err.message : 'Unable to post message.');
    } finally {
      setPostingMessage(false);
    }
  };

  const handleVotePoll = async (formId: number) => {
    const choice = pollChoices[formId];
    if (choice === undefined) {
      setPollError('Select an option before submitting your poll response.');
      return;
    }
    setPollError(null);
    setSubmittingPollId(formId);
    try {
      await executeAction(
        'form-response',
        { form_id: formId, choice },
        'Poll response recorded.'
      );
    } catch (err) {
      setPollError(err instanceof ApiError ? err.message : 'Unable to submit poll response.');
    } finally {
      setSubmittingPollId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate('courses')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to My Courses
        </button>

        <PageHeader
          eyebrow={
            slot
              ? `${course.code} · ${weekdayName(slot.weekday)} ${formatTimeRange(slot.start_min, slot.end_min)} · Room ${slot.room} · ${slot.credits} credits`
              : `${course.code} · ${state.semester}`
          }
          title={course.title}
        />
      </div>

      {/* Course Detail Tabs */}
      <div
        role="tablist"
        aria-label="Course sections"
        className="flex flex-wrap gap-1 border-b border-[var(--border)]"
      >
        {(
          [
            ['coursework', `Coursework (${course.assignments.length})`, FileText],
            ['resources', `Resources (${course.resources.length})`, Download],
            ['discussion', `Discussion (${course.workspace.messages.length})`, MessageSquare],
            ['polls', `Polls (${course.workspace.forms.length})`, Vote],
          ] as Array<[CourseTab, string, React.ComponentType<{ className?: string }>]>
        ).map(([id, label, Icon]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab: Coursework */}
      {tab === 'coursework' && (
        <div className="space-y-4">
          {course.assignments.length === 0 ? (
            <EmptyState
              title="No coursework published"
              description="Assignments published by your lecturer for this module will appear here."
            />
          ) : (
            course.assignments.map((a) => {
              const sub = a.submissions[0] ?? null;
              const overdue = isPastDeadline(a.due_at);
              const blockedStrict = !sub && overdue && a.policy === 'strict';
              return (
                <SectionCard key={a.id}>
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
                        <span className="font-mono tabular-nums">Max {a.max_points} marks</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {a.policy === 'strict'
                            ? 'Strict deadline policy'
                            : 'Late submission allowed'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Due {formatIsoDateTimeUae(a.due_at)}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-[var(--ink)]">{a.title}</h3>
                      <p className="text-sm text-[var(--ink-secondary)] leading-relaxed whitespace-pre-wrap">
                        {a.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
                      {sub ? (
                        sub.status === 'graded' ? (
                          <StatusBadge variant="success">
                            Graded · {sub.score}/{a.max_points}
                          </StatusBadge>
                        ) : (
                          <StatusBadge variant="accent">
                            {asBoolean(sub.late) ? 'Submitted (Late)' : 'Submitted'}
                          </StatusBadge>
                        )
                      ) : blockedStrict ? (
                        <StatusBadge variant="danger">Deadline passed (Strict)</StatusBadge>
                      ) : overdue ? (
                        <StatusBadge variant="warning">Past due (Late allowed)</StatusBadge>
                      ) : (
                        <StatusBadge variant="neutral">Not submitted</StatusBadge>
                      )}

                      {!sub && (
                        <button
                          type="button"
                          onClick={() => {
                            setSubmitAssignmentId(a.id);
                            setSelectedFile(null);
                            setUploadError(null);
                            setUploadProgress(null);
                          }}
                          className={primaryBtnClass}
                        >
                          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                          Upload PDF / DOCX
                        </button>
                      )}
                    </div>
                  </div>

                  {sub && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <p className="text-[var(--ink)] font-medium">
                          Uploaded file:{' '}
                          <span className="font-mono">{sub.filename}</span>
                        </p>
                        <p className="text-[var(--ink-muted)] font-mono tabular-nums">
                          Submitted {formatIsoDateTimeUae(sub.submitted_at)}
                          {asBoolean(sub.late) ? ' · Marked Late' : ''}
                        </p>
                        {sub.status === 'graded' && sub.comment && (
                          <div className="mt-2 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] p-3 text-xs text-[var(--ink)]">
                            <p className="font-semibold text-[var(--teal)]">
                              Released Lecturer Feedback ({sub.score}/{a.max_points})
                            </p>
                            <p className="mt-1 text-[var(--ink-secondary)] whitespace-pre-wrap">
                              {sub.comment}
                            </p>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          executeDownload(`/api/download?id=${sub.id}`, sub.filename)
                        }
                        className={secondaryBtnClass}
                      >
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                        Download My File
                      </button>
                    </div>
                  )}
                </SectionCard>
              );
            })
          )}
        </div>
      )}

      {/* Tab: Resources */}
      {tab === 'resources' && (
        <SectionCard
          title="Course Resources"
          subtitle="Verified PDF and DOCX documents published by the course lecturer."
        >
          {course.resources.length === 0 ? (
            <EmptyState
              title="No resources published yet"
              description="Lecture guides, syllabus documents, and readings uploaded by the lecturer will appear here."
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {course.resources.map((res) => (
                <div
                  key={res.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--ink)]">{res.title}</p>
                    <p className="text-xs text-[var(--ink-muted)] font-mono mt-0.5">
                      {res.filename} · Published {formatIsoDateTimeUae(res.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      executeDownload(`/api/resource-download?id=${res.id}`, res.filename)
                    }
                    className={secondaryBtnClass}
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Tab: Discussion */}
      {tab === 'discussion' && (
        <SectionCard
          title="Course Discussion"
          subtitle="Internal course communication shared with enrolled students and the assigned lecturer."
        >
          <form onSubmit={handlePostMessage} className="space-y-3 pb-5 border-b border-[var(--border)]">
            {messageError && (
              <ErrorBanner message={messageError} onDismiss={() => setMessageError(null)} />
            )}
            <Field id="student-course-msg" label="Post a message" required>
              <textarea
                id="student-course-msg"
                rows={3}
                maxLength={2000}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Ask a question about lectures, deliverables, or studio sessions…"
                className={inputClass}
                disabled={postingMessage}
              />
            </Field>
            <div className="flex justify-end">
              <button type="submit" disabled={postingMessage} className={primaryBtnClass}>
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                {postingMessage ? 'Posting…' : 'Post Message'}
              </button>
            </div>
          </form>

          <div className="pt-5">
            {course.workspace.messages.length === 0 ? (
              <EmptyState
                title="No discussion posts yet"
                description="Start a course conversation above."
              />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {course.workspace.messages.map((msg) => (
                  <div key={msg.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[var(--ink)]">{msg.author_name}</span>
                      <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                        {formatIsoDateTimeUae(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--ink-secondary)] whitespace-pre-wrap leading-relaxed">
                      {msg.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Tab: Polls */}
      {tab === 'polls' && (
        <div className="space-y-4">
          {pollError && (
            <ErrorBanner message={pollError} onDismiss={() => setPollError(null)} />
          )}
          {course.workspace.forms.length === 0 ? (
            <EmptyState
              title="No course polls yet"
              description="Single-question polls created by your lecturer will appear here."
            />
          ) : (
            course.workspace.forms.map((poll) => {
              const isOpen = asBoolean(poll.open);
              const answered = poll.my_choice !== null && poll.my_choice !== undefined;
              const selected = answered ? poll.my_choice : pollChoices[poll.id];
              return (
                <SectionCard
                  key={poll.id}
                  title={poll.title}
                  subtitle={`Created ${formatIsoDateTimeUae(poll.created_at)}`}
                  action={
                    <StatusBadge variant={isOpen ? 'success' : 'neutral'}>
                      {isOpen ? 'Open' : 'Closed'}
                    </StatusBadge>
                  }
                >
                  <p className="text-sm font-medium text-[var(--ink)] mb-4">{poll.question}</p>
                  <fieldset className="space-y-2" disabled={!isOpen || answered}>
                    <legend className="sr-only">{poll.question}</legend>
                    {poll.options.map((option, idx) => (
                      <label
                        key={`${poll.id}-${idx}`}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition-colors ${
                          selected === idx
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]/50 text-[var(--ink)]'
                            : 'border-[var(--border)] bg-[var(--surface-subtle)]/35 text-[var(--ink-secondary)]'
                        } ${!isOpen || answered ? 'cursor-default' : 'cursor-pointer hover:border-[var(--accent)]'}`}
                      >
                        <input
                          type="radio"
                          name={`poll-${poll.id}`}
                          checked={selected === idx}
                          onChange={() =>
                            setPollChoices((prev) => ({ ...prev, [poll.id]: idx }))
                          }
                          disabled={!isOpen || answered}
                        />
                        <span>{option}</span>
                        {answered && poll.my_choice === idx && (
                          <span className="ml-auto text-xs font-medium text-[var(--accent)]">
                            Your response
                          </span>
                        )}
                      </label>
                    ))}
                  </fieldset>
                  <div className="mt-4 flex items-center justify-between gap-2 text-xs text-[var(--ink-muted)]">
                    <span>
                      {answered
                        ? 'Your response has been recorded (one response per student).'
                        : isOpen
                          ? 'Select one option and submit.'
                          : 'This poll is closed for new responses.'}
                    </span>
                    {isOpen && !answered && (
                      <button
                        type="button"
                        disabled={submittingPollId === poll.id}
                        onClick={() => handleVotePoll(poll.id)}
                        className={primaryBtnClass}
                      >
                        {submittingPollId === poll.id ? 'Submitting…' : 'Submit Response'}
                      </button>
                    )}
                  </div>
                </SectionCard>
              );
            })
          )}
        </div>
      )}

      {/* Upload Submission Modal */}
      <Modal
        open={submitAssignmentId !== null}
        onClose={() => {
          if (!uploading) setSubmitAssignmentId(null);
        }}
        title="Submit Coursework Document"
        subtitle={
          activeAssignment
            ? `${course.code} · ${activeAssignment.title} · Due ${formatIsoDateTimeUae(activeAssignment.due_at)}`
            : undefined
        }
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {uploadError && <ErrorBanner message={uploadError} />}

          <Field
            id="submission-file-input"
            label="PDF or DOCX document (maximum 100 MB)"
            hint="The server validates file signature bytes and prevents duplicate submissions."
            required
          >
            <input
              id="submission-file-input"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              disabled={uploading}
              className="block w-full text-xs text-[var(--ink-secondary)] file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border file:border-[var(--border-strong)] file:bg-[var(--surface-subtle)] file:text-xs file:font-semibold file:text-[var(--ink)] hover:file:bg-[var(--surface-hover)]"
            />
          </Field>

          {uploading && (
            <div className="space-y-1.5" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-[var(--ink-secondary)]">
                <span>Uploading document…</span>
                <span className="font-mono tabular-nums">
                  {uploadProgress !== null ? `${uploadProgress}%` : 'In progress'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                <div
                  className={`h-full bg-[var(--accent)] transition-all ${
                    uploadProgress === null ? 'w-1/2 animate-pulse' : ''
                  }`}
                  style={
                    uploadProgress !== null ? { width: `${uploadProgress}%` } : undefined
                  }
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => setSubmitAssignmentId(null)}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={uploading || !selectedFile} className={primaryBtnClass}>
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              {uploading ? 'Uploading…' : 'Submit Document'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
