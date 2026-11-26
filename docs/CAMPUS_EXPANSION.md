# Expanded campus release — documentation handoff

This is a scope update after the original coursework report. The original fifteen UML sources describe the tested coursework slice. The revised REPORT.md and ten additional campus UML views cover the expanded system; inspect the final exports and add verified team details before submission. The report is still a draft; actual signed contribution statements and final team review are outstanding. Verified local performance measurements are in VERIFICATION.md.

## Active modules and responsibilities

| Module | Owns | Interfaces |
|---|---|---|
| identity.py | Users, authentication, in-memory session | authenticate, resolve, logout |
| courses.py | Course membership and lecturer relationship | require_student, require_lecturer, visible |
| learning.py | Assignment, submission, feedback, policies, file adapter | LearningFacade and LearningRepository |
| resources.py | Course document bytes and metadata | create, list, download |
| registration.py | Seat allocation and academic schedule | register, admin_enroll, catalogue, timetable |
| academic_records.py | Released course results, credit-weighted GPA | release, record |
| attendance.py | Sessions and attendance marks | create, mark, student_record |
| finance.py | Fictional invoices and settlements | issue, pay, ledger |
| student_services.py | Request lifecycle | create, change, list |
| advising.py | Assignment, consent, shared notes, threshold flags | consent, note, students, student_view |
| workspace.py | Internal discussions and polls | message, form, respond, close, read |
| governance.py | Programmes, offerings, accounts, advisor assignments, audit reads | administrative commands |
| api.py | Role-specific read snapshot, command dispatch | snapshot, command |
| app.py / views.py | HTTP transport, transaction boundaries, fallback HTML | JSON routes, forms, files |
| db.py / campus_schema.sql | Connection, schema, seed and persistence | SQLite transaction |

The browser calls HTTP endpoints; presentation invokes CampusAPI; application commands invoke feature services; services enforce server-side roles and relationships; SQLite is the shared transactional repository. Learning's SQL is moved into LearningRepository, while several newer service classes use parameterized SQL directly (pragmatic separation, not strict clean architecture). The four named patterns remain in the coursework workflow. In-process synchronous observers persist audit/notifications inside the transaction for many campus mutations. Notification-read is intentionally not audited.

New state machines worth drawing: ServiceRequest (pending -> in_review -> resolved/rejected, pending -> rejected, pending/in_review -> cancelled); Invoice (unpaid -> paid); Poll (open -> closed); AdvisorConsent (not granted <-> granted). Final grades are immutable in prototype. No AI, official university integration, real financial processing, production security or institutional rollout. Demo semester is fixed to Fall 2026; timetable and thresholds are fictional course rules, not verified university policy. Single-question polls, course discussions and CSV export are intentionally scoped rather than full commercial services.

Frontend: backend and fallback interface are committed; the React UI was integrated on main and independently verified through build and role-navigation tests. See UI_API.md and AI_STUDIO_PROMPT.md. Testing and report export evidence must be checked for the current commit; previous green runs do not certify later changes.

Repository layout: main is the clean current implementation; the source development repository Discivium-test preserves the legacy-ai-studio-backup and ui-redesign branches. The verified release was imported from Discivium-test commit 33917f9957f194c8aef2a865ca38b942c724c381; historical planning records remain in this repository.
