import test from 'node:test';
import assert from 'node:assert/strict';
import {
  asBoolean,
  buildGradeDistribution,
  canStudentCancelRequest,
  extractFilenameFromDisposition,
  formatAedFromFils,
  formatAttendanceRate,
  formatGpa,
  formatMinutes,
  formatTimeRange,
  getAdminNextRequestStatuses,
  isPastDeadline,
  normalizeDueAtUae,
  parseAedToFils,
  timeStringToMinutes,
  weekdayName,
} from './formatters';

test('AED and fils conversion preserves exact integer fils', () => {
  assert.equal(formatAedFromFils(450000), 'AED 4,500.00');
  assert.equal(formatAedFromFils(15000), 'AED 150.00');
  assert.equal(formatAedFromFils(0), 'AED 0.00');
  assert.equal(parseAedToFils('4500'), 450000);
  assert.equal(parseAedToFils('125.50'), 12550);
  assert.equal(parseAedToFils('-10'), null);
  assert.equal(parseAedToFils('0'), null);
  assert.equal(parseAedToFils('12.345'), null);
});

test('UAE weekday and minute formatting', () => {
  assert.equal(weekdayName(0), 'Monday');
  assert.equal(weekdayName(6, true), 'Sun');
  assert.equal(weekdayName(null), 'Unscheduled');
  assert.equal(formatMinutes(540), '09:00');
  assert.equal(formatMinutes(630), '10:30');
  assert.equal(formatTimeRange(540, 630), '09:00–10:30 GST');
  assert.equal(timeStringToMinutes('09:30'), 570);
  assert.equal(timeStringToMinutes('25:00'), null);
});

test('null GPA and null attendance rate never fabricate zero values', () => {
  assert.equal(formatGpa(null), 'Not yet released');
  assert.equal(formatGpa(3.7), '3.70');
  assert.equal(formatAttendanceRate(null), 'No marks yet');
  assert.equal(formatAttendanceRate(91.5), '91.5%');
});

test('deadline normalization appends UAE +04:00 offset to datetime-local strings', () => {
  assert.equal(normalizeDueAtUae('2026-12-01T18:00'), '2026-12-01T18:00+04:00');
  assert.equal(
    normalizeDueAtUae('2026-12-01T18:00:00+04:00'),
    '2026-12-01T18:00:00+04:00'
  );
  assert.equal(
    isPastDeadline('2026-12-01T18:00+04:00', Date.parse('2026-12-01T13:59:00Z')),
    false
  );
  assert.equal(
    isPastDeadline('2026-12-01T18:00+04:00', Date.parse('2026-12-01T14:01:00Z')),
    true
  );
});

test('Content-Disposition filename extraction handles RFC 5987 UTF-8 and quoted forms', () => {
  assert.equal(
    extractFilenameFromDisposition(
      "attachment; filename*=UTF-8''lab%20report%201.pdf",
      'fallback.bin'
    ),
    'lab report 1.pdf'
  );
  assert.equal(
    extractFilenameFromDisposition(
      'attachment; filename="discivium-record.csv"',
      'fallback.csv'
    ),
    'discivium-record.csv'
  );
  assert.equal(extractFilenameFromDisposition(null, 'default.pdf'), 'default.pdf');
});

test('service request legal transitions follow backend state machine', () => {
  assert.deepEqual(
    getAdminNextRequestStatuses('pending').map((t) => t.status),
    ['in_review', 'rejected']
  );
  assert.deepEqual(
    getAdminNextRequestStatuses('in_review').map((t) => t.status),
    ['resolved', 'rejected']
  );
  assert.deepEqual(getAdminNextRequestStatuses('resolved'), []);
  assert.equal(canStudentCancelRequest('pending'), true);
  assert.equal(canStudentCancelRequest('in_review'), true);
  assert.equal(canStudentCancelRequest('resolved'), false);
  assert.equal(canStudentCancelRequest('cancelled'), false);
});

test('grade distribution and SQLite boolean helpers', () => {
  assert.equal(asBoolean(1), true);
  assert.equal(asBoolean(0), false);
  assert.equal(asBoolean(true), true);
  assert.deepEqual(buildGradeDistribution([]), []);
  const dist = buildGradeDistribution([
    {
      course_id: 1,
      code: 'BCS200',
      title: 'Programming II',
      percentage: 88,
      credits: 3,
      released_at: '2026-05-15T08:00:00+00:00',
      letter: 'B+',
      grade_points: 3.3,
    },
    {
      course_id: 2,
      code: 'BCS305',
      title: 'Software Architecture',
      percentage: 95,
      credits: 3,
      released_at: '2026-05-16T08:00:00+00:00',
      letter: 'A',
      grade_points: 4.0,
    },
  ]);
  assert.deepEqual(dist, [
    { letter: 'A', count: 1, percentage: 50 },
    { letter: 'B+', count: 1, percentage: 50 },
  ]);
});
