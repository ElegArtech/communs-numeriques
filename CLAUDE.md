# Guide de travail — Les Communs Numériques

Les consignes publiques sont dans [CONTRIBUTING.md](CONTRIBUTING.md), les
prérequis et la publication dans [maintenance/README.md](maintenance/README.md),
et le périmètre des licences dans [LICENSING.md](LICENSING.md).

## Ce qu'il faut savoir avant de toucher au dépôt

Le site est compilé : `src/*.dc.html` → `docs/`. **Ne jamais éditer `docs/`**,
tout y est écrasé au build suivant. Les modifications se font dans `src/`
(contenu et mise en page) ou dans `build/` (chaîne de fabrication).

Après toute modification :

```bash
npm run build && npm run check:repo && npm run serve   # puis, dans un autre terminal :
npm run verify
```

`npm run verify` doit rester à 17/17. GitHub Actions le relance avant chaque
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
`/a-propos/`. Le seul PDF publiable est `static/memoire-…-2025.pdf`, 124 pages.
Les sources confidentielles sont hors dépôt, dans
`~/Documents/Communs-numeriques-prive/`.

**Le design fait foi.** Les maquettes `.dc.html` sont la référence visuelle.
Une modification de rendu se fait dans la maquette, pas par du CSS ajouté
après coup dans le compilateur.

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

Le glossaire porte une ancre `id="g-<slug>"` sur chaque terme. Les notions y
renvoient avec `<a class="gl" href="Glossaire.dc.html#g-…">`, un souligné
pointillé qui fonctionne sans JavaScript. Le terme atteint se surligne
grâce à la règle `p[data-glossterm]:target` de `src/Glossaire.dc.html`.

## Ajouter une notion au parcours

1. Créer `src/notion-<slug>.dc.html` en copiant une notion existante — le
   gabarit est strictement identique de l'une à l'autre.
2. Mettre à jour, **dans toutes les notions**, le sommaire de bas de page, les
   pastilles de progression, la numérotation « Notion N sur 7 » et les liens
   précédent/suivant. Le parcours est ordonné : une insertion se répercute
   partout.
3. Déclarer la page dans `build/site.config.mjs` avec `kind: 'notion'` — c'est
   ce champ qui produit le JSON-LD `LearningResource` et alimente l'`ItemList`
   de la page de rubrique.
4. Ajouter l'entrée dans `src/Comprendre.dc.html` et dans le bloc
   « Première approche » de `src/Accueil.dc.html`.
5. `npm run build && npm run verify`, puis ajouter la route à la liste des
   liens contrôlés dans `build/verify.mjs`.

## Ajouter ou remplacer un article

1. Éditer ou créer la maquette dans `src/`.
2. Déclarer la page dans `build/site.config.mjs` : `src`, `route`, `type`,
   `priority`, `section`, et une `desc` de 150-160 caractères qui servira à la
   fois de meta description et de description Open Graph.
3. Ajouter le lien dans `src/Articles.dc.html` et, si l'article passe à la une,
   dans `src/Accueil.dc.html`.
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

| | | |
|---|---|---|
| encre | `#1E2A23` | texte principal, filets |
| fond | `#FAFAF6` | fond de page |
| accent | `#127552` | liens, italiques de titre |
| texte secondaire | `#4A5850` · `#5A685F` | chapôs, légendes |
| filets clairs | `#D8DDD3` · `#EAEDE6` | séparateurs |

Les gris `#8A968D`, `#9AA79B` et `#B9C4B6` sont **sous le seuil WCAG AA** sur
le fond `#FAFAF6` (2,9:1, 2,4:1 et 1,7:1 pour un minimum de 4,5:1). Ne pas les
utiliser pour du texte porteur de sens — uniquement pour des filets ou des
éléments décoratifs.

Typographie : Instrument Serif pour les titres, Instrument Sans pour le texte.

## Limite connue

Le PDF du mémoire n'expose aucune police italique distincte : l'export depuis
Word l'a aplatie. L'emphase typographique du document d'origine n'est donc pas
récupérable automatiquement dans les pages du mémoire en ligne.
