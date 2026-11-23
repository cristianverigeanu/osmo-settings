/* ============================================================
   PRESETĂRI – aici adaugi / modifici scenariile.
   Format pentru un scenariu nou:
   {id:"unic", g:1 sau 2, e:"emoji", n:"Nume", d:"descriere (opțional)", r:[
     ["Setare","Valoare","notă mică (opțional)"],
     ...
   ]},
   g:1 = grupul „Point & Shoot”, g:2 = grupul „Scenarii speciale”.
   După ce modifici, mărește VERSION în sw.js (ex: v1 → v2).
   ============================================================ */
const P = [
 {id:"zi",g:1,e:"☀️",n:"Point & Shoot ZI",d:"Munte / Stradă",r:[
  ["Rezoluție & FPS","4K / 50fps","bun și pentru slow-motion"],
  ["Shutter","Auto"],
  ["ISO","Auto 100–400"],
  ["EV","-0.7","protejează zăpada și cerul"],
  ["FOV","Wide"],
  ["White Balance","Auto","D-Log M se corectează ușor la editare"],
  ["Culoare","D-Log M (10-bit)"],
  ["Stabilizare","RockSteady"],
  ["Image Adjustment","Sharpness -2<br>Noise Red. -1"]]},
 {id:"noapte",g:1,e:"🌙",n:"Point & Shoot NOAPTE",d:"Stradă / Mașină",r:[
  ["Rezoluție & FPS","4K / 25fps","captează dublu față de 50fps"],
  ["Shutter","Auto","sau 1/100s fix dacă mergi repede"],
  ["ISO","Auto 100–1600"],
  ["EV","-0.3","evită arderea farurilor/reclamelor"],
  ["FOV","Wide"],
  ["White Balance","4000K","evită tonurile portocalii stradale"],
  ["Culoare","D-Log M (10-bit)","sau Normal dacă e beznă totală"],
  ["Stabilizare","RockSteady"],
  ["Image Adjustment","Sharpness -2<br>Noise Red. -1"]]},
 {id:"ploaie",g:1,e:"🌧️",n:"Point & Shoot ZI PLOIOASĂ",d:"Toamnă / Iarnă",r:[
  ["Rezoluție & FPS","4K / 25fps","sau 50fps doar dacă vrei slow-motion"],
  ["Shutter","Auto","sau 1/50s – 1/100s"],
  ["ISO","Auto 100–800","1600 în pădure/amurg"],
  ["EV","-0.3","sau 0 dacă e foarte întunecat"],
  ["FOV","Wide"],
  ["White Balance","5500K–6000K","evită tonul rece/albăstriu al cerului ploios"],
  ["Culoare","D-Log M (10-bit)"],
  ["Stabilizare","RockSteady"],
  ["Image Adjustment","Sharpness -2<br>Noise Red. -1"]]},
 {id:"walk",g:2,e:"🚶",n:"Night Walk",r:[
  ["FPS","25"],["Shutter","1/100s"],["ISO","Auto 100–1600","3200 max"],
  ["FOV","Wide"],["White Balance","4000K"],["Stabilizare","RockSteady"],["EV / Filtru","—"]]},
 {id:"drive",g:2,e:"🚗",n:"Night Drive",r:[
  ["FPS","25 / 50"],["Shutter","1/100–1/200s"],["ISO","Auto 100–800","1600 pe drum întunecat"],
  ["FOV","Wide"],["White Balance","4000K"],["Stabilizare","RockSteady","montaj fix"],["EV / Filtru","EV -0.3 / -0.7","opțional CPL"]]},
 {id:"sunny",g:2,e:"🏔️",n:"Sunny Snow",r:[
  ["FPS","50 / 60"],["Shutter","1/100s"],["ISO","100 sau Auto 100–400"],
  ["FOV","Wide","Ultra Wide pe selfie stick"],["White Balance","5500K–6000K"],
  ["Stabilizare","RockSteady / HorizonBalancing"],["EV / Filtru","ND16 / ND32","sau EV -0.7 / -1.0 fără ND"]]},
 {id:"fog",g:2,e:"🌫️",n:"Foggy Snow",r:[
  ["FPS","50","25 în furtună"],["Shutter","Auto"],["ISO","Auto 100–800"],
  ["FOV","Wide","Ultra Wide pe selfie stick"],["White Balance","5000K–5500K"],
  ["Stabilizare","RockSteady"],["EV / Filtru","EV -0.3 / 0","fără ND"]]}
];
