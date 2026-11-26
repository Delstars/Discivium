# Discivium Frontend (`ui/`)

Standalone React + TypeScript + Vite frontend for the **Discivium** independent fictional UAE university management and learning platform. Built strictly against [`docs/UI_API.md`](../docs/UI_API.md) with same-origin cookie sessions, CSRF protection, multipart file uploads, real download streams, and zero external CDNs, AI services, Firebase, or client-side databases.

## Prerequisites

- **Node.js 20+** and **npm**
- **Python 3.11+** (to run the canonical local backend from the repository root)

## Build & Run Instructions

### 1. Install frontend dependencies & build production bundle (`ui/dist`)

```sh
cd ui
npm install
npm run build
```

Then start the canonical Python backend from the repository root:

```sh
cd ..
python -m prototype.app
```

Open **http://127.0.0.1:8000/ui/** in your browser. The Python backend serves the static bundle directly from `ui/dist` under `/ui/` with same-origin cookies and CSP headers.

### 2. Local development with Vite proxy

Run the Python backend in terminal 1 from the repository root:

```sh
python -m prototype.app
```

Run the Vite dev server in terminal 2 from `ui/`:

```sh
cd ui
npm run dev
```

Open **http://127.0.0.1:5173/ui/**. Requests to `/api/*` are proxied to `http://127.0.0.1:8000` with `changeOrigin: false` so same-origin checks and `SameSite=Strict` cookies function identically to production.

### 3. Run frontend unit tests

```sh
cd ui
npm test
```

## Demo Accounts (Password: `DemoOnly!2026`)

No role-switching dropdown is provided. To change roles, sign out from the account menu and authenticate as another fictional account:

| Username | Role | Scope |
| --- | --- | --- |
| `student` | Student | Alex Chen — enrolled in `BCS305` |
| `other` | Student | Jordan Reed — enrolled in `BCS306` |
| `lecturer` | Lecturer | Dr. Morgan — assigned to `BCS305` |
| `lecturer2` | Lecturer | Dr. Lee — assigned to `BCS306` |
| `admin` | Administrator | Campus governance, directory, ledger, requests, audit |
| `advisor` | Advisor | Consent-gated academic advising |

## Design Preview Mode (Opt-In Only)

By default, the application connects strictly to `/api/session` and `/api/state` and never silently falls back to mock data. If inspecting layouts without the Python server running, an explicitly labelled **Offline Design Preview Mode** is available behind a disclosure toggle on the sign-in screen; all live mutations and file downloads remain disabled in preview mode.

## Screen & Action Mapping to `docs/UI_API.md`

### Session & Global Shell

| Screen / Action | Endpoint | Method & Notes |
| --- | --- | --- |
| Boot session check | `/api/session` | `GET`, `credentials: 'same-origin'` |
| Sign in | `/api/login` | `POST` JSON `{ username, password }` -> `GET /api/state` |
| Refresh snapshot | `/api/state` | `GET`, refetched after every successful command |
| Sign out | `/api/logout` | `POST` JSON `{}`, `X-CSRF-Token` |
| Mark notification read | `/api/actions/notification-read` | `POST` JSON `{ notification_id }`, `X-CSRF-Token` |

### Student Portal

