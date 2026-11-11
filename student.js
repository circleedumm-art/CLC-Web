/* CLC student portal.
   A student sees only their own classes, links, teacher profile, attendance, grades, certificates and messages.
   The real protection is in firestore.rules. Shared helpers live in common.js. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = _esc;
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(), db = firebase.firestore(), FV = firebase.firestore.FieldValue;
let lang = store.get("clc_lang") || "en", me = null, ready = false;
let ann = [], annSeenAt = 0, programs = [], rows = [], exams = [], grades = [], entries = [], materials = [], tprof = {}, msgs = [], reports = [], reviews = [], guides = {};

const DAYS = {
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  my: ["တနင်္လာ", "အင်္ဂါ", "ဗုဒ္ဓဟူး", "ကြာသပတေး", "သောကြာ", "စနေ", "တနင်္ဂနွေ"]
};
const T = {
  en: { classes: "Classes", schedule: "Schedule", progress: "Progress", messages: "Messages", profile: "Profile", site: "Site", logout: "Log out",
    hi: "Hello", enrolled: "Enrolled", completed: "Completed", noClass: "No classes yet. The admin will add you to a class.",
    week: "Weekly timetable", exams: "Exams", noExam: "No exams scheduled.", grades: "Grades", certs: "Certificates", noGrade: "No grades yet.",
    noCert: "No certificates yet. They appear here when you complete a class.", view: "View certificate", print: "Print / Save as PDF",
    name: "Name", id: "Login ID", email: "Email", phone: "Phone", location: "Location", about: "About me", mine: "My details", save: "Save", saved: "Saved",
    pw: "Change password", cur: "Current password", nw: "New password", change: "Change password", pwOk: "Password changed",
    pwBad: "Current password is wrong, or the new one is too short (minimum 6).", loadFail: "Could not load some of your data.",
    inactive: "Your account is inactive. Please contact the CLC admin.", cert: "Certificate of Completion", certify: "This certifies that", done: "has successfully completed",
    date: "Date", no: "Certificate no.", material: "Material", open: "Open", noAtt: "No attendance recorded yet.", examLink: "Exam link",
    teacherProfile: "Teacher profile", watchIntro: "Watch intro video", noIntro: "No intro video yet.", noAbout: "No introduction yet.",
    msgTeacher: "Message your teacher", noThreads: "You have no teacher to message yet.", newMsgs: "new", lastMsg: "Last", sessions: "sessions" },
  my: { classes: "အတန်းများ", schedule: "အချိန်ဇယား", progress: "တိုးတက်မှု", messages: "မက်ဆေ့ချ်", profile: "ကိုယ်ရေး", site: "ဝက်ဘ်ဆိုက်", logout: "ထွက်မည်",
    hi: "မင်္ဂလာပါ", enrolled: "တက်ရောက်နေသော", completed: "ပြီးဆုံးသော", noClass: "အတန်း မရှိသေးပါ။ အက်ဒမင်က အတန်းထဲ ထည့်ပေးပါမည်။",
    week: "အပတ်စဉ် အချိန်ဇယား", exams: "စာမေးပွဲများ", noExam: "စာမေးပွဲ မရှိသေးပါ။", grades: "အမှတ်များ", certs: "လက်မှတ်များ", noGrade: "အမှတ် မရှိသေးပါ။",
    noCert: "လက်မှတ် မရှိသေးပါ။ အတန်းပြီးဆုံးသောအခါ ဤနေရာတွင် ပေါ်ပါမည်။", view: "လက်မှတ်ကြည့်မည်", print: "ပရင့်ထုတ် / PDF သိမ်းမည်",
    name: "အမည်", id: "ID", email: "အီးမေးလ်", phone: "ဖုန်း", location: "နေရပ်", about: "ကိုယ်ပိုင်အကြောင်း", mine: "ကျွန်ုပ်၏ အချက်အလက်", save: "သိမ်းမည်", saved: "သိမ်းပြီးပါပြီ",
    pw: "စကားဝှက် ပြောင်းရန်", cur: "လက်ရှိ စကားဝှက်", nw: "စကားဝှက်အသစ်", change: "စကားဝှက် ပြောင်းမည်", pwOk: "စကားဝှက် ပြောင်းပြီးပါပြီ",
    pwBad: "လက်ရှိ စကားဝှက် မှားနေပါသည် သို့မဟုတ် အသစ်သည် တိုလွန်းသည် (အနည်းဆုံး ၆ လုံး)။", loadFail: "အချက်အလက် အချို့ ဖတ်မရပါ။",
    inactive: "သင့်အကောင့်ကို ရပ်ဆိုင်းထားပါသည်။ CLC အက်ဒမင်ကို ဆက်သွယ်ပါ။", cert: "ပြီးဆုံးကြောင်း လက်မှတ်", certify: "ဤလက်မှတ်ဖြင့် ထောက်ခံပါသည်", done: "သည် အောင်မြင်စွာ ပြီးဆုံးခဲ့ပါသည်",
    date: "ရက်စွဲ", no: "လက်မှတ်အမှတ်", material: "သင်ခန်းစာ ဖိုင်", open: "ဖွင့်မည်", noAtt: "တက်ရောက်မှု မှတ်တမ်း မရှိသေးပါ။", examLink: "စာမေးပွဲ လင့်ခ်",
    teacherProfile: "ဆရာ ပရိုဖိုင်", watchIntro: "မိတ်ဆက်ဗီဒီယို ကြည့်မည်", noIntro: "မိတ်ဆက်ဗီဒီယို မရှိသေးပါ။", noAbout: "မိတ်ဆက် မရှိသေးပါ။",
    msgTeacher: "ဆရာထံ မက်ဆေ့ချ်ပို့ရန်", noThreads: "မက်ဆေ့ချ်ပို့ရန် ဆရာ မရှိသေးပါ။", newMsgs: "အသစ်", lastMsg: "နောက်ဆုံး", sessions: "ကြိမ်" }
};
Object.assign(T.en, COMMON_T.en, {
  reviewNeed: "Write a short review of this class to unlock your certificate.", reviewBtn: "Write review", reviewTitle: "Review this class", reviewText: "Your review",
  reviewHint: "What did you learn? What could be better?", allowPublic: "Allow CLC to show my review on the website (first name only)", submitReview: "Submit review",
  reviewThanks: "Thank you! Your certificate is unlocked.", reviewShort: "Please choose a rating and write at least 10 characters." });
Object.assign(T.my, COMMON_T.my, {
  reviewNeed: "လက်မှတ်ကို ဖွင့်ရန် ဤအတန်းအကြောင်း အမြင်တိုတို ရေးပေးပါ။", reviewBtn: "အမြင် ရေးမည်", reviewTitle: "ဤအတန်းကို အကဲဖြတ်ပါ", reviewText: "သင့်အမြင်",
  reviewHint: "ဘာတွေ သင်ယူခဲ့ပါသလဲ။ ဘာတွေ ပိုကောင်းနိုင်မလဲ။", allowPublic: "ကျွန်ုပ်၏ အမြင်ကို ဝက်ဘ်ဆိုက်တွင် ပြသရန် ခွင့်ပြုပါသည် (နာမည်ရှေ့ပိုင်းသာ)", submitReview: "အမြင် ပို့မည်",
  reviewThanks: "ကျေးဇူးတင်ပါသည်။ သင့်လက်မှတ် ဖွင့်ပြီးပါပြီ။", reviewShort: "အဆင့်ရွေးပြီး အက္ခရာ ၁၀ လုံးအနည်းဆုံး ရေးပါ။" });   // strings shared with the teacher page
const t = k => T[lang][k] ?? k;

/* ---------- Theme & language ---------- */
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
  if (!me || me.role !== "student") { location.replace(u.email === ADMIN_EMAIL ? "admin.html" : me && me.role === "teacher" ? "teacher.html" : "index.html"); return; }
  document.body.hidden = false; render();
  if (me.status === "inactive") { $("#view").innerHTML = `<ul class="group"><li class="empty"><div>${t("inactive")}</div></li></ul>`; return; }
  await load(); ready = true; render();
});

