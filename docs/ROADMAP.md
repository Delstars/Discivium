# Discivium roadmap

This is a proposed roadmap for the team to validate, not a claim that these features already exist.

## Product modules

| Module | Purpose | First milestone | Later scope |
| --- | --- | --- | --- |
| Learning | Assignments, due dates, submissions and feedback | Complete academic workflow | Files, notifications and richer course content |
| Academic record | Course results, GPA and transcripts | Optional fictional record display | Validated grading policies, transcript exports and official-system integration |
| Registration | Course selection and enrollment | Optional demonstration using fictional offerings | Prerequisites, seat availability, timetable clashes and concurrent enrollment |
| Finance | Fees, invoices and payment history | Optional fictional balance display | Authorized payment-provider integration, verified payment events and reconciliation |
| Student services | Requests and staff decisions | Optional after the academic workflow | Additional request types and notifications |

First-release transcript and finance demonstrations must clearly identify their fictional data. Official records, live university access and real payment processing require separate work and authorization.

## Course delivery plan

The user confirmed the course's Week 14/15 deadlines: 4 and 11 December 2026, with a check-in at the end of the following week after 25 October. The exact check-in time and presentation slot are not recorded here. The team should verify its assigned slot and submission times.

| Period | Intended result |
| --- | --- |
| Check-in week | Validated problem, requirements, analysis models, class diagram and prioritized issues |
| 31 October to 6 November | Everyone can run the initial app; one small integrated feature |
| 7 to 13 November | Assignment publication, course visibility and due dates |
| 14 to 20 November | Submission, lecturer feedback and permission checks |
| 21 to 27 November | Failure cases, relevant tests, architecture/model alignment and report completion |
| 28 November to 3 December | Feature freeze, fixes, clean setup rehearsal and presentation practice |

## Capacity and scope rule

Four people at five to ten hours weekly provide 20–40 gross team-hours. Plan against the lower figure and reserve time for learning, integration, writing and uncertainty. A display screen is a smaller commitment than the complete business process behind it.

Finish the academic workflow before starting registration, payments or administrative workflows. If progress slips, cut optional features first. Documentation and required modelling remain part of the delivery plan.

## Architecture to evaluate

Start by evaluating a single Django application with clear internal modules against an alternative such as microservices. Record the team’s own quality requirements, evidence and trade-offs before choosing. The repository structure, diagrams and demonstrated runtime should describe the same system.
