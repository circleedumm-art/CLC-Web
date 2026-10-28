/* CLC admin dashboard – Step 3a: enrolments, students, teachers.
   The page hides itself unless the signed-in Google account is ADMIN_EMAIL.
   Real protection comes from firestore.rules, not from this file. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(), db = firebase.firestore();
let enrols = [], users = [], programs = [], classes = [], members = [], started = false;

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
  db.collection("programs").orderBy("order").onSnapshot(s => { programs = s.docs.map(d => ({ id: d.id, ...d.data() })); render(); }, fail);
  db.collection("classes").onSnapshot(s => { classes = s.docs.map(d => ({ id: d.id, ...d.data() })); render(); }, fail);
  db.collection("memberships").onSnapshot(s => { members = s.docs.map(d => ({ id: d.id, ...d.data() })); render(); }, fail);
}

/* ---------- Views ---------- */
const mail = (to, subject, body) => `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const when = x => x && x.toDate ? x.toDate().toLocaleDateString() : "";

const VIEWS = { enrolments: "Enrolments", students: "Students", teachers: "Teachers", classes: "Classes", programs: "Programs" };
const ADD = { students: "Add student", teachers: "Add teacher", classes: "Add class", programs: "Add program" };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const view = () => { const v = (location.hash || "#enrolments").slice(1); return VIEWS[v] ? v : "enrolments"; };
const progName = id => (programs.find(p => p.id === id) || {}).en || "Program";

function render() {
  const v = view();
  $$(".tabs a").forEach(a => a.setAttribute("aria-current", a.hash === "#" + v));
  $("#title").textContent = VIEWS[v];
  const add = $("#addBtn"); add.hidden = !ADD[v]; if (ADD[v]) add.textContent = ADD[v];
  const q = $("#q").value.trim().toLowerCase();
  const hit = o => !q || [o.name, o.email, o.course, o.loginId].join(" ").toLowerCase().includes(q);
  let html = "", empty = "";

  if (v === "enrolments") {
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
  } else if (v === "students" || v === "teachers") {
    const role = v === "teachers" ? "teacher" : "student";
    empty = `No ${role}s yet. Tap “Add ${role}” to create the first account.`;
    html = users.filter(u => u.role === role).filter(hit).sort((a, b) => (a.loginId || "").localeCompare(b.loginId || "")).map(u => {
      const st = u.status || "active";
      return `<li class="item"><div class="grow"><b>${esc(u.name)}</b><small>ID: ${esc(u.loginId)}${u.email ? " · " + esc(u.email) : ""}</small></div>
        <span class="pill s-${esc(st)}">${esc(st)}</span>
        <div class="acts">${u.email ? `<a class="btn small ghost" href="mailto:${encodeURIComponent(u.email)}">Email</a>` : ""}
        <button class="btn small ghost" data-act="toggle" data-id="${u.id}">${st === "active" ? "Deactivate" : "Activate"}</button></div></li>`;
    }).join("");
  } else if (v === "classes") {
    empty = programs.length ? "No classes yet. Tap “Add class” to create one." : "Add at least one program first (Programs tab), then create classes.";
    html = classes.filter(c => hit({ name: progName(c.programId) + " " + (c.label || ""), email: c.teacherName }))
      .sort((a, b) => a.day - b.day || String(a.time).localeCompare(String(b.time))).map(c => {
        const n = members.filter(m => m.classId === c.id).length, st = c.status || "active";
        const btn = (act, label, cls = "ghost") => `<button class="btn small ${cls}" data-act="${act}" data-id="${c.id}">${label}</button>`;
        return `<li class="item"><div class="grow"><b>${esc(progName(c.programId))}${c.label ? " · " + esc(c.label) : ""}</b>
          <small>${DAYS[c.day] || ""} ${esc(c.time)} · ${esc(c.teacherName || "No teacher yet")}</small>
          <small>${n} student${n === 1 ? "" : "s"}${c.public ? " · shown on website" : " · not on website"}</small></div>
          <span class="pill s-${st === "completed" ? "enrolled" : "active"}">${esc(st)}</span>
          <div class="acts">${btn("members", "Students")}${btn("records", "Exams & grades")}${btn("editClass", "Edit")}${btn("delClass", "Delete", "danger")}</div></li>`;
      }).join("");
  } else {
    empty = `No programs yet. <br><br><button class="btn small" data-act="seed">Load starter programs</button>`;
    html = programs.filter(p => hit({ name: p.en + " " + p.my })).map(p => `<li class="item"><span class="dot">${esc(p.icon)}</span>
      <div class="grow"><b>${esc(p.en)}</b><small>${esc(p.my)}</small><small>${esc(p.en_d)}</small></div>
      <div class="acts"><button class="btn small ghost" data-act="editProg" data-id="${p.id}">Edit</button>
      <button class="btn small danger" data-act="delProg" data-id="${p.id}">Delete</button></div></li>`).join("");
  }
  $("#list").innerHTML = html || `<li class="empty"><div>${empty}</div></li>`;
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
    if (act === "seed") { const b = db.batch(); DEFAULT_PROGRAMS.forEach((p, i) => b.set(db.collection("programs").doc(), { ...p, order: i + 1 })); await b.commit(); }
    if (act === "editProg") openProgram(programs.find(x => x.id === id));
    if (act === "delProg" && confirm("Delete this program? Existing classes keep working but will show “Program”.")) await db.collection("programs").doc(id).delete();
    if (act === "editClass") openClass(classes.find(x => x.id === id));
    if (act === "members") openMembers(classes.find(x => x.id === id));
    if (act === "records") openRecords(classes.find(x => x.id === id));
    if (act === "delClass") await deleteClass(classes.find(x => x.id === id));
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
$("#addBtn").onclick = () => { const v = view(); if (v === "classes") openClass(); else if (v === "programs") openProgram(); else openCreate({ role: v === "teachers" ? "teacher" : "student" }); };
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

/* ---------- Generic sheet for programs / classes / members ---------- */
const modal = $("#modal");
function sheet(title, body, closeLabel = "Cancel") {
  modal.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div><h3>${esc(title)}</h3>${body}
    <p class="note center err" id="mErr" hidden></p><button class="link" data-mclose>${closeLabel}</button></div>`;
  modal.hidden = false;
  $("[data-mclose]", modal).onclick = closeModal;
}
function closeModal() { modal.hidden = true; modal.innerHTML = ""; }
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
const mErr = m => { const p = $("#mErr"); p.textContent = m; p.hidden = false; };
const opts = (arr, sel) => arr.map(([v, t]) => `<option value="${esc(v)}" ${String(v) === String(sel) ? "selected" : ""}>${esc(t)}</option>`).join("");

