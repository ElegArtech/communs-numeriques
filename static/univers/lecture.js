/* Lecture — relie le texte au champ de la marge.
   La page fournit window.LECTURE : forme, rang du texte, liens, étiquettes. */
(function () {
  'use strict';
  var L = window.LECTURE, D = window.DONNEES;
  var scene = document.getElementById('scene'), texte = document.getElementById('texte'), corps = document.getElementById('corps');

  var champ = Champ({
    canvas: document.getElementById('c'), stage: document.body, forme: L.forme, entree: 'bords', libres: .07, densite: .7, colonne: L.colonne, cellules: L.cellules, nombre: L.liens && L.liens.length,
    boite: function () {
      var r = scene.getBoundingClientRect();
      if (r.width < 10) return { x1: innerWidth * .15, y1: innerHeight * .2, x2: innerWidth * .85, y2: innerHeight * .8 };
      // le collier garde un cadre presque carré, centré dans la marge
      if (L.forme === 'collier') { var w = r.right - r.left - 40, cy = r.top + (r.bottom - r.top) * .42; return { x1: r.left + 20, y1: cy - w * .58, x2: r.right - 20, y2: cy + w * .58 }; }
      return { x1: r.left + 8, y1: r.top + 14, x2: r.right - 8, y2: r.bottom - 30 };
    },
    calme: function () { var r = texte.getBoundingClientRect(); return [{ x1: r.left - 24, y1: -1e5, x2: r.right + 24, y2: 1e5 }]; },
    dessin: function (ctx, api, a) {
      if (innerWidth < 861) return; // sur téléphone, le champ n'est qu'un fond : pas d'étiquettes
      var Q = api.ancres(), f = api.etat().focus, k, x, y;
      var lime = 'rgba(201,242,123,' + a + ')', pale = 'rgba(157,176,164,' + (a * .8) + ')';
      if (L.forme === 'parcours') {
        for (k = 0; k < Q.length; k++) api.texte(String(k + 1).padStart(2, '0'), Q[k][0] - 22, Q[k][1], { f: '600 11px "Instrument Sans", sans-serif', c: k <= L.rang ? lime : pale, al: 'right' });
      } else if (L.forme === 'colonne') {
        (L.groupes || []).forEach(function (g) { var q = Q[g.i]; if (q) api.texte(g.label, q[0] - 18, q[1], { f: '600 10.5px "Instrument Sans", sans-serif', c: g.i <= L.rang ? lime : pale, al: 'right' }); });
      }
      // l'élément survolé dans la marge : son titre, à côté du point
      if (f >= 0 && f !== L.rang && Q[f]) api.texte(L.etiquettes[f], Q[f][0] + 18, Q[f][1], { s: 16, a: a, al: 'left' });
      if (L.forme === 'collier' && Q[L.rang]) { var B = api.boite(), dx = Q[L.rang][0] - B.cx, dy = Q[L.rang][1] - B.cy, d = Math.sqrt(dx * dx + dy * dy) || 1; api.texte(L.etiquettes[L.rang], Q[L.rang][0] + dx / d * 34, Q[L.rang][1] + dy / d * 30, { s: 16, c: lime }); }
    }
  });
  champ.focus(L.rang);
  var suivi = L.forme === 'parcours' || L.forme === 'collier' || L.forme === 'colonne';

  // la marge est cliquable : chaque point mène à son texte
  if (suivi) Synchro({ champ: champ, stage: document.body, relacher: true, defaut: L.rang, lien: function (k) { return k === L.rang ? null : L.liens[k]; } });

  // glossaire de A à Z : le mot lu s'allume dans la grille ; un point de la grille mène à son mot
  if (L.forme === 'grille') {
    var entrees = [].slice.call(document.querySelectorAll('.entree')), courant = -1, survol = -1, cur = Curseur();
    var lu = function () { var k = -1; entrees.forEach(function (e, i) { if (e.getBoundingClientRect().top < innerHeight * .42) k = i; }); return k; };
    var marquer = function () { courant = lu(); entrees.forEach(function (e, i) { e.classList.toggle('ici', i === courant); }); if (survol < 0) champ.focus(courant); };
    addEventListener('scroll', marquer, { passive: true }); marquer();
    addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var k = champ.proche(e.clientX, e.clientY), en = e.target.closest && e.target.closest('.entree');
      survol = k; document.body.classList.toggle('cliquable', k >= 0); cur.grand(k >= 0);
      champ.focus(k >= 0 ? k : en ? +en.dataset.i : courant);
    });
    document.body.addEventListener('click', function (e) {
      if (survol < 0 || e.target.closest('a,button')) return;
      var cible = document.querySelector('.entree[data-i="' + survol + '"]');
      cible.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      history.replaceState(null, '', '#' + cible.id);
    });
  }
  // barre de progression : la largeur suit la lecture (et reste lisible sans scroll-timeline)
  var barre = document.querySelector('#progres span');
  function progresser() {
    var max = document.documentElement.scrollHeight - innerHeight, v = max > 0 ? Math.min(100, scrollY / max * 100) : 100;
    if (barre) { barre.style.transform = 'scaleX(' + (v / 100) + ')'; barre.dataset.valeur = v.toFixed(0); }
  }
  addEventListener('scroll', progresser, { passive: true }); progresser();
  var reMesure = 0;
  addEventListener('scroll', function () {
    if (!reMesure) reMesure = requestAnimationFrame(function () { reMesure = 0; champ.mesurer(); if (suivi) avancer(); });
  }, { passive: true });

  // le chemin s'allume au fil de la lecture
  function avancer() {
    var r = corps.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight * .6))), v;
    if (L.forme === 'parcours') v = (L.rang + p) / (L.liens.length - 1);
    else if (L.forme === 'collier') v = (L.rang + p) / L.liens.length;
    else { var a = L.colonne[L.rang], b = L.colonne[L.rang + 1] == null ? 1 : L.colonne[L.rang + 1]; v = a + (b - a) * p; }
    champ.avance(Math.min(1, v));
  }
  if (suivi) avancer();

  // plan de la page : la section en cours est marquée
  var liensPlan = [].slice.call(document.querySelectorAll('.plan a'));
  var titres = liensPlan.map(function (a) { return document.getElementById(a.hash.slice(1)); });
  function ici() {
    var k = -1; titres.forEach(function (t, i) { if (t && t.getBoundingClientRect().top < innerHeight * .35) k = i; });
    liensPlan.forEach(function (a, i) { a.classList.toggle('ici', i === k); });
  }
  addEventListener('scroll', ici, { passive: true }); ici();

  // bulle de glossaire : la définition sans quitter le texte
  var bulle = document.getElementById('bulle');
  corps.querySelectorAll('a[href^="/glossaire/a-z/#"]').forEach(function (a) {
    if (a.closest('#corps > div + div')) return;
    var t = D.termes.find(function (x) { return x.id === a.hash.slice(1); }); if (!t) return;
    a.addEventListener('mouseenter', function () {
      bulle.innerHTML = '<b>' + Typo(t.t) + '</b><span>' + Typo(t.d) + '</span>';
      var r = a.getBoundingClientRect(), w = 340, x = Math.min(Math.max(12, r.left), innerWidth - w - 12);
      var y = r.bottom + 10; bulle.style.left = x + 'px'; bulle.style.top = y + 'px';
      bulle.classList.add('on');
      var h = bulle.offsetHeight; if (y + h > innerHeight - 12) bulle.style.top = (r.top - h - 10) + 'px';
    });
    a.addEventListener('mouseleave', function () { bulle.classList.remove('on'); });
  });

  // lecture claire : le choix vaut pour la page en cours, rien n'est enregistré
  var bouton = document.getElementById('clair');
  if (bouton) bouton.addEventListener('click', function () {
    var on = document.body.classList.toggle('clair');
    bouton.querySelector('span').textContent = on ? 'Lecture sombre' : 'Lecture claire';
  });

  Sorties(champ, 'a[data-sortie], #corps a[href^="/"]:not([href*="#"]):not([href$=".pdf"])');
})();
