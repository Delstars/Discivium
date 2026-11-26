# Discivium
## BCS305 — Software Architecture course project
Draft for team verification • Fall 2026 • Canadian University Dubai

**Team:** [insert registered team number and names]  
**Instructor:** Dr. Khaled Ammar  
**Repository:** https://github.com/Delstars/Discivium-test

This report describes the expanded Discivium local demonstration, including the React presentation and Python campus modules. The original coursework slice remains the primary assessed vertical workflow. It is not a claim that the full university platform is complete or that every proposed quality target has been measured. Replace bracketed fields with verified team information before submitting.

## 1. Introduction and problem statement

Students and lecturers may need separate tools for coursework, deadlines, academic records and campus services. Fragmented workflows create avoidable context switching and make it harder to track the status of assignments and feedback. Discivium proposes a unified university portal for a UAE university context. The implemented release focuses on the coursework journey: a lecturer publishes an assignment, an enrolled student uploads a document, the lecturer downloads and grades it, and the student sees the feedback. Administrators can enroll students. The advisor interface explicitly states that advising is not implemented.

Implemented scope: authenticated student, lecturer, administrator and consent-controlled advisor portals; coursework and resources; registration and timetable; attendance and released academic records; simulated finance; campus requests; internal discussion and polls; programmes, accounts, assignments and audit. Scope exclusions: real university integration, real payments, official transcripts, AI, cloud deployment and production security. The prototype uses fictional data, and no stakeholder interviews or institutional adoption are claimed.

## 2. Stakeholders and requirements

| Stakeholder | Interest | Architectural implication |
|---|---|---|
| Student | Reliable submission and private feedback | Ownership checks; persistent submission bytes |
| Lecturer | Publish, review and grade their courses | Relationship-based authorisation |
| Administrator | Maintain enrollments | Restricted admin operations |
| Advisor | Appropriate access to academic progression | Assigned advisor and student-granted consent; deterministic risk thresholds |
| University IT / assessor | Reproducible, explainable, secure design | Local setup, documentation, traceability |

### Functional requirements

| ID | Testable requirement | Source |
|---|---|---|
| FR1 | Authenticate a fictional account and resolve role on the server; reject invalid credentials. | All actors |
| FR2 | Assigned lecturers can publish an assignment with title, description, timezone-aware deadline, maximum score and policy. | Lecturer |
| FR3 | An enrolled student can submit one PDF or DOCX of up to 100 MB; reject invalid type, duplicate and strict late submission. | Student |
| FR4 | A lecturer assigned to the course can download the submitted bytes and grade once within 0 to maximum points, with feedback. | Lecturer |
| FR5 | Students can see their own released grade and feedback but not another student's submission. | Student |
| FR6 | Administrators can enroll a student; others cannot perform this operation. | Administrator |
| FR7 | Publish, submit and grade produce persistent audit events and recipient notifications in the same transaction. | University IT |
| FR8 | Users can view permitted coursework and download authorised documents only. | Student / lecturer |
| FR9 | Students register and admins enroll only when prerequisites, capacity, timetable, credit cap and course closure rules permit. | Student / administrator |
| FR10 | Assigned lecturers create attendance sessions and record enrolled student marks; students view their own rates. | Lecturer / student |
| FR11 | Assigned lecturers release immutable results from graded assignments; students see credit-weighted GPA and export fictional records. | Lecturer / student |
| FR12 | Admin issues fictional invoices; owner student settles once; both see ledger. | Administrator / student |
| FR13 | Student creates/cancels service requests; admin processes legal status transitions and records decisions. | Student / administrator |
| FR14 | Assigned advisor sees private records only with active consent; can add shared notes; student revokes access. | Student / advisor |
| FR15 | Assigned lecturer publishes documents and polls; enrolled users read resources and discuss; students respond once. | Lecturer / student |
| FR16 | Admin manages demo accounts, programmes, course offerings, advisor assignments and audit. | Administrator |
| FR17 | Owners can mark notifications read; browser uses real server session and validates response. | All users |

### Quality attribute scenarios

The scenarios below specify acceptance criteria; observed local verification is recorded in section 8. Source, stimulus, artefact, environment, response and measure are explicit.