/* ---------- Programs ---------- */
function openProgram(p = {}) {
  sheet(p.id ? "Edit program" : "New program", `
    <form id="mForm" class="group form" style="margin-top:14px" novalidate>
      <label><span>Icon</span><input name="icon" value="${esc(p.icon || "📘")}" maxlength="4"></label>
      <label><span>Title (English)</span><input name="en" value="${esc(p.en)}"></label>
      <label><span>Title (မြန်မာ)</span><input name="my" value="${esc(p.my)}"></label>
      <label><span>Text (English)</span><textarea name="en_d" rows="2">${esc(p.en_d)}</textarea></label>
      <label><span>Text (မြန်မာ)</span><textarea name="my_d" rows="2">${esc(p.my_d)}</textarea></label>
      <label><span>Order</span><input name="order" type="number" value="${esc(p.order ?? programs.length + 1)}"></label>
    </form><button class="btn wide" id="mSave">Save</button>`);
  $("#mSave").onclick = async () => {
    const f = $("#mForm").elements;
    const d = { icon: f.icon.value.trim() || "📘", en: f.en.value.trim(), my: f.my.value.trim(), en_d: f.en_d.value.trim(), my_d: f.my_d.value.trim(), order: Number(f.order.value) || 0 };
    if (!d.en) return mErr("Please enter the English title.");
    if (!d.my) d.my = d.en;
    try {
      if (p.id) await db.collection("programs").doc(p.id).set(d); else await db.collection("programs").add(d);
      closeModal(); toast("Program saved");
    } catch (e) { console.error(e); mErr("Could not save. Try again."); }
  };
}

