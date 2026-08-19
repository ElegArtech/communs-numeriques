#!/usr/bin/env node
/* Génère les pages web du mémoire.
 *
 *   build/memoire.json                    (texte structuré, extrait du PDF)
 *   src/memoire/tableaux/tableaux.json    (tableaux saisis à la main)
 *   static/figures/*.svg                  (figures compilées depuis Mermaid)
 *        ──▶  docs/memoire/<slug>/index.html
 *
 * Une page par section, un sommaire latéral qui suit la lecture, une ancre par
 * sous-section, un lien précédent/suivant et une barre de progression.
 *
 * L'en-tête et le pied de page sont repris de la page d'accueil déjà compilée :
 * la navigation du site reste ainsi unique et cohérente.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from './site.config.mjs';
import { racine, chapitres, parties } from './memoire.config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'docs');

const ENCRE = '#1E2A23', FOND = '#FAFAF6', ACCENT = '#127552';
const SECONDAIRE = '#4A5850', TERTIAIRE = '#5A685F';
const FILET = '#D8DDD3', FILET_PALE = '#EAEDE6', PAPIER = '#F4F7F2';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Met en relief les références bibliographiques [Auteur, année]. */
const refs = s => esc(s).replace(/\[([^\]]{2,90})\]/g,
  `<span style="color:${TERTIAIRE}">[$1]</span>`);

const slugifier = s => s.toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

/* ── 1. Découpage du texte en chapitres ───────────────────────────────────── */

function decouper(elements) {
  const parCle = new Map(chapitres.map(c => [c.cle, { ...c, elements: [] }]));
  let courant = null;

  for (const e of elements) {
    if (e.type === 'titre') {
      // Une section numérotée ou une annexe ouvre un nouveau chapitre
      const cle = e.numero || (e.texte.match(/^(Annexe \d+)/) || [])[1] || e.texte;
      if (parCle.has(cle)) {
        courant = parCle.get(cle);
        courant.titreOriginal = e.texte;
        courant.numero = e.numero || null;
        continue;                       // le titre devient celui de la page
      }
      // « PARTIE I » et « Annexes » ne portent pas de contenu propre
      if (e.niveau === 1 && /^(PARTIE|Annexes$)/.test(e.texte)) continue;
    }
    if (courant) courant.elements.push(e);
  }

  return chapitres.map(c => parCle.get(c.cle));
}

/* ── 2. Rendu du contenu ──────────────────────────────────────────────────── */

