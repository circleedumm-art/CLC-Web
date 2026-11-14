/* CLC festive decorations.
   On special days the site gets a small greeting, a few decorations and gentle falling effects.
   Everything is drawn by this one file (no images to upload). It never blocks clicks, pauses when the tab is hidden,
   stops animating after ~90 seconds to save phone battery, and is static for people who prefer reduced motion.

   HOW TO PREVIEW: add ?decor=christmas to any page address (christmas, newyear, independence, thingyan, mayday,
   teachers, thadingyut). Use ?decor=off to hide decorations.

   EACH YEAR: Thadingyut follows the moon, so add next year's full-moon date in THADINGYUT_FULL_MOON below.
   All other days are on fixed dates (EVENTS). Change the dates there if you want a longer or shorter run. */
(function () {
  "use strict";

  /* ---------------- 1. When to show what ---------------- */
  // [id, first day "MM-DD", last day "MM-DD"] – inclusive, and a window may cross New Year.
  const EVENTS = [
    ["christmas", "12-20", "12-26"],
    ["newyear", "12-30", "01-02"],
    ["independence", "01-03", "01-04"],
    ["thingyan", "04-09", "04-18"],
    ["mayday", "04-30", "05-01"],
    ["teachers", "10-04", "10-05"]            // World Teachers' Day, 5 October
  ];
  // Full-moon day of Thadingyut. Decorations run from 2 days before to 1 day after.
  const THADINGYUT_FULL_MOON = { 2026: "2026-10-26", 2027: "2027-10-15" };

  const pad = n => String(n).padStart(2, "0");
  const now = new Date(), Y = now.getFullYear(), MD = pad(now.getMonth() + 1) + "-" + pad(now.getDate());
  function activeEvent() {
    const forced = new URLSearchParams(location.search).get("decor");
    if (forced) return forced === "off" ? null : forced;
    for (const [id, a, b] of EVENTS) if (a <= b ? MD >= a && MD <= b : MD >= a || MD <= b) return id;
    const fm = THADINGYUT_FULL_MOON[Y];
    if (fm) {
      const d = new Date(fm + "T00:00"), t0 = new Date(Y, now.getMonth(), now.getDate());
      const diff = Math.round((t0 - d) / 864e5);
      if (diff >= -2 && diff <= 1) return "thadingyut";
    }
    return null;
  }
  const id = activeEvent();
  if (!id) return;
  const dismissKey = "clc_decor_off_" + id + "_" + Y;
  try { if (localStorage.getItem(dismissKey)) return; } catch (e) {}

  /* ---------------- 2. Greetings and colours ---------------- */
  const nextYear = now.getMonth() >= 6 ? Y + 1 : Y;   // 1–2 January shows the current year; December shows the coming one
  const LOOK = {
    christmas:    { en: "Merry Christmas!", my: "ခရစ္စမတ်ပွဲတော် မင်္ဂလာရှိပါစေ", bg: "linear-gradient(135deg,#C62E3E,#1F7A4D)" },
    newyear:      { en: "Happy New Year " + nextYear + "!", my: "နှစ်သစ်ကူး မင်္ဂလာရှိပါစေ", bg: "linear-gradient(135deg,#3A2D8F,#C9962B)" },
    independence: { en: "Happy Independence Day", my: "လွတ်လပ်ရေးနေ့ မင်္ဂလာရှိပါစေ", bg: "linear-gradient(135deg,#B7791F,#2F6B4F)" },
    thingyan:     { en: "Happy Thingyan & Myanmar New Year!", my: "သင်္ကြန်ပွဲတော် မင်္ဂလာရှိပါစေ", bg: "linear-gradient(135deg,#E8A700,#E2701F)" },
    mayday:       { en: "Happy May Day", my: "မေဒေး (အလုပ်သမားနေ့) မင်္ဂလာရှိပါစေ", bg: "linear-gradient(135deg,#B3261E,#D69A1F)" },
    teachers:     { en: "Happy Teachers' Day", my: "ကမ္ဘာ့ဆရာများနေ့ မင်္ဂလာရှိပါစေ", bg: "linear-gradient(135deg,#1D5FA8,#2E9F8F)" },
    thadingyut:   { en: "Happy Thadingyut Festival of Lights", my: "သီတင်းကျွတ်မီးထွန်းပွဲတော် မင်္ဂလာရှိပါစေ", bg: "linear-gradient(135deg,#7A2E8F,#E2701F)" }
  };
  const look = LOOK[id];
  if (!look) return;

  /* ---------------- 3. Decoration artwork (small inline SVG) ---------------- */
  const flower = (x, y, r, c1, c2) => {
    let s = "";
    for (let i = 0; i < 5; i++) { const a = i * 72 * Math.PI / 180; s += `<circle cx="${(x + Math.sin(a) * r).toFixed(1)}" cy="${(y - Math.cos(a) * r).toFixed(1)}" r="${(r * .72).toFixed(1)}" fill="${c1}"/>`; }
    return s + `<circle cx="${x}" cy="${y}" r="${(r * .42).toFixed(1)}" fill="${c2}"/>`;
  };
  const star = (x, y, R, fill) => {
    let p = "";
    for (let i = 0; i < 10; i++) { const r = i % 2 ? R * .45 : R, a = i * 36 * Math.PI / 180; p += (Math.sin(a) * r + x).toFixed(1) + "," + (y - Math.cos(a) * r).toFixed(1) + " "; }
    return `<polygon points="${p}" fill="${fill}"/>`;
  };
  const lantern = (c1, c2) => `<svg viewBox="0 0 60 120" width="100%" height="100%"><defs><radialGradient id="g${c1.slice(1)}" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".55" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs>
    <line x1="30" y1="0" x2="30" y2="26" stroke="#8a6a2a" stroke-width="2"/><rect x="20" y="24" width="20" height="7" rx="3" fill="#C9962B"/>
    <ellipse cx="30" cy="62" rx="25" ry="32" fill="url(#g${c1.slice(1)})" stroke="${c2}" stroke-width="1.5"/>
    <path d="M30 30v64M17 36c-6 16-6 42 0 56M43 36c6 16 6 42 0 56" fill="none" stroke="${c2}" stroke-opacity=".55" stroke-width="1.4"/>
    <rect x="21" y="92" width="18" height="7" rx="3" fill="#C9962B"/><line x1="30" y1="99" x2="30" y2="114" stroke="#C9962B" stroke-width="2"/><circle cx="30" cy="116" r="3.5" fill="#C9962B"/></svg>`;
  const padauk = flip => `<svg viewBox="0 0 150 130" width="100%" height="100%" style="${flip ? "transform:scaleX(-1)" : ""}">
    <path d="M150 0C120 14 96 32 70 58S28 100 4 124" fill="none" stroke="#6B8E3A" stroke-width="3" stroke-linecap="round"/>
    <path d="M118 18c-8 8-8 18-4 24M92 38c-7 9-6 19-2 26M64 66c-8 6-9 16-6 24M40 92c-7 5-9 14-7 20" fill="none" stroke="#6B8E3A" stroke-width="2.2" stroke-linecap="round"/>
    ${flower(134, 12, 8, "#F6C515", "#E07B00")}${flower(104, 28, 9, "#F9D030", "#E07B00")}${flower(112, 50, 7, "#F6C515", "#E07B00")}${flower(80, 46, 9, "#FADA45", "#E07B00")}
    ${flower(86, 78, 7, "#F6C515", "#E07B00")}${flower(56, 72, 9, "#F9D030", "#E07B00")}${flower(58, 102, 7, "#F6C515", "#E07B00")}${flower(30, 98, 8, "#FADA45", "#E07B00")}${flower(18, 120, 6, "#F6C515", "#E07B00")}</svg>`;
  const ART = {
    tree: `<svg viewBox="0 0 100 130" width="100%" height="100%"><rect x="44" y="108" width="12" height="18" fill="#7a4a24"/>
      <polygon points="50,10 82,52 18,52" fill="#2E8B57"/><polygon points="50,32 90,82 10,82" fill="#278451"/><polygon points="50,58 96,112 4,112" fill="#1F7A4D"/>
      ${star(50, 12, 10, "#FFD54A")}<circle cx="42" cy="48" r="4" fill="#E53950"/><circle cx="62" cy="70" r="4" fill="#FFD54A"/><circle cx="34" cy="88" r="4.5" fill="#4DA3FF"/><circle cx="66" cy="98" r="4.5" fill="#E53950"/><circle cx="50" cy="80" r="3.5" fill="#FFD54A"/><circle cx="24" cy="106" r="3.5" fill="#FFD54A"/><circle cx="78" cy="104" r="3.5" fill="#4DA3FF"/></svg>`,
    gifts: `<svg viewBox="0 0 100 70" width="100%" height="100%"><rect x="4" y="30" width="44" height="38" rx="3" fill="#E53950"/><rect x="22" y="30" width="8" height="38" fill="#FFD54A"/><rect x="4" y="22" width="44" height="12" rx="3" fill="#F26B7C"/>
      <rect x="54" y="42" width="40" height="26" rx="3" fill="#4DA3FF"/><rect x="70" y="42" width="8" height="26" fill="#FFD54A"/><rect x="54" y="35" width="40" height="10" rx="3" fill="#7DBBFF"/></svg>`,
    padaukL: padauk(false), padaukR: padauk(true),
    lanternA: lantern("#FF9F1C", "#D9480F"), lanternB: lantern("#FF6FA5", "#C2255C"), lanternC: lantern("#6EC6FF", "#1C7ED6"),
    stars: `<svg viewBox="0 0 120 90" width="100%" height="100%">${star(30, 56, 22, "#F4B400")}${star(78, 32, 28, "#FFD54A")}${star(100, 70, 14, "#F4B400")}${star(58, 16, 9, "#FFE082")}</svg>`,
    gear: `<svg viewBox="0 0 80 80" width="100%" height="100%"><circle cx="40" cy="40" r="26" fill="none" stroke="#B3261E" stroke-width="10" stroke-dasharray="9.2 9.2"/><circle cx="40" cy="40" r="22" fill="#D69A1F"/><circle cx="40" cy="40" r="10" fill="#fff" fill-opacity=".9"/><circle cx="40" cy="40" r="5" fill="#B3261E"/></svg>`,
    books: `<svg viewBox="0 0 110 90" width="100%" height="100%"><rect x="8" y="58" width="80" height="16" rx="3" fill="#1D5FA8"/><rect x="14" y="42" width="72" height="16" rx="3" fill="#E2701F"/><rect x="6" y="26" width="76" height="16" rx="3" fill="#2E9F8F"/>
      <rect x="82" y="10" width="9" height="62" rx="2" fill="#F4B400" transform="rotate(18 86 40)"/><polygon points="84,74 93,72 90,84" fill="#F1C9A0" transform="rotate(18 86 40)"/></svg>`,
    spark: `<svg viewBox="0 0 120 90" width="100%" height="100%">${star(30, 50, 20, "#FFD54A")}${star(80, 30, 26, "#F4B400")}${star(96, 70, 12, "#FFE082")}${star(58, 12, 8, "#FFF")}</svg>`
  };
  // [artwork, where, width in px (desktop), width in px (phone), swing/float animation]
  const ORNAMENTS = {
    christmas:    [["tree", "bl", 96, 64, "float"], ["gifts", "bl2", 70, 48, ""]],
    newyear:      [["spark", "tr", 110, 74, "float"]],
    independence: [["stars", "tr", 120, 80, "float"]],
    thingyan:     [["padaukL", "tl", 150, 90, "sway"], ["padaukR", "tr", 150, 90, "sway"]],
    mayday:       [["gear", "tr", 84, 58, "spin"]],
    teachers:     [["books", "bl", 100, 70, "float"]],
    thadingyut:   [["lanternA", "tl", 50, 36, "swing"], ["lanternB", "tr", 56, 40, "swing"], ["lanternC", "tl2", 40, 30, "swing2"], ["lanternA", "tr2", 40, 30, "swing2"]]
  };

  /* ---------------- 4. Styles ---------------- */
  const css = document.createElement("style");
  css.textContent = `
  .fx-orn{position:fixed;pointer-events:none;z-index:15;width:var(--w);opacity:.96;filter:drop-shadow(0 4px 8px rgba(0,0,0,.18))}
  .fx-tl,.fx-tl2,.fx-tr,.fx-tr2{top:var(--top,64px)}
  .fx-tl{left:0}.fx-tl2{left:calc(var(--w) + 34px)}.fx-tr{right:0}.fx-tr2{right:calc(var(--w) + 34px)}
  .fx-bl,.fx-bl2{bottom:max(8px,env(safe-area-inset-bottom))}.fx-bl{left:8px}.fx-bl2{left:calc(var(--w) + 40px)}
  @media(max-width:720px){.fx-orn{width:var(--ws)}.fx-bl,.fx-bl2{bottom:calc(84px + env(safe-area-inset-bottom))}.fx-tl2,.fx-tr2{display:none}}
  .fx-swing{transform-origin:50% 0;animation:fxSwing 4.2s ease-in-out infinite alternate}
  .fx-swing2{transform-origin:50% 0;animation:fxSwing 5.1s ease-in-out -1.6s infinite alternate}
  .fx-sway{transform-origin:100% 0;animation:fxSway 6s ease-in-out infinite alternate}
  .fx-tl.fx-sway{transform-origin:0 0}
  .fx-float{animation:fxFloat 3.6s ease-in-out infinite alternate}
  .fx-spin{animation:fxSpin 24s linear infinite}
  @keyframes fxSwing{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
  @keyframes fxSway{from{transform:rotate(-1.5deg)}to{transform:rotate(2deg)}}
  @keyframes fxFloat{from{transform:translateY(0)}to{transform:translateY(-6px)}}
  @keyframes fxSpin{to{transform:rotate(360deg)}}
  .fx-canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:15;transition:opacity 2s}
  .fx-pill{position:fixed;left:50%;top:var(--pt,70px);transform:translate(-50%,-8px);z-index:25;display:flex;align-items:center;gap:8px;max-width:calc(100% - 24px);
    padding:8px 8px 8px 16px;border-radius:999px;color:#fff;font-size:14px;font-weight:600;line-height:1.3;box-shadow:0 8px 24px rgba(0,0,0,.22);
    opacity:0;transition:opacity .6s,transform .6s}
  .fx-pill.on{opacity:1;transform:translate(-50%,0)}
  .fx-pill button{flex:none;width:26px;height:26px;border-radius:50%;border:0;background:rgba(255,255,255,.25);color:#fff;font-size:14px;line-height:1;cursor:pointer}
  @media(prefers-reduced-motion:reduce){.fx-orn{animation:none!important}.fx-canvas{display:none}}
  @media print{.fx-orn,.fx-canvas,.fx-pill{display:none!important}}`;
  document.head.appendChild(css);

  /* ---------------- 5. Place ornaments and greeting ---------------- */
  const bar = document.querySelector(".bar");
  const top = () => (bar ? Math.round(bar.getBoundingClientRect().bottom) : 0);
  const ornEls = [];
  (ORNAMENTS[id] || []).forEach(([art, pos, w, ws, anim]) => {
    const d = document.createElement("div");
    d.className = `fx-orn fx-${pos}` + (anim ? " fx-" + anim : "");
    d.style.cssText = `--w:${w}px;--ws:${ws}px`; d.setAttribute("aria-hidden", "true"); d.innerHTML = ART[art];
    document.body.appendChild(d); ornEls.push(d);
  });
  const pill = document.createElement("div");
  pill.className = "fx-pill"; pill.style.background = look.bg; pill.setAttribute("role", "status");
  const txt = document.createElement("span"), x = document.createElement("button");
  x.type = "button"; x.textContent = "✕"; x.setAttribute("aria-label", "Hide decorations");
  pill.append(txt, x); document.body.appendChild(pill);
  const lang = () => (document.documentElement.lang === "my" ? "my" : document.documentElement.lang === "en" ? "en" : (() => { try { return localStorage.getItem("clc_lang") === "my" ? "my" : "en"; } catch (e) { return "en"; } })());
  const say = () => { txt.textContent = look[lang()]; };
  const layout = () => { const t = top(); pill.style.setProperty("--pt", t + 8 + "px"); ornEls.forEach(e => e.style.setProperty("--top", t + 4 + "px")); };
  say(); layout(); addEventListener("resize", layout);
  new MutationObserver(say).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  requestAnimationFrame(() => requestAnimationFrame(() => { layout(); pill.classList.add("on"); }));
  setTimeout(() => pill.classList.remove("on"), 12000);   // the greeting fades away by itself
  let stopped = false, cvs = null;
  x.onclick = () => {
    try { localStorage.setItem(dismissKey, "1"); } catch (e) {}
    stopped = true; pill.remove(); ornEls.forEach(e => e.remove()); cvs && cvs.remove();
  };

  /* ---------------- 6. Falling effects and fireworks (canvas) ---------------- */
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const weak = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || innerWidth < 500;
  const COUNT = weak ? 22 : 38;
  const CONFETTI = ["#E53950", "#F4B400", "#2E9F8F", "#4DA3FF", "#8E5BD8", "#F2994A"];
  const MODE = {
    christmas:    { fall: "snow" },
    thingyan:     { fall: "petal" },
    newyear:      { fall: "confetti", fire: ["#E53950", "#F4B400", "#4DA3FF", "#8E5BD8", "#2E9F8F"] },
    independence: { fall: "confetti" },
    mayday:       { fall: "confetti", colors: ["#B3261E", "#D69A1F", "#F2994A", "#8B1A14"] },
    teachers:     { fall: "emoji", emoji: ["✏️", "📚", "🍎", "⭐"] },
    thadingyut:   { fire: ["#FF9F1C", "#FF6FA5", "#FFD54A", "#F26B3A", "#B26BFF"] }
  }[id] || {};
  cvs = document.createElement("canvas"); cvs.className = "fx-canvas"; cvs.setAttribute("aria-hidden", "true");
  document.body.appendChild(cvs);
  const ctx = cvs.getContext("2d"); if (!ctx) return;
  let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 1.5);
  const size = () => { W = innerWidth; H = innerHeight; cvs.width = W * dpr; cvs.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener("resize", size);
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];

  const make = first => {
    const p = { x: rnd(0, W), y: first ? rnd(-20, H) : rnd(-40, -10), ph: rnd(0, 6.28), rot: rnd(0, 6.28), vr: rnd(-.05, .05) };
    switch (MODE.fall) {
      case "snow":    p.r = rnd(1.6, 4.2); p.vy = rnd(.5, 1.3); p.sw = rnd(.3, 1); break;
      case "petal":   p.r = rnd(4, 7); p.vy = rnd(.7, 1.5); p.sw = rnd(.6, 1.6); p.c = pick(["#F6C515", "#F9D030", "#FADA45", "#F2A900"]); break;
      case "confetti": p.w = rnd(5, 9); p.h = rnd(3, 6); p.vy = rnd(.9, 1.9); p.sw = rnd(.4, 1.2); p.c = pick(MODE.colors || CONFETTI); break;
      case "emoji":   p.s = rnd(16, 24); p.vy = rnd(.5, 1.1); p.sw = rnd(.3, .9); p.ch = pick(MODE.emoji); break;
    }
    return p;
  };
  const items = MODE.fall ? Array.from({ length: MODE.fall === "emoji" ? Math.round(COUNT / 3) : COUNT }, () => make(true)) : [];
  const sparks = []; let nextBurst = 400;
  const burst = () => {
    const cx = rnd(W * .15, W * .85), cy = rnd(H * .12, H * .5), c = pick(MODE.fire), n = weak ? 22 : 34;
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rnd(-.1, .1), v = rnd(1.6, 3.4); sparks.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c }); }
  };

  const draw = t => {
    ctx.clearRect(0, 0, W, H);
    for (const p of items) {
      p.y += p.vy; p.ph += .03; p.x += Math.sin(p.ph) * p.sw; p.rot += p.vr;
      if (p.y > H + 20) Object.assign(p, make(false), { x: rnd(0, W) });
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      if (MODE.fall === "snow") { ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.shadowColor = "rgba(90,130,190,.55)"; ctx.shadowBlur = 3; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill(); }
      else if (MODE.fall === "petal") { ctx.fillStyle = p.c; ctx.globalAlpha = .9; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .55, 0, 0, 6.283); ctx.fill(); }
      else if (MODE.fall === "confetti") { ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      else if (MODE.fall === "emoji") { ctx.font = p.s + "px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(p.ch, 0, 0); }
      ctx.restore();
    }
    if (MODE.fire) {
      if (t > nextBurst) { burst(); nextBurst = t + rnd(1300, 2600); }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vy += .045; s.vx *= .985; s.life -= .014;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = s.life; ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, 2.2 * s.life + .6, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  };

  let last = 0; const t0 = performance.now();
  const loop = t => {
    if (stopped) return;
    if (t - t0 > 90000) { cvs.style.opacity = 0; setTimeout(() => cvs.remove(), 2200); return; }   // save battery
    requestAnimationFrame(loop);
    if (document.hidden || t - last < 33) return;   // about 30 frames a second
    last = t; draw(t - t0);
  };
  requestAnimationFrame(loop);
})();
