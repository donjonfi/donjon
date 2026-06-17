import { FRAG_ADJ_ANTEPOSE } from "./lexique-adjectifs-anteposes";

/**
 * Fragments d’expressions régulières composables pour les GROUPES NOMINAUX (GN).
 *
 * But : factoriser le motif « groupe nominal » (déterminant + [attribut(s) avant] + nom simple/composé
 * + [attribut(s) après]) qui était copié-collé dans une quinzaine de regex (compilation ET runtime),
 * et le centraliser ici. Les regex de commande/définition ne capturent qu’UN groupe par GN (la
 * sous-chaîne entière) ; le DÉCOUPAGE en rôles (det/avant/nom/après) est fait ici par
 * {@link decomposerGroupeNominal} sur la sous-chaîne isolée. Ajouter un attribut supplémentaire ne
 * touche donc que ce fichier, pas les indices de capture des regex à deux GN.
 *
 * ⚠️ Apostrophes : le code source utilise l’apostrophe droite U+0027 ; l’apostrophe courbe U+2019
 * est écrite via la séquence d’échappement ’ (dans les littéraux regex ci-dessous).
 */

// ---------------------------------------------------------------------------------------------
//  Fragments élémentaires (sans ancres ni groupe capturant superflu) — extraits via .source
// ---------------------------------------------------------------------------------------------