function rendreTableau(t) {
  const cellule = (c, balise) => {
    const lignes = c.split('\n').filter(Boolean);
    const contenu = lignes.length > 1 && lignes.every(l => l.startsWith('• '))
      ? `<ul style="margin:0;padding-left:1.1em;list-style:none">${lignes
          .map(l => `<li style="position:relative;margin:0 0 .35em">
            <span style="position:absolute;left:-1.1em;color:${ACCENT}">•</span>${refs(l.slice(2))}</li>`)
          .join('')}</ul>`
      : lignes.map(l => `<p style="margin:0 0 .45em">${refs(l)}</p>`).join('');
    const style = balise === 'th'
      ? `text-align:left;vertical-align:bottom;padding:12px 16px;border-bottom:1.5px solid ${ENCRE};font-size:13px;letter-spacing:.04em;font-weight:600`
      : `text-align:left;vertical-align:top;padding:14px 16px;border-bottom:1px solid ${FILET};font-size:14.5px;line-height:1.55`;
    return `<${balise} style="${style}">${contenu}</${balise}>`;
  };

  return `
<figure style="margin:44px 0">
  <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;border-top:1px solid ${ENCRE}">
    <table style="width:100%;border-collapse:collapse;min-width:min(100%,560px)">
      <thead><tr>${t.colonnes.map(c => cellule(c, 'th')).join('')}</tr></thead>
      <tbody>${t.rangs.map(r => `<tr>${r.map(c => cellule(c, 'td')).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>
  <figcaption style="margin-top:14px;font-size:13px;line-height:1.55;color:${SECONDAIRE}">
    <span style="font-weight:600;color:${ENCRE}">${String(t.num).startsWith('A') ? 'Tableau' : 'Tableau ' + t.num}</span> — ${refs(t.legende)}
    ${t.note ? `<span style="display:block;margin-top:6px;font-style:italic">${refs(t.note)}</span>` : ''}
  </figcaption>
</figure>`;
}

function rendreFigure(num, legende) {
  const chemin = join(ROOT, 'static', 'figures', `figure-${num}.svg`);
  if (!existsSync(chemin)) return '';
  const svg = readFileSync(chemin, 'utf8').replace(/<\?xml[^?]*\?>/, '');
  return `
<figure style="margin:44px 0">
  <div style="overflow-x:auto;background:${PAPIER};border:1px solid ${FILET};border-radius:2px;padding:20px">
    <div style="min-width:min(100%,520px)">${svg}</div>
  </div>
  <figcaption style="margin-top:14px;font-size:13px;line-height:1.55;color:${SECONDAIRE}">
    <span style="font-weight:600;color:${ENCRE}">Figure ${num}</span> — ${refs(legende)}
  </figcaption>
</figure>`;
}

function rendreContenu(chapitre, tableaux) {
  const ancres = [];
  const html = [];

  for (const e of chapitre.elements) {
    switch (e.type) {
      case 'titre': {
        const texte = e.numero ? `${e.numero}. ${e.texte}` : e.texte;
        const id = slugifier(texte);
        const n = Math.min(e.niveau, 4);
        ancres.push({ id, texte, niveau: n });
        const tailles = { 2: 'clamp(26px,3.2vw,34px)', 3: 'clamp(21px,2.4vw,26px)', 4: '19px' };
        const marges = { 2: '64px 0 20px', 3: '48px 0 16px', 4: '36px 0 12px' };
        html.push(`<h${n} id="${id}" style="font-family:'Instrument Serif',serif;font-weight:400;`
          + `font-size:${tailles[n] || '18px'};line-height:1.2;letter-spacing:-.01em;`
          + `margin:${marges[n] || '28px 0 10px'};color:${ENCRE};scroll-margin-top:84px">`
          + `<a href="#${id}" style="color:inherit;text-decoration:none">${esc(texte)}</a></h${n}>`);
        const attendu = chapitre.tableauxApres && chapitre.tableauxApres[id];
        if (attendu) {
          const t = tableaux.find(x => String(x.num) === String(attendu));
          if (t) html.push(rendreTableau(t));
        }
        break;
      }
      case 'para':
        html.push(`<p style="margin:0 0 20px;font-size:17px;line-height:1.72;color:${ENCRE};text-wrap:pretty">${refs(e.texte)}</p>`);
        break;
      case 'liste':
        html.push(`<ul style="margin:0 0 24px;padding-left:1.4em;list-style:none">${e.items.map(i =>
          `<li style="position:relative;margin:0 0 12px;font-size:17px;line-height:1.7;color:${ENCRE}">`
          + `<span style="position:absolute;left:-1.4em;color:${ACCENT}">—</span>${refs(i)}</li>`).join('')}</ul>`);
        break;
      case 'figure':
        html.push(rendreFigure(e.num, e.legende));
        break;
      case 'tableau':
      case 'legende': {
        // Les blocs de tableau extraits du PDF sont remplacés par la version
        // saisie à la main, insérée à l'emplacement de sa légende.
        const num = e.num;
        const t = tableaux.find(x => x.num === num);
        if (t && !html.some(h => h.includes(`Tableau ${num}</span>`))) html.push(rendreTableau(t));
        break;
      }
      case 'tableau_brut':
        break;                  // débris de tableau : la version saisie fait foi
    }
  }
  return { html: html.join('\n'), ancres };
}

/* ── 3. Sommaire ──────────────────────────────────────────────────────────── */

