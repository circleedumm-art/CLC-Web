/* CLC teacher portal – Step 5.
   A teacher sees only the classes assigned to them: attendance, grades, exams and class time.
   The real protection is in firestore.rules. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(), db = firebase.firestore(), FV = firebase.firestore.FieldValue;
let lang = store.get("clc_lang") || "en", me = null, ready = false, programs = [], classes = [], members = [], cache = {}, cur = {}, rt = 0;

const DAYS = {
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  my: ["တနင်္လာ", "အင်္ဂါ", "ဗုဒ္ဓဟူး", "ကြာသပတေး", "သောကြာ", "စနေ", "တနင်္ဂနွေ"]
};
const T = {
  en: { classes: "Classes", profile: "Profile", site: "Site", logout: "Log out", hi: "Hello", noClass: "No classes assigned to you yet.", students: "students",
    att: "Attendance", grades: "Grades", exams: "Exams", info: "Class", date: "Date", present: "Present", late: "Late", absent: "Absent", excused: "Excused",
    markAll: "Mark all present", saveAtt: "Save attendance", savedAtt: "Attendance saved", noMarks: "Mark at least one student first.", noStudents: "No students in this class yet.",
    student: "Student", title: "Title", score: "Score", outOf: "Out of", comment: "Comment", addGrade: "Add grade", noGrades: "No grades yet.", badScore: "Enter a title and a score between 0 and the maximum.",
    addExam: "Add exam", place: "Place", time: "Time", noExams: "No exams yet.", needExam: "An exam needs a title and a date.", day: "Day", placeEn: "Place (English)", placeMy: "Place (မြန်မာ)",
    saveTime: "Save time change", timeSaved: "Class time updated", rate: "Attendance", program: "Program", status: "Status", active: "Active", completed: "Completed",
    changeTime: "Change class time", roster: "Students", del: "Delete", confirmDel: "Delete this entry?", fail: "Something went wrong. Try again.", loadFail: "Could not load some of your data.",
    inactive: "Your account is inactive. Please contact the CLC admin.", needTime: "Please enter the class time.",
    name: "Name", id: "Login ID", email: "Email", phone: "Phone", location: "Location", about: "About me", mine: "My details", save: "Save", saved: "Saved",
    pw: "Change password", cur: "Current password", nw: "New password", change: "Change password", pwOk: "Password changed", pwBad: "Current password is wrong, or the new one is too short (minimum 6)." },
  my: { classes: "အတန်းများ", profile: "ကိုယ်ရေး", site: "ဝက်ဘ်ဆိုက်", logout: "ထွက်မည်", hi: "မင်္ဂလာပါ", noClass: "သင့်ထံ အတန်း မပေးရသေးပါ။", students: "ဦး",
    att: "တက်ရောက်မှု", grades: "အမှတ်", exams: "စာမေးပွဲ", info: "အတန်း", date: "ရက်စွဲ", present: "တက်ရောက်", late: "နောက်ကျ", absent: "ပျက်ကွက်", excused: "ခွင့်ယူ",
    markAll: "အားလုံး တက်ရောက်", saveAtt: "တက်ရောက်မှု သိမ်းမည်", savedAtt: "တက်ရောက်မှု သိမ်းပြီးပါပြီ", noMarks: "ကျောင်းသား တစ်ဦးအနည်းဆုံး မှတ်ပါ။", noStudents: "ဤအတန်းတွင် ကျောင်းသား မရှိသေးပါ။",
    student: "ကျောင်းသား", title: "ခေါင်းစဉ်", score: "ရမှတ်", outOf: "အမြင့်ဆုံး", comment: "မှတ်ချက်", addGrade: "အမှတ် ထည့်မည်", noGrades: "အမှတ် မရှိသေးပါ။", badScore: "ခေါင်းစဉ်ထည့်ပြီး ရမှတ်ကို ၀ နှင့် အမြင့်ဆုံးကြား ထည့်ပါ။",
    addExam: "စာမေးပွဲ ထည့်မည်", place: "နေရာ", time: "အချိန်", noExams: "စာမေးပွဲ မရှိသေးပါ။", needExam: "စာမေးပွဲတွင် ခေါင်းစဉ်နှင့် ရက်စွဲ လိုအပ်ပါသည်။", day: "နေ့", placeEn: "နေရာ (English)", placeMy: "နေရာ (မြန်မာ)",
    saveTime: "အချိန်ပြောင်းမှု သိမ်းမည်", timeSaved: "အတန်းအချိန် ပြောင်းပြီးပါပြီ", rate: "တက်ရောက်မှု", program: "သင်တန်း", status: "အခြေအနေ", active: "ဖွင့်ထား", completed: "ပြီးဆုံး",
    changeTime: "အတန်းအချိန် ပြောင်းရန်", roster: "ကျောင်းသားများ", del: "ဖျက်မည်", confirmDel: "ဤအချက်အလက်ကို ဖျက်မလား?", fail: "တစ်ခုခု မှားသွားပါသည်။ ပြန်ကြိုးစားပါ။", loadFail: "အချက်အလက် အချို့ ဖတ်မရပါ။",
    inactive: "သင့်အကောင့်ကို ရပ်ဆိုင်းထားပါသည်။ CLC အက်ဒမင်ကို ဆက်သွယ်ပါ။", needTime: "အတန်းအချိန် ထည့်ပါ။",
    name: "အမည်", id: "ID", email: "အီးမေးလ်", phone: "ဖုန်း", location: "နေရပ်", about: "ကိုယ်ပိုင်အကြောင်း", mine: "ကျွန်ုပ်၏ အချက်အလက်", save: "သိမ်းမည်", saved: "သိမ်းပြီးပါပြီ",
    pw: "စကားဝှက် ပြောင်းရန်", cur: "လက်ရှိ စကားဝှက်", nw: "စကားဝှက်အသစ်", change: "စကားဝှက် ပြောင်းမည်", pwOk: "စကားဝှက် ပြောင်းပြီးပါပြီ", pwBad: "လက်ရှိ စကားဝှက် မှားနေပါသည် သို့မဟုတ် အသစ်သည် တိုလွန်းသည် (အနည်းဆုံး ၆ လုံး)။" }
};
const t = k => T[lang][k];

/* ---------- Theme, language, toast ---------- */
function setTheme(x) { document.documentElement.dataset.theme = x; $('meta[name="theme-color"]').content = x === "dark" ? "#000000" : "#F2F2F7"; }
setTheme(store.get("clc_theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("#themeBtn").onclick = () => { const x = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; setTheme(x); store.set("clc_theme", x); };
$$("[data-lang]").forEach(b => b.onclick = () => { lang = b.dataset.lang; store.set("clc_lang", lang); render(); });
$("#logout").onclick = () => auth.signOut();
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.hidden = false; clearTimeout(toast.id); toast.id = setTimeout(() => el.hidden = true, 3500); }

/* ---------- Load ---------- */
auth.onAuthStateChanged(async u => {
  if (!u) { location.replace("index.html"); return; }
  try { const d = await db.collection("users").doc(u.uid).get(); me = d.exists ? { id: u.uid, ...d.data() } : null; } catch (e) { console.error(e); }
  if (!me || me.role !== "teacher") { location.replace(u.email === ADMIN_EMAIL ? "admin.html" : me && me.role === "student" ? "student.html" : "index.html"); return; }
  document.body.hidden = false; render();
  if (me.status === "inactive") { $("#view").innerHTML = `<ul class="group"><li class="empty"><div>${t("inactive")}</div></li></ul>`; return; }
  await load(); ready = true; render();
});

const docs = s => s.docs.map(d => ({ id: d.id, ...d.data() }));
async function load() {
  try {
    const [pr, cs] = await Promise.all([db.collection("programs").get(), db.collection("classes").where("teacherId", "==", me.id).get()]);
    programs = docs(pr); classes = docs(cs);
    const ms = await Promise.all(classes.map(c => db.collection("memberships").where("classId", "==", c.id).get()));
    members = ms.flatMap(docs);
  } catch (e) { console.error(e); toast(t("loadFail")); }
}
async function classData(id) {
  if (cache[id]) return cache[id];
  const q = n => db.collection(n).where("classId", "==", id).get();
  const [ex, gr, at] = await Promise.all([q("exams"), q("grades"), q("attendance")]);
  return cache[id] = { exams: docs(ex), grades: docs(gr), att: docs(at) };
}

/* ---------- Helpers ---------- */
const cTitle = c => { const p = programs.find(x => x.id === c.programId); return (p ? p[lang] : "") + (c.label ? " · " + c.label : ""); };
const mem = c => members.filter(m => m.classId === c.id).sort((a, b) => (a.loginId || "").localeCompare(b.loginId || ""));
const live = c => mem(c).filter(m => m.status !== "completed");
const empty = m => `<li class="empty"><div>${m}</div></li>`;
const opts = (arr, sel) => arr.map(([v, x]) => `<option value="${esc(v)}" ${String(v) === String(sel) ? "selected" : ""}>${esc(x)}</option>`).join("");
const fmt = d => { const x = new Date(d + "T00:00"); return isNaN(x) ? esc(d) : x.toLocaleDateString(lang === "my" ? "my-MM" : "en-GB", { day: "numeric", month: "short", year: "numeric" }); };
const today = () => new Date().toLocaleDateString("en-CA");
const first = () => (me.name || "").split(" ")[0];

/* ---------- Router ---------- */
function render() {
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
  $$("[data-lang]").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  if (!me || !ready) return;
  const token = ++rt, [v, id, tab] = (location.hash || "#classes").slice(1).split("/");
  $$(".tabs a").forEach(a => a.setAttribute("aria-current", a.hash === (v === "profile" ? "#profile" : "#classes")));
  if (v === "profile") { $("#title").textContent = t("profile"); $("#view").innerHTML = profileHtml(); bindProfile(); return; }
  const c = v === "class" && classes.find(x => x.id === id);
  if (c) return renderClass(c, ["att", "grades", "exams", "info"].includes(tab) ? tab : "att", token);
  $("#title").textContent = `${t("hi")}, ${first()}`;
  $("#view").innerHTML = `<ul class="group">${classes.slice().sort((a, b) => a.day - b.day || String(a.time).localeCompare(String(b.time))).map(c => `
    <li class="item go" tabindex="0" data-go="${c.id}"><div class="grow"><b>${esc(cTitle(c))}</b>
    <small>${DAYS[lang][c.day]} · ${esc(c.time)}${c["venue_" + lang] ? " · " + esc(c["venue_" + lang]) : ""}</small>
    <small>${live(c).length} ${t("students")}</small></div><span class="pill s-${c.status === "completed" ? "enrolled" : "active"}">${t(c.status === "completed" ? "completed" : "active")}</span></li>`).join("") || empty(t("noClass"))}</ul>`;
}
addEventListener("hashchange", render);
$("#view").addEventListener("click", e => { const g = e.target.closest("[data-go]"); if (g) location.hash = `#class/${g.dataset.go}/att`; });
$("#view").addEventListener("keydown", e => { if (e.key === "Enter") e.target.click(); });

async function renderClass(c, tab, token) {
  $("#title").textContent = cTitle(c);
  const d = await classData(c.id);
  if (token !== rt) return;
  $("#view").innerHTML = `<a class="back" href="#classes">‹ ${t("classes")}</a>
    <div class="seg full">${["att", "grades", "exams", "info"].map(s => `<button data-sub="${s}" aria-pressed="${s === tab}">${t(s)}</button>`).join("")}</div>${BODY[tab](c, d)}`;
  $$("[data-sub]").forEach(b => b.onclick = () => location.hash = `#class/${c.id}/${b.dataset.sub}`);
  BIND[tab](c, d);
}
const guard = fn => async (...a) => { try { await fn(...a); } catch (e) { console.error(e); toast(t("fail")); } };

/* ---------- Class tabs ---------- */
const STATES = ["present", "late", "absent", "excused"];
const attRows = c => live(c).map(m => `<li class="item"><div class="grow"><b>${esc(m.studentName)}</b><small>ID ${esc(m.loginId)}</small></div>
  <div class="seg mini" data-sid="${m.studentId}">${STATES.map(v => `<button data-v="${v}" aria-pressed="${cur[m.studentId] === v}">${t(v)}</button>`).join("")}</div></li>`).join("") || empty(t("noStudents"));

const BODY = {
  att(c, d) {
    const doc = d.att.find(a => a.date === today()); cur = { ...(doc ? doc.records : {}) };
    return `<form class="group form" style="margin:14px 0" onsubmit="return false"><label><span>${t("date")}</span><input id="adate" type="date" value="${today()}"></label></form>
      <ul class="group" id="alist">${attRows(c)}</ul>
      <button class="btn small ghost wide" id="allP">${t("markAll")}</button><button class="btn wide" id="asave">${t("saveAtt")}</button>`;
  },
  grades(c, d) {
    const m = mem(c);
    const list = d.grades.slice().sort((a, b) => (a.studentName || "").localeCompare(b.studentName || "")).map(g => `<li class="item"><div class="grow"><b>${esc(g.studentName)} · ${esc(g.title)}</b>
      <small>${esc(g.score)} / ${esc(g.max)}${g.comment ? " · " + esc(g.comment) : ""}</small></div><button class="btn small danger" data-delg="${g.id}">${t("del")}</button></li>`).join("") || empty(t("noGrades"));
    return `<ul class="group" style="margin-top:14px">${list}</ul>${m.length ? `
      <form id="gf" class="group form" style="margin-top:14px" novalidate>
        <label><span>${t("student")}</span><select name="student">${opts(m.map(x => [x.studentId, `${x.studentName} (${x.loginId})`]), "")}</select></label>
        <label><span>${t("title")}</span><input name="title"></label>
        <label><span>${t("score")}</span><input name="score" type="number" step="any" inputmode="decimal"></label>
        <label><span>${t("outOf")}</span><input name="max" type="number" step="any" value="100"></label>
        <label><span>${t("comment")}</span><input name="comment"></label></form>
      <button class="btn wide" id="gadd">${t("addGrade")}</button>` : ""}`;
  },
  exams(c, d) {
    const list = d.exams.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).map(e => `<li class="item"><div class="grow"><b>${esc(e.title)}</b>
      <small>${fmt(e.date)} ${esc(e.time)}${e.venue ? " · " + esc(e.venue) : ""}</small></div><button class="btn small danger" data-dele="${e.id}">${t("del")}</button></li>`).join("") || empty(t("noExams"));
    return `<ul class="group" style="margin-top:14px">${list}</ul>
      <form id="ef" class="group form" style="margin-top:14px" novalidate>
        <label><span>${t("title")}</span><input name="title"></label>
        <label><span>${t("date")}</span><input name="date" type="date"></label>
        <label><span>${t("time")}</span><input name="time" placeholder="7:00 PM"></label>
        <label><span>${t("place")}</span><input name="venue"></label></form>
      <button class="btn wide" id="eadd">${t("addExam")}</button>`;
  },
  info(c, d) {
    const rate = m => { let a = 0, n = 0; d.att.forEach(x => { const v = x.records && x.records[m.studentId]; if (v === "present" || v === "late") { a++; n++; } else if (v === "absent") n++; }); return n ? `${a}/${n} (${Math.round(a / n * 100)}%)` : "—"; };
    const p = programs.find(x => x.id === c.programId);
    return `<ul class="group info" style="margin-top:14px"><li><span>${t("program")}</span><b>${esc(p ? p[lang] : "")}</b></li>
        <li><span>${t("status")}</span><b>${t(c.status === "completed" ? "completed" : "active")}</b></li></ul>
      <p class="sub">${t("changeTime")}</p>
      <form id="tf" class="group form" novalidate>
        <label><span>${t("day")}</span><select name="day">${opts(DAYS[lang].map((x, i) => [i, x]), c.day)}</select></label>
        <label><span>${t("time")}</span><input name="time" value="${esc(c.time)}"></label>
        <label><span>${t("placeEn")}</span><input name="venue_en" value="${esc(c.venue_en)}"></label>
        <label><span>${t("placeMy")}</span><input name="venue_my" value="${esc(c.venue_my)}"></label></form>
      <button class="btn wide" id="tsave">${t("saveTime")}</button>
      <p class="sub">${t("roster")}</p>
      <ul class="group">${mem(c).map(m => `<li class="item"><div class="grow"><b>${esc(m.studentName)}</b><small>ID ${esc(m.loginId)}</small></div>
        <small>${t("rate")}: ${rate(m)}</small></li>`).join("") || empty(t("noStudents"))}</ul>`;
  }
};

