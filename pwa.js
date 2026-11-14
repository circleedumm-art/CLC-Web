/* CLC app install support.
   - Registers the service worker (sw.js).
   - Shows an "Install app" link in the website footer when the phone/computer can install it.
   - On iPhone (which has no install button for websites) it shows the "Add to Home Screen" steps. */
(function () {
  "use strict";
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(e => console.warn("Service worker:", e)));
  }
  const link = document.getElementById("installLink");   // only on the public homepage
  if (!link) return;
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (standalone) return;
  const T = {
    en: { install: "Install app", ios: "On iPhone: tap the Share button, then “Add to Home Screen”." },
    my: { install: "အက်ပ် ထည့်သွင်းရန်", ios: "iPhone တွင်: Share ခလုတ်ကို နှိပ်ပြီး “Add to Home Screen” ကို ရွေးပါ။" }
  };
  const L = () => (document.documentElement.lang === "my" ? "my" : "en");
  const label = () => { link.textContent = T[L()].install; };
  let deferred = null;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const show = () => { label(); link.hidden = false; };
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; show(); });
  addEventListener("appinstalled", () => { link.hidden = true; deferred = null; });
  if (isIOS) show();
  new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  link.addEventListener("click", async e => {
    e.preventDefault();
    if (deferred) { deferred.prompt(); try { await deferred.userChoice; } catch (err) {} deferred = null; link.hidden = true; }
    else if (isIOS) { const t = document.getElementById("toast"); if (t) { t.textContent = T[L()].ios; t.hidden = false; setTimeout(() => t.hidden = true, 6000); } else alert(T[L()].ios); }
  });
})();
