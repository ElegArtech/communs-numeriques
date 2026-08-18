/* Remplace le runtime Claude Design (React + ReactDOM + Babel, ~3 Mo depuis un CDN)
   par l'équivalent en JavaScript natif. Aucune dépendance, aucune requête réseau.
   Le site reste entièrement lisible si ce script ne s'exécute pas. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ref = function (name) { return document.querySelector('[data-ref="' + name + '"]'); };

  /* ── Barre de progression de lecture (articles) ───────────────────────── */
  var bar = ref('barRef');
  if (bar) {
    var onScroll = function () {
      var e = document.documentElement;
      var p = e.scrollTop / Math.max(1, e.scrollHeight - e.clientHeight);
      bar.style.width = (p * 100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  /* ── Motif de points animé (couverture d'accueil) ─────────────────────── */
  var canvas = ref('dotsRef');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var gap = parseInt(canvas.getAttribute('data-densite') || '30', 10);
    var animate = canvas.getAttribute('data-anime') !== 'false' && !reduced;
    var w = 0, h = 0, raf = 0;

    var resize = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.parentElement.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    var draw = function (t) {
      ctx.clearRect(0, 0, w, h);
      var cx = w * 0.82, cy = h * 0.18;
      for (var x = gap / 2; x < w; x += gap) {
        for (var y = gap / 2; y < h; y += gap) {
          var d = Math.hypot(x - cx, y - cy);
          var k = Math.max(0, Math.sin(d * 0.015 - t * 0.001));
          ctx.beginPath();
          ctx.arc(x, y, 1.0 + 1.4 * k, 0, 6.2832);
          ctx.fillStyle = 'rgba(18,117,82,' + (0.05 + 0.22 * k).toFixed(3) + ')';
          ctx.fill();
        }
      }
      if (animate) raf = requestAnimationFrame(draw);
    };

    resize();
    if (window.ResizeObserver) {
      new ResizeObserver(function () { resize(); if (!animate) draw(600); })
        .observe(canvas.parentElement);
    } else {
      window.addEventListener('resize', function () { resize(); if (!animate) draw(600); });
    }
    if (animate) raf = requestAnimationFrame(draw); else draw(600);
  }

  /* ── Compteurs animés (accueil) ───────────────────────────────────────── */
  /* Les valeurs finales sont déjà dans le HTML : sans JS, rien ne manque. */
  if (!reduced && window.IntersectionObserver) {
    var counters = [];
    ['statEntretiens', 'statCas', 'statCadres', 'statVoies'].forEach(function (n) {
      var el = ref(n);
      if (el) counters.push([el, parseInt(el.textContent.trim(), 10)]);
    });
    if (counters.length) {
      var done = false;
      var io = new IntersectionObserver(function (entries) {
        if (done || !entries.some(function (e) { return e.isIntersecting; })) return;
        done = true;
        io.disconnect();
        var start = performance.now(), dur = 1400;
        var tick = function (now) {
          var p = Math.min(1, (now - start) / dur);
          var ease = 1 - Math.pow(1 - p, 3);
          counters.forEach(function (c) { c[0].textContent = String(Math.round(c[1] * ease)); });
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, { threshold: 0.4 });
      io.observe(counters[0][0]);
    }
  }

  /* ── Filtre du glossaire ──────────────────────────────────────────────── */
  var filter = ref('filterRef');
  if (filter) {
    var empty = ref('emptyRef');
    var norm = function (s) {
      return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };
    var apply = function () {
      var q = norm(filter.value.trim());
      var visible = 0;
      document.querySelectorAll('[data-glossterm]').forEach(function (el) {
        var hay = norm(el.getAttribute('data-glossterm') + ' ' + el.textContent);
        var show = !q || hay.indexOf(q) !== -1;
        el.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      document.querySelectorAll('[data-glossgroup]').forEach(function (g) {
        var any = Array.prototype.some.call(
          g.querySelectorAll('[data-glossterm]'),
          function (el) { return el.style.display !== 'none'; }
        );
        g.style.display = any ? '' : 'none';
      });
      if (empty) empty.style.display = visible ? 'none' : 'block';
    };
    filter.addEventListener('input', apply);
    if (filter.value) apply();
  }
})();
