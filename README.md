# Les Communs Numériques

Revue en ligne de recherche et de vulgarisation sur les communs numériques et
leur place dans l'action publique. Éditée par Alexandre Berge, adossée au
mémoire « Les facteurs d'institutionnalisation des communs numériques au sein
de l'administration » (Executive Master 2 MSIC, soutenu le 10 juillet 2025).

**Production :** https://communs-numeriques.fr

> **État actuel — indexation fermée.** Le site est en ligne mais porte un
> `noindex` et un `robots.txt` fermé, le temps que les articles définitifs
> remplacent les textes provisoires. Pour ouvrir l'indexation : passer
> `noindex: false` dans `build/site.config.mjs`, recompiler, pousser.

## Comment ça marche

Les pages sont dessinées dans **Claude Design** et versionnées sous forme de
maquettes `.dc.html` dans `src/`. Un compilateur les transforme en site
statique autonome dans `docs/`, que GitHub Pages publie.

```
src/*.dc.html   ──[ build/compile.mjs ]──▶   docs/<route>/index.html
```

Le compilateur retire tout ce qui rendrait le site dépendant du réseau ou d'un
runtime : React, ReactDOM et Babel (~3 Mo téléchargés depuis unpkg.com à chaque
visite) sont remplacés par `build/runtime.js`, 3,7 Ko de JavaScript natif
inliné ; les polices sont auto-hébergées ; les attributs `style-hover` propres
à Claude Design deviennent de vraies règles CSS `:hover`.

Une page reste entièrement lisible JavaScript désactivé.

## Commandes

```bash
npm run build     # src/ → docs/
npm run serve     # sert docs/ sur http://localhost:8900
npm run verify    # 11 contrôles dans un vrai navigateur (serveur requis)
```

Le mémoire est extrait du PDF public par un script distinct :

```bash
python3 build/extraire_memoire.py    # PDF 124 p. → build/memoire.json
```

## Arborescence

```
src/            maquettes Claude Design (.dc.html) — la source à éditer
static/         ressources copiées telles quelles à la racine du site
                  fonts/       Instrument Sans & Serif auto-hébergées
                  images/      illustrations et portrait
                  *.pdf        mémoire, version publique 124 p.
build/          chaîne de fabrication
                  site.config.mjs      routes, métadonnées, redirections
                  compile.mjs          compilateur
                  runtime.js           JS natif inliné dans chaque page
                  verify.mjs           contrôles navigateur
                  extraire_memoire.py  extraction structurée du PDF
docs/           sortie du build — c'est ce que GitHub Pages sert
```

`docs/` est généré : ne rien y modifier à la main, tout serait écrasé au build
suivant.

## Fichiers à ne jamais supprimer

| Fichier | Rôle |
|---|---|
| `docs/CNAME` | rattache GitHub Pages au domaine communs-numeriques.fr |
| `docs/googlea6937b2d0e8f4a2d.html` | validation Google Search Console |
| `docs/.nojekyll` | empêche Jekyll d'ignorer certains fichiers |

Ces trois fichiers sont régénérés automatiquement par `build/compile.mjs` :
ils sont listés ici parce qu'une suppression manuelle dans `docs/` casserait
le domaine ou le référencement jusqu'au build suivant.

## Ce qui n'est pas dans ce dépôt

Le dépôt est public. Les matériaux suivants vivent hors de son arborescence :

- **les retranscriptions des 13 entretiens** (p. 125-206 du mémoire soutenu) —
  les personnes interrogées ont donné un consentement oral pour un travail
  universitaire, pas pour une publication web, et le site s'engage
  explicitement à ne pas les diffuser ;
- les brouillons d'articles et l'audit éditorial.

Le PDF publié ici est la **version publique, 124 pages**, qui s'arrête à la fin
de l'annexe 6 et ne contient aucune retranscription.

## Licences

- **Code** (compilateur, runtime, scripts) : MIT — voir `LICENSE`.
- **Contenus** (articles, glossaire, mémoire) : CC BY-SA 4.0.

## Contact

consulting@alexandre-berge.fr · [LinkedIn](https://www.linkedin.com/in/bergealexandre/)
