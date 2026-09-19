#!/usr/bin/env node
// À exécuter après npm run build : détecte aussi les nouveaux fichiers oubliés.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const changes = execFileSync('git', ['status', '--porcelain', '--untracked-files=all', '--', 'docs/'],
  { cwd, encoding: 'utf8' }).trim();
if (changes) {
  console.error('docs/ ne correspond pas à la version enregistrée. Compiler puis inclure ces fichiers dans le commit :\n' + changes);
  process.exitCode = 1;
} else {
  console.log('✓ docs/ est à jour, sans fichier généré oublié.');
}
