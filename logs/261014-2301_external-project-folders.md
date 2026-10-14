# External project folders and Windows launcher — 14 October 2026

## Goal and clarified design
The initial selected folder is solely **the harness data folder** (conversations, project definitions, configuration, attachments and modes). Actual project files live **outside** it. One project may point to several external folders, each with separate read or read/write grants. The app remains a PWA with a Node.js localhost process.

## Changes
- Removed the new-project behaviour that generated an internal `projects/files/<id>` directory.
- Added multiple folders with stable IDs and explicit per-folder permissions to each project definition.
- Added project create/edit interface for adding/removing folders and changing permissions.
- File tools now require a granted `folder_id`, and the server enforces grants at execution time. Write permission is rechecked after user approval.
- Prevented a project folder from overlapping the entire harness workspace to avoid exposing its chat/configuration data through project tools.
- Kept legacy conversation/project IDs. Older internal project files aren't deleted or automatically exposed; they require manual relocation/relinking.
- Updated tests for two external roots, independent permission changes, workspace separation, invalid grants and preserved conversation association.

## How start.cmd fits
`start.cmd` is a Windows convenience launcher. It checks Node.js, opens the browser URL, and starts `server.mjs`. The frontend is still an installable PWA; the local backend is necessary for filesystem operations and eventually sandboxed terminal commands. No external web hosting is required for desktop-local use. Later packaging could replace the launcher while retaining the web UI.

## Decisions
- Treat external project references as part of portable **configuration**, not portable project content.
- Grant permissions both at mode/tool level and at project/folder level. Every file write needs approval.
- Keep the one-folder rule for **application data**, not for everything the agent can interact with.
- Don't infer permissions for legacy internal folder references.

## State and next steps
The changes are staged for Windows/Linux CI smoke and syntax tests. Live OpenAI sign-in, streaming and model tool invocation remain unverified. Next, test a multi-folder project on Windows, audit OS-level sandbox boundaries, and improve write approvals to show full diffs. Add folder-remapping UI when moving the workspace between computers.
