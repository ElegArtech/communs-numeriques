#!/usr/bin/env node
/* Univers — dernière étape du build.
 *
 *   compile.mjs + memoire.mjs   →  pages de contenu dans docs/ (textes, métadonnées)
 *   univers.mjs                 →  les mêmes adresses, dans le design du site
 *
 * Les textes restent rédigés dans src/*.dc.html et dans le mémoire ; cette étape
 * relit les pages compilées, en garde l'en-tête (titre, description, Open Graph,
 * JSON-LD, robots) et le contenu, et les réhabille : accueil plein écran, pages
 * de section où le champ prend la forme de la section, pages de lecture où il se
 * retire dans la marge. Le moteur et les styles sont dans static/univers/,
 * la page d'accueil dans src/univers/accueil.html. */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages as PAGES, site } from './site.config.mjs';
import { chapitres, parties } from './memoire.config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const lire = (route) => readFileSync(join(DOCS, route, 'index.html'), 'utf8');
const ecrire = (route, html) => {
  const f = route.endsWith('.html') ? join(DOCS, route) : join(DOCS, route, 'index.html');
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, typographie(html));
};
const nettoyer = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#39;|&rsquo;/g, '’').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const slugifier = (s) => nettoyer(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// Typographie française dans les nœuds texte : espace insécable avant ; : ! ? et dans les guillemets.
function typographie(h) {
  return h.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<pre[\s\S]*?<\/pre>|<[^>]+>)/).map((x, i) => (i % 2 ? x : x
    .replace(/ ([;:!?])/g, ' $1').replace(/« /g, '« ').replace(/ »/g, ' »'))).join('');
}

/* ── 1. En-têtes conservés ─────────────────────────────────────────────────── */
// Tout l'en-tête compilé est gardé (métadonnées, JSON-LD), sauf les styles et scripts de l'ancien rendu.
function tete(route, remplacer = {}) {
  let h = lire(route).match(/<head>([\s\S]*?)<\/head>/)[1];
  h = h.replace(/<style[\s\S]*?<\/style>/g, '')
       .replace(/<script(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/g, '')
       .replace(/<link[^>]*rel="(stylesheet|preload|modulepreload)"[^>]*>\s*/g, '')
       .replace(/<meta name="theme-color"[^>]*>/, '<meta name="theme-color" content="#08130E">');
  for (const [a, b] of Object.entries(remplacer)) h = h.split(a).join(b);
  return h.replace(/\n\s*\n+/g, '\n');
}
const feuilles = (lecture) => `<link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="/univers/univers.css">${lecture ? '<link rel="stylesheet" href="/univers/lecture.css">' : ''}`;

/* ── 2. Données de l'univers, tirées des pages compilées ───────────────────── */
const COURT = {
  'un-commun-avant-le-numerique': 'Avant le numérique', 'ce-que-change-le-numerique': 'Ce que change le numérique',
  'libre-open-source-commun': 'Libre, open source, commun', 'qui-decide': 'Qui décide ?', 'qui-paie': 'Qui paie ?',
  'trois-communs-trois-modeles': 'Trois façons de tenir', 'et-ladministration': "Et l'administration ?",
};
// Les neuf initiatives étudiées, d'après l'analyse « Neuf initiatives françaises à la loupe ».
const CAS = [
  ['La Suite Numérique', 'National · Logiciels', 0, "Portée par la DINUM depuis 2023 : des outils collaboratifs libres (Tchap, Docs…) en alternative souveraine aux suites américaines."],
  ['CAFData', 'National · Données', 0, "Le portail open data de la CNAF : plus de 1 700 séries statistiques sur les prestations familiales, réutilisables sans restriction."],
  ['CNAM — Open First', 'National · Politique logicielle', 0, "Depuis 2017, le schéma directeur de l'Assurance Maladie privilégie standards ouverts et logiciels libres pour s'affranchir des GAFAM."],
  ['ADULLACT', 'Inter-organisations · Logiciels mutualisés', 1, "Fondée en 2002 autour d'un slogan devenu doctrine : « L'argent public ne doit payer qu'une fois ». Forge et logiciels métiers pour les collectivités."],
  ['SITIV', 'Territorial · Opérateur mutualisé', 1, "Syndicat intercommunal lyonnais : son programme « Territoire Numérique Ouvert » équipe plus de 40 collectivités en services libres."],
  ["Ville d'Échirolles", 'Territorial · Politique publique', 1, "Depuis 2021, le schéma directeur « Échirolles Numérique Libre » planifie la migration quasi complète du SI municipal vers le libre."],
  ['Ville de Brest', 'Territorial · Communs de connaissance', 1, "Dès les années 1990 : points d'accès publics à Internet, plateforme @-brest, wiki local — le numérique comme outil d'inclusion et de lien social."],
  ['Fabrique des Mobilités', 'Sectoriel · Données & méthode', 1, "Née en 2015 avec l'appui de l'ADEME : une structure hybride qui fait coopérer institutions, entreprises et citoyens autour de la mobilité durable."],
  ['France Numérique Libre', 'Inter-organisations · Communauté de pratique', 1, "Lancé en 2025 : un réseau ascendant de responsables informatiques publics engagés dans le libre, né d'un collectif local grenoblois."],
].map(([nom, type, voie, texte]) => ({ nom, type, voie, texte }));
const VOIES = [
  { nom: "L'appropriation", qui: "L'administration pilote", texte: "Elle prend la main sur la ressource : elle pilote, finance, fixe les priorités. Le code est ouvert, mais la gouvernance reste encadrée par l'institution." },
  { nom: 'La relation', qui: "L'administration contribue", texte: "Elle n'absorbe pas le commun : elle institutionnalise sa coopération avec lui, en contributrice, partenaire et garante de l'écosystème." },
];
const NOMBRES = { 5: 'Cinq', 6: 'Six', 7: 'Sept', 8: 'Huit', 9: 'Neuf', 10: 'Dix' };
const minutes = (html) => +((nettoyer(html).match(/(\d+)\s*min de lecture/i) || [])[1] || 0);
const slugDe = (route) => route.split('/').filter(Boolean).pop();

const NOTIONS = PAGES.filter((p) => p.kind === 'notion').map((p) => {
  const h = lire(p.route), slug = slugDe(p.route);
  const reponse = (h.match(/En une phrase<\/span>\s*<p[^>]*>([\s\S]*?)<\/p>/) || [])[1];
  return { slug, section: p.section, min: minutes(h), question: nettoyer(h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]),
           court: COURT[slug] || nettoyer(h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]), reponse: reponse ? nettoyer(reponse) : '' };
});
const ANALYSES = PAGES.filter((p) => /^\/articles\/[^/]+\/$/.test(p.route)).map((p) => {
  const h = lire(p.route), apres = h.slice(h.indexOf('</h1>'));
  return { slug: slugDe(p.route), theme: p.section, min: minutes(h), titre: nettoyer(h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]),
           chapo: nettoyer(apres.match(/<p[^>]*>([\s\S]*?)<\/p>/)[1]) };
});
const TERMES = [...lire('glossaire').matchAll(/<p id="g-([^"]+)" data-glossterm="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g)].map(([, id, k, inner]) => {
  const t = nettoyer((inner.match(/<(b|strong|dfn|span)[^>]*>([\s\S]*?)<\/\1>/) || [, , ''])[2]);
  let d = nettoyer(inner).slice(t.length).replace(/^[\s:—–.-]+/, '');
  return { id, t, k, d: d.charAt(0).toUpperCase() + d.slice(1) };
});
const DONNEES = { notions: NOTIONS, analyses: ANALYSES, termes: TERMES, cas: CAS, voies: VOIES };
if (!NOTIONS.length || !ANALYSES.length || !TERMES.length) throw new Error('Univers : notions, analyses ou glossaire introuvables dans docs/');

