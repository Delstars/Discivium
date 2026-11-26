import type {
  AcademicResultItem,
  ServiceRequestCategory,
  ServiceRequestStatus,
} from '../types/api';

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function weekdayName(weekday: number | null | undefined, short = false): string {
  if (weekday === null || weekday === undefined || weekday < 0 || weekday > 6) {
    return 'Unscheduled';
  }
  return short ? WEEKDAYS_SHORT[weekday] : WEEKDAYS[weekday];
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) {
    return '--:--';
  }
  const clamped = Math.max(0, Math.min(1440, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeRange(
  startMin: number | null | undefined,
  endMin: number | null | undefined
): string {
  if (startMin === null || startMin === undefined || endMin === null || endMin === undefined) {
    return 'Time TBA';
  }
  return `${formatMinutes(startMin)}–${formatMinutes(endMin)} GST`;
}

export function formatAedFromFils(fils: number): string {
  const aed = fils / 100;
  return `AED ${aed.toLocaleString('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function parseAedToFils(aedInput: string): number | null {
  const cleaned = aedInput.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return Math.round(value * 100);
}

export function formatIsoDateTimeUae(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    const formatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
    return `${formatted} UAE (UTC+4)`;
  } catch {
    return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  }
}

export function formatIsoDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  } catch {
    return iso.slice(0, 10);
  }
}

export function normalizeDueAtUae(localDateTime: string): string {
  const trimmed = localDateTime.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}+04:00`;
  }
  return trimmed;
}

export function isPastDeadline(dueIso: string, nowMs: number = Date.now()): boolean {
  const parsed = Date.parse(dueIso);
  if (Number.isNaN(parsed)) return false;
  return nowMs > parsed;
}

export function formatGpa(gpa: number | null | undefined): string {
  if (gpa === null || gpa === undefined) return 'Not yet released';
  return gpa.toFixed(2);
}

export function formatAttendanceRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return 'No marks yet';
  return `${rate.toFixed(1)}%`;
}

export function asBoolean(val: number | boolean | null | undefined): boolean {
  return val === true || val === 1;
}

export function extractFilenameFromDisposition(
  header: string | null | undefined,
  fallback: string
): string {
  if (!header) return fallback;
  const utf8Match = header.match(/filename\*\s*=\s*UTF-8''([^;\r\n]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }
  const quotedMatch = header.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1].trim();
  }
  const plainMatch = header.match(/filename\s*=\s*([^;\r\n]+)/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }
  return fallback;
}

export interface GradeBucket {
  letter: string;
  count: number;
  percentage: number;
}

const GRADE_ORDER = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'] as const;

export function buildGradeDistribution(results: AcademicResultItem[]): GradeBucket[] {
  if (results.length === 0) return [];
  const counts = new Map<string, number>();
  for (const r of results) {
    counts.set(r.letter, (counts.get(r.letter) ?? 0) + 1);
  }
  return GRADE_ORDER.filter((letter) => (counts.get(letter) ?? 0) > 0).map((letter) => {
    const count = counts.get(letter) ?? 0;
    return {
      letter,
      count,
      percentage: Math.round((count / results.length) * 100),
    };
  });
}

export function getAdminNextRequestStatuses(
  current: ServiceRequestStatus
): Array<{ status: 'in_review' | 'resolved' | 'rejected'; label: string; requiresNote: boolean }> {
  if (current === 'pending') {
    return [
      { status: 'in_review', label: 'Move to In Review', requiresNote: false },
      { status: 'rejected', label: 'Reject Request', requiresNote: true },
    ];
  }
  if (current === 'in_review') {
    return [
      { status: 'resolved', label: 'Resolve Request', requiresNote: true },
      { status: 'rejected', label: 'Reject Request', requiresNote: true },
    ];
  }
  return [];
}

export function canStudentCancelRequest(status: ServiceRequestStatus): boolean {
  return status === 'pending' || status === 'in_review';
}

export function formatCategoryLabel(category: ServiceRequestCategory): string {
  switch (category) {
    case 'transcript':
      return 'Academic Record / Transcript';
    case 'enrollment_letter':
      return 'Enrollment Letter';
    case 'it_support':
      return 'IT Support';
    case 'general':
      return 'General Inquiry';
  }
}

export function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function timeStringToMinutes(hhmm: string): number | null {
  const match = hhmm.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return null;
  return hours * 60 + mins;
}

export function formatRoleLabel(role: string): string {
  switch (role) {
    case 'student':
      return 'Student';
    case 'lecturer':
      return 'Lecturer';
    case 'admin':
      return 'Administrator';
    case 'advisor':
      return 'Academic Advisor';
    default:
      return formatStatusLabel(role);
  }
}
