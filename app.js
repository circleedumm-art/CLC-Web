/* =========================================================
   CLC website – public site
   Programs and the schedule now come from the admin dashboard.
   The starter programs live in defaults.js.
   ========================================================= */

const LINKS = {
  fb: "https://www.facebook.com/CLCburmese",
  yt: "https://youtube.com/@circle-edu-mm?si=1MOFKR3IR7KA-s1F",
  tt: "https://www.tiktok.com/@circle.edu.mm"   // paste your TikTok link here; the link stays hidden while this is empty
};

const DATA = {
  programs: DEFAULT_PROGRAMS.slice(),   // replaced by your Programs from the database once you add them
  guides: {}, quotes: [],
  schedule: []                          // filled from classes you mark "Show on website"
};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const DAYS = {
  en: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
  my: ["တနင်္လာ","အင်္ဂါ","ဗုဒ္ဓဟူး","ကြာသပတေး","သောကြာ","စနေ","တနင်္ဂနွေ"]
};

const T = {
  en: {
    nav_about:"About", nav_programs:"Programs", nav_schedule:"Schedule", nav_enrol:"Enrol", login:"Log in",
    hero_title:"Learn together. Grow together.",
    hero_sub:"English and life-skills learning for youths in Myanmar, with volunteer teachers who care.",
    cta_enrol:"Enrol now", cta_programs:"See programs",
    about_h:"About CLC",
    about_p:"Circle Learning Centre began in 2021 as a Facebook page. Since then, volunteer teachers have helped youths and adults who struggle with English to speak with confidence.",
    f1_k:"Founded", f1_v:"2021", f2_k:"Founder", f2_v:"Mr. Peter", f3_k:"Who we serve", f3_v:"Myanmar youths and adults",
    prog_h:"Programs", sched_h:"Class schedule",
    sched_note:"Times may change – please check before you join.", sched_none:"The schedule will be posted soon.", dashboard:"Dashboard", portal:"My classes",
    enrol_h:"Enrol in a class",
    enrol_p:"Send your details. A teacher or admin will review them and email you your login ID and password once approved.",
    f_name:"Full name", f_contact:"Email address", f_course:"Program", f_note:"Note", f_submit:"Send enrolment",
    f_ok:"Received. If you are chosen for a CLC class, we will notify you by email.",
    f_email_note:"If you are chosen for a CLC class, we will send the notification to this email. Please use an email you check often.",
    f_bad:"Please enter a valid email address.",
    f_privacy:"Your name and email are used only to process your enrolment and to contact you.",
    guide_h:"How to use this website", guide_p:"Short videos that show you how the website works.", g_guest:"For visitors", g_student:"For students", g_teacher:"For teachers", watch:"Watch video",
    f_schol:"Scholarship (optional)", schol_none:"I do not need a scholarship", schol_half:"Apply for 50% scholarship", schol_full:"Apply for 100% scholarship",
    schol_warn:"Scholarships are limited. Please apply only if you really need support and have a reasonable reason.",
    f_essay:"Describe your situation and why you need a scholarship (up to 250 words, or up to 10 sentences if you write in Burmese)",
    essay_words:"words", essay_sentences:"sentences", essay_short:"Please explain a little more (at least 30 words, or 3 sentences in Burmese).", essay_long:"Your answer is too long (250 words, or 10 sentences in Burmese, at most).",
    rev_h:"What our students say", rev_p:"Reviews from students who completed a CLC class.", rev_none:"Reviews from our students will appear here soon.", rev_more:"Read more",
    r_student:"Student", r_teacher:"Teacher", r_admin:"Admin",
    l_id:"ID", l_pw:"Password", l_signin:"Sign in", l_google:"Continue with Google",
    l_soon:"Your ID and password are given by the CLC admin.", close:"Close", logout:"Log out",
    l_bad:"Wrong ID or password.", l_notadmin:"This Google account is not the CLC admin.", l_in:"Signed in.", e_fail:"Could not send. Check your internet and try again."
  },
  my: {
    nav_about:"အကြောင်း", nav_programs:"သင်တန်းများ", nav_schedule:"အချိန်ဇယား", nav_enrol:"စာရင်းသွင်း", login:"ဝင်ရန်",
    hero_title:"အတူလေ့လာသင်ယူရင်း အတူတိုးတက်ကြမယ်",
    hero_sub:"အင်္ဂလိပ်စာ သင်ယူလိုသော မြန်မာနိုင်ငံသားတိုင်း အဖိုးအခ အသက်သာဆုံးနည်းလမ်းဖြင့် အင်္ဂလိပ်စာတတ်ရမည်။",
    cta_enrol:"စာရင်းသွင်းမည်", cta_programs:"သင်တန်းများကြည့်မည်",
    about_h:"CLC အကြောင်း",
    about_p:"Circle Learning Centre ကို ၂၀၂၁ ခုနှစ်တွင် Facebook စာမျက်နှာအဖြစ် စတင်ခဲ့ပါသည်။ စေတနာ့ဝန်ထမ်း ဆရာများက အင်္ဂလိပ်စာ အခက်အခဲရှိသော လူငယ်နှင့် လူကြီးများ ယုံကြည်မှုရှိရှိ စကားပြောနိုင်လာစေရန် ကူညီခဲ့ကြသည်။",
    f1_k:"စတင်တည်ထောင်ချိန်", f1_v:"၂၀၂၁", f2_k:"တည်ထောင်သူ", f2_v:"ဆရာပီတာ", f3_k:"ဝန်ဆောင်မှုပေးသူများ", f3_v:"မြန်မာလူငယ်နှင့် လူကြီးများ",
    prog_h:"သင်တန်းများ", sched_h:"အတန်း အချိန်ဇယား",
    sched_note:"အချိန်များ ပြောင်းလဲနိုင်ပါသည်။ မတက်ခင် ပြန်လည်စစ်ဆေးပါ။", sched_none:"အချိန်ဇယားကို မကြာမီ ကြေညာပါမည်။", dashboard:"Dashboard", portal:"ကျွန်ုပ်၏ အတန်းများ",
    enrol_h:"သင်တန်း စာရင်းသွင်းရန်",
    enrol_p:"သင့်အချက်အလက်ကို ပေးပို့ပါ။ ဆရာ သို့မဟုတ် အက်ဒမင်က စစ်ဆေးပြီး အတည်ပြုပြီးလျှင် ID နှင့် စကားဝှက်ကို အီးမေးလ်ဖြင့် ပေးပို့ပါမည်။",
    f_name:"အမည်အပြည့်အစုံ", f_contact:"အီးမေးလ်", f_course:"သင်တန်း", f_note:"မှတ်ချက်", f_submit:"လျှောက်ထားမည်",
    f_ok:"လက်ခံရရှိပါပြီ။ CLC သင်တန်းအတွက် ရွေးချယ်ခံရပါက အီးမေးလ်ဖြင့် အကြောင်းကြားပါမည်။",
    f_email_note:"CLC သင်တန်းအတွက် ရွေးချယ်ခံရပါက ဤအီးမေးလ်သို့ အကြောင်းကြားပါမည်။ ပုံမှန်ကြည့်ရှုသော အီးမေးလ်ကို အသုံးပြုပါ။",
    f_bad:"မှန်ကန်သော အီးမေးလ်လိပ်စာ ထည့်ပါ။",
    f_privacy:"သင့်အမည်နှင့် အီးမေးလ်ကို စာရင်းသွင်းမှု စီစဉ်ရန်နှင့် ဆက်သွယ်ရန်အတွက်သာ အသုံးပြုပါမည်။",
    guide_h:"ဝက်ဘ်ဆိုက် အသုံးပြုပုံ", guide_p:"ဝက်ဘ်ဆိုက်ကို မည်သို့အသုံးပြုရမည်ကို ဗီဒီယိုတိုများဖြင့် ကြည့်ပါ။", g_guest:"ဧည့်သည်များအတွက်", g_student:"ကျောင်းသားများအတွက်", g_teacher:"ဆရာများအတွက်", watch:"ဗီဒီယို ကြည့်မည်",
    f_schol:"ပညာသင်ဆု (ရွေးချယ်စရာ)", schol_none:"ပညာသင်ဆု မလိုအပ်ပါ", schol_half:"ပညာသင်ဆု ၅၀% လျှောက်မည်", schol_full:"ပညာသင်ဆု ၁၀၀% လျှောက်မည်",
    schol_warn:"ပညာသင်ဆုများမှာ အကန့်အသတ်ရှိပါသည်။ အမှန်တကယ် အကူအညီလိုအပ်ပြီး သင့်လျော်သော အကြောင်းပြချက်ရှိမှသာ လျှောက်ထားပါ။",
    f_essay:"ပညာသင်ဆု လိုအပ်သည့် သင့်အခြေအနေကို ဖော်ပြပါ (အင်္ဂလိပ်လို စကားလုံး ၂၅၀ အထိ၊ မြန်မာလို ဝါကျ ၁၀ ကြောင်းအထိ)",
    essay_words:"စကားလုံး", essay_sentences:"ဝါကျ", essay_short:"ပိုမိုအသေးစိတ် ရေးသားပါ (အနည်းဆုံး စကားလုံး ၃၀ သို့မဟုတ် မြန်မာလို ဝါကျ ၃ ကြောင်း)။", essay_long:"ရေးသားချက် ရှည်လွန်းပါသည် (စကားလုံး ၂၅၀ သို့မဟုတ် မြန်မာလို ဝါကျ ၁၀ ကြောင်းအထိ)။",
    rev_h:"ကျောင်းသားများ၏ အမြင်", rev_p:"CLC အတန်းများ ပြီးဆုံးခဲ့သော ကျောင်းသားများ၏ အမြင်များ။", rev_none:"ကျောင်းသားများ၏ အမြင်များကို ဤနေရာတွင် မကြာမီ ပြသပါမည်။", rev_more:"ဆက်ဖတ်ရန်",
    r_student:"ကျောင်းသား", r_teacher:"ဆရာ", r_admin:"အက်ဒမင်",
    l_id:"ID", l_pw:"စကားဝှက်", l_signin:"ဝင်မည်", l_google:"Google ဖြင့် ဆက်လုပ်မည်",
    l_soon:"ID နှင့် စကားဝှက်ကို CLC အက်ဒမင်က ပေးပါမည်။", close:"ပိတ်မည်", logout:"ထွက်မည်",
    l_bad:"ID သို့မဟုတ် စကားဝှက် မှားနေပါသည်။", l_notadmin:"ဤ Google အကောင့်သည် CLC အက်ဒမင် မဟုတ်ပါ။", l_in:"ဝင်ရောက်ပြီးပါပြီ။", e_fail:"ပို့မရပါ။ အင်တာနက်စစ်ပြီး ပြန်ကြိုးစားပါ။"
  }
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};
let lang = store.get("clc_lang") || "en";