/* ── 3. Corps des pages de lecture, relus avant d'être remplacés ───────────── */
function rhabiller(src) {
  let c = (src.match(/<article[^>]*>([\s\S]*?)<\/article>/) || src.match(/<main[^>]*>([\s\S]*?)<\/main>/))[1];
  c = c.replace(/<span style="color:#5A685F">\[(ENT-[^\]]*)\]<\/span>/g, '<span class="ref ref--ent" title="Entretien — retranscription confidentielle">$1</span>')
       .replace(/<span style="color:#5A685F">(\[[^\]]*\])<\/span>/g, '<span class="ref">$1</span>');
  c = c.split(/(<svg[\s\S]*?<\/svg>)/).map((x, i) => (i % 2 ? x : x.replace(/\s(style|class|style-hover)="[^"]*"/g, ''))).join('');
  c = c.replace(/href="\/glossaire\/#g-([a-z0-9-]+)"/g, 'href="/glossaire/a-z/#$1"');
  c = c.replace(/<li>\s*<span>[—•]<\/span>\s*/g, '<li>');   // la puce du texte d'origine, en double avec celle de la liste
  c = c.replace(/(<h2[^>]*>)<span>(§[^<]*)<\/span>/g, '$1<span class="num">$2</span>');
  c = c.replace(/<p>\s*<span>([A-ZÀ-Ý])<\/span>/, '<p><span class="lettrine">$1</span>');
  const niveau = /<h2[\s>]/.test(c) ? '2' : '3';
  const plan = [];
  c = c.replace(/<h([234])([^>]*)>([\s\S]*?)<\/h\1>/g, (m, n, attrs, inner) => {
    let id = (attrs.match(/id="([^"]+)"/) || [])[1];
    const t = nettoyer(inner.replace(/<span[^>]*aria-hidden[^>]*>[\s\S]*?<\/span>/g, '')).replace(/^§\s*\d+\s*/, '');
    if (!id) { id = slugifier(t); attrs += ` id="${id}"`; }
    if (n === niveau) plan.push({ id, t: t.replace(/^(\d+\.)+\s*/, '') });
    return `<h${n}${attrs}>${inner}</h${n}>`;
  });
  return { corps: c, plan };
}
const SOURCES = {};
for (const n of NOTIONS) SOURCES['/comprendre/' + n.slug + '/'] = rhabiller(lire('comprendre/' + n.slug));
for (const a of ANALYSES) SOURCES['/articles/' + a.slug + '/'] = rhabiller(lire('articles/' + a.slug));
for (const c of chapitres) SOURCES['/memoire/' + c.slug + '/'] = Object.assign(rhabiller(lire('memoire/' + c.slug)), { h1: nettoyer(lire('memoire/' + c.slug).match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]) });
for (const r of ['mentions-legales', 'confidentialite']) {
  const h = lire(r), intro = h.slice(h.indexOf('</h1>')).match(/<p[^>]*>([\s\S]*?)<\/p>/);
  SOURCES['/' + r + '/'] = Object.assign(rhabiller(h), { h1: nettoyer(h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]), intro: intro ? nettoyer(intro[1]) : '' });
}
const TETES = {};
for (const r of ['/', '/comprendre/', '/articles/', '/glossaire/', '/la-recherche/', '/memoire/', '/a-propos/', ...Object.keys(SOURCES)]) TETES[r] = tete(r);
TETES['/glossaire/a-z/'] = tete('/glossaire/', { 'https://communs-numeriques.fr/glossaire/': 'https://communs-numeriques.fr/glossaire/a-z/', 'Glossaire — ': 'Glossaire de A à Z — ' });
const tete404 = readFileSync(join(DOCS, '404.html'), 'utf8').match(/<head>([\s\S]*?)<\/head>/)[1]
  .replace(/<style[\s\S]*?<\/style>/g, '').replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '').replace(/<meta name="theme-color"[^>]*>/, '<meta name="theme-color" content="#08130E">');

/* ── 4. Gabarit commun ─────────────────────────────────────────────────────── */
const ICONES = {
  comprendre: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M2.5 13.5C7 13.5 6 2.5 13.5 2.5"/><circle cx="2.5" cy="13.5" r="1.5" fill="currentColor"/><circle cx="7.6" cy="8" r="1.5" fill="currentColor"/><circle cx="13.5" cy="2.5" r="1.5" fill="currentColor"/></svg>',
  analyses: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="8" cy="2.5" r="1.5"/><circle cx="13.2" cy="6.3" r="1.5"/><circle cx="11.2" cy="12.5" r="1.5"/><circle cx="4.8" cy="12.5" r="1.5"/><circle cx="2.8" cy="6.3" r="1.5"/></svg>',
  glossaire: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="3" cy="3" r="1.4"/><circle cx="8" cy="3" r="1.4"/><circle cx="13" cy="3" r="1.4"/><circle cx="3" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="13" cy="8" r="1.4"/><circle cx="3" cy="13" r="1.4"/><circle cx="8" cy="13" r="1.4"/><circle cx="13" cy="13" r="1.4"/></svg>',
  recherche: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M1.5 8H6C9 8 9 3 14 3M6 8C9 8 9 13 14 13"/><circle cx="14" cy="3" r="1.5" fill="currentColor"/><circle cx="14" cy="13" r="1.5" fill="currentColor"/></svg>',
  apropos: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M8 7.2V11.5M8 4.6v.1"/></svg>',
};
function entete(courant) {
  const c = (k) => (k === courant ? ' aria-current="page"' : '');
  return `<header class="top">
    <a class="brand" href="/" data-sortie aria-label="Les Communs Numériques — accueil"><svg viewBox="0 0 22 22" aria-hidden="true"><circle cx="7" cy="8" r="5.2" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="15" cy="8" r="5.2" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="11" cy="14.5" r="5.2" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="11" cy="10.4" r="1.7" fill="#C9F27B"/></svg><span class="nom">Les Communs Numériques</span></a>
    <nav class="sections" aria-label="Sections">
      <a href="/comprendre/" data-sortie${c('comprendre')}>${ICONES.comprendre}<span>Comprendre</span></a>
      <a href="/articles/" data-sortie${c('analyses')}>${ICONES.analyses}<span>Analyses</span></a>
      <a href="/glossaire/" data-sortie${c('glossaire')}>${ICONES.glossaire}<span>Glossaire</span></a>
      <a href="/la-recherche/" data-sortie${c('recherche')}>${ICONES.recherche}<span>Recherche</span></a>
      <i class="sep" aria-hidden="true"></i>
      <a href="/a-propos/" data-sortie${c('apropos')}>${ICONES.apropos}<span>À propos</span></a>
    </nav>
  </header>`;
}
const SCRIPTS = '<script src="/univers/donnees.js"></script><script src="/univers/champ.js"></script>';

