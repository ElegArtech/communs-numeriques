# Maintenance et publication

## Installation reproductible

Utiliser Node.js 24 (`.nvmrc`) et `npm ci`, qui respecte `package-lock.json`.
Python 3 est requis pour le serveur local et l'extraction du mémoire ; le
serveur n'expose que `docs/` sur `127.0.0.1:8900`. La CI utilise Ubuntu 24.04.

Après une modification de dépendances, mettre à jour le manifeste et le
verrouillage ensemble, refaire une installation propre et les vérifications.
Ne pas exécuter une mise à jour majeure automatique sans vérifier les rendus.

## Navigateur

Puppeteer est une dépendance directe, verrouillée. Après `npm ci`,
`npm run browser:install` assure la présence de sa version compatible de Chrome. `build/browser.mjs` fournit la même configuration
aux tests et au rendu Mermaid ; aucun chemin propre à une machine n'est requis.

Pour réutiliser un navigateur déjà installé (adapter le chemin au système) :

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm ci
PUPPETEER_EXECUTABLE_PATH=/chemin/vers/chromium npm run verify
PUPPETEER_EXECUTABLE_PATH=/chemin/vers/chromium npm run figures
```

Après une installation ayant omis le téléchargement, `npm run browser:install`
installe le navigateur attendu. Le cache est normalement
dans `~/.cache/puppeteer`, hors du dépôt. Sur Linux, si des bibliothèques
système manquent, suivre le [dépannage Puppeteer](https://pptr.dev/troubleshooting).

Le bac à sable du navigateur reste activé par défaut. Dans un environnement
isolé qui ne le permet pas, `PUPPETEER_NO_SANDBOX=1 npm run verify` (ou
`npm run figures`) active les options nécessaires. La CI emploie ce réglage
sur son runner éphémère, uniquement pour les pages locales du projet.

## Modifier et vérifier le site

1. Modifier `src/`, `static/` ou `build/`.
2. `npm run build` reconstruit `docs/`.
3. `npm run check:repo` contrôle les chemins sensibles, les notices et les
   fichiers nécessaires à la publication.
4. `npm run serve`, puis `npm run verify` dans un second terminal : 17 contrôles.
5. Relire les pages concernées dans le navigateur, puis le diff Git.
6. Commiter les sources et leur sortie générée. Après le commit,
   `npm run build && npm run check:generated` doit réussir.

`check:generated` signale les fichiers modifiés, supprimés et nouveaux dans
`docs/`. Son échec avant le commit de changements volontaires est normal.
Lancer le serveur depuis la racine via `npm run serve` ; ne pas servir la
racine du dépôt, qui peut contenir des fichiers de travail privés ignorés.

## Régénérer les figures ou le mémoire

Les SVG et `build/memoire.json` sont enregistrés dans Git : un build ordinaire
ne les réextrait pas. Les régénérer seulement si leurs sources changent.

Figures : modifier `src/memoire/figures/*.mmd`, puis `npm run figures` et
`npm run build`. Relire les quatre rendus et leurs légendes. Le navigateur
utilisé et les polices installées peuvent influer sur les métriques du rendu.

Mémoire : installer Poppler (`pdftohtml` et `pdfinfo` ; par exemple le paquet
`poppler-utils` sous Debian/Ubuntu). Vérifier que le PDF public fait 124 pages :

```bash
pdfinfo static/memoire-communs-numeriques-berge-2025.pdf
npm run build
npm run memoire
npm run build
```

Le premier build fournit l'en-tête utilisé par le générateur du mémoire.
L'extraction est adaptée à la structure de ce PDF : un nouveau document exige
de revoir `build/extraire_memoire.py`. Les tableaux sont saisis séparément dans
`src/memoire/tableaux/tableaux.json`. Contrôler le texte, les figures et les
tableaux après toute réextraction. Le script n'a pas besoin de paquets Python
supplémentaires, mais appelle `pdftohtml`.

## Publication GitHub Pages

Le workflow [`.github/workflows/site.yml`](../.github/workflows/site.yml)
s'exécute sur les pull requests et les pushes sur `main`, ainsi que sur
déclenchement manuel. Il :

1. installe les versions verrouillées ;
2. recompile et vérifie que `docs/` correspond au commit ;
3. vérifie les protections du dépôt, les notices et les 124 pages du PDF public ;
4. sert le site localement et exécute les 17 contrôles navigateur ;
5. uniquement sur `main` du dépôt d'origine, transmet `docs/` à GitHub Pages
   après réussite de toutes les étapes précédentes.

Les pull requests ne publient rien. Le job de vérification possède seulement
`contents: read` ; les permissions `pages: write` et `id-token: write` sont
limitées au job de déploiement. Les actions sont fixées à des commits précis.
Un échec conserve la dernière version publiée.

Réglages à conserver dans **Settings → Pages** :

- Source : **GitHub Actions** (le déploiement direct de `main:/docs` a été
  remplacé afin de faire précéder la publication par les contrôles).
- Domaine personnalisé : `communs-numeriques.fr` ; HTTPS activé.
- Environnement de déploiement : `github-pages`, branche de production `main`.

`docs/` reste le dossier publié, mais son transfert est maintenant effectué
par le workflow. Il contient `CNAME`, `.nojekyll` et la validation Google,
reconstruits depuis `build/site.config.mjs`. Ne pas modifier les DNS pour une
mise à jour ordinaire.

Après un changement, consulter [Actions](https://github.com/ElegArtech/communs-numeriques/actions/workflows/site.yml)
puis vérifier l'accueil et la page modifiée sur le domaine public.
Pour revenir à une version précédente, créer un commit de retour avec
`git revert` sur le changement concerné, reconstruire si nécessaire et passer
par le même workflow. Ne pas réécrire l'historique pour une correction normale.

## Indexation

`site.noindex` reste à `true` jusqu'à validation éditoriale. Passer à `false`
puis reconstruire et publier ouvre l'indexation : le compilateur retire les
balises concernées et ouvre `robots.txt`. Le sitemap est généré automatiquement.
Ce réglage n'est pas un contrôle d'accès : tout fichier publié reste public.

## Confidentialité et licences

Garder les entretiens, brouillons et versions intégrales hors du dépôt.
`.gitignore` protège aussi les noms de dossiers privés connus ; cela ne retire
pas un fichier déjà commité. `check:repo` vérifie des chemins connus, pas le
contenu de tous les documents ni leur historique.

Conserver les notices de polices dans `static/fonts/` et la licence des
contenus dans `static/licenses/`. Documenter les nouvelles ressources dans
[THIRD_PARTY.md](../THIRD_PARTY.md). Pour un incident, suivre
[SECURITY.md](../SECURITY.md).
