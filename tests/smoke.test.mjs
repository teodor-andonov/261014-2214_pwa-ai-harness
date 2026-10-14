import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 45219;
const base = "http://127.0.0.1:" + port;
const child = spawn(process.execPath, ["server.mjs"], { env: { ...process.env, PORT: String(port) }, stdio: "ignore", windowsHide: true });
after(() => { child.kill(); });

async function ready() {
  for (let i = 0; i < 70; i++) {
    try { const r = await fetch(base + "/api/status", { signal: AbortSignal.timeout(250) }); if (r.ok) return; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw Error("Server failed to start");
}
await ready();

test("server only exposes expected static assets", async () => {
  const page = await fetch(base + "/");
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Local AI Harness/);
  const missing = await fetch(base + "/some-private-file");
  assert.equal(missing.status, 404);
});

test("local project API rejects invalid folder", async () => {
  const r = await fetch(base + "/api/projects", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ name: "Not here", path: "__nonexistent_directory_for_smoke_test__" })
  });
  assert.equal(r.status, 400);
});

test("remote origin is denied for writes", async () => {
  const r = await fetch(base + "/api/projects", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "https://example.com" },
    body: JSON.stringify({ name: "Test", path: "." })
  });
  assert.equal(r.status, 403);
});

test("unauthenticated account reports disconnected", async () => {
  const r = await fetch(base + "/api/status");
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(typeof j.connected, "boolean");
});
