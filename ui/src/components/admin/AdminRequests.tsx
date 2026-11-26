import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import type { ServiceRequestItem, ServiceRequestStatus } from '../../types/api';
import {
  formatCategoryLabel,
  formatIsoDateTimeUae,
  formatStatusLabel,
  getAdminNextRequestStatuses,
} from '../../lib/formatters';
import {
  EmptyState,
  ErrorBanner,
  Field,
  Modal,
  PageHeader,
  SectionCard,
  StatusBadge,
  dangerBtnClass,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
} from '../ui/Primitives';

export function AdminRequests() {
  const { state, executeAction } = useApp();
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceRequestStatus>('all');
  const [query, setQuery] = useState('');

  const [decisionTarget, setDecisionTarget] = useState<{
    request: ServiceRequestItem;
    nextStatus: 'in_review' | 'resolved' | 'rejected';
    requiresNote: boolean;
  } | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state) return null;
  const requests = state.requests ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.student_name.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        String(r.id).includes(q)
      );
    });
  }, [requests, statusFilter, query]);

  const handleConfirmDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionTarget) return;
    if (decisionTarget.requiresNote && !decisionNote.trim()) {
      setError('A decision note is required when resolving or rejecting a request.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await executeAction(
        'request-status',
        {
          request_id: decisionTarget.request.id,
          status: decisionTarget.nextStatus,
          note: decisionNote.trim(),
        },
        `Updated REQ-${decisionTarget.request.id} to ${formatStatusLabel(decisionTarget.nextStatus)}.`
      );
      setDecisionTarget(null);
      setDecisionNote('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update request status.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Campus Operations · Registry Queue"
        title="Service Request Queue"
        description="Legal state transitions enforced server-side: Pending → In Review / Rejected; In Review → Resolved / Rejected. Decision notes are mandatory on final resolution or rejection."
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]"
          role="group"
          aria-label="Filter service requests"
        >
          {(
            [
              ['all', 'All'],
              ['pending', 'Pending'],
              ['in_review', 'In Review'],
              ['resolved', 'Resolved'],
              ['rejected', 'Rejected'],
              ['cancelled', 'Cancelled'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === id
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
            aria-label="Search service requests"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student or subject…"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No service requests in this view"
          description="Requests submitted by students appear here for administrative action."
        />
      ) : (
        <div className="space-y-3.5">
          {filtered.map((req) => {
            const transitions = getAdminNextRequestStatuses(req.status);
            return (
              <SectionCard key={req.id}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
                      <span className="font-mono font-semibold text-[var(--ink)]">
                        REQ-{req.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[var(--ink)]">{req.student_name}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatCategoryLabel(req.category)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatIsoDateTimeUae(req.created_at)}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-[var(--ink)]">{req.subject}</h2>
                    <p className="text-sm text-[var(--ink-secondary)] whitespace-pre-wrap">
                      {req.description}
                    </p>
                    {req.decision && (
                      <p className="text-xs text-[var(--ink-secondary)] pt-1">
                        <strong className="text-[var(--ink)]">Decision note:</strong> {req.decision}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
                    <StatusBadge
                      variant={
                        req.status === 'resolved'
                          ? 'success'
                          : req.status === 'in_review'
                            ? 'accent'
                            : req.status === 'pending'
                              ? 'warning'
                              : req.status === 'rejected'
                                ? 'danger'
                                : 'neutral'
                      }
                    >
                      {formatStatusLabel(req.status)}
                    </StatusBadge>

                    {transitions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {transitions.map((t) => (
                          <button
                            key={t.status}
                            type="button"
                            onClick={() => {
                              setError(null);
                              setDecisionNote('');
                              setDecisionTarget({
                                request: req,
                                nextStatus: t.status,
                                requiresNote: t.requiresNote,
                              });
                            }}
                            className={
                              t.status === 'rejected'
                                ? dangerBtnClass
                                : t.status === 'resolved'
                                  ? primaryBtnClass
                                  : secondaryBtnClass
                            }
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      <Modal
        open={decisionTarget !== null}
        onClose={() => {
          if (!busy) setDecisionTarget(null);
        }}
        title={
          decisionTarget
            ? `${formatStatusLabel(decisionTarget.nextStatus)} — REQ-${decisionTarget.request.id}`
            : 'Update Request Status'
        }
        subtitle={
          decisionTarget
            ? `${decisionTarget.request.student_name} · ${decisionTarget.request.subject}`
            : undefined
        }
        size="sm"
      >
        {decisionTarget && (
          <form onSubmit={handleConfirmDecision} className="space-y-4">
            {error && <ErrorBanner message={error} />}
            <Field
              id="req-decision-note"
              label={
                decisionTarget.requiresNote
                  ? 'Administrative Decision Note (Required)'
                  : 'Review Note (Optional)'
              }
              required={decisionTarget.requiresNote}
            >
              <textarea
                id="req-decision-note"
                rows={3}
                maxLength={1000}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Explain the review update, resolution details, or rejection reason…"
                className={inputClass}
                disabled={busy}
              />
            </Field>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setDecisionTarget(null)}
                className={secondaryBtnClass}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className={
                  decisionTarget.nextStatus === 'rejected' ? dangerBtnClass : primaryBtnClass
                }
              >
                {busy ? 'Updating…' : `Confirm ${formatStatusLabel(decisionTarget.nextStatus)}`}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
