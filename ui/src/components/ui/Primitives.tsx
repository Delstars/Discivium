import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--border)] pb-5">
      <div className="space-y-1 min-w-0">
        {eyebrow && (
          <p className="text-xs font-medium text-[var(--ink-muted)]">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl sm:text-[28px] font-semibold text-[var(--ink)] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[var(--ink-secondary)] max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>
      )}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  noPadding = false,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <section
      className={`rounded-xl bg-[var(--surface)] border border-[var(--border)] ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-lg font-semibold text-[var(--ink)] leading-snug">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </section>
  );
}

export function StatTile({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: 'neutral' | 'accent' | 'teal' | 'amber' | 'danger';
}) {
  const toneClass =
    tone === 'accent'
      ? 'text-[var(--accent)]'
      : tone === 'teal'
        ? 'text-[var(--teal)]'
        : tone === 'amber'
          ? 'text-[var(--amber)]'
          : tone === 'danger'
            ? 'text-[var(--danger)]'
            : 'text-[var(--ink)]';

  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5 flex flex-col justify-between gap-2">
      <p className="text-xs font-medium text-[var(--ink-muted)]">{label}</p>
      <p className={`font-mono text-2xl font-semibold tabular-nums tracking-tight ${toneClass}`}>
        {value}
      </p>
      {detail && <p className="text-xs text-[var(--ink-secondary)] leading-snug">{detail}</p>}
    </div>
  );
}

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

export function StatusBadge({
  variant = 'neutral',
  children,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
}) {
  const styles: Record<BadgeVariant, string> = {
    neutral: 'bg-[var(--surface-subtle)] text-[var(--ink-secondary)] border-[var(--border)]',
    success: 'bg-[var(--teal-soft)] text-[var(--teal)] border-transparent',
    warning: 'bg-[var(--amber-soft)] text-[var(--amber)] border-transparent',
    danger: 'bg-[var(--danger-soft)] text-[var(--danger)] border-transparent',
    accent: 'bg-[var(--accent-soft)] text-[var(--accent)] border-transparent',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-10 px-6 text-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)]/45">
      <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
      <p className="text-xs text-[var(--ink-secondary)] mt-1.5 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorBanner({
  message,
  onDismiss,
  title = 'Server response',
}: {
  message: string;
  onDismiss?: () => void;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)] flex items-start gap-3"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs">{title}</p>
        <p className="text-xs mt-0.5 leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error message"
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function ToastBanner({
  kind,
  text,
  onDismiss,
}: {
  kind: 'success' | 'error' | 'info';
  text: string;
  onDismiss: () => void;
}) {
  const Icon =
    kind === 'success' ? CheckCircle2 : kind === 'error' ? AlertCircle : Info;
  const palette =
    kind === 'success'
      ? 'bg-[var(--surface)] border-[var(--teal)]/40 text-[var(--ink)]'
      : kind === 'error'
        ? 'bg-[var(--surface)] border-[var(--danger)]/40 text-[var(--ink)]'
        : 'bg-[var(--surface)] border-[var(--accent)]/40 text-[var(--ink)]';
  const iconTone =
    kind === 'success'
      ? 'text-[var(--teal)]'
      : kind === 'error'
        ? 'text-[var(--danger)]'
        : 'text-[var(--accent)]';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] rounded-xl border shadow-lg px-4 py-3 flex items-start gap-3 ${palette}`}
    >
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconTone}`} aria-hidden="true" />
      <p className="text-xs leading-relaxed flex-1">{text}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Close notification"
        className="p-1 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink)]"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const widthClass =
    size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${widthClass} max-h-[90vh] flex flex-col rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden`}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--border)]">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-[var(--ink)]">{title}</h2>
            {subtitle && (
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  destructive = false,
  busy = false,
  note,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  note?: string;
  error?: string | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">{description}</p>
        {note && (
          <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] px-3.5 py-2.5 text-xs text-[var(--ink-secondary)]">
            {note}
          </div>
        )}
        {error && <ErrorBanner message={error} />}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
              destructive
                ? 'bg-[var(--danger)] hover:opacity-90'
                : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]'
            }`}
          >
            {busy ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-[var(--ink)]">
        {label}
        {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-[var(--ink-muted)]">{hint}</p>}
    </div>
  );
}

export const inputClass =
  'w-full rounded-lg bg-[var(--surface)] border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none disabled:opacity-55';

export const primaryBtnClass =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors whitespace-nowrap shrink-0 disabled:opacity-50';

export const secondaryBtnClass =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors whitespace-nowrap shrink-0 disabled:opacity-50';

export const dangerBtnClass =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--danger)] text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 disabled:opacity-50';

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading records">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-lg bg-[var(--surface-subtle)] animate-pulse border border-[var(--border)]"
        />
      ))}
    </div>
  );
}
