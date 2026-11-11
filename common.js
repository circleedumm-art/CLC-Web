/* Shared helpers for the website, student, teacher and admin pages (loaded before each page's own script). */

const _esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Course levels (A1–C2 with Burmese names, beginner → proficient) ---------- */
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_NAME = {
  en: { A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper-intermediate", C1: "Advanced", C2: "Proficient" },
  my: { A1: "အခြေခံ", A2: "အခြေခံအထက်", B1: "အလယ်အလတ်", B2: "အလယ်အလတ်အထက်", C1: "အဆင့်မြင့်", C2: "ကျွမ်းကျင်" }
};
const levelText = (code, lang) => code && LEVEL_NAME[lang][code] ? `${code} · ${LEVEL_NAME[lang][code]}` : "";

/* ---------- Links: only https links are ever shown or opened ---------- */
const safeUrl = u => { u = String(u || "").trim(); return /^https:\/\/[^\s"'<>]{3,500}$/i.test(u) ? u : ""; };
const linkBtn = (url, label, cls = "ghost") => { const u = safeUrl(url); return u ? `<a class="btn small ${cls}" href="${_esc(u)}" target="_blank" rel="noopener noreferrer">${_esc(label)}</a>` : ""; };
const ytId = u => { const m = String(u).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/); return m ? m[1] : ""; };
function videoBlock(url, label) {
  const u = safeUrl(url); if (!u) return "";
  const id = ytId(u);
  return (id ? `<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="video" loading="lazy" allowfullscreen></iframe></div>` : "") + linkBtn(u, label);
}

/* ---------- Attendance maths and charts ---------- */
// Present + Late count as attended. Excused sessions are left out of the percentage.
function attStats(list) {
  const c = { present: 0, late: 0, absent: 0, excused: 0 };
  list.forEach(s => { if (s in c) c[s]++; });
  const attended = c.present + c.late, counted = attended + c.absent;
  return { ...c, total: list.length, pct: counted ? Math.round(attended / counted * 100) : null };
}
function donut(c) {
  const tot = c.present + c.late + c.absent + c.excused, R = 40, C = 2 * Math.PI * R, col = { present: "#34C759", late: "#FF9500", absent: "#FF3B30", excused: "#8E8E93" };
  let off = 0;
  const segs = tot ? ["present", "late", "absent", "excused"].map(k => {
    const len = c[k] / tot * C; if (!len) return "";
    const s = `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${col[k]}" stroke-width="16" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"/>`;
    off += len; return s;
  }).join("") : "";
  return `<svg viewBox="0 0 120 120" width="108" height="108" role="img" aria-label="${c.pct ?? 0}%"><circle cx="60" cy="60" r="${R}" fill="none" stroke="rgba(120,120,128,.25)" stroke-width="16"/>${segs}
    <text x="60" y="67" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor">${c.pct === null ? "–" : c.pct + "%"}</text></svg>`;
}
const pctBar = p => `<div class="pbar"><i style="width:${p ?? 0}%"></i></div>`;

/* ---------- Messages (not real time: loaded when opened) ---------- */
const ts = d => d && d.toMillis ? d.toMillis() : (d && d.ms) || 0;
const when2 = d => { const x = new Date(ts(d)); return ts(d) ? x.toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""; };
const bubbles = (list, me) => list.map(m => `<div class="bub ${m.from === me ? "me" : "them"}">${_esc(m.text)}<small>${when2(m.createdAt)}</small></div>`).join("");
const readKey = k => "clc_read_" + k;
function unread(key, list, me) {
  let last = 0; try { last = Number(localStorage.getItem(readKey(key)) || 0); } catch {}
  return list.filter(m => m.from !== me && ts(m.createdAt) > last).length;
}
function markRead(key, list) { try { localStorage.setItem(readKey(key), String(Math.max(0, ...list.map(x => ts(x.createdAt))))); } catch {} }

function threadSheet(modal, { title, list, me, t, onSend, onClose }) {
  const paint = () => { const box = modal.querySelector(".thread"); box.innerHTML = bubbles(list, me) || `<p class="note center">${_esc(t("noMsgs"))}</p>`; box.scrollTop = box.scrollHeight; };
  modal.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div><h3>${_esc(title)}</h3><div class="thread"></div>
    <form class="group form" style="margin-top:10px" onsubmit="return false"><label><textarea name="text" rows="2" maxlength="1000" placeholder="${_esc(t("typeMsg"))}" style="text-align:left"></textarea></label></form>
    <button class="btn wide" id="tsend">${_esc(t("send"))}</button><button class="link" id="tclose">${_esc(t("close"))}</button></div>`;
  modal.hidden = false; paint();
  modal.querySelector("#tclose").onclick = () => { modal.hidden = true; modal.innerHTML = ""; if (onClose) onClose(); };
  modal.querySelector("#tsend").onclick = async () => {
    const ta = modal.querySelector("textarea"), text = ta.value.trim(), b = modal.querySelector("#tsend"); if (!text) return;
    b.disabled = true;
    try { list.push(await onSend(text)); ta.value = ""; paint(); } catch (e) { console.error(e); alert(t("fail")); } finally { b.disabled = false; }
  };
}

/* ---------- Report to admin ---------- */
function reportBlock(t, reports) {
  const rows = reports.slice().sort((a, b) => ts(b.createdAt) - ts(a.createdAt)).map(r => `<li class="item"><div class="grow"><b>${_esc(r.subject || "—")}</b><small>${_esc(r.text)}</small>
    ${r.adminReply ? `<small class="reply">${_esc(t("adminReply"))}: ${_esc(r.adminReply)}</small>` : ""}</div>
    <span class="pill s-${r.status === "resolved" ? "active" : "pending"}">${_esc(t(r.status === "resolved" ? "resolved" : "open"))}</span></li>`).join("");
  return `<p class="sub">${t("reportTitle")}</p><p class="note">${t("reportHelp")}</p>
    <form id="rf" class="group form" novalidate><label><span>${t("subject")}</span><input name="subject" maxlength="100"></label>
    <label><span>${t("message")}</span><textarea name="text" rows="3" maxlength="2000"></textarea></label></form>
    <button class="btn wide" id="rsend">${t("sendReport")}</button>
    <ul class="group" style="margin-top:14px">${rows || `<li class="empty"><div>${t("noReports")}</div></li>`}</ul>`;
}
function bindReportBlock(db, me, t, reports, redraw, toast) {
  $("#rsend").onclick = async () => {
    const f = $("#rf").elements, text = f.text.value.trim(); if (!text) return;
    const d = { fromUid: me.id, fromName: me.name, fromRole: me.role, loginId: me.loginId, subject: f.subject.value.trim(), text, status: "new", createdAt: firebase.firestore.FieldValue.serverTimestamp() };
    try { await db.collection("reports").add(d); reports.push({ ...d, createdAt: { ms: Date.now() } }); toast(t("reportSent")); redraw(); }
    catch (e) { console.error(e); toast(t("fail")); }
  };
}

/* ---------- Schedule: up to 3 weekly sessions per class, plus a time zone ---------- */
const DEFAULT_TZ = "Asia/Yangon";   // classes saved before time zones existed are treated as Myanmar Time
const TZ_LIST = [["Asia/Yangon", "Myanmar Time"], ["Asia/Bangkok", "Thailand"], ["Asia/Jakarta", "Indonesia (WIB)"], ["Asia/Singapore", "Singapore / Malaysia"],
  ["Asia/Kolkata", "India"], ["Europe/Prague", "Central Europe"], ["Europe/London", "United Kingdom"], ["America/New_York", "US Eastern"], ["UTC", "Universal Time"]];
const fmt12 = hm => { const [h, m] = String(hm).split(":").map(Number); return isNaN(h) ? "" : `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };
// Old classes have a single `day` and `time` text; new ones have `sessions` [{day, start, end}].
function sessionsOf(c) {
  const list = Array.isArray(c.sessions) ? c.sessions.filter(s => Number.isInteger(s.day) && s.day >= 0 && s.day <= 6) : [];
  if (list.length) return list.slice().sort((a, b) => a.day - b.day || String(a.start || "").localeCompare(String(b.start || "")));
  return Number.isInteger(c.day) ? [{ day: c.day, time: c.time }] : [];
}
const sessionTime = (s, lang) => s.start && s.end ? `${fmt12(s.start)} ${lang === "en" ? "to" : "–"} ${fmt12(s.end)}` : (s.time || "");
const firstKey = c => { const s = sessionsOf(c)[0]; return s ? s.day * 10000 + (parseInt(String(s.start || "0:0").replace(":", ""), 10) || 0) : 99999; };
// One line per class: sessions with the same time are joined, e.g. "Tuesday & Thursday 8:00 PM to 9:45 PM".
function whenText(c, days, lang) {
  const groups = [];
  sessionsOf(c).forEach(s => { const key = sessionTime(s, lang), g = groups.find(x => x.key === key); if (g) g.days.push(s.day); else groups.push({ key, days: [s.day] }); });
  const join = d => d.length < 2 ? d[0] : lang === "my" ? d.join(" နှင့် ") : d.slice(0, -1).join(", ") + " & " + d[d.length - 1];
  return groups.map(g => `${join(g.days.map(d => days[d]))} ${g.key}`.trim()).join(" · ");
}
const scheduleLine = (c, days, lang) => whenText(c, days, lang || "en");

/* ---------- Course duration: start date + months -> end date and number of sessions ---------- */
const isoToUTC = iso => { const [y, m, d] = String(iso).split("-").map(Number); return Date.UTC(y, m - 1, d); };
const utcToISO = ms => new Date(ms).toISOString().slice(0, 10);
function addMonthsISO(iso, n) {
  const [y, m, d] = iso.split("-").map(Number), total = (m - 1) + n, ny = y + Math.floor(total / 12), nm = total % 12;
  return utcToISO(Date.UTC(ny, nm, Math.min(d, new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate())));
}
function courseInfo(c) {
  if (!c.startDate || !c.durationMonths) return null;
  const months = Number(c.durationMonths), end = utcToISO(isoToUTC(addMonthsISO(c.startDate, months)) - 864e5);
  const days = new Set(sessionsOf(c).map(s => s.day)); let total = 0;
  for (let t = isoToUTC(c.startDate); t <= isoToUTC(end); t += 864e5) if (days.has((new Date(t).getUTCDay() + 6) % 7)) total++;
  return { start: c.startDate, end, months, total };
}
const fmtDate = (iso, lang) => new Date(isoToUTC(iso)).toLocaleDateString(lang === "my" ? "my-MM" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
function durationText(c, lang) {
  const i = courseInfo(c); if (!i) return "";
  return lang === "my" ? `${i.months} လ · ${i.total} ကြိမ် · ${fmtDate(i.start, lang)} – ${fmtDate(i.end, lang)}`
    : `${i.months} month${i.months === 1 ? "" : "s"} · ${i.total} sessions · ${fmtDate(i.start, lang)} – ${fmtDate(i.end, lang)}`;
}

/* ---------- Scholarship essay: 250 words, or 10 sentences when written in Burmese ---------- */
function essayStats(text) {
  const letters = (text.match(/\p{L}/gu) || []).length, my = (text.match(/[\u1000-\u109F]/g) || []).length;
  if (letters && my / letters > 0.3) return { unit: "sentences", n: text.split(/[။.!?\n]+/).map(x => x.trim()).filter(Boolean).length, min: 3, max: 10 };
  return { unit: "words", n: text.trim() ? text.trim().split(/\s+/).length : 0, min: 30, max: 250 };
}
const stars = n => "★".repeat(n) + "☆".repeat(5 - n);


function offsetMin(tz, d) {   // minutes that `tz` is ahead of UTC at instant d
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" })
    .formatToParts(d).filter(x => x.type !== "literal").map(x => [x.type, +x.value]));
  return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(d.getTime() / 1000) * 1000) / 60000);
}
const offsetText = m => { const a = Math.abs(m), h = Math.floor(a / 60), mi = a % 60; return "UTC" + (m === 0 ? "" : (m < 0 ? "-" : "+") + h + (mi ? ":" + String(mi).padStart(2, "0") : "")); };
const tzLabel = tz => { const n = (TZ_LIST.find(x => x[0] === tz) || [tz, tz])[1]; try { return `${n} (${offsetText(offsetMin(tz, new Date()))})`; } catch { return n; } };
const tzOptions = sel => TZ_LIST.map(([v]) => `<option value="${v}" ${v === (sel || DEFAULT_TZ) ? "selected" : ""}>${_esc(tzLabel(v))}</option>`).join("");

