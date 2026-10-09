# Guide de travail — Les Communs Numériques

Les consignes publiques sont dans [CONTRIBUTING.md](CONTRIBUTING.md), les
prérequis et la publication dans [maintenance/README.md](maintenance/README.md),
et le périmètre des licences dans [LICENSING.md](LICENSING.md).

## Ce qu'il faut savoir avant de toucher au dépôt

Le site est compilé en trois étapes, toutes lancées par `npm run build` :

1. `build/compile.mjs` : `src/*.dc.html` → `docs/` (textes, métadonnées, JSON-LD,
   sitemap, redirections) ;
2. `build/memoire.mjs` : le mémoire → `docs/memoire/` ;
3. `build/univers.mjs` : relit ces pages et les réhabille dans le design du site
   (accueil plein écran, pages de section, pages de lecture, glossaire de A à Z,
   404), en conservant leur en-tête.

**Ne jamais éditer `docs/`**, tout y est écrasé au build suivant. Les textes se
modifient dans `src/` ; le design dans `static/univers/`, `src/univers/` et
`build/univers.mjs`.

Après toute modification :

```bash
npm run build && npm run check:repo && npm run serve   # puis, dans un autre terminal :
npm run verify
```

`npm run verify` doit rester à 18/18. GitHub Actions le relance avant chaque
publication, ainsi que le contrôle de cohérence de `docs/`. Il vérifie
notamment qu'aucune requête
ne part vers un domaine tiers et que les pages restent lisibles sans
JavaScript — deux propriétés faciles à casser sans s'en apercevoir.

## Règles fermes

**Aucune ressource externe.** Pas de CDN, pas de Google Fonts, pas d'appel
réseau au chargement. Les polices sont dans `static/fonts/`. Cette règle n'est
pas esthétique : elle évite le transfert d'adresses IP hors UE, et elle est
contrôlée par `verify.mjs`.

**Aucune retranscription d'entretien.** Les p. 125-206 du mémoire soutenu sont
confidentielles ; le site s'y engage explicitement sur `/la-recherche/` et
`/a-propos/`. **Aucune personne interrogée ne doit être identifiable** : ni
fonction associée à une organisation, ni mention indiquant qu'une personne a été
interviewée pour le mémoire. Le seul PDF publiable est l'édition anonymisée
`static/memoire-communs-numeriques-version-publique.pdf`, tirée de la version web
par `npm run pdf` et contrôlée par `npm run check:pdf` ; les éléments interdits
sont listés dans `build/interdits.mjs`. Le PDF de la version soutenue et les
sources confidentielles sont hors dépôt, dans `~/Documents/Communs-numeriques-prive/`.

**Le design fait foi.** La référence visuelle est l'univers du site :
- `static/univers/champ.js` — le champ de points (trois nuées du commun, et les
  formes des sections : parcours, collier, grille, fourche, colonne) ;
- `static/univers/univers.css` et `lecture.css` — pages de section et de lecture ;
- `static/univers/lecture.js` — marge vivante, plan, bulles de glossaire ;
- `src/univers/accueil.html` — l'accueil, sur un seul écran ;
- `build/univers.mjs` — les gabarits de chaque page.

Les maquettes `.dc.html` restent la **source des textes** ; leur mise en forme
n'est plus publiée. Une modification de rendu se fait dans l'univers, pas dans
les maquettes. Les pages de section et l'accueil tiennent sur un écran, sans
défilement ; seules les pages de lecture défilent.

## Deux types de contenu, deux contrats de lecture

Le site distingue **les notions** et **les articles**, et cette distinction
n'est pas une question de difficulté mais de contrat de lecture.

| | corpus | gabarit | on y répond à |
|---|---|---|---|
| **Comprendre** — `notion-*.dc.html` | fermé, ordonné, 7 entrées de 4-6 min | question en titre, réponse en exergue, parcours numéroté, « à retenir » | *de quoi s'agit-il ?* |
| **Articles** — `article-*.dc.html` | ouvert, s'enrichit, 8-10 min | chapô italique, § numérotés, sources détaillées | *qu'est-ce que ça produit ?* |