const docs = s => s ? s.docs.map(d => ({ id: d.id, ...d.data() })) : [];
const safe = p => p.catch(e => { console.error(e); return null; });
async function load() {
  const [pr, mm, en, ms, rp] = await Promise.all([
    safe(db.collection("programs").get()), safe(db.collection("memberships").where("studentId", "==", me.id).get()),
    safe(db.collection("attendanceEntries").where("studentId", "==", me.id).get()), safe(db.collection("messages").where("studentId", "==", me.id).get()),
    safe(db.collection("reports").where("fromUid", "==", me.id).get())
  ]);
  programs = docs(pr); entries = docs(en); msgs = docs(ms); reports = docs(rp);
  const [rv, gd] = await Promise.all([safe(db.collection("reviews").where("studentId", "==", me.id).get()), safe(db.collection("siteContent").doc("guides").get())]);
  reviews = docs(rv); guides = gd && gd.exists ? gd.data() : {};
  const mem = docs(mm);
  const cls = await Promise.all(mem.map(m => safe(db.collection("classes").doc(m.classId).get())));
  rows = mem.map((m, i) => ({ m, c: cls[i] && cls[i].exists ? { id: cls[i].id, ...cls[i].data() } : null })).filter(r => r.c);
  const [ex, mt, gr] = await Promise.all([
    Promise.all(rows.map(r => safe(db.collection("exams").where("classId", "==", r.c.id).get()))),
    Promise.all(rows.map(r => safe(db.collection("materials").where("classId", "==", r.c.id).get()))),
    safe(db.collection("grades").where("studentId", "==", me.id).get())
  ]);
  exams = ex.flatMap(docs); materials = mt.flatMap(docs); grades = docs(gr);
  ann = await loadAnnouncements(db, me, rows.map(r => r.c.id)); annSeenAt = annLast(me.id);
  const tids = [...new Set(rows.map(r => r.c.teacherId).filter(Boolean))];
  await Promise.all(tids.map(async id => { const d = await safe(db.collection("teacherProfiles").doc(id).get()); if (d && d.exists) tprof[id] = d.data(); }));
}

