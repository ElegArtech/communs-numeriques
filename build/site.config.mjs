// Configuration du site — source unique de vérité pour les URLs et métadonnées.

export const site = {
  domain: 'communs-numeriques.fr',
  origin: 'https://communs-numeriques.fr',
  name: 'Les Communs Numériques',
  tagline: 'Revue en ligne · Recherche & vulgarisation',
  author: 'Alexandre Berge',
  email: 'consulting@alexandre-berge.fr',
  linkedin: 'https://www.linkedin.com/in/bergealexandre/',
  locale: 'fr_FR',
  licence: 'CC BY-SA 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.fr',
  pdf: '/memoire-communs-numeriques-berge-2025.pdf',

  // Tant que les articles définitifs ne sont pas en ligne, le site est visible
  // mais fermé aux moteurs de recherche. Passer à false pour ouvrir l'indexation.
  noindex: true,

  // Fichier de validation Google Search Console, hérité du site précédent.
  googleVerification: 'googlea6937b2d0e8f4a2d.html',
};

// Anciennes URLs du site (architecture en trois piliers, en ligne jusqu'en juin
// 2026) → nouvelles routes. Le contenu de ces pages n'ayant pas été archivé, la
// correspondance est établie par proximité de sujet ; les pages sans équivalent
// pointent vers la liste des articles.
// Note : pas d'entrée pour /index.html — GitHub Pages sert cette adresse
// depuis le même fichier que /, une redirection y serait une boucle.
export const redirects = {
  '/apropos.html': '/a-propos/',
  '/contact.html': '/a-propos/',
  // Pas d'entrée pour /comprendre/index.html : la rubrique « Comprendre »
  // occupe désormais cette adresse, une redirection l'écraserait.
  '/comprendre/introduction-communs-numeriques.html': '/comprendre/',
  '/comprendre/tragedie-communs-numeriques-revisitee.html': '/comprendre/un-commun-avant-le-numerique/',
  '/comprendre/gouvernance-communs-numeriques.html': '/comprendre/qui-decide/',
  '/comprendre/financer-communs-numeriques-scikit-learn.html': '/comprendre/qui-paie/',
  '/veille/index.html': '/articles/',
  '/veille/europe-souverainete-numerique-communs.html': '/articles/',
  '/veille/europe-consultation-open-source-souverainete.html': '/articles/',
  '/recherche/index.html': '/la-recherche/',
  '/recherche/memoire.html': '/la-recherche/',
  '/recherche/memoire/bibliographie/': '/la-recherche/',
  '/recherche/memoire/pdf/': '/memoire-communs-numeriques-berge-2025.pdf',
};

