import { useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Receipt } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import type { InvoiceItem } from '../../types/api';
import { formatAedFromFils, formatIsoDateTimeUae } from '../../lib/formatters';
import {
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  SectionCard,
  StatTile,
  StatusBadge,
  primaryBtnClass,
  secondaryBtnClass,
} from '../ui/Primitives';

export function StudentFinance() {
  const { state, executeAction } = useApp();
  const [payingInvoice, setPayingInvoice] = useState<InvoiceItem | null>(null);
  const [receiptInvoice, setReceiptInvoice] = useState<InvoiceItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  if (!state) return null;
  const invoices = state.finance ?? [];

  const totals = useMemo(() => {
    let totalFils = 0;
    let unpaidFils = 0;
    let paidFils = 0;
    for (const inv of invoices) {
      totalFils += inv.amount_fils;
      if (inv.status === 'paid') paidFils += inv.amount_fils;
      else unpaidFils += inv.amount_fils;
    }
    return { totalFils, unpaidFils, paidFils };
  }, [invoices]);

  const handleConfirmPay = async () => {
    if (!payingInvoice) return;
    setPayError(null);
    setBusy(true);
    try {
      await executeAction(
        'pay',
        { invoice_id: payingInvoice.id },
        `Simulated payment recorded for "${payingInvoice.title}".`
      );
      setPayingInvoice(null);
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'Unable to settle demo invoice.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student Finance · Simulated Local Ledger (AED)"
        title="Tuition & Fee Invoices"
        description="All balances are represented in UAE Dirhams (AED) from integer fils in the local SQLite demo ledger. No real payment network or financial clearing occurs."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="Unpaid Balance"
          value={formatAedFromFils(totals.unpaidFils)}
          detail={`${invoices.filter((i) => i.status === 'unpaid').length} open invoice(s)`}
          tone={totals.unpaidFils > 0 ? 'amber' : 'teal'}
        />
        <StatTile
          label="Settled Total"
          value={formatAedFromFils(totals.paidFils)}
          detail={`${invoices.filter((i) => i.status === 'paid').length} paid receipt(s)`}
          tone="teal"
        />
        <StatTile
          label="Total Billed (Demo)"
          value={formatAedFromFils(totals.totalFils)}
          detail={`${invoices.length} invoice(s) on ledger`}
        />
      </div>

      <SectionCard
        title="Invoice Ledger"
        subtitle="Settle an unpaid demo invoice in full or view recorded simulated payment receipts."
        noPadding
      >
        {invoices.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No invoices on your ledger"
              description="Invoices issued by the campus administrator will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-muted)]">
                  <th className="py-3 px-5 font-medium">Invoice #</th>
                  <th className="py-3 px-4 font-medium">Description</th>
                  <th className="py-3 px-4 font-medium">Due Date</th>
                  <th className="py-3 px-4 font-medium text-right">Amount (AED)</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[var(--surface-subtle)]/50">
                    <td className="py-3.5 px-5 font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                      INV-{inv.id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[var(--ink)]">{inv.title}</td>
                    <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-[var(--ink-secondary)] whitespace-nowrap">
                      {inv.due_date}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold tabular-nums text-right text-[var(--ink)] whitespace-nowrap">
                      {formatAedFromFils(inv.amount_fils)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {inv.status === 'paid' ? (
                        <StatusBadge variant="success">Paid</StatusBadge>
                      ) : (
                        <StatusBadge variant="warning">Unpaid</StatusBadge>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      {inv.status === 'unpaid' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPayError(null);
                            setPayingInvoice(inv);
                          }}
                          className={primaryBtnClass}
                        >
                          <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                          Simulate Pay
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReceiptInvoice(inv)}
                          className={secondaryBtnClass}
                        >
                          <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
                          View Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Simulated Payment Confirmation Dialog with Local Demo Disclaimer */}
      <ConfirmDialog
        open={payingInvoice !== null}
        onClose={() => {
          if (!busy) setPayingInvoice(null);
        }}
        onConfirm={handleConfirmPay}
        title="Confirm Simulated Invoice Settlement"
        description={
          payingInvoice
            ? `Record full settlement of ${formatAedFromFils(payingInvoice.amount_fils)} for "${payingInvoice.title}" (INV-${payingInvoice.id})?`
            : ''
        }
        note="Local coursework demo disclaimer: This action records a simulated payment entry in SQLite only. No real currency, card processing, or external banking transaction occurs."
        confirmLabel="Confirm Simulated Payment"
        busy={busy}
        error={payError}
      />

      {/* Simulated Receipt Modal */}
      <Modal
        open={receiptInvoice !== null}
        onClose={() => setReceiptInvoice(null)}
        title="Simulated Payment Receipt"
        subtitle="Local demonstration ledger record — not a commercial tax invoice"
        size="sm"
      >
        {receiptInvoice && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2 text-[var(--teal)] font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Settled in full on local ledger</span>
            </div>
            <dl className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg text-xs">
              <div className="px-3.5 py-2.5 flex justify-between gap-4">
                <dt className="text-[var(--ink-muted)]">Invoice Reference</dt>
                <dd className="font-mono font-semibold">INV-{receiptInvoice.id}</dd>
              </div>
              <div className="px-3.5 py-2.5 flex justify-between gap-4">
                <dt className="text-[var(--ink-muted)]">Payment ID</dt>
                <dd className="font-mono font-semibold">
                  {receiptInvoice.payment_id ? `PAY-${receiptInvoice.payment_id}` : '—'}
                </dd>
              </div>
              <div className="px-3.5 py-2.5 flex justify-between gap-4">
                <dt className="text-[var(--ink-muted)]">Student</dt>
                <dd className="font-medium">{receiptInvoice.student_name}</dd>
              </div>
              <div className="px-3.5 py-2.5 flex justify-between gap-4">
                <dt className="text-[var(--ink-muted)]">Description</dt>
                <dd className="text-right">{receiptInvoice.title}</dd>
              </div>
              <div className="px-3.5 py-2.5 flex justify-between gap-4">
                <dt className="text-[var(--ink-muted)]">Amount Settled</dt>
                <dd className="font-mono font-semibold tabular-nums">
                  {formatAedFromFils(receiptInvoice.amount_fils)}
                </dd>
              </div>
              <div className="px-3.5 py-2.5 flex justify-between gap-4">
                <dt className="text-[var(--ink-muted)]">Recorded At (UAE)</dt>
                <dd className="font-mono tabular-nums">
                  {formatIsoDateTimeUae(receiptInvoice.paid_at)}
                </dd>
              </div>
            </dl>
            <p className="text-[11px] text-[var(--ink-muted)]">
              Simulated payment record created for Discivium local academic coursework testing.
              No real funds were transferred.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setReceiptInvoice(null)}
                className={primaryBtnClass}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
