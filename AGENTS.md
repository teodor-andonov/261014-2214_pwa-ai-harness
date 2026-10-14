# Instructions for coding agents

This is a **local-first Windows AI harness**, not a cloud-hosted web application. Use Node.js 22+ and the native web stack where possible. Keep the architecture small and understandable.

## Record the work

For every substantial development pass, add a Markdown note to `/logs` named **YYMMDD-HHss_short-title.md**, using the user's chosen filename pattern (four time digits). Never overwrite an earlier log. Include:
- Goal and plan
- What changed (history)
- Current state, including tested vs untested functionality
- Decisions and reasoning
- Issues, future ideas, next concrete steps

Do not store credentials, chat transcripts, personal file contents, or sensitive project paths in committed logs.

## Product principles

1. One agent runtime, multiple modes (chat, work, code, eventually CAD).
2. Own conversation/project schema; do not couple core storage to an inference provider.
3. Local-by-default persistence, explicit project scope, per-action approval for writes.
4. Never claim account authentication or end-to-end inference works without a real test.
5. Keep code and user data separate; everything in `.local/` is ignored by Git.
6. Prefer understandable modules over extra dependencies. Build in small, verifiable steps.

## Before merging changes

Run `npm test` and `node --check server.mjs` and `node --check web/app.js`. Review any tool expansion for path traversal, symlink attacks, prompt injection and user approval semantics.