/* ---------- Language ---------- */
function renderLang() {
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach(el => el.textContent = T[lang][el.dataset.i18n]);
  $$("[data-lang]").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));

  $("#programList").innerHTML = DATA.programs.map((p, i) => `
    <li class="prog" tabindex="0" role="button" data-course="${i}">
      <span class="dot">${esc(p.icon)}</span>
      <span class="t"><b>${esc(p[lang])}</b><small>${esc(p[lang + "_d"])}</small></span>
    </li>`).join("");

  $("#scheduleList").innerHTML = DATA.schedule.length ? DATA.schedule.slice().sort((x, y) => firstKey(x) - firstKey(y)).map(s => {
    const p = DATA.programs.find(y => y.id === s.programId), dur = durationText(s, lang);
    return `<li class="cls"><div class="c"><b>${esc((p ? p[lang] : "") + (s.label ? " - " + s.label : ""))}</b>
      <span class="when">${esc(whenText(s, DAYS[lang], lang))}</span>
      <small>${esc(s["venue_" + lang] || "")}${s.level ? (s["venue_" + lang] ? " · " : "") + esc(levelText(s.level, lang)) : ""}</small>
      <small>${esc(tzLabel(s.tz || DEFAULT_TZ))}${dur ? " · " + esc(dur) : ""}</small></div></li>`; }).join("") : `<li class="empty">${T[lang].sched_none}</li>`;

  const gl = [["guest", "g_guest"], ["student", "g_student"], ["teacher", "g_teacher"]].filter(([k]) => safeUrl(DATA.guides[k]));
  $("#guide").hidden = !gl.length;
  $("#guideList").innerHTML = gl.map(([k, tk]) => `<li class="guide"><b>${T[lang][tk]}</b>${videoBlock(DATA.guides[k], "▶ " + T[lang].watch)}</li>`).join("");

  $("#quoteList").innerHTML = DATA.quotes.length ? DATA.quotes.map((q, i) => {
    const p = DATA.programs.find(x => x.id === q.programId);
    return `<figure class="quote"><div class="stars" aria-label="${esc(q.rating)}/5">${stars(Number(q.rating) || 0)}</div><blockquote>${esc(q.text)}</blockquote><button class="more" type="button" data-q="${i}" hidden>${T[lang].rev_more}</button><figcaption>${esc(q.name)}${p ? " · " + esc(p[lang]) : ""}</figcaption></figure>`; }).join("")
    : `<p class="note">${T[lang].rev_none}</p>`;
  $(".qnav").hidden = !DATA.quotes.length;
  markClamped();

  const ss = $("#scholSel"), keepS = ss.value || "none";
  ss.innerHTML = [["none", "schol_none"], ["half", "schol_half"], ["full", "schol_full"]].map(([v, k]) => `<option value="${v}">${T[lang][k]}</option>`).join(""); ss.value = keepS;
  updateEssay();

  const sel = $("#courseSelect"), keep = sel.value;
  sel.innerHTML = DATA.programs.map((p, i) => `<option value="${i}">${esc(p[lang])}</option>`).join("");
  if (keep) sel.value = keep;
}
$$("[data-lang]").forEach(b => b.onclick = () => { lang = b.dataset.lang; store.set("clc_lang", lang); renderLang(); });