function sommaireLateral(chapitreCourant, ancres) {
  // On parcourt les chapitres dans l'ordre du mémoire et on insère un
  // intertitre chaque fois qu'on change de partie : Conclusion et
  // Bibliographie restent ainsi après la partie III, à leur place.
  const groupes = [];
  let partieCourante = Symbol('aucune');
  for (const c of chapitres) {
    if (c.partie !== partieCourante) {
      partieCourante = c.partie;
      groupes.push({ nom: c.partie, items: [] });
    }
    groupes[groupes.length - 1].items.push(c);
  }

  const lien = c => {
    const actif = c.slug === chapitreCourant.slug;
    const sous = actif && ancres.length
      ? `<ul style="margin:8px 0 4px;padding:0 0 0 12px;list-style:none;border-left:1px solid ${FILET}">${
          ancres.filter(a => a.niveau <= 3).map(a =>
            `<li style="margin:0 0 6px"><a href="#${a.id}" data-ancre="${a.id}"
               style="display:block;text-decoration:none;color:${TERTIAIRE};font-size:12.5px;line-height:1.45">${esc(a.texte)}</a></li>`
          ).join('')}</ul>`
      : '';
    return `<li style="margin:0 0 10px">
      <a href="${racine}${c.slug}/" ${actif ? 'aria-current="page"' : ''}
         style="display:block;text-decoration:none;font-size:13.5px;line-height:1.45;
                color:${actif ? ENCRE : SECONDAIRE};font-weight:${actif ? '600' : '400'};
                border-left:2px solid ${actif ? ACCENT : 'transparent'};padding-left:10px;margin-left:-12px">
        ${c.numero ? `<span style="color:${TERTIAIRE};font-weight:400">${c.numero}.</span> ` : ''}${esc(c.titre)}
      </a>${sous}</li>`;
  };

  return groupes.map(g => `
    ${g.nom ? `<p style="margin:22px 0 10px;font-size:11px;letter-spacing:.13em;text-transform:uppercase;
                 font-weight:600;color:${TERTIAIRE}">${esc(g.nom)}</p>` : ''}
    <ul style="margin:0;padding:0;list-style:none">${g.items.map(lien).join('')}</ul>`).join('');
}

/* ── 4. Page ──────────────────────────────────────────────────────────────── */

function gabarit({ titre, description, url, corps, entete, pied, styles }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titre)} — Le mémoire — ${esc(site.name)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(site.author)}">
${site.noindex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow">'}
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="${site.locale}">
<meta property="og:title" content="${esc(titre)} — Le mémoire">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.origin}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="${FOND}">
<link rel="stylesheet" href="/fonts/fonts.css">
${styles}
<style>
.memoire-grille{display:grid;grid-template-columns:minmax(0,264px) minmax(0,1fr);gap:clamp(32px,5vw,72px);
  max-width:1180px;margin:0 auto;padding:0 clamp(20px,4vw,48px)}
.memoire-sommaire{position:sticky;top:74px;align-self:start;max-height:calc(100vh - 96px);
  overflow-y:auto;padding:32px 0 40px;scrollbar-width:thin}
.memoire-sommaire a[data-ancre].actif{color:${ENCRE} !important;font-weight:600}
.memoire-sommaire summary{display:none}
@media (max-width:900px){
  .memoire-grille{grid-template-columns:minmax(0,1fr)}
  .memoire-sommaire{position:static;max-height:none;padding:20px 0 0;
    border-bottom:1px solid ${FILET};margin-bottom:8px}
  .memoire-sommaire summary{display:block;cursor:pointer;font-size:12px;letter-spacing:.12em;
    text-transform:uppercase;font-weight:600;color:${ENCRE};padding:14px 0;list-style:none}
  .memoire-sommaire summary::after{content:' ▾';color:${ACCENT}}
  .memoire-sommaire details[open] summary::after{content:' ▴'}
  .memoire-sommaire > details > div{padding-bottom:18px}
}
</style>
</head>
<body>
${entete}
${corps}
${pied}
<script>${readFileSync(join(HERE, 'runtime.js'), 'utf8')}</script>
</body>
</html>
`;
}

/* ── 5. Exécution ─────────────────────────────────────────────────────────── */

const elements = JSON.parse(readFileSync(join(ROOT, 'build', 'memoire.json'), 'utf8'));
const tableaux = JSON.parse(readFileSync(
  join(ROOT, 'src', 'memoire', 'tableaux', 'tableaux.json'), 'utf8'));

// En-tête, pied et styles repris de la page d'accueil compilée
const accueil = readFileSync(join(OUT, 'index.html'), 'utf8');
let entete = (accueil.match(/<header[\s\S]*?<\/header>/) || [''])[0];
// Le gabarit est repris de l'accueil : on déplace l'état actif du menu vers
// « La recherche », dont le mémoire est une sous-partie.
const ACTIF = 'border-bottom:2px solid oklch(0.50 0.12 160)';
const INACTIF = 'border-bottom:2px solid transparent';
entete = entete.replace(/(<a href="\/"[^>]*?)color:#1E2A23;border-bottom:2px solid oklch\(0\.50 0\.12 160\)/,
  `$1color:#5A685F;${INACTIF}`);
entete = entete.replace(/(<a [^>]*href="\/la-recherche\/"[^>]*?)color:#5A685F;border-bottom:2px solid transparent/,
  `$1color:#1E2A23;${ACTIF}`);
const pied = (accueil.match(/<footer[\s\S]*?<\/footer>/) || [''])[0];
const styles = (accueil.match(/<style>[\s\S]*?<\/style>/) || [''])[0];

const pages = decouper(elements);
console.log('Génération des pages du mémoire\n');

let motsTotal = 0;
pages.forEach((ch, i) => {
  const { html, ancres } = rendreContenu(ch, tableaux);
  const precedent = pages[i - 1], suivant = pages[i + 1];
  const url = site.origin + racine + ch.slug + '/';
  const titreAffiche = ch.numero ? `${ch.numero}. ${ch.titreOriginal || ch.titre}` : (ch.titreOriginal || ch.titre);

  const nav = (c, sens) => c ? `<a href="${racine}${c.slug}/"
      style="display:block;text-decoration:none;color:${ENCRE};max-width:46%;${sens === 'suivant' ? 'text-align:right' : ''}">
      <span style="display:block;font-size:11px;letter-spacing:.13em;text-transform:uppercase;font-weight:600;color:${TERTIAIRE};margin-bottom:6px">
        ${sens === 'suivant' ? 'Suivant' : 'Précédent'}</span>
      <span style="font-family:'Instrument Serif',serif;font-size:19px;line-height:1.25">
        ${sens === 'suivant' ? '' : '← '}${esc(c.titre)}${sens === 'suivant' ? ' →' : ''}</span></a>` : '<span></span>';

  const corps = `
<div style="position:fixed;top:0;left:0;right:0;height:2px;z-index:70;background:transparent">
  <div data-ref="barRef" style="height:100%;width:0;background:${ACCENT}"></div>
</div>

<div class="memoire-grille">
  <nav class="memoire-sommaire" aria-label="Sommaire du mémoire">
    <details open>
      <summary>Sommaire du mémoire</summary>
      <div>
        <a href="${racine}" style="display:block;text-decoration:none;font-family:'Instrument Serif',serif;
           font-size:19px;line-height:1.25;color:${ENCRE};padding-bottom:14px;border-bottom:1px solid ${FILET};margin-bottom:4px">
          Le mémoire</a>
        ${sommaireLateral(ch, ancres)}
        <a href="${site.pdf}" style="display:inline-block;margin-top:26px;font-size:12px;letter-spacing:.1em;
           text-transform:uppercase;font-weight:600;color:${ENCRE};text-decoration:none;
           border-bottom:2px solid ${ACCENT};padding-bottom:3px">PDF · 124 p.</a>
      </div>
    </details>
  </nav>

  <main style="padding:clamp(28px,4vw,56px) 0 clamp(56px,7vw,96px);min-width:0">
    <nav aria-label="Fil d'Ariane" style="font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;
         font-weight:600;color:${TERTIAIRE};margin-bottom:26px">
      <a href="/la-recherche/" style="color:${TERTIAIRE};text-decoration:none">La recherche</a>
      <span aria-hidden="true"> / </span>
      <a href="${racine}" style="color:${TERTIAIRE};text-decoration:none">Le mémoire</a>
      ${ch.partie ? `<span aria-hidden="true"> / </span><span style="color:${ENCRE}">${esc(ch.partie)}</span>` : ''}
    </nav>

    <h1 style="font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(34px,5vw,54px);
        line-height:1.06;letter-spacing:-.015em;margin:0 0 18px;color:${ENCRE};text-wrap:balance">
      ${esc(titreAffiche)}</h1>
    <p style="margin:0 0 6px;font-size:16px;line-height:1.65;color:${SECONDAIRE};max-width:60ch">${esc(ch.resume)}</p>
    <hr style="border:0;border-top:1px solid ${ENCRE};margin:30px 0 34px">

    <article style="max-width:72ch">
${html}
    </article>

    <nav style="display:flex;justify-content:space-between;gap:24px;margin-top:64px;padding-top:26px;
         border-top:1px solid ${ENCRE}">${nav(precedent, 'precedent')}${nav(suivant, 'suivant')}</nav>
  </main>
</div>`;

  const dossier = join(OUT, 'memoire', ch.slug);
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, 'index.html'),
    gabarit({ titre: ch.titre, description: ch.resume, url, corps, entete, pied, styles }));

  const mots = ch.elements.filter(e => e.type === 'para')
    .reduce((n, e) => n + e.texte.split(/\s+/).length, 0);
  motsTotal += mots;
  console.log(`  ${(racine + ch.slug + '/').padEnd(42)} ${String(mots).padStart(6)} mots · ${ancres.length} ancres`);
});

