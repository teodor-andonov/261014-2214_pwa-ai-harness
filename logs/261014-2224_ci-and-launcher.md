# Smoke tests and Windows launcher — 14 October 2026

## Goal / plan
Verify the first prototype on both supported development environments and make Windows startup easier.

## History / changes
- First prototype committed to main in commit bdba2f721889496e66cb3341ebf0038a4bee4576.
- GitHub Actions job **Node 22 / windows-latest** completed successfully: server syntax, browser JS syntax, local HTTP/API smoke tests.
- GitHub Actions job **Node 22 / ubuntu-latest** completed successfully with the same checks.
- Added a double-click `start.cmd` Windows launcher and simplified the startup README.

## Current state
Committed code and offline tests pass on Windows/Linux. **Live ChatGPT OAuth, account-specific model listing, inference streaming, project tool calling and write approvals are not yet tested with a connected user account.** Do not describe those end-to-end workflows as validated.

## Decisions
Keep the initial runtime free of npm dependencies, and prioritize zero-setup Windows launching. Do not introduce browser auth shortcuts or API keys.

## Next
1. User runs `start.cmd` on Windows and completes ChatGPT sign-in.
2. Test one chat turn, one project read and one approved write.
3. Record any preview API mismatches and fix before adding terminal tools or more modes.
