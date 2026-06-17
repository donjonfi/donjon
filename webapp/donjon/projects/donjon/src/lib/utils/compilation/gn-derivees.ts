import { ExprReg } from "./expr-reg";
import { srcGroupeNominalUnGroupe, srcResteGNUnGroupe, SRC_DET_DEFINITION_ELEMENT, SRC_NOM, SRC_NOM_CMD1, SRC_NOM_CMD2, SRC_EXCL_APRES } from "../../models/commun/gn-fragments";

/**
 * Regex de DÉFINITION POSITIONNÉE dérivées des regex historiques d’ExprReg, en remplaçant le préfixe
 * « groupe nominal » (déterminant + nom + épithète mono-mot, soit 3 groupes capturants) par un GN
 * capturé dans UN seul groupe (déterminant + attribut(s) avant + nom + attribut(s) après coordonnés).
 * Le re-découpage en rôles se fait ensuite via {@link GroupeNominal.analyser}, comme pour les
 * définitions non positionnées.
 *
 * On DÉRIVE plutôt que de retranscrire la queue complexe (compléments de position, « ici », …) pour
 * éliminer le risque d’erreur de transcription. Précédent : ExprReg.xDefinitionRessource dérive déjà
 * via `.source.replace(...)`. Construire le préfixe à partir des fragments partagés garantit qu’il
 * est byte-identique au préfixe réellement présent dans la source historique (et évite toute
 * apostrophe littérale dans ce fichier).
 */

// Préfixe « groupe nominal » historique (det + nom + épithète) commun aux regex de définition.
const GN_PREFIX_DEFINITION =
  "(" + SRC_DET_DEFINITION_ELEMENT + ")?" +     // déterminant (le/la/les/du…)
  "(" + SRC_NOM + ")" +                          // nom simple ou composé
  "(?:(?: )(" + SRC_EXCL_APRES + "\\S+))?";      // épithète mono-mot historique

/**
 * Remplace le préfixe GN à 3 groupes par un GN à 1 groupe. Les groupes suivants sont donc décalés
 * de -2 (ex. pour la position définie : forme 4→2, type 5→3, attrs 6→4, prép 7→5, complément 8→6,
 * ici 9→7). Lève une erreur si le préfixe attendu est introuvable (garde anti-régression silencieuse).
 */
function deriver1GN(ancienne: RegExp): RegExp {
  const nouvelleSource = ancienne.source.replace(GN_PREFIX_DEFINITION, srcGroupeNominalUnGroupe(SRC_DET_DEFINITION_ELEMENT));
  if (nouvelleSource === ancienne.source) {
    throw new Error("gn-derivees: préfixe GN introuvable dans la regex à dériver (début: " + ancienne.source.slice(0, 80) + ")");
  }
  return new RegExp(nouvelleSource, ancienne.flags);
}

/**
 * Élément positionné DÉFINI, GN capturé en 1 groupe.
 * Groupes : 1=GN, 2=forme/genre, 3=type, 4=attributs, 5=préposition de position, 6=complément, 7=ici/dessus/dedans/dessous.
 */
export const xPositionElementGeneriqueDefini1GN = deriver1GN(ExprReg.xPositionElementGeneriqueDefini);

// ---------------------------------------------------------------------------------------------
//  Commandes : on remplace, dans chaque GN, le couple (nom)(épithète) par un « reste » en 1 groupe
//  (avant + nom + après coordonné). Le DÉTERMINANT reste capturé à part → pas de souci de jeu de
//  déterminants au re-découpage (on re-parse le « reste » via decomposerResteGN).
// ---------------------------------------------------------------------------------------------

// Couple (nom)(épithète mono-mot) historique, tel qu'il apparaît dans xCommandeInfinitif, pour chaque complément.
const GN1_NOMEPI_COMMANDE = "(" + SRC_NOM_CMD1 + ")(?:(?: )(" + SRC_EXCL_APRES + "\\S+?))?";
const GN2_NOMEPI_COMMANDE = "(" + SRC_NOM_CMD2 + ")(?:(?: )(" + SRC_EXCL_APRES + "\\S+?))?";

/**
 * Dérive une commande à deux compléments en remplaçant (nom)(épithète) de CHAQUE complément par un
 * « reste » en 1 groupe. Les groupes déterminant/préposition/verbe sont préservés ; seul -1 groupe
 * par complément (épithète fusionnée dans le reste). Lève si un motif attendu est introuvable.
 */
function deriverCommandeInfinitif1GN(ancienne: RegExp): RegExp {
  const s0 = ancienne.source;
  const s1 = s0.replace(GN1_NOMEPI_COMMANDE, srcResteGNUnGroupe(SRC_NOM_CMD1));
  if (s1 === s0) { throw new Error("gn-derivees: GN1 (nom+épithète) introuvable dans xCommandeInfinitif"); }
  const s2 = s1.replace(GN2_NOMEPI_COMMANDE, srcResteGNUnGroupe(SRC_NOM_CMD2));
  if (s2 === s1) { throw new Error("gn-derivees: GN2 (nom+épithète) introuvable dans xCommandeInfinitif"); }
  return new RegExp(s2, ancienne.flags);
}