// Chaque entrée : fichier source → route publique + métadonnées de partage.
// `desc` sert à la fois de <meta name="description"> et de description Open Graph.
export const pages = [
  {
    src: 'Accueil.dc.html',
    route: '/',
    type: 'website',
    priority: '1.0',
    desc: "Une revue en ligne consacrée aux communs numériques et à leur place dans l'action publique : code, données et savoirs gouvernés collectivement, et ce qu'ils changent pour l'administration.",
  },
  {
    src: 'Articles.dc.html',
    route: '/articles/',
    type: 'website',
    priority: '0.9',
    desc: "Sept analyses sourcées sur les communs numériques : fondements, action publique, gouvernance, institutionnalisation, résultats de terrain et maintenance.",
  },
  {
    src: 'Comprendre.dc.html',
    route: '/comprendre/',
    type: 'website',
    kind: 'parcours',
    priority: '0.9',
    desc: "Sept notions courtes pour découvrir les communs numériques sans prérequis : d'où vient l'idée, ce que le numérique y change, qui décide et qui paie.",
  },
  {
    src: 'Recherche.dc.html',
    route: '/la-recherche/',
    type: 'website',
    priority: '0.9',
    desc: "Le mémoire « Les facteurs d'institutionnalisation des communs numériques au sein de l'administration » : problématique, méthode, résultats et texte intégral en accès libre.",
  },
  {
    src: 'Glossaire.dc.html',
    route: '/glossaire/',
    type: 'website',
    priority: '0.8',
    desc: "Les notions clés des communs numériques, de « administration publique » à « wiki » : théorie des communs, gouvernance, vocabulaire du logiciel libre.",
  },
  {
    src: 'APropos.dc.html',
    route: '/a-propos/',
    type: 'website',
    priority: '0.5',
    desc: "Une revue née d'un travail de recherche sur les communs numériques dans l'administration, éditée par Alexandre Berge. Contenus sous licence CC BY-SA 4.0.",
  },

  // ── Comprendre : les notions du parcours ──────────────────────────────────
  {
    src: 'notion-un-commun-avant-le-numerique.dc.html',
    route: '/comprendre/un-commun-avant-le-numerique/',
    type: 'article',
    kind: 'notion',
    priority: '0.8',
    section: 'Fondations',
    desc: "Pâturages, forêts, canaux d'irrigation : avant le code source, les communs sont des ressources gouvernées par leurs usagers. De Hardin à Elinor Ostrom.",
  },
  {
    src: 'notion-ce-que-change-le-numerique.dc.html',
    route: '/comprendre/ce-que-change-le-numerique/',
    type: 'article',
    kind: 'notion',
    priority: '0.8',
    section: 'Fondations',
    desc: "Copier un fichier n'en prive personne : la tragédie des communs s'inverse. Le risque devient l'abandon de la maintenance, et la clôture juridique.",
  },
  {
    src: 'notion-libre-open-source-commun.dc.html',
    route: '/comprendre/libre-open-source-commun/',
    type: 'article',
    kind: 'notion',
    priority: '0.8',
    section: 'Vocabulaire',
    desc: "Le libre est une affaire de droits, l'open source une méthode, le commun une manière de gouverner. Trois termes voisins qui ne se recouvrent pas.",
  },
  {
    src: 'notion-qui-decide.dc.html',
    route: '/comprendre/qui-decide/',
    type: 'article',
    kind: 'notion',
    priority: '0.8',
    section: 'Gouvernance',
    desc: "Consensus, méritocratie, arbitre reconnu : les régimes de décision des communs numériques, le rôle des fondations, et comment juger une gouvernance.",
  },
  {
    src: 'notion-qui-paie.dc.html',
    route: '/comprendre/qui-paie/',
    type: 'article',
    kind: 'notion',
    priority: '0.8',
    section: 'Économie',
    desc: "Gratuit à l'usage n'est pas gratuit à produire. Temps salarié, dons, subventions, services, mutualisation — et la maintenance, toujours sous-financée.",
  },
  {
    src: 'notion-trois-communs-trois-modeles.dc.html',
    route: '/comprendre/trois-communs-trois-modeles/',
    type: 'article',
    kind: 'notion',
    priority: '0.8',
    section: 'Exemples',
    desc: "Une encyclopédie bénévole, une base cartographique polycentrique, un noyau écrit par des salariés : trois communs comparés sur quatre critères.",
  },
  {
    src: 'notion-et-ladministration.dc.html',
    route: '/comprendre/et-ladministration/',
    type: 'article',
    kind: 'notion',
    priority: '0.8',
    section: 'Action publique',
    desc: "Dépendance aux éditeurs, souveraineté, capitalisation : pourquoi les communs intéressent l'action publique, et pourquoi ils ne s'achètent pas.",
  },

  // ── Articles ──────────────────────────────────────────────────────────────
  {
    src: 'article-quest-ce-quun-commun-numerique.dc.html',
    route: '/articles/quest-ce-quun-commun-numerique/',
    type: 'article',
    priority: '0.8',
    section: 'Fondements',
    desc: "De la « tragédie des communs » de Garrett Hardin aux enquêtes d'Elinor Ostrom : pourquoi une ressource partagée n'est pas une ressource sans règles, et ce que le triptyque ressource-communauté-gouvernance change à l'ère du code source.",
  },
  {
    src: 'article-administration-et-communs.dc.html',
    route: '/articles/administration-et-communs/',
    type: 'article',
    priority: '0.8',
    section: 'Action publique',
    desc: "Souveraineté, coûts, dépendance aux éditeurs, capitalisation défaillante : pourquoi les communs numériques apparaissent comme une troisième voie pour les systèmes d'information publics.",
  },
  {
    src: 'article-institutionnalisation.dc.html',
    route: '/articles/institutionnalisation/',
    type: 'article',
    priority: '0.8',
    section: 'Théorie',
    desc: "Comment une pratique nouvelle devient une évidence : habitualisation, objectivation, sédimentation — le parcours par lequel une innovation cesse d'être discutée pour devenir la norme.",
  },
  {
    src: 'article-gouvernance-ostrom.dc.html',
    route: '/articles/gouvernance-ostrom/',
    type: 'article',
    priority: '0.8',
    section: 'Gouvernance',
    desc: "Les huit principes d'Elinor Ostrom appliqués aux communs numériques : frontières, règles locales, surveillance, sanctions graduées — et le travail de maintien permanent que Wikipédia et OpenStreetMap rendent visible.",
  },
  {
    src: 'article-neuf-initiatives.dc.html',
    route: '/articles/neuf-initiatives/',
    type: 'article',
    priority: '0.8',
    section: 'Terrain',
    desc: "Suite Numérique, ADULLACT, SITIV, Échirolles, Brest, Fabrique des Mobilités, France Numérique Libre, CAFData, CNAM : neuf initiatives françaises de communs numériques passées au crible.",
  },
  {
    src: 'article-appropriation-relation.dc.html',
    route: '/articles/appropriation-relation/',
    type: 'article',
    priority: '0.8',
    section: 'Résultats',
    desc: "Deux voies pour ancrer un commun numérique dans l'administration : l'appropriation, où l'État pilote et contrôle, et la relation, où il contribue à un collectif qu'il ne dirige pas. Chacune a ses facteurs de réussite.",
  },

  {
    src: 'article-maintenance-communs-numeriques.dc.html',
    route: '/articles/maintenance-communs-numeriques/',
    type: 'article',
    priority: '0.8',
    section: 'Maintenance',
    datePublished: '2026-09-19',
    desc: "Financer l'entretien, partager les responsabilités, préparer la relève : comment la maintenance permet aux communs numériques de durer dans l’action publique.",
  },

  // ── Pages légales ─────────────────────────────────────────────────────────
  {
    src: 'MentionsLegales.dc.html',
    route: '/mentions-legales/',
    type: 'website',
    priority: '0.2',
    desc: "Éditeur, hébergement, licences des contenus (CC BY-SA 4.0) et du code (MIT), confidentialité des entretiens de recherche, droit de réponse.",
  },
  {
    src: 'Confidentialite.dc.html',
    route: '/confidentialite/',
    type: 'website',
    priority: '0.2',
    desc: "Ce site ne dépose aucun cookie, ne mesure pas son audience et ne charge aucune ressource externe. Ce qui est enregistré, par qui, et vos droits au titre du RGPD.",
  },
];

// Réécriture des liens internes : ancien fichier → nouvelle route.
export const linkMap = Object.fromEntries(pages.map(p => [p.src, p.route]));
linkMap['assets/memoire-communs-numeriques-berge-2025.pdf'] = site.pdf;
