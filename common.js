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

/* ---------- Strings used by more than one page ---------- */
const COMMON_T = {
  en: { noMsgs: "No messages yet.", typeMsg: "Write a message…", send: "Send", close: "Close", fail: "Something went wrong. Try again.",
    reportTitle: "Report to admin", reportHelp: "Send a problem, suggestion or question to the CLC admin. This is not instant chat – the admin replies when available.",
    subject: "Subject", message: "Message", sendReport: "Send report", noReports: "No reports yet.", reportSent: "Report sent", adminReply: "Admin reply", resolved: "Resolved", open: "Open",
    tg: "Telegram group", zoom: "Join Zoom", materials: "Class materials", level: "Level", present: "Present", late: "Late", absent: "Absent", excused: "Excused", attendance: "Attendance", teacher: "Teacher" },
  my: { noMsgs: "မက်ဆေ့ချ် မရှိသေးပါ။", typeMsg: "မက်ဆေ့ချ် ရေးပါ…", send: "ပို့မည်", close: "ပိတ်မည်", fail: "တစ်ခုခု မှားသွားပါသည်။ ပြန်ကြိုးစားပါ။",
    reportTitle: "အက်ဒမင်သို့ အစီရင်ခံရန်", reportHelp: "ပြဿနာ၊ အကြံပြုချက် သို့မဟုတ် မေးခွန်းကို CLC အက်ဒမင်ထံ ပို့ပါ။ ချက်ချင်း စကားပြောခြင်း မဟုတ်ပါ၊ အက်ဒမင် အားလပ်သည့်အခါ ပြန်ကြားပါမည်။",
    subject: "ခေါင်းစဉ်", message: "စာသား", sendReport: "ပို့မည်", noReports: "ပို့ထားသော အစီရင်ခံစာ မရှိသေးပါ။", reportSent: "ပို့ပြီးပါပြီ", adminReply: "အက်ဒမင် အဖြေ", resolved: "ဖြေရှင်းပြီး", open: "စောင့်ဆိုင်းနေ",
    tg: "Telegram အဖွဲ့", zoom: "Zoom ဝင်ရန်", materials: "သင်ခန်းစာ ဖိုင်များ", level: "အဆင့်", present: "တက်ရောက်", late: "နောက်ကျ", absent: "ပျက်ကွက်", excused: "ခွင့်ယူ", attendance: "တက်ရောက်မှု", teacher: "ဆရာ" }
};