/* ---------- Classes ---------- */
function openClass(c = {}) {
  if (!programs.length) { toast("Add a program first (Programs tab)."); return; }
  const teachers = users.filter(u => u.role === "teacher" && (u.status !== "inactive" || u.id === c.teacherId));
  sheet(c.id ? "Edit class" : "New class", `
    <form id="mForm" class="group form" style="margin-top:14px" novalidate>
      <label><span>Program</span><select name="programId">${opts(programs.map(p => [p.id, p.en]), c.programId)}</select></label>
      <label><span>Group name</span><input name="label" placeholder="e.g. Evening A" value="${esc(c.label)}"></label>
      <label><span>Teacher</span><select name="teacherId">${opts([["", "— none yet —"], ...teachers.map(t => [t.id, `${t.name} (${t.loginId})`])], c.teacherId)}</select></label>
      <label><span>Day</span><select name="day">${opts(DAYS.map((d, i) => [i, d]), c.day ?? 0)}</select></label>
      <label><span>Time</span><input name="time" placeholder="7:00 – 8:00 PM" value="${esc(c.time)}"></label>
      <label><span>Place (English)</span><input name="venue_en" placeholder="Online via Zoom" value="${esc(c.venue_en)}"></label>
      <label><span>Place (မြန်မာ)</span><input name="venue_my" value="${esc(c.venue_my)}"></label>
      <label><span>Status</span><select name="status">${opts([["active", "Active"], ["completed", "Completed"]], c.status || "active")}</select></label>
      <label><span>On website</span><select name="public">${opts([["yes", "Show on public schedule"], ["no", "Keep private"]], c.public === false ? "no" : "yes")}</select></label>
    </form><button class="btn wide" id="mSave">Save</button>`);
  $("#mSave").onclick = async () => {
    const f = $("#mForm").elements, t = users.find(u => u.id === f.teacherId.value);
    const d = { programId: f.programId.value, label: f.label.value.trim(), teacherId: f.teacherId.value, teacherName: t ? t.name : "",
      day: Number(f.day.value), time: f.time.value.trim(), venue_en: f.venue_en.value.trim(), venue_my: f.venue_my.value.trim() || f.venue_en.value.trim(),
      status: f.status.value, public: f.public.value === "yes" };
    if (!d.time) return mErr("Please enter the class time.");
    const ref = c.id ? db.collection("classes").doc(c.id) : db.collection("classes").doc(), pub = db.collection("publicSchedule").doc(ref.id);
    const b = db.batch();
    b.set(ref, { ...d, ...(c.id ? {} : { createdAt: firebase.firestore.FieldValue.serverTimestamp() }) }, { merge: true });
    // Only non-sensitive fields go to the public schedule (no teacher or student information).
    if (d.public && d.status === "active") b.set(pub, { programId: d.programId, label: d.label, day: d.day, time: d.time, venue_en: d.venue_en, venue_my: d.venue_my });
    else b.delete(pub);
    try { await b.commit(); closeModal(); toast("Class saved"); } catch (e) { console.error(e); mErr("Could not save. Try again."); }
  };
}

async function deleteClass(c) {
  if (!c || !confirm("Delete this class and remove its students from it?")) return;
  const b = db.batch();
  b.delete(db.collection("classes").doc(c.id)); b.delete(db.collection("publicSchedule").doc(c.id));
  members.filter(m => m.classId === c.id).forEach(m => b.delete(db.collection("memberships").doc(m.id)));
  const [ex, gr] = await Promise.all([db.collection("exams").where("classId", "==", c.id).get(), db.collection("grades").where("classId", "==", c.id).get()]);
  [...ex.docs, ...gr.docs].forEach(d => b.delete(d.ref));
  await b.commit(); toast("Class deleted");
}

/* ---------- Students in a class ---------- */
function openMembers(c) {
  const cur = new Set(members.filter(m => m.classId === c.id).map(m => m.studentId));
  const stu = users.filter(u => u.role === "student" && (u.status !== "inactive" || cur.has(u.id))).sort((a, b) => (a.loginId || "").localeCompare(b.loginId || ""));
  sheet(`Students · ${progName(c.programId)}`, `
    <ul class="group" style="margin-top:14px">${stu.map(u => `<li><label class="chk"><input type="checkbox" value="${u.id}" ${cur.has(u.id) ? "checked" : ""}>
      <span><b>${esc(u.name)}</b><small>ID: ${esc(u.loginId)}</small></span></label></li>`).join("") || `<li class="empty"><div>No students yet. Create student accounts first.</div></li>`}</ul>
    <button class="btn wide" id="mSave">Save</button>`);
  $("#mSave").onclick = async () => {
    const now = new Set($$('#modal input[type=checkbox]:checked').map(i => i.value)), b = db.batch();
    now.forEach(uid => { if (!cur.has(uid)) { const u = users.find(x => x.id === uid);
      b.set(db.collection("memberships").doc(`${c.id}_${uid}`), { classId: c.id, studentId: uid, studentName: u.name, loginId: u.loginId, status: "enrolled", createdAt: firebase.firestore.FieldValue.serverTimestamp() }); } });
    cur.forEach(uid => { if (!now.has(uid)) b.delete(db.collection("memberships").doc(`${c.id}_${uid}`)); });
    try { await b.commit(); closeModal(); toast("Class students updated"); } catch (e) { console.error(e); mErr("Could not save. Try again."); }
  };
}

