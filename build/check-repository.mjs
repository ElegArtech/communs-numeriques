#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { site } from './site.config.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const problems = [];
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(Boolean);
const privateName = /(^|\/)(Communs-numeriques-prive|Memoire-sources-privees|MEMOIRE_COMMUNS_NUMERIQUES|uploads)(\/|$)|confidentiel|retranscription|memoire_text\.txt|-206p|(^|\/)\.env($|\.(?!example$))/i;
for (const path of tracked) {
  if (privateName.test(path)) problems.push(`Fichier à retirer du suivi Git : ${path}`);
}
// Aucun contenu privé n'est ouvert : ces noms fictifs vérifient le .gitignore.
for (const path of ['Communs-numeriques-prive/test.txt', 'Memoire-sources-privees/test.txt',
  'entretien-CONFIDENTIEL.txt', 'retranscription-test.txt', 'memoire-206p.pdf', '.env']) {
  try {
    execFileSync('git', ['check-ignore', '--no-index', '-q', path], { cwd: root });
  } catch {
    problems.push(`Protection .gitignore absente : ${path}`);
  }
}
for (const path of ['LICENSE', 'LICENSING.md', 'THIRD_PARTY.md', 'CONTRIBUTING.md',
  'SECURITY.md', 'CITATION.cff', 'docs/.nojekyll', `docs/${site.googleVerification}`]) {
  if (!existsSync(join(root, path))) problems.push(`Fichier absent : ${path}`);
}
for (const path of ['fonts/OFL-Instrument-Sans.txt', 'fonts/OFL-Instrument-Serif.txt',
  'licenses/CC-BY-SA-4.0.txt']) {
  const source = join(root, 'static', path), output = join(root, 'docs', path);
  if (!existsSync(source) || !existsSync(output)
      || !readFileSync(source).equals(readFileSync(output))) {
    problems.push(`Notice absente ou non recopiée à l'identique : ${path}`);
  }
}
if (!existsSync(join(root, 'docs/CNAME'))
    || readFileSync(join(root, 'docs/CNAME'), 'utf8').trim() !== site.domain) {
  problems.push('Le domaine de docs/CNAME ne correspond pas à la configuration.');
}
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
if (lock.name !== pkg.name || lock.packages[''].name !== pkg.name) {
  problems.push('Le fichier package-lock.json ne correspond pas au projet.');
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log('✓ Dépôt : noms de fichiers privés exclus, notices publiées, configuration cohérente.');
  console.log('Ce contrôle de chemins ne constitue pas une analyse du contenu ni de l’historique Git.');
}
