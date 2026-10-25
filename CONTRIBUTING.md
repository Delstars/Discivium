# Contributing to Discivium

## Claim work before coding

Create or claim an issue with one accountable owner, another teammate as reviewer, acceptance criteria and dependencies. Keep tasks small enough to produce a reviewable result within one or two working sessions. If your task depends on another change, agree its interface before coding independently.

Use a board with Backlog, Ready, In progress, Review and Done. Each person should keep one implementation task in progress at a time.

## Work in your own clone

Each teammate uses a separate local clone and local database. Exchange changes through GitHub. Do not edit one shared cloud-synced working folder together.

For a new task, begin with a clean working tree:

```sh
git status
git switch main
git pull --ff-only origin main
git switch -c feat/23-submit-response
```

After editing, run the appropriate project checks, inspect `git diff`, stage the intended files, commit, and push the branch. Open a pull request to `main` and link the issue. Prefer a short-lived branch per task over permanent branches per person.

## Review and integration

Another teammate reviews the acceptance criteria, permissions, failure cases and consistency with the architecture. Explain what you checked and what remains incomplete. Do not approve a change you cannot explain.

Coordinate changes to shared models, migrations, configuration, dependencies and common layouts. Update a feature branch with current `main` before merging when needed:

```sh
git fetch origin
git merge origin/main
```

Start the merge with committed task work and a clean working tree. If conflicts occur, agree the combined result with the other author, remove the conflict markers, stage the resolved files and complete the merge. Run checks on the combined result before pushing. Avoid force pushes in the shared workflow.

Prefer squash merge for completed tasks. A task is Done after review, relevant checks, merge, a working demonstration and any necessary model/documentation updates.

## Local data and secrets

Commit database migrations and fictional seed data. Keep local database files, uploaded files, environments and credentials out of Git. Provide `.env.example` with placeholders when configuration is introduced.

Use the same agreed business rules, identifiers, field names and timezone across modules. Do not trust a browser-supplied user ID to establish authorization.

## Team rhythm

Hold a short weekly planning session, demonstrate integrated work each week, and report blockers promptly. Plan against five hours per person per week; extra time provides buffer before it adds features. Everyone contributes to code, design, review and presentation.

Record actual design decisions in `docs/decisions/`, contributions in `docs/CONTRIBUTIONS.md`, and AI assistance in `docs/AI_USE.md`. Each member must understand and defend their work.
