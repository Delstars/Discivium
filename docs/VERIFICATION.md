# Finalisation verification — 26 November 2026

Verified code commit: 197760ee2ba75cea57d2984aa67e0c1672431e9c. [Frontend and quality run](https://github.com/Delstars/Discivium-test/actions/runs/45787922244) and [PDF export run](https://github.com/Delstars/Discivium-test/actions/runs/45787921976) both succeeded.

- 17 backend regression tests; 10 frontend formatter and API validation tests; production build passed.
- Live Chromium authenticated all four role accounts, exercised visible navigation and lecturer tabs, checked mobile root overflow, and generated screenshots.
- Additional UI workflow verified real assignment publication, upload/download byte equality, grade and final result release, feedback visibility, course registration, simulated settlement, advisor note and consent revocation, and audit entries.
- Benchmark: synthetic 1 MiB PDF-header payload, sequential loopback uploads on single GitHub-hosted Linux runner. 20/20 within 3 seconds; median 0.0169 s; p95 0.0629 s. Restart, authentication and reading records took 0.3328 s; all 20 submissions persisted. No production or load-testing claims.
- 25 UML sources exported; standalone appendix uses A3 landscape for readability.
- Outstanding: actual team contributions/signatures, team-machine rehearsal, a real DOCX sample, and exhaustive browser testing beyond the covered workflows.

The earlier frontend refactor initially failed TypeScript unused-import checks. Imports were cleaned up, and subsequent builds and regression checks succeeded. No verified application code was overwritten by untested changes on main.
