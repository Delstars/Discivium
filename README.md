# Discivium — BCS305 coursework prototype

**Current implementation (main branch).** A runnable local university management and coursework system, using fictional accounts. The original Google AI Studio React/Firebase/Express implementation is archived in Discivium-test on the `legacy-ai-studio-backup` branch and removed from the active source tree. AI is excluded from the active release.

## Run the complete React + Python application (Python 3.11+, Node.js 20+)

From the repository root:
```sh
cd ui
npm ci
npm run build
cd ..
python -m prototype.app
```
Open http://127.0.0.1:8000/ui/ in a browser. The fallback HTML interface is available at http://127.0.0.1:8000/. On Windows use `py -3` instead of `python` if needed. All demo accounts share **DemoOnly!2026**. They are deliberately public and must never be used in a deployment.

| Account | Responsibility |
| --- | --- |
| lecturer | BCS305 assigned lecturer |
| student | Enrolled in BCS305 |
| other | Not enrolled in BCS305; enrolled in BCS306 |
| lecturer2 | BCS306 assigned lecturer |
| admin | Enroll students |
| advisor | Consent-controlled advising |

## Live demo

1. Sign in as lecturer and publish an assignment with a future deadline (UAE time), 30 points, strict or allow-late policy.
2. Sign out; sign in as student. Open BCS305 and upload a real small PDF or DOCX.
3. Sign in as lecturer; download the actual uploaded file, enter 27/30 and feedback, release it.
4. Sign in as student again; verify the score, feedback and notifications. Restart the server and verify persistence.
5. Demonstrate rejection: other cannot view BCS305 or download its submission; lecturer2 cannot grade it. Submit a wrong file type or duplicate; try an expired strict deadline.
6. Admin can enroll another eligible student; students grant or revoke assigned advisor access. Explore registration, attendance, academic record, simulated finance, service requests, resources, discussion and polls in the full campus dashboard.

## Tests
```sh
python -m unittest prototype.tests prototype.campus_tests -v
```
Tests cover service rules and HTTP workflows using temporary databases. For frontend verification run `cd ui && npm ci && npm test && npm run build`. GitHub Actions also exercises live Chromium mutation workflows and `python -m prototype.benchmark` (local upload/restart scenarios). See [verified finalisation evidence](docs/VERIFICATION.md). Reset the demo by stopping the app and deleting only `prototype/runtime/discivium.sqlite3` (destroys local demo data).

## UI handoff

[API contract](docs/UI_API.md) · [Google AI Studio prompt](docs/AI_STUDIO_PROMPT.md) · [Expanded architecture and documentation handoff](docs/CAMPUS_EXPANSION.md). The revised report documents both the coursework slice and the expanded campus system; final team details and review are required.

## Scope and architecture

Layered modular monolith: browser / presentation, Identity, Courses, Learning, data access and SQLite. Files are stored as BLOBs atomically with submissions. Four patterns: Facade, Strategy, Adapter, Observer. See [project design and report draft](docs/REPORT.md), [diagram sources](docs/uml), and [decision records](docs/ADR.md).

Local loopback only: Python HTTPServer is not production-grade; sessions are in memory, credentials are fictional, basic file signature validation is not malware scanning, no TLS or university integration. Expanded campus workflows include registration, attendance, released results and GPA, fictional CSV export, simulated finance, requests, advisor consent, course resources, discussion/polls, programme and account management. No AI, official transcripts, real financial processing, cloud integration or production deployment. The archived legacy UI is not a working production alternative. The React frontend is integrated; see verification evidence and latest CI status.

AI assistance: Google AI Studio generated the React frontend; ChatGPT generated the backend, refactors, tests and draft documentation from the course materials and existing repository; team must review, run tests and record actual contributions and modifications before submission. No real student data or secrets in this repository.

## Repository history and current documentation

This implementation was transferred from [Discivium-test](https://github.com/Delstars/Discivium-test/tree/33917f9957f194c8aef2a865ca38b942c724c381). Earlier planning documents and diagrams under docs/ARCHITECTURE.md and docs/diagrams/ are preserved as historical design records; the current design is documented in docs/REPORT.md, docs/ADR.md, docs/UI_API.md and docs/uml/. Original test evidence remains linked to the test repository. See CONTRIBUTING.md for team workflow.
