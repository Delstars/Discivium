import React, { useState } from 'react';
import { Plus, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import type { ServiceRequestCategory, ServiceRequestItem } from '../../types/api';
import {
  canStudentCancelRequest,
  formatCategoryLabel,
  formatIsoDateTimeUae,
  formatStatusLabel,
} from '../../lib/formatters';
import {
  ConfirmDialog,
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

function requestBadgeVariant(status: ServiceRequestItem['status']) {
  switch (status) {
    case 'resolved':
      return 'success' as const;
    case 'in_review':
      return 'accent' as const;
    case 'pending':
      return 'warning' as const;
    case 'rejected':
      return 'danger' as const;
    case 'cancelled':
      return 'neutral' as const;
  }
}

const TIMELINE_STEPS = ['pending', 'in_review', 'completed'] as const;

function stepState(
  status: ServiceRequestItem['status'],
  step: (typeof TIMELINE_STEPS)[number]
): 'done' | 'active' | 'idle' {
  if (step === 'pending') return status === 'pending' ? 'active' : 'done';
  if (step === 'in_review') {
    if (status === 'in_review') return 'active';
    if (status === 'resolved' || status === 'rejected') return 'done';
    return 'idle';
  }
  if (status === 'resolved' || status === 'rejected' || status === 'cancelled') return 'active';
  return 'idle';
}

export function StudentServices() {
  const { state, executeAction } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [category, setCategory] = useState<ServiceRequestCategory>('enrollment_letter');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [cancelTarget, setCancelTarget] = useState<ServiceRequestItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!state) return null;
  const requests = state.requests ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setCreateError('Provide both a subject and a detailed description.');
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      await executeAction(
        'request',
        { category, subject: subject.trim(), description: description.trim() },
        'Campus service request submitted.'
      );
      setSubject('');
      setDescription('');
      setCreateOpen(false);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Unable to submit service request.');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelError(null);
    setCancelling(true);
    try {
      await executeAction(
        'request-status',
        { request_id: cancelTarget.id, status: 'cancelled', note: '' },
        `Request #${cancelTarget.id} cancelled.`
      );
      setCancelTarget(null);
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : 'Unable to cancel request.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Campus Services · Student Registry Desk"
        title="Campus Service Requests"
        description="Submit enrollment letter, academic record, IT support, or general requests, monitor administrative status transitions, or cancel active requests."
        actions={
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
            className={primaryBtnClass}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            New Service Request
          </button>
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          title="No service requests submitted"
          description="Create a campus service request to track review progress and administrative decisions."
          action={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className={primaryBtnClass}
            >
              Create First Request
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <SectionCard key={req.id}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
                    <span className="font-mono font-semibold text-[var(--ink)]">REQ-{req.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatCategoryLabel(req.category)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Created {formatIsoDateTimeUae(req.created_at)}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-[var(--ink)]">{req.subject}</h2>
                  <p className="text-sm text-[var(--ink-secondary)] whitespace-pre-wrap leading-relaxed">
                    {req.description}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <StatusBadge variant={requestBadgeVariant(req.status)}>
                    {formatStatusLabel(req.status)}
                  </StatusBadge>
                  {canStudentCancelRequest(req.status) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCancelError(null);
                        setCancelTarget(req);
                      }}
                      className={secondaryBtnClass}
                    >
                      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>

              {/* Status Timeline */}
              <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
                <ol className="grid grid-cols-3 gap-2 text-xs">
                  {TIMELINE_STEPS.map((step) => {
                    const stateKey = stepState(req.status, step);
                    const finalLabel =
                      step === 'completed'
                        ? req.status === 'rejected'
                          ? 'Rejected'
                          : req.status === 'cancelled'
                            ? 'Cancelled'
                            : 'Resolved'
                        : step === 'in_review'
                          ? 'In Review'
                          : 'Submitted';
                    return (
                      <li
                        key={step}
                        className={`rounded-lg px-3 py-2 border text-center font-medium ${
                          stateKey === 'active'
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                            : stateKey === 'done'
                              ? 'border-[var(--teal)]/30 bg-[var(--teal-soft)] text-[var(--teal)]'
                              : 'border-[var(--border)] bg-[var(--surface-subtle)]/40 text-[var(--ink-muted)]'
                        }`}
                      >
                        {finalLabel}
                      </li>
                    );
                  })}
                </ol>

                {req.decision && (
                  <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] px-3.5 py-2.5 text-xs">
                    <span className="font-semibold text-[var(--ink)]">Registry Decision Note: </span>
                    <span className="text-[var(--ink-secondary)]">{req.decision}</span>
                  </div>
                )}

                <p className="text-[11px] font-mono tabular-nums text-[var(--ink-muted)]">
                  Last updated: {formatIsoDateTimeUae(req.updated_at)}
                </p>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          if (!creating) setCreateOpen(false);
        }}
        title="Submit Campus Service Request"
        subtitle="Routed to Campus Administration with tracked status transitions."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && <ErrorBanner message={createError} />}
          <Field id="req-category" label="Category" required>
            <select
              id="req-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceRequestCategory)}
              className={inputClass}
              disabled={creating}
            >
              <option value="enrollment_letter">Enrollment Letter</option>
              <option value="transcript">Academic Record / Transcript</option>
              <option value="it_support">IT Support</option>
              <option value="general">General Inquiry</option>
            </select>
          </Field>

          <Field id="req-subject" label="Subject" required>
            <input
              id="req-subject"
              type="text"
              maxLength={150}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Concise summary of your request"
              className={inputClass}
              disabled={creating}
            />
          </Field>

          <Field id="req-description" label="Details" required>
            <textarea
              id="req-description"
              rows={4}
              maxLength={3000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include relevant dates, course codes, or delivery instructions…"
              className={inputClass}
              disabled={creating}
            />
          </Field>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={creating}
              onClick={() => setCreateOpen(false)}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={creating} className={primaryBtnClass}>
              {creating ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Request Confirmation */}
      <ConfirmDialog
        open={cancelTarget !== null}
        onClose={() => {
          if (!cancelling) setCancelTarget(null);
        }}
        onConfirm={handleCancelConfirm}
        title="Cancel Service Request"
        description={
          cancelTarget
            ? `Cancel request REQ-${cancelTarget.id} ("${cancelTarget.subject}")? Cancelled requests cannot be reopened.`
            : ''
        }
        confirmLabel="Confirm Cancellation"
        destructive
        busy={cancelling}
        error={cancelError}
      />
    </div>
  );
}
