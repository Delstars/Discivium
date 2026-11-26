import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Moon, Sun, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import type { UserRole } from '../../types/api';
import { DisciviumMark } from '../ui/DisciviumMark';
import {
  ErrorBanner,
  Field,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
} from '../ui/Primitives';

const FICTIONAL_ACCOUNTS: Array<{
  username: string;
  name: string;
  role: string;
  scope: string;
}> = [
  { username: 'student', name: 'Alex Chen', role: 'Student', scope: 'Enrolled in BCS305' },
  {
    username: 'other',
    name: 'Jordan Reed',
    role: 'Student',
    scope: 'Enrolled in BCS306 (isolation test)',
  },
  { username: 'lecturer', name: 'Dr. Morgan', role: 'Lecturer', scope: 'BCS305 assigned faculty' },
  { username: 'lecturer2', name: 'Dr. Lee', role: 'Lecturer', scope: 'BCS306 assigned faculty' },
  { username: 'admin', name: 'Campus Registrar', role: 'Administrator', scope: 'Governance & ledger' },
  { username: 'advisor', name: 'Dr. Rivera', role: 'Advisor', scope: 'Consent-gated advising' },
];

export function LoginScreen() {
  const {
    signIn,
    connectionError,
    sessionNotice,
    theme,
    toggleTheme,
    enterDesignPreview,
  } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setFormError('Enter both username and password to authenticate.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await signIn(username, password);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('Authentication failed. Verify the backend server and credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const prefillUsername = (u: string) => {
    setUsername(u);
    setPassword('DemoOnly!2026');
    setFormError(null);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--canvas)] text-[var(--ink)]">
      {/* Left Institutional Panel */}
      <aside className="lg:w-[44%] xl:w-[42%] bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[var(--sidebar-border)]">
        <div className="flex items-center justify-between">
          <DisciviumMark tone="light" />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="p-2 rounded-lg text-[var(--sidebar-muted)] hover:text-white hover:bg-[var(--sidebar-surface)]"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="py-10 lg:py-0 space-y-5 max-w-md">
          <p className="text-xs font-mono text-[#2DD4BF]">
            UAE Academic Operating System · Fall 2026
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight">
            Unified coursework, registration, records, and campus governance.
          </h1>
          <p className="text-sm text-[var(--sidebar-muted)] leading-relaxed">
            Discivium is a fictional independent UAE university platform built for Software
            Architecture coursework. Every permission, grade calculation, seat allocation, and
            advising consent boundary is enforced server-side.
          </p>
        </div>

        <div className="space-y-3 border-t border-[var(--sidebar-border)] pt-6 text-xs text-[var(--sidebar-muted)]">
          <p className="font-medium text-white">Local Demo Accounts (Password: DemoOnly!2026)</p>
          <p className="leading-relaxed">
            No client-side role switcher exists. Sign in with any fictional account below—clicking a
            row fills the login form for live authentication via{' '}
            <code className="text-slate-200">POST /api/login</code>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
            {FICTIONAL_ACCOUNTS.map((acct) => (
              <button
                key={acct.username}
                type="button"
                onClick={() => prefillUsername(acct.username)}
                className="text-left px-3 py-2 rounded-lg bg-[var(--sidebar-surface)]/75 hover:bg-[var(--sidebar-surface)] border border-[var(--sidebar-border)] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-white font-semibold">
                    {acct.username}
                  </span>
                  <span className="text-[11px] text-[#2DD4BF]">{acct.role}</span>
                </div>
                <p className="text-[11px] text-[var(--sidebar-muted)] truncate mt-0.5">
                  {acct.name} · {acct.scope}
                </p>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Right Authentication Form */}
      <main className="flex-1 flex flex-col justify-between p-6 sm:p-12">
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--ink)]">
              Sign in to Discivium
            </h2>
            <p className="text-sm text-[var(--ink-secondary)]">
              Authenticate with your university username to load your role-scoped workspace.
            </p>
          </div>

          {sessionNotice && (
            <ErrorBanner title="Session notice" message={sessionNotice} />
          )}

          {connectionError && (
            <ErrorBanner title="Backend unreachable" message={connectionError} />
          )}

          {formError && <ErrorBanner title="Authentication error" message={formError} />}

          <form
            onSubmit={handleSubmit}
            className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4"
            noValidate
          >
            <Field id="login-username" label="Username" required>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. student, lecturer, admin, advisor"
                className={inputClass}
                disabled={submitting}
              />
            </Field>

            <Field id="login-password" label="Password" required>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className={`${inputClass} pr-10`}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className={`${primaryBtnClass} w-full py-2.5 text-sm`}
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              {submitting ? 'Authenticating…' : 'Sign In'}
            </button>

            <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
              Session cookies are HttpOnly and SameSite=Strict. Passwords and tokens are never
              stored in browser storage.
            </p>
          </form>

          {/* Opt-in Design Preview Mode (Explicitly disabled by default, never silent) */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]/50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[var(--ink)]">
                  Offline Design Preview Mode
                </p>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Disabled by default. Opt in only if viewing layouts without the Python backend.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewDrawer((v) => !v)}
                aria-expanded={showPreviewDrawer}
                className={secondaryBtnClass}
              >
                {showPreviewDrawer ? 'Hide' : 'Preview Options'}
              </button>
            </div>

            {showPreviewDrawer && (
              <div className="pt-2 border-t border-[var(--border)] space-y-2.5">
                <div className="flex items-start gap-2 text-[11px] text-[var(--amber)]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Read-only fixture preview. All live mutations, uploads, and downloads remain
                    disabled until signed in against the Python backend.
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['student', 'Student Preview'],
                      ['lecturer', 'Lecturer Preview'],
                      ['admin', 'Admin Preview'],
                      ['advisor', 'Advisor Preview'],
                    ] as Array<[UserRole, string]>
                  ).map(([roleKey, label]) => (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => enterDesignPreview(roleKey)}
                      className={secondaryBtnClass}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="pt-8 text-center text-[11px] text-[var(--ink-muted)]">
          Local coursework demonstration only · Not an official university portal · All demo
          accounts and balances are fictional.
        </footer>
      </main>
    </div>
  );
}