| Attribute | Source and stimulus | Artefact and environment | Response and measure |
|---|---|---|---|
| Security | Unenrolled student requests another course's submission | Learning facade; logged in locally | Reject with 403; no file bytes returned or writes in every attempted test |
| Performance | Student uploads a 1 MB PDF | Local server and SQLite; one active user | Store and confirm; target 95% within 3 seconds over 20 runs |
| Reliability | Observer fails after document storage | Submission transaction; simulated exception | Roll back all writes; zero partial records in fault-injection test |
| Modifiability | Lecturer requests another deadline rule | Learning module; development | Add policy implementation and registration without changing the submit workflow; one new class plus registration |
| Availability | Team restarts process | Local deployment; database file intact | Server restarts and previously committed data is readable; target within 30 seconds in rehearsal |

Constraints: local loopback, fictional records only, no third-party runtime packages, 100 MB maximum document, deadline input UAE time, fixed seeded roles. No production availability or scalability guarantee.

## 3. Planning and development process

Incremental development is selected: requirements and models establish boundaries, then a vertical workflow proves them, then failure paths and documentation are aligned. This suits a small team and short course deadline; unlike a single waterfall delivery, each increment can be reviewed independently.

Actual evidence: the original Discivium repository documents an initial planning and architecture baseline, the AI Studio test scaffold commit is dated 23 November 2026, and the architecture rebuild was initiated 25 November 2026. The original roadmap records presentation sessions 4 and 11 December. The requested internal completion target is Friday 27 November. No unverified team activity is represented as completed.

| Period | Status / next action |
|---|---|
| Original planning period | Existing roadmap, UML sources and architecture proposal available |
| 23 November | AI Studio scaffold recorded in Git |
| 25 November | Rebuild branch, coursework implementation, expanded campus modules and draft model set; 17 Python tests passed |
| 26 November | AI Studio React frontend committed; independent CI verified build, seven formatter tests, and four-role live browser navigation; finalisation refactors and documentation revisions initiated |
| 27 November | Planned team-machine rehearsal, review signatures and submit package; confirm official slot |
| Assigned presentation | Confirm team slot and Moodle deadline; every member rehearses |

## 4. Analysis models

Use-case diagram (UC1–UC8), activity for UC2, separate black-box SSDs for UC1, UC2 and UC3, and submission state machine are in the appendix. Logical observer work in the activity is shown as a fork/join of independent required effects; the implementation invokes observers serially inside a single transaction. This deliberately does not claim parallel runtime execution.

### UC1 — Publish assignment (FR2, FR7)
Actor: assigned lecturer. Goal: make coursework visible to enrolled students. Preconditions: authenticated; lecturer assigned to course. Main: (1) select course; (2) enter title, description, deadline, points, policy; (3) system validates role, relationship and fields; (4) system creates assignment, audit event and notifications; (5) commit and show assignment. Alternative: lecturer chooses strict or allow-late policy. Exceptions: wrong lecturer -> 403; invalid fields -> 400; write failure -> rollback. Postconditions: assignment visible and required events committed.

### UC2 — Submit assignment (FR3, FR7)
Actor: enrolled student. Goal: submit an actual document. Preconditions: authenticated and assignment exists. Main: (1) view course; (2) choose assignment and document; (3) system checks session, membership, file, policy and duplicates; (4) create submission and store bytes; (5) record audit and notify lecturer; (6) commit and display submitted status. Alternative: allow-late policy accepts and marks late. Exceptions: missing membership -> 403; invalid document -> 400; strict late/duplicate -> 409; storage or event failure -> rollback. Postconditions: one submission with real document and persistent audit/notification, or no partial change.

### UC3 — Release feedback (FR4, FR5, FR7)
Actor: assigned lecturer. Goal: release scored feedback. Preconditions: authenticated; ungraded submission exists; course assignment. Main: (1) view submissions; (2) download and review document; (3) enter score and comment; (4) validate lecturer, range and state; (5) create feedback, set state graded, notify student and audit; (6) commit and show feedback. Alternative: no alternative success path; score can be any integer within range. Exceptions: wrong lecturer -> 403; invalid score/comment -> 400; already graded -> 409; write failure -> rollback. Postconditions: student sees released feedback, no second grade.

### UC4 — Register for a course (FR9)
Actor: student; preconditions: authenticated, current offering exists. Main: browse catalogue; choose course; validate eligibility and available seats in the transaction; insert enrollment; audit and notify; refresh timetable. Alternatives/exceptions: already enrolled/passed, prerequisite missing, timetable overlap, capacity reached, credit cap or closed course -> 409 with no enrollment. Postcondition: exactly one new enrollment, or no change. Admin enrollment uses the same allocation rules with an explicit student ID.