function section({ route, courant, style, corps, script }) {
  return `<!DOCTYPE html>
<html lang="fr"><head>${TETES[route]}${feuilles(false)}
${style}
</head>
<body>
<div class="stage" id="stage">
  <div class="bg" aria-hidden="true"></div>
  <canvas class="champ" id="c" aria-hidden="true"></canvas>
  <div class="grain" aria-hidden="true"></div>
  ${entete(courant)}
${corps}
</div>
<div class="cur" id="cur" aria-hidden="true"></div>
<div class="veil" aria-hidden="true"></div>
${SCRIPTS}
<script>
${script}
</script>
</body></html>`;
}

/* ── 5. Pages de section ───────────────────────────────────────────────────── */
const n0 = NOTIONS[0];
const pageComprendre = section({
  route: '/comprendre/', courant: 'comprendre',
  style: '<style>#carte{right:7%;bottom:9%}</style>',
  corps: `  <main class="vue">
    <section class="propos" id="propos">
      <p class="kicker"><b>01</b> Comprendre</p>
      <h1>${NOMBRES[NOTIONS.length] || NOTIONS.length} questions, <em>dans l'ordre.</em></h1>
      <p class="chapo">Aucun prérequis. Chaque notion répond dès sa première phrase, puis prend quatre à six minutes pour l'expliquer. Survolez une station pour lire la réponse courte.</p>
      <ol class="liste" id="liste">${NOTIONS.map((n, i) => `<li><a href="/comprendre/${n.slug}/" data-sortie><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${e(n.question)}</span><span class="m">${n.min} min</span></a></li>`).join('')}</ol>
      <div class="actions"><a class="btn plein" href="/comprendre/${n0.slug}/" data-sortie>Commencer par la question 01 <span aria-hidden="true">→</span></a></div>
    </section>
    <section class="scene" id="scene" aria-label="Le parcours, dessiné par le champ">
      <article class="carte" id="carte" aria-live="polite"><p class="sur">Question 01 · ${n0.min} min · ${e(n0.section)}</p><h2>${e(n0.question)}</h2><p>${e(n0.reponse)}</p><a class="lien" href="/comprendre/${n0.slug}/" data-sortie>Lire la notion →</a></article>
    </section>
  </main>`,
  script: `(function () {
  var N = DONNEES.notions, scene = document.getElementById('scene'), propos = document.getElementById('propos'), carte = document.getElementById('carte');
  var champ = Champ({
    canvas: document.getElementById('c'), stage: document.getElementById('stage'), forme: 'parcours', entree: 'bords', nombre: N.length,
    boite: function () { var r = scene.getBoundingClientRect(); return innerWidth < 861 ? { x1: r.left + 24, y1: r.top + 34, x2: r.right - 24, y2: r.bottom - 16 } : { x1: r.left + 10, y1: r.top + 50, x2: r.right - 90, y2: r.bottom - 60 }; },
    calme: function () { var r = propos.getBoundingClientRect(); return [{ x1: r.left, y1: r.top, x2: r.right - 40, y2: r.bottom }]; },
    dessin: function (ctx, api, a) {
      var A = api.ancres(), f = api.etat().focus, petit = api.petit();
      for (var k = 0; k < A.length; k++) {
        api.texte(String(k + 1).padStart(2, '0'), A[k][0], A[k][1] - (petit ? 18 : 30), { f: '600 11px "Instrument Sans", sans-serif', c: k === f ? 'rgba(201,242,123,' + a + ')' : 'rgba(157,176,164,' + (a * .8) + ')' });
        if (!petit) api.texte(Typo(N[k].court), A[k][0] + (k % 2 ? 22 : -22), A[k][1] + 4, { a: (k === f ? 1 : .5) * a, s: 16, al: k % 2 ? 'left' : 'right' });
      }
      Fil(ctx, api, carte, a);
    }
  });
  Synchro({
    champ: champ, stage: document.getElementById('stage'), carte: carte, defaut: 0,
    liens: [].slice.call(document.querySelectorAll('#liste a')),
    lien: function (k) { return '/comprendre/' + N[k].slug + '/'; },
    rendre: function (k) { var n = N[k]; return '<p class="sur">Question 0' + (k + 1) + ' · ' + n.min + ' min · ' + n.section + '</p><h2>' + Typo(n.question) + '</h2><p>' + Typo(n.reponse) + '</p><a class="lien" href="/comprendre/' + n.slug + '/" data-sortie>Lire la notion →</a>'; }
  }).choisir(0);
  Sorties(champ);
})();`,
});

const aD = ANALYSES[ANALYSES.length - 1];
const pageAnalyses = section({
  route: '/articles/', courant: 'analyses',
  style: '<style>#carte{transform:translate(-50%,-50%);width:auto}#carte.change{transform:translate(-50%,calc(-50% + 6px))}#carte p:not(.sur){display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden}.liste a{grid-template-columns:30px 1fr auto}.liste .t{font-size:clamp(17px,1.3vw,20px)}@media (prefers-reduced-motion:no-preference){#carte{animation:none}}</style>',
  corps: `  <main class="vue">
    <section class="propos" id="propos">
      <p class="kicker"><b>02</b> Analyses</p>
      <h1>Ce que les communs <em>produisent.</em></h1>
      <p class="chapo">Des analyses sourcées de huit à dix minutes, entre littérature académique et terrain. Une série ouverte, qui s'enrichit.</p>
      <ol class="liste" id="liste">${ANALYSES.map((a, i) => `<li><a href="/articles/${a.slug}/" data-sortie><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${e(a.titre)}</span><span class="m">${a.min} min</span></a></li>`).join('')}</ol>
    </section>
    <section class="scene" id="scene" aria-label="Les analyses, en collier">
      <article class="carte" id="carte" aria-live="polite"><p class="sur">Analyse ${String(ANALYSES.length).padStart(2, '0')} · ${e(aD.theme)} · ${aD.min} min</p><h2>${e(aD.titre)}</h2><p>${e(aD.chapo)}</p><a class="lien" href="/articles/${aD.slug}/" data-sortie>Lire l'analyse →</a></article>
    </section>
  </main>`,
  script: `(function () {
  var A = DONNEES.analyses, scene = document.getElementById('scene'), propos = document.getElementById('propos'), carte = document.getElementById('carte');
  function boite() { var r = scene.getBoundingClientRect(); return innerWidth < 861 ? { x1: r.left + 40, y1: r.top + 40, x2: r.right - 40, y2: r.bottom - 30 } : { x1: r.left + 70, y1: r.top + 50, x2: r.right - 90, y2: r.bottom - 60 }; }
  function placer() {
    var b = boite(), s = scene.getBoundingClientRect(), w = Math.min((b.x2 - b.x1) * .5, (b.y2 - b.y1) * .52, 380);
    carte.style.width = w + 'px'; carte.style.left = ((b.x1 + b.x2) / 2 - s.left) + 'px'; carte.style.top = ((b.y1 + b.y2) / 2 - s.top) + 'px';
  }
  placer(); addEventListener('resize', placer);
  var champ = Champ({
    canvas: document.getElementById('c'), stage: document.getElementById('stage'), forme: 'collier', entree: 'bords', nombre: A.length, boite: boite,
    calme: function () { var r = propos.getBoundingClientRect(), c = carte.getBoundingClientRect(); return [{ x1: r.left, y1: r.top, x2: r.right - 40, y2: r.bottom }, { x1: c.left + 10, y1: c.top + 10, x2: c.right - 10, y2: c.bottom - 10 }]; },
    dessin: function (ctx, api, a) {
      var B = api.boite(), Q = api.ancres(), f = api.etat().focus;
      for (var k = 0; k < Q.length; k++) {
        if (api.petit() && k !== f) continue;
        var m = Math.min(B.hw, B.hh) * .1 + 30;
        api.texte(A[k].theme, Q[k][0] + Math.cos(Q[k][2]) * m * 1.3, Q[k][1] + Math.sin(Q[k][2]) * m, { a: (k === f ? 1 : .5) * a, s: k === f ? 19 : 16, c: k === f ? 'rgba(201,242,123,' + a + ')' : null });
      }
    }
  });
  Synchro({
    champ: champ, stage: document.getElementById('stage'), carte: carte, defaut: A.length - 1,
    liens: [].slice.call(document.querySelectorAll('#liste a')),
    lien: function (k) { return '/articles/' + A[k].slug + '/'; },
    rendre: function (k) { var x = A[k]; return '<p class="sur">Analyse 0' + (k + 1) + ' · ' + x.theme + ' · ' + x.min + ' min</p><h2>' + Typo(x.titre) + '</h2><p>' + Typo(x.chapo) + '</p><a class="lien" href="/articles/' + x.slug + '/" data-sortie>Lire l\\'analyse →</a>'; }
  }).choisir(A.length - 1);
  Sorties(champ);
})();`,
});