/* ── Page d'accueil du mémoire : le sommaire complet ─────────────────────── */

const MINUTES = m => Math.max(1, Math.round(m / 220));   // ~220 mots/minute

const sommaireComplet = pages.map(ch => {
  const { ancres } = rendreContenu(ch, tableaux);
  const mots = ch.elements.filter(e => e.type === 'para')
    .reduce((n, e) => n + e.texte.split(/\s+/).length, 0);
  return { ch, ancres, mots };
});

const parPartie = [];
{
  let partieCourante = Symbol('aucune');
  for (const x of sommaireComplet) {
    if (x.ch.partie !== partieCourante) {
      partieCourante = x.ch.partie;
      const def = parties.find(p => p.nom === x.ch.partie) || { nom: x.ch.partie, libelle: null };
      parPartie.push({ ...def, items: [] });
    }
    parPartie[parPartie.length - 1].items.push(x);
  }
}

const listeIndex = parPartie.map(g => `
  <section style="margin:0 0 clamp(40px,5vw,64px)">
    ${g.nom ? `<div style="margin:0 0 18px;padding-bottom:12px;border-bottom:1px solid ${ENCRE}">
        <p style="margin:0;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:${TERTIAIRE}">${esc(g.nom)}</p>
        ${g.libelle ? `<p style="margin:8px 0 0;font-family:'Instrument Serif',serif;font-size:clamp(21px,2.4vw,27px);line-height:1.2">${esc(g.libelle)}</p>` : ''}
      </div>` : ''}
    <ol style="list-style:none;margin:0;padding:0">
      ${g.items.map(({ ch, ancres, mots }) => `
      <li style="border-bottom:1px solid ${FILET}">
        <a href="${racine}${ch.slug}/" style="display:block;text-decoration:none;color:${ENCRE};padding:22px 0">
          <div style="display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px 20px">
            <h3 style="margin:0;font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(20px,2.2vw,25px);line-height:1.25">
              ${ch.numero ? `<span style="color:${TERTIAIRE}">${ch.numero}.</span> ` : ''}${esc(ch.titre)}</h3>
            <span style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;color:${TERTIAIRE};white-space:nowrap">
              ${MINUTES(mots)} min</span>
          </div>
          <p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:${SECONDAIRE};max-width:70ch">${esc(ch.resume)}</p>
          ${ancres.filter(a => a.niveau === 3).length ? `<p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:${TERTIAIRE}">${
            ancres.filter(a => a.niveau === 3).map(a => esc(a.texte)).join(' · ')}</p>` : ''}
        </a>
      </li>`).join('')}
    </ol>
  </section>`).join('');

