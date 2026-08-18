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
    desc: "Six entrées courtes et sourcées pour comprendre les communs numériques : fondements théoriques, gouvernance, institutionnalisation et résultats de terrain.",
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
];

// Réécriture des liens internes : ancien fichier → nouvelle route.
export const linkMap = Object.fromEntries(pages.map(p => [p.src, p.route]));
linkMap['assets/memoire-communs-numeriques-berge-2025.pdf'] = site.pdf;
