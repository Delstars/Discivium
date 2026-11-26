import React, { useMemo, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import type { UserRole } from '../../types/api';
import { formatRoleLabel } from '../../lib/formatters';
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

export function AdminDirectory() {
  const { state, executeAction } = useApp();
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [query, setQuery] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state) return null;
  const people = state.governance?.people ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => {
      if (roleFilter !== 'all' && p.role !== roleFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        String(p.id).includes(q)
      );
    });
  }, [people, roleFilter, query]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      setError('Enter both a username and full name.');
      return;
    }
    if (password.length < 10 || password.length > 128) {
      setError('Demo password must be between 10 and 128 characters.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await executeAction(
        'user',
        {
          username: username.trim().toLowerCase(),
          name: fullName.trim(),
          role,
          password,
        },
        `Created fictional ${formatRoleLabel(role).toLowerCase()} account @${username.trim().toLowerCase()}.`
      );
      setUsername('');
      setFullName('');
      setPassword('');
      setRole('student');
      setCreateOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create demo account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance · Identity Directory"
        title="User Directory & Demo Accounts"
        description="Inspect fictional university accounts and create new local demonstration accounts. Passwords, hashes, and salts are never exposed in read views."
        actions={
          <button
            type="button"
            onClick={() => {
              setError(null);
              setCreateOpen(true);
            }}
            className={primaryBtnClass}
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            Create Demo Account
          </button>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]"
          role="group"
          aria-label="Filter users by role"
        >
          {(
            [
              ['all', 'All Roles'],
              ['student', 'Students'],
              ['lecturer', 'Lecturers'],
              ['advisor', 'Advisors'],
              ['admin', 'Administrators'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRoleFilter(id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                roleFilter === id
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
            aria-label="Search user directory"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or username…"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      <SectionCard noPadding>
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No matching accounts"
              description="Try clearing the role filter or search query."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-muted)]">
                  <th className="py-3 px-5 font-medium">ID</th>
                  <th className="py-3 px-4 font-medium">Full Name</th>
                  <th className="py-3 px-4 font-medium">Username</th>
                  <th className="py-3 px-5 font-medium text-right">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {filtered.map((person) => (
                  <tr key={person.id} className="hover:bg-[var(--surface-subtle)]/50">
                    <td className="py-3 px-5 font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                      #{person.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--ink)]">{person.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-[var(--ink-secondary)]">
                      @{person.username}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <StatusBadge
                        variant={
                          person.role === 'admin'
                            ? 'accent'
                            : person.role === 'lecturer'
                              ? 'success'
                              : person.role === 'advisor'
                                ? 'warning'
                                : 'neutral'
                        }
                      >
                        {formatRoleLabel(person.role)}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Modal
        open={createOpen}
        onClose={() => {
          if (!busy) setCreateOpen(false);
        }}
        title="Create Fictional Demo Account"
        subtitle="Creates a local PBKDF2-hashed account in SQLite. Never enter real personal credentials."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {error && <ErrorBanner message={error} />}

          <Field
            id="new-user-username"
            label="Username"
            hint="ASCII letters, numbers, hyphens, or underscores only."
            required
          >
            <input
              id="new-user-username"
              type="text"
              maxLength={50}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. student_nadia"
              className={`${inputClass} font-mono`}
              disabled={busy}
            />
          </Field>

          <Field id="new-user-name" label="Display Name" required>
            <input
              id="new-user-name"
              type="text"
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Nadia Al-Mansoor"
              className={inputClass}
              disabled={busy}
            />
          </Field>

          <Field id="new-user-role" label="Account Role" required>
            <select
              id="new-user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={inputClass}
              disabled={busy}
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="advisor">Academic Advisor</option>
              <option value="admin">Administrator</option>
            </select>
          </Field>

          <Field
            id="new-user-password"
            label="Demo Password (10–128 characters)"
            hint="Cleared immediately after submission and never shown in read views."
            required
          >
            <input
              id="new-user-password"
              type="password"
              minLength={10}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 10 characters"
              className={inputClass}
              disabled={busy}
            />
          </Field>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setCreateOpen(false)}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={busy} className={primaryBtnClass}>
              {busy ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
