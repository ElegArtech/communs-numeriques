// Édition PDF du mémoire, fabriquée à partir de la version publiée sur le site.
//
//   npm run build && npm run pdf
//
// Le PDF n'est que le reflet des pages web du mémoire (docs/memoire/) : même
// texte, mêmes tableaux saisis à la main, même anonymisation. Il est écrit dans
// build/tmp/ pour relecture ; une fois relu, il est copié dans static/ pour être
// publié (voir maintenance/README.md). Un contrôle refuse le fichier s'il contient un
// élément permettant d'identifier une personne interrogée.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';
import { browserOptions } from './browser.mjs';
import { site } from './site.config.mjs';
import { chapitres, parties } from './memoire.config.mjs';
import { INTERDITS, PDF_PUBLIC } from './interdits.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const SORTIE = join(ROOT, 'build', 'tmp');
const NOM = PDF_PUBLIC;


const ENCRE = '#1E2A23', ACCENT = '#127552', SECOND = '#4A5850', FILET = '#D8DDD3';
const echapper = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const nettoyer = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const aujourdhui = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// Le corps d'un chapitre tel que publié : styles en ligne retirés (sauf dans les
// figures SVG), liens internes rendus absolus pour rester utilisables hors du site.
function chapitre(ch) {
  const src = readFileSync(join(DOCS, 'memoire', ch.slug, 'index.html'), 'utf8');
  const titre = nettoyer(src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]);
  let c = src.match(/<article[^>]*>([\s\S]*?)<\/article>/)[1];
  c = c.replace(/<span style="color:#5A685F">(\[[^\]]*\])<\/span>/g, '<span class="ref">$1</span>');
  c = c.split(/(<svg[\s\S]*?<\/svg>)/).map((x, i) => (i % 2 ? x : x.replace(/\s(style|class)="[^"]*"/g, ''))).join('');
  c = c.replace(/href="\/(?!\/)/g, `href="${site.origin}/`);
  c = c.replace(/<li>\s*<span>[\u2014•]<\/span>\s*/g, '<li>');   // une seule puce
  return { titre, corps: c };
}

const motif = `<svg viewBox="0 0 120 112" width="150" aria-hidden="true">
  <g fill="none" stroke="${ENCRE}" stroke-width="1.1">
    <circle cx="42" cy="42" r="32"/><circle cx="78" cy="42" r="32"/><circle cx="60" cy="72" r="32"/></g>
  <circle cx="60" cy="52" r="4" fill="${ACCENT}"/></svg>`;

function document() {
  let partie = undefined;
  const sommaire = [], corps = [];
  for (const ch of chapitres) {
    const { titre, corps: c } = chapitre(ch);
    const p = parties.find((x) => x.nom === ch.partie);
    if (ch.partie !== partie && ch.partie) {
      sommaire.push(`<li class="partie">${echapper(ch.partie)}${p && p.libelle ? ` : ${echapper(p.libelle)}` : ''}</li>`);
    }
    partie = ch.partie;
    sommaire.push(`<li><a href="#${ch.slug.replace(/\//g, '-')}">${echapper(titre)}</a></li>`);
    corps.push(`<section class="chapitre" id="${ch.slug.replace(/\//g, '-')}">
      ${ch.partie ? `<p class="surtitre">${echapper(ch.partie)}${p && p.libelle ? ` · ${echapper(p.libelle)}` : ''}</p>` : ''}
      <h1>${echapper(titre)}</h1>
      <p class="resume">${echapper(ch.resume)}</p>
      <div class="texte">${c}</div>
    </section>`);
  }
  const polices = (nom, style, fichier) => `@font-face{font-family:'${nom}';font-style:${style};font-weight:400 700;src:url('${pathToFileURL(join(ROOT, 'static', 'fonts', fichier)).href}') format('woff2')}`;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>Les facteurs d'institutionnalisation des communs numériques au sein de l'administration · version publique</title>
<meta name="author" content="${site.author}">
<style>
${polices('Instrument Sans', 'normal', 'instrument-sans-normal-latin.woff2')}
${polices('Instrument Sans', 'italic', 'instrument-sans-italic-latin.woff2')}
${polices('Instrument Serif', 'normal', 'instrument-serif-normal-latin.woff2')}
${polices('Instrument Serif', 'italic', 'instrument-serif-italic-latin.woff2')}
@page{size:A4;margin:22mm 20mm 24mm}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font:400 10.4pt/1.62 'Instrument Sans',sans-serif;color:${ENCRE};hyphens:auto;text-align:justify}
h1,h2,h3,h4{font-family:'Instrument Serif',serif;font-weight:400;letter-spacing:-.01em;text-align:left;hyphens:manual;break-after:avoid}
a{color:inherit;text-decoration:none}

.couverture{height:calc(297mm - 46mm);padding:10mm 0 0;display:flex;flex-direction:column;break-after:page}
.couverture .sur{font-size:9pt;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${ACCENT};margin:0}
.couverture h1{font-size:34pt;line-height:1.04;margin:14mm 0 8mm;max-width:150mm}
.couverture h1 em{color:${ACCENT}}
.couverture .edition{font:italic 400 15pt/1.35 'Instrument Serif',serif;color:${SECOND};margin:0;max-width:130mm}
.couverture .motif{margin-top:auto}
.couverture .qui{margin-top:12mm;padding-top:6mm;border-top:1px solid ${ENCRE};display:grid;grid-template-columns:1fr 1fr;gap:3mm 10mm;font-size:9.5pt}
.couverture .qui b{display:block;font-weight:600}

.avertissement{break-after:page;padding-top:30mm}
.avertissement h2{font-size:22pt;margin:0 0 6mm}
.avertissement .cadre{border:1px solid ${ACCENT};border-left:3px solid ${ACCENT};padding:6mm 7mm;margin-bottom:8mm}
.avertissement p{margin:0 0 3.5mm;text-align:left}
.avertissement ul{margin:0 0 3.5mm;padding-left:5mm}
.avertissement li{margin-bottom:2mm;text-align:left}
.avertissement li::marker{color:${ACCENT}}
.avertissement .fin{font-size:9pt;color:${SECOND}}

.sommaire{break-after:page}
.sommaire h2{font-size:22pt;margin:0 0 8mm}
.sommaire ol{list-style:none;margin:0;padding:0}
.sommaire li{padding:1.6mm 0;border-bottom:1px solid ${FILET};font-size:10.5pt;text-align:left}
.sommaire li.partie{border:0;padding-top:6mm;font-size:8.5pt;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:${ACCENT}}

.chapitre{break-before:page}
.surtitre{font-size:8.5pt;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:${ACCENT};margin:0 0 3mm;text-align:left}
.chapitre > h1{font-size:24pt;line-height:1.08;margin:0 0 4mm}
.resume{font:italic 400 12.5pt/1.4 'Instrument Serif',serif;color:${SECOND};margin:0 0 8mm;padding-bottom:6mm;border-bottom:1px solid ${ENCRE};text-align:left}
.texte p{margin:0 0 2.6mm;orphans:3;widows:3}
.texte h2{font-size:17pt;margin:8mm 0 3mm}
.texte h3{font-size:14pt;margin:6mm 0 2.5mm}
.texte h4{font-size:12pt;margin:5mm 0 2mm}
.texte ul,.texte ol{margin:0 0 3mm;padding-left:5mm}
.texte li{margin-bottom:1.2mm}
.texte li::marker{color:${ACCENT}}
.texte h5{font:600 10.4pt/1.4 'Instrument Sans',sans-serif;margin:4.5mm 0 1.5mm;text-align:left;break-after:avoid}
.ref{font-size:.82em;color:${SECOND};white-space:nowrap}
.texte figure{margin:5mm 0;break-inside:avoid}
/* une figure tient toujours sur une page : seule sa taille change */
.texte figure svg{display:block;margin:0 auto;width:auto !important;height:auto !important;max-width:100% !important;max-height:215mm !important}
/* un tableau peut se poursuivre sur la page suivante, son en-tête se répète */
.texte figure:has(table){break-inside:auto}
.texte table{width:100%;border-collapse:collapse;font-size:8.6pt;line-height:1.4;text-align:left}
.texte thead{display:table-header-group}
.texte tr{break-inside:avoid}
.texte th{text-align:left;vertical-align:bottom;padding:2mm 2.4mm;border-bottom:1.2px solid ${ENCRE};font-weight:600}
.texte td{vertical-align:top;padding:2mm 2.4mm;border-bottom:.6px solid ${FILET}}
.texte td p,.texte th p{margin:0 0 1mm}
.texte figcaption{font-size:8.6pt;color:${SECOND};margin-top:2.5mm;text-align:left}
.texte figcaption span{font-weight:600;color:${ENCRE}}
</style></head><body>

<section class="couverture">
  <p class="sur">Mémoire de recherche · version publique</p>
  <h1>Les facteurs d'<em>institutionnalisation</em> des communs numériques au sein de l'administration</h1>
  <p class="edition">Édition tirée de la version publiée sur ${site.domain}</p>
  <div class="motif">${motif}</div>
  <div class="qui">
    <div><b>${site.author}</b>Executive Master 2 « Management des Systèmes d'Information et de Connaissance »</div>
    <div><b>Direction : Miguel Liottier</b>Mémoire soutenu le 10 juillet 2025</div>
  </div>
</section>

<section class="avertissement">
  <h2>À propos de cette édition</h2>
  <div class="cadre">
    <p><b>Ce document est le reflet de la version du mémoire publiée sur ${site.domain}.</b> Il n'est pas la version soutenue le 10 juillet 2025, dont il diffère sur trois points :</p>
    <ul>
      <li>les retranscriptions des treize entretiens (pages 125 à 206 de la version soutenue) n'y figurent pas ;</li>
      <li>les personnes interrogées y sont anonymisées : leurs fonctions et leurs organisations ne sont pas diffusées, conformément aux engagements pris auprès d'elles ;</li>
      <li>la mise en forme et la pagination sont propres à cette édition.</li>
    </ul>
  </div>
  <p>Les chercheuses et chercheurs qui auraient besoin d'éléments complémentaires dans le cadre de leurs travaux peuvent contacter l'auteur : ${site.email}.</p>
  <p>Pour citer ce travail : Berge A., <i>Les facteurs d'institutionnalisation des communs numériques au sein de l'administration</i>, mémoire d'Executive Master 2 MSIC, dir. M. Liottier, soutenu le 10 juillet 2025.</p>
  <p class="fin">Texte diffusé sous licence ${site.licence} (${site.licenceUrl}), sous réserve des éléments tiers cités. Édition générée le ${aujourdhui} à partir de ${site.origin}/memoire/.</p>
</section>

<section class="sommaire">
  <h2>Sommaire</h2>
  <ol>${sommaire.join('')}</ol>
</section>

${corps.join('\n')}
</body></html>`;
}

mkdirSync(SORTIE, { recursive: true });
const source = join(SORTIE, 'memoire-impression.html');
writeFileSync(source, document());

const browser = await puppeteer.launch(await browserOptions());
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(source).href, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: join(SORTIE, NOM), format: 'A4', printBackground: true, preferCSSPageSize: true,
    outline: true, tagged: true, displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="width:100%;padding:0 20mm;font:7.5pt sans-serif;color:#5A685F;display:flex;justify-content:space-between">
      <span>Les facteurs d'institutionnalisation des communs numériques · version publique</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });
} finally {
  await browser.close();
}

// Contrôle : aucun élément identifiant ne doit avoir survécu.
const texte = execFileSync('pdftotext', [join(SORTIE, NOM), '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const trouves = INTERDITS.filter((x) => texte.includes(x));
const pages = Number((execFileSync('pdfinfo', [join(SORTIE, NOM)], { encoding: 'utf8' }).match(/Pages:\s+(\d+)/) || [])[1]);
if (trouves.length) {
  console.error(`✗ Le PDF contient des éléments identifiants : ${trouves.join(' · ')}`);
  process.exit(1);
}
console.log(`✓ ${NOM} : ${pages} pages, aucun élément identifiant, dans build/tmp/ : à relire, puis copier dans static/ pour publier`);
