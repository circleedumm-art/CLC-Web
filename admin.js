/* CLC admin dashboard – Step 3a: enrolments, students, teachers.
   The page hides itself unless the signed-in Google account is ADMIN_EMAIL.
   Real protection comes from firestore.rules, not from this file. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(), db = firebase.firestore();
let enrols = [], users = [], started = false;

/* ---------- Theme ---------- */
function setTheme(t) { document.documentElement.dataset.theme = t; $('meta[name="theme-color"]').content = t === "dark" ? "#000000" : "#F2F2F7"; }
setTheme(store.get("clc_theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("#themeBtn").onclick = () => { const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; setTheme(t); store.set("clc_theme", t); };

function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.id); toast.id = setTimeout(() => t.hidden = true, 3500); }

/* ---------- Gate ---------- */
auth.onAuthStateChanged(u => {
  if (!u || u.email !== ADMIN_EMAIL) { location.replace("index.html"); return; }
  document.body.hidden = false;
  start();
});
$("#logout").onclick = () => auth.signOut();

function start() {
  if (started) return; started = true;
  const fail = e => { console.error(e); toast("Could not load data. Check your Firestore rules."); };
  db.collection("enrolments").orderBy("createdAt", "desc").onSnapshot(s => { enrols = s.docs.map(d => ({ id: d.id, ...d.data() })); render(); }, fail);
  db.collection("users").onSnapshot(s => { users = s.docs.map(d => ({ id: d.id, ...d.data() })); render(); }, fail);
}

