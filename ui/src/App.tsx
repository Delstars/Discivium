import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { AppShell } from './components/layout/AppShell';
import { LoadingSkeleton, PageHeader } from './components/ui/Primitives';
import { TimetableView } from './components/ui/TimetableView';
import { StudentOverview } from './components/student/StudentOverview';
import {
  StudentCourseDetail,
  StudentCoursesList,
} from './components/student/StudentCourseDetail';
import { StudentAssignments } from './components/student/StudentAssignments';
import { StudentRegistration } from './components/student/StudentRegistration';
import { StudentAttendance } from './components/student/StudentAttendance';
import { StudentRecord } from './components/student/StudentRecord';
import { StudentFinance } from './components/student/StudentFinance';
import { StudentServices } from './components/student/StudentServices';
import { StudentAdvising } from './components/student/StudentAdvising';
import {
  LecturerCoursesList,
  LecturerOverview,
} from './components/lecturer/LecturerOverview';
import { LecturerCourseDetail } from './components/lecturer/LecturerCourseDetail';
import { LecturerSubmissions } from './components/lecturer/LecturerSubmissions';
import { AdminOverview } from './components/admin/AdminOverview';
import { AdminDirectory } from './components/admin/AdminDirectory';
import { AdminAcademics } from './components/admin/AdminAcademics';
import { AdminFinance } from './components/admin/AdminFinance';
import { AdminRequests } from './components/admin/AdminRequests';
import { AdminAudit } from './components/admin/AdminAudit';
import { AdvisorWorkspace } from './components/advisor/AdvisorWorkspace';

function AuthenticatedWorkspace() {
  const { state, route, navigate } = useApp();
  if (!state) return null;

  const { role } = state.user;

  if (role === 'student') {
    switch (route.section) {
      case 'overview':
        return <StudentOverview />;
      case 'courses':
        return <StudentCoursesList />;
      case 'course':
        return route.courseId ? (
          <StudentCourseDetail courseId={route.courseId} />
        ) : (
          <StudentCoursesList />
        );
      case 'assignments':
        return <StudentAssignments />;
      case 'registration':
        return <StudentRegistration />;
      case 'timetable':
        return (
          <div className="space-y-6">
            <PageHeader
              eyebrow={state.semester}
              title="Weekly Academic Timetable"
              description="Click any course session to open its classroom workspace."
            />
            <TimetableView
              slots={state.timetable ?? []}
              semester={state.semester}
              onSelectCourse={(id) => navigate('course', id)}
            />
          </div>
        );
      case 'attendance':
        return <StudentAttendance />;
      case 'record':
        return <StudentRecord />;
      case 'finance':
        return <StudentFinance />;
      case 'services':
        return <StudentServices />;
      case 'advising':
        return <StudentAdvising />;
      default:
        return <StudentOverview />;
    }
  }

  if (role === 'lecturer') {
    switch (route.section) {
      case 'overview':
        return <LecturerOverview />;
      case 'courses':
        return <LecturerCoursesList />;
      case 'course':
        return route.courseId ? (
          <LecturerCourseDetail courseId={route.courseId} />
        ) : (
          <LecturerCoursesList />
        );
      case 'submissions':
        return <LecturerSubmissions />;
      case 'timetable':
        return (
          <div className="space-y-6">
            <PageHeader
              eyebrow={`${state.semester} · Assigned Faculty Timetable`}
              title="Weekly Teaching Timetable"
              description="Sessions for your assigned courses in UAE Standard Time (GST, UTC+4)."
            />
            <TimetableView
              slots={state.timetable ?? []}
              semester={state.semester}
              onSelectCourse={(id) => navigate('course', id)}
            />
          </div>
        );
      default:
        return <LecturerOverview />;
    }
  }

  if (role === 'admin') {
    switch (route.section) {
      case 'overview':
        return <AdminOverview />;
      case 'directory':
        return <AdminDirectory />;
      case 'academics':
        return <AdminAcademics />;
      case 'finance':
        return <AdminFinance />;
      case 'requests':
        return <AdminRequests />;
      case 'audit':
        return <AdminAudit />;
      default:
        return <AdminOverview />;
    }
  }

  return <AdvisorWorkspace />;
}

function DisciviumRoot() {
  const { booting, state } = useApp();

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)] p-6">
        <div className="w-full max-w-md space-y-4">
          <p className="font-display text-xl font-semibold text-[var(--ink)] text-center">
            Discivium
          </p>
          <p className="text-xs text-[var(--ink-muted)] text-center">
            Checking active same-origin session…
          </p>
          <LoadingSkeleton rows={3} />
        </div>
      </div>
    );
  }

  if (!state) {
    return <LoginScreen />;
  }

  return (
    <AppShell>
      <AuthenticatedWorkspace />
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DisciviumRoot />
    </AppProvider>
  );
}
