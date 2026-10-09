// Contrôle de publication : le seul PDF publié est l'édition anonymisée, identique
// dans static/ et docs/, et son texte ne contient aucun élément identifiant.
// Requiert pdftotext (Poppler).
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INTERDITS, PDF_PUBLIC } from './interdits.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pdfs = [];
function parcourir(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) parcourir(p); else if (/\.pdf$/i.test(n)) pdfs.push(relative(ROOT, p));
  }
}
parcourir(join(ROOT, 'static'));
parcourir(join(ROOT, 'docs'));

const attendus = [join('docs', PDF_PUBLIC), join('static', PDF_PUBLIC)];
const erreurs = [];
const autres = pdfs.filter((p) => !attendus.includes(p));
if (autres.length) erreurs.push(`PDF non autorisé : ${autres.join(', ')}`);
for (const p of attendus) if (!pdfs.includes(p)) erreurs.push(`PDF attendu absent : ${p}`);
if (!erreurs.length) {
  const [a, b] = attendus.map((p) => readFileSync(join(ROOT, p)));
  if (!a.equals(b)) erreurs.push('docs/ et static/ ne contiennent pas le même PDF');
  const texte = execFileSync('pdftotext', [join(ROOT, attendus[1]), '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const trouves = INTERDITS.filter((x) => texte.includes(x));
  if (trouves.length) erreurs.push(`éléments identifiants dans le PDF : ${trouves.join(' · ')}`);
  if (!texte.includes('reflet de la version du mémoire publiée')) erreurs.push("l'avertissement de l'édition est absent");
}
if (erreurs.length) { erreurs.forEach((e) => console.error('✗ ' + e)); process.exit(1); }
console.log(`✓ PDF : seule l'édition anonymisée est publiée (${PDF_PUBLIC}), sans élément identifiant.`);
