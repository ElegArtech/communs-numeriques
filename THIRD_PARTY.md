# Ressources tierces et crédits

## Polices distribuées avec le site

| Famille | Titulaire indiqué dans la notice | Licence et copie locale |
|---|---|---|
| Instrument Sans | Copyright 2022 The Instrument Sans Project Authors | SIL OFL 1.1 — [notice](static/fonts/OFL-Instrument-Sans.txt) |
| Instrument Serif | Copyright 2022 The Instrument Serif Project Authors | SIL OFL 1.1 — [notice](static/fonts/OFL-Instrument-Serif.txt) |

Sources des notices : [Instrument Sans dans Google Fonts](https://github.com/google/fonts/blob/main/ofl/instrumentsans/OFL.txt)
et [Instrument Serif dans Google Fonts](https://github.com/google/fonts/blob/main/ofl/instrumentserif/OFL.txt).
Projets d'origine : [Instrument Sans](https://github.com/Instrument/instrument-sans)
et [Instrument Serif](https://github.com/Instrument/instrument-serif).

Les fichiers WOFF2 comprennent des variantes normales/italiques et des
sous-ensembles latin/latin étendu. Les deux notices sont recopiées à
l'identique dans `docs/fonts/` à chaque compilation et accessibles depuis
les mentions légales. Les polices conservent leur licence OFL, indépendamment
des licences du code et des contenus.

## Texte de la licence des contenus

`static/licenses/CC-BY-SA-4.0.txt` reproduit le texte CC BY-SA 4.0 distribué
par [SPDX](https://github.com/spdx/license-list-data/blob/main/text/CC-BY-SA-4.0.txt).
La référence juridique est le [texte officiel Creative Commons](https://creativecommons.org/licenses/by-sa/4.0/legalcode.fr).
Le build publie une copie identique sous `/licenses/CC-BY-SA-4.0.txt`.

## Outils de fabrication

Mermaid CLI est une dépendance de développement sous MIT ; Puppeteer est
sous Apache-2.0, conformément aux notices de leurs paquets verrouillés.
Les versions exactes et les licences déclarées des dépendances transitives
figurent dans `package-lock.json` ; les notices originales sont livrées dans
leurs paquets npm. Les navigateurs téléchargés pour les tests conservent
leurs propres licences. Ni `node_modules/` ni ces navigateurs ne sont
distribués dans le site compilé.

Les fichiers SVG des figures sont des rendus des diagrammes originaux du
mémoire ; leur contenu éditorial reste sous CC BY-SA 4.0.

## Exception connue : runtime de prévisualisation Claude Design

`src/support.js` est livré avec les exports Claude Design et se présente comme
un fichier généré depuis `dc-runtime/src/*.ts`. Aucune notice de licence
de redistribution n'a été identifiée dans ce fichier ou dans l'export présent
dans le dépôt. **La licence MIT du projet ne lui est pas attribuée.**

Il sert à la prévisualisation des maquettes et n'est ni utilisé par les
compilateurs ni copié dans `docs/`. La compilation et la consultation du site
publié n'en dépendent pas. Pour redistribuer ce runtime séparément, sa licence
reste à confirmer auprès du fournisseur ; aucune autorisation nouvelle n'est
affirmée ici. Les scripts React, ReactDOM et Babel appelés par les maquettes
sont également retirés de la sortie publiée.

## Sources du mémoire et des articles

Les bibliographies et légendes identifient les travaux cités. Une référence
bibliographique ne transfère pas les droits sur l'œuvre citée. Les contenus
tiers restent soumis à leurs conditions propres, comme expliqué dans
[LICENSING.md](LICENSING.md).

Lors de l'ajout d'une ressource, préciser sa source, son auteur, sa licence,
les éventuelles modifications et le chemin de sa notice avant de la publier.
