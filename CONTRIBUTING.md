# Contribuer aux Communs Numériques

Les corrections factuelles, références complémentaires, améliorations de
lisibilité et corrections techniques sont bienvenues. Alexandre Berge assure
la responsabilité éditoriale et la validation des changements publiés.

## Signaler une erreur ou proposer une amélioration

Ouvrir une [issue](https://github.com/ElegArtech/communs-numeriques/issues/new/choose)
avec le modèle adapté : correction éditoriale ou problème technique. Indiquer
l'URL concernée, ce qui pose problème et la correction proposée ; fournir une
source vérifiable pour une correction factuelle. Rester précis et respectueux
des personnes, y compris en cas de désaccord sur le fond.

**Ne pas joindre de retranscription, de donnée personnelle ou de document
privé.** Un problème de confidentialité ou de sécurité se signale par le
canal privé décrit dans [SECURITY.md](SECURITY.md).

## Proposer une modification

1. Installer le dépôt selon le [README](README.md), puis créer une branche ou
   un fork. Garder une proposition centrée sur un sujet identifiable.
2. Modifier les sources dans `src/`, les ressources dans `static/` ou les
   scripts dans `build/`. Ne pas modifier directement `docs/`.
3. Pour une nouvelle page, déclarer sa route dans `build/site.config.mjs` et
   ajouter les liens de navigation utiles. Pour le parcours « Comprendre »,
   mettre à jour l'ordre, les compteurs et les liens de toutes les notions.
4. Exécuter `npm run build`, `npm run check:repo`, puis `npm run serve` et,
   dans un second terminal, `npm run verify`. Relire le rendu concerné.
5. Examiner `git diff` et `git status`. Ajouter explicitement les fichiers
   souhaités, y compris leur sortie dans `docs/`, puis créer le commit.
6. Après le commit, `npm run check:generated` doit réussir. Ouvrir une pull
   request décrivant le problème, la solution et les vérifications effectuées.

GitHub Actions refait la compilation et les contrôles sur les pull requests.
La publication n'a lieu que depuis `main`, après réussite du job de vérification.

## Conventions du projet

- Français, typographie française et références bibliographiques vérifiables.
- Le parcours de notions répond à « de quoi s'agit-il ? » ; les articles
  développent une analyse. Conserver ces deux contrats de lecture.
- Aucune ressource chargée depuis un domaine tiers dans le site publié.
- Préserver la lecture sans JavaScript et l'accès au clavier.
- Les maquettes sont la référence visuelle : ajuster `src/` pour changer le
  rendu, plutôt que masquer un écart dans le compilateur.
- Conserver le domaine, les anciennes redirections, les fichiers de validation
  et le choix d'indexation dans la configuration centralisée.

## Droits sur les contributions

En proposant du code original, vous le proposez sous MIT ; en proposant un
contenu éditorial original, sous CC BY-SA 4.0, conformément à
[LICENSING.md](LICENSING.md). Vous conservez vos droits d'auteur. N'ajoutez que
des éléments que vous pouvez partager sous les conditions applicables.
Pour une ressource tierce, indiquer son origine et sa licence et conserver les
notices ; signaler toute exception dans [THIRD_PARTY.md](THIRD_PARTY.md).

L'emploi d'un outil d'IA ne dispense ni de vérifier les sources et les faits,
ni de respecter les droits et la confidentialité des documents utilisés.
