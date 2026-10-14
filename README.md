# Local AI Harness

A small, local-first AI workspace for Windows. One web interface, one agent loop, and local project/conversation storage. It uses the **Responses API**, authenticated through **Sign in with ChatGPT** (eligible plan usage; no API key needed).

**Stage:** Prototype 01 — code complete, awaiting first Windows sign-in and end-to-end inference test. The OAuth and model integration have not yet been exercised against a live ChatGPT account.

## Run on Windows

1. Install [Node.js 22 or later](https://nodejs.org/).
2. Clone this repository in VS Code (Source Control → Clone Repository).
3. Open the repository folder in VS Code.
4. Open VS Code's integrated terminal and run:

   ```powershell
   npm start
   ```

5. Open **http://127.0.0.1:4317**.
6. Click **Continue with ChatGPT**, sign in and approve ChatGPT plan usage.
7. Choose an available model, start a conversation, or add a local project folder.

There are **no npm dependencies** to install. To choose a different port: `$env:PORT=4318; npm start` in PowerShell. Use the port shown in the terminal.

## What works in this prototype

- ChatGPT plan OAuth with dynamic client registration, PKCE, OIDC ID-token signature validation, scope checks and refresh.
- Available model list from your signed-in account; no model names hard-coded.
- Streaming Responses calls using `store:false`, `stream:true`, with locally reconstructed message context.
- General Chat mode, plus Work/Code modes tied to a project directory.
- Local agent tools: list project files, read text files, propose writes (a human must approve each write).
- Projects and chat history stored as local JSON, never uploaded to GitHub.
- Responsive PWA shell; installability depends on browser/platform support.

### Current limits

This is deliberately **not** a full Codex or Work replacement yet. There is no terminal/shell execution, browser automation, multimodal input, MCP integration, Git agent actions, conversation import, project renaming, undo/diffs, or sophisticated long-conversation compaction. UI displays plain text (not Markdown rendering). The Work and Code modes currently use the same three local file tools but different instructions.

Subscription-backed Responses support is a preview, and access depends on your account/workspace permissions and usage limits. Signing in **does not import existing ChatGPT/Work/Codex conversations**. There is no claim that this app has been tested with real credentials yet.

## Local security

- The server listens **only on 127.0.0.1**. Do not expose it on a public network or deploy it unchanged.
- ChatGPT tokens are stored in `.local/credentials.json` (ignored by Git). This initial prototype does **not encrypt at rest** or integrate with Windows Credential Manager. Keep your Windows account protected and never share this folder.
- Chat content, files read by the agent, and proposed edits are sent to OpenAI to answer your requests. Local storage is local, but model inference is not offline.
- Agent file access is scoped to the chosen project root, real paths are checked against symlinks, and obvious secrets / internal directories are blocked. This is a guardrail, **not an OS sandbox**.
- Every write requires per-call approval; approval includes the path and proposed content preview. Check carefully, especially for existing files.
- Do not place the Git repository's `.local` folder under a cloud-synced or shared directory unless that is your intention.

## Architecture

```text
web/ (PWA shell)
   │ HTTP + SSE, localhost
server.mjs (OAuth, conversations, tool loop, approvals)
   ├── Sign in with ChatGPT → Responses API (stream)
   ├── selected local project → read/list/write (approved)
   └── .local/ (credentials, host ID, projects, chats)
```

There is one runtime and one local data model. Modes are configurations, not separate applications.

## Development

Run `npm test` for offline smoke checks. Tests don't require ChatGPT credentials. A Windows and Linux GitHub Actions workflow checks startup and source syntax. The live OAuth and model round-trip must be tested interactively on Windows.

### Documentation

- [ChatGPT plan usage overview](https://developers.openai.com/siwc/token-sharing-open-source)
- [Registration and sign-in](https://developers.openai.com/siwc/token-sharing-open-source/sign-in)
- [Responses preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations)

See [logs/](logs/) for plans, decisions, current status, and next steps. Future contributors should read [AGENTS.md](AGENTS.md).