### UC5 — Process campus service request (FR13)
Actors: student and administrator. Student submits category, subject and description; system creates Pending and notifies admin. Admin moves Pending to InReview or rejects; InReview can resolve or reject with decision; owner may cancel Pending/InReview. All invalid transitions rejected with 409; unauthorized actors receive 403. Postcondition: persisted state, decision where required and audit/notification.

### UC6 — Consent-controlled advising (FR14)
Actors: student and assigned academic advisor. Student grants consent; advisor fetches assigned student snapshot; server returns released record and attendance only if consent is active; advisor records shared note. Student revokes consent; subsequent advisor snapshot omits private fields and note writes are denied. Without consent, no private records are sent. Postcondition: consent and notes persisted, and authorized data only.

### Additional use cases (FR10–FR17)
Attendance session/mark, released result/GPA, issue and settle demo invoice, publish/download resource, course discussion, create/respond/close poll, programme and account management, notification read and audit search are represented in the expanded use-case and component diagrams. The original three detailed use cases remain the presentation's primary learning workflow.

### Model consistency

Student and lecturer are external actors; Discivium is the system lane. SSDs show only external requests/responses, while the internal sequence exposes components. State-changing learning operations are publish, submit and grade; publish creates an assignment, submit creates Submitted and grade transitions to Graded. Reading and downloading are non-mutating. Graded is terminal; late is a flag rather than an independent state. Enrollment is a separate allocation record; request, invoice, poll and consent state models document the expanded modules. A final result is immutable. Model vocabulary follows the code and database, not the legacy UI.

## 5. Domain and structural models

The coursework domain model remains the detailed view of User, Course, Enrollment, Assignment, Submission, Feedback, Notification and AuditEntry. The campus extension model adds Offering, Prerequisite, CourseResult, AttendanceSession/AttendanceMark, Invoice/Payment, ServiceRequest, AdvisorAssignment/AdvisingNote, Resource, CourseMessage, CourseForm/FormResponse, Programme and NotificationRead. Conceptual classes exclude storage keys and service operations; the implementation class diagrams show attributes, operations, associations and multiplicity. A course has one assigned lecturer, zero or one offering in this prototype, many enrollments, assignments and resources; a student has one enrollment per course, at most one submission per assignment, at most one feedback per submission and one released result per course. An invoice has zero or one settlement; a poll has at most one response per enrolled student. Consent is per student-advisor assignment, initially disabled.

| Component | Responsibility / implementation |
|---|---|
| React presentation | ui/src/App.tsx, AppShell, role feature components, AppContext, typed apiClient; browser only |
| HTTP application boundary | prototype/app.py (session, CSRF, HTTP, transaction), api.py (CampusAPI snapshot/command) |
| Identity / courses | identity.py, courses.py; session and relationship checks |
| Learning / resources | learning.py (Facade, Strategy, Adapter, Repository), resources.py |
| Registration / records / attendance | registration.py, academic_records.py, attendance.py |
| Finance / requests | finance.py, student_services.py |
| Advising / workspace | advising.py, workspace.py; consent and membership constraints |
| Governance | governance.py; programme, account, offering and assignment operations |
| Persistence / observers | db.py, campus_schema.sql, LearningRepository, SQLiteFileAdapter, EventBus and observers |

The application is a layered modular monolith, not microservices: one Python process, one authoritative SQLite store, in-process service interfaces, browser requests over loopback HTTP. Learning SQL is isolated in LearningRepository; newer service modules still perform parameterised SQL directly, and CampusAPI coordinates role-specific snapshot reads. This is a pragmatic limitation, not strict clean architecture. The original fallback HTML remains available; the assessed UI is React built by Vite and served from ui/dist on the same origin. In deployment the browser holds no authoritative records and no database credentials. The 4+1 views are represented by logical domain/class, process interactions (single runtime), development components, physical deployment and use cases. The expanded component, class and deployment diagrams show the actual feature modules; the coursework class diagram preserves the four pattern implementations.

Consistency checks: FR9 maps to RegistrationService and UC4; FR13 to StudentServices and its lifecycle; FR14 to AdvisingService and consent state; FR2–5 to LearningFacade and the existing detailed sequence diagrams. CampusAPI dispatches explicit command names; no client-side role selection. Observer effects are synchronous and transactional, not a distributed broker.

## 6. Architectural analysis and trade-offs

Candidate A: layered modular monolith, one deployable backend runtime, in-process interfaces, shared relational store and a separate browser presentation. Candidate B: microservices, separate deployed identity/course/learning services and network interfaces. Candidate C: event-driven architecture, components exchanging events asynchronously. Observer is used within A, not a claim of distributed event-driven deployment.

