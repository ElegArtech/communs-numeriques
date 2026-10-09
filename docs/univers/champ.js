/* Champ : le fond vivant partagé par toutes les pages.
   Des points qui prennent une forme (les trois nuées du commun, un parcours,
   un collier, une grille, une fourche) et qu'une page peut piloter : changer de
   forme, mettre une ancre en avant, filtrer une grille. Aucun module externe. */
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  function bez(a, b, c, d, t) {
    var u = 1 - t;
    return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
            u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]];
  }

  window.Champ = function (o) {
    var cv = o.canvas, ctx = cv.getContext('2d'), stage = o.stage;
    var calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W, H, dpr, petit, L, B, V, Z = [], pts = [], A = [], FK = null, GR = null;
    var forme = o.forme || 'commun', focus = -1, filtre = null, sortie = false, avance = null, LIBRES = o.libres == null ? .2 : o.libres;
    var depuis = performance.now(), fondu = forme === 'commun' ? 1 : 0, horloge = 0;
    var souris = { x: -9999, y: -9999, on: false };
    var COL = o.colonne || [], NA = { commun: 1, parcours: o.nombre || 7, collier: o.nombre || 7, grille: o.cellules || 68, fourche: 9, colonne: COL.length };

    // ── Géométrie ──
    function mesurer() {
      W = innerWidth; H = cv.clientHeight || stage.clientHeight; petit = W < 621;
      var b = o.boite();
      B = { x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2 };
      B.cx = (B.x1 + B.x2) / 2; B.cy = (B.y1 + B.y2) / 2; B.hw = (B.x2 - B.x1) / 2; B.hh = (B.y2 - B.y1) / 2;
      Z = o.calme ? o.calme() : [];
      if (o.venn) V = o.venn();
      else { var d0 = Math.min(B.hh * 2 / 4.6, B.hw * 2 / 4.9); V = { cx: B.cx, cy: B.cy - .289 * d0, d0: d0 }; }
      V.R = V.d0 * 1.42;
      V.F = [[V.cx - V.d0, V.cy - .577 * V.d0], [V.cx + V.d0, V.cy - .577 * V.d0], [V.cx, V.cy + 1.155 * V.d0]];
      L = petit ? 40 : Math.max(46, Math.min(66, W / 23));
    }
    function haute() { return B.hh > B.hw * 1.4; }
    function chemin(u) {
      if (haute()) return [B.cx + B.hw * .42 * Math.sin(u * TAU), B.y1 + 2 * B.hh * (.05 + .9 * u)];
      return [B.x1 + 2 * B.hw * (.08 + .84 * u), B.y2 - 2 * B.hh * (.1 + .8 * u) + B.hh * .16 * Math.sin(u * TAU)];
    }
    function colonne(u) { return [B.cx + B.hw * .16 * Math.sin(u * TAU * 1.5), B.y1 + 2 * B.hh * (.02 + .96 * u)]; }
    function ellipse(k) { var a = -Math.PI / 2 + k * TAU / NA.collier; return [B.cx + Math.cos(a) * B.hw * .74, B.cy + Math.sin(a) * B.hh * .72, a]; }
    function grille() {
      var N = NA.grille, asp = B.hw / Math.max(B.hh, 1), c = Math.max(4, Math.round(Math.sqrt(N * asp))), r = Math.ceil(N / c);
      return { N: N, c: c, r: r, sx: 2 * B.hw / (c - 1), sy: r > 1 ? 2 * B.hh / (r - 1) : 0 };
    }
    function fourche() {
      var P0 = [B.x1 + B.hw * .02, B.cy], P1 = [B.x1 + B.hw * .58, B.cy];
      var E1 = [B.x2 - B.hw * .06, B.cy - B.hh * .72], E2 = [B.x2 - B.hw * .06, B.cy + B.hh * .72];
      var br = function (t, E) { return bez(P1, [P1[0] + B.hw * .5, P1[1]], [E[0] - B.hw * .8, E[1]], E, t); };
      var amas = [];
      [.4, .7, 1].forEach(function (t) { amas.push(br(t, E1)); });
      [.2, .37, .53, .69, .85, 1].forEach(function (t, j) { var q = br(t, E2); amas.push([q[0], q[1] + (j % 2 ? -10 : 10)]); });
      return { P0: P0, P1: P1, E1: E1, E2: E2, br: br, amas: amas };
    }
    function ancres() {
      var k; A = [];
      if (forme === 'parcours') for (k = 0; k < NA.parcours; k++) A.push(chemin(k / (NA.parcours - 1)));
      else if (forme === 'collier') for (k = 0; k < NA.collier; k++) A.push(ellipse(k));
      else if (forme === 'grille') { GR = grille(); for (k = 0; k < GR.N; k++) A.push([B.x1 + (k % GR.c) * GR.sx, B.y1 + ((k / GR.c) | 0) * GR.sy]); }
      else if (forme === 'fourche') { FK = fourche(); A = FK.amas; }
      else if (forme === 'colonne') for (k = 0; k < COL.length; k++) A.push(colonne(COL[k]));
      else A = [[V.cx, V.cy]];
    }

    // ── Les points ──
    function particule(entree) {
      var p = { libre: Math.random() < LIBRES, f: (Math.random() * 3) | 0, a: Math.random() * TAU, o: Math.random(),
        r: Math.random() < .78 ? Math.sqrt(1 - Math.random() * .7) : Math.sqrt(Math.random()) * .7,
        s: (Math.random() < .5 ? -1 : 1) * (.0012 + Math.random() * .0032), ph: Math.random() * TAU,
        u0: Math.random(), sp: .00003 + Math.random() * .00005,
        vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22, z: .7 + Math.random() * 1.1, hi: 0, c: 0 };
      if (entree === 'bords' && !p.libre) {
        var an = Math.random() * TAU, rr = Math.max(W, H) * (.6 + Math.random() * .3);
        p.x = W / 2 + Math.cos(an) * rr; p.y = H / 2 + Math.sin(an) * rr;
      } else { p.x = Math.random() * W; p.y = Math.random() * H; }
      return p;
    }
    function dimensionner(entree) {
      dpr = Math.min(devicePixelRatio || 1, 2);
      mesurer();
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round((petit ? 360 : Math.min(760, Math.max(480, W * H / 1350))) * (o.densite || 1));
      pts.length = Math.min(pts.length, n);
      while (pts.length < n) pts.push(particule(entree));
      for (var i = 0; i < pts.length; i++) pts[i].i = i;
    }
    // Au redimensionnement, le champ se disperse puis se recompose.
    function disperser() { for (var i = 0; i < pts.length; i++) { pts[i].x = Math.random() * W; pts[i].y = Math.random() * H; } }

    function apaisement(x, y) {
      var m = 1;
      for (var z = 0; z < Z.length; z++) {
        var r = Z[z], dx = Math.max(r.x1 - x, 0, x - r.x2), dy = Math.max(r.y1 - y, 0, y - r.y2), d = Math.sqrt(dx * dx + dy * dy);
        m = Math.min(m, d >= 70 ? 1 : .2 + .8 * d / 70);
      }
      return m;
    }

    function pousser(p, tx, ty, direct) {
      if (souris.on) {
        var dx = tx - souris.x, dy = ty - souris.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 150) { var f = (150 - d) / 150 * (direct ? 2.2 : 34); tx += dx / (d || 1) * f; ty += dy / (d || 1) * f; }
      }
      if (direct) { p.x = tx; p.y = ty; } else { p.x += (tx - p.x) * .05; p.y += (ty - p.y) * .05; }
    }

    function viser(p, t) {
      if (sortie) { p.x += (p.x - W / 2) * .09; p.y += (p.y - H / 2) * .09; return; }
      if (p.libre) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20; if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
        pousser(p, p.x, p.y, true); p.hi = 0; return;
      }
      var i = p.i, tx, ty, hi = 0, ak = -1, q, r, f = focus;
      if (forme === 'commun') {
        p.a += p.s; r = V.R * p.r * (1 + .07 * Math.sin(t * .0007 + p.ph));
        tx = V.F[p.f][0] + Math.cos(p.a) * r; ty = V.F[p.f][1] + Math.sin(p.a) * r;
      } else if (forme === 'parcours') {
        var etroit = haute() && B.hw < 200;
        if (i % 5 < 2) { ak = i % NA.parcours; q = A[ak]; p.a += p.s * 1.6; r = (4 + p.o * (petit || etroit ? 9 : 17)) * (ak === f ? 1.9 : 1); tx = q[0] + Math.cos(p.a) * r; ty = q[1] + Math.sin(p.a) * r; hi = avance == null || ak / (NA.parcours - 1) <= avance + .001 ? 2 : 0; }
        else { var uu = (p.u0 + t * p.sp) % 1; q = chemin(uu); tx = q[0] + (haute() ? Math.sin(t * .0016 + p.ph) * (p.o - .5) * 12 : 0); ty = q[1] + (haute() ? 0 : Math.sin(t * .0016 + p.ph) * (p.o - .5) * 16); hi = avance == null ? 1 : uu <= avance ? 2 : 0; }
      } else if (forme === 'collier') {
        if (i % 9 < 5) { ak = i % NA.collier; q = A[ak]; p.a += p.s * 1.3; r = (3 + p.o * Math.min(B.hw, B.hh) * .1) * (ak === f ? 1.8 : 1); tx = q[0] + Math.cos(p.a) * r; ty = q[1] + Math.sin(p.a) * r; hi = 2; }
        else { var fr = (p.u0 + t * p.sp * .5) % 1, an = -Math.PI / 2 + fr * TAU, jr = 1 + (p.o - .5) * .08; tx = B.cx + Math.cos(an) * B.hw * .74 * jr; ty = B.cy + Math.sin(an) * B.hh * .72 * jr; hi = avance == null ? 1 : fr <= avance ? 2 : 0; }
      } else if (forme === 'grille') {
        ak = i % GR.N; q = A[ak];
        if (ak === f) { p.a += p.s * 2; r = 3 + p.o * 13; tx = q[0] + Math.cos(p.a) * r; ty = q[1] + Math.sin(p.a) * r; }
        else { var j = i >= GR.N ? 4 : 1.6; tx = q[0] + Math.sin(t * .0011 + p.ph) * j + (i >= GR.N ? Math.cos(p.ph) * 3 : 0); ty = q[1] + Math.cos(t * .0011 + p.ph) * j + (i >= GR.N ? Math.sin(p.ph) * 3 : 0); }
        hi = filtre ? (filtre.has(ak) ? 2 : 0) : 1;
      } else if (forme === 'colonne') {
        if (i % 3 === 0) { var uc = (p.u0 + t * p.sp) % 1; q = colonne(uc); tx = q[0] + Math.sin(t * .0016 + p.ph) * (p.o - .5) * 8; ty = q[1]; hi = avance == null ? 1 : uc <= avance ? 2 : 0; }
        else { ak = i % COL.length; q = A[ak]; p.a += p.s * 1.5; r = (2 + p.o * 6) * (ak === f ? 2.2 : 1); tx = q[0] + Math.cos(p.a) * r; ty = q[1] + Math.sin(p.a) * r; hi = avance == null || COL[ak] <= avance + .001 ? 2 : 0; }
      } else if (forme === 'fourche') {
        if (i % 3 === 0) {
          var u = (p.u0 + t * p.sp * 1.4) % 1, E = (i % 9) < 3 ? FK.E1 : FK.E2;
          q = u < .3 ? [FK.P0[0] + (FK.P1[0] - FK.P0[0]) * u / .3, FK.P0[1]] : FK.br((u - .3) / .7, E);
          tx = q[0]; ty = q[1] + Math.sin(t * .002 + p.ph) * 3; hi = 1;
        } else { ak = i % 9; q = A[ak]; p.a += p.s * 1.5; r = (3 + p.o * (petit ? 7 : 13)) * (ak === f ? 1.9 : 1); tx = q[0] + Math.cos(p.a) * r; ty = q[1] + Math.sin(p.a) * r; hi = 2; }
      }
      if (f >= 0 && avance == null && forme !== 'grille' && hi === 2 && ak !== f) hi = 1;
      if (ak === f && f >= 0) hi = 2;
      pousser(p, tx, ty, false);
      p.hi = hi; p.ak = ak;
    }

    // ── Dessin, groupé par couleur et intensité ──
    var cases = new Map(), NIV = 12, seaux = [], lots = [], k0;
    for (k0 = 0; k0 < 2 * NIV; k0++) seaux.push([]);
    for (k0 = 0; k0 < 15; k0++) lots.push([]);
    function seau(lime, a) { if (a < .008) return null; return seaux[(lime ? NIV : 0) + Math.min(NIV - 1, Math.ceil(a / .5 * NIV) - 1)]; }

    function image(t, now) {
      fondu += ((forme === 'commun' && !sortie ? 1 : 0) - fondu) * .06;
      ancres();
      ctx.clearRect(0, 0, W, H);
      var i, j, p, q, dx, dy, d2, L2 = L * L, sg;
      if (fondu > .01) {
        // les trois cercles : un voile très léger dans chacun (les recoupements se devinent) et un trait discret
        // fond des cercles très léger ; les recoupements deux à deux un peu plus ; le cœur (les trois) davantage
        ctx.fillStyle = 'rgba(201,242,123,' + (.009 * fondu) + ')';
        for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(V.F[i][0], V.F[i][1], V.R, 0, TAU); ctx.fill(); }
        var paires = [[0, 1], [1, 2], [0, 2]];
        for (i = 0; i < 3; i++) {
          ctx.save(); ctx.beginPath(); ctx.arc(V.F[paires[i][0]][0], V.F[paires[i][0]][1], V.R, 0, TAU); ctx.clip();
          ctx.fillStyle = 'rgba(201,242,123,' + (.022 * fondu) + ')';
          ctx.beginPath(); ctx.arc(V.F[paires[i][1]][0], V.F[paires[i][1]][1], V.R, 0, TAU); ctx.fill(); ctx.restore();
        }
        ctx.save();
        ctx.beginPath(); ctx.arc(V.F[0][0], V.F[0][1], V.R, 0, TAU); ctx.clip();
        ctx.beginPath(); ctx.arc(V.F[1][0], V.F[1][1], V.R, 0, TAU); ctx.clip();
        ctx.fillStyle = 'rgba(201,242,123,' + (.05 * fondu) + ')';
        ctx.beginPath(); ctx.arc(V.F[2][0], V.F[2][1], V.R, 0, TAU); ctx.fill(); ctx.restore();
        ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(236,241,234,' + (.17 * fondu) + ')';
        for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(V.F[i][0], V.F[i][1], V.R, 0, TAU); ctx.stroke(); }
        halo(V.cx, V.cy, V.R * .9, .17 * fondu);
      }
      if (focus >= 0 && A[focus] && !sortie) halo(A[focus][0], A[focus][1], forme === 'grille' ? 46 : 80, .22);
      cases.clear();
      for (i = 0; i < pts.length; i++) {
        p = pts[i]; viser(p, t);
        if (!p.libre && forme === 'commun') {
          var c = 0; for (j = 0; j < 3; j++) { dx = p.x - V.F[j][0]; dy = p.y - V.F[j][1]; if (dx * dx + dy * dy < V.R * V.R * .92) c++; }
          p.c = c; p.hi = c > 1 ? c - 1 : 0;
        }
        p.k = apaisement(p.x, p.y);
        p.gx = (p.x / L) | 0; p.gy = (p.y / L) | 0;
        var key = p.gx * 4096 + p.gy, bk = cases.get(key); if (bk) bk.push(p); else cases.set(key, [p]);
      }
      for (i = 0; i < seaux.length; i++) seaux[i].length = 0;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        for (var ox = -1; ox <= 1; ox++) for (var oy = -1; oy <= 1; oy++) {
          var cel = cases.get((p.gx + ox) * 4096 + p.gy + oy); if (!cel) continue;
          for (j = 0; j < cel.length; j++) {
            q = cel[j]; if (q.i <= p.i) continue;
            dx = p.x - q.x; dy = p.y - q.y; d2 = dx * dx + dy * dy; if (d2 > L2) continue;
            var a = (1 - Math.sqrt(d2) / L) * (p.k < q.k ? p.k : q.k), lime = false, f;
            if (forme === 'commun' && !sortie) {
              if (!p.libre && !q.libre && p.f !== q.f && p.c > 1 && q.c > 1) { lime = true; f = .5; }
              else if (!p.libre && !q.libre && p.f !== q.f) { lime = true; f = .15; }
              else f = p.libre || q.libre ? .08 : .13;
            } else if (p.hi === 2 && q.hi === 2) { lime = true; f = .45; }
            else if (p.hi && q.hi) { lime = true; f = .2; }
            else if (p.hi || q.hi) { lime = true; f = .09; }
            else f = p.libre || q.libre ? .07 : .11;
            sg = seau(lime, a * f); if (sg) sg.push(p.x, p.y, q.x, q.y);
          }
        }
      }
      if (souris.on) for (i = 0; i < pts.length; i++) {
        p = pts[i]; dx = p.x - souris.x; dy = p.y - souris.y; d2 = dx * dx + dy * dy;
        if (d2 < 36100) { sg = seau(true, (1 - Math.sqrt(d2) / 190) * .32 * p.k); if (sg) sg.push(souris.x, souris.y, p.x, p.y); }
      }
      ctx.lineWidth = .7;
      for (i = 0; i < seaux.length; i++) {
        sg = seaux[i]; if (!sg.length) continue;
        ctx.strokeStyle = (i >= NIV ? 'rgba(201,242,123,' : 'rgba(236,241,234,') + (((i % NIV) + 1) / NIV * .5) + ')';
        ctx.beginPath();
        for (j = 0; j < sg.length; j += 4) { ctx.moveTo(sg[j], sg[j + 1]); ctx.lineTo(sg[j + 2], sg[j + 3]); }
        ctx.stroke();
      }
      for (i = 0; i < lots.length; i++) lots[i].length = 0;
      for (i = 0; i < pts.length; i++) {
        p = pts[i]; lots[(p.hi >= 2 ? 2 : p.hi) * 5 + Math.min(4, (p.k * (p.libre ? .7 : 1) * 4.99) | 0)].push(p);
      }
      var teintes = ['236,241,234', '214,240,170', '201,242,123'], opa = [.6, .85, 1];
      for (i = 0; i < lots.length; i++) {
        var lot = lots[i]; if (!lot.length) continue;
        var ti = (i / 5) | 0;
        ctx.fillStyle = 'rgba(' + teintes[ti] + ',' + (opa[ti] * ((i % 5) + 1) / 5) + ')';
        ctx.beginPath();
        for (j = 0; j < lot.length; j++) { p = lot[j]; var rr = ti ? p.z * 1.25 : p.z; ctx.moveTo(p.x + rr, p.y); ctx.arc(p.x, p.y, rr, 0, TAU); }
        ctx.fill();
      }
      if (o.dessin && !sortie) o.dessin(ctx, api, Math.min(1, Math.max(0, (now - depuis - 320) / 650)));
    }
    function halo(x, y, r, a) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(201,242,123,' + a + ')'); g.addColorStop(1, 'rgba(201,242,123,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    function texte(s, x, y, op) {
      op = op || {};
      ctx.font = op.f || 'italic 400 ' + (op.s || 17) + 'px "Instrument Serif", Georgia, serif';
      ctx.textAlign = op.al || 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = '#08130E'; ctx.shadowBlur = 10;
      ctx.fillStyle = op.c || 'rgba(236,241,234,' + (op.a == null ? 1 : op.a) + ')';
      ctx.fillText(s, x, y); ctx.shadowBlur = 0;
    }

    function boucle(now) { horloge = now; image(now, now); requestAnimationFrame(boucle); }
    function figer() { var now = performance.now(); depuis = now - 2000; for (var s = 0; s < 170; s++) image(horloge + s * 16, now); }

    // ── API ──
    var api = {
      texte: texte,
      forme: function (f) { if (f === forme) return; forme = f; focus = -1; filtre = null; depuis = performance.now(); if (calme) figer(); },
      focus: function (k) { if (k === focus) return; focus = k == null ? -1 : k; if (calme) figer(); },
      filtre: function (set) { filtre = set; if (calme) figer(); },
      avance: function (v) { avance = v; },
      ancre: function (k) { return A[k]; },
      ancres: function () { return A; },
      fourche: function () { return FK; },
      boite: function () { return B; },
      venn: function () { return V; },
      petit: function () { return petit; },
      etat: function () { return { forme: forme, focus: focus }; },
      proche: function (x, y) {
        var best = -1, bd = Infinity, rmax = forme === 'grille' ? Math.max(GR.sx, GR.sy) * .6 : forme === 'collier' ? Math.min(B.hw, B.hh) * .2 : forme === 'colonne' ? 14 : 36;
        if (forme === 'commun') return -1;
        for (var k = 0; k < A.length; k++) { var dx = A[k][0] - x, dy = A[k][1] - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = k; } }
        return Math.sqrt(bd) <= rmax ? best : -1;
      },
      mesurer: function () { mesurer(); if (calme) figer(); },
      sortir: function (href) {
        if (calme) { location.href = href; return; }
        sortie = true; document.body.classList.add('leaving');
        setTimeout(function () { location.href = href; }, 620);
      },
      souris: souris
    };

    dimensionner(o.entree || 'hasard');
    addEventListener('resize', function () { dimensionner(); disperser(); if (calme) figer(); });
    if (document.fonts) document.fonts.ready.then(function () { mesurer(); if (calme) figer(); });
    addEventListener('pageshow', function (e) { if (e.persisted) { sortie = false; document.body.classList.remove('leaving'); } });
    addEventListener('pointermove', function (e) { souris.x = e.clientX; souris.y = e.clientY; souris.on = e.pointerType === 'mouse'; });
    document.addEventListener('pointerleave', function () { souris.on = false; });
    if (calme) figer(); else requestAnimationFrame(boucle);
    return api;
  };

  // Curseur personnalisé, commun à toutes les pages (souris uniquement)
  window.Curseur = function () {
    var cur = document.getElementById('cur');
    if (!cur || !matchMedia('(pointer: fine)').matches) return { grand: function () {} };
    addEventListener('pointermove', function (e) { cur.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; cur.classList.add('on'); });
    document.addEventListener('pointerleave', function () { cur.classList.remove('on'); });
    return { grand: function (v) { cur.classList.toggle('big', !!v); } };
  };

  // Liens internes : on sort en dispersant le champ, plutôt que par une coupure
  window.Sorties = function (champ, selecteur) {
    document.querySelectorAll(selecteur || 'a[data-sortie]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button || a.target === '_blank') return;
        e.preventDefault(); champ.sortir(a.href);
      });
    });
  };
})();

