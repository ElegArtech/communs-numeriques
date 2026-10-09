#!/usr/bin/env node
/* Vérifie le site compilé dans un vrai navigateur :
 *   • l'interactivité fonctionne sans React ni CDN
 *   • aucune requête ne sort vers un domaine tiers
 *   • le contenu reste lisible JavaScript désactivé
 * Prérequis : un serveur sur http://localhost:8900 servant docs/. */

import puppeteer from 'puppeteer';
import { browserOptions } from './browser.mjs';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'http://127.0.0.1:8900';
const results = [];
const ok = (n, c, d = '') => results.push({ n, c, d });

const browser = await puppeteer.launch(await browserOptions());

try {

/* ── Aucune requête vers l'extérieur ──────────────────────────────────────── */
{
  const page = await browser.newPage();
  const external = new Set();
  page.on('request', r => {
    const u = new URL(r.url());
    if (u.protocol === 'data:' || u.protocol === 'blob:') return;   // ressources intégrées : aucune sortie réseau
    const h = u.hostname;
    if (h !== 'localhost' && h !== '127.0.0.1') external.add(h);
  });
  for (const route of ['/', '/articles/', '/la-recherche/', '/glossaire/', '/a-propos/',
                       '/mentions-legales/', '/confidentialite/',
                       '/articles/gouvernance-ostrom/', '/articles/maintenance-communs-numeriques/', '/comprendre/',
                       '/comprendre/qui-decide/', '/glossaire/a-z/', '/memoire/introduction/']) {
    await page.goto(BASE + route, { waitUntil: 'networkidle0' });
  }
  ok('Aucune requête vers un domaine tiers', external.size === 0,
     external.size ? [...external].join(', ') : 'toutes les ressources sont locales');
  await page.close();
}

/* ── Filtre du glossaire ──────────────────────────────────────────────────── */
{
  const page = await browser.newPage();
  await page.goto(BASE + '/glossaire/', { waitUntil: 'networkidle0' });
  const total = await page.$$eval('[data-glossterm]', els => els.length);
  await page.type('#q', 'ostrom');
  await new Promise(r => setTimeout(r, 250));
  const after = await page.$$eval('[data-glossterm]', els => els.filter(e => !e.hidden).length);
  // Accent-insensible : « legitimite » doit retrouver « légitimité »
  await page.$eval('#q', el => { el.value = ''; });
  await page.type('#q', 'legitimite');
  await new Promise(r => setTimeout(r, 250));
  const accent = await page.$$eval('[data-glossterm]', els => els.filter(e => !e.hidden).length);
  ok('Filtre du glossaire actif', after > 0 && after < total,
     `${total} termes → ${after} pour « ostrom »`);
  ok('Filtre insensible aux accents', accent > 0,
     `${accent} résultat(s) pour « legitimite »`);
  await page.close();
}

/* ── Barre de progression de lecture ──────────────────────────────────────── */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(BASE + '/articles/gouvernance-ostrom/', { waitUntil: 'networkidle0' });
  const before = await page.$eval('#progres span', el => el.dataset.valeur || '0');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 400));
  const after = await page.$eval('#progres span', el => parseFloat(el.dataset.valeur));
  ok('Barre de progression de lecture', after > 90, `${before}% → ${after.toFixed(0)}%`);
  await page.close();
}

/* ── Les portes de l'accueil réorganisent le champ ────────────────────────── */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  const formes = [];
  for (const d of await page.$$('.door')) {
    await d.hover();
    await new Promise(r => setTimeout(r, 150));
    formes.push(await page.evaluate(() => document.body.dataset.mode));
  }
  const attendu = ['parcours', 'collier', 'grille', 'fourche'];
  ok('Les portes réorganisent le champ', formes.join(',') === attendu.join(','), formes.join(' · '));
  await page.close();
}

