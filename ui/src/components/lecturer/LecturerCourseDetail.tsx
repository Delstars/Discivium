import React, { useMemo, useState } from 'react';
import { ArrowLeft, CalendarCheck, Download, FileText, MessageSquare, Plus, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';


import { formatTimeRange, weekdayName } from '../../lib/formatters';
import { EmptyState, PageHeader, primaryBtnClass, secondaryBtnClass } from '../ui/Primitives';

type LecturerTab = 'coursework' | 'resources' | 'attendance' | 'workspace';
import { LecturerCoursework } from './LecturerCoursework';
import { LecturerResources } from './LecturerResources';
import { LecturerAttendance } from './LecturerAttendance';
import { LecturerWorkspace } from './LecturerWorkspace';
export function LecturerCourseDetail({ courseId }: { courseId: number }) {
  const { state, navigate } = useApp();
  const [tab, setTab] = useState<LecturerTab>('coursework');
  const [pubOpen, setPubOpen] = useState(false);
  const [resOpen, setResOpen] = useState(false);
  const course = useMemo(
    () => (state?.courses ?? []).find((c) => c.id === courseId) ?? null,
    [state?.courses, courseId]
  );

  const slot = useMemo(
    () => (state?.timetable ?? []).find((t) => t.id === courseId) ?? null,
    [state?.timetable, courseId]
  );

  if (!state) return null;

  if (!course) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('courses')}
          className={secondaryBtnClass}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assigned Courses
        </button>
        <EmptyState
          title="Course not assigned to your account"
          description="Instructors can view and manage only their own assigned courses."
        />
      </div>
    );
  }

  const roster = course.roster ?? [];
  const releasedResults = course.released_results ?? [];
  const courseHasReleasedResults = releasedResults.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate('courses')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to Assigned Courses
        </button>

        <PageHeader
          eyebrow={
            slot
              ? `${course.code} · ${weekdayName(slot.weekday)} ${formatTimeRange(slot.start_min, slot.end_min)} · Room ${slot.room} · ${roster.length} enrolled`
              : `${course.code} · ${roster.length} enrolled`
          }
          title={course.title}
          actions={
            <>
              <button
                type="button"
                onClick={() => {
                  setResOpen(true);
                }}
                className={secondaryBtnClass}
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                Publish Resource
              </button>
              <button
                type="button"
                disabled={courseHasReleasedResults}
                title={
                  courseHasReleasedResults
                    ? 'Cannot publish new assignments after a final result has been released'
                    : undefined
                }
                onClick={() => {
                  setPubOpen(true);
                }}
                className={primaryBtnClass}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Publish Assignment
              </button>
            </>
          }
        />
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Lecturer course tools"
        className="flex flex-wrap gap-1 border-b border-[var(--border)]"
      >
        {(
          [
            ['coursework', `Coursework & Results (${course.assignments.length})`, FileText],
            ['resources', `Resources (${course.resources.length})`, Download],
            ['attendance', `Roster & Attendance (${roster.length})`, CalendarCheck],
            [
              'workspace',
              `Discussion & Polls (${course.workspace.messages.length + course.workspace.forms.length})`,
              MessageSquare,
            ],
          ] as Array<[LecturerTab, string, React.ComponentType<{ className?: string }>]>
        ).map(([id, label, Icon]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      <LecturerCoursework key={course.id+'-coursework'} course={course} active={tab==='coursework'} pubOpen={pubOpen} setPubOpen={setPubOpen}/>
      <LecturerResources key={course.id+'-resources'} course={course} active={tab==='resources'} resOpen={resOpen} setResOpen={setResOpen}/>
      <LecturerAttendance key={course.id+'-attendance'} course={course} active={tab==='attendance'}/>
      <LecturerWorkspace key={course.id+'-workspace'} course={course} active={tab==='workspace'}/>
    </div>
  );
}