// Typographie française pour les textes injectés par script
window.Typo = function (s) { return String(s).replace(/ ([;:!?»])/g, ' $1').replace(/« /g, '« '); };

// Relie une liste, une carte et le champ : survoler l'un met l'autre en avant
window.Synchro = function (o) {
  var courant = null, cur = window.Curseur(), survol = -1;
  function choisir(k) {
    if (k === courant) return; courant = k;
    o.champ.focus(k == null ? -1 : k);
    (o.liens || []).forEach(function (l, i) { l.classList.toggle('actif', i === k); });
    if (!o.carte) return;
    o.carte.classList.add('change');
    clearTimeout(o.carte._t);
    o.carte._t = setTimeout(function () { o.carte.innerHTML = o.rendre(k); o.carte.classList.remove('change'); window.Sorties(o.champ, '#' + o.carte.id + ' a[data-sortie]'); }, 170);
  }
  (o.liens || []).forEach(function (l, i) {
    l.addEventListener('mouseenter', function () { choisir(i); });
    l.addEventListener('focus', function () { choisir(i); });
  });
  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || e.target.closest('.propos,.top,.carte')) { if (survol >= 0) { survol = -1; document.body.classList.remove('cliquable'); cur.grand(false); } return; }
    var k = o.champ.proche(e.clientX, e.clientY); survol = k;
    document.body.classList.toggle('cliquable', k >= 0 && !!o.lien && !!o.lien(k)); cur.grand(k >= 0);
    if (k >= 0) choisir(k); else if (o.relacher) choisir(o.defaut == null ? null : o.defaut);
  });
  o.stage.addEventListener('click', function (e) {
    if (survol >= 0 && o.lien && !e.target.closest('a,button,input,label')) { var h = o.lien(survol); if (h) o.champ.sortir(h); }
  });
  return { choisir: choisir, courant: function () { return courant; } };
};

// Fil discret entre l'ancre mise en avant et la carte
window.Fil = function (ctx, champ, carte, a) {
  var f = champ.etat().focus; if (f < 0 || innerWidth < 861 || !carte) return;
  var p = champ.ancre(f); if (!p) return;
  var r = carte.getBoundingClientRect();
  var x = Math.min(Math.max(p[0], r.left), r.right), y = Math.min(Math.max(p[1], r.top), r.bottom);
  var dx = x - p[0], dy = y - p[1], d = Math.sqrt(dx * dx + dy * dy); if (d < 20) return;
  ctx.save(); ctx.strokeStyle = 'rgba(201,242,123,' + (.45 * a) + ')'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
  ctx.beginPath(); ctx.moveTo(p[0] + dx / d * 14, p[1] + dy / d * 14); ctx.lineTo(x, y); ctx.stroke();
  ctx.setLineDash([]); ctx.beginPath(); ctx.arc(p[0], p[1], 12, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
};
