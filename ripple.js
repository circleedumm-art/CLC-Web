/* CLC click ripple: a soft ring that spreads from the spot you click or tap.
   - Matches the theme (navy in light mode, light blue in dark mode).
   - Never blocks clicks, skips text fields, and is switched off for people who prefer reduced motion.
   To change the look, edit SIZE (ring size in pixels), TIME (milliseconds) or the two colours below. */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const SIZE = 96, TIME = 750;
  const css = document.createElement("style");
  css.textContent = `
  .clc-rip{position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147483000;--rc:rgba(36,49,85,.55);--rf:rgba(36,49,85,.12)}
  :root[data-theme="dark"] .clc-rip{--rc:rgba(143,176,245,.7);--rf:rgba(143,176,245,.16)}
  .clc-rip i{position:absolute;left:0;top:0;width:${SIZE}px;height:${SIZE}px;margin:${-SIZE / 2}px 0 0 ${-SIZE / 2}px;border-radius:50%;opacity:0;transform:scale(.1);will-change:transform,opacity;
    animation:clcRip ${TIME}ms cubic-bezier(.16,.8,.24,1) forwards}
  .clc-rip i.a{border:2px solid var(--rc);background:var(--rf)}
  .clc-rip i.b{border:1.5px solid var(--rc);animation-delay:110ms;animation-duration:${TIME + 120}ms}
  @keyframes clcRip{0%{opacity:.95;transform:scale(.1)}70%{opacity:.35}100%{opacity:0;transform:scale(1)}}
  @media print{.clc-rip{display:none!important}}`;
  document.head.appendChild(css);

  const dark = () => document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
  let active = 0, lastType = "mouse";
  function spawn(x, y) {
    if (active > 6) return;                               // never pile up
    const el = document.createElement("div");
    el.className = "clc-rip"; el.style.transform = `translate(${x}px,${y}px)`; el.setAttribute("aria-hidden", "true");
    if (dark()) el.style.cssText += ";--rc:rgba(143,176,245,.7);--rf:rgba(143,176,245,.16)";
    el.innerHTML = '<i class="a"></i><i class="b"></i>';
    document.body.appendChild(el); active++;
    setTimeout(() => { el.remove(); active--; }, TIME + 300);
  }
  const skip = t => t && t.closest && t.closest("input,textarea,select,[contenteditable='true']");
  // Mouse and pen: ring appears the moment you press. Touch: on tap (so scrolling does not trigger rings).
  addEventListener("pointerdown", e => { lastType = e.pointerType; if (e.button === 0 && e.pointerType !== "touch" && !skip(e.target)) spawn(e.clientX, e.clientY); }, { passive: true });
  addEventListener("click", e => { if (lastType === "touch" && e.detail > 0 && !skip(e.target)) spawn(e.clientX, e.clientY); }, { passive: true });
})();