/* ---------- Theme (follows the phone/computer until you choose) ---------- */
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  $('meta[name="theme-color"]').content = t === "dark" ? "#000000" : "#F2F2F7";
}
setTheme(store.get("clc_theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("#themeBtn").onclick = () => {
  const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(t); store.set("clc_theme", t);
};

/* ---------- Scholarship essay (shown only when applying) ---------- */
function updateEssay() {
  const on = $("#scholSel").value !== "none";
  $("#essayLbl").hidden = !on; $("#scholNote").hidden = !on;
  const st = essayStats($("#essay").value), cnt = $("#essayCount");
  cnt.hidden = !on;
  cnt.textContent = `${st.n} / ${st.max} ${T[lang]["essay_" + st.unit]}`;
  cnt.className = "note" + (st.n > st.max ? " bad" : "");
}
$("#scholSel").onchange = updateEssay; $("#essay").oninput = updateEssay;

/* ---------- Tap a program → jump to enrol with it selected ---------- */
$("#programList").addEventListener("click", e => {
  const li = e.target.closest("[data-course]"); if (!li) return;
  $("#courseSelect").value = li.dataset.course;
  $("#enrol").scrollIntoView({ behavior: "smooth" });
});
$("#programList").addEventListener("keydown", e => { if (e.key === "Enter") e.target.click(); });

/* ---------- Enrol form ---------- */
$("#enrolForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target;
  if (f.website && f.website.value) { f.reset(); $("#enrolOk").hidden = false; return; }   // honeypot: bots fill this hidden field
  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contact.value.trim());
  if (!f.name.value.trim()) { f.name.focus(); return; }
  if (!okEmail) { f.contact.focus(); toast(T[lang].f_bad); return; }
  const schol = f.scholarship.value, essay = schol === "none" ? "" : f.essay.value.trim(), st = essayStats(essay);
  if (schol !== "none" && (st.n < st.min)) { f.essay.focus(); toast(T[lang].essay_short); return; }
  if (schol !== "none" && st.n > st.max) { f.essay.focus(); toast(T[lang].essay_long); return; }
  const entry = { scholarship: schol, essay, name: f.name.value.trim(), email: f.contact.value.trim(),
                  course: DATA.programs[f.course.value].en, note: f.note.value.trim(), status: "pending" };
  try {
    if (!db) throw new Error("Firebase is not configured");
    await db.collection("enrolments").add({ ...entry, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    f.reset(); updateEssay(); $("#enrolOk").hidden = false;
  } catch (err) { console.error(err); toast(T[lang].e_fail); }
});

/* ---------- Login sheet ---------- */
const scrim = $("#scrim");
const openSheet = () => { scrim.hidden = false; $("#signIn").focus(); };
/* ---------- Reviews: equal-size cards that scroll sideways; "Read more" shows the whole review ---------- */
// Show "Read more" only on cards whose text is cut off.
function markClamped() {
  $$("#quoteList .quote").forEach(f => { const b = f.querySelector("blockquote"), m = f.querySelector(".more"); m.hidden = true; m.hidden = !(b.scrollHeight > b.clientHeight + 1); });
}
addEventListener("resize", markClamped);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(markClamped);
const qStep = () => { const c = $("#quoteList .quote"); return c ? c.offsetWidth + 14 : 300; };
$("#qPrev").onclick = () => $("#quoteList").scrollBy({ left: -qStep(), behavior: "smooth" });
$("#qNext").onclick = () => $("#quoteList").scrollBy({ left: qStep(), behavior: "smooth" });
const revScrim = $("#revScrim"), closeReview = () => { revScrim.hidden = true; };
$("#quoteList").addEventListener("click", e => {
  const b = e.target.closest(".more"), q = b && DATA.quotes[Number(b.dataset.q)]; if (!q) return;
  const p = DATA.programs.find(x => x.id === q.programId);
  $("#revBody").innerHTML = `<div class="stars" aria-label="${esc(q.rating)}/5">${stars(Number(q.rating) || 0)}</div><blockquote>${esc(q.text)}</blockquote><p class="note">${esc(q.name)}${p ? " · " + esc(p[lang]) : ""}</p>`;
  revScrim.hidden = false;
});
revScrim.addEventListener("click", e => { if (e.target === revScrim || e.target.closest("[data-close-rev]")) closeReview(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !revScrim.hidden) closeReview(); });

const closeSheet = () => { scrim.hidden = true; $("#loginBtn").focus(); };
$("#loginBtn").onclick = openSheet; $("#closeSheet").onclick = closeSheet;
scrim.addEventListener("click", e => { if (e.target === scrim) closeSheet(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !scrim.hidden) closeSheet(); });
$$("#roleSeg button").forEach(b => b.onclick = () => {
  $$("#roleSeg button").forEach(x => x.setAttribute("aria-pressed", x === b));
  const admin = b.dataset.role === "admin";
  $("#loginForm").hidden = admin; $("#signIn").hidden = admin; $("#googleBtn").hidden = !admin;
});

/* ---------- Firebase ---------- */
const live = typeof firebase !== "undefined" && typeof firebaseConfig !== "undefined";
let auth = null, db = null;
if (live) { firebase.initializeApp(firebaseConfig); auth = firebase.auth(); db = firebase.firestore(); }

async function loadContent() {
  if (!db) return;
  try {
    const [pr, sc, gd, tm] = await Promise.all([db.collection("programs").orderBy("order").get(), db.collection("publicSchedule").get(),
      db.collection("siteContent").doc("guides").get().catch(() => null), db.collection("testimonials").orderBy("createdAt", "desc").limit(12).get().catch(() => null)]);
    if (!pr.empty) DATA.programs = pr.docs.map(d => ({ id: d.id, ...d.data() }));
    DATA.schedule = sc.docs.map(d => d.data());
    DATA.guides = gd && gd.exists ? gd.data() : {}; DATA.quotes = tm ? tm.docs.map(d => d.data()) : [];
    renderLang();
  } catch (e) { console.warn("Could not load site content:", e); }
}
loadContent();

function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.id); toast.id = setTimeout(() => t.hidden = true, 4000); }
function loginErr(msg) { const p = $("#loginErr"); p.textContent = msg || ""; p.hidden = !msg; }

