# Initial prototype — 14 October 2026

## Goal and plan

Build the first usable local AI harness in the user's new GitHub repository. A general wrapper for chat, work and coding tasks: one runtime, one local history and project system, different tool availability by mode. Start with the Responses API and eligible ChatGPT plan OAuth, not API key billing.

## History / implemented

- Confirmed repository started with only LICENSE.
- Read current official Sign in with ChatGPT and Responses preview documentation.
- Chose zero-dependency Node.js local server and a responsive HTML/CSS/JS PWA shell.
- Implemented browser OAuth start/callback, PKCE, dynamic client ID, host ID, ID-token signature/claim verification, access token refresh and scope check.
- Implemented account-based model listing, streaming Responses calls, locally reconstructed message history and a bounded function-call loop.
- Implemented local JSON project/conversation storage; Chat/Work/Code modes; project-scoped list/read/write tools; per-write user approval.
- Added manifest, service worker, smoke tests and a Windows/Linux CI workflow.

## Decisions

1. **Single Responses backend** in v1. Codex app-server may become an optional advanced coding backend later, but isn't required for the general harness.
2. **127.0.0.1 only**; no hosted service or inbound remote access in v1.
3. **JSON local storage** under gitignored `.local/` for a small, inspectable prototype. SQLite may replace this when indexing/search become important.
4. **Explicit write approval** for each file mutation; no unrestricted shell/desktop control initially.
5. **No hard-coded model**; obtain model availability from the ChatGPT plan session.
6. **Original conversations aren't automatically imported**; a migration path can be added separately.

## Current state

Code prepared for the first repository commit. Offline smoke checks and actual Windows OAuth/inference remain to be verified after committing. No real account credentials were used or stored in the repo.

## Known limits / risks

- The ChatGPT plan Responses route is in preview and requires eligible permissions and `store:false`, `stream:true`. No persistent server-side conversation ID.
- Windows file-system guardrails are not the same as a sandbox; the first version exposes only bounded project file operations.
- `.local/credentials.json` is gitignored but not encrypted at rest; consider Windows Credential Manager before broader use.
- No shell, Git, browser control, diff preview or full Markdown output in this slice.
- Streaming function-call namespacing and the live OAuth callback must be verified with an actual account.

## Next steps

1. Verify GitHub Actions smoke tests and any syntax issues.
2. On Windows: clone, run `npm start`, sign in, list models and complete an ordinary chat.
3. Add a temporary test project and ask Work mode to read a file, then approve a harmless write.
4. Collect any login/inference compatibility errors before expanding the tool set.
5. Next iteration: structured diff approval, safe command execution, chat search, project settings and import/export.