/* ── Motif de points dessiné ──────────────────────────────────────────────── */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const painted = await page.evaluate(() => {
    const c = document.querySelector('canvas.champ, #c');
    if (!c || !c.width) return false;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true;
    return false;
  });
  ok('Champ de points dessiné sur le canvas', painted);
  await page.close();
}

/* ── Lisibilité sans JavaScript ───────────────────────────────────────────── */
{
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.goto(BASE + '/comprendre/qui-decide/', { waitUntil: 'domcontentloaded' });
  const words = await page.evaluate(() => document.body.innerText.trim().split(/\s+/).length);
  ok('Page lisible sans JavaScript', words > 300, `${words} mots rendus`);
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const portes = await page.$$eval('.door', els => els.filter(e => e.offsetHeight > 0 && e.getAttribute('href')).length);
  const titre = await page.$eval('h1', el => el.innerText.replace(/\s+/g, ' ').trim());
  ok('Accueil navigable sans JavaScript', portes === 4 && /communs/i.test(titre), `${portes} portes · « ${titre} »`);
  await page.close();
}

/* ── Liens internes tous valides ──────────────────────────────────────────── */
{
  const page = await browser.newPage();
  const routes = ['/', '/articles/', '/la-recherche/', '/glossaire/', '/a-propos/',
    '/mentions-legales/', '/confidentialite/',
    '/articles/quest-ce-quun-commun-numerique/', '/articles/administration-et-communs/',
    '/articles/institutionnalisation/', '/articles/gouvernance-ostrom/',
    '/articles/neuf-initiatives/', '/articles/appropriation-relation/',
    '/articles/maintenance-communs-numeriques/',
    '/comprendre/', '/comprendre/un-commun-avant-le-numerique/',
    '/comprendre/ce-que-change-le-numerique/', '/comprendre/libre-open-source-commun/',
    '/comprendre/qui-decide/', '/comprendre/qui-paie/',
    '/comprendre/trois-communs-trois-modeles/', '/comprendre/et-ladministration/'];
  const broken = [];
  const seen = new Set();
  for (const r of routes) {
    await page.goto(BASE + r, { waitUntil: 'domcontentloaded' });
    const hrefs = await page.$$eval('a[href]', els => els.map(e => e.getAttribute('href')));
    for (const h of hrefs) {
      if (!h.startsWith('/') || seen.has(h)) continue;
      seen.add(h);
      const res = await fetch(BASE + h, { method: 'HEAD' });
      if (!res.ok) broken.push(`${h} (${res.status})`);
    }
  }
  ok('Tous les liens internes répondent', broken.length === 0,
     broken.length ? broken.join(', ') : `${seen.size} liens vérifiés`);
  await page.close();
}