/* ---------- Exams, grades and completion for one class ---------- */
async function openRecords(c) {
  const keep = $(".sheet", modal) ? $(".sheet", modal).scrollTop : 0;
  const [ex, gr] = await Promise.all([db.collection("exams").where("classId", "==", c.id).get(), db.collection("grades").where("classId", "==", c.id).get()]);
  const exams = ex.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const grades = gr.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.studentName || "").localeCompare(b.studentName || ""));
  const mem = members.filter(m => m.classId === c.id).sort((a, b) => (a.loginId || "").localeCompare(b.loginId || ""));
  const rowBtn = (a, id, label, cls = "danger") => `<button class="btn small ${cls}" data-r="${a}" data-id="${id}">${label}</button>`;
  const none = m => `<li class="empty"><div>${m}</div></li>`;

  sheet(`Records · ${progName(c.programId)}`, `
    <p class="sub">Exams</p>
    <ul class="group">${exams.map(e => `<li class="item"><div class="grow"><b>${esc(e.title)}</b><small>${esc(e.date)} ${esc(e.time)} ${e.venue ? "· " + esc(e.venue) : ""}</small></div>${rowBtn("delExam", e.id, "Delete")}</li>`).join("") || none("No exams yet.")}</ul>
    <form id="exForm" class="group form" style="margin-top:10px" novalidate>
      <label><span>Title</span><input name="title" placeholder="Midterm exam"></label>
      <label><span>Date</span><input name="date" type="date"></label>
      <label><span>Time</span><input name="time" placeholder="7:00 PM"></label>
      <label><span>Place</span><input name="venue" placeholder="Online"></label></form>
    <button class="btn small wide" data-r="addExam">Add exam</button>

    <p class="sub">Students · completion</p>
    <ul class="group">${mem.map(m => `<li class="item"><div class="grow"><b>${esc(m.studentName)}</b><small>ID: ${esc(m.loginId)}${m.certNo ? " · " + esc(m.certNo) : ""}</small></div>
      <span class="pill s-${m.status === "completed" ? "enrolled" : "active"}">${esc(m.status || "enrolled")}</span>
      ${m.status === "completed" ? rowBtn("reopen", m.id, "Reopen", "ghost") : rowBtn("complete", m.id, "Mark completed", "")}</li>`).join("") || none("No students in this class yet.")}</ul>

    <p class="sub">Grades</p>
    <ul class="group">${grades.map(g => `<li class="item"><div class="grow"><b>${esc(g.studentName)} · ${esc(g.title)}</b><small>${esc(g.score)} / ${esc(g.max)}${g.comment ? " · " + esc(g.comment) : ""}</small></div>${rowBtn("delGrade", g.id, "Delete")}</li>`).join("") || none("No grades yet.")}</ul>
    ${mem.length ? `<form id="grForm" class="group form" style="margin-top:10px" novalidate>
      <label><span>Student</span><select name="student">${opts(mem.map(m => [m.studentId, `${m.studentName} (${m.loginId})`]), "")}</select></label>
      <label><span>Title</span><input name="title" placeholder="Midterm exam"></label>
      <label><span>Score</span><input name="score" type="number" step="any" inputmode="decimal"></label>
      <label><span>Out of</span><input name="max" type="number" step="any" value="100"></label>
      <label><span>Comment</span><input name="comment"></label></form>
    <button class="btn small wide" data-r="addGrade">Add grade</button>` : ""}`, "Close");
  const root = $(".sheet", modal); root.scrollTop = keep;

  root.onclick = async e => {
    const b = e.target.closest("[data-r]"); if (!b) return;
    const a = b.dataset.r, id = b.dataset.id, FV = firebase.firestore.FieldValue;
    try {
      if (a === "addExam") {
        const f = $("#exForm").elements;
        if (!f.title.value.trim() || !f.date.value) return mErr("Exam needs a title and a date.");
        await db.collection("exams").add({ classId: c.id, title: f.title.value.trim(), date: f.date.value, time: f.time.value.trim(), venue: f.venue.value.trim() });
      }
      if (a === "delExam") await db.collection("exams").doc(id).delete();
      if (a === "addGrade") {
        const f = $("#grForm").elements, m = mem.find(x => x.studentId === f.student.value), score = parseFloat(f.score.value), max = parseFloat(f.max.value);
        if (!f.title.value.trim() || isNaN(score) || isNaN(max) || max <= 0 || score < 0 || score > max) return mErr("Enter a title and a score between 0 and the maximum.");
        await db.collection("grades").add({ classId: c.id, studentId: m.studentId, studentName: m.studentName, title: f.title.value.trim(), score, max, comment: f.comment.value.trim(), createdAt: FV.serverTimestamp() });
      }
      if (a === "delGrade") await db.collection("grades").doc(id).delete();
      if (a === "complete") {
        const certNo = `CLC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        await db.collection("memberships").doc(id).update({ status: "completed", completedAt: FV.serverTimestamp(), certNo });
        Object.assign(members.find(m => m.id === id), { status: "completed", certNo });
      }
      if (a === "reopen") {
        await db.collection("memberships").doc(id).update({ status: "enrolled", completedAt: FV.delete(), certNo: FV.delete() });
        Object.assign(members.find(m => m.id === id), { status: "enrolled", certNo: "" });
      }
      openRecords(c);
    } catch (err) { console.error(err); mErr("Could not save. Try again."); }
  };
}
