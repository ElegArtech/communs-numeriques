# Les Communs Numériques

Revue de recherche et de vulgarisation sur les communs numériques et leur
place dans l'action publique, éditée par Alexandre Berge. Elle prolonge le
mémoire « Les facteurs d'institutionnalisation des communs numériques au sein
de l'administration » (Executive Master 2 MSIC, soutenu le 10 juillet 2025).

**[Lire le site](https://communs-numeriques.fr)** ·
[Contribuer](CONTRIBUTING.md) · [Licences](LICENSING.md) ·
[Maintenance et publication](maintenance/README.md) · [Citer le mémoire](CITATION.cff)

> **Site en préparation.** L'indexation par les moteurs reste fermée :
> `noindex: true` dans `build/site.config.mjs`. L'ouverture est une décision
> éditoriale distincte, une fois les textes définitifs prêts.

## Fonctionnement

Les maquettes Claude Design de `src/` sont compilées en HTML statique dans
`docs/`. GitHub Actions reconstruit et vérifie le site avant de le transmettre
à GitHub Pages. Les pages publiées restent lisibles sans JavaScript ; les
polices et ressources sont hébergées sur le même domaine.

```text
src/*.dc.html + static/ ── build/compile.mjs ──▶ docs/
build/memoire.json + tableaux + figures ── build/memoire.mjs ──▶ docs/memoire/
```

`docs/` reste versionné pour rendre les changements publiés vérifiables.
**Ne pas le modifier à la main** : le build l'efface puis le reconstruit.
La prévisualisation des maquettes dans Claude Design utilise un environnement
distinct ; les propriétés ci-dessus concernent le site compilé.

## Installation

Prérequis : **Git, Node.js 24 et npm, Python 3**. Avec nvm, `nvm install`
sélectionne la version indiquée dans `.nvmrc`.

```bash
git clone https://github.com/ElegArtech/communs-numeriques.git
cd communs-numeriques
npm ci
npm run browser:install
npm run build
npm run check:repo
npm run serve
```

Ouvrir [http://127.0.0.1:8900](http://127.0.0.1:8900). Dans un autre terminal,
depuis le même dossier :

```bash
npm run verify
```

Les **17 contrôles navigateur** couvrent notamment l'absence de requêtes
externes sur les pages échantillonnées, la lecture sans JavaScript, le
glossaire, les liens, les redirections et les pages du mémoire. Le contrôle
des contrastes détecte les trois gris interdits de la charte ; il ne constitue
pas un audit complet d'accessibilité.

`npm ci` installe les versions verrouillées ; `npm run browser:install`
assure la présence du navigateur compatible de Puppeteer, même si npm bloque
les scripts automatiques des dépendances. Un navigateur système peut être sélectionné avec
`PUPPETEER_EXECUTABLE_PATH` ; voir les [options et le dépannage](maintenance/README.md#navigateur).
La compilation ordinaire n'a besoin ni de Chromium ni de Poppler ; les tests
et la régénération des figures utilisent le navigateur.

## Commandes

| Commande | Rôle |
|---|---|
| `npm ci` | Installer les dépendances verrouillées |
| `npm run browser:install` | Installer le navigateur compatible pour les tests et les figures |
| `npm run build` | Reconstruire tout `docs/` avec les données et figures enregistrées |
| `npm run serve` | Servir uniquement `docs/` sur la boucle locale, port 8900 |
| `npm run verify` | Exécuter les 17 contrôles, serveur local requis |
| `npm run check:repo` | Vérifier les exclusions de fichiers privés, notices et configuration après le build |
| `npm run check:generated` | Vérifier que `docs/` correspond au dernier commit, après un build |
| `npm run figures` | Régénérer les quatre SVG du mémoire ; lancer ensuite le build |
| `npm run memoire` | Réextraire le PDF public et générer les pages du mémoire ; Python et Poppler requis |

Les deux dernières commandes sont destinées à la maintenance du mémoire,
pas à l'installation ordinaire. Leurs prérequis et leur ordre d'utilisation
sont détaillés dans le [guide de maintenance](maintenance/README.md).

## Arborescence

```text
src/                 maquettes et contenu à modifier ; tableaux et figures sources
static/              ressources publiées : polices, notices, figures, PDF public
build/               compilateurs, configuration, données du mémoire et contrôles
docs/                site généré et versionné, seul dossier envoyé à GitHub Pages
maintenance/         documentation technique (hors du dossier de publication)
.github/             vérification, déploiement et modèles de contribution
```

Le compilateur régénère `docs/CNAME` (domaine), `docs/.nojekyll` et le fichier
de validation Google Search Console depuis `build/site.config.mjs`.

## Confidentialité

Le seul mémoire publiable est
`static/memoire-communs-numeriques-berge-2025.pdf`, **124 pages**, sans les
retranscriptions des treize entretiens (pages 125–206 de la version soutenue).
Les sources privées et brouillons doivent rester hors du dépôt public.
Les noms des dossiers privés connus sont aussi exclus par `.gitignore`.

`check:repo` refuse les chemins sensibles connus s'ils sont suivis par Git.
Cela ne remplace pas la relecture des fichiers et de leur contenu avant un
commit. Pour un signalement confidentiel, suivre [SECURITY.md](SECURITY.md).

## Licences et citation

- **Code original et documentation technique : MIT**, texte dans [LICENSE](LICENSE).
- **Contenus éditoriaux et mémoire : CC BY-SA 4.0**, texte dans
  [static/licenses/CC-BY-SA-4.0.txt](static/licenses/CC-BY-SA-4.0.txt).
- **Polices Instrument Sans et Serif : SIL OFL 1.1**, notices dans `static/fonts/`.

Le [périmètre des licences](LICENSING.md) distingue le code et le texte dans
les fichiers mixtes. Les [crédits et exceptions](THIRD_PARTY.md) documentent
les ressources tierces, notamment le runtime de prévisualisation Claude Design.
L'indication MIT affichée par GitHub ne décrit donc pas tout le dépôt.

Citation du mémoire : Berge A., *Les facteurs d'institutionnalisation des
communs numériques au sein de l'administration*, mémoire d'Executive Master 2
MSIC, dir. M. Liottier, soutenu le 10 juillet 2025.
[CITATION.cff](CITATION.cff) fournit cette référence au bouton de citation GitHub.

## Contact

[consulting@alexandre-berge.fr](mailto:consulting@alexandre-berge.fr) ·
[LinkedIn](https://www.linkedin.com/in/bergealexandre/)
