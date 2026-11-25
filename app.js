/* Osmo Setări – logica aplicației.
   Presetările sunt în presets.js. Tot textul din presetări e afișat ca text simplu
   (nu ca HTML), așa că nimic din el nu poate rula cod în aplicație. */
(() => {
"use strict";

const $ = id => document.getElementById(id);
const on = (el, type, fn, opt) => el.addEventListener(type, fn, opt);
const out = $("out");

/* Tema: întunecată (implicit) sau deschisă pentru afară, în soare. Alegerea se ține minte. */
function setTheme(t) {
  const light = t === "light";
  if (light) document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = light ? "#eef0f3" : "#0e1013";
  $("thm").textContent = light ? "🌙 Întunecat" : "☀️ Soare";
  try { localStorage.setItem("osmo-theme", light ? "light" : "dark"); } catch (e) {}
}
let theme = "dark";
try { theme = localStorage.getItem("osmo-theme") || "dark"; } catch (e) {}
setTheme(theme);
on($("thm"), "click", () => setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light"));

const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

/* Construiește un element fără HTML: h("div", {class:"x"}, "text", copil, ...) */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v; else el.setAttribute(k, v);
  }
  for (const c of kids.flat()) {
    if (c === null || c === undefined || c === false || c === "") continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
const SVG = "http://www.w3.org/2000/svg";
function check() {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  const p = document.createElementNS(SVG, "path");
  p.setAttribute("d", "M6 12.5l4 4 8-9");
  svg.append(p);
  return h("span", { class: "chk" }, svg);
}
const txt = v => (typeof v === "string" ? v : "");

/* Numele categoriilor (apar sus, deasupra scenariului ales) */
const GRUPE = { 1: "Point & Shoot", 2: "Scenarii speciale", 3: "Timelapse" };

/* Doar scenariile scrise corect ajung în aplicație */
/* global P */
const LIST = (typeof P !== "undefined" && Array.isArray(P) ? P : []).filter(p =>
  p && typeof p.id === "string" && /^[a-z0-9-]+$/.test(p.id) && Array.isArray(p.r));

/* Bifele se salvează pe telefon (rămân și după închiderea aplicației).
   Se țin minte după numele setării, ca să nu se încurce dacă reordonezi rândurile. */
const SKEY = "osmo-done";
let DONE = {};
try {
  const d = JSON.parse(localStorage.getItem(SKEY));
  if (d && typeof d === "object" && !Array.isArray(d)) DONE = d;
} catch (e) {}
const saveDone = () => { try { localStorage.setItem(SKEY, JSON.stringify(DONE)); } catch (e) {} };

/* Mesaj jos cu „Anulează” (5 secunde) după o resetare */
let toastT = 0, undoFn = null;
function toast(msg, undo) {
  $("toastM").textContent = msg;
  undoFn = undo;
  $("toast").hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { $("toast").hidden = true; undoFn = null; }, 5000);
}
on($("toastU"), "click", () => {
  clearTimeout(toastT);
  $("toast").hidden = true;
  if (undoFn) { const f = undoFn; undoFn = null; f(); buzz(10); }
});

/* Șterge bifele (ale unui scenariu sau pe toate) și oferă „Anulează” */
function resetDone(id, msg) {
  const before = JSON.stringify(DONE);
  if (id) delete DONE[id]; else DONE = {};
  saveDone();
  refresh();
  buzz(20);
  toast(msg, () => { DONE = JSON.parse(before); saveDone(); refresh(); });
}

const short = p => txt(p.n).replace("Point & Shoot ", "");

/* Construiește scenariul pe pagina lui */
function build(p) {
  $("nowE").textContent = txt(p.e);
  $("nowN").textContent = txt(p.n);
  $("nowG").textContent = GRUPE[p.g] || "";

  const rows = p.r.map(([k, v, s], i) =>
    h("div", { class: "row", "data-i": i, role: "checkbox", "aria-checked": "false", tabindex: "0" },
      check(),
      h("div", { class: "k" }, txt(k)),
      h("div", { class: "v" }, h("span", { class: "vv" }, txt(v)), s ? h("small", null, txt(s)) : null)));

  const rst = h("button", { class: "rst", id: "rst" }, "Resetează bifele");
  const ok = h("div", { class: "ok", id: "ok" }, "✅ Gata, camera e setată!");

  /* Titlul și progresul sunt doar în bara de sus; în card rămân descrierea și sfatul 120 fps */
  const top = (txt(p.d) || txt(p.f)) ? h("div", { class: "top" },
    txt(p.d) ? h("span", { class: "d" }, txt(p.d)) : null,
    txt(p.f) ? h("div", { class: "f120" }, h("span", null, "Slow motion"), txt(p.f)) : null) : null;

  out.replaceChildren(...[top, ...rows, ok, h("div", { class: "foot" }, rst)].filter(Boolean));

  const saved = new Set(Array.isArray(DONE[p.id]) ? DONE[p.id] : []);
  rows.forEach((r, i) => r.classList.toggle("done", saved.has(p.r[i][0])));

  const ix = LIST.findIndex(x => x.id === p.id);
  const pp = LIST[(ix - 1 + LIST.length) % LIST.length], nn = LIST[(ix + 1) % LIST.length];
  $("prevT").textContent = `${txt(pp.e)} ${short(pp)}`;
  $("nextT").textContent = `${txt(nn.e)} ${short(nn)}`;
  $("dots").textContent = `${ix + 1}/${LIST.length}`;

  const upd = () => {
    const keys = p.r.filter((x, i) => rows[i].classList.contains("done")).map(x => x[0]);
    if (keys.length) DONE[p.id] = keys; else delete DONE[p.id];
    saveDone();
    rows.forEach(r => r.setAttribute("aria-checked", r.classList.contains("done")));
    const n = keys.length, t = rows.length, pc = (n / t * 100) + "%";
    $("nowC").replaceChildren(h("b", null, n), `/${t}`);
    $("nowF").style.width = pc;
    const nx = rows.find(x => !x.classList.contains("done"));
    rows.forEach(r => r.classList.toggle("next", r === nx));
    out.classList.toggle("all", n === t);
    $("now").classList.toggle("all", n === t);
    return n;
  };
  rows.forEach(r => on(r, "keydown", e => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); r.click(); }
  }));
  rows.forEach(r => on(r, "click", () => {
    r.classList.toggle("done");
    const n = upd();
    if (n === rows.length) { buzz([30, 60, 30]); ok.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    buzz(12);
    const nx = rows.find(x => !x.classList.contains("done"));
    if (r.classList.contains("done") && nx) nx.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
  on(rst, "click", () => {
    if (!DONE[p.id]) return;
    resetDone(p.id, "Bifele scenariului au fost resetate");
  });
  upd();
}

/* Redesenează pagina curentă după o resetare / anulare, fără să sară sus */
function refresh() {
  const p = LIST.find(x => x.id === cur);
  if (p && $("scen").classList.contains("on")) build(p);
  else cur = null; /* scenariul se reconstruiește la următoarea deschidere */
  homeReset();
}

/* Butonul „Resetează toate bifele” apare doar dacă ai ceva bifat */
function homeReset() {
  /* progresul pe fiecare iconiță, ex. „3/9” (verde când e complet) */
  document.querySelectorAll(".tab[data-id]").forEach(b => {
    const p = LIST.find(x => x.id === b.dataset.id);
    const keys = new Set(p.r.map(x => x[0]));
    const k = (Array.isArray(DONE[p.id]) ? DONE[p.id] : []).filter(x => keys.has(x)).length;
    const t = p.r.length;
    b.querySelector(".p").textContent = k ? (k === t ? `✓ ${k}/${t}` : `${k}/${t}`) : "";
    b.classList.toggle("full", k === t);
  });
  const n = LIST.filter(p => Array.isArray(DONE[p.id]) && DONE[p.id].length).length;
  $("allRst").hidden = !n;
  $("allRst").textContent = n === 1 ? "Resetează toate bifele (1 scenariu)" : `Resetează toate bifele (${n} scenarii)`;
}
on($("allRst"), "click", () => resetDone(null, "Toate bifele au fost resetate"));

/* Navigare între pagini (merge și butonul Înapoi al telefonului) */
let cur = null, pushed = false;

/* Iconițele de pe pagina principală */
LIST.forEach(p => {
  const b = h("button", { class: "tab", "data-id": p.id },
    h("span", { class: "e" }, txt(p.e)),
    h("span", { class: "t" }, short(p)),
    h("span", { class: "p" }));
  on(b, "click", () => { buzz(8); pushed = true; location.hash = p.id; });
  ($("t" + (p.g || 1)) || $("t1")).appendChild(b);
});

/* Lățimea iconițelor (grilă de 12): rânduri de câte 3; până la 4 iconițe stau pe un rând;
   la rest 2 → ultimele două mai late; la rest 1 → ultimele patru pe un rând */
["t1", "t2", "t3"].forEach(id => {
  const tabs = [...$(id).children], n = tabs.length;
  const span = Array(n).fill(4);
  if (n <= 4) span.fill(12 / n);
  else if (n % 3 === 2) span[n - 1] = span[n - 2] = 6;
  else if (n % 3 === 1) for (let i = n - 4; i < n; i++) span[i] = 3;
  tabs.forEach((b, i) => { b.style.gridColumn = `span ${span[i]}`; });
});

/* Pagina 120 fps: sfatul fiecărui scenariu care are câmpul f în presets.js */
(() => {
  const withF = LIST.filter(p => txt(p.f));
  $("fpsList").replaceChildren(...withF.map(p =>
    h("li", null, h("b", null, `${txt(p.e)} ${txt(p.n)}`), h("span", null, txt(p.f)))));
  $("fpsCard").hidden = !withF.length;
})();

function route() {
  const id = location.hash.slice(1);
  const p = LIST.find(x => x.id === id);
  document.querySelectorAll(".page").forEach(s => s.classList.remove("on"));
  if (id === "120fps") {
    $("fps").classList.add("on");
  } else if (p) {
    if (cur !== p.id) { build(p); cur = p.id; }
    try { localStorage.setItem("osmo", p.id); } catch (e) {}
    $("scen").classList.add("on");
  } else {
    let last = "";
    try { last = localStorage.getItem("osmo") || ""; } catch (e) {}
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("last", b.dataset.id === last));
    pushed = false;
    homeReset();
    $("home").classList.add("on");
  }
  scrollTo(0, 0);
  awake();
}

/* Ecranul rămâne aprins cât e deschis un scenariu (dacă telefonul permite) */
let lock = null;
async function awake() {
  const want = $("scen").classList.contains("on") && document.visibilityState === "visible";
  try {
    if (want && !lock && navigator.wakeLock) {
      lock = await navigator.wakeLock.request("screen");
      on(lock, "release", () => { lock = null; });
    } else if (!want && lock) {
      await lock.release(); lock = null;
    }
  } catch (e) { lock = null; }
}
on(document, "visibilitychange", awake);

/* Bara de sus și butonul de jos te duc pe pagina principală */
on($("fpsTab"), "click", () => { buzz(8); pushed = true; location.hash = "120fps"; });
const goHome = () => {
  buzz(8);
  if (pushed) history.back();
  else { history.replaceState(null, "", location.pathname + location.search); route(); }
};
["nowBtn", "homeBtn", "fpsBack", "fpsHome"].forEach(id => on($(id), "click", goHome));

/* Swipe stânga/dreapta = scenariul următor/anterior */
function go(dir) {
  const i = LIST.findIndex(x => x.id === cur);
  const n = LIST[(i + dir + LIST.length) % LIST.length];
  history.replaceState(null, "", "#" + n.id);
  route();
  out.classList.remove("fromR", "fromL"); void out.offsetWidth;
  out.classList.add(dir > 0 ? "fromR" : "fromL");
  buzz(10);
}
(() => {
  let x0 = 0, y0 = 0, dx = 0, mode = "";
  const sc = $("scen");
  sc.addEventListener("touchstart", e => {
    const t = e.touches[0];
    if (t.clientX < 24 || t.clientX > innerWidth - 24) { mode = "x-ignore"; return; }
    x0 = t.clientX; y0 = t.clientY; dx = 0; mode = "";
  }, { passive: true });
  sc.addEventListener("touchmove", e => {
    if (mode === "x-ignore" || mode === "y") return;
    const t = e.touches[0]; dx = t.clientX - x0; const dy = t.clientY - y0;
    if (!mode) { if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; mode = Math.abs(dx) > Math.abs(dy) ? "x" : "y"; }
    if (mode === "x") {
      out.style.transition = "none";
      out.style.transform = `translateX(${dx * .4}px)`;
      out.style.opacity = 1 - Math.min(Math.abs(dx) / 600, .4);
    }
  }, { passive: true });
  sc.addEventListener("touchend", () => {
    if (mode === "x") {
      out.style.transition = "transform .2s,opacity .2s"; out.style.transform = ""; out.style.opacity = "";
      if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
    }
    mode = "";
  }, { passive: true });
})();
on($("prevBtn"), "click", () => go(-1));
on($("nextBtn"), "click", () => go(1));
addEventListener("keydown", e => {
  if (!$("scen").classList.contains("on")) return;
  if (e.key === "ArrowRight") go(1);
  if (e.key === "ArrowLeft") go(-1);
});
addEventListener("hashchange", route);
route();

/* Ecranul de pornire stă minim 1,5 secunde de la deschidere, apoi dispare */
(() => {
  const sp = $("splash");
  if (!sp) return;
  setTimeout(() => {
    sp.classList.add("gone");
    sp.addEventListener("transitionend", () => sp.remove(), { once: true });
    setTimeout(() => sp.remove(), 800);
  }, Math.max(0, 1500 - performance.now()));
})();

/* ---- PWA: offline + actualizare fără refresh forțat ---- */
if ("serviceWorker" in navigator) {
  const sw = navigator.serviceWorker;
  let want = false;
  const bump = () => { try { localStorage.setItem("osmo-r", Date.now()); } catch (x) {} };
  let act = null;
  const ask = fn => { act = fn; $("upd").hidden = false; };
  on($("updBtn"), "click", () => { if (act) act(); });
  on($("updX"), "click", () => { $("upd").hidden = true; });
  /* Pagina se reîncarcă DOAR după ce ai apăsat „Actualizează” */
  sw.addEventListener("controllerchange", () => { if (want) location.reload(); });
  /* Fișierele de pe GitHub s-au schimbat → noul conținut e deja salvat, trebuie doar reîncărcat */
  sw.addEventListener("message", e => {
    if (e.data && e.data.type === "CONTENT_UPDATED") ask(() => { bump(); location.reload(); });
  });
  const register = () => sw.register("sw.js").then(reg => {
    const waiting = w => ask(() => { want = true; bump(); w.postMessage({ type: "SKIP_WAITING" }); });
    if (reg.waiting && sw.controller) waiting(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const w = reg.installing;
      w && w.addEventListener("statechange", () => { if (w.state === "installed" && sw.controller) waiting(w); });
    });
    reg.update().catch(() => {});
    /* Verifică actualizări și când revii în aplicație din fundal */
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reg.update().catch(() => {});
    });
  }).catch(() => {});
  /* sw.startMessages: primește și mesajele trimise înainte să fie gata aplicația */
  if (sw.startMessages) sw.startMessages();
  if (document.readyState === "complete") register(); else addEventListener("load", register);
}
})();
