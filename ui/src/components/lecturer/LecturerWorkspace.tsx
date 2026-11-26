import React, { useState } from 'react';
import { Send, Trash2, Vote } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import type { CourseItem } from '../../types/api';
import { asBoolean, formatIsoDateTimeUae } from '../../lib/formatters';
import { ConfirmDialog, EmptyState, ErrorBanner, Field, Modal, SectionCard, StatusBadge, inputClass, primaryBtnClass, secondaryBtnClass } from '../ui/Primitives';

export function LecturerWorkspace({ course, active }: { course: CourseItem; active: boolean }) {
  const { executeAction } = useApp();
  const [msgBody, setMsgBody] = useState('');
  const [msgBusy, setMsgBusy] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  const [pollOpen, setPollOpen] = useState(false);
  const [pollTitle, setPollTitle] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['Option A', 'Option B']);
  const [pollBusy, setPollBusy] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

  const [closingPollId, setClosingPollId] = useState<number | null>(null);
  const [closePollBusy, setClosePollBusy] = useState(false);
  const [closePollError, setClosePollError] = useState<string | null>(null);

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgBody.trim()) {
      setMsgError('Enter a message before posting.');
      return;
    }
    setMsgError(null);
    setMsgBusy(true);
    try {
      await executeAction(
        'message',
        { course_id: course.id, body: msgBody.trim() },
        'Posted course message.'
      );
      setMsgBody('');
    } catch (err) {
      setMsgError(err instanceof ApiError ? err.message : 'Unable to post message.');
    } finally {
      setMsgBusy(false);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!pollTitle.trim() || !pollQuestion.trim()) {
      setPollError('Enter both a poll title and question.');
      return;
    }
    if (cleaned.length < 2 || cleaned.length > 8) {
      setPollError('Provide between 2 and 8 non-empty options.');
      return;
    }
    if (new Set(cleaned).size !== cleaned.length) {
      setPollError('All poll options must be unique.');
      return;
    }
    setPollError(null);
    setPollBusy(true);
    try {
      await executeAction(
        'form',
        {
          course_id: course.id,
          title: pollTitle.trim(),
          question: pollQuestion.trim(),
          options: cleaned,
        },
        `Published poll "${pollTitle.trim()}".`
      );
      setPollTitle('');
      setPollQuestion('');
      setPollOptions(['Option A', 'Option B']);
      setPollOpen(false);
    } catch (err) {
      setPollError(err instanceof ApiError ? err.message : 'Unable to create poll.');
    } finally {
      setPollBusy(false);
    }
  };

  const handleConfirmClosePoll = async () => {
    if (!closingPollId) return;
    setClosePollError(null);
    setClosePollBusy(true);
    try {
      await executeAction('form-close', { form_id: closingPollId }, 'Poll closed.');
      setClosingPollId(null);
    } catch (err) {
      setClosePollError(err instanceof ApiError ? err.message : 'Unable to close poll.');
    } finally {
      setClosePollBusy(false);
    }
  };
  return (<>
      {/* Tab 4: Discussion & Polls */}
      {active && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <SectionCard
              title="Course Discussion"
              subtitle="Internal course board shared with enrolled students."
            >
              <form
                onSubmit={handlePostMessage}
                className="space-y-3 pb-4 border-b border-[var(--border)]"
              >
                {msgError && (
                  <ErrorBanner message={msgError} onDismiss={() => setMsgError(null)} />
                )}
                <Field id="lec-course-msg" label="Post announcement or reply" required>
                  <textarea
                    id="lec-course-msg"
                    rows={3}
                    maxLength={2000}
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    placeholder="Share studio reminders, reading notes, or clarifications…"
                    className={inputClass}
                    disabled={msgBusy}
                  />
                </Field>
                <div className="flex justify-end">
                  <button type="submit" disabled={msgBusy} className={primaryBtnClass}>
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    {msgBusy ? 'Posting…' : 'Post Message'}
                  </button>
                </div>
              </form>

              <div className="pt-4">
                {course.workspace.messages.length === 0 ? (
                  <EmptyState
                    title="No messages yet"
                    description="Post the first announcement for this course."
                  />
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {course.workspace.messages.map((m) => (
                      <div key={m.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-[var(--ink)]">{m.author_name}</span>
                          <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                            {formatIsoDateTimeUae(m.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--ink-secondary)] whitespace-pre-wrap">
                          {m.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <SectionCard
              title="Course Polls"
              subtitle="Single-question polls with live response counts."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setPollError(null);
                    setPollOpen(true);
                  }}
                  className={primaryBtnClass}
                >
                  <Vote className="w-3.5 h-3.5" aria-hidden="true" />
                  Create Poll
                </button>
              }
            >
              {course.workspace.forms.length === 0 ? (
                <EmptyState
                  title="No course polls created"
                  description="Create a single-question poll with 2 to 8 distinct options to gather student responses."
                />
              ) : (
                <div className="space-y-4">
                  {course.workspace.forms.map((poll) => {
                    const isOpen = asBoolean(poll.open);
                    const counts = poll.counts ?? poll.options.map(() => 0);
                    const totalVotes = counts.reduce((sum, c) => sum + c, 0);
                    return (
                      <div
                        key={poll.id}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)]/35 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-[var(--ink)]">
                              {poll.title}
                            </h3>
                            <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                              {poll.question}
                            </p>
                          </div>
                          <StatusBadge variant={isOpen ? 'success' : 'neutral'}>
                            {isOpen ? 'Open' : 'Closed'}
                          </StatusBadge>
                        </div>

                        <div className="space-y-2">
                          {poll.options.map((opt, idx) => {
                            const count = counts[idx] ?? 0;
                            const pct =
                              totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                            return (
                              <div key={`${poll.id}-${idx}`} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[var(--ink)]">{opt}</span>
                                  <span className="font-mono tabular-nums text-[var(--ink-muted)]">
                                    {count} ({pct}%)
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                                  <div
                                    className="h-full bg-[var(--accent)]"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)] text-xs text-[var(--ink-muted)]">
                          <span className="font-mono tabular-nums">
                            {totalVotes} total response(s)
                          </span>
                          {isOpen && (
                            <button
                              type="button"
                              onClick={() => {
                                setClosePollError(null);
                                setClosingPollId(poll.id);
                              }}
                              className={secondaryBtnClass}
                            >
                              Close Poll
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}
      {/* Modal: Create Single-Question Poll */}
      <Modal
        open={pollOpen}
        onClose={() => {
          if (!pollBusy) setPollOpen(false);
        }}
        title={`Create Course Poll — ${course.code}`}
        subtitle="Provide 2 to 8 distinct answer options."
      >
        <form onSubmit={handleCreatePoll} className="space-y-4">
          {pollError && <ErrorBanner message={pollError} />}
          <Field id="poll-title" label="Poll Title" required>
            <input
              id="poll-title"
              type="text"
              maxLength={150}
              value={pollTitle}
              onChange={(e) => setPollTitle(e.target.value)}
              placeholder="e.g. Lab Session Time Preference"
              className={inputClass}
              disabled={pollBusy}
            />
          </Field>

          <Field id="poll-question" label="Question" required>
            <textarea
              id="poll-question"
              rows={2}
              maxLength={500}
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="What single question should students answer?"
              className={inputClass}
              disabled={pollBusy}
            />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--ink)]">
                Options ({pollOptions.length}/8)
              </span>
              {pollOptions.length < 8 && (
                <button
                  type="button"
                  onClick={() => setPollOptions((prev) => [...prev, ''])}
                  className="text-xs font-medium text-[var(--accent)] hover:underline"
                >
                  + Add option
                </button>
              )}
            </div>
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  aria-label={`Option ${idx + 1}`}
                  maxLength={100}
                  value={opt}
                  onChange={(e) =>
                    setPollOptions((prev) =>
                      prev.map((item, i) => (i === idx ? e.target.value : item))
                    )
                  }
                  placeholder={`Option ${idx + 1}`}
                  className={inputClass}
                  disabled={pollBusy}
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    aria-label={`Remove option ${idx + 1}`}
                    onClick={() =>
                      setPollOptions((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="p-2 rounded-lg text-[var(--ink-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={pollBusy}
              onClick={() => setPollOpen(false)}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={pollBusy} className={primaryBtnClass}>
              {pollBusy ? 'Creating…' : 'Create Poll'}
            </button>
          </div>
        </form>
      </Modal>
      {/* Confirm Close Poll */}
      <ConfirmDialog
        open={closingPollId !== null}
        onClose={() => {
          if (!closePollBusy) setClosingPollId(null);
        }}
        onConfirm={handleConfirmClosePoll}
        title="Close Course Poll"
        description="Close this poll to prevent further student responses? Recorded response counts will remain visible."
        confirmLabel="Close Poll"
        destructive
        busy={closePollBusy}
        error={closePollError}
      />
  </>);
}