| Criterion | A: layered monolith | B: microservices | C: asynchronous events |
|---|---|---|---|
| Security | Central session and service permission checks; fewer exposed interfaces | More service credentials and network boundaries | Must secure broker, publishers and subscribers |
| Performance | In-process calls; no network latency; SQLite single writer | Network and serialisation overhead | Fast acknowledgement possible, but eventual processing |
| Reliability | One transaction covers file, submission, audit | Distributed consistency requires orchestration | Durable broker and idempotency required |
| Modifiability | Explicit module seams; shared release | Independently deployable services | Decoupled handlers, harder end-to-end tracing |
| Availability | One process is a single failure point | Potential isolation, additional infrastructure | Broker dependency; recovery and backlog issues |
| Team effort | Local Python, no external runtime dependencies | Multiple deployments and contracts | Broker and event schema management |

Decision: A best supports the local deadline, reproducibility and atomicity requirements; accept the single-process bottleneck. The alternatives may become appropriate if independently measured workload or availability needs demand them. No benchmark is claimed.

Tactics: server-side session validation and relationship checks (security, adds query cost); transaction with immediate write lock (consistency, serializes writes); separated policies and storage interface (modifiability, adds indirection); persistent local store (restart recovery, not high availability). See ADR.md for three recorded decisions.

## 7. Design patterns applied

Each pattern has an actual call site in learning.py and a corresponding class diagram.

| Pattern | Problem | Implemented solution | Consequence |
|---|---|---|---|
| Facade (structural) | Handler would coordinate several learning operations | LearningFacade.submit coordinates CourseService, repository, validation, policy, storage and events | Simple web interface; facade can grow and needs decomposition |
| Strategy (behavioural) | Deadlines have different business rules | DeadlinePolicy.evaluate implemented by StrictDeadlinePolicy and AllowLatePolicy, selected by assignment policy | New rules isolated; policy registration and tests required |
| Adapter (structural) | Learning should not depend on SQLite BLOB API | SQLiteFileAdapter implements FileStorage.save/load by translating to parameterised SQL | Replacement interface; cloud adapter would need a different transaction strategy |
| Observer (behavioural) | Audit and notifications react to learning actions | EventBus.subscribe/publish invokes AuditObserver and NotificationObserver via update | Learning does not name individual observers; synchronous observer failure rolls back transaction |

Factory Method and Singleton were not forced into the solution: no complex creation family or shared global instance is required. Observer protocol is structural (duck typing in Python).

## 8. Prototype and verification

From repository root: cd ui; npm ci; npm run build; cd ..; python -m prototype.app. Open http://127.0.0.1:8000/ui/. Python 3.11+ and Node.js 20+ are required for a fresh build. Use fictional accounts and DemoOnly!2026. The React/Vite/TypeScript interface is served by Python from ui/dist; browser and API share origin, cookie session and CSRF token. The original AI Studio scaffold is archived on legacy-ai-studio-backup. Python's standard library and SQLite reduce installation and cloud dependencies; React gives component reuse and typed API contracts without introducing a second backend. This trades away production framework protections and availability.

Implemented workflows are listed in FR1–FR17. Real document bytes are saved as BLOBs, mutations run under SQLite transactions, and synchronous audit/notification observers share the transaction. Basic PDF/DOCX signature checks are not malware scanning. Shared fictional passwords, loopback HTTP, in-memory sessions, single process, demo semester/rules and no rate limiting are deliberate prototype constraints. No actual payments, official transcript, AI or university integration.

| Requirement | Implementation and evidence |
|---|---|
| FR1–FR8 | IdentityService, LearningFacade, CourseService, LearningRepository, EventBus; Python permission, validation, persistence, rollback and HTTP workflow |
| FR9 | RegistrationService; prerequisite, duplicate and timetable rejection tests |
| FR10–11 | AttendanceService, AcademicRecordsService; role, released result and GPA tests |
| FR12–13 | FinanceService, StudentServices; ownership, repeat settlement and lifecycle tests |
| FR14 | AdvisingService; consent revocation and note visibility test |
| FR15 | ResourceService, WorkspaceService; ownership, resource bytes, poll duplicate and message tests |
| FR16–17 | GovernanceService, CampusAPI; account, programme, privacy and notification tests |
| React integration | Independent Node install, TypeScript/Vite build, seven formatter tests and live Chromium logins/navigation across four roles; screenshot artifacts |

