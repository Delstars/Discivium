# Presentation and demonstration plan

Confirm the actual time limit and team order with the instructor. This is a suggested speaking structure, not evidence of who contributed. Assign sections among registered team members and have everyone rehearse all decisions.

## Suggested slides / speaking points
1. Problem, stakeholder roles and scoped solution: fragmentation of university coursework; no real university integration.
2. Requirements: FR2–FR5 and FR7; explain security and consistency with measurable quality scenarios.
3. Analysis: UC2 activity and SSD; distinguish system as black box from internal sequence; late is a flag, graded is terminal.
4. Architecture: layered modular monolith, components and deployment; compare microservices and event-driven alternatives; one authoritative database and trade-offs.
5. Patterns: Facade orchestrates submission; Strategy implements two deadline policies; Adapter encapsulates file storage; Observer persists audit/notification. Explain each cost.
6. Live demo: lecturer publishes, student uploads a real document, lecturer downloads and grades, student sees feedback. Show unauthorized account rejected. Use separate private browser windows to save time. 
7. Verification, limitations, and reflection: show GitHub Actions and tests, local-only security, deferred features, actual AI assistance and next improvements.

## Questions everyone should be ready to answer
- Why is the prototype a monolith, and what would motivate microservices?
- Why is a shared database appropriate for the transaction and what does it cost?
- How does the server prevent role switching and unauthorized grading?
- What is the difference between the SSD and internal sequence?
- Why is late a flag rather than a state?
- What happens if an observer fails after a document is stored?
- Why use a Strategy rather than a conditional for late policy?
- Where exactly are the four patterns in code?
- What was generated with AI, what did the team verify or change, and what is still outside scope?

## Rehearsal checklist
- Clone the rebuild branch on a second team member's machine and run the tests.
- Prepare a small fictional PDF and a DOCX. Test upload, download, grading and restart persistence.
- Demonstrate denied access as other / lecturer2. Do not enroll other in BCS305 before this check.
- Verify the generated report and UML PDFs visually; fill actual team contributions and signatures.
- Keep a local copy of the repository and PDFs; no Wi-Fi or API credentials required for the demo.
- Measure the quality scenarios before claiming the targets were met.

## Expanded integrated demonstration
Use the React interface at /ui/; build with npm ci and npm run build in ui first. Demonstrate student registration success (Algorithms I) and rejection (Advanced Algorithms prerequisite or HCI timetable conflict), lecturer attendance and resource upload, grade release, consent grant/revoke and audit events. Keep optional simulated finance and request workflow ready if asked. Use a disposable fresh database via --db path; do not use actual personal information. Keep the original assignment/feedback journey as the assessed core.
