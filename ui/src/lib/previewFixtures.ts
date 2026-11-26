import type { AppStateSnapshot, UserRole } from '../types/api';

/**
 * Explicitly opt-in, disabled-by-default Design Preview Mode fixtures.
 * Never used as a silent fallback for live API requests.
 * Strictly fictional preview records matching the exact docs/UI_API.md schema.
 */
export function getDesignPreviewSnapshot(role: UserRole): AppStateSnapshot {
  if (role === 'student') {
    return {
      user: { id: 2, username: 'student', name: 'Alex Chen', role: 'student' },
      csrf: 'design-preview-readonly',
      semester: 'Fall 2026',
      demo: true,
      notifications: [
        {
          id: 1,
          message: 'Course registration confirmed for BCS305 Software Architecture',
          created_at: '2026-09-02T07:30:00+00:00',
          read_at: null,
        },
      ],
      courses: [
        {
          id: 1,
          code: 'BCS305',
          title: 'Software Architecture',
          lecturer_id: 1,
          assignments: [
            {
              id: 10,
              course_id: 1,
              title: 'Modular Monolith Design Specification',
              description:
                'Submit your layered domain boundary specification and C4 component diagram as a single PDF or DOCX document.',
              due_at: '2026-12-12T19:59:00+00:00',
              max_points: 30,
              policy: 'strict',
              submissions: [],
            },
          ],
          resources: [
            {
              id: 101,
              course_id: 1,
              title: 'Week 01 — Architecture Decision Records & Layered Boundaries',
              filename: 'BCS305_Week01_ADR_Guide.pdf',
              created_at: '2026-09-03T06:00:00+00:00',
            },
          ],
          workspace: {
            messages: [
              {
                id: 50,
                course_id: 1,
                author_id: 1,
                body: 'Welcome to BCS305. Please review the ADR guide before Tuesday studio.',
                created_at: '2026-09-03T06:15:00+00:00',
                author_name: 'Dr. Morgan',
              },
            ],
            forms: [
              {
                id: 21,
                course_id: 1,
                title: 'Studio Review Slot Preference',
                question: 'Which lab review slot works best for your team?',
                open: 1,
                created_at: '2026-09-04T08:00:00+00:00',
                options: ['Monday 11:00 GST', 'Wednesday 14:00 GST'],
                my_choice: null,
              },
            ],
          },
        },
      ],
      timetable: [
        {
          id: 1,
          code: 'BCS305',
          title: 'Software Architecture',
          weekday: 0,
          start_min: 540,
          end_min: 630,
          room: 'B-204',
          credits: 3,
          semester: 'Fall 2026',
        },
      ],
      catalogue: [
        {
          id: 1,
          course_id: 1,
          code: 'BCS305',
          title: 'Software Architecture',
          lecturer: 'Dr. Morgan',
          credits: 3,
          capacity: 30,
          weekday: 0,
          start_min: 540,
          end_min: 630,
          room: 'B-204',
          semester: 'Fall 2026',
          occupied: 1,
          prerequisites: [],
          enrolled: true,
        },
        {
          id: 3,
          course_id: 3,
          code: 'BCS310',
          title: 'Algorithms I',
          lecturer: 'Dr. Morgan',
          credits: 3,
          capacity: 25,
          weekday: 2,
          start_min: 600,
          end_min: 690,
          room: 'A-101',
          semester: 'Fall 2026',
          occupied: 0,
          prerequisites: [{ id: 7, code: 'BCS200', title: 'Programming II' }],
          enrolled: false,
        },
        {
          id: 5,
          course_id: 5,
          code: 'BCS330',
          title: 'Advanced Algorithms',
          lecturer: 'Dr. Morgan',
          credits: 3,
          capacity: 25,
          weekday: 4,
          start_min: 600,
          end_min: 690,
          room: 'B-204',
          semester: 'Fall 2026',
          occupied: 0,
          prerequisites: [{ id: 3, code: 'BCS310', title: 'Algorithms I' }],
          enrolled: false,
        },
      ],
      record: {
        results: [
          {
            course_id: 7,
            code: 'BCS200',
            title: 'Programming II',
            percentage: 88,
            credits: 3,
            released_at: '2026-05-15T08:00:00+00:00',
            letter: 'B+',
            grade_points: 3.3,
          },
        ],
        gpa: 3.3,
        attempted_credits: 3,
        earned_credits: 3,
        programme: [{ name: 'BSc Computer Science', department: 'Engineering and Technology' }],
      },
      attendance: {
        items: [],
        rate: null,
      },
      finance: [
        {
          id: 1,
          student_id: 2,
          title: 'Fall 2026 tuition instalment',
          amount_fils: 450000,
          due_date: '2026-12-10',
          student_name: 'Alex Chen',
          payment_id: null,
          paid_at: null,
          status: 'unpaid',
        },
        {
          id: 2,
          student_id: 2,
          title: 'Library and student services',
          amount_fils: 15000,
          due_date: '2026-12-10',
          student_name: 'Alex Chen',
          payment_id: null,
          paid_at: null,
          status: 'unpaid',
        },
      ],
      requests: [],
      advising: {
        advisors: [{ id: 5, name: 'Dr. Rivera (Advisor)', consent: 0 }],
        notes: [],
      },
    };
  }

  if (role === 'lecturer') {
    return {
      user: { id: 1, username: 'lecturer', name: 'Dr. Morgan', role: 'lecturer' },
      csrf: 'design-preview-readonly',
      semester: 'Fall 2026',
      demo: true,
      notifications: [],
      courses: [
        {
          id: 1,
          code: 'BCS305',
          title: 'Software Architecture',
          lecturer_id: 1,
          assignments: [
            {
              id: 10,
              course_id: 1,
              title: 'Modular Monolith Design Specification',
              description:
                'Deliver the C4 context/component diagram and authorization matrix.',
              due_at: '2026-12-12T19:59:00+00:00',
              max_points: 30,
              policy: 'strict',
              submissions: [
                {
                  id: 100,
                  assignment_id: 10,
                  student_id: 2,
                  filename: 'alex_chen_bcs305_spec.pdf',
                  submitted_at: '2026-11-24T10:20:00+00:00',
                  late: 0,
                  status: 'submitted',
                  name: 'Alex Chen',
                  score: null,
                  comment: null,
                },
              ],
            },
          ],
          resources: [],
          workspace: { messages: [], forms: [] },
          roster: [{ id: 2, name: 'Alex Chen' }],
          attendance_sessions: [],
          released_results: [],
        },
      ],
      timetable: [
        {
          id: 1,
          code: 'BCS305',
          title: 'Software Architecture',
          weekday: 0,
          start_min: 540,
          end_min: 630,
          room: 'B-204',
          credits: 3,
          semester: 'Fall 2026',
        },
      ],
    };
  }

  if (role === 'advisor') {
    return {
      user: { id: 5, username: 'advisor', name: 'Dr. Rivera', role: 'advisor' },
      csrf: 'design-preview-readonly',
      semester: 'Fall 2026',
      demo: true,
      notifications: [],
      advisees: [
        {
          id: 2,
          name: 'Alex Chen',
          consent: 1,
          record: {
            results: [
              {
                course_id: 7,
                code: 'BCS200',
                title: 'Programming II',
                percentage: 88,
                credits: 3,
                released_at: '2026-05-15T08:00:00+00:00',
                letter: 'B+',
                grade_points: 3.3,
              },
            ],
            gpa: 3.3,
            attempted_credits: 3,
            earned_credits: 3,
            programme: [{ name: 'BSc Computer Science', department: 'Engineering and Technology' }],
          },
          attendance: { items: [], rate: null },
          notes: [],
          risk_reasons: [],
        },
        {
          id: 3,
          name: 'Jordan Reed',
          consent: 0,
        },
      ],
    };
  }

  return {
    user: { id: 4, username: 'admin', name: 'Campus Registrar', role: 'admin' },
    csrf: 'design-preview-readonly',
    semester: 'Fall 2026',
    demo: true,
    notifications: [],
    governance: {
      people: [
        { id: 1, username: 'lecturer', name: 'Dr. Morgan', role: 'lecturer' },
        { id: 2, username: 'student', name: 'Alex Chen', role: 'student' },
        { id: 3, username: 'other', name: 'Jordan Reed', role: 'student' },
        { id: 4, username: 'admin', name: 'Campus Registrar', role: 'admin' },
        { id: 5, username: 'advisor', name: 'Dr. Rivera', role: 'advisor' },
        { id: 6, username: 'lecturer2', name: 'Dr. Lee', role: 'lecturer' },
      ],
      programmes: [
        { id: 1, name: 'BSc Computer Science', department: 'Engineering and Technology' },
      ],
      courses: [
        {
          id: 1,
          code: 'BCS305',
          title: 'Software Architecture',
          lecturer_id: 1,
          course_id: 1,
          credits: 3,
          capacity: 30,
          weekday: 0,
          start_min: 540,
          end_min: 630,
          room: 'B-204',
          semester: 'Fall 2026',
        },
      ],
      enrollments: [{ course_id: 1, student_id: 2 }],
      advisor_assignments: [
        { student_id: 2, advisor_id: 5, consent: 0 },
        { student_id: 3, advisor_id: 5, consent: 0 },
      ],
      audit: [
        {
          id: 1,
          actor_id: 4,
          action: 'seed_initialized',
          entity_id: 1,
          created_at: '2026-09-01T08:00:00+00:00',
          actor_name: 'Campus Registrar',
        },
      ],
    },
    finance: [
      {
        id: 1,
        student_id: 2,
        title: 'Fall 2026 tuition instalment',
        amount_fils: 450000,
        due_date: '2026-12-10',
        student_name: 'Alex Chen',
        payment_id: null,
        paid_at: null,
        status: 'unpaid',
      },
    ],
    requests: [],
  };
}