Une notion n'est pas datée et ne périme pas ; un article s'inscrit dans une
série qui s'allonge. Une notion et un article peuvent traiter du même sujet à
condition de ne pas dire la même chose : la notion pose le quoi, l'article
traite le et alors.

Le glossaire porte une ancre `id="g-<slug>"` sur chaque terme de
`src/Glossaire.dc.html`. Les notions y renvoient avec
`<a class="gl" href="Glossaire.dc.html#g-…">` ; l'univers transforme ces liens
en renvois vers `/glossaire/a-z/#<slug>`, soulignés en pointillé, avec la
définition en bulle au survol.

## Ajouter une notion au parcours

1. Créer `src/notion-<slug>.dc.html` en copiant une notion existante — le
   gabarit est strictement identique de l'une à l'autre.
2. Déclarer la page dans `build/site.config.mjs` avec `kind: 'notion'`, **à sa
   place dans l'ordre du parcours** — c'est cet ordre qui numérote les notions,
   fixe le nombre de stations du champ et les liens précédent/suivant ; `kind`
   produit aussi le JSON-LD `LearningResource`.
3. Ajouter son titre court (étiquette du parcours) dans `COURT`, en tête de
   `build/univers.mjs`.
4. `npm run build && npm run verify`, puis ajouter la route à la liste des
   liens contrôlés dans `build/verify.mjs`.

## Ajouter ou remplacer un article

1. Éditer ou créer la maquette dans `src/`.
2. Déclarer la page dans `build/site.config.mjs` : `src`, `route`, `type`,
   `priority`, `section`, et une `desc` de 150-160 caractères qui servira à la
   fois de meta description et de description Open Graph.
3. Rien d'autre : la page Analyses, le collier du champ et la navigation entre
   analyses suivent l'ordre de `build/site.config.mjs`. La dernière analyse de
   la liste est mise en avant.
4. `npm run build && npm run verify`.

Le sitemap, les métadonnées, le JSON-LD et les URLs propres sont générés :
rien à écrire à la main.

## Ouvrir l'indexation

Le site porte actuellement `noindex: true` dans `build/site.config.mjs`, le
temps que les articles définitifs remplacent les textes provisoires. Passer à
`false`, recompiler, puis publier via le workflow GitHub Actions. Cela retire
la balise `robots` de chaque page et
rétablit un `robots.txt` ouvert avec le lien vers le sitemap.

## Conventions d'écriture

- Textes et commentaires de code en français.
- Typographie française : espace insécable avant `; : ! ?`, guillemets `« »`.
- Références bibliographiques entre crochets : `[Ostrom, 1990]`.
- Dates en toutes lettres dans le contenu, `AAAA-MM-JJ` dans les métadonnées.
- Auteur : `Alexandre Berge` dans les métadonnées, `Berge A.` dans les
  citations académiques.

## Palette

Le site est sombre ; les variables sont dans `static/univers/univers.css`.

| | | |
|---|---|---|
| fond | `#08130E` | fond de page |
| encre | `#ECF1EA` | texte principal |
| lime | `#C9F27B` | accent : intersections du champ, liens actifs, titres en italique |
| texte secondaire | `#9DB0A4` | chapôs, descriptions |
| texte discret | `#6F8578` | numéros, mentions (4,6:1 sur le fond, minimum AA) |
| filets | `rgba(236,241,234,.14)` | séparateurs |

Ne pas descendre sous `#6F8578` pour du texte sur le fond sombre. La « lecture
claire » des pages de lecture repasse en encre `#1E2A23` sur `#F6F4EC`, accent
`#127552`, et ne mémorise rien chez le lecteur. L'édition PDF reprend la palette
claire. Les gris `#8A968D`, `#9AA79B` et `#B9C4B6`, sous le seuil WCAG AA sur
fond clair, restent interdits en couleur de texte (contrôlé par `verify.mjs`).

Typographie : Instrument Serif pour les titres, Instrument Sans pour le texte.

## Limite connue

Le PDF du mémoire n'expose aucune police italique distincte : l'export depuis
Word l'a aplatie. L'emphase typographique du document d'origine n'est donc pas
récupérable automatiquement dans les pages du mémoire en ligne.
