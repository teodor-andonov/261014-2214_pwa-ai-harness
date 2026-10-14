@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or later is required.
  echo Download it from https://nodejs.org/
  pause
  exit /b 1
)
echo Starting Local AI Harness...
start "" "http://127.0.0.1:4317"
node server.mjs
if errorlevel 1 pause
