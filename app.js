/* Osmo Setări – logica aplicației.
   Presetările sunt în presets.js. Tot textul din presetări e afișat ca text simplu
   (nu ca HTML), așa că nimic din el nu poate rula cod în aplicație. */
(() => {
"use strict";

const $ = id => document.getElementById(id);
const out = $("out");
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

  const cnt = h("div", { class: "cnt", id: "cnt" });
  const fill = h("div", { class: "fill", id: "fill" });
  const rst = h("button", { class: "rst", id: "rst" }, "Resetează");
  const ok = h("div", { class: "ok", id: "ok" }, "✅ Gata, camera e setată!");

  out.replaceChildren(
    h("h2", null, `${txt(p.e)} ${txt(p.n)}`),
    h("span", { class: "d" }, txt(p.d)),
    txt(p.f) ? h("div", { class: "f120" }, h("span", null, "Slow motion"), txt(p.f)) : null,
    h("div", { class: "bar" },
      h("div", { class: "prog" }, cnt, h("div", { class: "track" }, fill)),
      rst),
    ...rows,
    ok);

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
    cnt.replaceChildren(h("b", null, n), ` / ${t} setate`);
    fill.style.width = pc;
    $("nowC").replaceChildren(h("b", null, n), `/${t}`);
    $("nowF").style.width = pc;
    const nx = rows.find(x => !x.classList.contains("done"));
    rows.forEach(r => r.classList.toggle("next", r === nx));
    out.classList.toggle("all", n === t);
    $("now").classList.toggle("all", n === t);
    return n;
  };
  rows.forEach(r => r.onkeydown = e => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); r.click(); }
  });
  rows.forEach(r => r.onclick = () => {
    r.classList.toggle("done");
    const n = upd();
    if (n === rows.length) { buzz([30, 60, 30]); ok.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    buzz(12);
    const nx = rows.find(x => !x.classList.contains("done"));
    if (r.classList.contains("done") && nx) nx.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  rst.onclick = () => { rows.forEach(r => r.classList.remove("done")); upd(); buzz(20); };
  upd();
}

/* Navigare între pagini (merge și butonul Înapoi al telefonului) */
let cur = null, pushed = false;

/* Iconițele de pe pagina principală */
LIST.forEach(p => {
  const b = h("button", { class: "tab", "data-id": p.id },
    h("span", { class: "e" }, txt(p.e)),
    h("span", { class: "t" }, short(p)));
  b.onclick = () => { buzz(8); pushed = true; location.hash = p.id; };
  ($("t" + (p.g || 1)) || $("t1")).appendChild(b);
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
    $("home").classList.add("on");
  }
  scrollTo(0, 0);
}

/* Bara de sus și butonul de jos te duc pe pagina principală */
$("fpsTab").onclick = () => { buzz(8); pushed = true; location.hash = "120fps"; };
$("nowBtn").onclick = $("homeBtn").onclick = $("fpsBack").onclick = $("fpsHome").onclick = () => {
  buzz(8);
  if (pushed) history.back();
  else { history.replaceState(null, "", location.pathname + location.search); route(); }
};

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
$("prevBtn").onclick = () => go(-1);
$("nextBtn").onclick = () => go(1);
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
  const ask = act => { $("upd").hidden = false; $("updBtn").onclick = act; };
  $("updX").onclick = () => { $("upd").hidden = true; };
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