/* ---------- Views ---------- */
const mail = (to, subject, body) => `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const when = x => x && x.toDate ? x.toDate().toLocaleDateString() : "";

function render() {
  const view = (location.hash || "#enrolments").slice(1);
  $$(".tabs a").forEach(a => a.setAttribute("aria-current", a.hash === "#" + view));
  const q = $("#q").value.trim().toLowerCase();
  const hit = o => !q || [o.name, o.email, o.course, o.loginId].join(" ").toLowerCase().includes(q);
  const list = $("#list"), add = $("#addBtn");
  add.hidden = view === "enrolments";
  let html = "", empty = "";

  if (view === "enrolments") {
    $("#title").textContent = "Enrolments";
    empty = "No enrolments yet. New ones from the website appear here instantly.";
    html = enrols.filter(hit).map(e => {
      const st = e.status || "pending";
      const btn = (act, label, cls = "ghost") => `<button class="btn small ${cls}" data-act="${act}" data-id="${e.id}">${label}</button>`;
      const chosen = mail(e.email, "Circle Learning Centre – you have been chosen",
        `Hello ${e.name},\n\nGood news! You have been chosen for ${e.course} at Circle Learning Centre. Your login details will follow shortly.\n\nCircle Learning Centre`);
      const acts = [
        st === "pending" || st === "rejected" ? btn("approve", "Approve", "") : "",
        st === "approved" ? btn("create", "Create account", "") + `<a class="btn small ghost" href="${chosen}">Email</a>` : "",
        st !== "rejected" && st !== "enrolled" ? btn("reject", "Reject") : "",
        btn("delEnrol", "Delete", "danger")
      ].join("");
      return `<li class="item"><div class="grow"><b>${esc(e.name)}</b><small>${esc(e.email)} · ${esc(e.course)}</small>
        ${e.note ? `<small>“${esc(e.note)}”</small>` : ""}<small>${when(e.createdAt)}</small></div>
        <span class="pill s-${esc(st)}">${esc(st)}</span><div class="acts">${acts}</div></li>`;
    }).join("");
  } else {
    const role = view === "teachers" ? "teacher" : "student";
    $("#title").textContent = role === "teacher" ? "Teachers" : "Students";
    add.textContent = role === "teacher" ? "Add teacher" : "Add student"; add.dataset.role = role;
    empty = `No ${role}s yet. Tap “Add ${role}” to create the first account.`;
    html = users.filter(u => u.role === role).filter(hit).sort((a, b) => (a.loginId || "").localeCompare(b.loginId || "")).map(u => {
      const st = u.status || "active";
      return `<li class="item"><div class="grow"><b>${esc(u.name)}</b><small>ID: ${esc(u.loginId)}${u.email ? " · " + esc(u.email) : ""}</small></div>
        <span class="pill s-${esc(st)}">${esc(st)}</span>
        <div class="acts">${u.email ? `<a class="btn small ghost" href="mailto:${encodeURIComponent(u.email)}">Email</a>` : ""}
        <button class="btn small ghost" data-act="toggle" data-id="${u.id}">${st === "active" ? "Deactivate" : "Activate"}</button></div></li>`;
    }).join("");
  }
  list.innerHTML = html || `<li class="empty">${empty}</li>`;
}
addEventListener("hashchange", render);
$("#q").addEventListener("input", render);

/* ---------- Row actions ---------- */
$("#list").addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const { act, id } = b.dataset, en = enrols.find(x => x.id === id), us = users.find(x => x.id === id);
  try {
    if (act === "approve") { await db.collection("enrolments").doc(id).update({ status: "approved" }); openCreate({ role: "student", name: en.name, email: en.email, enrolId: id }); }
    if (act === "create") openCreate({ role: "student", name: en.name, email: en.email, enrolId: id });
    if (act === "reject") await db.collection("enrolments").doc(id).update({ status: "rejected" });
    if (act === "delEnrol" && confirm(`Delete the enrolment from ${en.name}?`)) await db.collection("enrolments").doc(id).delete();
    if (act === "toggle") await db.collection("users").doc(id).update({ status: us.status === "inactive" ? "active" : "inactive" });
  } catch (err) { console.error(err); toast("Something went wrong. Try again."); }
});

/* ---------- Create account ---------- */
const cScrim = $("#cScrim"), dScrim = $("#dScrim"), cForm = $("#cForm"), F = n => cForm.elements[n];
let enrolId = null, idTouched = false;

function suggestId(role) {
  const p = role === "teacher" ? "T" : "S";
  const nums = users.filter(u => u.role === role).map(u => parseInt((u.loginId || "").replace(/\D/g, ""), 10) || 0);
  return p + String(Math.max(0, ...nums) + 1).padStart(3, "0");
}
function genPw() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789", a = new Uint32Array(8);
  crypto.getRandomValues(a); return [...a].map(n => chars[n % chars.length]).join("");
}
function openCreate({ role = "student", name = "", email = "", enrolId: eid = null } = {}) {
  enrolId = eid; idTouched = false; cForm.reset();
  F("role").value = role; F("name").value = name; F("email").value = email;
  F("loginId").value = suggestId(role); F("password").value = genPw();
  $("#cErr").hidden = true; cScrim.hidden = false; F("name").focus();
}
$("#addBtn").onclick = e => openCreate({ role: e.currentTarget.dataset.role });
F("role").onchange = () => { if (!idTouched) F("loginId").value = suggestId(F("role").value); };
F("loginId").oninput = () => idTouched = true;
$("#genPw").onclick = () => F("password").value = genPw();
$$("[data-close]").forEach(b => b.onclick = () => { cScrim.hidden = true; dScrim.hidden = true; });
[cScrim, dScrim].forEach(s => s.addEventListener("click", e => { if (e.target === s) s.hidden = true; }));
addEventListener("keydown", e => { if (e.key === "Escape") { cScrim.hidden = true; dScrim.hidden = true; } });

$("#cSave").onclick = async () => {
  const err = m => { $("#cErr").textContent = m; $("#cErr").hidden = false; };
  const role = F("role").value, loginId = F("loginId").value.trim().toLowerCase(), name = F("name").value.trim(),
        email = F("email").value.trim(), password = F("password").value;
  if (!/^[a-z0-9]{3,20}$/.test(loginId)) return err("Login ID: 3–20 letters or numbers, no spaces.");
  if (!name) return err("Please enter the full name.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("That email address does not look right.");
  if (password.length < 6) return err("Password needs at least 6 characters.");
  const btn = $("#cSave"); btn.disabled = true;
  try {
    // A second Firebase "app" creates the login, so the admin stays signed in.
    const sec = firebase.apps.find(a => a.name === "creator") || firebase.initializeApp(firebaseConfig, "creator");
    const cred = await sec.auth().createUserWithEmailAndPassword(`${loginId}@${ID_DOMAIN}`, password);
    await sec.auth().signOut();
    await db.collection("users").doc(cred.user.uid).set({ role, loginId, name, email, status: "active", createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    if (enrolId) await db.collection("enrolments").doc(enrolId).update({ status: "enrolled" });
    cScrim.hidden = true; showDone({ role, loginId, name, email, password });
  } catch (e) {
    console.error(e);
    err(e.code === "auth/email-already-in-use" ? "That Login ID is already taken. Try another." : e.code === "auth/weak-password" ? "Password is too weak." : "Could not create the account. Try again.");
  } finally { btn.disabled = false; }
};

function showDone({ role, loginId, name, email, password }) {
  const url = new URL("index.html", location.href).href;
  const msg = `Hello ${name},\n\nYour Circle Learning Centre ${role} account is ready.\n\nWebsite: ${url}\nLogin ID: ${loginId}\nPassword: ${password}\n\nPlease log in and complete your profile.\n\nCircle Learning Centre`;
  $("#dId").textContent = loginId; $("#dPw").textContent = password;
  const m = $("#dMail"); m.hidden = !email; m.href = email ? mail(email, "Your Circle Learning Centre login", msg) : "#";
  $("#dCopy").onclick = async () => { try { await navigator.clipboard.writeText(msg); toast("Message copied"); } catch { toast("Copy failed – select the text instead"); } };
  dScrim.hidden = false;
}
