/* =========================================================
   CLC website – Step 1 (public site)
   Edit the DATA block below to change programs and schedule.
   Step 2 will load this same data from Firebase instead.
   ========================================================= */

const LINKS = {
  fb: "https://www.facebook.com/CLCburmese",
  yt: "https://youtube.com/@circle-edu-mm?si=1MOFKR3IR7KA-s1F",
  tt: ""   // paste your TikTok link here; the link stays hidden while this is empty
};

const DATA = {
  programs: [
    { icon: "💬", en: "Circle Conversation Club", my: "Circle စကားပြောကလပ်",
      en_d: "Practise speaking English every week in a friendly small group.",
      my_d: "သူငယ်ချင်းဆန်ဆန် အဖွဲ့ငယ်လေးနှင့် အင်္ဂလိပ်စကားပြောကို အပတ်စဉ် လေ့ကျင့်ပါ။" },
    { icon: "🔑", en: "Five Keys to Success Webinar", my: "အောင်မြင်ရေးသော့ချက် ငါးခု ဝက်ဘ်ဘီနာ",
      en_d: "A youth empowerment series on skills for study, work and life.",
      my_d: "လေ့လာရေး၊ အလုပ်နှင့် ဘဝအတွက် လူငယ်စွမ်းဆောင်ရည် မြှင့်တင်ရေး ဆောင်ရွက်မှု။" },
    { icon: "🌱", en: "Basic English", my: "အခြေခံ အင်္ဂလိပ်စာ",
      en_d: "Start from the beginning with simple words, sentences and speaking.",
      my_d: "ရိုးရှင်းသော စကားလုံးများ၊ ဝါကျများနှင့် စကားပြောကို အစမှ စတင်သင်ယူပါ။" },
    { icon: "🎒", en: "Young Learners English", my: "ကလေးငယ်များ အင်္ဂလိပ်စာ",
      en_d: "Fun, gentle English classes for younger students.",
      my_d: "ကလေးငယ်များအတွက် ပျော်ရွှင်စရာ အင်္ဂလိပ်စာ အတန်းများ။" },
    { icon: "🎓", en: "Adult English Course", my: "လူကြီးများ အင်္ဂလိပ်စာ သင်တန်း",
      en_d: "Build confidence in English for work, study and daily life.",
      my_d: "အလုပ်၊ ပညာရေးနှင့် နေ့စဉ်ဘဝအတွက် အင်္ဂလိပ်စာ ယုံကြည်မှု တည်ဆောက်ပါ။" }
  ],
  // Sample timetable – replace with your real classes. day: 0=Mon … 6=Sun
  schedule: [
    { day: 1, time: "7:00 – 8:00 PM", course: 0, en_n: "Online via Zoom", my_n: "Zoom ဖြင့် အွန်လိုင်း" },
    { day: 3, time: "6:30 – 7:30 PM", course: 2, en_n: "Online via Zoom", my_n: "Zoom ဖြင့် အွန်လိုင်း" },
    { day: 5, time: "9:00 – 10:30 AM", course: 4, en_n: "Online via Zoom", my_n: "Zoom ဖြင့် အွန်လိုင်း" }
  ]
};

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
    f1_k:"Started", f1_v:"2021", f2_k:"Teachers", f2_v:"Volunteers", f3_k:"Who we serve", f3_v:"Myanmar youths and adults",
    prog_h:"Programs", sched_h:"Class schedule",
    sched_note:"Sample schedule. Times may change – check before you join.",
    enrol_h:"Enrol in a class",
    enrol_p:"Send your details. A teacher or admin will review them and email you your login ID and password once approved.",
    f_name:"Full name", f_contact:"Email address", f_course:"Program", f_note:"Note", f_submit:"Send enrolment",
    f_ok:"Received. If you are chosen for a CLC class, we will notify you by email.",
    f_email_note:"If you are chosen for a CLC class, we will send the notification to this email. Please use an email you check often.",
    f_bad:"Please enter a valid email address.",
    r_student:"Student", r_teacher:"Teacher", r_admin:"Admin",
    l_id:"ID", l_pw:"Password", l_signin:"Sign in", l_google:"Continue with Google",
    l_soon:"Your ID and password are given by the CLC admin.", close:"Close", logout:"Log out",
    l_bad:"Wrong ID or password.", l_notadmin:"This Google account is not the CLC admin.", l_in:"Signed in. Your dashboard is coming in the next steps.", e_fail:"Could not send. Check your internet and try again."
  },
  my: {
    nav_about:"အကြောင်း", nav_programs:"သင်တန်းများ", nav_schedule:"အချိန်ဇယား", nav_enrol:"စာရင်းသွင်း", login:"ဝင်ရန်",
    hero_title:"အတူသင်ယူ၊ အတူတိုးတက်ကြမယ်။",
    hero_sub:"မြန်မာလူငယ်များအတွက် အင်္ဂလိပ်စာနှင့် ဘဝစွမ်းရည် သင်ယူရေး၊ စေတနာ့ဝန်ထမ်း ဆရာများနှင့်အတူ။",
    cta_enrol:"စာရင်းသွင်းမည်", cta_programs:"သင်တန်းများကြည့်မည်",
    about_h:"CLC အကြောင်း",
    about_p:"Circle Learning Centre ကို ၂၀၂၁ ခုနှစ်တွင် Facebook စာမျက်နှာအဖြစ် စတင်ခဲ့ပါသည်။ စေတနာ့ဝန်ထမ်း ဆရာများက အင်္ဂလိပ်စာ အခက်အခဲရှိသော လူငယ်နှင့် လူကြီးများ ယုံကြည်မှုရှိရှိ စကားပြောနိုင်လာစေရန် ကူညီခဲ့ကြသည်။",
    f1_k:"စတင်ခဲ့သည်", f1_v:"၂၀၂၁", f2_k:"ဆရာများ", f2_v:"စေတနာ့ဝန်ထမ်းများ", f3_k:"ဝန်ဆောင်မှုပေးသူများ", f3_v:"မြန်မာလူငယ်နှင့် လူကြီးများ",
    prog_h:"သင်တန်းများ", sched_h:"အတန်း အချိန်ဇယား",
    sched_note:"နမူနာ အချိန်ဇယား ဖြစ်ပါသည်။ မတက်ခင် ပြန်လည်စစ်ဆေးပါ။",
    enrol_h:"သင်တန်း စာရင်းသွင်းရန်",
    enrol_p:"သင့်အချက်အလက်ကို ပေးပို့ပါ။ ဆရာ သို့မဟုတ် အက်ဒမင်က စစ်ဆေးပြီး အတည်ပြုပြီးလျှင် ID နှင့် စကားဝှက်ကို အီးမေးလ်ဖြင့် ပေးပို့ပါမည်။",
    f_name:"အမည်အပြည့်အစုံ", f_contact:"အီးမေးလ်", f_course:"သင်တန်း", f_note:"မှတ်ချက်", f_submit:"လျှောက်ထားမည်",
    f_ok:"လက်ခံရရှိပါပြီ။ CLC သင်တန်းအတွက် ရွေးချယ်ခံရပါက အီးမေးလ်ဖြင့် အကြောင်းကြားပါမည်။",
    f_email_note:"CLC သင်တန်းအတွက် ရွေးချယ်ခံရပါက ဤအီးမေးလ်သို့ အကြောင်းကြားပါမည်။ ပုံမှန်ကြည့်ရှုသော အီးမေးလ်ကို အသုံးပြုပါ။",
    f_bad:"မှန်ကန်သော အီးမေးလ်လိပ်စာ ထည့်ပါ။",
    r_student:"ကျောင်းသား", r_teacher:"ဆရာ", r_admin:"အက်ဒမင်",
    l_id:"ID", l_pw:"စကားဝှက်", l_signin:"ဝင်မည်", l_google:"Google ဖြင့် ဆက်လုပ်မည်",
    l_soon:"ID နှင့် စကားဝှက်ကို CLC အက်ဒမင်က ပေးပါမည်။", close:"ပိတ်မည်", logout:"ထွက်မည်",
    l_bad:"ID သို့မဟုတ် စကားဝှက် မှားနေပါသည်။", l_notadmin:"ဤ Google အကောင့်သည် CLC အက်ဒမင် မဟုတ်ပါ။", l_in:"ဝင်ရောက်ပြီးပါပြီ။ သင့် dashboard ကို နောက်အဆင့်များတွင် ထည့်ပါမည်။", e_fail:"ပို့မရပါ။ အင်တာနက်စစ်ပြီး ပြန်ကြိုးစားပါ။"
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
    <li class="prog" tabindex="0" data-course="${i}">
      <span class="dot">${p.icon}</span>
      <span class="t"><b>${p[lang]}</b><small>${p[lang + "_d"]}</small></span>
    </li>`).join("");

  $("#scheduleList").innerHTML = DATA.schedule.map(s => `
    <li class="day">
      <span class="d">${DAYS[lang][s.day]}</span>
      <span class="c">${DATA.programs[s.course][lang]}<small>${s[lang + "_n"]}</small></span>
      <span class="tm">${s.time}</span>
    </li>`).join("");

  const sel = $("#courseSelect"), keep = sel.value;
  sel.innerHTML = DATA.programs.map((p, i) => `<option value="${i}">${p[lang]}</option>`).join("");
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

/* ---------- Tap a program → jump to enrol with it selected ---------- */
$("#programList").addEventListener("click", e => {
  const li = e.target.closest("[data-course]"); if (!li) return;
  $("#courseSelect").value = li.dataset.course;
  $("#enrol").scrollIntoView({ behavior: "smooth" });
});
$("#programList").addEventListener("keydown", e => { if (e.key === "Enter") e.target.click(); });

/* ---------- Enrol form (Step 2 will save this to Firestore) ---------- */
$("#enrolForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target;
  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contact.value.trim());
  if (!f.name.value.trim()) { f.name.focus(); return; }
  if (!okEmail) { f.contact.focus(); alert(T[lang].f_bad); return; }
  const entry = { name: f.name.value.trim(), email: f.contact.value.trim(),
                  course: DATA.programs[f.course.value].en, note: f.note.value.trim(), status: "pending" };
  try {
    if (db) await db.collection("enrolments").add({ ...entry, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    else console.log("Firebase not set up yet – enrolment not saved:", entry);
    f.reset(); $("#enrolOk").hidden = false;
  } catch (err) { console.error(err); toast(T[lang].e_fail); }
});

/* ---------- Login sheet (UI only for now) ---------- */
const scrim = $("#scrim");
const openSheet = () => { scrim.hidden = false; $("#signIn").focus(); };
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
const live = typeof firebase !== "undefined" && typeof firebaseConfig !== "undefined" && !firebaseConfig.apiKey.startsWith("PASTE");
let auth = null, db = null;
if (live) { firebase.initializeApp(firebaseConfig); auth = firebase.auth(); db = firebase.firestore(); }

function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.id); toast.id = setTimeout(() => t.hidden = true, 4000); }
function loginErr(msg) { const p = $("#loginErr"); p.textContent = msg || ""; p.hidden = !msg; }

$("#signIn").onclick = async () => {
  loginErr();
  if (!auth) return loginErr("Firebase is not set up yet.");
  const id = $("#loginForm").elements.id.value.trim().toLowerCase(), pw = $("#loginForm").elements.pw.value;
  if (!id || !pw) return;
  try { await auth.signInWithEmailAndPassword(`${id}@${ID_DOMAIN}`, pw); }
  catch (err) { loginErr(T[lang].l_bad); }
};
$("#googleBtn").onclick = async () => {
  loginErr();
  if (!auth) return loginErr("Firebase is not set up yet.");
  try {
    const { user } = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    if (user.email !== ADMIN_EMAIL) { await auth.signOut(); loginErr(T[lang].l_notadmin); } else location.href = "admin.html";
  } catch (err) { console.error(err); }
};
if (auth) auth.onAuthStateChanged(user => {
  $("#loginBtn").dataset.i18n = user ? "logout" : "login";
  $("#loginBtn").onclick = user ? () => auth.signOut() : openSheet;
  $("#adminLink").hidden = !(user && user.email === ADMIN_EMAIL);
  if (user) { closeSheet(); toast(T[lang].l_in); }
  renderLang();
});

/* ---------- Footer ---------- */
[["fb", "fb"], ["yt", "yt"], ["tt", "tt"]].forEach(([id, k]) => {
  const a = $("#" + id);
  if (LINKS[k]) { a.href = LINKS[k]; a.target = "_blank"; a.rel = "noopener"; } else a.hidden = true;
});
$("#yr").textContent = new Date().getFullYear();
renderLang();
