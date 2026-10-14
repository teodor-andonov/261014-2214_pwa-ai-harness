# Agent instructions

This repository contains **app code**, not the user's portable workspace. The application never owns user data. Never write conversations, OAuth tokens, session credentials, project content or preferences into the repository or browser storage.

## Product principles
- On every cold launch, **ask user to select a workspace folder**. That folder is the source of truth. Copying it should restore settings, modes, chats and internal project files.
- Chat and Agent are initial **editable mode configurations**, not separate runtimes. Modes store `name`, `prompt`, and allowed `tools` as JSON in the selected workspace.
- Tool authorisation must be enforced by server-side allowed lists per response, not just user-visible buttons.
- OAuth tokens are session-only by default. Never log or commit them.
- Internal projects use relative paths resolved within the selected workspace. External project folders are explicit links and not portable.
- The UI is a PWA, backed by a localhost Node service. Do not assume a browser-only PWA can execute code on a local PC.
- Keep the code small, keep tools sandboxed/project-scoped, and require real approvals before writes. Shell execution requires an isolated worker design first.

## Development journal
Every substantial change must create a **new** `/logs/YYMMDD-HHss_short-title.md`. Include goal, implementation history, verified current state, key decisions, risks and next concrete steps. Do not invent test results.

## Checks
Run `npm test`, `node --check server.mjs`, and `node --check web/app.js`. Pay attention to path traversal, symlinks, permissions, prompt injection and OAuth scope validation.