const BIND = {
  att(c, d) {
    const list = $("#alist");
    list.onclick = e => {
      const b = e.target.closest("[data-v]"); if (!b) return;
      const seg = b.closest("[data-sid]"); cur[seg.dataset.sid] = b.dataset.v;
      $$("button", seg).forEach(x => x.setAttribute("aria-pressed", x === b));
    };
    $("#adate").onchange = e => { const doc = d.att.find(a => a.date === e.target.value); cur = { ...(doc ? doc.records : {}) }; list.innerHTML = attRows(c); };
    $("#allP").onclick = () => { live(c).forEach(m => cur[m.studentId] = "present"); list.innerHTML = attRows(c); };
    $("#asave").onclick = guard(async () => {
      const date = $("#adate").value; if (!date) return;
      const ids = new Set(live(c).map(m => m.studentId)), records = Object.fromEntries(Object.entries(cur).filter(([k]) => ids.has(k)));
      if (!Object.keys(records).length) return toast(t("noMarks"));
      await db.collection("attendance").doc(`${c.id}_${date}`).set({ classId: c.id, date, records, teacherId: me.id, updatedAt: FV.serverTimestamp() });
      const i = d.att.findIndex(a => a.date === date), row = { id: `${c.id}_${date}`, classId: c.id, date, records };
      if (i >= 0) d.att[i] = row; else d.att.push(row);
      toast(t("savedAtt"));
    });
  },
  grades(c, d) {
    $$("[data-delg]").forEach(b => b.onclick = guard(async () => {
      if (!confirm(t("confirmDel"))) return;
      await db.collection("grades").doc(b.dataset.delg).delete(); d.grades = d.grades.filter(g => g.id !== b.dataset.delg); render();
    }));
    const add = $("#gadd"); if (!add) return;
    add.onclick = guard(async () => {
      const f = $("#gf").elements, m = mem(c).find(x => x.studentId === f.student.value), score = parseFloat(f.score.value), max = parseFloat(f.max.value);
      if (!f.title.value.trim() || isNaN(score) || isNaN(max) || max <= 0 || score < 0 || score > max) return toast(t("badScore"));
      const g = { classId: c.id, studentId: m.studentId, studentName: m.studentName, title: f.title.value.trim(), score, max, comment: f.comment.value.trim(), createdAt: FV.serverTimestamp() };
      const ref = await db.collection("grades").add(g); d.grades.push({ ...g, id: ref.id }); render();
    });
  },
  exams(c, d) {
    $$("[data-dele]").forEach(b => b.onclick = guard(async () => {
      if (!confirm(t("confirmDel"))) return;
      await db.collection("exams").doc(b.dataset.dele).delete(); d.exams = d.exams.filter(x => x.id !== b.dataset.dele); render();
    }));
    $("#eadd").onclick = guard(async () => {
      const f = $("#ef").elements; if (!f.title.value.trim() || !f.date.value) return toast(t("needExam"));
      const e = { classId: c.id, title: f.title.value.trim(), date: f.date.value, time: f.time.value.trim(), venue: f.venue.value.trim() };
      const ref = await db.collection("exams").add(e); d.exams.push({ ...e, id: ref.id }); render();
    });
  },
  info(c) {
    $("#tsave").onclick = guard(async () => {
      const f = $("#tf").elements; if (!f.time.value.trim()) return toast(t("needTime"));
      const ch = { day: Number(f.day.value), time: f.time.value.trim(), venue_en: f.venue_en.value.trim(), venue_my: f.venue_my.value.trim() || f.venue_en.value.trim() };
      const b = db.batch();
      b.update(db.collection("classes").doc(c.id), { ...ch, updatedAt: FV.serverTimestamp() });
      if (c.public && c.status !== "completed") b.update(db.collection("publicSchedule").doc(c.id), ch);   // keep the public timetable in step
      await b.commit(); Object.assign(c, ch); toast(t("timeSaved")); render();
    });
  }
};

