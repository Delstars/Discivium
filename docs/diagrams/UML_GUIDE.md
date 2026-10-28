# Discivium UML diagrams

These PlantUML files are the editable UML sources for the proposed architecture. They are design artifacts, not proof that the application has been implemented.

## Why PlantUML

PlantUML was chosen because the diagrams are stored as plain-text source files that can be reviewed, changed and versioned alongside the architecture documentation. It also supports the UML views required by the course, produces exportable PDFs and keeps the team independent of one person's local diagram editor or a proprietary project file. The source remains understandable even when a teammate cannot render the preview immediately.

PlantUML is a diagramming tool, not part of the Discivium application. Installing it only enables local preview and export; it does not install or run the project itself.

## Local installation

Each teammate who wants to preview or export the UML locally needs the following to be installed on their system:

1. A Java Development Kit (JDK), version 17 or newer (regardless of distribution; Temurin, OpenJDK, etc.).
2. Graphviz, which PlantUML uses for some component and deployment layouts.
3. The **PlantUML** extension for Visual Studio Code by jebbs.

Verify the command-line prerequisites in a new terminal:

```powershell
java -version
dot -V
```

Both commands should print version information. On macOS or Linux, the equivalent commands are the same in a terminal. If either command is not recognized, install the missing tool and restart Visual Studio Code so it can find the updated `PATH`.

The repository does not need to contain the JDK, Graphviz installation or PlantUML extension. Only the `.puml` source files and this guide belong in version control.

## VS Code extension guide

Install the **PlantUML** extension by **jebbs**. Its extension identifier is `jebbs.plantuml`.

### Install from the Extensions view

1. Open the Extensions view in Visual Studio Code with `Ctrl+Shift+X`.
2. Search for `PlantUML`.
3. Choose the extension published by `jebbs`.
4. Select **Install**.
5. Reload Visual Studio Code if it asks you to do so.

### Install from the command line

If the Visual Studio Code `code` command is available, run:

```powershell
code --install-extension jebbs.plantuml
```

The extension does not replace the JDK or Graphviz. It provides the editor preview and export commands, while PlantUML uses the installed Java and Graphviz tools to render the diagrams.

The extension is a recommended team tool, not an application dependency. Do not add personal Visual Studio Code settings or an extension installation to the application architecture; record only shared setup guidance here.

## Preview a diagram

1. Clone or pull the repository.
2. Open the repository folder in Visual Studio Code.
3. Open any `.puml` file in this directory.
4. Open the Command Palette with `Ctrl+Shift+P`.
5. Run **PlantUML: Preview Current Diagram**.

The preview is local to the teammate's computer, while the `.puml` source is shared through Git. Editing a source file and committing it lets the rest of the team review the same change.

## Export for submission

When a diagram has been reviewed and approved, use **PlantUML: Export Current Diagram** from the Command Palette and choose PDF. Store exported files in `docs/diagrams/exported/` if the team decides to commit them. Keep the `.puml` source as the authoritative editable version; the PDF is an output for review or course submission.

Do not commit a local PlantUML JAR, JDK, Graphviz installation or personal editor settings unless the team later agrees to manage those tools from the repository.

## Pull-request visual review

For a quick visual review, export the changed diagrams to PDF or PNG on the feature branch and include those files in the pull request. Reviewers can inspect the rendered diagrams directly without installing PlantUML or reading the `.puml` source line by line.

Generated exports are review aids, not the source of truth. Do not merge them into `main` by default. The editable `.puml` files remain the required change; merge exported files only when the team or course submission process explicitly approves keeping them in the repository. If an export is included temporarily for review, remove it before merging unless that approval has been given.

## Troubleshooting

- Preview command missing: confirm the PlantUML VS Code extension is installed and reload the window.
- `java` not recognized: install a JDK and restart Visual Studio Code.
- `dot` not recognized: install Graphviz and restart Visual Studio Code.
- Diagram opens but layout is incomplete: confirm Graphviz is available on `PATH` and retry the preview.
- Team sees different output: compare the `.puml` source and tool versions before changing the diagram; do not fix a rendering difference by editing only an exported PDF.

## Recommended review order

1. `components.puml` confirms module ownership and allowed dependencies.
2. `deployment.puml` confirms where the first-release prototype runs and stores data.
3. `use-cases.puml` confirms who uses the system and which actions are first-release or future scope.
4. `submit-assignment-activity.puml` confirms the business decisions and failure paths for file submission.
5. `system-sequence-submit-assignment.puml` confirms the system's public operations while treating the system as one black box.
6. `submit-assignment-sequence.puml` confirms the internal runtime request flow and the boundary between modules.
7. `domain-model.puml` confirms entities, ownership and relationships.
8. `assignment-submission-state.puml` confirms the states currently supported by the workflow.

## Editing rules

- Treat `docs/ARCHITECTURE.md` as the source for names, ownership and dependency decisions.
- Update the affected UML source and architecture text together when a boundary or relationship changes.
- Use solid shapes and arrows for first-release behavior; use gray shapes or dashed arrows for future proposals.
- Do not add a future module to the first-release workflow diagrams unless the scope is formally changed.
- Keep fictional data, external integrations and real payment processing clearly marked as outside the first release.
- Retain the `.puml` files in version control and export readable PDFs for course submission using the team's chosen PlantUML toolchain.

## Review checklist

- [ ] Every module in the architecture and roadmap has an appropriate component boundary.
- [ ] Every dependency arrow has a reason and does not imply direct writes to another module's records.
- [ ] The deployment diagram matches the documented local setup and storage rules.
- [ ] Use cases match the permission matrix.
- [ ] Activity and sequence diagrams match the workflow rules and request-flow evidence.
- [ ] The system sequence diagram treats Discivium as one black box and does not expose internal components.
- [ ] Domain entities and relationships match the architecture's domain model.
- [ ] State diagrams include only agreed behavior; unresolved policies remain marked as decisions.
- [ ] A teammate who did not create the diagram can explain it.
