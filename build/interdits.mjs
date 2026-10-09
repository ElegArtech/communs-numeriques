// Éléments qui ne doivent jamais figurer dans une publication : ils permettraient
// d'identifier des personnes interrogées pour le mémoire. Utilisé par pdf.mjs et
// check-pdf.mjs (et par le garde-fou local de push, qui exclut ce fichier).
export const INTERDITS = [
  'Interview N. Vivant', 'Fonction de l’interviewé', 'Directeur de la stratégie numérique',
  'Ancien élu local', 'Dirigeant d’association', 'Dirigeant de société de conseil',
  'Ancien DSI d’organisme public', 'Dirigeant d’opérateur public', 'Enseignante-chercheuse',
];

// Le seul PDF publiable : l'édition tirée de la version web (npm run pdf).
export const PDF_PUBLIC = 'memoire-communs-numeriques-version-publique.pdf';
