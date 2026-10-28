/* CLC student portal – Step 4.
   Shows only this student's own classes, timetable, exams, grades and certificates.
   The real protection is in firestore.rules (a student can only read their own records). */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(), db = firebase.firestore();
let lang = store.get("clc_lang") || "en", me = null, ready = false, programs = [], rows = [], exams = [], grades = [];

const DAYS = {
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  my: ["တနင်္လာ", "အင်္ဂါ", "ဗုဒ္ဓဟူး", "ကြာသပတေး", "သောကြာ", "စနေ", "တနင်္ဂနွေ"]
};
const T = {
  en: { classes: "Classes", schedule: "Schedule", grades: "Grades", certs: "Certificates", profile: "Profile", site: "Site", logout: "Log out",
    hi: "Hello", enrolled: "Enrolled", completed: "Completed", noClass: "No classes yet. The admin will add you to a class.",
    week: "Weekly timetable", exams: "Exams", noExam: "No exams scheduled.", noGrade: "No grades yet.",
    noCert: "No certificates yet. They appear here when you complete a class.", view: "View certificate", print: "Print / Save as PDF", close: "Close",
    name: "Name", id: "Login ID", email: "Email", phone: "Phone", location: "Location", about: "About me", mine: "My details", save: "Save", saved: "Saved",
    pw: "Change password", cur: "Current password", nw: "New password", change: "Change password", pwOk: "Password changed",
    pwBad: "Current password is wrong, or the new one is too short (minimum 6).", fail: "Something went wrong. Try again.",
    loadFail: "Could not load some of your data.", inactive: "Your account is inactive. Please contact the CLC admin.", teacher: "Teacher",
    cert: "Certificate of Completion", certify: "This certifies that", done: "has successfully completed", date: "Date", no: "Certificate no." },
  my: { classes: "အတန်းများ", schedule: "အချိန်ဇယား", grades: "အမှတ်များ", certs: "လက်မှတ်များ", profile: "ကိုယ်ရေး", site: "ဝက်ဘ်ဆိုက်", logout: "ထွက်မည်",
    hi: "မင်္ဂလာပါ", enrolled: "တက်ရောက်နေသော", completed: "ပြီးဆုံးသော", noClass: "အတန်း မရှိသေးပါ။ အက်ဒမင်က အတန်းထဲ ထည့်ပေးပါမည်။",
    week: "အပတ်စဉ် အချိန်ဇယား", exams: "စာမေးပွဲများ", noExam: "စာမေးပွဲ မရှိသေးပါ။", noGrade: "အမှတ် မရှိသေးပါ။",
    noCert: "လက်မှတ် မရှိသေးပါ။ အတန်းပြီးဆုံးသောအခါ ဤနေရာတွင် ပေါ်ပါမည်။", view: "လက်မှတ်ကြည့်မည်", print: "ပရင့်ထုတ် / PDF သိမ်းမည်", close: "ပိတ်မည်",
    name: "အမည်", id: "ID", email: "အီးမေးလ်", phone: "ဖုန်း", location: "နေရပ်", about: "ကိုယ်ပိုင်အကြောင်း", mine: "ကျွန်ုပ်၏ အချက်အလက်", save: "သိမ်းမည်", saved: "သိမ်းပြီးပါပြီ",
    pw: "စကားဝှက် ပြောင်းရန်", cur: "လက်ရှိ စကားဝှက်", nw: "စကားဝှက်အသစ်", change: "စကားဝှက် ပြောင်းမည်", pwOk: "စကားဝှက် ပြောင်းပြီးပါပြီ",
    pwBad: "လက်ရှိ စကားဝှက် မှားနေပါသည် သို့မဟုတ် အသစ်သည် တိုလွန်းသည် (အနည်းဆုံး ၆ လုံး)။", fail: "တစ်ခုခု မှားသွားပါသည်။ ပြန်ကြိုးစားပါ။",
    loadFail: "အချက်အလက် အချို့ ဖတ်မရပါ။", inactive: "သင့်အကောင့်ကို ရပ်ဆိုင်းထားပါသည်။ CLC အက်ဒမင်ကို ဆက်သွယ်ပါ။", teacher: "ဆရာ",
    cert: "ပြီးဆုံးကြောင်း လက်မှတ်", certify: "ဤလက်မှတ်ဖြင့် ထောက်ခံပါသည်", done: "သည် အောင်မြင်စွာ ပြီးဆုံးခဲ့ပါသည်", date: "ရက်စွဲ", no: "လက်မှတ်အမှတ်" }
};
const t = k => T[lang][k];

