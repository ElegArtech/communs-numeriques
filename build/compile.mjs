#!/usr/bin/env node
/* Compile les maquettes Claude Design (.dc.html) en site statique autonome.
 *
 *   src/*.dc.html  ──▶  docs/<route>/index.html
 *
 * Ce que le compilateur retire :
 *   • le runtime Claude Design (React + ReactDOM + Babel, ~3 Mo depuis unpkg.com)
 *   • les enveloppes <x-dc> et <helmet>, les liaisons ref="{{ }}" et onInput="{{ }}"
 *   • les appels à fonts.googleapis.com (polices désormais auto-hébergées)
 *
 * Ce qu'il ajoute :
 *   • lang="fr", meta description, Open Graph, Twitter Card, canonical, favicon
 *   • JSON-LD (WebSite / Article), sitemap.xml, robots.txt, 404.html, CNAME
 *   • les styles :hover réels, en remplacement de l'attribut style-hover
 *   • le runtime natif (build/runtime.js), inliné : ~3 Ko au lieu de ~3 Mo
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, pages, linkMap, redirects } from './site.config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'docs');
const STATIC = join(ROOT, 'static');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ── 1. Extraction ────────────────────────────────────────────────────────── */

function extract(html) {
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1].trim();

  // Styles propres à la page, déclarés dans <helmet>
  const helmet = (html.match(/<helmet>([\s\S]*?)<\/helmet>/) || [, ''])[1];
  const styles = [...helmet.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1].trim());

  // Corps = contenu de <x-dc>, moins le <helmet> et les scripts Claude Design
  let body = (html.match(/<x-dc>([\s\S]*?)<\/x-dc>/) || [, ''])[1];
  body = body.replace(/<helmet>[\s\S]*?<\/helmet>/g, '');
  body = body.replace(/<script type="text\/x-dc"[\s\S]*?<\/script>/g, '');

  // Props déclarées sur le script Claude Design (motif de fond de l'accueil)
  const propsAttr = (html.match(/data-props="([^"]*)"/) || [, ''])[1];
  const props = {};
  if (propsAttr) {
    const decoded = propsAttr.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    try {
      for (const [k, v] of Object.entries(JSON.parse(decoded))) props[k] = v.default;
    } catch { /* props optionnelles : on garde les valeurs par défaut du runtime */ }
  }

  return { title, styles, body, props };
}

/* ── 2. style-hover → vraies règles CSS ───────────────────────────────────── */

/* L'attribut style-hover de Claude Design n'existe pas en HTML. On le convertit
 * en classe avec pseudo-sélecteur :hover. Les déclarations portent !important
 * car elles doivent l'emporter sur l'attribut style inline de l'élément. */
function hoverToCss(body, hoverRules) {
  return body.replace(/\s+style-hover="([^"]*)"/g, (_, decls) => {
    const rule = decls.split(';').map(d => d.trim()).filter(Boolean)
      .map(d => d + ' !important').join(';');
    if (!rule) return '';
    let cls = hoverRules.get(rule);
    if (!cls) { cls = 'hv' + (hoverRules.size + 1); hoverRules.set(rule, cls); }
    return ` data-hv="${cls}"`;
  });
}

/* Reporte la classe sur l'attribut class de l'élément porteur. */
function applyHoverClasses(body) {
  return body.replace(/<([a-z][a-z0-9]*)((?:\s+[^>]*?)?)\s+data-hv="(hv\d+)"((?:\s+[^>]*?)?)\s*(\/?)>/gi,
    (_, tag, before, cls, after, selfClose) => {
      let attrs = before + after;
      if (/\sclass="/.test(attrs)) attrs = attrs.replace(/\sclass="([^"]*)"/, ` class="$1 ${cls}"`);
      else attrs = ` class="${cls}"` + attrs;
      return `<${tag}${attrs}${selfClose ? ' /' : ''}>`;
    });
}

/* ── 3. Liaisons dynamiques et liens internes ─────────────────────────────── */

function rewriteBindings(body, props) {
  // ref="{{ nom }}" → data-ref="nom", exploité par build/runtime.js
  body = body.replace(/\s+ref="\{\{\s*([A-Za-z0-9_]+)\s*\}\}"/g, ' data-ref="$1"');
  // Les gestionnaires d'événements sont désormais posés par le runtime
  body = body.replace(/\s+on[A-Z][a-zA-Z]*="\{\{[^"]*\}\}"/g, '');
  // Props du motif de fond, transmises au canvas via data-*
  if (body.includes('data-ref="dotsRef"')) {
    const anime = props.motifAnime === false ? 'false' : 'true';
    const dens = props.densiteMotif ?? 30;
    body = body.replace('data-ref="dotsRef"', `data-ref="dotsRef" data-anime="${anime}" data-densite="${dens}"`);
  }
  // Métadonnées d'édition Claude Design : inutiles en production
  body = body.replace(/\s+data-screen-label="[^"]*"/g, '');
  return body;
}