const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const wdIndex = (tz, d) => WD.indexOf(new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(d));
function instantFor(tz, day, hm) {   // the next real moment when `day` + `hm` happens in `tz`
  const [H, M] = hm.split(":").map(Number), now = new Date();
  for (let k = 0; k < 8; k++) {
    const probe = new Date(now.getTime() + k * 864e5); if (wdIndex(tz, probe) !== day) continue;
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(probe).filter(x => x.type !== "literal").map(x => [x.type, +x.value]));
    const base = Date.UTC(p.year, p.month - 1, p.day, H, M);
    let t = base - offsetMin(tz, new Date(base)) * 60000; t = base - offsetMin(tz, new Date(t)) * 60000;
    return new Date(t);
  }
  return null;
}
// The same session in the viewer's own time zone, or null when it would look the same.
function localSession(s, tz, myTz) {
  try {
    myTz = myTz || Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!s.start || !s.end || !myTz || myTz === tz) return null;
    const st = instantFor(tz, s.day, s.start); if (!st || offsetMin(tz, st) === offsetMin(myTz, st)) return null;
    const [h1, m1] = s.start.split(":").map(Number), [h2, m2] = s.end.split(":").map(Number);
    let dur = (h2 * 60 + m2) - (h1 * 60 + m1); if (dur <= 0) dur += 1440;
    const hm = d => new Intl.DateTimeFormat("en-GB", { timeZone: myTz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
    return { day: wdIndex(myTz, st), start: hm(st), end: hm(new Date(st.getTime() + dur * 60000)), tz: myTz, offset: offsetText(offsetMin(myTz, st)) };
  } catch { return null; }
}

// Form fields for up to three sessions, and reading them back.
function sessionFields(sessions, days, L) {
  return [0, 1, 2].map(i => {
    const s = sessions[i] || {};
    const options = (i ? `<option value="">${_esc(L.none)}</option>` : "") + days.map((d, k) => `<option value="${k}" ${s.day === k || (i === 0 && s.day === undefined && k === 0) ? "selected" : ""}>${_esc(d)}</option>`).join("");
    return `<label class="sess"><span>${_esc(L.session)} ${i + 1}${i ? ` (${_esc(L.optional)})` : ""}</span><select name="sd${i}">${options}</select>
      <input type="time" name="ss${i}" value="${_esc(s.start || "")}"><input type="time" name="se${i}" value="${_esc(s.end || "")}"></label>`;
  }).join("");
}
function readSessions(f, L) {
  const list = [];
  for (let i = 0; i < 3; i++) {
    const d = f["sd" + i].value, s = f["ss" + i].value, e = f["se" + i].value;
    if (i > 0 && d === "") continue;
    if (d === "" || !s || !e) return { error: L.needTimes };
    if (s === e) return { error: L.sameTime };
    list.push({ day: Number(d), start: s, end: e });
  }
  list.sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
  return { list };
}
// Saved with the class; day/time keep the first session for older code.
const scheduleFields = (list, tz) => ({ sessions: list, tz, day: list[0].day, time: sessionTime(list[0]) });

/* ---------- Grades as percentages ---------- */
const pctOf = g => g.max ? Math.round(g.score / g.max * 100) : 0;
const gradePct = list => { const m = list.reduce((a, g) => a + (Number(g.max) || 0), 0), s = list.reduce((a, g) => a + (Number(g.score) || 0), 0); return m > 0 ? Math.round(s / m * 100) : null; };

/* ---------- Certificate signature ---------- */
const SIGNER = { name: "Min Khant Kyaw @ Peter", short: "Min Khant Kyaw", title: { en: "Founder & Academic Head", my: "တည်ထောင်သူနှင့် ပညာရေးဆိုင်ရာ ဦးဆောင်သူ" } };
const signatureBlock = lang => `<div class="sign"><img src="signature.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'sig-text',textContent:'${SIGNER.short}'}))">
  <div class="line"></div><b>${_esc(SIGNER.name)}</b><span>${_esc(SIGNER.title[lang] || SIGNER.title.en)}</span><span>Circle Learning Centre</span></div>`;

/* ---------- Strings used by more than one page ---------- */
const COMMON_T = {
  en: { noMsgs: "No messages yet.", typeMsg: "Write a message…", send: "Send", close: "Close", fail: "Something went wrong. Try again.",
    reportTitle: "Report to admin", reportHelp: "Send a problem, suggestion or question to the CLC admin. This is not instant chat – the admin replies when available.",
    subject: "Subject", message: "Message", sendReport: "Send report", noReports: "No reports yet.", reportSent: "Report sent", adminReply: "Admin reply", resolved: "Resolved", open: "Open",
    session: "Session", optional: "optional", none: "— none —", needTimes: "Each session needs a day, a start time and an end time.", sameTime: "Start and end time cannot be the same.",
    help: "How to use this website", watch: "Watch video", duration: "Course length", tz: "Time zone", yourTime: "Your time", overall: "Overall", gradeLbl: "Grade", tg: "Telegram group", zoom: "Join Zoom", materials: "Class materials", level: "Level", present: "Present", late: "Late", absent: "Absent", excused: "Excused", attendance: "Attendance", teacher: "Teacher" },
  my: { noMsgs: "မက်ဆေ့ချ် မရှိသေးပါ။", typeMsg: "မက်ဆေ့ချ် ရေးပါ…", send: "ပို့မည်", close: "ပိတ်မည်", fail: "တစ်ခုခု မှားသွားပါသည်။ ပြန်ကြိုးစားပါ။",
    reportTitle: "အက်ဒမင်သို့ အစီရင်ခံရန်", reportHelp: "ပြဿနာ၊ အကြံပြုချက် သို့မဟုတ် မေးခွန်းကို CLC အက်ဒမင်ထံ ပို့ပါ။ ချက်ချင်း စကားပြောခြင်း မဟုတ်ပါ၊ အက်ဒမင် အားလပ်သည့်အခါ ပြန်ကြားပါမည်။",
    subject: "ခေါင်းစဉ်", message: "စာသား", sendReport: "ပို့မည်", noReports: "ပို့ထားသော အစီရင်ခံစာ မရှိသေးပါ။", reportSent: "ပို့ပြီးပါပြီ", adminReply: "အက်ဒမင် အဖြေ", resolved: "ဖြေရှင်းပြီး", open: "စောင့်ဆိုင်းနေ",
    session: "အတန်းချိန်", optional: "ရွေးချယ်ခွင့်", none: "— မရှိ —", needTimes: "အတန်းချိန်တိုင်းတွင် နေ့၊ စတင်ချိန်နှင့် ပြီးဆုံးချိန် လိုအပ်ပါသည်။", sameTime: "စတင်ချိန်နှင့် ပြီးဆုံးချိန် မတူရပါ။",
    help: "ဝက်ဘ်ဆိုက် အသုံးပြုပုံ", watch: "ဗီဒီယို ကြည့်မည်", duration: "သင်တန်းကာလ", tz: "အချိန်ဇုန်", yourTime: "သင့်ဒေသအချိန်", overall: "စုစုပေါင်း", gradeLbl: "အမှတ်", tg: "Telegram အဖွဲ့", zoom: "Zoom ဝင်ရန်", materials: "သင်ခန်းစာ ဖိုင်များ", level: "အဆင့်", present: "တက်ရောက်", late: "နောက်ကျ", absent: "ပျက်ကွက်", excused: "ခွင့်ယူ", attendance: "တက်ရောက်မှု", teacher: "ဆရာ" }
};