/* ── Redirections : cibles valides, aucune boucle ─────────────────────────── */
{
  const { redirects } = await import('./site.config.mjs');
  const casses = [];
  for (const [ancienne, nouvelle] of Object.entries(redirects)) {
    if (ancienne === nouvelle) { casses.push(`${ancienne} boucle sur elle-même`); continue; }
    const src = await fetch(BASE + ancienne);
    if (!src.ok) { casses.push(`${ancienne} absente (${src.status})`); continue; }
    const html = await src.text();
    const cible = (html.match(/url=([^"]+)"/) || [, ''])[1];
    if (cible === ancienne) { casses.push(`${ancienne} pointe sur elle-même`); continue; }
    const dst = await fetch(BASE + nouvelle, { method: 'HEAD' });
    if (!dst.ok) casses.push(`${ancienne} → ${nouvelle} (${dst.status})`);
  }
  ok('Redirections valides, sans boucle', casses.length === 0,
     casses.length ? casses.join(' · ') : `${Object.keys(redirects).length} anciennes URLs redirigées`);
}

/* ── L'accueil n'a pas été écrasé par une redirection ─────────────────────── */
{
  const html = await (await fetch(BASE + '/')).text();
  ok("Page d'accueil intacte", html.includes('Les communs') && html.includes('numériques</em>') && !html.includes('http-equiv="refresh"'),
     `${(html.length / 1024).toFixed(1)} Ko`);
}

/* ── Mémoire : toutes les pages, figures et tableaux ──────────────────────── */
{
  const { racine, chapitres } = await import('./memoire.config.mjs');
  const routes = [racine, ...chapitres.map(c => racine + c.slug + '/')];
  const absentes = [];
  for (const r of routes) {
    const res = await fetch(BASE + r, { method: 'HEAD' });
    if (!res.ok) absentes.push(`${r} (${res.status})`);
  }
  ok('Toutes les pages du mémoire répondent', absentes.length === 0,
     absentes.length ? absentes.join(', ') : `${routes.length} pages`);

  let tableaux = 0, figures = 0, mots = 0;
  for (const r of routes.slice(1)) {
    const html = await (await fetch(BASE + r)).text();
    tableaux += (html.match(/<table/g) || []).length;
    figures += (html.match(/Figure [1-4]<\/span>/g) || []).length;
    mots += html.replace(/<[^>]+>/g, ' ').split(/\s+/).length;
  }
  ok('Les 16 tableaux sont rendus', tableaux === 16, `${tableaux} tableaux`);
  ok('Les 4 figures sont rendues', figures === 4, `${figures} figures`);
  ok('Volume de texte du mémoire', mots > 50000, `${mots.toLocaleString('fr-FR')} mots (balises exclues)`);
}

/* ── Le sommaire suit la lecture ──────────────────────────────────────────── */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(BASE + '/memoire/1-3-institutionnalisation/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const h = document.querySelectorAll('h3[id]');
    if (h.length > 1) h[h.length - 1].scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));
  const actif = await page.$$eval('.plan a.ici', els => els.length);
  ok('Sommaire latéral qui suit la lecture', actif === 1, `${actif} entrée surlignée`);
  await page.close();
}

/* ── Glossaire de A à Z : toutes les définitions ──────────────────────────── */
{
  const grille = await (await fetch(BASE + '/glossaire/')).text();
  const az = await (await fetch(BASE + '/glossaire/a-z/')).text();
  const nGrille = (grille.match(/data-glossterm=/g) || []).length, nAz = (az.match(/class="entree"/g) || []).length;
  ok('Glossaire de A à Z complet', nAz > 0 && nAz === nGrille, `${nAz} définitions pour ${nGrille} mots`);
}

/* ── Contraste : aucun gris sous le seuil WCAG AA en couleur de texte ─────── */
{
  // Sur le fond #FAFAF6 ces trois gris donnent 2,94:1, 2,40:1 et 1,73:1,
  // pour un minimum requis de 4,5:1 (3:1 pour le grand texte).
  const bannis = ['#8A968D', '#9AA79B', '#B9C4B6'];
  const racine = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs');
  const fichiers = [];
  (function parcourir(d) {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) parcourir(p);
      else if (e.endsWith('.html')) fichiers.push(p);
    }
  })(racine);
  const fautifs = [];
  for (const f of fichiers) {
    const contenu = readFileSync(f, 'utf8');
    for (const g of bannis) {
      const n = (contenu.match(new RegExp('color:' + g, 'gi')) || []).length;
      if (n) fautifs.push(`${f.replace(racine, '')} ${g} ×${n}`);
    }
  }
  ok('Contraste du texte conforme WCAG AA', fautifs.length === 0,
     fautifs.length ? fautifs.slice(0, 3).join(' · ') : `${fichiers.length} pages contrôlées`);
}

} finally {
  await browser.close();
}

/* ── Rapport ──────────────────────────────────────────────────────────────── */
console.log('\nVérification du site compilé\n');
let failed = 0;
for (const { n, c, d } of results) {
  if (!c) failed++;
  console.log(`  ${c ? '✓' : '✗'} ${n.padEnd(42)} ${d}`);
}
console.log(`\n  ${results.length - failed}/${results.length} contrôles passés\n`);
process.exit(failed ? 1 : 0);
