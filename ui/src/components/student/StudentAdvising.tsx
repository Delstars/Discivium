import { useState } from 'react';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import type { StudentAdvisorLink } from '../../types/api';
import { asBoolean, formatIsoDateTimeUae } from '../../lib/formatters';
import {
  ConfirmDialog,
  EmptyState,
  PageHeader,
  SectionCard,
  StatusBadge,
  primaryBtnClass,
  secondaryBtnClass,
} from '../ui/Primitives';

export function StudentAdvising() {
  const { state, executeAction } = useApp();
  const [target, setTarget] = useState<{
    advisor: StudentAdvisorLink;
    nextEnabled: 0 | 1;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state) return null;
  const advising = state.advising ?? { advisors: [], notes: [] };

  const handleConfirmConsent = async () => {
    if (!target) return;
    setError(null);
    setBusy(true);
    try {
      await executeAction(
        'consent',
        { advisor_id: target.advisor.id, enabled: target.nextEnabled },
        target.nextEnabled === 1
          ? `Granted advising access to ${target.advisor.name}.`
          : `Revoked advising access for ${target.advisor.name}.`
      );
      setTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update consent setting.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Privacy & Academic Support"
        title="Advising Consent & Shared Notes"
        description="Advisors can view your released academic record, attendance, and deterministic threshold flags only while you explicitly grant consent. Finance records are never shared with advisors."
      />

      <SectionCard
        title="Assigned Academic Advisors"
        subtitle="Consent is enforced server-side. Revoking consent immediately withholds all private academic fields from the advisor snapshot."
      >
        {advising.advisors.length === 0 ? (
          <EmptyState
            title="No advisor assigned"
            description="An academic administrator can assign an advisor to your student profile."
          />
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {advising.advisors.map((adv) => {
              const granted = asBoolean(adv.consent);
              return (
                <div
                  key={adv.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <p className="text-sm font-semibold text-[var(--ink)]">{adv.name}</p>
                      <StatusBadge variant={granted ? 'success' : 'neutral'}>
                        {granted ? 'Consent granted' : 'Access withheld'}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-[var(--ink-secondary)]">
                      {granted
                        ? 'May inspect released grades, GPA, attendance history, and post shared advising notes.'
                        : 'Cannot view your grades, GPA, attendance, or add new notes until you grant consent.'}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {granted ? (
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setTarget({ advisor: adv, nextEnabled: 0 });
                        }}
                        className={secondaryBtnClass}
                      >
                        <ShieldOff className="w-3.5 h-3.5" aria-hidden="true" />
                        Revoke Consent
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setTarget({ advisor: adv, nextEnabled: 1 });
                        }}
                        className={primaryBtnClass}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        Grant Consent
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Shared Advising Notes"
        subtitle="Notes written by your assigned advisor while consent is active are always visible to you."
      >
        {advising.notes.length === 0 ? (
          <EmptyState
            title="No advising notes yet"
            description="Shared notes recorded during advising consultations will appear here."
          />
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {advising.notes.map((n) => (
              <div key={n.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[var(--ink)]">
                    {n.advisor_name ?? `Advisor #${n.advisor_id}`}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                    {formatIsoDateTimeUae(n.created_at)}
                  </span>
                </div>
                <p className="text-sm text-[var(--ink-secondary)] whitespace-pre-wrap leading-relaxed">
                  {n.note}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={target !== null}
        onClose={() => {
          if (!busy) setTarget(null);
        }}
        onConfirm={handleConfirmConsent}
        title={
          target?.nextEnabled === 1 ? 'Grant Advising Consent' : 'Revoke Advising Consent'
        }
        description={
          target?.nextEnabled === 1
            ? `Allow ${target.advisor.name} to view your released course results, derived GPA, attendance history, and deterministic risk thresholds?`
            : `Revoke ${target?.advisor.name}'s access to your academic and attendance records? They will no longer see private fields or be able to add new notes.`
        }
        confirmLabel={target?.nextEnabled === 1 ? 'Grant Access' : 'Revoke Access'}
        destructive={target?.nextEnabled === 0}
        busy={busy}
        error={error}
      />
    </div>
  );
}
