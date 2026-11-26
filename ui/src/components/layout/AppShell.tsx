import React, { useMemo, useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FileSpreadsheet,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Sun,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { UserRole } from '../../types/api';
import { formatIsoDateTimeUae, formatRoleLabel } from '../../lib/formatters';
import { DisciviumMark } from '../ui/DisciviumMark';
import { StatusBadge, ToastBanner } from '../ui/Primitives';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    state,
    route,
    navigate,
    theme,
    toggleTheme,
    sidebarCollapsed,
    setSidebarCollapsed,
    signOut,
    refreshState,
    refreshing,
    executeAction,
    previewRole,
    exitDesignPreview,
    toast,
    dismissToast,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);

  if (!state) return null;

  const { user, notifications, semester } = state;
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const navGroups = useMemo<NavGroup[]>(() => {
    const role: UserRole = user.role;
    if (role === 'student') {
      const pendingInvoices = (state.finance ?? []).filter((f) => f.status === 'unpaid').length;
      return [
        {
          heading: 'Academics',
          items: [
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'courses', label: 'My Courses', icon: BookOpen },
            { id: 'assignments', label: 'Assignments', icon: FileCheck2 },
            { id: 'registration', label: 'Registration', icon: ClipboardCheck },
            { id: 'timetable', label: 'Timetable', icon: CalendarDays },
            { id: 'attendance', label: 'Attendance', icon: Check },
          ],
        },
        {
          heading: 'Record & Campus',
          items: [
            { id: 'record', label: 'Scholar Passport', icon: Award },
            {
              id: 'finance',
              label: 'Student Finance',
              icon: Wallet,
              badge: pendingInvoices > 0 ? pendingInvoices : undefined,
            },
            { id: 'services', label: 'Campus Services', icon: Building2 },
            { id: 'advising', label: 'Advising Consent', icon: HeartHandshake },
          ],
        },
      ];
    }

    if (role === 'lecturer') {
      const ungradedCount = (state.courses ?? []).reduce(
        (acc, c) =>
          acc +
          c.assignments.reduce(
            (subAcc, a) =>
              subAcc + a.submissions.filter((s) => s.status !== 'graded').length,
            0
          ),
        0
      );
      return [
        {
          heading: 'Teaching',
          items: [
            { id: 'overview', label: 'Teaching Overview', icon: LayoutDashboard },
            { id: 'courses', label: 'Assigned Courses', icon: BookOpen },
            {
              id: 'submissions',
              label: 'Submission Queue',
              icon: FileCheck2,
              badge: ungradedCount > 0 ? ungradedCount : undefined,
            },
            { id: 'timetable', label: 'Weekly Timetable', icon: CalendarDays },
          ],
        },
      ];
    }

    if (role === 'admin') {
      const openRequests = (state.requests ?? []).filter(
        (r) => r.status === 'pending' || r.status === 'in_review'
      ).length;
      return [
        {
          heading: 'Governance',
          items: [
            { id: 'overview', label: 'Campus Overview', icon: LayoutDashboard },
            { id: 'directory', label: 'User Directory', icon: Users },
            { id: 'academics', label: 'Academic Setup', icon: BookOpen },
          ],
        },
        {
          heading: 'Operations',
          items: [
            { id: 'finance', label: 'Finance Ledger', icon: FileSpreadsheet },
            {
              id: 'requests',
              label: 'Service Requests',
              icon: Building2,
              badge: openRequests > 0 ? openRequests : undefined,
            },
            { id: 'audit', label: 'Audit History', icon: ScrollText },
          ],
        },
      ];
    }

    return [
      {
        heading: 'Advising',
        items: [{ id: 'overview', label: 'Assigned Students', icon: HeartHandshake }],
      },
    ];
  }, [user.role, state.finance, state.courses, state.requests]);

  const activeNavId = route.section === 'course' ? 'courses' : route.section;

  const breadcrumbTrail = useMemo(() => {
    const roleRoot = `${formatRoleLabel(user.role)} Portal`;
    if (route.section === 'course' && route.courseId) {
      const course = (state.courses ?? []).find((c) => c.id === route.courseId);
      return [
        roleRoot,
        user.role === 'lecturer' ? 'Assigned Courses' : 'My Courses',
        course ? `${course.code} — ${course.title}` : `Course #${route.courseId}`,
      ];
    }
    for (const group of navGroups) {
      const found = group.items.find((i) => i.id === activeNavId);
      if (found) return [roleRoot, found.label];
    }
    return [roleRoot, 'Overview'];
  }, [user.role, route, state.courses, navGroups, activeNavId]);

  const handleMarkRead = async (notificationId: number) => {
    setMarkingId(notificationId);
    try {
      await executeAction('notification-read', { notification_id: notificationId });
    } catch {
      // Error surfaced via toast/state.
    } finally {
      setMarkingId(null);
    }
  };

  const renderNavLinks = (isMobile = false) => (
    <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {navGroups.map((group) => (
        <div key={group.heading} className="space-y-1">
          {(!sidebarCollapsed || isMobile) && (
            <p className="px-2.5 text-[11px] font-medium text-[var(--sidebar-muted)] tracking-wide">
              {group.heading}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeNavId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={sidebarCollapsed && !isMobile ? item.label : undefined}
                  onClick={() => {
                    navigate(item.id);
                    if (isMobile) setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--sidebar-surface)] text-white'
                      : 'text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-surface)]/60 hover:text-[var(--sidebar-text)]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#2DD4BF]' : 'text-[var(--sidebar-muted)]'
                    }`}
                  />
                  {(!sidebarCollapsed || isMobile) && (
                    <>
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="font-mono text-[11px] tabular-nums px-1.5 py-0.5 rounded bg-white/10 text-white">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-[var(--canvas)] text-[var(--ink)]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] border-r border-[var(--sidebar-border)] transition-[width] duration-200 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[252px]'
        }`}
      >
        <div className="h-15 px-4 flex items-center justify-between border-b border-[var(--sidebar-border)]">
          <button
            type="button"
            onClick={() => navigate('overview')}
            aria-label="Go to Discivium overview"
            className="flex items-center"
          >
            <DisciviumMark compact={sidebarCollapsed} tone="light" />
          </button>
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              aria-label="Collapse navigation sidebar"
              title="Collapse sidebar"
              className="p-1.5 rounded-md text-[var(--sidebar-muted)] hover:text-white hover:bg-[var(--sidebar-surface)]"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {sidebarCollapsed && (
          <div className="px-3 pt-3 flex justify-center">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              aria-label="Expand navigation sidebar"
              title="Expand sidebar"
              className="p-2 rounded-md text-[var(--sidebar-muted)] hover:text-white hover:bg-[var(--sidebar-surface)]"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {renderNavLinks(false)}

        <div className="p-3 border-t border-[var(--sidebar-border)]">
          <div
            className={`flex items-center gap-2.5 px-2 py-2 rounded-lg bg-[var(--sidebar-surface)]/70 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/25 flex items-center justify-center font-mono text-xs font-semibold shrink-0">
              {user.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-[var(--sidebar-muted)] truncate">
                  {formatRoleLabel(user.role)} · @{user.username}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-slate-950/60"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div className="w-72 max-w-[85vw] bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex flex-col h-full shadow-2xl">
            <div className="h-15 px-4 flex items-center justify-between border-b border-[var(--sidebar-border)]">
              <DisciviumMark tone="light" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-md text-[var(--sidebar-muted)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderNavLinks(true)}
            <div className="p-4 border-t border-[var(--sidebar-border)] text-xs text-[var(--sidebar-muted)]">
              <p className="text-white font-medium">{user.name}</p>
              <p className="mt-0.5">
                {formatRoleLabel(user.role)} · {semester}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Opt-in Design Preview Mode Banner */}
        {previewRole && (
          <div className="bg-[var(--amber-soft)] border-b border-[var(--amber)]/30 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--amber)]">
            <p className="font-medium">
              Design Preview Mode (Offline Read-Only Fixtures) — Mutations and live downloads
              require the Python backend.
            </p>
            <button
              type="button"
              onClick={exitDesignPreview}
              className="px-2.5 py-1 rounded-md bg-[var(--amber)] text-white font-semibold hover:opacity-90"
            >
              Exit Preview &amp; Sign In Live
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="sticky top-0 z-30 h-15 bg-[var(--surface)]/95 border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs min-w-0">
              {breadcrumbTrail.map((crumb, idx) => (
                <React.Fragment key={`${crumb}-${idx}`}>
                  {idx > 0 && (
                    <ChevronRight
                      className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={
                      idx === breadcrumbTrail.length - 1
                        ? 'font-semibold text-[var(--ink)] truncate'
                        : 'text-[var(--ink-muted)] hidden sm:inline whitespace-nowrap'
                    }
                  >
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline text-xs text-[var(--ink-muted)] pr-2">
              {semester}
            </span>

            <button
              type="button"
              onClick={() => refreshState()}
              disabled={refreshing}
              aria-label="Refresh server state"
              title="Refresh data from server"
              className="p-2 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              className="p-2 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setAccountOpen(false);
                }}
                aria-label={`Notifications (${unreadCount} unread)`}
                aria-expanded={notifOpen}
                className="relative p-2 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--accent)] text-white font-mono text-[10px] font-semibold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  role="region"
                  aria-label="Notifications tray"
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden z-40"
                >
                  <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--ink)]">
                      Notifications ({unreadCount} unread)
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      aria-label="Close notifications"
                      className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
                    {notifications.length === 0 ? (
                      <p className="p-5 text-xs text-[var(--ink-muted)] text-center">
                        No notifications have been recorded for this account yet.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 text-xs space-y-1.5 ${
                            n.read_at ? 'opacity-70' : 'bg-[var(--accent-soft)]/35'
                          }`}
                        >
                          <p className="text-[var(--ink)] leading-relaxed">{n.message}</p>
                          <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--ink-muted)]">
                            <span className="font-mono tabular-nums">
                              {formatIsoDateTimeUae(n.created_at)}
                            </span>
                            {!n.read_at ? (
                              <button
                                type="button"
                                disabled={markingId === n.id}
                                onClick={() => handleMarkRead(n.id)}
                                className="font-medium text-[var(--accent)] hover:underline disabled:opacity-50"
                              >
                                {markingId === n.id ? 'Saving…' : 'Mark read'}
                              </button>
                            ) : (
                              <span>Read</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Account Menu (No role-switch dropdown; sign out to authenticate as another account) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAccountOpen((v) => !v);
                  setNotifOpen(false);
                }}
                aria-label="Account menu"
                aria-expanded={accountOpen}
                className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-subtle)] text-xs font-medium text-[var(--ink)]"
              >
                <span className="hidden sm:inline max-w-[140px] truncate">{user.name}</span>
                <StatusBadge variant="accent">{formatRoleLabel(user.role)}</StatusBadge>
              </button>

              {accountOpen && (
                <div
                  role="menu"
                  aria-label="Account options"
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl p-3 space-y-3 z-40"
                >
                  <div className="px-2 py-1 space-y-0.5 border-b border-[var(--border)] pb-2.5">
                    <p className="text-xs font-semibold text-[var(--ink)]">{user.name}</p>
                    <p className="text-[11px] text-[var(--ink-muted)] font-mono">
                      @{user.username} · ID #{user.id}
                    </p>
                    <p className="text-[11px] text-[var(--ink-secondary)] pt-1">
                      To switch roles, sign out and authenticate as a different fictional account.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>

        {/* Discreet Local Demo Footer */}
        <footer className="border-t border-[var(--border)] px-4 sm:px-6 lg:px-8 py-3.5 text-[11px] text-[var(--ink-muted)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[var(--teal)]" aria-hidden="true" />
            <span>
              Discivium — Fictional UAE university academic system (local Software Architecture
              coursework demonstration; not an official university service or financial processor).
            </span>
          </div>
          <span className="font-mono whitespace-nowrap">
            {previewRole ? 'Offline Design Preview' : 'Same-Origin Session · UAE GST (UTC+4)'}
          </span>
        </footer>
      </div>

      {toast && <ToastBanner kind={toast.kind} text={toast.text} onDismiss={dismissToast} />}
    </div>
  );
}
