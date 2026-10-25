# Discivium

A unified student platform for coursework and campus services.

Discivium is a four-person Software Architecture course project. Its long-term goal is to bring assignments, deadlines, academic records, registration and student finance into a coherent experience.

The name is coined and inspired by Latin *discere*, meaning "to learn." It is a project name, not a literal Latin translation. [Language reference](https://lrc.la.utexas.edu/eieol_master_gloss/latol/1).

## Current status

Planning and repository setup. The application has not been implemented yet.

## First release

The proposed first release focuses on a complete coursework journey:

- A lecturer publishes an assignment with a due date.
- An enrolled student sees upcoming deadlines and submits a text response.
- The lecturer records feedback and the student views it.
- Permission checks keep each user's records within their authorized role and course.

Academic records, registration and finance remain part of the product roadmap. Initial demonstrations of those modules will use fictional data. Discivium is an independent student prototype and has no live university integration.

## Proposed technology

Python, Django, server-rendered HTML/CSS, and SQLite for the initial local prototype. The team will record its final architecture and deployment decisions as it evaluates requirements.

## Getting started

Clone the repository, then read [the roadmap](docs/ROADMAP.md) and [the contribution guide](CONTRIBUTING.md). There are no application setup or run commands yet; add and verify them when the first runnable application is merged.

## Working together

Claim an issue before implementation, use a branch for each task, and open a pull request for another teammate to review. Keep `main` runnable once application development begins.

See [CONTRIBUTING.md](CONTRIBUTING.md), [the check-in checklist](docs/CHECK_IN.md), and [the architecture decision template](docs/decisions/0000-template.md).

Use fictional accounts and records in code, screenshots and demonstrations. Keep secrets, real student information and supplied lecture materials out of the public repository.
