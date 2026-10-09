// Découpage du mémoire en pages web et URLs stables.
//
// Une entrée par page. `cle` identifie la coupure dans la structure extraite :
//   - un numéro de section (« 1.1 ») pour les sections numérotées,
//   - un titre de niveau 1 pour Introduction, Conclusion, Bibliographie,
//   - « Annexe N » pour chaque annexe.
// `titre` est le titre affiché ; il reprend celui du mémoire, abrégé quand
// l'original dépasse ce qu'une navigation peut afficher.

export const racine = '/memoire/';

export const chapitres = [
  { cle: 'Introduction', slug: 'introduction', partie: null,
    titre: 'Introduction',
    resume: "L'impératif de modernisation numérique de l'administration, les communs comme piste de sortie, et le problème de greffe institutionnelle qui structure la recherche." },

  { cle: '1.1', slug: '1-1-performance-sous-contraintes', partie: 'Partie I',
    titre: 'Des performances numériques sous contraintes',
    resume: "Quête de performance et valeur publique, limites structurelles des systèmes d'information publics, spécificités du contexte administratif." },
  { cle: '1.2', slug: '1-2-paradigme-des-communs', partie: 'Partie I',
    titre: 'Le paradigme des communs numériques',
    resume: "Fondements théoriques de Hardin à Ostrom, mécanismes de production collaborative, pertinence stratégique pour l'action publique." },
  { cle: '1.3', slug: '1-3-institutionnalisation', partie: 'Partie I',
    titre: "L'institutionnalisation, élément central de l'ancrage",
    resume: "Le concept sociologique d'institutionnalisation, les trois cadres théoriques mobilisés, et l'inventaire des facteurs potentiels." },

  { cle: '2.1', slug: '2-1-design-de-la-recherche', partie: 'Partie II',
    titre: 'Design de la recherche',
    resume: "Positionnement épistémologique, étude de cas multiples, considérations éthiques et accès au terrain." },
  { cle: '2.2', slug: '2-2-dispositif-empirique', partie: 'Partie II',
    titre: 'Dispositif empirique',
    resume: "Échantillonnage raisonné, instruments de collecte, triangulation et validité interne." },
  { cle: '2.3', slug: '2-3-traitement-analyse-limites', partie: 'Partie II',
    titre: 'Traitement, analyse et limites',
    resume: "Cadre abductif, techniques de codage et comparaisons inter-cas, critères de rigueur et limites assumées." },

  { cle: '3.1', slug: '3-1-les-neuf-cas', partie: 'Partie III',
    titre: 'Caractérisation des initiatives étudiées',
    resume: "Présentation comparée des neuf cas, configurations de gouvernance et écosystèmes d'acteurs, origines et contexte initial." },
  { cle: '3.2', slug: '3-2-dynamiques-institutionnalisation', partie: 'Partie III',
    titre: "Analyse des dynamiques d'institutionnalisation",
    resume: "Trajectoires observées, points de bascule, facteurs d'influence et résistances, stratégies et leviers des acteurs." },
  { cle: '3.3', slug: '3-3-discussion-et-implications', partie: 'Partie III',
    titre: 'Discussion des résultats et implications',
    resume: "Contribution à la valeur publique, relecture au regard des trois cadres théoriques, préconisations managériales et stratégiques." },

  { cle: 'Conclusion', slug: 'conclusion', partie: null,
    titre: 'Conclusion',
    resume: "Réponse à la problématique, apports et limites de la recherche, perspectives et recommandations." },
  { cle: 'Bibliographie', slug: 'bibliographie', partie: null,
    titre: 'Bibliographie',
    resume: "Articles, ouvrages, rapports, législation, thèses, documentation de terrain et webographie." },

  { cle: 'Annexe 1', slug: 'annexes/1-glossaire', partie: 'Annexes',
    titre: 'Annexe 1 — Glossaire',
    resume: "Les notions employées dans le mémoire, définies." },
  { cle: 'Annexe 2', slug: 'annexes/2-limites-methodologiques', partie: 'Annexes',
    titre: 'Annexe 2 — Limites méthodologiques et contremesures',
    resume: "Chaque limite reconnue du dispositif d'enquête et la parade mise en œuvre.",
    // Les annexes 2 et 5 sont composées de tableaux, qui ne portent pas de
    // légende « Tableau N » dans le mémoire : on les place explicitement.
    tableauxApres: { 'tableau-des-limites-methodologiques-et-contremesures': 'A2' } },
  { cle: 'Annexe 3', slug: 'annexes/3-guide-entretien', partie: 'Annexes',
    titre: "Annexe 3 — Guide d'entretien semi-directif",
    resume: "La trame des treize entretiens conduits entre mai et juin 2025." },
  { cle: 'Annexe 4', slug: 'annexes/4-grille-de-codage', partie: 'Annexes',
    titre: 'Annexe 4 — Grille de codage',
    resume: "Le codebook : familles de codes, définitions et règles d'application." },
  { cle: 'Annexe 5', slug: 'annexes/5-matrices-de-codage', partie: 'Annexes',
    titre: 'Annexe 5 — Matrices de codage inter-cas',
    resume: "Intensité de chaque code dans chacun des treize entretiens.",
    tableauxApres: { 'matrice-codes-saillants': 'A5-1',
                     'frequence-des-codes-dans-les-codes-saillants': 'A5-2' } },
  { cle: 'Annexe 6', slug: 'annexes/6-audit-trail', partie: 'Annexes',
    titre: 'Annexe 6 — Audit trail',
    resume: "Le journal des décisions de recherche, de la conception du protocole à la clôture de l'analyse." },
];

// Regroupement affiché dans le sommaire.
export const parties = [
  { nom: null, libelle: null },
  { nom: 'Partie I', libelle: "L'administration publique face à l'impératif de performance numérique" },
  { nom: 'Partie II', libelle: 'Cadre méthodologique de la recherche' },
  { nom: 'Partie III', libelle: 'Analyse des résultats empiriques et discussion' },
  { nom: 'Annexes', libelle: null },
];
