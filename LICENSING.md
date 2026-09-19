# Licences et réutilisation

Ce document explicite la séparation déjà annoncée entre le code sous MIT et
les contenus sous CC BY-SA 4.0. Une licence ne s'applique qu'aux droits que
son titulaire peut accorder. Les ressources tierces conservent leurs propres
conditions, recensées dans [THIRD_PARTY.md](THIRD_PARTY.md).

## Périmètre

| Éléments | Licence applicable |
|---|---|
| Code original : scripts `build/*.mjs`, `build/*.js`, `build/*.py`, configuration et automatisations | [MIT](LICENSE) |
| Documentation technique originale : README, guides de maintenance et de contribution, consignes aux agents | [MIT](LICENSE) |
| Articles, notions, glossaire et autres textes éditoriaux dans `src/*.dc.html` | [CC BY-SA 4.0](static/licenses/CC-BY-SA-4.0.txt) |
| Texte public du mémoire : PDF, `build/memoire.json`, tableaux de `src/memoire/tableaux/` | CC BY-SA 4.0, sous réserve des éléments tiers cités |
| Figures originales du mémoire : `src/memoire/figures/*.mmd`, `static/figures/*.svg`, `build/figures-source/*.png` | CC BY-SA 4.0, sous réserve des éléments tiers cités |
| HTML, CSS et JavaScript originaux des maquettes | MIT ; les textes qu'ils présentent restent sous CC BY-SA 4.0 |
| Pages compilées de `docs/` | Chaque composante conserve sa licence ; la compilation ne change pas les droits |
| Polices `static/fonts/*.woff2` et leurs copies dans `docs/fonts/` | SIL Open Font License 1.1, notices propres à chaque famille |
| Runtime tiers `src/support.js` | Exception : licence de redistribution non identifiée dans l'export ; voir THIRD_PARTY.md |

Les éléments graphiques originaux de la revue (icônes et image de partage)
relèvent de l'annonce CC BY-SA 4.0 des contenus, sauf indication contraire.
Cette licence n'accorde aucun droit de faire croire à une approbation de
l'auteur ou à un caractère officiel de votre réutilisation.

Un fichier `.dc.html` contient à la fois du texte et du code : **il ne s'agit
pas d'un choix entre MIT et CC BY-SA pour l'ensemble du fichier**. Pour
réutiliser une page complète, conserver les mentions applicables à chaque
partie. Pour reprendre uniquement un article, suivre les conditions CC BY-SA.

## Réutiliser du code

Conserver le copyright et le texte [MIT](LICENSE) dans les copies ou parties
substantielles du code concerné. Les dépendances et outils tiers ne sont pas
relicenciés par le fichier MIT du projet.

## Réutiliser un contenu

La licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr)
autorise le partage et l'adaptation, y compris à des fins commerciales. Elle
demande notamment de créditer l'auteur, conserver les mentions fournies,
donner un lien vers la source et la licence, et indiquer les modifications.
Une adaptation partagée doit employer la même licence, une version ultérieure
ayant les mêmes éléments, ou une licence reconnue compatible, selon le texte
complet. Aucune restriction supplémentaire ne peut priver les destinataires
des droits accordés par la licence.

Exemple d'attribution à adapter à l'article effectivement repris :

> Alexandre Berge, « Titre de l'article », *Les Communs Numériques*,
> URL de l'article, CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).
> Modifications : traduction et adaptation des exemples par [votre nom].

Pour une reproduction sans modification, remplacer la dernière phrase par
« Reproduction sans modification ». Voir [CITATION.cff](CITATION.cff) pour
la référence du mémoire.

## Éléments tiers et confidentialité

Les citations, extraits, marques et autres éléments attribués à des tiers ne
sont pas automatiquement placés sous la licence du site. Conserver leurs
références et vérifier leurs conditions propres pour une réutilisation.
Les droits à l'image, à la vie privée et les autres droits non concédés par
une licence de droit d'auteur restent distincts.

Les entretiens privés ne sont pas publiés sous ces licences et ne doivent
pas être ajoutés au dépôt. Une erreur de publication doit être signalée en
privé selon [SECURITY.md](SECURITY.md).

Les textes complets des licences prévalent sur ces explications. Pour faire
corriger un crédit : [consulting@alexandre-berge.fr](mailto:consulting@alexandre-berge.fr).