function rewriteLinks(body) {
  for (const [from, to] of Object.entries(linkMap)) {
    body = body.split(`href="${from}"`).join(`href="${to}"`);
    body = body.split(`href="${from}#`).join(`href="${to}#`);
  }
  const leftover = [...body.matchAll(/href="([^"]*\.dc\.html[^"]*)"/g)].map(m => m[1]);
  return { body, leftover };
}

/* ── 4. Assemblage de la page ─────────────────────────────────────────────── */

const RUNTIME = readFileSync(join(HERE, 'runtime.js'), 'utf8');

function jsonLd(page, title) {
  const base = {
    '@context': 'https://schema.org',
    inLanguage: 'fr-FR',
    isPartOf: { '@type': 'WebSite', name: site.name, url: site.origin + '/' },
    author: { '@type': 'Person', name: site.author, url: site.linkedin },
    license: site.licenceUrl,
  };
  if (page.type === 'article') {
    return { ...base, '@type': 'Article', headline: title.replace(/ — .*$/, ''),
      description: page.desc, url: site.origin + page.route,
      articleSection: page.section, publisher: { '@type': 'Person', name: site.author } };
  }
  if (page.route === '/') {
    return { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name,
      alternateName: site.tagline, url: site.origin + '/', inLanguage: 'fr-FR',
      description: page.desc, license: site.licenceUrl,
      author: { '@type': 'Person', name: site.author, url: site.linkedin } };
  }
  return { ...base, '@type': 'WebPage', name: title.replace(/ — .*$/, ''),
    description: page.desc, url: site.origin + page.route };
}

function assemble(page, { title, styles, body }, hoverCss) {
  const url = site.origin + page.route;
  const ld = JSON.stringify(jsonLd(page, title), null, 0);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.desc)}">
<meta name="author" content="${esc(site.author)}">
${site.noindex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow">'}
<link rel="canonical" href="${url}">
<meta property="og:type" content="${page.type}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="${site.locale}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(page.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.origin}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(page.desc)}">
<meta name="twitter:image" content="${site.origin}/og-image.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#FAFAF6">
<link rel="stylesheet" href="/fonts/fonts.css">
<style>
${styles.join('\n')}
${hoverCss}
</style>
<script type="application/ld+json">${ld}</script>
</head>
<body>
${body.trim()}
<script>${RUNTIME}</script>
</body>
</html>
`;
}

/* ── 5. Exécution ─────────────────────────────────────────────────────────── */

console.log('Compilation du site\n');

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });

const hoverRules = new Map();
const compiled = [];
let warnings = 0;

for (const page of pages) {
  const raw = readFileSync(join(SRC, page.src), 'utf8');
  const parsed = extract(raw);

  let body = hoverToCss(parsed.body, hoverRules);
  body = applyHoverClasses(body);
  body = rewriteBindings(body, parsed.props);
  const rl = rewriteLinks(body);
  body = rl.body;

  if (rl.leftover.length) {
    console.log(`  ⚠  ${page.src} : lien non réécrit → ${rl.leftover.join(', ')}`);
    warnings++;
  }
  compiled.push({ page, parsed: { ...parsed, body } });
}

// Le CSS des :hover est identique pour toutes les pages : une seule table
const hoverCss = [...hoverRules].map(([rule, cls]) => `.${cls}:hover{${rule}}`).join('\n');

for (const { page, parsed } of compiled) {
  const dir = join(OUT, page.route);
  mkdirSync(dir, { recursive: true });
  const html = assemble(page, parsed, hoverCss);
  writeFileSync(join(dir, 'index.html'), html);
  console.log(`  ${page.route.padEnd(42)} ${(html.length / 1024).toFixed(1).padStart(6)} Ko`);
}

// Ressources statiques → racine du site
cpSync(STATIC, OUT, { recursive: true });
writeFileSync(join(OUT, 'CNAME'), site.domain + '\n');
writeFileSync(join(OUT, '.nojekyll'), '');
// Page 404 : réutilise l'en-tête et le pied de la page d'accueil
{
  const home = readFileSync(join(OUT, 'index.html'), 'utf8');
  const header = (home.match(/<header[\s\S]*?<\/header>/) || [''])[0];
  const footer = (home.match(/<footer[\s\S]*?<\/footer>/) || [''])[0];
  const styles = (home.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
  writeFileSync(join(OUT, '404.html'), `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page introuvable — ${site.name}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/fonts/fonts.css">