const lettres = [...new Set(TERMES.map((t) => t.t[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()))].sort();
const t0 = TERMES.find((t) => t.id === 'communs-numeriques') || TERMES[0];
const pageGlossaire = section({
  route: '/glossaire/', courant: 'glossaire',
  style: `<style>
#carte{left:0;right:auto;bottom:6%;width:min(520px,86%)}
.cherche{display:flex;align-items:center;margin-top:clamp(12px,2vh,22px);border-bottom:1px solid var(--line);transition:border-color .3s}
.cherche:focus-within{border-color:var(--lime)}
.cherche input{flex:1;min-width:0;background:none;border:0;color:var(--ink);font:400 clamp(20px,1.6vw,24px)/1 var(--serif);padding:12px 0;outline:none}
.cherche input::placeholder{color:var(--faint)}
.cherche input::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none}
.cherche span{font-size:12px;font-weight:600;letter-spacing:.1em;color:var(--lime)}
.lettres{display:flex;flex-wrap:wrap;gap:2px;margin-top:12px}
.lettres button{background:none;border:0;cursor:pointer;font-size:12.5px;font-weight:600;letter-spacing:.06em;color:var(--faint);padding:6px 7px;border-radius:6px;transition:color .2s,background .2s}
.lettres button:hover{color:var(--ink)}
.lettres button.on{color:var(--bg);background:var(--lime)}
.mots{flex:1;margin-top:12px;display:grid;grid-template-columns:1fr 1fr;column-gap:24px;align-content:start;border-top:0}
.mots li{border:0}
.mots a{display:block;padding:5px 0;font:400 17px/1.25 var(--serif);color:var(--muted);transition:color .2s,padding .3s var(--ease)}
.mots a::before{left:-12px}
.mots li[hidden]{display:none}
@media (max-width:860px){.mots{grid-template-columns:1fr}}
</style>`,
  corps: `  <main class="vue">
    <section class="propos" id="propos">
      <p class="kicker"><b>03</b> Glossaire</p>
      <h1>${TERMES.length} mots, <em>pour s'y retrouver.</em></h1>
      <form class="cherche" role="search" action="/glossaire/a-z/"><input id="q" type="search" placeholder="Chercher : enclosure, OSPO, copyleft…" aria-label="Chercher un terme" autocomplete="off"><span id="compte" aria-live="polite">${TERMES.length}</span></form>
      <div class="lettres" id="lettres" aria-label="Filtrer par lettre"><button type="button" data-l="" class="on">Tout</button>${lettres.map((l) => `<button type="button" data-l="${l}">${l}</button>`).join('')}</div>
      <ul class="liste mots" id="liste">${TERMES.map((t, i) => `<li data-glossterm="${e(t.k)}"><a href="/glossaire/a-z/#${t.id}" data-i="${i}">${e(t.t)}</a></li>`).join('')}</ul>
    </section>
    <section class="scene" id="scene" aria-label="Les mots du glossaire, en grille">
      <article class="carte" id="carte" aria-live="polite"><p class="sur">Glossaire</p><h2>${e(t0.t)}</h2><p>${e(t0.d)}</p><a class="lien" href="/glossaire/a-z/#${t0.id}" data-sortie>Dans le glossaire de A à Z →</a></article>
    </section>
  </main>`,
  script: `(function () {
  var T = DONNEES.termes, scene = document.getElementById('scene'), propos = document.getElementById('propos'), carte = document.getElementById('carte');
  var liens = [].slice.call(document.querySelectorAll('#liste a')), q = document.getElementById('q'), compte = document.getElementById('compte');
  var vus = null, lettre = '';
  function boite() { var r = scene.getBoundingClientRect(), c = carte.getBoundingClientRect(); return innerWidth < 861 ? { x1: r.left + 24, y1: r.top + 24, x2: r.right - 24, y2: r.bottom - 24 } : { x1: r.left + 30, y1: r.top + 40, x2: r.right - 70, y2: c.top - 54 }; }
  var champ = Champ({
    canvas: document.getElementById('c'), stage: document.getElementById('stage'), forme: 'grille', cellules: T.length, entree: 'bords', boite: boite,
    calme: function () { var r = propos.getBoundingClientRect(); return [{ x1: r.left, y1: r.top, x2: r.right - 40, y2: r.bottom }]; },
    dessin: function (ctx, api, a) {
      var Q = api.ancres(), f = api.etat().focus, B = api.boite();
      if (f >= 0) api.texte(T[f].t, Q[f][0] + (Q[f][0] > B.cx ? -18 : 18), Q[f][1] - 22, { c: 'rgba(201,242,123,' + a + ')', s: 20, al: Q[f][0] > B.cx ? 'right' : 'left' });
      if (vus && vus.size <= 8) vus.forEach(function (k) { if (k !== f) api.texte(T[k].t, Q[k][0] + 10, Q[k][1] + 18, { a: .75 * a, s: 15, al: 'left' }); });
      Fil(ctx, api, carte, a);
    }
  });
  var sync = Synchro({
    champ: champ, stage: document.getElementById('stage'), carte: carte, liens: liens,
    rendre: function (k) { var t = T[k]; return '<p class="sur">Glossaire · ' + (k + 1) + ' sur ' + T.length + '</p><h2>' + Typo(t.t) + '</h2><p>' + Typo(t.d) + '</p><a class="lien" href="/glossaire/a-z/#' + t.id + '" data-sortie>Dans le glossaire de A à Z →</a>'; }
  });
  var demande = T.findIndex(function (t) { return t.id === location.hash.slice(1); });
  sync.choisir(demande >= 0 ? demande : T.findIndex(function (t) { return t.id === 'communs-numeriques'; }));
  liens.forEach(function (l) { l.addEventListener('click', function (e) { e.preventDefault(); sync.choisir(+l.dataset.i); }); });
  // Recherche et lettres, insensibles aux accents : la grille ne garde allumés que les mots trouvés
  var norm = function (s) { return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase(); };
  function filtrer() {
    var v = norm(q.value.trim()); vus = new Set();
    T.forEach(function (t, i) {
      var ok = (!v || norm(t.t + ' ' + t.k).indexOf(v) > -1) && (!lettre || norm(t.t)[0] === lettre.toLowerCase());
      liens[i].parentNode.hidden = !ok; if (ok) vus.add(i);
    });
    compte.textContent = vus.size;
    if (!v && !lettre) vus = null;
    champ.filtre(vus);
    if (vus && vus.size) sync.choisir(vus.values().next().value);
  }
  q.addEventListener('input', filtrer);
  q.form.addEventListener('submit', function (e) { e.preventDefault(); });
  document.getElementById('lettres').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    lettre = b.dataset.l; this.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); filtrer();
  });
  Sorties(champ);
})();`,
});

const puce = (c, i) => `<button type="button" data-i="${i}">${e(c.nom)}</button>`;
const pageRecherche = (route) => section({
  route, courant: 'recherche',
  style: `<style>
#carte{left:2%;bottom:5%}
.voies{display:grid;gap:clamp(10px,1.6vh,16px);margin-top:clamp(12px,2.4vh,26px);padding-top:clamp(12px,2vh,20px);border-top:1px solid var(--line)}
.voies .v{margin:0 0 8px;font:400 22px/1.1 var(--serif);color:var(--lime)}
.voies .v span{font:500 12px/1 var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-left:10px}
.puces{display:flex;flex-wrap:wrap;gap:6px}
.puces button{cursor:pointer;background:rgba(236,241,234,.04);border:1px solid var(--line);border-radius:99px;padding:7px 12px;font-size:13.5px;color:var(--muted);transition:all .25s}
.puces button:hover,.puces button.actif,.puces button:focus-visible{color:var(--bg);background:var(--lime);border-color:var(--lime)}
.engagement{margin:clamp(10px,1.8vh,18px) 0 0;font-size:12.5px;line-height:1.5;color:var(--faint);max-width:52ch}
@media (max-height:820px) and (min-width:861px){.voies{gap:8px;margin-top:10px;padding-top:10px}.voies .v{font-size:19px;margin-bottom:5px}.puces button{padding:5px 10px;font-size:12.5px}.engagement{font-size:12px;line-height:1.4}}
.carte .signe{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);font-size:12px;color:var(--faint)}
</style>`,
  corps: `  <main class="vue">
    <section class="propos" id="propos">
      <p class="kicker"><b>04</b> Recherche</p>
      <h1>La recherche <em>derrière le site.</em></h1>
      <p class="chapo">Un mémoire soutenu en 2025 : neuf initiatives publiques, treize entretiens, et une question — pourquoi certains communs s'ancrent-ils dans l'administration quand d'autres restent des expérimentations ?</p>
      <div class="voies">
        <div><p class="v">Appropriation <span>l'administration pilote</span></p><div class="puces">${CAS.map(puce).filter((_, i) => CAS[i].voie === 0).join('')}</div></div>
        <div><p class="v">Relation <span>elle contribue sans gouverner</span></p><div class="puces">${CAS.map(puce).filter((_, i) => CAS[i].voie === 1).join('')}</div></div>
      </div>
      <div class="actions"><a class="btn plein" href="/memoire/${chapitres[0].slug}/" data-sortie>Lire le mémoire en ligne <span aria-hidden="true">→</span></a><a class="btn trait" href="${site.pdf}">PDF · version publique</a></div>
      <p class="engagement">Les retranscriptions des treize entretiens (p. 125-206 de la version soutenue) sont confidentielles et ne sont pas publiées, et les personnes interrogées sont anonymisées, conformément aux engagements pris auprès d'elles.</p>
    </section>
    <section class="scene" id="scene" aria-label="Le résultat de la recherche : une fourche entre deux voies">
      <article class="carte" id="carte" aria-live="polite"><p class="sur">Le résultat central</p><h2>Appropriation ou relation</h2><p>« Institutionnaliser un commun » recouvre deux logiques distinctes, voire opposées. Les facteurs de réussite ne sont pas les mêmes.</p><a class="lien" href="/articles/appropriation-relation/" data-sortie>Lire la synthèse · 9 min →</a><p class="signe">${site.author} · Executive Master 2 MSIC · dir. Miguel Liottier · soutenu le 10 juillet 2025</p></article>
    </section>
  </main>`,
  script: `(function () {
  var C = DONNEES.cas, V = DONNEES.voies, scene = document.getElementById('scene'), propos = document.getElementById('propos'), carte = document.getElementById('carte');
  function boite() { var r = scene.getBoundingClientRect(), c = carte.getBoundingClientRect(); return innerWidth < 861 ? { x1: r.left + 20, y1: r.top + 40, x2: r.right - 30, y2: r.bottom - 30 } : { x1: r.left + 10, y1: r.top + 50, x2: r.right - 120, y2: c.top - 40 }; }
  var champ = Champ({
    canvas: document.getElementById('c'), stage: document.getElementById('stage'), forme: 'fourche', entree: 'bords', boite: boite,
    calme: function () { var r = propos.getBoundingClientRect(); return [{ x1: r.left, y1: r.top, x2: r.right - 40, y2: r.bottom }]; },
    dessin: function (ctx, api, a) {
      var fk = api.fourche(), Q = api.ancres(), f = api.etat().focus, petit = api.petit();
      api.texte('un commun numérique', fk.P0[0], fk.P0[1] - 24, { a: a, s: 17, al: 'left' });
      api.texte('appropriation', fk.E1[0] + 16, fk.E1[1] - 32, { c: 'rgba(201,242,123,' + a + ')', s: petit ? 17 : 24, al: 'right' });
      api.texte('relation', fk.E2[0] + 16, fk.E2[1] + 36, { c: 'rgba(201,242,123,' + a + ')', s: petit ? 17 : 24, al: 'right' });
      if (!petit) for (var k = 0; k < 9; k++) api.texte(C[k].nom.replace(/^Ville d(e |')/, ''), Q[k][0], Q[k][1] + ((k < 3 ? k : k + 1) % 2 ? -22 : 24), { f: '500 11.5px "Instrument Sans", sans-serif', c: k === f ? 'rgba(201,242,123,' + a + ')' : 'rgba(157,176,164,' + (a * .85) + ')' });
      Fil(ctx, api, carte, a);
    }
  });
  var puces = [].slice.call(document.querySelectorAll('.puces button')).sort(function (x, y) { return x.dataset.i - y.dataset.i; });
  var resume = carte.innerHTML;
  var sync = Synchro({
    champ: champ, stage: document.getElementById('stage'), carte: carte, liens: puces, relacher: true, defaut: null,
    rendre: function (k) {
      if (k == null) return resume;
      var c = C[k], v = V[c.voie];
      return '<p class="sur">' + Typo(c.type) + '</p><h2>' + Typo(c.nom) + '</h2><p>' + Typo(c.texte) + '</p><p style="margin-top:12px;color:var(--ink)"><span style="color:var(--lime)">' + v.nom + '</span> · ' + v.qui.toLowerCase() + '</p>';
    }
  });
  document.getElementById('propos').addEventListener('mouseleave', function () { sync.choisir(null); });
  Sorties(champ);
})();`,
});

const pageAPropos = section({
  route: '/a-propos/', courant: 'apropos',
  style: `<style>
.mots-propos{margin-top:clamp(6px,1.2vh,14px);display:grid;gap:clamp(8px,1.4vh,14px)}
.mots-propos p{margin:0;font-size:clamp(14.5px,min(1.1vw,2vh),16.5px);line-height:1.6;color:var(--muted);max-width:56ch}
.mots-propos b{color:var(--ink);font-weight:500}
.legal{margin-top:auto;padding-top:clamp(12px,2vh,22px);display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12.5px;color:var(--faint)}
.legal a{color:var(--muted);border-bottom:1px solid var(--line)}
.legal a:hover{color:var(--ink)}
.legende{position:absolute;left:4%;top:2%;margin:0;font:italic 400 clamp(20px,1.7vw,26px)/1.2 var(--serif);color:var(--ink)}
main.vue{position:relative}
#carte{right:3%;bottom:5%}
.contacts{list-style:none;margin:14px 0 0;padding:0;display:grid;gap:8px;font-size:14.5px}
.contacts li{display:grid;grid-template-columns:62px 1fr;gap:10px;padding-top:8px;border-top:1px solid var(--line)}
.contacts span{font-size:11.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);padding-top:2px}
.contacts a{color:var(--ink)}
.contacts a:hover{color:var(--lime)}
@media (max-width:860px){.legende{position:static;margin:0 18px}#carte{display:block;position:static;width:auto;margin:6px 18px 36px;order:2}}
</style>`,
  corps: `  <main class="vue">
    <section class="propos" id="propos">
      <p class="kicker"><b>·</b> À propos</p>
      <h1>Mettre la recherche <em>en partage.</em></h1>
      <div class="mots-propos">
        <p>Ce site prolonge un travail de recherche mené par <b>${site.author}</b> dans le cadre de l'Executive Master 2 « Management des Systèmes d'Information et de Connaissance » (MSIC), et soutenu le 10 juillet 2025 sous la direction de Miguel Liottier : une enquête sur les facteurs qui permettent aux communs numériques de s'ancrer durablement dans l'administration publique.</p>
        <p>Un objet d'étude consacré au partage aurait mal supporté de rester enfermé dans un PDF. D'où cette revue en ligne, qui poursuit deux ambitions : rendre le sujet accessible — par des articles courts, sourcés, didactiques — et mettre le travail de recherche lui-même à disposition de celles et ceux qu'il peut servir : décideurs publics, DSI, chercheurs, étudiants, praticiens du logiciel libre.</p>
        <p>Dans l'esprit du sujet, les contenus du site sont partagés sous licence ${site.licence} : vous pouvez les reprendre, les citer et les adapter, à condition d'en mentionner la source et de partager aux mêmes conditions. Les retranscriptions des entretiens de recherche, confidentielles, ne sont en revanche pas publiées, et les personnes interrogées sont anonymisées.</p>
      </div>
      <p class="legal"><a href="/mentions-legales/" data-sortie>Mentions légales</a><a href="/confidentialite/" data-sortie>Confidentialité</a><span>© 2026 ${site.author} · ${site.licence}</span></p>
    </section>
    <section class="scene" id="scene" aria-label="Ce site, lui aussi, se veut un commun">
      <p class="legende" id="legende">Ce site, lui aussi, se veut un commun.</p>
    </section>
    <article class="carte" id="carte">
      <p class="sur">Contact</p>
      <h2>Écrire, échanger, collaborer</h2>
      <p>Le site a vocation à s'enrichir : remarques, désaccords et propositions d'échange sont bienvenus. Institutionnels, chercheurs, praticiens — pour une intervention ou une collaboration, écrivez-moi, réponse assurée.</p>
      <ul class="contacts">
        <li><span>Écrire</span><a href="mailto:${site.email}">${site.email}</a></li>
        <li><span>Suivre</span><a href="${site.linkedin}" rel="noopener">LinkedIn ↗</a></li>
        <li><span>Lire</span><a href="/memoire/${chapitres[0].slug}/" data-sortie>Le mémoire, en ligne</a></li>
        <li><span>PDF</span><a href="${site.pdf}">Version publique</a></li>
      </ul>
    </article>
  </main>`,
  script: `(function () {
  var scene = document.getElementById('scene'), propos = document.getElementById('propos'), legende = document.getElementById('legende');
  var ETQ = [['une ressource', 'ces textes, en accès libre'], ['une communauté', 'vous, qui les lisez, citez, reprenez'], ['des règles', 'citer, partager à l\\u2019identique']];
  var champ = Champ({
    canvas: document.getElementById('c'), stage: document.getElementById('stage'), forme: 'commun', entree: 'bords', densite: .6,
    boite: function () { var r = scene.getBoundingClientRect(); return innerWidth < 861 ? { x1: r.left + 30, y1: r.top + 30, x2: r.right - 30, y2: r.bottom - 10 } : { x1: r.left - 30, y1: legende.getBoundingClientRect().bottom + 80, x2: r.right - 210, y2: r.bottom - 64 }; },
    calme: function () { var r = propos.getBoundingClientRect(); return [{ x1: r.left, y1: r.top, x2: r.right - 40, y2: r.bottom }]; },
    dessin: function (ctx, api, a) {
      if (api.petit()) return;
      var V = api.venn(), ang = [-1.75, -.9, Math.PI / 2];
      for (var k = 0; k < 3; k++) {
        var x = V.F[k][0] + Math.cos(ang[k]) * V.R * 1.16, y = V.F[k][1] + Math.sin(ang[k]) * V.R * 1.16, al = ['center', 'left', 'center'][k];
        api.texte(ETQ[k][0], x, y, { s: 19, a: a, al: al });
        api.texte(ETQ[k][1], x, y + 20, { f: '500 11.5px "Instrument Sans", sans-serif', c: 'rgba(157,176,164,' + a + ')', al: al });
      }
      api.texte('ce site', V.cx, V.cy, { s: 18, c: 'rgba(201,242,123,' + a + ')' });
    }
  });
  Curseur(); Sorties(champ);
})();`,
});

/* ── 6. Pages de lecture ───────────────────────────────────────────────────── */
const MIN_MEMOIRE = { 'introduction': 6, '1-1-performance-sous-contraintes': 18, '1-2-paradigme-des-communs': 23, '1-3-institutionnalisation': 26, '2-1-design-de-la-recherche': 7, '2-2-dispositif-empirique': 6, '2-3-traitement-analyse-limites': 13, '3-1-les-neuf-cas': 25, '3-2-dynamiques-institutionnalisation': 26, '3-3-discussion-et-implications': 26, 'conclusion': 8, 'bibliographie': 20, 'annexes/1-glossaire': 6, 'annexes/2-limites-methodologiques': 1, 'annexes/3-guide-entretien': 6, 'annexes/4-grille-de-codage': 4, 'annexes/5-matrices-de-codage': 1 };
const PIED = `<p class="pied"><span>© 2026 ${site.author} · contenus sous licence ${site.licence}</span><span><a href="/a-propos/" data-sortie>À propos</a><a href="/mentions-legales/" data-sortie>Mentions légales</a><a href="/confidentialite/" data-sortie>Confidentialité</a></span></p>`;

function lecture(o) {
  const precedent = o.prec ? `<a href="${o.prec.href}" data-sortie><small>← ${o.prec.sur}</small><b>${e(o.prec.t)}</b></a>` : '<span></span>';
  const suivant = o.suiv ? `<a class="nx" href="${o.suiv.href}" data-sortie><small>${o.suiv.sur} →</small><b>${e(o.suiv.t)}</b></a>` : '';
  return `<!DOCTYPE html>
<html lang="fr"><head>${TETES[o.route]}${feuilles(true)}
</head>
<body class="lecture${o.classe ? ' ' + o.classe : ''}">
<div class="progres" id="progres" aria-hidden="true"><span></span></div>
<div class="fond" aria-hidden="true"><div class="bg"></div><div class="grain"></div></div>
<canvas class="champ" id="c" aria-hidden="true"></canvas>
${entete(o.courant)}
<div class="lire">
  <aside class="rail" aria-label="${e(o.railNom)}">
    <div class="rail-scene" id="scene"></div>
    <div class="rail-info">
      <p class="pos">${o.position}</p>
      <p class="tit">${e(o.court)}</p>
      <nav aria-label="Navigation"><a href="${o.retour.href}" data-sortie><span>↖</span>${o.retour.t}</a></nav>
    </div>
  </aside>
  <main class="texte" id="texte">
    <p class="kicker">${o.kicker}</p>
    <h1>${o.h1}</h1>
    ${o.ouverture}
    <p class="signature">${o.signature}</p>
    <article class="corps-lecture" id="corps">${o.corps}</article>
    ${o.prec || o.suiv ? `<nav class="suite" aria-label="Suite de la lecture">${precedent}${suivant}</nav>` : ''}
    ${PIED}
  </main>
  <aside class="plan" aria-label="Plan">
    <p>${o.planNom}</p>
    <ol>${o.plan.map((x) => `<li><a href="#${x.id}">${e(x.t)}</a></li>`).join('')}</ol>
    <div class="outils"><button type="button" id="clair"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="3.2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3"/></svg><span>Lecture claire</span></button>${o.outils || ''}</div>
  </aside>
</div>
<div class="bulle" id="bulle" role="tooltip"></div>
<div class="cur" id="cur" aria-hidden="true"></div>
<div class="veil" aria-hidden="true"></div>
<script>window.LECTURE = ${JSON.stringify(o.lecture)};</script>
${SCRIPTS}<script src="/univers/lecture.js"></script>
</body></html>`;
}

const pagesLecture = {};
NOTIONS.forEach((n, k) => {
  const r = '/comprendre/' + n.slug + '/', { corps, plan } = SOURCES[r];
  const lien = (j) => NOTIONS[j] && { href: '/comprendre/' + NOTIONS[j].slug + '/', t: NOTIONS[j].question, sur: 'Question ' + String(j + 1).padStart(2, '0') };
  pagesLecture[r] = lecture({
    route: r, courant: 'comprendre', railNom: `Le parcours en ${(NOMBRES[NOTIONS.length] || NOTIONS.length).toLowerCase()} questions`, position: `Question ${String(k + 1).padStart(2, '0')} / ${String(NOTIONS.length).padStart(2, '0')}`, court: n.court,
    retour: { href: '/comprendre/', t: `Les ${(NOMBRES[NOTIONS.length] || NOTIONS.length).toLowerCase()} questions` },
    kicker: `<b>${String(k + 1).padStart(2, '0')}</b> Comprendre · ${e(n.section)} · ${n.min} min`, h1: e(n.question),
    ouverture: `<div class="phrase"><span>En une phrase</span><p>${e(n.reponse)}</p></div>`,
    signature: `<span>Par <b>${site.author}</b></span><span>Première approche, aucun prérequis</span><span>Les mots soulignés en pointillé renvoient au glossaire</span>`,
    corps, plan, planNom: 'Dans cette notion', prec: lien(k - 1), suiv: lien(k + 1),
    lecture: { forme: 'parcours', rang: k, liens: NOTIONS.map((x) => '/comprendre/' + x.slug + '/'), etiquettes: NOTIONS.map((x) => x.court) },
  });
});
ANALYSES.forEach((a, k) => {
  const r = '/articles/' + a.slug + '/', { corps, plan } = SOURCES[r];
  const lien = (j) => ANALYSES[j] && { href: '/articles/' + ANALYSES[j].slug + '/', t: ANALYSES[j].titre, sur: 'Analyse ' + String(j + 1).padStart(2, '0') };
  pagesLecture[r] = lecture({
    route: r, courant: 'analyses', railNom: 'Les analyses', position: `Analyse ${String(k + 1).padStart(2, '0')} / ${String(ANALYSES.length).padStart(2, '0')}`, court: a.theme,
    retour: { href: '/articles/', t: 'Toutes les analyses' },
    kicker: `<b>${String(k + 1).padStart(2, '0')}</b> Analyses · ${e(a.theme)} · ${a.min} min`, h1: e(a.titre),
    ouverture: `<p class="chapo-lecture">${e(a.chapo)}</p>`,
    signature: `<span>Par <b>${site.author}</b></span><span>D'après le mémoire <a href="/la-recherche/" data-sortie>« Les facteurs d'institutionnalisation des communs numériques »</a></span>`,
    corps, plan, planNom: 'Dans cette analyse', prec: lien(k - 1), suiv: lien(k + 1),
    lecture: { forme: 'collier', rang: k, liens: ANALYSES.map((x) => '/articles/' + x.slug + '/'), etiquettes: ANALYSES.map((x) => x.theme) },
  });
});
{
  // la colonne du mémoire : un point par chapitre, un écart entre les parties
  const pos = [], groupes = []; let y = 0, prec;
  chapitres.forEach((ch, i) => {
    const g = ch.partie ?? ch.slug;
    if (i > 0) y += g === prec ? 1 : 2.4;
    if (g !== prec) groupes.push({ i, label: ch.partie ? ch.partie.replace('Partie ', '') : ch.titre.replace('Bibliographie', 'Biblio.').replace('Introduction', 'Intro.').replace('Conclusion', 'Concl.') });
    pos.push(y); prec = g;
  });
  const colonne = pos.map((v) => v / y);
  chapitres.forEach((c, k) => {
    const r = '/memoire/' + c.slug + '/', { corps, plan, h1 } = SOURCES[r];
    const lien = (j) => chapitres[j] && { href: '/memoire/' + chapitres[j].slug + '/', t: chapitres[j].titre, sur: j < k ? 'Chapitre précédent' : 'Chapitre suivant' };
    const p = parties.find((x) => x.nom === c.partie);
    pagesLecture[r] = lecture({
      route: r, courant: 'recherche', railNom: 'Les chapitres du mémoire', position: `Chapitre ${k + 1} / ${chapitres.length}${c.partie ? ' · ' + c.partie : ''}`, court: c.titre,
      retour: { href: '/la-recherche/', t: 'La recherche' },
      kicker: `<b>Mémoire</b> ${c.partie ? e(c.partie) + (p && p.libelle ? ' · ' + e(p.libelle) : '') : ''}${MIN_MEMOIRE[c.slug] ? ` · ${MIN_MEMOIRE[c.slug]} min` : ''}`, h1: e(h1),
      ouverture: `<p class="chapo-lecture">${e(c.resume)}</p>`,
      signature: `<span><b>${site.author}</b> · 2025</span><span>Les références <span class="ref ref--ent" style="font-size:11px">ENT-00X</span> renvoient aux entretiens, dont les retranscriptions restent confidentielles.</span>`,
      corps, plan, planNom: 'Dans ce chapitre', prec: lien(k - 1), suiv: lien(k + 1),
      outils: `<a href="${site.pdf}"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M8 2v9M4 7l4 4 4-4M2 14h12"/></svg>PDF · version publique</a>`,
      lecture: { forme: 'colonne', rang: k, colonne, groupes, liens: chapitres.map((x) => '/memoire/' + x.slug + '/'), etiquettes: chapitres.map((x) => x.titre.replace(/^Annexe \d — /, '')) },
    });
  });
}
{
  const cle = (t) => t.t[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const corps = lettres.map((l) => `<section class="lettre" aria-labelledby="lettre-${l}"><h2 id="lettre-${l}">${l}</h2><dl>${TERMES.map((t, i) => [t, i]).filter(([t]) => cle(t) === l).map(([t, i]) => `<div class="entree" id="${t.id}" data-i="${i}"><dt>${e(t.t)}</dt><dd>${e(t.d)}</dd></div>`).join('')}</dl></section>`).join('');
  pagesLecture['/glossaire/a-z/'] = lecture({
    route: '/glossaire/a-z/', courant: 'glossaire', classe: 'lexique', railNom: 'Les mots du glossaire, en grille', position: `${TERMES.length} mots`, court: 'De « administration publique » à « wiki »',
    retour: { href: '/glossaire/', t: 'Explorer la grille' },
    kicker: '<b>03</b> Glossaire · de A à Z', h1: "Les mots <em>pour s'y retrouver.</em>",
    ouverture: "<p class=\"chapo-lecture\">Les notions employées sur ce site et dans le mémoire : la théorie des communs, la gouvernance, le vocabulaire du logiciel libre et de l'action publique.</p>",
    signature: '<span>Survolez un point de la marge pour lire son mot ; cliquez pour y aller.</span>',
    corps, plan: lettres.map((l) => ({ id: `lettre-${l}`, t: l })), planNom: 'Lettres',
    lecture: { forme: 'grille', rang: -1, cellules: TERMES.length, etiquettes: TERMES.map((t) => t.t) },
  });
}
for (const r of ['mentions-legales', 'confidentialite']) {
  const route = '/' + r + '/', { corps, plan, h1, intro } = SOURCES[route];
  pagesLecture[route] = lecture({
    route, courant: 'apropos', railNom: 'Le commun', position: 'Informations légales', court: h1,
    retour: { href: '/a-propos/', t: 'À propos' },
    kicker: '<b>·</b> Informations légales', h1: e(h1),
    ouverture: intro ? `<p class="chapo-lecture">${e(intro)}</p>` : '',
    signature: `<span>${site.name} · édité par <b>${site.author}</b></span>`,
    corps, plan, planNom: 'Sur cette page',
    lecture: { forme: 'commun', rang: -1, etiquettes: [] },
  });
}

/* ── 7. Accueil et page 404 ────────────────────────────────────────────────── */
let accueil = readFileSync(join(ROOT, 'src', 'univers', 'accueil.html'), 'utf8');
accueil = accueil.replace(/<head>[\s\S]*?<style>/, `<head>${TETES['/']}<link rel="stylesheet" href="/fonts/fonts.css">\n<style>`);

const page404 = `<!DOCTYPE html>
<html lang="fr"><head>${tete404}${feuilles(false)}
<style>
.perdu{align-self:center;padding:0 var(--pad);max-width:720px}
.perdu h1{font-size:clamp(48px,7vw,96px)}
.perdu .portes{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
</style>
</head>
<body>
<div class="stage" id="stage">
  <div class="bg" aria-hidden="true"></div>
  <canvas class="champ" id="c" aria-hidden="true"></canvas>
  <div class="grain" aria-hidden="true"></div>
  ${entete('')}
  <main class="perdu" id="perdu">
    <p class="kicker"><b>404</b> Page introuvable</p>
    <h1>Ce chemin <em>ne mène nulle part.</em></h1>
    <p class="chapo">La page demandée n'existe pas, ou plus. Le champ, lui, est toujours là : reprenez par l'une des quatre portes.</p>
    <div class="portes"><a class="btn plein" href="/" data-sortie>Accueil</a><a class="btn trait" href="/comprendre/" data-sortie>Comprendre</a><a class="btn trait" href="/articles/" data-sortie>Analyses</a><a class="btn trait" href="/glossaire/" data-sortie>Glossaire</a><a class="btn trait" href="/la-recherche/" data-sortie>Recherche</a></div>
  </main>
</div>
<div class="cur" id="cur" aria-hidden="true"></div>
<div class="veil" aria-hidden="true"></div>
${SCRIPTS}
<script>
(function () {
  var perdu = document.getElementById('perdu');
  var champ = Champ({ canvas: document.getElementById('c'), stage: document.getElementById('stage'), forme: 'commun', entree: 'hasard', libres: .45, densite: .7,
    boite: function () { return { x1: innerWidth * .45, y1: 90, x2: innerWidth - 60, y2: innerHeight - 40 }; },
    calme: function () { var r = perdu.getBoundingClientRect(); return [{ x1: r.left, y1: r.top, x2: r.right, y2: r.bottom }]; } });
  Curseur(); Sorties(champ);
})();
</script>
</body></html>`;

/* ── 8. Écriture ───────────────────────────────────────────────────────────── */
mkdirSync(join(DOCS, 'univers'), { recursive: true });
writeFileSync(join(DOCS, 'univers', 'donnees.js'), `/* Données de l'univers — générées par build/univers.mjs à partir des pages compilées. */\nwindow.DONNEES = ${JSON.stringify(DONNEES)};\n`);
ecrire('/', accueil);
ecrire('/comprendre/', pageComprendre);
ecrire('/articles/', pageAnalyses);
ecrire('/glossaire/', pageGlossaire);
ecrire('/la-recherche/', pageRecherche('/la-recherche/'));
ecrire('/memoire/', pageRecherche('/memoire/'));
ecrire('/a-propos/', pageAPropos);
for (const [r, h] of Object.entries(pagesLecture)) ecrire(r, h);
ecrire('404.html', page404);

console.log(`\n  Univers : accueil, 5 pages de section, ${Object.keys(pagesLecture).length} pages de lecture, 404`
  + ` · ${NOTIONS.length} notions · ${ANALYSES.length} analyses · ${TERMES.length} mots du glossaire\n`);