const corpsIndex = `
<section style="border-bottom:1px solid ${ENCRE}">
  <div style="max-width:1180px;margin:0 auto;padding:clamp(30px,4vw,52px) clamp(20px,4vw,48px) clamp(34px,4vw,52px)">
    <nav aria-label="Fil d'Ariane" style="font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;color:${TERTIAIRE};margin-bottom:24px">
      <a href="/la-recherche/" style="color:${TERTIAIRE};text-decoration:none">La recherche</a>
      <span aria-hidden="true"> / </span><span style="color:${ENCRE}">Le mémoire</span>
    </nav>
    <h1 style="font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(36px,6.4vw,84px);line-height:1.02;letter-spacing:-.018em;margin:0 0 22px;text-wrap:balance">
      Les facteurs d'<em style="font-style:italic;color:${ACCENT}">institutionnalisation</em> des communs numériques au sein de l'administration</h1>
    <div style="display:flex;flex-wrap:wrap;gap:10px 28px;font-size:13px;color:${SECONDAIRE};margin-bottom:26px">
      <span>Alexandre Berge</span><span>Executive Master 2 MSIC</span>
      <span>Dir. Miguel Liottier</span><span>Soutenu le 10 juillet 2025</span>
    </div>
    <p style="margin:0 0 28px;font-size:17px;line-height:1.7;color:${ENCRE};max-width:66ch;text-wrap:pretty">
      Texte intégral de la version publique, en lecture libre : ${pages.length} chapitres,
      ${motsTotal.toLocaleString('fr-FR')} mots, ${tableaux.length} tableaux et 4 figures.
      Les retranscriptions des treize entretiens, confidentielles, n'y figurent pas —
      conformément aux engagements pris auprès des personnes interrogées.</p>
    <div style="display:flex;flex-wrap:wrap;gap:14px 26px;align-items:center">
      <a href="${racine}${pages[0].slug}/" style="display:inline-block;background:${ENCRE};color:${FOND};
         text-decoration:none;padding:13px 26px;font-size:13px;letter-spacing:.09em;text-transform:uppercase;font-weight:600">
        Commencer la lecture</a>
      <a href="${site.pdf}" style="font-size:13px;letter-spacing:.09em;text-transform:uppercase;font-weight:600;
         color:${ENCRE};text-decoration:none;border-bottom:2px solid ${ACCENT};padding-bottom:3px">
        Télécharger le PDF · 124 p.</a>
    </div>
  </div>
</section>

<main style="max-width:1180px;margin:0 auto;padding:clamp(40px,5vw,64px) clamp(20px,4vw,48px) clamp(56px,7vw,96px)">
  ${listeIndex}
</main>`;

mkdirSync(join(OUT, 'memoire'), { recursive: true });
writeFileSync(join(OUT, 'memoire', 'index.html'), gabarit({
  titre: 'Le mémoire',
  description: "Texte intégral du mémoire « Les facteurs d'institutionnalisation des communs numériques au sein de l'administration » : " + pages.length + " chapitres en lecture libre, tableaux et figures compris.",
  url: site.origin + racine,
  corps: corpsIndex, entete, pied, styles,
}));

console.log(`  ${racine.padEnd(42)} sommaire complet`);
console.log(`\n  ${pages.length + 1} pages · ${motsTotal} mots · ${tableaux.length} tableaux`);
