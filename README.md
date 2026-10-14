# Local AI Harness

Local-first, single-runtime agent workspace for Windows. **The app is disposable; the workspace folder is the source of truth.** Copy that folder to another machine, run this app there, and select the copied folder.

**Prototype 03 — external project folders and per-folder permissions.** Offline smoke tests cover the workspace and basic API. Live ChatGPT authentication and inference still require a real-account test.

## Start on Windows

1. Install [Node.js 22+](https://nodejs.org/).
2. Clone this repository, then double-click `start.cmd` (or `npm start`).
3. Open `http://127.0.0.1:4317`.
4. **Before anything else**, enter a path to an empty folder or an existing AI Harness workspace. The app creates all persistent files there; no workspace path is saved outside it.
5. Select **Continue with ChatGPT** and sign in. Access/refresh credentials are held **only in the running server's memory**, so you must sign in again after restarting the server.
6. Select a model. Use Chat or Agent mode, and edit/add more modes using the controls above the composer.
7. Add a project (or edit its folders using the gear icon). A project may reference **zero, one or many external folders**. Each folder has a separate **read only** or **read + write** permission.

A browser PWA cannot reliably hand an arbitrary absolute Windows folder path to the local Node.js process; the initial prototype therefore uses a path field. This is a **desktop-local web application**: the Node server must be running for the PWA to function. Moving a workspace to Android or another device still requires a compatible local runtime and tool executor there.

## Folder format

```text
My AI Workspace/
  workspace.json         # identity / format version
  settings.json          # default mode, model preference
  chats/                 # complete conversation files
  attachments/           # reserved; image uploads not yet implemented
  modes/
    chat.json             # name, base prompt, tool permissions
    agent.json
    custom-*.json
  projects/
    index.json            # project names, folder references, permissions
  data/                   # reserved for indexes
```

No database, credentials, or conversation data is stored in the application repository. The PWA service worker caches **only static app assets**; it never caches API responses or personal data. **All project folders are external**: the workspace holds only project definitions, references and permissions. One project may have multiple folder references. Copying the harness folder copies chat and settings, but **not the referenced folders**; links must be reconnected if their paths change. Modes share one runtime and can be changed mid-thread.

For example, one project may link `C:\\Work\\Website` (read/write) and `D:\\References` (read only). Project roots are explicitly chosen; the agent never receives broad access to an entire drive. Granting read/write permission enables the **possibility** of edits, but each file write still requires separate confirmation. A project folder cannot overlap the harness workspace; this protects its chat/configuration files from project tool access.

## Tools and costs

Current mode tool permissions are `list_files`, `read_file` and `write_file`. A tool may operate only within a project folder explicitly granted to that project. Read/write grants enable writes but each mutation still requires a separate approval. The browser, shell, Git, image upload and web search tools are **not implemented** yet. Native Responses API vision is available for compatible models once we add an image attachment uploader. Hosted web search is optional and subject to account policy; we will make it explicitly enabled per mode/turn with usage warnings rather than trigger it indiscriminately.

The intended architecture is:

```text
PWA (HTML/CSS/JS)
      |
Local Node.js agent runtime (OAuth, mode selection, approval controller)
      +--> ChatGPT-plan-backed Responses API
      +--> project-scoped local tool functions
      +--> user-chosen workspace folder
```

## Authentication and local security

- Sign in with ChatGPT uses OAuth + PKCE; the app never requests your ChatGPT password.
- Credentials remain in memory and are discarded on restart. There is intentionally **no refresh token in the portable folder**. The OAuth host identifier is stored in that folder; it is not a secret.
- The server binds to `127.0.0.1` and checks browser origins. Static assets have a basic CSP. This is **not** a full hostile-local-process security boundary.
- The Node server itself has your Windows user privileges. Agent file tools check project paths and obvious secrets but are not an OS sandbox. Do not use it for sensitive folders, and do not grant unrestricted terminal execution yet.
- Model inference is remote: content sent to the model leaves your machine. Local persistence does not imply offline inference.
- The app repo is public. `logs/` documents development decisions only, not chats or credentials.

If you used Prototype 01, its `.local/` inside the application repo is **legacy data**. Later prototypes do not automatically migrate it. If you created **internal project folders with Prototype 02**, their files are not deleted, but their old project entries will be shown with no granted folder until you move those files to an external location and edit the project to link it. Existing conversations and project IDs are preserved. Back up old files before making changes.

## Development and tests

```powershell
npm test
node --check server.mjs
node --check web/app.js
```

Smoke tests run in GitHub Actions on Windows and Linux. See `/logs` for history, decisions, state and next steps. Current tests **do not validate live OAuth**, model list, inference/tool calls or a copy-and-resume test on another physical computer.

Official docs: [Sign in with ChatGPT](https://developers.openai.com/siwc/token-sharing-open-source) · [Preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations) · [Web search](https://developers.openai.com/api/docs/guides/tools-web-search).
