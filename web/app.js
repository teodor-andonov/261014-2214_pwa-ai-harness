const $ = selector => document.querySelector(selector);
const state = { projects: [], threads: [], projectId: "", threadId: null, mode: "chat", model: "", connected: false, busy: false };
async function api(path, method = "GET", body) {
  const r = await fetch(path, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "Request failed");
  return data;
}
const asText = value => String(value || "");
function updateContext() {
  const project = state.projects.find(x => x.id === state.projectId);
  $("#context-name").textContent = project ? project.name : "General workspace";
  $("#sidebar-status").textContent = project ? project.path : "Local workspace";
  $("#prompt").placeholder = state.mode === "chat" ? "Ask anything…" : "Ask about your project…";
  $("#hint").textContent = state.mode === "chat" ? "Your conversations stay on this computer." : "Local file changes require your approval.";
  $("#send").disabled = state.busy || !state.connected || !state.model;
}
function renderProjects() {
  const el = $("#project");
  el.replaceChildren(new Option("General / no project", ""));
  for (const p of state.projects) el.add(new Option(p.name, p.id));
  el.value = state.projectId;
  updateContext();
}
function renderThreads() {
  const list = $("#history");
  list.replaceChildren();
  const threads = state.threads.filter(t => (t.projectId || "") === state.projectId);
  if (!threads.length) { const empty = document.createElement("div"); empty.className = "empty"; empty.textContent = "No conversations yet"; list.append(empty); }
  for (const t of threads) {
    const button = document.createElement("button");
    button.className = t.id === state.threadId ? "selected" : "";
    button.textContent = t.title;
    button.title = t.title;
    button.addEventListener("click", () => openThread(t.id));
    list.append(button);
  }
}
function resetConversation() {
  $("#messages").replaceChildren();
  $("#welcome").hidden = false;
  $("#thread-name").textContent = "New conversation";
  renderThreads();
}
function makeMessage(role, text) {
  const el = document.createElement("article");
  el.className = "message " + role;
  const label = document.createElement("div"); label.className = "role"; label.textContent = role === "user" ? "You" : "Assistant";
  const body = document.createElement("div"); body.className = "body"; body.textContent = text || "";
  const events = document.createElement("div"); events.className = "tool-events";
  el.append(label, body, events);
  $("#messages").append(el);
  $("#welcome").hidden = true;
  $("#content").scrollTop = $("#content").scrollHeight;
  return { el, body, events };
}
async function openThread(id) {
  if (state.busy) return;
  try {
    const { thread } = await api("/api/threads/" + id);
    state.threadId = id;
    $("#messages").replaceChildren();
    thread.messages.forEach(m => makeMessage(m.role, m.text));
    $("#welcome").hidden = !!thread.messages.length;
    $("#thread-name").textContent = thread.title;
    renderThreads();
    $("#sidebar").classList.remove("open");
  } catch (e) { alert(e.message); }
}
async function newThread() {
  if (state.busy) return;
  state.threadId = null;
  resetConversation();
  $("#sidebar").classList.remove("open");
  $("#prompt").focus();
}
async function loadThreads() {
  const result = await api("/api/threads");
  state.threads = result.threads;
  renderThreads();
}
async function loadModels() {
  const select = $("#model");
  try {
    const { models } = await api("/api/models");
    select.replaceChildren();
    if (!models.length) throw Error("No eligible models found");
    models.forEach(m => select.add(new Option(m.name, m.id)));
    const stored = sessionStorage.getItem("preferred-model");
    state.model = models.find(m => m.id === stored)?.id || models[0].id;
    select.value = state.model;
  } catch (e) {
    select.replaceChildren(new Option("No model", ""));
    state.model = "";
    if (state.connected) showNotice(e.message);
  }
  updateContext();
}
function showNotice(text) {
  const el = makeMessage("assistant", "Notice: " + text);
  el.el.classList.add("notice");
}
function streamEvents(response, handle) {
  if (!response.ok) return response.json().then(data => { throw Error(data.error || "Unable to send"); });
  return (async () => {
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      let i;
      while ((i = buffer.indexOf("\n\n")) >= 0) {
        const block = buffer.slice(0, i); buffer = buffer.slice(i + 2);
        const line = block.split("\n").find(l => l.startsWith("data: "));
        if (line) await handle(JSON.parse(line.slice(6)));
      }
    }
  })();
}
async function askApproval(info) {
  const dialog = $("#approval");
  $("#approval-path").textContent = info.path + " (" + info.size + " characters)";
  $("#approval-preview").textContent = info.preview;
  const answer = await new Promise(resolve => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "approve"), { once: true });
    dialog.showModal();
  });
  await api("/api/approval", "POST", { id: info.id, approved: answer });
}
async function sendMessage() {
  if (state.busy || !state.connected || !state.model) return;
  const text = $("#prompt").value.trim();
  if (!text) return;
  state.busy = true; updateContext();
  $("#prompt").value = "";
  let assistant = null;
  try {
    if (!state.threadId) {
      const result = await api("/api/threads", "POST", { projectId: state.projectId || null });
      state.threadId = result.thread.id;
    }
    makeMessage("user", text);
    assistant = makeMessage("assistant", "");
    let fullText = "", failed = false, finished = false;
    const response = await fetch("/api/threads/" + state.threadId + "/message", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mode: state.mode, model: state.model })
    });
    await streamEvents(response, async e => {
      if (e.type === "delta") { fullText += e.text; assistant.body.textContent = fullText; $("#content").scrollTop = $("#content").scrollHeight; }
      else if (e.type === "tool") assistant.events.textContent = e.text;
      else if (e.type === "approval") await askApproval(e);
      else if (e.type === "error") { failed = true; assistant.body.textContent = "Error: " + e.message; }
      else if (e.type === "done") { finished = true; $("#thread-name").textContent = e.title; }
    });
    if (!failed && !finished) throw Error("Stream interrupted before completion");
    if (finished) await loadThreads();
  } catch (e) { if (assistant) assistant.body.textContent = "Error: " + e.message; else showNotice(e.message); }
  finally { state.busy = false; updateContext(); $("#prompt").focus(); }
}
async function initialize() {
  const params = new URL(location.href).searchParams;
  if (params.get("auth_error")) alert("ChatGPT sign-in: " + params.get("auth_error"));
  if (params.size) history.replaceState(null, "", "/");
  const s = await api("/api/status");
  state.connected = s.connected;
  $("#account").textContent = state.connected ? (s.email || "ChatGPT connected") : "Continue with ChatGPT";
  $("#account").classList.toggle("connected", state.connected);
  state.projects = (await api("/api/projects")).projects;
  renderProjects(); await loadThreads();
  if (state.connected) await loadModels(); else updateContext();
}
$("#project").addEventListener("change", e => { if (state.busy) { e.target.value = state.projectId; return; } state.projectId = e.target.value; state.threadId = null; resetConversation(); updateContext(); });
$("#add-project").addEventListener("click", async () => {
  if (state.busy) return;
  const folder = prompt("Full local folder path (for example C:\\Users\\You\\Projects\\Demo):");
  if (!folder) return;
  const name = prompt("Project name:", folder.split(/[\\/]/).filter(Boolean).pop());
  if (!name) return;
  try { const { project } = await api("/api/projects", "POST", { name, path: folder }); state.projects.push(project); state.projectId = project.id; state.threadId = null; renderProjects(); resetConversation(); }
  catch (e) { alert(e.message); }
});
$("#new-chat").addEventListener("click", newThread);
$("#sidebar-toggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#send").addEventListener("click", sendMessage);
$("#prompt").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
$("#model").addEventListener("change", e => { state.model = e.target.value; sessionStorage.setItem("preferred-model", state.model); updateContext(); });
document.querySelectorAll(".mode").forEach(button => button.addEventListener("click", () => {
  state.mode = button.dataset.mode;
  document.querySelectorAll(".mode").forEach(b => b.classList.toggle("active", b === button));
  updateContext();
}));
document.querySelectorAll(".examples button").forEach(button => button.addEventListener("click", () => { $("#prompt").value = button.dataset.prompt; $("#prompt").focus(); }));
$("#account").addEventListener("click", async () => {
  try { const { url } = await api("/api/auth/start", "POST", {}); location.assign(url); } catch (e) { alert(e.message); }
});
initialize().catch(e => showNotice(e.message));
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
