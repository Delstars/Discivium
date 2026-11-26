export type UserRole = 'student' | 'lecturer' | 'admin' | 'advisor';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: UserRole;
}

export interface SessionResponse {
  authenticated: boolean;
  user: AuthUser | null;
  csrf: string | null;
}

export interface NotificationItem {
  id: number;
  message: string;
  created_at: string;
  read_at: string | null;
}

export interface SubmissionItem {
  id: number;
  assignment_id: number;
  student_id: number;
  filename: string;
  submitted_at: string;
  late: number | boolean;
  status: 'submitted' | 'graded' | string;
  name: string;
  score: number | null;
  comment: string | null;
}

export interface AssignmentItem {
  id: number;
  course_id: number;
  title: string;
  description: string;
  due_at: string;
  max_points: number;
  policy: 'strict' | 'allow_late';
  submissions: SubmissionItem[];
}

export interface ResourceItem {
  id: number;
  course_id: number;
  title: string;
  filename: string;
  created_at: string;
}

export interface CourseMessage {
  id: number;
  course_id: number;
  author_id: number;
  body: string;
  created_at: string;
  author_name: string;
}

export interface CoursePoll {
  id: number;
  course_id: number;
  title: string;
  question: string;
  open: number | boolean;
  created_at: string;
  options: string[];
  my_choice?: number | null;
  counts?: number[];
}

export interface CourseWorkspace {
  messages: CourseMessage[];
  forms: CoursePoll[];
}

export interface RosterStudent {
  id: number;
  name: string;
}

export interface AttendanceMark {
  session_id: number;
  student_id: number;
  status: AttendanceStatus;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceSession {
  id: number;
  course_id: number;
  session_date: string;
  title: string;
  marks: AttendanceMark[];
}

export interface ReleasedCourseResult {
  student_id: number;
  percentage: number;
  released_at: string;
}

export interface CourseItem {
  id: number;
  code: string;
  title: string;
  lecturer_id: number;
  assignments: AssignmentItem[];
  resources: ResourceItem[];
  workspace: CourseWorkspace;
  roster?: RosterStudent[];
  attendance_sessions?: AttendanceSession[];
  released_results?: ReleasedCourseResult[];
}

export interface TimetableSlot {
  id: number;
  code: string;
  title: string;
  weekday: number;
  start_min: number;
  end_min: number;
  room: string;
  credits: number;
  semester: string;
}

export interface PrerequisiteCourse {
  id: number;
  code: string;
  title: string;
}

export interface CatalogueCourse {
  id: number;
  code: string;
  title: string;
  lecturer: string;
  course_id: number;
  credits: number;
  capacity: number;
  weekday: number;
  start_min: number;
  end_min: number;
  room: string;
  semester: string;
  occupied: number;
  prerequisites: PrerequisiteCourse[];
  enrolled: boolean;
}

export interface AcademicResultItem {
  course_id: number;
  code: string;
  title: string;
  percentage: number;
  credits: number;
  released_at: string;
  letter: string;
  grade_points: number;
}

export interface StudentProgramme {
  name: string;
  department: string;
}

export interface AcademicRecord {
  results: AcademicResultItem[];
  gpa: number | null;
  attempted_credits: number;
  earned_credits: number;
  programme: StudentProgramme[];
}

export interface StudentAttendanceItem {
  code: string;
  session_id: number;
  session_date: string;
  title: string;
  status: AttendanceStatus;
}

export interface StudentAttendance {
  items: StudentAttendanceItem[];
  rate: number | null;
}

export interface InvoiceItem {
  id: number;
  student_id: number;
  title: string;
  amount_fils: number;
  due_date: string;
  student_name: string;
  payment_id: number | null;
  paid_at: string | null;
  status: 'unpaid' | 'paid';
}

export type ServiceRequestCategory =
  | 'transcript'
  | 'enrollment_letter'
  | 'it_support'
  | 'general';

export type ServiceRequestStatus =
  | 'pending'
  | 'in_review'
  | 'resolved'
  | 'rejected'
  | 'cancelled';

export interface ServiceRequestItem {
  id: number;
  student_id: number;
  category: ServiceRequestCategory;
  subject: string;
  description: string;
  status: ServiceRequestStatus;
  decision: string | null;
  created_at: string;
  updated_at: string;
  student_name: string;
}

export interface StudentAdvisorLink {
  id: number;
  name: string;
  consent: number | boolean;
}

export interface AdvisingNote {
  id: number;
  student_id: number;
  advisor_id: number;
  note: string;
  created_at: string;
  advisor_name?: string;
}

export interface StudentAdvising {
  advisors: StudentAdvisorLink[];
  notes: AdvisingNote[];
}

export interface GovernanceProgramme {
  id: number;
  name: string;
  department: string;
}

export interface GovernanceCourse {
  id: number;
  code: string;
  title: string;
  lecturer_id: number;
  course_id: number | null;
  credits: number | null;
  capacity: number | null;
  weekday: number | null;
  start_min: number | null;
  end_min: number | null;
  room: string | null;
  semester: string | null;
}

export interface GovernanceEnrollment {
  course_id: number;
  student_id: number;
}

export interface GovernanceAdvisorAssignment {
  student_id: number;
  advisor_id: number;
  consent: number | boolean;
}

export interface AuditEntry {
  id: number;
  actor_id: number;
  action: string;
  entity_id: number | null;
  created_at: string;
  actor_name: string;
}

export interface GovernanceOverview {
  people: AuthUser[];
  programmes: GovernanceProgramme[];
  courses: GovernanceCourse[];
  enrollments: GovernanceEnrollment[];
  advisor_assignments: GovernanceAdvisorAssignment[];
  audit: AuditEntry[];
}

export interface AdviseeItem {
  id: number;
  name: string;
  consent: number | boolean;
  record?: AcademicRecord;
  attendance?: StudentAttendance;
  notes?: AdvisingNote[];
  risk_reasons?: string[];
}

export interface AppStateSnapshot {
  user: AuthUser;
  csrf: string;
  semester: string;
  demo: boolean;
  notifications: NotificationItem[];
  courses?: CourseItem[];
  timetable?: TimetableSlot[];
  catalogue?: CatalogueCourse[];
  record?: AcademicRecord;
  attendance?: StudentAttendance;
  finance?: InvoiceItem[];
  requests?: ServiceRequestItem[];
  advising?: StudentAdvising;
  governance?: GovernanceOverview;
  advisees?: AdviseeItem[];
}

export type ActionName =
  | 'publish'
  | 'submit'
  | 'grade'
  | 'resource'
  | 'register'
  | 'enroll'
  | 'release-result'
  | 'attendance-session'
  | 'attendance-mark'
  | 'pay'
  | 'invoice'
  | 'request'
  | 'request-status'
  | 'consent'
  | 'advising-note'
  | 'message'
  | 'form'
  | 'form-response'
  | 'form-close'
  | 'notification-read'
  | 'programme'
  | 'assign-programme'
  | 'assign-advisor'
  | 'course'
  | 'user';