let goPortal = false;
$("#signIn").onclick = async () => {
  loginErr();
  if (!auth) return loginErr("Firebase is not set up yet.");
  const id = $("#loginForm").elements.id.value.trim().toLowerCase(), pw = $("#loginForm").elements.pw.value;
  if (!id || !pw) return;
  try { goPortal = true; await auth.signInWithEmailAndPassword(`${id}@${ID_DOMAIN}`, pw); }
  catch (err) { goPortal = false; loginErr(T[lang].l_bad); }
};
$("#googleBtn").onclick = async () => {
  loginErr();
  if (!auth) return loginErr("Firebase is not set up yet.");
  try {
    const { user } = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    if (user.email !== ADMIN_EMAIL) { await auth.signOut(); loginErr(T[lang].l_notadmin); } else location.href = "admin.html";
  } catch (err) { console.error(err); }
};
if (auth) auth.onAuthStateChanged(async user => {
  const admin = !!user && user.email === ADMIN_EMAIL;
  let portal = null;
  if (user && !admin) {
    try { const d = await db.collection("users").doc(user.uid).get(); if (d.exists && d.data().role === "student") portal = "student.html"; else if (d.exists && d.data().role === "teacher") portal = "teacher.html"; } catch (e) { console.warn(e); }
  }
  $("#loginBtn").dataset.i18n = admin ? "dashboard" : portal ? "portal" : user ? "logout" : "login";
  $("#loginBtn").onclick = admin ? () => location.href = "admin.html" : portal ? () => location.href = portal : user ? () => auth.signOut() : openSheet;
  $("#logoutLink").hidden = !user;
  if (user) { closeSheet(); if (portal && goPortal) location.href = portal; else if (!admin && !portal) toast(T[lang].l_in); }
  renderLang();
});
$("#logoutLink").onclick = e => { e.preventDefault(); if (auth) auth.signOut(); };

/* ---------- Footer ---------- */
[["fb", "fb"], ["yt", "yt"], ["tt", "tt"]].forEach(([id, k]) => {
  const a = $("#" + id);
  if (LINKS[k]) { a.href = LINKS[k]; a.target = "_blank"; a.rel = "noopener"; } else a.hidden = true;
});
$("#yr").textContent = new Date().getFullYear();
renderLang();

/* ---------- Gentle reveal as sections scroll into view ---------- */
(function () {
  const els = $$("main section.wrap, footer.wrap");
  document.documentElement.classList.add("js");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(list => list.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: 0.05 });
  els.forEach(e => { e.classList.add("reveal"); io.observe(e); });
})();
