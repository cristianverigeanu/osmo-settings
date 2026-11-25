/* Pornește aplicația: încarcă presetările, apoi aplicația.
   Marcajul „r” se schimbă doar când apeși „Actualizează”, ca telefonul să nu folosească
   din memorie fișiere vechi. De obicei nu e nevoie să modifici acest fișier. */
(() => {
  let r = "";
  try { r = localStorage.getItem("osmo-r") || ""; } catch (e) {}
  const q = r ? "?r=" + encodeURIComponent(r) : "";

  const fail = () => {
    const p = document.createElement("p");
    p.className = "sub load-err";
    p.textContent = "Nu s-au putut încărca presetările. Deschide aplicația o dată cu internet.";
    document.body.prepend(p);
  };
  const load = (src, next) => {
    const s = document.createElement("script");
    s.src = src + q;
    s.onload = next || null;
    s.onerror = fail;
    document.head.appendChild(s);
  };
  load("presets.js", () => load("app.js"));
})();