Verified evidence: 17 Python tests passed in GitHub Actions run 45622890329 on commit ff6d747f8e65a3310ccf13c8401f5c3136c85979. React integration run 45786330671 on the isolated verification branch for AI Studio commit 01f7d924950499946ee4b4e9f47b235ce68b7226 succeeded; browser screenshots are artifact 15100008126. These browser tests verify login/navigation, not every mutation. Finalisation CI run 45787922244 on commit 197760ee2ba75cea57d2984aa67e0c1672431e9c passed 17 Python and 10 frontend tests, TypeScript/Vite build, four-role browser login/navigation and integrated mutation scenarios. A lecturer published an assignment; a student uploaded it; lecturer downloaded identical bytes, graded and released the result; student viewed feedback and registered, settled a simulated invoice, granted/revoked consent; advisor recorded a shared note; administrator audit contained the expected actions. Browser testing does not cover every feature permutation. Manual DOCX sample, team-machine rehearsal and signature verification are still outstanding.

### Measured quality scenarios

Run 45787922244 also executed prototype/benchmark.py on a single GitHub-hosted Linux runner over loopback HTTP, with a disposable SQLite database and one active upload at a time. The payload was a synthetic 1 MiB file with PDF header and footer, not a real-world document corpus. Measurements include full HTTP request/response time; restart time includes process startup, authentication and reading stored submissions.

| Scenario | Acceptance target | Observed | Outcome |
|---|---|---|---|
| Upload latency | At least 19 of 20 uploads within 3 s | 20/20; median 0.0169 s; empirical p95 0.0629 s | Met in this environment |
| Restart recovery | Restart and read within 30 s | 0.3328 s; 20/20 committed submissions still readable | Met in this environment |
| Security | Reject cross-course/unauthorized access | Automated permission and consent revocation tests passed | Met for tested cases |
| Reliability | No partial write after observer failure | Fault-injection rollback test passed | Met for tested case |
| Modifiability | New strategy plus registration; no change to submit algorithm | Existing two policy implementations and selection demonstrate design; third-policy change not timed | Structural evidence only |

These are single-run prototype measurements, not production throughput, concurrent-user capacity or an availability SLA. Reproduce with `python -m prototype.benchmark` and `python -m unittest prototype.tests prototype.campus_tests -v`.

Evidence links: https://github.com/Delstars/Discivium-test/actions/runs/45787922244 and https://github.com/Delstars/Discivium-test/actions/runs/45787921976. The second run successfully generated the 34-page report draft and 25-page standalone UML appendix in A3 landscape; later report revisions may alter the page count.

## 9. Reflection

The initial prototype emphasized breadth and interface presentation rather than actual authoritative persistence. The rebuild instead prioritizes a demonstrable vertical workflow and consistent security boundaries. The later increment integrated a separate React presentation and expanded campus services. A future iteration should introduce a production web framework, move residual SQL to repositories, add stronger validation and deployment security, make the semester configurable and validate institutional rules with real stakeholders. Scope reductions and unmeasured quality targets are explicitly acknowledged.

## 10. Contribution statement and AI use

Complete this with actual contributions and signatures; do not invent participation.

| Team member | Actual contribution / evidence | Signature |
|---|---|---|
| [Name] | [Tasks, commits, reviews] | [Sign] |
| [Name] | [Tasks, commits, reviews] | [Sign] |
| [Name] | [Tasks, commits, reviews] | [Sign] |
| [Name if applicable] | [Tasks, commits, reviews] | [Sign] |

Google AI Studio generated the earlier prototype and the later React frontend. ChatGPT inspected the project brief, lecture materials and two repositories, generated the rebuild code, tests, model sources, ADRs and this report draft. ChatGPT also reviewed the generated UI, verified builds and browser navigation, and produced finalisation refactors and updated diagrams. The team must record its actual review, edits, validation and individual contributions. The team remains responsible for explaining every diagram, pattern and decision.

Course references: BCS305 official project description; Modules 02 (SDLC), 03 (Requirements Engineering), 04 (System Analysis Models), 06 (Structure, Interaction & Views), 07 (Architectural Design), 09 (Quality Attributes, Trade-offs & Styles), 11 (Design Patterns in Python), and Week 6 Model Set Studio. No lecture files are redistributed in the repository.

## Appendix — UML diagram set

See docs/uml for editable PlantUML sources. Export using the instructions in docs/EXPORT.md. 
