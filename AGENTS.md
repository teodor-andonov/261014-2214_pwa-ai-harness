# Agent instructions

This repository contains **app code**, not the user's portable workspace. The application never owns user data. Never write conversations, OAuth tokens, session credentials, project content or preferences into the repository or browser storage.

## Product principles
- On every cold launch, **ask user to select a workspace folder**. That folder is the source of truth. Copying it should restore settings, modes, chats and project references, not external project contents.
- Chat and Agent are initial **editable mode configurations**, not separate runtimes. Modes store `name`, `prompt`, and allowed `tools` as JSON in the selected workspace.
- Tool authorisation must be enforced by server-side allowed lists per response AND live per-folder grants, not just user-visible buttons. Per-write approval is required even after a read/write folder grant.
- OAuth tokens are session-only by default. Never log or commit them.
- **Projects never own files in the harness workspace.** Each project references zero or more external folders. Folder grants are explicit and individually read-only or read/write. Do not grant agent tool access to the workspace folder or its ancestors/descendants. Preserve project IDs and chat associations when editing folder references.
- The UI is a PWA, backed by a localhost Node service. Do not assume a browser-only PWA can execute code on a local PC.
- Keep the code small, keep tools sandboxed/project-scoped, and require real approvals before writes. Shell execution requires an isolated worker design first.

## Development journal
Every substantial change must create a **new** `/logs/YYMMDD-HHss_short-title.md`. Include goal, implementation history, verified current state, key decisions, risks and next concrete steps. Do not invent test results.

## Checks
Run `npm test`, `node --check server.mjs`, and `node --check web/app.js`. Pay attention to path traversal, symlinks, permissions, prompt injection and OAuth scope validation.
