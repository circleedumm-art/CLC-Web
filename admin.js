/* CLC admin dashboard – Step 3a: enrolments, students, teachers.
   The page hides itself unless the signed-in Google account is ADMIN_EMAIL.
   Real protection comes from firestore.rules, not from this file. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(), db = firebase.firestore();
let enrols = [], users = [], programs = [], classes = [], members = [], reports = [], started = false;

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
  db.collection("reviews").onSnapshot(s => { reviews = s.docs.map(d => ({ id: d.id, ...d.data() })); render(); }, fail);
  db.collection("siteContent").doc("guides").onSnapshot(d => { guides = d.exists ? d.data() : {}; render(); }, fail);
  db.collection("reports").onSnapshot(s => { reports = s.docs.map(d => ({ id: d.id, ...d.data() })); render(); }, fail);
  db.collection("memberships").onSnapshot(s => { members = s.docs.map(d => ({ id: d.id, ...d.data() })); render(); }, fail);
}

/* ---------- Views ---------- */
const mail = (to, subject, body) => `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const when = x => x && x.toDate ? x.toDate().toLocaleDateString() : "";

const SESS_L = { session: "Session", optional: "optional", none: "— none —", needTimes: "Each session needs a day, a start time and an end time.", sameTime: "Start and end time cannot be the same." };
const VIEWS = { enrolments: "Enrolments", students: "Students", teachers: "Teachers", classes: "Classes", site: "Site", reports: "Reports" };
const ADD = { students: "Add student", teachers: "Add teacher", classes: "Add class", site: "Add program" };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
let siteTab = "programs", guides = {}, reviews = [];
const view = () => { let v = (location.hash || "#enrolments").slice(1); if (v === "programs") v = "site"; return VIEWS[v] ? v : "enrolments"; };
const progName = id => (programs.find(p => p.id === id) || {}).en || "Program";

function render() {
  const v = view();
  $$(".tabs a").forEach(a => a.setAttribute("aria-current", a.hash === "#" + v));
  $("#title").textContent = VIEWS[v];
  const sub = $("#subseg"); sub.hidden = v !== "site";
  if (v === "site") sub.innerHTML = [["programs", "Programs"], ["videos", "Videos"], ["reviews", "Reviews"]].map(([k, l]) => `<button data-sub="${k}" aria-pressed="${k === siteTab}">${l}</button>`).join("");
  const add = $("#addBtn"); add.hidden = !ADD[v] || (v === "site" && siteTab !== "programs"); if (ADD[v]) add.textContent = ADD[v];
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
        e.scholarship && e.scholarship !== "none" ? btn("essay", "Scholarship", "") : "",
        btn("delEnrol", "Delete", "danger")
      ].join("");
      return `<li class="item"><div class="grow"><b>${esc(e.name)}</b><small>${esc(e.email)} · ${esc(e.course)}</small>
        ${e.note ? `<small>“${esc(e.note)}”</small>` : ""}${e.scholarship && e.scholarship !== "none" ? `<small>🎓 ${e.scholarship === "full" ? "100%" : "50%"} scholarship requested${e.scholarshipDecision ? " · decision: " + esc(e.scholarshipDecision) : " · not decided yet"}</small>` : ""}<small>${when(e.createdAt)}</small></div>
        <span class="pill s-${esc(st)}">${esc(st)}</span><div class="acts">${acts}</div></li>`;
    }).join("");
  } else if (v === "students" || v === "teachers") {
    const role = v === "teachers" ? "teacher" : "student";
    empty = `No ${role}s yet. Tap “Add ${role}” to create the first account.`;
    html = users.filter(u => u.role === role).filter(hit).sort((a, b) => (a.loginId || "").localeCompare(b.loginId || "")).map(u => {
      const st = u.status || "active";
      return `<li class="item"><div class="grow"><b>${esc(u.name)}</b><small>ID: ${esc(u.loginId)}${u.email ? " · " + esc(u.email) : ""}</small></div>
        <span class="pill s-${esc(st)}">${esc(st)}</span>
        <div class="acts"><button class="btn small" data-act="preview" data-id="${u.id}">Preview</button>${u.email ? `<a class="btn small ghost" href="mailto:${encodeURIComponent(u.email)}">Email</a>` : ""}
        <button class="btn small ghost" data-act="toggle" data-id="${u.id}">${st === "active" ? "Deactivate" : "Activate"}</button></div></li>`;
    }).join("");
  } else if (v === "classes") {
    empty = programs.length ? "No classes yet. Tap “Add class” to create one." : "Add at least one program first (Programs tab), then create classes.";
    html = classes.filter(c => hit({ name: progName(c.programId) + " " + (c.label || ""), email: c.teacherName }))
      .sort((a, b) => firstKey(a) - firstKey(b)).map(c => {
        const n = members.filter(m => m.classId === c.id).length, st = c.status || "active";
        const btn = (act, label, cls = "ghost") => `<button class="btn small ${cls}" data-act="${act}" data-id="${c.id}">${label}</button>`;
        return `<li class="item"><div class="grow"><b>${esc(progName(c.programId))}${c.label ? " · " + esc(c.label) : ""}</b>
          <small>${esc(scheduleLine(c, DAYS))} · ${esc(tzLabel(c.tz || DEFAULT_TZ))}</small>${c.startDate ? `<small>${esc(durationText(c, "en"))}</small>` : ""}
          <small>${esc(c.teacherName || "No teacher yet")}${c.level ? " · " + esc(levelText(c.level, "en")) : ""}</small>
          <small>${safeUrl(c.zoomUrl) ? "Zoom ✓" : "Zoom –"} · ${safeUrl(c.telegramUrl) ? "Telegram ✓" : "Telegram –"}</small>
          <small>${n} student${n === 1 ? "" : "s"}${c.public ? " · shown on website" : " · not on website"}</small></div>
          <span class="pill s-${st === "completed" ? "enrolled" : "active"}">${esc(st)}</span>
          <div class="acts">${btn("members", "Students")}${btn("records", "Exams & grades")}${btn("editClass", "Edit")}${btn("delClass", "Delete", "danger")}</div></li>`;
      }).join("");
  } else if (v === "reports") {
    empty = "No reports yet. Reports from students and teachers appear here.";
    html = reports.slice().sort((a, b) => ts(b.createdAt) - ts(a.createdAt)).filter(r => hit({ name: r.fromName + " " + (r.subject || ""), email: r.text, loginId: r.loginId })).map(r => `<li class="item"><div class="grow">
      <b>${esc(r.subject || "(no subject)")}</b><small>${esc(r.fromName)} · ${esc(r.fromRole)} · ID ${esc(r.loginId)} · ${when2(r.createdAt)}</small>
      <small style="color:var(--text)">${esc(r.text)}</small>${r.adminReply ? `<small class="reply">Your reply: ${esc(r.adminReply)}</small>` : ""}</div>
      <span class="pill s-${r.status === "resolved" ? "active" : "pending"}">${esc(r.status === "resolved" ? "resolved" : "new")}</span>
      <div class="acts"><button class="btn small" data-act="reply" data-id="${r.id}">Reply</button>
      <button class="btn small ghost" data-act="toggleReport" data-id="${r.id}">${r.status === "resolved" ? "Reopen" : "Mark resolved"}</button>
      <button class="btn small danger" data-act="delReport" data-id="${r.id}">Delete</button></div></li>`).join("");
  } else if (v === "site" && siteTab === "videos") {
    html = [["guest", "Visitors (shown on the public page)"], ["student", "Students (shown in the student portal)"], ["teacher", "Teachers (shown in the teacher portal)"]]
      .map(([k, l]) => `<li class="item"><div class="grow"><b>${l}</b><small>${safeUrl(guides[k]) ? esc(guides[k]) : "No video yet"}</small></div></li>`).join("")
      + `<li class="item"><button class="btn small" data-act="editGuides">Edit video links</button></li>`;
  } else if (v === "site" && siteTab === "reviews") {
    empty = "No reviews yet. Students write one when they complete a class.";
    html = reviews.slice().sort((a, b) => ts(b.createdAt) - ts(a.createdAt)).filter(r => hit({ name: r.studentName, email: r.text })).map(r => `<li class="item"><div class="grow">
      <b><span class="stars">${stars(r.rating)}</span> ${esc(r.studentName)}</b><small>${esc(progName(r.programId))}</small>
      <small style="color:var(--text)">${esc(r.text)}</small><small>${r.allowPublic ? "Allowed to be shown on the website" : "Did not allow public display"} · ${when(r.createdAt)}</small></div>
      <span class="pill s-${r.status === "approved" ? "active" : "pending"}">${r.status === "approved" ? "published" : "private"}</span>
      <div class="acts">${r.status === "approved" ? `<button class="btn small ghost" data-act="unpublish" data-id="${r.id}">Unpublish</button>` : r.allowPublic ? `<button class="btn small" data-act="publish" data-id="${r.id}">Publish</button>` : ""}
      <button class="btn small danger" data-act="delReview" data-id="${r.id}">Delete</button></div></li>`).join("");
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

/* Sub-segment tab selection for Site view */
$("#subseg").addEventListener("click", e => {
  const b = e.target.closest("[data-sub]");
  if (!b) return;
  siteTab = b.dataset.sub;
  render();
});

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
    if (act === "preview") openPreview(us);
    if (act === "reply") openReply(reports.find(x => x.id === id));
    if (act === "toggleReport") { const r = reports.find(x => x.id === id); await db.collection("reports").doc(id).update({ status: r.status === "resolved" ? "new" : "resolved" }); }
    if (act === "delReport" && confirm("Delete this report?")) await db.collection("reports").doc(id).delete();
    if (act === "essay") openEssay(en);
    if (act === "editGuides") openGuides();
    if (act === "publish") await publishReview(reviews.find(x => x.id === id));
    if (act === "unpublish") { const b = db.batch(); b.delete(db.collection("testimonials").doc(id)); b.update(db.collection("reviews").doc(id), { status: "pending" }); await b.commit(); toast("Unpublished"); }
    if (act === "delReview" && confirm("Delete this review?")) { const b = db.batch(); b.delete(db.collection("testimonials").doc(id)); b.delete(db.collection("reviews").doc(id)); await b.commit(); }
    if (act === "delClass") await deleteClass(classes.find(x => x.id === id));
  } catch (err) { console.error(err); toast("Something went wrong. Try again."); }
});

/* ---------- Missing Site Helpers (Guides / Reviews Publishing) ---------- */
function openGuides() {
  sheet("Edit video links", `
    <form id="mForm" class="group form" style="margin-top:14px" novalidate>
      <label><span>Visitors video link</span><input name="guest" placeholder="https://youtube.com/…" value="${esc(guides.guest || "")}"></label>
      <label><span>Students video link</span><input name="student" placeholder="https://youtube.com/…" value="${esc(guides.student || "")}"></label>
      <label><span>Teachers video link</span><input name="teacher" placeholder="https://youtube.com/…" value="${esc(guides.teacher || "")}"></label>
    </form><button class="btn wide" id="mSave">Save</button>`);
  $("#mSave").onclick = async () => {
    const f = $("#mForm").elements;
    const d = {
      guest: safeUrl(f.guest.value.trim()),
      student: safeUrl(f.student.value.trim()),
      teacher: safeUrl(f.teacher.value.trim())
    };
    try {
      await db.collection("siteContent").doc("guides").set(d, { merge: true });
      closeModal(); toast("Video links saved");
    } catch (e) {
      console.error(e); mErr("Could not save. Try again.");
    }
  };
}

async function publishReview(r) {
  if (!r) return;
  const b = db.batch();
  b.set(db.collection("testimonials").doc(r.id), {
    programId: r.programId,
    studentName: r.studentName,
    rating: r.rating,
    text: r.text,
    createdAt: r.createdAt || firebase.firestore.FieldValue.serverTimestamp()
  });
  b.update(db.collection("reviews").doc(r.id), { status: "approved" });
  await b.commit();
  toast("Review published");
}

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
$("#addBtn").onclick = () => { const v = view(); if (v === "classes") openClass(); else if (v === "site") openProgram(); else openCreate({ role: v === "teachers" ? "teacher" : "student" }); };
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

  const defaultClass = {
    programId: "", label: "", teacherId: "", tz: "", startDate: "", durationMonths: "",
    venue_en: "", venue_my: "", level: "", telegramUrl: "", zoomUrl: "",
    status: "active", public: true, ...c
  };

  if (!defaultClass.sessions || !defaultClass.sessions.length) {
    defaultClass.sessions = [{ day: "Monday", start: "09:00", end: "10:00", active: true }];
  }

  const teachers = users.filter(u => u.role === "teacher" && (u.status !== "inactive" || u.id === defaultClass.teacherId));

  sheet(defaultClass.id ? "Edit class" : "New class", `
    <form id="mForm" class="group form" style="margin-top:14px" novalidate>
      <label><span>Program</span><select name="programId">${opts(programs.map(p => [p.id, p.en]), defaultClass.programId)}</select></label>
      <label><span>Group name</span><input name="label" placeholder="e.g. Evening A" value="${esc(defaultClass.label)}"></label>
      <label><span>Teacher</span><select name="teacherId">${opts([["", "— none yet —"], ...teachers.map(t => [t.id, `${t.name} (${t.loginId})`])], defaultClass.teacherId)}</select></label>
      ${sessionFields(sessionsOf(defaultClass), DAYS, SESS_L)}
      <label><span>Time zone</span><select name="tz">${tzOptions(defaultClass.tz)}</select></label>
      <label><span>Start date</span><input type="date" name="startDate" value="${esc(defaultClass.startDate)}"></label>
      <label><span>Duration</span><select name="durationMonths">${opts([["", "— not set —"], ...Array.from({ length: 12 }, (_, i) => [i + 1, `${i + 1} month${i ? "s" : ""}`])], defaultClass.durationMonths || "")}</select></label>
      <label><span>Place (English)</span><input name="venue_en" placeholder="Online via Zoom" value="${esc(defaultClass.venue_en)}"></label>
      <label><span>Place (မြန်မာ)</span><input name="venue_my" value="${esc(defaultClass.venue_my)}"></label>
      <label><span>Level</span><select name="level">${opts([["", "— not set —"], ...LEVELS.map(l => [l, levelText(l, "en") + " · " + LEVEL_NAME.my[l]])], defaultClass.level || "")}</select></label>
      <label><span>Telegram link</span><input name="telegramUrl" placeholder="https://t.me/…" autocapitalize="none" value="${esc(defaultClass.telegramUrl)}"></label>
      <label><span>Zoom link</span><input name="zoomUrl" placeholder="https://zoom.us/j/…" autocapitalize="none" value="${esc(defaultClass.zoomUrl)}"></label>
      <label><span>Status</span><select name="status">${opts([["active", "Active"], ["completed", "Completed"]], defaultClass.status || "active")}</select></label>
      <label><span>On website</span><select name="public">${opts([["yes", "Show on public schedule"], ["no", "Keep private"]], defaultClass.public === false ? "no" : "yes")}</select></label>
    </form><p class="note center" id="durNote"></p><button class="btn wide" id="mSave">Save</button>`);

  const updDur = () => {
    const f = $("#mForm").elements;
    const sr = readSessions(f, SESS_L);
    
    if (f.startDate.value && f.durationMonths.value && !sr.error && sr.list && sr.list.length > 0) {
      const i = courseInfo({ 
        startDate: f.startDate.value, 
        durationMonths: f.durationMonths.value, 
        sessions: sr.list 
      });

      if (i && i.end) {
        $("#durNote").textContent = `Ends ${fmtDate(i.end, "en")} · ${i.total} session${i.total === 1 ? "" : "s"} in total`;
        return;
      }
    }
    $("#durNote").textContent = f.startDate.value && f.durationMonths.value ? "Complete session details to calculate total sessions" : "";
  };

  $("#mForm").addEventListener("input", updDur); 
  $("#mForm").addEventListener("change", updDur); 
  updDur();

  $("#mSave").onclick = async () => {
    const f = $("#mForm").elements, t = users.find(u => u.id === f.teacherId.value);
    if (!!f.startDate.value !== !!f.durationMonths.value) return mErr("Set both the start date and the duration, or leave both empty.");
    
    const sr = readSessions(f, SESS_L); 
    if (sr.error) return mErr(sr.error);

    const d = { 
      programId: f.programId.value, 
      label: f.label.value.trim(), 
      teacherId: f.teacherId.value, 
      teacherName: t ? t.name : "",
      ...scheduleFields(sr.list || [], f.tz.value), 
      venue_en: f.venue_en.value.trim(), 
      venue_my: f.venue_my.value.trim() || f.venue_en.value.trim(),
      status: f.status.value, 
      public: f.public.value === "yes", 
      level: f.level.value, 
      startDate: f.startDate.value, 
      durationMonths: f.durationMonths.value ? Number(f.durationMonths.value) : "", 
      telegramUrl: safeUrl(f.telegramUrl.value), 
      zoomUrl: safeUrl(f.zoomUrl.value) 
    };

    if ((f.telegramUrl.value.trim() && !d.telegramUrl) || (f.zoomUrl.value.trim() && !d.zoomUrl)) return mErr("Links must start with https://");

    const ref = defaultClass.id ? db.collection("classes").doc(defaultClass.id) : db.collection("classes").doc();
    const pub = db.collection("publicSchedule").doc(ref.id);
    const b = db.batch();

    b.set(ref, { ...d, ...(defaultClass.id ? {} : { createdAt: firebase.firestore.FieldValue.serverTimestamp() }) }, { merge: true });
    
    if (d.public && d.status === "active") {
      b.set(pub, { programId: d.programId, label: d.label, day: d.day, time: d.time, sessions: d.sessions, tz: d.tz, venue_en: d.venue_en, venue_my: d.venue_my, level: d.level, startDate: d.startDate, durationMonths: d.durationMonths });
    } else {
      b.delete(pub);
    }

    try { 
      await b.commit(); 
      closeModal(); 
      toast("Class saved"); 
    } catch (e) { 
      console.error(e); 
      mErr("Could not save. Try again."); 
    }
  };
}

async function deleteClass(c) {
  if (!c || !confirm("Delete this class and remove its students from it?")) return;
  const b = db.batch();
  b.delete(db.collection("classes").doc(c.id)); b.delete(db.collection("publicSchedule").doc(c.id));
  members.filter(m => m.classId === c.id).forEach(m => b.delete(db.collection("memberships").doc(m.id)));
  const snaps = await Promise.all(["exams", "grades", "attendance", "attendanceEntries", "materials", "messages", "reviews"].map(n => db.collection(n).where("classId", "==", c.id).get()));
  const refs = snaps.flatMap(s => s.docs.map(d => d.ref));
  await b.commit();
  for (let i = 0; i < refs.length; i += 400) { const bb = db.batch(); refs.slice(i, i + 400).forEach(r => bb.delete(r)); await bb.commit(); }
  toast("Class deleted");
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
  const [ex, gr] = await Promise.all([
    db.collection("exams").where("classId", "==", c.id).get(),
    db.collection("grades").where("classId", "==", c.id).get()
  ]);
  const exams = ex.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const grades = gr.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.studentName || "").localeCompare(b.studentName || ""));
  const mem = members.filter(m => m.classId === c.id).sort((a, b) => (a.loginId || "").localeCompare(b.loginId || ""));
  const rowBtn = (a, id, label, cls = "danger") => `<button class="btn small ${cls}" data-r="${a}" data-id="${id}">${label}</button>`;
  const none = m => `<li class="empty"><div>${m}</div></li>`;

  sheet(`Records · ${progName(c.programId)}`, `
    <p class="sub">Exams</p>
    <ul class="group">${exams.map(e => `<li class="item"><div class="grow"><b>${esc(e.title)}</b><small>${esc(e.date)} ${esc(e.time)} ${e.venue ? "· " + esc(e.venue) : ""}${safeUrl(e.link) ? " · link ✓" : ""}</small></div>${rowBtn("delExam", e.id, "Delete")}</li>`).join("") || none("No exams yet.")}</ul>
    <form id="exForm" class="group form" style="margin-top:10px" novalidate>
      <label><span>Title</span><input name="title" placeholder="Midterm exam"></label>
      <label><span>Date</span><input name="date" type="date"></label>
      <label><span>Time</span><input name="time" placeholder="7:00 PM"></label>
      <label><span>Place</span><input name="venue" placeholder="Online"></label>
      <label><span>Zoom / exam link</span><input name="link" placeholder="https://" autocapitalize="none"></label></form>
    <button class="btn small wide" data-r="addExam">Add exam</button>

    <p class="sub">Students · completion</p>
    <ul class="group">${mem.map(m => `<li class="item"><div class="grow"><b>${esc(m.studentName)}</b><small>ID: ${esc(m.loginId)}${m.certNo ? " · " + esc(m.certNo) : ""}</small></div>
      <span class="pill s-${m.status === "completed" ? "enrolled" : "active"}">${esc(m.status || "enrolled")}</span>
      ${m.status === "completed" ? rowBtn("reopen", m.id, "Reopen", "ghost") : rowBtn("complete", m.id, "Mark completed", "")}</li>`).join("") || none("No students in this class yet.")}</ul>

    <p class="sub">Grades</p>
    <ul class="group">${grades.map(g => `<li class="item"><div class="grow"><b>${esc(g.studentName)} · ${esc(g.title)}</b><small>${esc(g.score)} / ${esc(g.max)} (${pctOf(g)}%)${g.comment ? " · " + esc(g.comment) : ""}</small></div>${rowBtn("delGrade", g.id, "Delete")}</li>`).join("") || none("No grades yet.")}</ul>
    ${mem.length ? `<form id="grForm" class="group form" style="margin-top:10px" novalidate>
      <label><span>Student</span><select name="student">${opts(mem.map(m => [m.studentId, `${m.studentName} (${m.loginId})`]), "")}</select></label>
      <label><span>Title</span><input name="title" placeholder="Midterm exam"></label>
      <label><span>Score</span><input name="score" type="number" step="any" inputmode="decimal"></label>
      <label><span>Out of</span><input name="max" type="number" step="any" value="100"></label>
      <label><span>Comment</span><input name="comment"></label></form>
    <button class="btn small wide" data-r="addGrade">Add grade</button>` : ""}`);

  if (keep && $(".sheet", modal)) $(".sheet", modal).scrollTop = keep;

  $(".sheet", modal).onclick = async e => {
    const btn = e.target.closest("[data-r]");
    if (!btn) return;
    const action = btn.dataset.r;
    const id = btn.dataset.id;

    try {
      if (action === "complete") {
        const certNo = prompt("Enter certificate number (optional):", "") || "";
        await db.collection("memberships").doc(id).update({ status: "completed", certNo: certNo.trim() });
        toast("Student marked as completed");
        openRecords(c);
      }
      if (action === "reopen") {
        await db.collection("memberships").doc(id).update({ status: "enrolled", certNo: "" });
        toast("Student status reopened");
        openRecords(c);
      }
      if (action === "addExam") {
        const f = $("#exForm").elements;
        const title = f.title.value.trim();
        if (!title) return mErr("Please enter the exam title.");
        await db.collection("exams").add({
          classId: c.id,
          title,
          date: f.date.value,
          time: f.time.value.trim(),
          venue: f.venue.value.trim(),
          link: safeUrl(f.link.value),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        toast("Exam added");
        openRecords(c);
      }
      if (action === "delExam" && confirm("Delete this exam?")) {
        await db.collection("exams").doc(id).delete();
        toast("Exam deleted");
        openRecords(c);
      }
      if (action === "addGrade") {
        const f = $("#grForm").elements;
        const studentId = f.student.value;
        const title = f.title.value.trim();
        const score = Number(f.score.value);
        const max = Number(f.max.value) || 100;
        if (!studentId) return mErr("Please select a student.");
        if (!title) return mErr("Please enter a title for the grade.");
        if (isNaN(score)) return mErr("Please enter a valid score.");
        const m = mem.find(x => x.studentId === studentId);
        await db.collection("grades").add({
          classId: c.id,
          studentId,
          studentName: m ? m.studentName : "",
          title,
          score,
          max,
          comment: f.comment.value.trim(),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        toast("Grade added");
        openRecords(c);
      }
      if (action === "delGrade" && confirm("Delete this grade?")) {
        await db.collection("grades").doc(id).delete();
        toast("Grade deleted");
        openRecords(c);
      }
    } catch (err) {
      console.error(err);
      mErr("Could not update record. Try again.");
    }
  };
}
