# Osmo Setări

PWA statică (fără build) cu setări recomandate pe scenarii pentru DJI Osmo Action 4.
Fișiere: `index.html`, `boot.js` (pornire), `app.js` (logica), `presets.js` (scenariile), `sw.js` (service worker), `manifest.json`, `icons/`.
Răspunde în română, scurt.

## Reguli

1. **Tot JavaScript-ul aplicației stă în `app.js`.**
   - Fără `<script>` inline în `index.html` și fără atribute `onclick=`, `onload=` etc. — evenimentele se leagă cu `addEventListener` în `app.js`.
   - Content-Security-Policy din `index.html` (`script-src 'self'`) le blochează oricum.
   - `boot.js` rămâne doar încărcătorul (`presets.js` → `app.js`); nu pune logică acolo și nu adăuga alte fișiere JS.

2. **`presets.js` conține doar text.**
   - Fără HTML (`<b>`, `<br>` etc.), fără cod, fără `javascript:`.
   - Pentru rând nou într-o valoare scrie `\n`, nu `<br>`.

3. **La fiecare modificare crește versiunea cache-ului din `sw.js`.**
   - `const VERSION = "vN";` → `"vN+1"` (ex. `v8` → `v9`), la orice commit care schimbă fișiere ale aplicației.
   - Regula aceasta are prioritate față de comentariul vechi din `sw.js` care spune că nu e nevoie pentru `presets.js`/`index.html`.

## Tutorial

După fiecare pas făcut, actualizează documentul HOW TO: https://claude.ai/artifact/UfJXR9THqjs8P7zbf4beKE (rând nou în „Jurnal”, cel mai nou sus; secțiune „Pas N” dacă e un procedeu nou).

## Verificare

`.github/workflows/verificare.yml` rulează la fiecare push: `node --check` pe JS, validează `presets.js` (fără HTML/cod, id-uri unice) și caută script inline / `on…=` în `index.html`. Înainte de commit poți rula local:

```
for f in boot.js app.js presets.js sw.js; do node --check "$f"; done
```