| Screen / Action | Endpoint | Method & Notes |
| --- | --- | --- |
| Overview, My Courses, Timetable, Attendance | `/api/state` | Uses `courses`, `timetable`, `record`, `attendance`, `finance`, `notifications` |
| Submit PDF/DOCX assignment | `/api/actions/submit` | `POST` multipart `assignment_id`, `file` (XHR progress + `X-CSRF-Token`) |
| Download own submission | `/api/download?id={submission_id}` | `GET` Blob download preserving `Content-Disposition` filename |
| Download course resource | `/api/resource-download?id={resource_id}` | `GET` Blob download preserving `Content-Disposition` filename |
| Post course discussion message | `/api/actions/message` | `POST` JSON `{ course_id, body }` |
| Submit course poll response | `/api/actions/form-response` | `POST` JSON `{ form_id, choice }` |
| Self-register for course | `/api/actions/register` | `POST` JSON `{ course_id }` (surfaces HTTP 409 conflicts) |
| Download fictional academic record CSV | `/api/transcript` | `GET` CSV download (`discivium-record.csv`) |
| Simulated invoice payment | `/api/actions/pay` | `POST` JSON `{ invoice_id }` (local demo confirmation dialog) |
| Create campus service request | `/api/actions/request` | `POST` JSON `{ category, subject, description }` |
| Cancel own service request | `/api/actions/request-status` | `POST` JSON `{ request_id, status: 'cancelled', note: '' }` |
| Grant / revoke advisor consent | `/api/actions/consent` | `POST` JSON `{ advisor_id, enabled: 0 \| 1 }` |

### Lecturer Portal

| Screen / Action | Endpoint | Method & Notes |
| --- | --- | --- |
| Teaching Overview, Assigned Courses, Timetable, Submission Queue | `/api/state` | Strictly scoped to lecturer's assigned courses |
| Publish assignment | `/api/actions/publish` | `POST` JSON `{ course_id, title, description, due_at, max_points, policy }` |
| Download student submission | `/api/download?id={submission_id}` | `GET` Blob download |
| Grade submission & release feedback | `/api/actions/grade` | `POST` JSON `{ submission_id, score, comment }` |
| Release immutable final course result | `/api/actions/release-result` | `POST` JSON `{ course_id, student_id }` |
| Publish PDF/DOCX course resource | `/api/actions/resource` | `POST` multipart `course_id`, `title`, `file` (XHR progress) |
| Download course resource | `/api/resource-download?id={resource_id}` | `GET` Blob download |
| Create attendance session | `/api/actions/attendance-session` | `POST` JSON `{ course_id, date, title }` |
| Mark student attendance | `/api/actions/attendance-mark` | `POST` JSON `{ session_id, student_id, status }` |
| Post course discussion message | `/api/actions/message` | `POST` JSON `{ course_id, body }` |
| Create single-question poll | `/api/actions/form` | `POST` JSON `{ course_id, title, question, options }` |
| Close poll | `/api/actions/form-close` | `POST` JSON `{ form_id }` |

### Administrator Portal

| Screen / Action | Endpoint | Method & Notes |
| --- | --- | --- |
| Campus Overview, Directory, Academics, Finance, Requests, Audit | `/api/state` | Uses `governance`, `finance`, `requests` (zero credentials returned) |
| Create fictional demo account | `/api/actions/user` | `POST` JSON `{ username, name, role, password }` |
| Create programme | `/api/actions/programme` | `POST` JSON `{ name, department }` |
| Assign student programme | `/api/actions/assign-programme` | `POST` JSON `{ student_id, programme_id }` |
| Create Fall 2026 course offering | `/api/actions/course` | `POST` JSON `{ code, title, lecturer_id, credits, capacity, weekday, start_min, end_min, room }` |
| Enroll student in course | `/api/actions/enroll` | `POST` JSON `{ course_id, student_id }` |
| Assign advisor to student | `/api/actions/assign-advisor` | `POST` JSON `{ student_id, advisor_id }` |
| Issue fictional AED invoice | `/api/actions/invoice` | `POST` JSON `{ student_id, title, amount_fils, due_date }` |
| Transition service request status | `/api/actions/request-status` | `POST` JSON `{ request_id, status, note }` |

### Advisor Portal

| Screen / Action | Endpoint | Method & Notes |
| --- | --- | --- |
| Assigned Students (consent-gated) | `/api/state` | Uses `advisees`; omits private fields when consent is 0; zero finance access |
| Add shared advising note | `/api/actions/advising-note` | `POST` JSON `{ student_id, note }` (consent enforced server-side) |
