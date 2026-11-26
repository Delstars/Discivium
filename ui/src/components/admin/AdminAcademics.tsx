import React, { useMemo, useState } from 'react';
import { BookPlus, GraduationCap, Link2, Plus, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import {
  asBoolean,
  formatTimeRange,
  timeStringToMinutes,
  WEEKDAYS,
  weekdayName,
} from '../../lib/formatters';
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

export function AdminAcademics() {
  const { state, executeAction } = useApp();

  // Create Programme Modal
  const [progOpen, setProgOpen] = useState(false);
  const [progName, setProgName] = useState('');
  const [progDept, setProgDept] = useState('');
  const [progBusy, setProgBusy] = useState(false);
  const [progErr, setProgErr] = useState<string | null>(null);

  // Assign Programme Modal
  const [assignProgOpen, setAssignProgOpen] = useState(false);
  const [apStudentId, setApStudentId] = useState('');
  const [apProgrammeId, setApProgrammeId] = useState('');
  const [apBusy, setApBusy] = useState(false);
  const [apErr, setApErr] = useState<string | null>(null);

  // Create Course Offering Modal
  const [courseOpen, setCourseOpen] = useState(false);
  const [cCode, setCCode] = useState('');
  const [cTitle, setCTitle] = useState('');
  const [cLecturerId, setCLecturerId] = useState('');
  const [cCredits, setCCredits] = useState('3');
  const [cCapacity, setCCapacity] = useState('30');
  const [cWeekday, setCWeekday] = useState('1');
  const [cStart, setCStart] = useState('11:00');
  const [cEnd, setCEnd] = useState('12:30');
  const [cRoom, setCRoom] = useState('B-210');
  const [cBusy, setCBusy] = useState(false);
  const [cErr, setCErr] = useState<string | null>(null);

  // Enroll Student Modal
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [eStudentId, setEStudentId] = useState('');
  const [eCourseId, setECourseId] = useState('');
  const [eBusy, setEBusy] = useState(false);
  const [eErr, setEErr] = useState<string | null>(null);

  // Assign Advisor Modal
  const [advOpen, setAdvOpen] = useState(false);
  const [adStudentId, setAdStudentId] = useState('');
  const [adAdvisorId, setAdAdvisorId] = useState('');
  const [adBusy, setAdBusy] = useState(false);
  const [adErr, setAdErr] = useState<string | null>(null);

  if (!state) return null;
  const gov = state.governance;
  const people = gov?.people ?? [];
  const programmes = gov?.programmes ?? [];
  const courses = gov?.courses ?? [];
  const enrollments = gov?.enrollments ?? [];
  const advisorAssignments = gov?.advisor_assignments ?? [];

  const students = useMemo(() => people.filter((p) => p.role === 'student'), [people]);
  const lecturers = useMemo(() => people.filter((p) => p.role === 'lecturer'), [people]);
  const advisors = useMemo(() => people.filter((p) => p.role === 'advisor'), [people]);

  const userName = (id: number) =>
    people.find((p) => p.id === id)?.name ?? `User #${id}`;
  const courseLabel = (id: number) => {
    const c = courses.find((item) => item.id === id);
    return c ? `${c.code} — ${c.title}` : `Course #${id}`;
  };

  const handleCreateProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progName.trim() || !progDept.trim()) {
      setProgErr('Enter both programme name and department.');
      return;
    }
    setProgErr(null);
    setProgBusy(true);
    try {
      await executeAction(
        'programme',
        { name: progName.trim(), department: progDept.trim() },
        `Created programme "${progName.trim()}".`
      );
      setProgName('');
      setProgDept('');
      setProgOpen(false);
    } catch (err) {
      setProgErr(err instanceof ApiError ? err.message : 'Unable to create programme.');
    } finally {
      setProgBusy(false);
    }
  };

  const handleAssignProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apStudentId || !apProgrammeId) {
      setApErr('Select both a student and a programme.');
      return;
    }
    setApErr(null);
    setApBusy(true);
    try {
      await executeAction(
        'assign-programme',
        { student_id: Number(apStudentId), programme_id: Number(apProgrammeId) },
        'Assigned academic programme to student.'
      );
      setAssignProgOpen(false);
    } catch (err) {
      setApErr(err instanceof ApiError ? err.message : 'Unable to assign programme.');
    } finally {
      setApBusy(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const startMin = timeStringToMinutes(cStart);
    const endMin = timeStringToMinutes(cEnd);
    if (!cCode.trim() || !cTitle.trim() || !cLecturerId || !cRoom.trim()) {
      setCErr('Complete code, title, lecturer, and room.');
      return;
    }
    if (startMin === null || endMin === null || startMin >= endMin) {
      setCErr('End time must be later than start time.');
      return;
    }
    setCErr(null);
    setCBusy(true);
    try {
      await executeAction(
        'course',
        {
          code: cCode.trim().toUpperCase(),
          title: cTitle.trim(),
          lecturer_id: Number(cLecturerId),
          credits: Number(cCredits),
          capacity: Number(cCapacity),
          weekday: Number(cWeekday),
          start_min: startMin,
          end_min: endMin,
          room: cRoom.trim(),
        },
        `Created Fall 2026 offering ${cCode.trim().toUpperCase()}.`
      );
      setCCode('');
      setCTitle('');
      setCourseOpen(false);
    } catch (err) {
      setCErr(err instanceof ApiError ? err.message : 'Unable to create course offering.');
    } finally {
      setCBusy(false);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eStudentId || !eCourseId) {
      setEErr('Select both a student and a Fall 2026 course.');
      return;
    }
    setEErr(null);
    setEBusy(true);
    try {
      await executeAction(
        'enroll',
        { course_id: Number(eCourseId), student_id: Number(eStudentId) },
        'Student enrolled in course offering.'
      );
      setEnrollOpen(false);
    } catch (err) {
      setEErr(err instanceof ApiError ? err.message : 'Unable to enroll student.');
    } finally {
      setEBusy(false);
    }
  };

  const handleAssignAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adStudentId || !adAdvisorId) {
      setAdErr('Select both a student and an academic advisor.');
      return;
    }
    setAdErr(null);
    setAdBusy(true);
    try {
      await executeAction(
        'assign-advisor',
        { student_id: Number(adStudentId), advisor_id: Number(adAdvisorId) },
        'Assigned advisor (initial consent off until granted by student).'
      );
      setAdvOpen(false);
    } catch (err) {
      setAdErr(err instanceof ApiError ? err.message : 'Unable to assign advisor.');
    } finally {
      setAdBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${state.semester} · Academic Configuration`}
        title="Programmes, Course Offerings & Allocations"
        description="Manage degree programmes, create Fall 2026 offerings with room/lecturer clash checks, enroll eligible students, and assign academic advisors."
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                setCErr(null);
                setCLecturerId(lecturers[0] ? String(lecturers[0].id) : '');
                setCourseOpen(true);
              }}
              className={primaryBtnClass}
            >
              <BookPlus className="w-3.5 h-3.5" aria-hidden="true" />
              New Course Offering
            </button>
            <button
              type="button"
              onClick={() => {
                setEErr(null);
                setEStudentId(students[0] ? String(students[0].id) : '');
                const fallCourse = courses.find((c) => c.semester === 'Fall 2026') ?? courses[0];
                setECourseId(fallCourse ? String(fallCourse.id) : '');
                setEnrollOpen(true);
              }}
              className={secondaryBtnClass}
            >
              <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Enroll Student
            </button>
          </>
        }
      />

      {/* Course Offerings Table */}
      <SectionCard
        title="Course Offerings"
        subtitle="New courses default to Fall 2026; the server rejects duplicate codes and lecturer or room timetable clashes."
        noPadding
      >
        {courses.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No courses configured"
              description="Create a Fall 2026 course offering above."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-muted)]">
                  <th className="py-3 px-5 font-medium">Code &amp; Title</th>
                  <th className="py-3 px-4 font-medium">Lecturer</th>
                  <th className="py-3 px-4 font-medium">Schedule &amp; Room</th>
                  <th className="py-3 px-4 font-medium">Term</th>
                  <th className="py-3 px-4 font-medium text-right">Credits</th>
                  <th className="py-3 px-5 font-medium text-right">Enrolled / Cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {courses.map((c) => {
                  const enrolledCount = enrollments.filter((e) => e.course_id === c.id).length;
                  return (
                    <tr key={c.id} className="hover:bg-[var(--surface-subtle)]/50">
                      <td className="py-3 px-5">
                        <p className="font-mono text-xs font-semibold text-[var(--accent)]">
                          {c.code}
                        </p>
                        <p className="text-sm font-medium text-[var(--ink)]">{c.title}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--ink-secondary)]">
                        {userName(c.lecturer_id)}
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--ink-secondary)] whitespace-nowrap">
                        {c.weekday !== null ? (
                          <>
                            <span className="font-medium text-[var(--ink)]">
                              {weekdayName(c.weekday, true)}{' '}
                              {formatTimeRange(c.start_min, c.end_min)}
                            </span>
                            <span className="font-mono text-[var(--ink-muted)]">
                              {' '}
                              · {c.room ?? 'TBA'}
                            </span>
                          </>
                        ) : (
                          <span className="text-[var(--ink-muted)]">No offering slot</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--ink-muted)] whitespace-nowrap">
                        {c.semester ?? '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs tabular-nums text-right">
                        {c.credits ?? '—'}
                      </td>
                      <td className="py-3 px-5 font-mono text-xs tabular-nums text-right">
                        {enrolledCount} / {c.capacity ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Programmes + Advisor Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Academic Programmes"
          subtitle="Create degree programmes and assign them to students."
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setApErr(null);
                  setApStudentId(students[0] ? String(students[0].id) : '');
                  setApProgrammeId(programmes[0] ? String(programmes[0].id) : '');
                  setAssignProgOpen(true);
                }}
                className={secondaryBtnClass}
              >
                <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                Assign Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setProgErr(null);
                  setProgOpen(true);
                }}
                className={primaryBtnClass}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                New Programme
              </button>
            </div>
          }
        >
          {programmes.length === 0 ? (
            <EmptyState
              title="No programmes defined"
              description="Add a degree programme and department above."
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {programmes.map((p) => (
                <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{p.name}</p>
                    <p className="text-xs text-[var(--ink-muted)]">{p.department}</p>
                  </div>
                  <span className="font-mono text-xs text-[var(--ink-muted)]">PRG-{p.id}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Advisor Assignments"
          subtitle="New assignments start with consent off until enabled by the student."
          action={
            <button
              type="button"
              onClick={() => {
                setAdErr(null);
                setAdStudentId(students[0] ? String(students[0].id) : '');
                setAdAdvisorId(advisors[0] ? String(advisors[0].id) : '');
                setAdvOpen(true);
              }}
              className={primaryBtnClass}
            >
              <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
              Assign Advisor
            </button>
          }
        >
          {advisorAssignments.length === 0 ? (
            <EmptyState
              title="No advisor assignments"
              description="Assign an academic advisor to a student profile."
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {advisorAssignments.map((aa) => (
                <div
                  key={`${aa.student_id}-${aa.advisor_id}`}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-[var(--ink)]">
                      {userName(aa.student_id)}
                    </p>
                    <p className="text-[var(--ink-muted)]">
                      Advisor: {userName(aa.advisor_id)}
                    </p>
                  </div>
                  <StatusBadge variant={asBoolean(aa.consent) ? 'success' : 'neutral'}>
                    {asBoolean(aa.consent) ? 'Consent active' : 'Consent off'}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Active Enrollments Table */}
      <SectionCard
        title={`Active Enrollments (${enrollments.length})`}
        subtitle="Verified course allocations across the institution."
        noPadding
      >
        {enrollments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No active enrollments"
              description="Enroll students into Fall 2026 course offerings above."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--ink-muted)]">
                  <th className="py-2.5 px-5 font-medium">Student</th>
                  <th className="py-2.5 px-5 font-medium">Course</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {enrollments.map((enr) => (
                  <tr key={`${enr.course_id}-${enr.student_id}`}>
                    <td className="py-2.5 px-5 font-medium text-[var(--ink)]">
                      {userName(enr.student_id)}
                    </td>
                    <td className="py-2.5 px-5 text-[var(--ink-secondary)]">
                      {courseLabel(enr.course_id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Modal: Create Course Offering */}
      <Modal
        open={courseOpen}
        onClose={() => {
          if (!cBusy) setCourseOpen(false);
        }}
        title="Create Fall 2026 Course Offering"
        subtitle="Server enforces unique course code and prevents lecturer or room timetable clashes."
        size="lg"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          {cErr && <ErrorBanner message={cErr} />}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field id="co-code" label="Course Code" required>
              <input
                id="co-code"
                type="text"
                maxLength={20}
                value={cCode}
                onChange={(e) => setCCode(e.target.value)}
                placeholder="e.g. BCS410"
                className={`${inputClass} font-mono uppercase`}
                disabled={cBusy}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field id="co-title" label="Course Title" required>
                <input
                  id="co-title"
                  type="text"
                  maxLength={150}
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems Engineering"
                  className={inputClass}
                  disabled={cBusy}
                />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field id="co-lecturer" label="Assigned Lecturer" required>
              <select
                id="co-lecturer"
                value={cLecturerId}
                onChange={(e) => setCLecturerId(e.target.value)}
                className={inputClass}
                disabled={cBusy}
              >
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} (@{l.username})
                  </option>
                ))}
              </select>
            </Field>
            <Field id="co-credits" label="Credits (1–6)" required>
              <input
                id="co-credits"
                type="number"
                min={1}
                max={6}
                value={cCredits}
                onChange={(e) => setCCredits(e.target.value)}
                className={`${inputClass} font-mono tabular-nums`}
                disabled={cBusy}
              />
            </Field>
            <Field id="co-cap" label="Seat Capacity (1–1000)" required>
              <input
                id="co-cap"
                type="number"
                min={1}
                max={1000}
                value={cCapacity}
                onChange={(e) => setCCapacity(e.target.value)}
                className={`${inputClass} font-mono tabular-nums`}
                disabled={cBusy}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Field id="co-day" label="Day (UAE)" required>
              <select
                id="co-day"
                value={cWeekday}
                onChange={(e) => setCWeekday(e.target.value)}
                className={inputClass}
                disabled={cBusy}
              >
                {WEEKDAYS.map((day, idx) => (
                  <option key={day} value={idx}>
                    {day}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="co-start" label="Start Time" required>
              <input
                id="co-start"
                type="time"
                value={cStart}
                onChange={(e) => setCStart(e.target.value)}
                className={`${inputClass} font-mono`}
                disabled={cBusy}
              />
            </Field>
            <Field id="co-end" label="End Time" required>
              <input
                id="co-end"
                type="time"
                value={cEnd}
                onChange={(e) => setCEnd(e.target.value)}
                className={`${inputClass} font-mono`}
                disabled={cBusy}
              />
            </Field>
            <Field id="co-room" label="Room" required>
              <input
                id="co-room"
                type="text"
                maxLength={30}
                value={cRoom}
                onChange={(e) => setCRoom(e.target.value)}
                placeholder="B-210"
                className={`${inputClass} font-mono`}
                disabled={cBusy}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={cBusy}
              onClick={() => setCourseOpen(false)}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={cBusy} className={primaryBtnClass}>
              {cBusy ? 'Creating…' : 'Create Offering'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Programme */}
      <Modal
        open={progOpen}
        onClose={() => {
          if (!progBusy) setProgOpen(false);
        }}
        title="Create Academic Programme"
        size="sm"
      >
        <form onSubmit={handleCreateProgramme} className="space-y-4">
          {progErr && <ErrorBanner message={progErr} />}
          <Field id="prog-name" label="Programme Name" required>
            <input
              id="prog-name"
              type="text"
              maxLength={150}
              value={progName}
              onChange={(e) => setProgName(e.target.value)}
              placeholder="e.g. BSc Software Engineering"
              className={inputClass}
              disabled={progBusy}
            />
          </Field>
          <Field id="prog-dept" label="Department" required>
            <input
              id="prog-dept"
              type="text"
              maxLength={150}
              value={progDept}
              onChange={(e) => setProgDept(e.target.value)}
              placeholder="e.g. Engineering and Technology"
              className={inputClass}
              disabled={progBusy}
            />
          </Field>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={progBusy}
              onClick={() => setProgOpen(false)}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={progBusy} className={primaryBtnClass}>
              {progBusy ? 'Saving…' : 'Create Programme'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Student Programme */}
      <Modal
        open={assignProgOpen}
        onClose={() => {
          if (!apBusy) setAssignProgOpen(false);
        }}
        title="Assign Academic Programme"
        size="sm"
      >
        <form onSubmit={handleAssignProgramme} className="space-y-4">
          {apErr && <ErrorBanner message={apErr} />}
          <Field id="ap-student" label="Student" required>
            <select
              id="ap-student"
              value={apStudentId}
              onChange={(e) => setApStudentId(e.target.value)}
              className={inputClass}
              disabled={apBusy}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (@{s.username})
                </option>
              ))}
            </select>
          </Field>
          <Field id="ap-prog" label="Programme" required>
            <select
              id="ap-prog"
              value={apProgrammeId}
              onChange={(e) => setApProgrammeId(e.target.value)}
              className={inputClass}
              disabled={apBusy}
            >
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.department}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={apBusy}
              onClick={() => setAssignProgOpen(false)}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={apBusy} className={primaryBtnClass}>
              {apBusy ? 'Assigning…' : 'Assign Programme'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Enroll Student */}
      <Modal
        open={enrollOpen}
        onClose={() => {
          if (!eBusy) setEnrollOpen(false);
        }}
        title="Enroll Student in Course"
        subtitle="Enforces the same capacity, prerequisite, timetable clash, and 18-credit constraints as self-registration."
        size="sm"
      >
        <form onSubmit={handleEnroll} className="space-y-4">
          {eErr && <ErrorBanner message={eErr} />}
          <Field id="enr-student" label="Student" required>
            <select
              id="enr-student"
              value={eStudentId}
              onChange={(e) => setEStudentId(e.target.value)}
              className={inputClass}
              disabled={eBusy}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (@{s.username})
                </option>
              ))}
            </select>
          </Field>
          <Field id="enr-course" label="Fall 2026 Course Offering" required>
            <select
              id="enr-course"
              value={eCourseId}
              onChange={(e) => setECourseId(e.target.value)}
              className={inputClass}
              disabled={eBusy}
            >
              {courses
                .filter((c) => c.semester === 'Fall 2026')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </option>
                ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={eBusy}
              onClick={() => setEnrollOpen(false)}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={eBusy} className={primaryBtnClass}>
              {eBusy ? 'Enrolling…' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Advisor */}
      <Modal
        open={advOpen}
        onClose={() => {
          if (!adBusy) setAdvOpen(false);
        }}
        title="Assign Academic Advisor"
        subtitle="Consent defaults to off until granted by the student."
        size="sm"
      >
        <form onSubmit={handleAssignAdvisor} className="space-y-4">
          {adErr && <ErrorBanner message={adErr} />}
          <Field id="aa-student" label="Student" required>
            <select
              id="aa-student"
              value={adStudentId}
              onChange={(e) => setAdStudentId(e.target.value)}
              className={inputClass}
              disabled={adBusy}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (@{s.username})
                </option>
              ))}
            </select>
          </Field>
          <Field id="aa-advisor" label="Advisor" required>
            <select
              id="aa-advisor"
              value={adAdvisorId}
              onChange={(e) => setAdAdvisorId(e.target.value)}
              className={inputClass}
              disabled={adBusy}
            >
              {advisors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (@{a.username})
                </option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={adBusy}
              onClick={() => setAdvOpen(false)}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={adBusy} className={primaryBtnClass}>
              {adBusy ? 'Assigning…' : 'Assign Advisor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