/** Déterminant défini / démonstratif (avec l’espace de fin). */
export const SRC_DET_DEFINI = /le |la |l(?:'|\u2019)|les |ce |cette |ces /.source;

/** Déterminant défini OU indéfini (le/la/les/l’ ET un/une/des/du/de la/de l’/nombre). */
export const SRC_DET_DEFINI_INDEFINI = /(?:de )?(?:le |la |l(?:'|\u2019))?|du |des |un |une |les |ce |cette |ces |\d+ /.source;

/**
 * Nom SIMPLE ou COMPOSÉ. Bloc historiquement répété dans expr-reg.ts. Un nom composé contient un
 * connecteur interne (de/du/des/d’/à/au/aux/en/qui/sans, « et/sur/sous… + article ») entouré de mots.
 * Le caractère non-greedy + l’exclusion du 1er attribut « après » forcent le rattachement du
 * connecteur au nom (« tache de sang » reste un nom, « de » n’est jamais pris comme attribut).
 */
export const SRC_NOM = /\S+?|(?:\S+? (?:(?:(?:à|dans|et|sous|sur|vers) (?:la |le |les |l'|\u2019))|de (?:la |l'|l\u2019)?|du |des |d'|d\u2019|à |au(?:x)? |en |qui |sans )\S+?)/.source;

/** Garde empêchant le nom de commencer par un déterminant / chiffre / guillemet. */
export const SRC_GARDE_NOM = /(?!(?:\d|(?:(?:un|une|de|du|des|le|la|les)\b|l(?=(?:'|\u2019))))|"|d'|d\u2019)/.source;

/**
 * Zone « avant » : zéro, un ou plusieurs adjectifs ANTÉPOSÉS (du lexique fermé), chacun suivi d’une
 * espace. Capturée (peut être vide). Le « * » rétrograde si consommer un adjectif ne laisse pas de
 * nom (ex. « le grand » → nom=grand, pas d’attribut avant).
 */
export const SRC_AVANT = "(?:(?:" + FRAG_ADJ_ANTEPOSE + ") )*";

/**
 * Exclusion du PREMIER attribut « après » : il ne peut pas commencer par un connecteur de nom
 * composé (de/du/des/d’/à…) ni par un coordonnant (et/ou) ni par une parenthèse. C’est cette
 * exclusion qui préserve la détection des noms composés.
 */
export const SRC_EXCL_APRES = /(?!\(|(?:(?:ne|et|ou|soit|mais|un|de|du|des|dans|sur|avec|concernant|se)\b)|(?:d'|d\u2019|n'|n\u2019|s'|s\u2019|à))/.source;

/**
 * Corps de la zone « après » : un premier attribut (un mot), suivi de zéro ou plusieurs attributs
 * coordonnés par « et » / « ou » / « , ». Ex : « poilu », « rouge et blanc », « usé, vieux et sale ».
 */
export const SRC_APRES_CORPS = "\\S+(?:(?: et| ou|,) \\S+)*";

// ---------------------------------------------------------------------------------------------
//  Regex GN complète : ^(det)(avant)(nom)(après)$ — 4 groupes capturants
// ---------------------------------------------------------------------------------------------

function construireRegexGN(srcDeterminant: string): RegExp {
  return new RegExp(
    "^(" + srcDeterminant + ")?" +   // 1: déterminant (avec espace de fin)
    "(" + SRC_AVANT + ")" +          // 2: attributs avant (peut être vide)
    SRC_GARDE_NOM +
    "(" + SRC_NOM + ")" +            // 3: nom (simple ou composé)
    "(?:(?: )" + SRC_EXCL_APRES + "(" + SRC_APRES_CORPS + "))?" + // 4: attributs après
    "$",
    "i"
  );
}

/** GN à déterminant défini / démonstratif (ou sans déterminant). Groupes : 1=det, 2=avant, 3=nom, 4=après. */
export const xGroupeNominalCompletDefini = construireRegexGN(SRC_DET_DEFINI);

/** GN à déterminant défini OU indéfini (un/une/des…). Mêmes groupes. */
export const xGroupeNominalCompletDefiniIndefini = construireRegexGN(SRC_DET_DEFINI_INDEFINI);

/** Décomposition d’un groupe nominal en ses rôles. */
export interface DecompositionGN {
  /** Déterminant (avec l’espace de fin, ex. « le ») ou undefined. */
  determinant?: string;
  /** Attributs antéposés (placés avant le nom), dans l’ordre. */
  epithetesAvant: string[];
  /** Nom (simple ou composé). */
  nom: string;
  /** Attributs postposés bruts (après le nom), ex. « rouge et blanc », ou undefined. */
  epithete?: string;
}

/**
 * Décompose une sous-chaîne de groupe nominal isolée en {déterminant, attributs avant, nom,
 * attributs après}. Retourne undefined si la chaîne ne ressemble pas à un groupe nominal.
 *
 * @param intituleBrut    la sous-chaîne du GN (déjà isolée du reste de la commande)
 * @param indefiniAussi   accepter les déterminants indéfinis (un/une/des…) en plus des définis
 * @param forcerMinuscules  mettre déterminant/avant/nom/après en minuscules
 */
export function decomposerGroupeNominal(intituleBrut: string, indefiniAussi: boolean, forcerMinuscules: boolean): DecompositionGN | undefined {
  if (!intituleBrut) { return undefined; }
  const re = indefiniAussi ? xGroupeNominalCompletDefiniIndefini : xGroupeNominalCompletDefini;
  const r = re.exec(intituleBrut.trim());
  if (!r) { return undefined; }

  let determinant: string | undefined = r[1] || undefined; // conserve l’espace de fin
  let avantBrut = r[2] || "";
  let nom = r[3];
  let epithete: string | undefined = r[4] || undefined;

  if (forcerMinuscules) {
    determinant = determinant?.toLowerCase();
    avantBrut = avantBrut.toLowerCase();
    nom = nom.toLowerCase();
    epithete = epithete?.toLowerCase();
  }

  const avantTrim = avantBrut.trim();
  const epithetesAvant = avantTrim ? avantTrim.split(/ +/) : [];

  return { determinant, epithetesAvant, nom, epithete };
}

// ---------------------------------------------------------------------------------------------
//  GN « un seul groupe capturant » + builders des regex de DÉFINITION (architecture Option B)
//  Chaque GN est capturé entier dans UN groupe ; le découpage det/avant/nom/après se fait via
//  GroupeNominal.analyser (réutilise xGroupeNominalCompletDefiniIndefini).
//  ⚠️ Invariant : le jeu de déterminants de analyser(indefini:true) DOIT rester ⊇ celui accepté
//  ici, sinon une définition matchée ne se re-découperait pas (gn undefined).
// ---------------------------------------------------------------------------------------------

/** GN capturé dans UN SEUL groupe : (det? + avant + nom + après?). */
export function srcGroupeNominalUnGroupe(srcDeterminant: string): string {
  return "(" +
    "(?:" + srcDeterminant + ")?" +
    "(?:" + SRC_AVANT + ")" +
    SRC_GARDE_NOM +
    "(?:" + SRC_NOM + ")" +
    "(?:(?: )" + SRC_EXCL_APRES + "(?:" + SRC_APRES_CORPS + "))?" +
    ")";
}

// Déterminant accepté dans une définition d’ÉLÉMENT (le/la/les/du/de la/de l’), sans un/une/des (→ ressource).
export const SRC_DET_DEFINITION_ELEMENT = /le |(?:de )?(?:la |l'|l\u2019)|les |du /.source;
// Déterminant accepté dans une définition de RESSOURCE (élargi à un/une/des).
const SRC_DET_DEFINITION_RESSOURCE = /le |(?:de )?(?:la |l'|l\u2019)|les |du |un |une |des /.source;

// Tête (lookahead) excluant les phrases qui ne sont pas des définitions.
const SRC_LOOKAHEAD_DEFINITION_ELEMENT = /(?!un |une |ce |c'|c\u2019|elle |il |elles |ils |sa |son |ses |si |avant |après |dire |changer |exécuter |terminer |refuser )/.source;
const SRC_LOOKAHEAD_DEFINITION_RESSOURCE = /(?!ce |c'|c\u2019|elle |il |elles |ils |sa |son |ses |si |avant |après |dire |changer |exécuter |terminer |refuser )/.source;

/**
 * Queue commune d’une définition : « [(forme)] est/sont un/une/des <type> [attributs] [initialisé à N] [unité] [initialisé à N] ».
 * Groupes (le GN étant le groupe 1) : (2)=forme/genre, (3)=type, (4)=attributs, (5)=init, (6)=unité, (7)=genre unité, (8)=init.
 */
function srcQueueDefinition(srcType: string): string {
  return "(?:(?: )(\\(.+\\)))?" +
    " (?:est|sont) (?:un|une|des) (" + srcType + ")" +
    "(?: ((?!(?:au|à|en|dans|ici|hors)\\b)(?:\\S+?)(?:(?:, (?!(?:au|à|en|dans|ici|hors)\\b)(?:\\S+?))*(?: et (?!(?:au|à|en|dans|ici|hors)\\b)(?:\\S+?)))?))?" +
    "(?:(?: *)(initialisé(?:e)?(?:s)? à (?:\\d+)))?" +
    "(?:(?: *)(?:avec (?:l'|l\u2019)unité|exprimée?s? en) (\\S+)(?:\\s*\\((f|m)\\))?)?" +
    "(?:(?: *)(initialisé(?:e)?(?:s)? à (?:\\d+)))?";
}

/** Définition d’un élément avec type — GN en 1 groupe. Groupes : 1=GN, 2=forme, 3=type, 4=attrs, 5=init, 6=unité, 7=genre unité, 8=init. */
export const xDefinitionElement1GN = new RegExp(
  "^" + SRC_LOOKAHEAD_DEFINITION_ELEMENT +
  srcGroupeNominalUnGroupe(SRC_DET_DEFINITION_ELEMENT) +
  srcQueueDefinition("\\S+") + "$",
  "i"
);

/** Définition d’une ressource — déterminants élargis (un/une/des) et type figé à « ressource(s) ». Mêmes groupes. */
export const xDefinitionRessource1GN = new RegExp(
  "^" + SRC_LOOKAHEAD_DEFINITION_RESSOURCE +
  srcGroupeNominalUnGroupe(SRC_DET_DEFINITION_RESSOURCE) +
  srcQueueDefinition("ressources?") + "$",
  "i"
);

// ---------------------------------------------------------------------------------------------
//  GN « reste » (SANS déterminant) — pour les COMMANDES : le déterminant y est capturé à part,
//  on ne re-découpe que « [attribut avant] nom [attribut(s) après] ».
// ---------------------------------------------------------------------------------------------

/** Nom accepté par le 1er complément (« ceci ») de xCommandeInfinitif : SRC_NOM + forme « objets dans/sous/sur X ». */
export const SRC_NOM_CMD1 = SRC_NOM + "|(?:objets (?:dans|sous|sur) \\S+)";
/** Nom (composé simplifié) accepté par le 2e complément (« cela ») de xCommandeInfinitif. */
export const SRC_NOM_CMD2 = /\S+?|(?:\S+? (?:à |en |de(?: la)? |du |des |d'|d\u2019)\S+?)/.source;

/** Le « reste » d’un GN (sans déterminant) capturé dans UN groupe : avant + nom + après. */
export function srcResteGNUnGroupe(srcNom: string): string {
  return "(" +
    "(?:" + SRC_AVANT + ")" +
    SRC_GARDE_NOM +
    "(?:" + srcNom + ")" +
    "(?:(?: )" + SRC_EXCL_APRES + "(?:" + SRC_APRES_CORPS + "))?" +
    ")";
}

/** Regex de re-découpage d’un « reste » isolé. Groupes : 1=avant, 2=nom, 3=après. */
export const xGroupeNominalReste = new RegExp(
  "^(" + SRC_AVANT + ")" + SRC_GARDE_NOM + "(" + SRC_NOM_CMD1 + ")" +
  "(?:(?: )" + SRC_EXCL_APRES + "(" + SRC_APRES_CORPS + "))?$",
  "i"
);

/** Décompose un « reste » de GN (sans déterminant), ex. « grand chat poilu » → {avant:[grand], nom:chat, après:poilu}. */
export function decomposerResteGN(texte: string, forcerMinuscules: boolean): { epithetesAvant: string[], nom: string, epithete?: string } | undefined {
  if (!texte) { return undefined; }
  const r = xGroupeNominalReste.exec(texte.trim());
  if (!r) { return undefined; }
  let avantBrut = r[1] || "";
  let nom = r[2];
  let epithete: string | undefined = r[3] || undefined;
  if (forcerMinuscules) {
    avantBrut = avantBrut.toLowerCase();
    nom = nom.toLowerCase();
    epithete = epithete?.toLowerCase();
  }
  const avantTrim = avantBrut.trim();
  return { epithetesAvant: avantTrim ? avantTrim.split(/ +/) : [], nom, epithete };
}