/* ---------- Profile ---------- */
function profileHtml() {
  const f = (n, v, area) => `<label><span>${t(n)}</span>${area ? `<textarea name="${n}" rows="3">${esc(v)}</textarea>` : `<input name="${n}" value="${esc(v)}">`}</label>`;
  return `<ul class="group info"><li><span>${t("name")}</span><b>${esc(me.name)}</b></li><li><span>${t("id")}</span><b>${esc(me.loginId)}</b></li>${me.email ? `<li><span>${t("email")}</span><b>${esc(me.email)}</b></li>` : ""}</ul>
    <p class="sub">${t("mine")}</p>
    <form id="pf" class="group form" novalidate>${f("phone", me.phone)}${f("location", me.location)}${f("about", me.about, true)}</form>
    <button class="btn wide" id="ps">${t("save")}</button>
    <p class="sub">${t("pw")}</p>
    <form id="pwf" class="group form" novalidate>
      <label><span>${t("cur")}</span><input name="cur" type="password" autocomplete="current-password"></label>
      <label><span>${t("nw")}</span><input name="nw" type="password" autocomplete="new-password"></label></form>
    <button class="btn ghost wide" id="pws">${t("change")}</button>`;
}
function bindProfile() {
  $("#ps").onclick = guard(async () => {
    const f = $("#pf").elements, d = { phone: f.phone.value.trim(), location: f.location.value.trim(), about: f.about.value.trim() };
    await db.collection("users").doc(me.id).update({ ...d, updatedAt: FV.serverTimestamp() }); Object.assign(me, d); toast(t("saved"));
  });
  $("#pws").onclick = async () => {
    const f = $("#pwf").elements, u = auth.currentUser;
    if (f.nw.value.length < 6) return toast(t("pwBad"));
    try {
      await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, f.cur.value));
      await u.updatePassword(f.nw.value); $("#pwf").reset(); toast(t("pwOk"));
    } catch (e) { console.error(e); toast(t("pwBad")); }
  };
}
