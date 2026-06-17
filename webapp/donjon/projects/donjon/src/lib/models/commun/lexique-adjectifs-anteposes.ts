/**
 * Lexique fermé des adjectifs pouvant être ANTÉPOSÉS (placés AVANT le nom) en français.
 *
 * En français, l’immense majorité des adjectifs sont postposés (« un chat noir »), mais une
 * petite classe fermée d’adjectifs courants (taille, âge, beauté, qualité…) se place
 * habituellement avant le nom (« un grand chat », « une belle maison »).
 *
 * Ce lexique sert à lever l’ambiguïté du découpage d’un groupe nominal : sans lui, « le grand
 * chat poilu » ne serait pas décomposable (où finit le nom ? où commence l’épithète ?).
 * Un mot présent dans ce lexique, placé entre le déterminant et le nom, est interprété comme
 * un attribut antéposé ; sinon il est considéré comme faisant partie du nom.
 *
 * ⚠️ Liste volontairement CONSERVATRICE : on n’inclut que des adjectifs qualificatifs clairs,
 * et on EXCLUT les mots déterminatifs/quantifieurs (autre, certain, tout, tel, quelque, chaque…)
 * qui se confondraient avec des déterminants.
 *
 * Toutes les formes (masculin/féminin, singulier/pluriel, formes devant voyelle) sont listées
 * explicitement, en minuscules et sans accent superflu, pour un test direct et lisible.
 */

/** Toutes les formes fléchies des adjectifs antéposés, en minuscules. */
export const FORMES_ADJECTIFS_ANTEPOSES: ReadonlyArray<string> = [
  // taille
  "grand", "grande", "grands", "grandes",
  "petit", "petite", "petits", "petites",
  "gros", "grosse", "grosses",
  "haut", "haute", "hauts", "hautes",
  "bas", "basse", "basses",
  "long", "longue", "longs", "longues",
  "court", "courte", "courts", "courtes",
  "large", "larges",
  "vaste", "vastes",
  "immense", "immenses",
  "énorme", "énormes",
  "minuscule", "minuscules",
  // beauté / apparence
  "beau", "bel", "belle", "beaux", "belles",
  "joli", "jolie", "jolis", "jolies",
  "vilain", "vilaine", "vilains", "vilaines",
  // âge
  "vieux", "vieil", "vieille", "vieilles",
  "jeune", "jeunes",
  "nouveau", "nouvel", "nouvelle", "nouveaux", "nouvelles",
  "ancien", "ancienne", "anciens", "anciennes",
  // qualité / valeur
  "bon", "bonne", "bons", "bonnes",
  "mauvais", "mauvaise", "mauvaises",
  "meilleur", "meilleure", "meilleurs", "meilleures",
  "gentil", "gentille", "gentils", "gentilles",
  "méchant", "méchante", "méchants", "méchantes",
  "brave", "braves",
  "pauvre", "pauvres",
  "sale", "sales",
  // rang
  "premier", "première", "premiers", "premières",
  "dernier", "dernière", "derniers", "dernières",
  "prochain", "prochaine", "prochains", "prochaines",
  "second", "seconde", "seconds", "secondes",
  // divers usuels antéposés
  "vrai", "vraie", "vrais", "vraies",
  "faux", "fausse", "fausses",
  "simple", "simples",
  "double", "doubles",
  "demi", "demie", "demis", "demies",
  "seul", "seule", "seuls", "seules",
];

const ENSEMBLE_ADJECTIFS_ANTEPOSES: ReadonlySet<string> = new Set(FORMES_ADJECTIFS_ANTEPOSES);

/** Fragment d’alternance regex (sans groupe capturant) listant toutes les formes, pour composer une expression régulière. */
export const FRAG_ADJ_ANTEPOSE: string = FORMES_ADJECTIFS_ANTEPOSES.join("|");

/** Est-ce que le mot (insensible à la casse) est un adjectif antéposé connu ? */
export function estAdjectifAntepose(mot: string): boolean {
  return mot ? ENSEMBLE_ADJECTIFS_ANTEPOSES.has(mot.toLowerCase()) : false;
}