/**
 * Commande à l'infinitif, GN en 1 groupe « reste » (sans déterminant).
 * Groupes : 1=verbe, 2=préposition0, 3=déterminant1, 4=reste1, 5=wrapper2, 6=préposition2, 7=déterminant2, 8=reste2.
 */
export const xCommandeInfinitif1GN = deriverCommandeInfinitif1GN(ExprReg.xCommandeInfinitif);

// ---------------------------------------------------------------------------------------------
//  Dialogues (parler/discuter/interroger/questionner/montrer/demander/donner) : 2 GN (sujet +
//  interlocuteur). On remplace, dans chaque GN, (nom)(épithète) par un « reste » en 1 groupe.
//  Après dérivation, TOUS partagent la disposition : verbe(1) det1(2) reste1(3) milieu(4) det2(5) reste2(6).
// ---------------------------------------------------------------------------------------------

// Couple (nom)(épithète) « standard » des dialogues : nom composé SRC_NOM + épithète mono-mot gourmande.
const GN_NOMEPI_DIAL = "(" + SRC_NOM + ")(?:(?: )" + SRC_EXCL_APRES + "(\\S+))?";
// Variante de l'interlocuteur de « parler avec X concernant Y » (exclusion d'épithète spécifique).
const AP_COURBE = String.fromCharCode(92) + "u2019"; // apostrophe courbe sous forme TEXTE (’) pour matcher .source
const GN1_NOMEPI_768 = "(" + SRC_NOM + ")(?:(?: )(?!d'|d" + AP_COURBE + "|et |un |de |des |à |au |aux )(\\S+))?";
// Variante du sujet de « donner SUJET à INTERLOCUTEUR » (nom simplifié pouvant être vide + exclusion spécifique).
const GN1_NOMEPI_802 = "((?:\\S+? (?:à |en |au(?:x)? |de (?:la |l'|l" + AP_COURBE + ")?|du |des |d'|d" + AP_COURBE + ")\\S+?)|\\S+?|)(?:(?: )(?!à |au |aux )(\\S+))?";

function remplacerUnique(s: string, ancien: string, nouveau: string, label: string): string {
  const r = s.replace(ancien, nouveau);
  if (r === s) { throw new Error("gn-derivees dialogue: motif introuvable (" + label + ")"); }
  return r;
}

/** Dérive un dialogue à 2 GN : remplace le couple (nom)(épithète) de chaque GN par un « reste ». */
function deriverDialogue(ancienne: RegExp, gn1: string, gn2: string, label: string): RegExp {
  const reste = srcResteGNUnGroupe(SRC_NOM);
  let s = remplacerUnique(ancienne.source, gn1, reste, label + " GN1");
  s = remplacerUnique(s, gn2, reste, label + " GN2");
  return new RegExp(s, ancienne.flags);
}

export const xCommandeParlerSujetAvecInterlocuteur1GN = deriverDialogue(ExprReg.xCommandeParlerSujetAvecInterlocuteur, GN_NOMEPI_DIAL, GN_NOMEPI_DIAL, "ParlerSujetAvecInterloc");
export const xCommandeParlerAvecInterlocuteurConcernantSujet1GN = deriverDialogue(ExprReg.xCommandeParlerAvecInterlocuteurConcernantSujet, GN1_NOMEPI_768, GN_NOMEPI_DIAL, "ParlerAvecInterlocConcernantSujet");
export const xCommandeQuestionnerInterlocuteurConcernantSujet1GN = deriverDialogue(ExprReg.xCommandeQuestionnerInterlocuteurConcernantSujet, GN_NOMEPI_DIAL, GN_NOMEPI_DIAL, "QuestionnerInterlocConcernantSujet");
export const xCommandeDemanderSujetAInterlocuteur1GN = deriverDialogue(ExprReg.xCommandeDemanderSujetAInterlocuteur, GN1_NOMEPI_802, GN_NOMEPI_DIAL, "DemanderSujetAInterloc");
export const xCommandeParlerAvecInterlocuteurDeSujet1GN = deriverDialogue(ExprReg.xCommandeParlerAvecInterlocuteurDeSujet, GN_NOMEPI_DIAL, GN_NOMEPI_DIAL, "ParlerAvecInterlocDeSujet");
export const xCommandeDemanderAInterlocuteurSujet1GN = deriverDialogue(ExprReg.xCommandeDemanderAInterlocuteurSujet, GN_NOMEPI_DIAL, GN_NOMEPI_DIAL, "DemanderAInterlocSujet");

/** « demander à VERBE à INTERLOCUTEUR » : un seul GN (l'interlocuteur, en fin) → on ne remplace que celui-là. */
export const xCommandeDemanderAVerbeAInterlocuteur1GN = new RegExp(
  remplacerUnique(ExprReg.xCommandeDemanderAVerbeAInterlocuteur.source, GN_NOMEPI_DIAL, srcResteGNUnGroupe(SRC_NOM), "DemanderAVerbeAInterloc GN"),
  ExprReg.xCommandeDemanderAVerbeAInterlocuteur.flags
);