${styles}
</head>
<body>
${header}
<main style="max-width:1380px;margin:0 auto;padding:clamp(80px,12vw,160px) clamp(20px,4vw,48px)">
  <p style="margin:0 0 20px;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:#4A5850">Erreur 404</p>
  <h1 style="font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(40px,7vw,92px);line-height:1.02;letter-spacing:-.015em;margin:0 0 28px">Cette page n'existe <em style="font-style:italic;color:#127552">pas</em></h1>
  <p style="margin:0 0 40px;font-size:17px;line-height:1.7;color:#4A5850;max-width:560px">L'adresse demandée ne correspond à aucune page du site. Elle a peut-être changé, ou le lien qui vous a amené ici comporte une coquille.</p>
  <nav style="display:flex;flex-wrap:wrap;gap:14px 28px;font-size:13px;letter-spacing:.09em;text-transform:uppercase;font-weight:600">
    <a href="/" style="color:#1E2A23">Accueil</a>
    <a href="/articles/" style="color:#1E2A23">Articles</a>
    <a href="/la-recherche/" style="color:#1E2A23">La recherche</a>
    <a href="/glossaire/" style="color:#1E2A23">Glossaire</a>
    <a href="/a-propos/" style="color:#1E2A23">À propos</a>
  </nav>
</main>
${footer}
</body>
</html>
`);
}

writeFileSync(join(OUT, 'robots.txt'), site.noindex
  ? `# Site en préparation : contenu provisoire, indexation fermée.\nUser-agent: *\nDisallow: /\n`
  : `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.xml\n`);
writeFileSync(join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${site.origin}${p.route}</loc><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>
`);

// Validation Google Search Console, héritée du site précédent
writeFileSync(join(OUT, site.googleVerification),
  `google-site-verification: ${site.googleVerification}\n`);

// Redirections depuis les anciennes URLs. GitHub Pages ne sait pas répondre 301 :
// on sert une page de renvoi qui porte le canonical vers la nouvelle adresse,
// ce que les moteurs interprètent comme une redirection permanente.
let nbRedirections = 0;
for (const [ancienne, nouvelle] of Object.entries(redirects)) {
  const cible = site.origin + nouvelle;
  const chemin = ancienne.endsWith('/') ? join(OUT, ancienne, 'index.html') : join(OUT, ancienne);
  if (existsSync(chemin)) {
    console.log(`  ✗ redirection ignorée : ${ancienne} écraserait une page du site`);
    warnings++;
    continue;
  }
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Page déplacée — ${esc(site.name)}</title>
<link rel="canonical" href="${cible}">
<meta name="robots" content="noindex, follow">
<meta http-equiv="refresh" content="0; url=${nouvelle}">
<link rel="stylesheet" href="/fonts/fonts.css">
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FAFAF6;color:#1E2A23;font-family:'Instrument Sans',system-ui,sans-serif;text-align:center;padding:24px}a{color:#127552}</style>
</head>
<body>
<div>
<p style="font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:#4A5850;margin:0 0 14px">Cette page a déménagé</p>
<p style="font-family:'Instrument Serif',serif;font-size:28px;margin:0 0 18px">Redirection en cours…</p>
<p style="margin:0;font-size:15px;color:#4A5850">Si rien ne se passe, <a href="${nouvelle}">suivez ce lien</a>.</p>
</div>
</body>
</html>
`);
  nbRedirections++;
}

console.log(`\n  ${pages.length} pages · ${nbRedirections} redirections · ${hoverRules.size} règles :hover · ${warnings} avertissement(s)`);
console.log(site.noindex ? '  ⚠  noindex actif : le site ne sera pas indexé par les moteurs' : '  indexation ouverte');
