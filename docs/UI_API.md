# Discivium frontend integration contract

**Canonical backend:** main branch, Python 3.11+, run `python -m prototype.app` from repository root. No AI, Firebase, Supabase, Google OAuth, Google Workspace, external APIs or separate databases. The old root React/Express project is archived on `legacy-ai-studio-backup` and is not part of the current tree.

## Integration rules

Build the new React/Vite/TypeScript UI under **ui/** only. Use Vite base `/ui/`, output `ui/dist`, hash-based navigation or in-memory route state. Production build is served by the Python server at http://127.0.0.1:8000/ui/. For local development Vite proxy `/api` to http://127.0.0.1:8000 with `changeOrigin:false`, and set the dev server host to 127.0.0.1. Use relative URLs, same-origin cookies and credentials:'same-origin'. No CORS bypasses. No arbitrary role switching; logout then log in with another fictional user. Never store passwords or session tokens in localStorage. Appearance preferences alone may be stored there. Do not create a second backend or mock database.

All successful command responses are HTTP 200 JSON `{"ok":true}`. Refetch GET /api/state after mutation; never assume IDs or create client-side records. Errors: JSON `{"error":"message"}`, 400 invalid input, 401 unauthenticated, 403 forbidden/CSRF, 404 missing resource, 409 state/eligibility conflict, 413 upload too large, 500 unexpected. Show real errors and do not report success on failure. No automatic retries of mutations. All dates returned as ISO strings; deadlines entered in UAE time or ISO with an explicit timezone.

## Authentication

- GET /api/session -> {authenticated: boolean, user: {id,username,name,role} | null, csrf: string | null}
- POST /api/login JSON {username,password}; response sets HttpOnly session cookie.
- GET /api/state after login; it returns the authenticated user's complete allowed snapshot.
- POST /api/logout with X-CSRF-Token; send JSON {} and discard client state.
- All other POSTs: X-CSRF-Token from session/state; Content-Type: application/json except multipart uploads. Send no user identity or role except for intentional admin user creation. Server derives acting user from session.
- Demo accounts: student (Alex Chen, BCS305), other (Jordan Reed, BCS306), lecturer (Dr. Morgan), lecturer2 (Dr. Lee), admin, advisor. Password DemoOnly!2026. Never use real student data.

## GET /api/state

Common: {user:{id,username,name,role}, csrf, semester, demo:true, notifications:[{id,message,created_at,read_at:null|string}]}.
The following keys are present only for the indicated role. Use absent fields gracefully. IDs are numbers, booleans stored as SQLite integers may be 0/1.

**Student and lecturer:**
- courses: [{id,code,title,lecturer_id, assignments:[{id,course_id,title,description,due_at,max_points,policy,submissions:[{id,assignment_id,student_id,filename,submitted_at,late,status,name,score,comment}]}], resources:[{id,course_id,title,filename,created_at}], workspace:{messages:[{id,course_id,author_id,body,created_at,author_name}], forms:[{id,course_id,title,question,open,created_at,options:string[], my_choice?:number|null, counts?:number[]}]}, roster?:[{id,name}], attendance_sessions?:[{id,course_id,session_date,title,marks:[{session_id,student_id,status}]}], released_results?:[{student_id,percentage,released_at}]}]. Student only sees their own submissions. Lecturer only sees assigned courses. score/comment null until graded. Polls: lecturers see counts; students see their own choice.
- timetable: [{id,code,title,weekday,start_min,end_min,room,credits,semester}]. Monday=0, Sunday=6; times are minutes after midnight in UAE time.

**Student only:**
- catalogue: [{id,code,title,lecturer,course_id,credits,capacity,weekday,start_min,end_min,room,semester,occupied,prerequisites:[{id,code,title}],enrolled:boolean}].
- record: {results:[{course_id,code,title,percentage,credits,released_at,letter,grade_points}],gpa:number|null,attempted_credits,earned_credits,programme:[{name,department}]}.
- attendance: {items:[{code,session_id,session_date,title,status}],rate:number|null}. Present and late count; excused excluded; no recorded marks => null, not 0%.
- finance: [{id,student_id,title,amount_fils,due_date,student_name,payment_id:null|number,paid_at:null|string,status:'unpaid'|'paid'}]. AED = amount_fils/100. All simulated.
- requests: [{id,student_id,category,subject,description,status,decision,created_at,updated_at,student_name}].
- advising: {advisors:[{id,name,consent:0|1}],notes:[{id,student_id,advisor_id,note,created_at,advisor_name}]}.

**Admin only:** governance:{people:[{id,username,name,role}],programmes:[{id,name,department}],courses:[{id,code,title,lecturer_id,course_id,credits,capacity,weekday,start_min,end_min,room,semester}],enrollments:[{course_id,student_id}],advisor_assignments:[{student_id,advisor_id,consent}],audit:[{id,actor_id,action,entity_id,created_at,actor_name}]}; finance and requests have the same shapes as student but include institution-wide fictional records. No credentials are returned.

**Advisor only:** advisees:[{id,name,consent:0|1,record?: same shape as student record,attendance?: same shape as student attendance,notes?:[{id,student_id,advisor_id,note,created_at}],risk_reasons?:string[]}]. If consent is absent, the optional private fields are absent entirely. No finance access. Risk flags are deterministic threshold rules, not AI.

## Commands

POST /api/actions/{action}; send fields below. All IDs are numeric; forms may use digit strings. The server enforces the stated role and relationships.

| action | JSON body fields | role and behavior |
|---|---|---|
| publish | course_id,title,description,due_at,max_points,policy ('strict'/'allow_late') | assigned lecturer; published immediately; cannot publish after a final result has been released |
| submit | multipart assignment_id,file | enrolled student; PDF/DOCX max 100 MB; no duplicates |
| grade | submission_id,score,comment | assigned lecturer; valid range, only once |
| resource | multipart course_id,title,file | assigned lecturer publishes PDF/DOCX document |
| register | course_id | student; capacity, prerequisite, clash, 18-credit cap, duplicate and closed course checks |
| enroll | course_id,student_id | admin; same allocation constraints |
| release-result | course_id,student_id | assigned lecturer; all published assignments must be graded; course percentage = total earned / total available; result immutable |
| attendance-session | course_id,date (YYYY-MM-DD),title | assigned lecturer |
| attendance-mark | session_id,student_id,status ('present'/'absent'/'late'/'excused') | assigned lecturer, enrolled student; upserts mark |
| pay | invoice_id | student owns invoice; settles entire balance once; no real funds |
| invoice | student_id,title,amount_fils,due_date (YYYY-MM-DD) | admin creates fictional invoice |
| request | category ('transcript'/'enrollment_letter'/'it_support'/'general'),subject,description | student creates pending request |
| request-status | request_id,status,note (required for resolved/rejected) | admin pending->in_review/rejected, in_review->resolved/rejected; owner may cancel pending/in_review |
| consent | advisor_id,enabled (0/1) | student grants/revokes assigned advisor |
| advising-note | student_id,note | assigned advisor, consent required; note shared with student |
| message | course_id,body | enrolled student or assigned lecturer |
| form | course_id,title,question,options (array 2–8 unique strings) | assigned lecturer creates single-question poll |
| form-response | form_id,choice (zero-based index) | enrolled student; one response; open poll only |
| form-close | form_id | assigned lecturer closes poll |
| notification-read | notification_id | owner marks notification as read |
| programme | name,department | admin creates programme |
| assign-programme | student_id,programme_id | admin assigns student programme |
| assign-advisor | student_id,advisor_id | admin assigns advisor, initial consent off |
| course | code,title,lecturer_id,credits,capacity,weekday,start_min,end_min,room | admin creates Fall 2026 course; checks lecturer and room clashes |
| user | username,name,role ('student'/'lecturer'/'admin'/'advisor'),password | admin creates fictional account; password 10–128 chars |

### Downloads
GET /api/download?id={submission_id}: original document bytes, owner student or assigned lecturer.
GET /api/resource-download?id={resource_id}: original document, enrolled student or assigned lecturer.
GET /api/transcript: student-only CSV of fictional released results, not an official university document.
For downloads use a same-origin link or fetch with credentials and a Blob; preserve Content-Disposition filename. Never expose raw file content in state.

### Integration quality
A user can demonstrate all features without fabricated grades, fabricated payments, fake AI responses, Google sign-in, or role switching. Design empty states where data genuinely does not yet exist; let actions create it. Dates, charts, metrics and counts are computed only from API fields. No official CUD branding or real institution claim. Backend is local demo, not production.
