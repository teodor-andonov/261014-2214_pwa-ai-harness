# Portable workspace and modes — 14 October 2026

## Goal / user direction
Require the user to point the app at a folder before setup. Every persistent chat, project, mode and preference belongs in that folder, so copying it to a new computer restores the workspace. Reduce defaults to two modes: Chat and Agent. A mode is its editable base prompt plus allowed tools, and modes can be switched within a conversation.

## History / changes
- Replaced app-repository `.local/` persistence with an explicit first-launch workspace path.
- Added a versioned `workspace.json`, `settings.json`, `chats/`, `modes/`, `projects/`, `attachments/` and `data/`.
- Added first-use workspace screen and API endpoint. A new workspace must start in an empty folder.
- Created built-in editable `chat.json` and `agent.json` modes. New modes can be created in the UI; server validates tool permissions.
- Project files can be created inside the workspace (portable) or referenced as an external path (not portable).
- Moved OAuth credentials to process memory, not disk; reauthentication is required at each server restart.
- Moved model and default-mode preferences into workspace settings; removed browser sessionStorage usage for model choice.
- Added a basic static Content Security Policy and more offline tests.

## Decisions
- **App is disposable; folder is durable.** Even local app settings cannot silently live elsewhere.
- No Windows DPAPI dependency for v1 since machine-bound decryption would undermine portability.
- No stored refresh token by default. Later optional encrypted credential persistence could be added using a portable passphrase, but not with a key stored beside the ciphertext.
- No uncontrolled web search. Hosted web search is policy-gated and can cost tokens/tools; add explicit per-mode/per-turn opt-in after implementing citations and usage tracking.
- Image understanding is possible through Responses with vision-capable models; attachments UI not implemented yet.
- Terminal/desktop access is postponed until sandbox/approval design is stronger.

## Current state / validation
This change is intended for GitHub Actions Windows/Linux syntax and smoke tests; live ChatGPT sign-in, Responses streaming and real machine-to-machine copying are still unverified until tested on Windows.
Repository contains no credentials. Earlier Prototype 01 `.local/` data is not automatically migrated.

## Known limitations
- Folder path currently entered in a text field; a pure PWA folder picker cannot disclose an arbitrary filesystem path to Node.
- External project paths require remapping after moving machines.
- Multiple instances editing one workspace concurrently may conflict; no locking/synchronisation yet.
- No stored credentials means signing in after each Node server restart.
- File tool restrictions are not a full sandbox; no shell, internet search, images or browser tools implemented.

## Next
1. Check CI and repair any offline test failures.
2. Test ChatGPT OAuth/Responses and file approval on the user's Windows PC.
3. Add complete diff/undo workflow and stronger app-local API security.
4. Add image attachment handling and explicit opt-in web search with citations.
5. Add workspace import/migration and external project path remapping; eventually isolated shell agent.