/* ---------- Theme & language ---------- */
function setTheme(x) { document.documentElement.dataset.theme = x; $('meta[name="theme-color"]').content = x === "dark" ? "#000000" : "#F2F2F7"; }
setTheme(store.get("clc_theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("#themeBtn").onclick = () => { const x = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; setTheme(x); store.set("clc_theme", x); };
$$("[data-lang]").forEach(b => b.onclick = () => { lang = b.dataset.lang; store.set("clc_lang", lang); render(); });
$("#logout").onclick = () => auth.signOut();

function toast(msg) { const el = $("#toast"); el.textContent = msg; el.hidden = false; clearTimeout(toast.id); toast.id = setTimeout(() => el.hidden = true, 3500); }

/* ---------- Load data ---------- */
auth.onAuthStateChanged(async u => {
  if (!u) { location.replace("index.html"); return; }
  try { const d = await db.collection("users").doc(u.uid).get(); me = d.exists ? { id: u.uid, ...d.data() } : null; } catch (e) { console.error(e); }
  if (!me || me.role !== "student") { location.replace(u.email === ADMIN_EMAIL ? "admin.html" : "index.html"); return; }
  document.body.hidden = false; render();
  if (me.status === "inactive") { $("#view").innerHTML = `<ul class="group"><li class="empty"><div>${t("inactive")}</div></li></ul>`; return; }
  await load(); ready = true; render();
});

async function load() {
  try {
    const [pr, mm] = await Promise.all([db.collection("programs").get(), db.collection("memberships").where("studentId", "==", me.id).get()]);
    programs = pr.docs.map(d => ({ id: d.id, ...d.data() }));
    const mem = mm.docs.map(d => ({ id: d.id, ...d.data() }));
    const cls = await Promise.all(mem.map(m => db.collection("classes").doc(m.classId).get().catch(() => null)));
    rows = mem.map((m, i) => ({ m, c: cls[i] && cls[i].exists ? { id: cls[i].id, ...cls[i].data() } : null })).filter(r => r.c);
    const [ex, gr] = await Promise.all([
      Promise.all(rows.map(r => db.collection("exams").where("classId", "==", r.c.id).get())),
      db.collection("grades").where("studentId", "==", me.id).get()
    ]);
    exams = ex.flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() })));
    grades = gr.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.error(e); toast(t("loadFail")); }
}

/* ---------- Helpers ---------- */
const cTitle = c => { const p = programs.find(x => x.id === c.programId); return (p ? p[lang] : "") + (c.label ? " · " + c.label : ""); };
const fmt = d => { const x = d && d.toDate ? d.toDate() : new Date(String(d).length === 10 ? d + "T00:00" : d); return isNaN(x) ? "" : x.toLocaleDateString(lang === "my" ? "my-MM" : "en-GB", { day: "numeric", month: "short", year: "numeric" }); };
const li = inner => `<li class="item">${inner}</li>`;
const group = (h, items, e) => `${h ? `<p class="sub">${h}</p>` : ""}<ul class="group">${items.length ? items.join("") : `<li class="empty"><div>${e}</div></li>`}</ul>`;
const byDay = (a, b) => a.c.day - b.c.day || String(a.c.time).localeCompare(String(b.c.time));

