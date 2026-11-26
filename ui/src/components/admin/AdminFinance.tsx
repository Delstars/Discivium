import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import {
  formatAedFromFils,
  formatIsoDateTimeUae,
  parseAedToFils,
} from '../../lib/formatters';
import {
  EmptyState,
  ErrorBanner,
  Field,
  Modal,
  PageHeader,
  SectionCard,
  StatTile,
  StatusBadge,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
} from '../ui/Primitives';

export function AdminFinance() {
  const { state, executeAction } = useApp();
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [query, setQuery] = useState('');

  const [issueOpen, setIssueOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [aedAmount, setAedAmount] = useState('1500.00');
  const [dueDate, setDueDate] = useState('2026-12-20');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state) return null;
  const invoices = state.finance ?? [];
  const students = useMemo(
    () => (state.governance?.people ?? []).filter((p) => p.role === 'student'),
    [state.governance?.people]
  );

  const totals = useMemo(() => {
    let unpaid = 0;
    let paid = 0;
    for (const inv of invoices) {
      if (inv.status === 'paid') paid += inv.amount_fils;
      else unpaid += inv.amount_fils;
    }
    return { unpaid, paid, total: unpaid + paid };
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (!q) return true;
      return (
        inv.student_name.toLowerCase().includes(q) ||
        inv.title.toLowerCase().includes(q) ||
        String(inv.id).includes(q)
      );
    });
  }, [invoices, statusFilter, query]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    const fils = parseAedToFils(aedAmount);
    if (!studentId || !title.trim() || !dueDate.trim()) {
      setError('Complete student, invoice description, and due date (YYYY-MM-DD).');
      return;
    }
    if (fils === null) {
      setError('Enter a valid positive AED amount (up to 2 decimal places).');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await executeAction(
        'invoice',
        {
          student_id: Number(studentId),
          title: title.trim(),
          amount_fils: fils,
          due_date: dueDate.trim(),
        },
        `Issued fictional invoice (${formatAedFromFils(fils)}).`
      );
      setTitle('');
      setIssueOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to issue invoice.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Campus Operations · Fictional Local Ledger"
        title="Invoices & Payment Ledger"
        description="Institution-wide student billing records in UAE Dirhams (AED). All balances and settlements are local coursework simulations—no real money moves."
        actions={
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStudentId(students[0] ? String(students[0].id) : '');
              setIssueOpen(true);
            }}
            className={primaryBtnClass}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Issue Demo Invoice
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="Total Billed (Demo)"
          value={formatAedFromFils(totals.total)}
          detail={`${invoices.length} invoice(s) on ledger`}
        />
        <StatTile
          label="Settled (Simulated)"
          value={formatAedFromFils(totals.paid)}
          detail={`${invoices.filter((i) => i.status === 'paid').length} paid receipt(s)`}
          tone="teal"
        />
        <StatTile
          label="Outstanding Balance"
          value={formatAedFromFils(totals.unpaid)}
          detail={`${invoices.filter((i) => i.status === 'unpaid').length} unpaid invoice(s)`}
          tone={totals.unpaid > 0 ? 'amber' : 'teal'}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          className="inline-flex gap-1 p-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]"
          role="group"
          aria-label="Filter invoices by status"
        >
          {(
            [
              ['all', 'All'],
              ['unpaid', 'Unpaid'],
              ['paid', 'Paid'],
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
            aria-label="Search finance ledger"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student or description…"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      <SectionCard noPadding>
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No matching invoices"
              description="Issue a fictional student invoice above or adjust filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-muted)]">
                  <th className="py-3 px-5 font-medium">Ref</th>
                  <th className="py-3 px-4 font-medium">Student</th>
                  <th className="py-3 px-4 font-medium">Description</th>
                  <th className="py-3 px-4 font-medium">Due Date</th>
                  <th className="py-3 px-4 font-medium text-right">Amount (AED)</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-5 font-medium text-right">Paid At (UAE)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[var(--surface-subtle)]/50">
                    <td className="py-3 px-5 font-mono text-xs text-[var(--ink-muted)]">
                      INV-{inv.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--ink)]">
                      {inv.student_name}
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--ink-secondary)]">
                      {inv.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums text-[var(--ink-secondary)]">
                      {inv.due_date}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold tabular-nums text-right">
                      {formatAedFromFils(inv.amount_fils)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge variant={inv.status === 'paid' ? 'success' : 'warning'}>
                        {inv.status === 'paid' ? `Paid (#${inv.payment_id})` : 'Unpaid'}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-5 font-mono text-xs tabular-nums text-right text-[var(--ink-muted)] whitespace-nowrap">
                      {inv.paid_at ? formatIsoDateTimeUae(inv.paid_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Modal
        open={issueOpen}
        onClose={() => {
          if (!busy) setIssueOpen(false);
        }}
        title="Issue Fictional Student Invoice"
        subtitle="Local demonstration billing entry only. Amount is converted to exact integer fils."
        size="sm"
      >
        <form onSubmit={handleIssue} className="space-y-4">
          {error && <ErrorBanner message={error} />}
          <Field id="inv-student" label="Student" required>
            <select
              id="inv-student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={inputClass}
              disabled={busy}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (@{s.username})
                </option>
              ))}
            </select>
          </Field>
          <Field id="inv-title" label="Invoice Title" required>
            <input
              id="inv-title"
              type="text"
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fall 2026 Studio Lab Fee"
              className={inputClass}
              disabled={busy}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="inv-aed" label="Amount (AED)" required>
              <input
                id="inv-aed"
                type="text"
                inputMode="decimal"
                value={aedAmount}
                onChange={(e) => setAedAmount(e.target.value)}
                placeholder="1500.00"
                className={`${inputClass} font-mono tabular-nums`}
                disabled={busy}
              />
            </Field>
            <Field id="inv-due" label="Due Date" required>
              <input
                id="inv-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`${inputClass} font-mono`}
                disabled={busy}
              />
            </Field>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)]">
            Local demo disclaimer: This ledger is fictional and never initiates real billing or
            payment processing.
          </p>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setIssueOpen(false)}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={busy} className={primaryBtnClass}>
              {busy ? 'Issuing…' : 'Issue Invoice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