/* ---------- Helpers ---------- */
const cTitle = c => { const p = programs.find(x => x.id === c.programId); return (p ? p[lang] : "") + (c.label ? " - " + c.label : ""); };
const fmt = d => { const x = d && d.toDate ? d.toDate() : new Date(String(d).length === 10 ? d + "T00:00" : d); return isNaN(x) ? "" : x.toLocaleDateString(lang === "my" ? "my-MM" : "en-GB", { day: "numeric", month: "short", year: "numeric" }); };
const li = inner => `<li class="item">${inner}</li>`;
const group = (h, items, e) => `${h ? `<p class="sub">${h}</p>` : ""}<ul class="group">${items.length ? items.join("") : `<li class="empty"><div>${e}</div></li>`}</ul>`;
const byDay = (a, b) => firstKey(a.c) - firstKey(b.c);
// The session in the student's own time zone, shown only when it differs from the class time zone.
const yourTime = (s, c) => { const l = localSession(s, c.tz || DEFAULT_TZ); return l ? `<small>${t("yourTime")}: ${DAYS[lang][l.day]} ${fmt12(l.start)} – ${fmt12(l.end)} (${l.offset})</small>` : ""; };
const statsFor = cid => attStats(entries.filter(x => x.classId === cid).map(x => x.status));
const helpRow = () => safeUrl(guides.student) ? `<ul class="group" style="margin-bottom:6px"><li class="item go" tabindex="0" data-help="1"><div class="grow"><b>▶ ${t("help")}</b></div></li></ul>` : "";
const modal = $("#modal");
const closeModal = () => { modal.hidden = true; modal.innerHTML = ""; };
const showSheet = html => { modal.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}<button class="link" id="mc">${t("close")}</button></div>`; modal.hidden = false; $("#mc").onclick = closeModal; };
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

/* ---------- Views ---------- */
const VIEW = {
  classes() {
    const card = r => {
      const c = r.c, done = r.m.status === "completed", lv = levelText(c.level, lang), mats = materials.filter(x => x.classId === c.id);
      return `<p class="sub">${esc(cTitle(c))}</p><ul class="group">
        ${li(`<div class="grow"><small>${esc(scheduleLine(c, DAYS[lang], lang))}</small><small>${esc(tzLabel(c.tz || DEFAULT_TZ))}</small>${c.startDate ? `<small>${esc(durationText(c, lang))}</small>` : ""}${sessionsOf(c).map(x => yourTime(x, c)).join("")}${c["venue_" + lang] ? `<small>${esc(c["venue_" + lang])}</small>` : ""}${done ? `<small>${t("completed")}: ${fmt(r.m.completedAt)}</small>` : ""}</div>${lv ? `<span class="pill s-enrolled">${esc(lv)}</span>` : ""}`)}
        ${c.teacherId ? `<li class="item go" tabindex="0" data-teacher="${c.teacherId}"><div class="grow"><small>${t("teacher")}</small><b>${esc(c.teacherName || "")}</b></div></li>` : ""}
        ${!done && (safeUrl(c.telegramUrl) || safeUrl(c.zoomUrl)) ? li(`<div class="rowlinks">${linkBtn(c.telegramUrl, "✈️ " + t("tg"), "")}${linkBtn(c.zoomUrl, "🎥 " + t("zoom"), "")}</div>`) : ""}
        ${mats.map(m => li(`<div class="grow"><small>📎 ${t("material")}</small><b>${esc(m.title)}</b></div>${linkBtn(m.url, t("open"))}`)).join("")}</ul>`;
    };
    const en = rows.filter(r => r.m.status !== "completed").sort(byDay), co = rows.filter(r => r.m.status === "completed");
    return helpRow() + (en.length ? `<h3 class="sec">${t("enrolled")}</h3>` + en.map(card).join("") : group("", [], t("noClass"))) + (co.length ? `<h3 class="sec">${t("completed")}</h3>` + co.map(card).join("") : "");
  },
  schedule() {
    const act = rows.filter(r => r.m.status !== "completed" && r.c.status !== "completed").sort(byDay);
    const wk = act.map(r => `<li class="cls"><div class="c"><b>${esc(cTitle(r.c))}</b><span class="when">${esc(whenText(r.c, DAYS[lang], lang))}</span>
      <small>${esc(r.c["venue_" + lang] || "")}</small><small>${esc(tzLabel(r.c.tz || DEFAULT_TZ))}</small>${sessionsOf(r.c).map(x => yourTime(x, r.c)).join("")}
      ${safeUrl(r.c.zoomUrl) ? `<div class="rowlinks" style="margin-top:6px">${linkBtn(r.c.zoomUrl, "🎥 " + t("zoom"), "")}</div>` : ""}</div></li>`);
    const today = new Date().toLocaleDateString("en-CA");
    const ex = exams.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).map(e => {
      const r = rows.find(x => x.c.id === e.classId);
      return li(`<div class="grow"><b>${esc(e.title)}</b><small>${esc(r ? cTitle(r.c) : "")}</small><small>${fmt(e.date)} ${esc(e.time || "")}${e.venue ? " · " + esc(e.venue) : ""}</small>
        ${safeUrl(e.link) ? `<div class="rowlinks" style="margin-top:6px">${linkBtn(e.link, "🔗 " + t("examLink"), "")}</div>` : ""}</div>${e.date < today ? `<span class="pill">✓</span>` : ""}`);
    });
    return group(t("week"), wk, t("noClass")) + group(t("exams"), ex, t("noExam"));
  },
  progress() {
    const att = rows.map(r => {
      const s = statsFor(r.c.id);
      return `<li class="att">${donut(s)}<div class="grow"><b>${esc(cTitle(r.c))}</b>${pctBar(s.pct)}
        ${s.total ? `<small>${t("present")} ${s.present} · ${t("late")} ${s.late} · ${t("absent")} ${s.absent} · ${t("excused")} ${s.excused}</small>` : `<small>${t("noAtt")}</small>`}</div></li>`;
    });
    const gb = rows.map(r => {
      const g = grades.filter(x => x.classId === r.c.id);
      return g.length ? group(esc(cTitle(r.c)), [li(`<div class="grow"><b>${t("overall")}</b>${pctBar(gradePct(g))}</div><b>${gradePct(g)}%</b>`), ...g.map(x => li(`<div class="grow"><b>${esc(x.title)}</b>${x.comment ? `<small>${esc(x.comment)}</small>` : ""}</div>
        <b>${esc(x.score)} / ${esc(x.max)}</b><span class="pill">${pctOf(x)}%</span>`))], "") : "";
    }).join("");
    const certs = rows.filter(r => r.m.status === "completed").map(r => { const rv = reviews.some(x => x.classId === r.c.id);
      return li(`<div class="grow"><b>${esc(cTitle(r.c))}</b><small>${fmt(r.m.completedAt)}</small>${rv ? "" : `<small>${t("reviewNeed")}</small>`}</div>
        ${rv ? `<button class="btn small" data-cert="${r.m.id}">${t("view")}</button>` : `<button class="btn small" data-review="${r.c.id}">${t("reviewBtn")}</button>`}`); });
    return `<h3 class="sec">${t("attendance")}</h3>${group("", att, t("noClass"))}<h3 class="sec">${t("grades")}</h3>${gb || group("", [], t("noGrade"))}<h3 class="sec">${t("certs")}</h3>${group("", certs, t("noCert"))}`;
  },
  announcements() {
    const live = ann.filter(a => annIsLive(a));
    return group("", live.map(a => annItem(a, t, lang, annSeenAt, false)), t("annNone"));
  },
  messages() {
    const th = rows.filter(r => r.c.teacherId).map(r => {
      const list = msgs.filter(m => m.classId === r.c.id).sort((a, b) => ts(a.createdAt) - ts(b.createdAt)), last = list[list.length - 1], n = unread(r.c.id, list, "student");
      return `<li class="item go" tabindex="0" data-thread="${r.c.id}"><div class="grow"><b>${esc(r.c.teacherName || t("teacher"))}</b><small>${esc(cTitle(r.c))}</small>${last ? `<small>${esc(last.text.slice(0, 60))}</small>` : ""}</div>${n ? `<span class="pill s-pending">${n} ${t("newMsgs")}</span>` : ""}</li>`;
    });
    return `${group(t("msgTeacher"), th, t("noThreads"))}${reportBlock(t, reports)}`;
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
  const h = (location.hash || "#classes").slice(1), v = VIEW[h] ? h : "classes";
  $$(".tabs a").forEach(a => a.setAttribute("aria-current", a.hash === "#" + v));
  const nNew = annUnseen(me.id, ann.filter(a => annIsLive(a))), al = $('.tabs a[href="#announcements"]');
  if (al && nNew && v !== "announcements") al.textContent += ` (${nNew})`;
  $("#title").textContent = v === "classes" ? `${t("hi")}, ${me.name.split(" ")[0]}` : t(v);
  $("#view").innerHTML = VIEW[v]();
  if (v === "announcements") annMarkSeen(me.id, ann.filter(a => annIsLive(a)));
  if (v === "profile") bindProfile();
  if (v === "messages") bindReportBlock(db, me, t, reports, render, toast);
}
addEventListener("hashchange", render);

/* ---------- Clicks: teacher profile, message thread, certificate ---------- */
$("#view").addEventListener("click", e => {
  const tb = e.target.closest("[data-teacher]"), th = e.target.closest("[data-thread]"), cb = e.target.closest("[data-cert]"), hb = e.target.closest("[data-help]"), rb = e.target.closest("[data-review]");
  if (hb) showSheet(`<h3>${t("help")}</h3><div style="margin-top:12px">${videoBlock(guides.student, "▶ " + t("watch"))}</div>`);
  if (rb) openReview(rb.dataset.review);
  if (tb) {
    const id = tb.dataset.teacher, p = tprof[id] || {}, c = rows.find(r => r.c.teacherId === id).c;
    showSheet(`<h3>${esc(p.name || c.teacherName)}</h3><p class="note center">${t("teacherProfile")}</p>
      <p class="body" style="margin-top:14px">${p.about ? esc(p.about).replace(/\n/g, "<br>") : t("noAbout")}</p>
      ${safeUrl(p.introVideo) ? videoBlock(p.introVideo, "▶ " + t("watchIntro")) : `<p class="note">${t("noIntro")}</p>`}`);
  }
  if (th) {
    const r = rows.find(x => x.c.id === th.dataset.thread), cid = r.c.id;
    const list = msgs.filter(m => m.classId === cid).sort((a, b) => ts(a.createdAt) - ts(b.createdAt)); markRead(cid, list);
    threadSheet(modal, { title: `${r.c.teacherName || t("teacher")} · ${cTitle(r.c)}`, list, me: "student", t, onClose: render,
      onSend: async text => {
        const d = { classId: cid, studentId: me.id, teacherId: r.c.teacherId, from: "student", text, createdAt: FV.serverTimestamp() };
        await db.collection("messages").add(d); const row = { ...d, createdAt: { ms: Date.now() } }; msgs.push(row); return row;
      } });
  }
  if (cb) {
    const r = rows.find(x => x.m.id === cb.dataset.cert); if (!r) return;
    if (!reviews.some(x => x.classId === r.c.id)) return openReview(r.c.id);   // a review unlocks the certificate
    const s = statsFor(r.c.id), gp = gradePct(grades.filter(x => x.classId === r.c.id));
    showSheet(`<div class="cert"><img src="logo.png" alt="" height="56" onerror="this.remove()"><h4>${t("cert")}</h4><p>${t("certify")}</p><h3>${esc(me.name)}</h3>
      <p>${t("done")}</p><h3>${esc(cTitle(r.c))}</h3>
      <p class="meta">${t("attendance")}: ${s.pct === null ? "—" : s.pct + "%"} · ${t("gradeLbl")}: ${gp === null ? "—" : gp + "%"}</p>
      <p class="meta">${t("date")}: ${fmt(r.m.completedAt)} · ${t("no")}: ${esc(r.m.certNo || "—")}</p>${signatureBlock(lang)}</div>
      <button class="btn wide" id="prt">${t("print")}</button>`);
    $("#prt").onclick = () => print();
  }
});
$("#view").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.classList.contains("go")) e.target.click(); });

/* ---------- Profile ---------- */
function bindProfile() {
  $("#ps").onclick = async () => {
    const f = $("#pf").elements, d = { phone: f.phone.value.trim(), location: f.location.value.trim(), about: f.about.value.trim() };
    try { await db.collection("users").doc(me.id).update({ ...d, updatedAt: FV.serverTimestamp() }); Object.assign(me, d); toast(t("saved")); }
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

/* ---------- Review a completed class (unlocks the certificate) ---------- */
function openReview(cid) {
  const r = rows.find(x => x.c.id === cid); if (!r) return;
  let rating = 0;
  showSheet(`<h3>${t("reviewTitle")}</h3><p class="note center">${esc(cTitle(r.c))}</p>
    <div class="starpick" id="sp">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}" aria-label="${n}">★</button>`).join("")}</div>
    <form id="rvf" class="group form" novalidate><label class="essay"><span>${t("reviewText")}</span><textarea name="text" rows="5" maxlength="1000" placeholder="${esc(t("reviewHint"))}"></textarea></label></form>
    <label class="chk top"><input type="checkbox" id="rvp"><span>${t("allowPublic")}</span></label>
    <button class="btn wide" id="rvs">${t("submitReview")}</button>`);
  $$("#sp button").forEach(b => b.onclick = () => { rating = Number(b.dataset.n); $$("#sp button").forEach(x => x.classList.toggle("on", Number(x.dataset.n) <= rating)); });
  $("#rvs").onclick = async () => {
    const text = $("#rvf").elements.text.value.trim();
    if (!rating || text.length < 10) return toast(t("reviewShort"));
    const d = { classId: cid, programId: r.c.programId || "", studentId: me.id, studentName: me.name, rating, text, allowPublic: $("#rvp").checked, status: "pending", createdAt: FV.serverTimestamp() };
    try { await db.collection("reviews").doc(`${cid}_${me.id}`).set(d); reviews.push({ ...d, createdAt: { ms: Date.now() } }); closeModal(); toast(t("reviewThanks")); render(); }
    catch (e) { console.error(e); toast(t("fail")); }
  };
}
