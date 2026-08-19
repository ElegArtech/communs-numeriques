#!/usr/bin/env node
/* Compile les figures du mémoire, écrites en Mermaid, en SVG statiques.
 *
 *   src/memoire/figures/*.mmd  ──▶  static/figures/*.svg
 *
 * Le rendu a lieu ICI, au build, pas dans le navigateur du visiteur : les
 * pages ne servent que du SVG, sans mermaid.js (≈1 Mo depuis un CDN). Les
 * sources .mmd restent versionnées et modifiables.
 *
 * Le thème (_theme.txt) est préfixé à chaque figure pour aligner polices et
 * couleurs sur la charte du site.
 *
 * Nécessite un Chromium ; celui du système est réutilisé via build/pptr.json.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC = join(ROOT, 'src', 'memoire', 'figures');
const OUT = join(ROOT, 'static', 'figures');
const TMP = join(HERE, 'tmp', 'figures');

const theme = readFileSync(join(SRC, '_theme.txt'), 'utf8').trim();

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const sources = readdirSync(SRC).filter(f => f.endsWith('.mmd')).sort();
console.log(`Rendu de ${sources.length} figures\n`);

for (const f of sources) {
  const nom = basename(f, '.mmd');
  const entree = join(TMP, f);
  const sortie = join(OUT, nom + '.svg');

  writeFileSync(entree, theme + '\n' + readFileSync(join(SRC, f), 'utf8'));

  execFileSync('npx', ['mmdc', '-i', entree, '-o', sortie,
    '-p', join(HERE, 'pptr.json'), '-b', 'transparent', '-q'],
    { cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'] });

  let svg = readFileSync(sortie, 'utf8');

  // Le SVG est inliné dans la page : il doit s'adapter à la largeur du texte
  // et rester lisible au clavier comme au lecteur d'écran.
  // La variable de thème fontFamily de Mermaid n'est pas appliquée de façon
  // fiable : on impose la police du site directement dans le SVG produit.
  svg = svg.replace(/"trebuchet ms",\s*verdana,\s*arial,\s*sans-serif/g,
                    "'Instrument Sans', system-ui, sans-serif");
  svg = svg.replace(/<svg /, '<svg role="img" ');
  svg = svg.replace(/ style="[^"]*max-width:[^"]*"/, ' style="width:100%;height:auto"');
  // Mermaid nomme ses identifiants de façon aléatoire : on les rend stables
  // pour éviter des collisions quand plusieurs figures cohabitent sur la page.
  svg = svg.replace(/my-svg/g, nom);

  writeFileSync(sortie, svg);
  const vb = (svg.match(/viewBox="([^"]*)"/) || [, '?'])[1];
  console.log(`  ${nom.padEnd(12)} ${(svg.length / 1024).toFixed(1).padStart(6)} Ko   viewBox ${vb}`);
}

if (existsSync(TMP)) rmSync(TMP, { recursive: true });
console.log(`\n  → static/figures/`);
