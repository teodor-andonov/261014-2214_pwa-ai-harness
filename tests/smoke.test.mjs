import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, stat, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const port = 45219;
const base = "http://127.0.0.1:" + port;
const workspace = await mkdtemp(path.join(tmpdir(),"ai-harness-test-"));
const child = spawn(process.execPath, ["server.mjs"], { env: { ...process.env, PORT: String(port) }, stdio: "ignore", windowsHide: true });
after(async () => { child.kill(); await rm(workspace,{recursive:true,force:true,maxRetries:5,retryDelay:200}); });
const post = (url, body, method="POST", origin=base) =>
  fetch(base+url,{ method, headers:{ "Content-Type":"application/json", Origin:origin }, body:JSON.stringify(body) });

async function ready() {
  for(let i=0;i<70;i++){
    try {const r=await fetch(base+"/api/status",{signal:AbortSignal.timeout(250)});if(r.ok)return;}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  throw Error("Server failed to start");
}
await ready();

test("static shell loads before workspace selection, private files not exposed",async()=>{
  const p=await fetch(base+"/"); assert.equal(p.status,200);assert.match(await p.text(),/Local AI Harness/);
  assert.equal((await fetch(base+"/some-private-file")).status,404);
  const w=await (await fetch(base+"/api/workspace")).json();
  assert.equal(w.selected,false);
});
test("cross-origin POST is rejected",async()=>{
  assert.equal((await post("/api/workspace",{path:workspace},"POST","https://example.com")).status,403);
});
test("workspace must be explicitly selected",async()=>{
  const before=await fetch(base+"/api/projects");assert.equal(before.status,400);
  const start=await post("/api/workspace",{path:workspace});assert.equal(start.status,200);
  const res=await start.json();assert.equal(res.existing,false);
  const marker=JSON.parse(await readFile(path.join(workspace,"workspace.json"),"utf8"));
  assert.equal(marker.format,"ai-harness-workspace");
  assert.equal((await fetch(base+"/api/workspace").then(r=>r.json())).selected,true);
});
test("built-in modes are real editable workspace files",async()=>{
  const modes=(await fetch(base+"/api/modes").then(r=>r.json())).modes;
  assert.deepEqual(modes.map(m=>m.id),["chat","agent"]);
  assert.deepEqual(modes.find(m=>m.id==="chat").tools,[]);
  const changed=await post("/api/modes/agent",{name:"Builder",prompt:"Use only allowed tools.",tools:["read_file"]},"PUT");
  assert.equal(changed.status,200);
  const stored=JSON.parse(await readFile(path.join(workspace,"modes","agent.json"),"utf8"));
  assert.equal(stored.name,"Builder");
  assert.deepEqual(stored.tools,["read_file"]);
  const illegal=await post("/api/modes/agent",{name:"Bad",prompt:"X",tools:["shell"]},"PUT");
  assert.equal(illegal.status,400);
});
test("project and conversation persist entirely inside workspace",async()=>{
  const result=await post("/api/projects",{name:"Portable project"});
  assert.equal(result.status,201);
  const p=(await result.json()).project;
  assert.equal(p.internal,true);
  assert.equal((await stat(path.join(workspace,"projects","files",p.id))).isDirectory(),true);
  const thread=await post("/api/threads",{projectId:p.id});
  assert.equal(thread.status,201);
  const t=(await thread.json()).thread;
  assert.equal((await stat(path.join(workspace,"chats","thread-"+t.id+".json"))).isFile(),true);
});
test("still no saved OAuth credentials",async()=>{
  const status=(await fetch(base+"/api/status").then(r=>r.json()));
  assert.equal(status.connected,false);
  const files=await import("node:fs/promises").then(fs=>fs.readdir(workspace));
  assert.equal(files.includes("credentials.json"),false);
});