/* ---------- Views ---------- */
const VIEW = {
  classes() {
    const row = r => li(`<div class="grow"><b>${esc(cTitle(r.c))}</b>
      <small>${DAYS[lang][r.c.day]} · ${esc(r.c.time)}${r.c.teacherName ? ` · ${t("teacher")}: ${esc(r.c.teacherName)}` : ""}</small>
      ${r.c["venue_" + lang] ? `<small>${esc(r.c["venue_" + lang])}</small>` : ""}${r.m.status === "completed" ? `<small>${fmt(r.m.completedAt)}</small>` : ""}</div>`);
    const co = rows.filter(r => r.m.status === "completed");
    return group(t("enrolled"), rows.filter(r => r.m.status !== "completed").sort(byDay).map(row), t("noClass")) + (co.length ? group(t("completed"), co.map(row), "") : "");
  },
  schedule() {
    const act = rows.filter(r => r.m.status !== "completed" && r.c.status !== "completed").sort(byDay);
    const wk = act.map(r => `<li class="day"><span class="d">${DAYS[lang][r.c.day]}</span><span class="c">${esc(cTitle(r.c))}<small>${esc(r.c["venue_" + lang] || "")}</small></span><span class="tm">${esc(r.c.time)}</span></li>`);
    const today = new Date().toISOString().slice(0, 10);
    const ex = exams.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).map(e => {
      const r = rows.find(x => x.c.id === e.classId);
      return li(`<div class="grow"><b>${esc(e.title)}</b><small>${esc(r ? cTitle(r.c) : "")}</small>
        <small>${fmt(e.date)} ${esc(e.time || "")}${e.venue ? " · " + esc(e.venue) : ""}</small></div>${e.date < today ? `<span class="pill">✓</span>` : ""}`);
    });
    return group(t("week"), wk, t("noClass")) + group(t("exams"), ex, t("noExam"));
  },
  grades() {
    const blocks = rows.map(r => {
      const g = grades.filter(x => x.classId === r.c.id);
      return g.length ? group(esc(cTitle(r.c)), g.map(x => li(`<div class="grow"><b>${esc(x.title)}</b>${x.comment ? `<small>${esc(x.comment)}</small>` : ""}</div>
        <b>${esc(x.score)} / ${esc(x.max)}</b><span class="pill">${x.max ? Math.round(x.score / x.max * 100) : 0}%</span>`)), "") : "";
    }).join("");
    return blocks || group("", [], t("noGrade"));
  },
  certs() {
    return group("", rows.filter(r => r.m.status === "completed").map(r => li(`<div class="grow"><b>${esc(cTitle(r.c))}</b><small>${fmt(r.m.completedAt)}</small></div>
      <button class="btn small" data-cert="${r.m.id}">${t("view")}</button>`)), t("noCert"));
  },
  profile() {
    const f = (n, v, tag = "input") => `<label><span>${t(n)}</span>${tag === "input" ? `<input name="${n}" value="${esc(v)}">` : `<textarea name="${n}" rows="3">${esc(v)}</textarea>`}</label>`;
    return `<ul class="group info"><li><span>${t("name")}</span><b>${esc(me.name)}</b></li><li><span>${t("id")}</span><b>${esc(me.loginId)}</b></li>${me.email ? `<li><span>${t("email")}</span><b>${esc(me.email)}</b></li>` : ""}</ul>
      <p class="sub">${t("mine")}</p>
      <form id="pf" class="group form" novalidate>${f("phone", me.phone)}${f("location", me.location)}${f("about", me.about, "area")}</form>
      <button class="btn wide" id="ps">${t("save")}</button>
      <p class="sub">${t("pw")}</p>
      <form id="pwf" class="group form" novalidate>
        <label><span>${t("cur")}</span><input name="cur" type="password" autocomplete="current-password"></label>
        <label><span>${t("nw")}</span><input name="nw" type="password" autocomplete="new-password"></label></form>
      <button class="btn ghost wide" id="pws">${t("change")}</button>`;
  }
};

function render() {
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
  $$("[data-lang]").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  if (!me || !ready) return;
  const v = VIEW[(location.hash || "#classes").slice(1)] ? (location.hash || "#classes").slice(1) : "classes";
  $$(".tabs a").forEach(a => a.setAttribute("aria-current", a.hash === "#" + v));
  $("#title").textContent = v === "classes" ? `${t("hi")}, ${me.name.split(" ")[0]}` : t(v);
  $("#view").innerHTML = VIEW[v]();
  if (v === "profile") bindProfile();
}
addEventListener("hashchange", render);

/* ---------- Profile ---------- */
function bindProfile() {
  $("#ps").onclick = async () => {
    const f = $("#pf").elements, d = { phone: f.phone.value.trim(), location: f.location.value.trim(), about: f.about.value.trim() };
    try { await db.collection("users").doc(me.id).update({ ...d, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }); Object.assign(me, d); toast(t("saved")); }
    catch (e) { console.error(e); toast(t("fail")); }
  };
  $("#pws").onclick = async () => {
    const f = $("#pwf").elements, u = auth.currentUser;
    if (f.nw.value.length < 6) return toast(t("pwBad"));
    try {
      await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, f.cur.value));
      await u.updatePassword(f.nw.value); $("#pwf").reset(); toast(t("pwOk"));
    } catch (e) { console.error(e); toast(t("pwBad")); }
  };
}

/* ---------- Certificate ---------- */
const modal = $("#modal");
const closeModal = () => { modal.hidden = true; modal.innerHTML = ""; };
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
$("#view").addEventListener("click", e => {
  const b = e.target.closest("[data-cert]"); if (!b) return;
  const r = rows.find(x => x.m.id === b.dataset.cert); if (!r) return;
  modal.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>
    <div class="cert"><img src="logo.png" alt="" height="56" onerror="this.remove()"><h4>${t("cert")}</h4><p>${t("certify")}</p><h3>${esc(me.name)}</h3>
    <p>${t("done")}</p><h3>${esc(cTitle(r.c))}</h3>
    <p class="meta">${t("date")}: ${fmt(r.m.completedAt)} · ${t("no")}: ${esc(r.m.certNo || "—")}</p><p class="meta">Circle Learning Centre</p></div>
    <button class="btn wide" id="prt">${t("print")}</button><button class="link" id="mc">${t("close")}</button></div>`;
  modal.hidden = false; $("#prt").onclick = () => print(); $("#mc").onclick = closeModal;
});
