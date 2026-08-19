# Guide de travail — Les Communs Numériques

## Ce qu'il faut savoir avant de toucher au dépôt

Le site est compilé : `src/*.dc.html` → `docs/`. **Ne jamais éditer `docs/`**,
tout y est écrasé au build suivant. Les modifications se font dans `src/`
(contenu et mise en page) ou dans `build/` (chaîne de fabrication).

Après toute modification :

```bash
npm run build && npm run serve   # puis, dans un autre terminal :
npm run verify
```

`npm run verify` doit rester à 11/11. Il vérifie notamment qu'aucune requête
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
`false`, recompiler, pousser. Cela retire la balise `robots` de chaque page et
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
