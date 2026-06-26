import { BalisesHtml } from "../../utils/jeu/balises-html";
import { Phrase } from "./phrase";
import { Routine } from "./routine";

/** Message à l’utilisateur suite à l’analyse de son scénario. */
export class MessageAnalyse {

  /** Numéro de la ligne. */
  public readonly numeroLigne: number;
  /** Numéro de ligne mis en forme. */
  private _numeroLigneFormate: string;
  /** Corps du messages avec balises HTML. */
  private _htmlCorps: string;
  /** Phrase liée au message. */
  public phrase: string;
  /** Titre de la routine liée au message. */
  public readonly titreRoutine: string | undefined;

  constructor(
    /** Type de message (conseil, probleme, erreur) */
    public type: EMessageAnalyse,
    /** Phrase du scénario concernée (peut être absente pour un message de génération) */
    phrase: Phrase | undefined,
    /** Catégorie du message */
    public categorie: CategorieMessage,
    /** Code du message */
    public code: CodeMessage,
    /** Titre du message (sans balise de style) */
    public titre: string,
    /** Corps du message (avec balises de style Donjon FI) */
    public corps: string,
    /** Routine liée au message */
    routine: Routine | undefined = undefined,
    /** La phrase provient-elle du fichier avec les actions de base ? */
    public fichierAction: boolean,
    /** Numéro de ligne de repli quand aucune phrase n’est associée (ex. génération). */
    ligne: number | undefined = undefined,
  ) {
    this.numeroLigne = phrase ? phrase.ligne : (ligne ?? 0);
    this.phrase = phrase ? phrase.toString() : "";
    this.titreRoutine = routine?.titre ?? undefined;
  }

  /** Numéro de la ligne mis en forme. */
  get numeroLigneFormate(): string {
    if (this._numeroLigneFormate === undefined) {
      this._numeroLigneFormate = ("    " + this.numeroLigne).slice(-5);
    }
    return this._numeroLigneFormate;
  }

  /** Corps du message avec balises HTML. */
  get htmlCorps(): string {
    if (this._htmlCorps === undefined) {
      this._htmlCorps = BalisesHtml.convertirEnHtml(this.corps, '');
    }
    return this._htmlCorps;
  }

}



export enum EMessageAnalyse {
  /** Conseil à l’auteur (problème potentiel) */
  conseil = 1,
  /** Problème rencontré dans le scénario. */
  probleme = 2,
  /** Erreur Donjon */
  erreur = 3,
}

/**
 * Catégorie du message.
 */
export enum CategorieMessage {
  structureBloc = "structure_bloc",
  structureRoutine = "structure_routine",

  syntaxeAction = "syntaxe_action",
  syntaxeControle = "syntaxe_controle",
  syntaxeRegle = "syntaxe_regle",
  syntaxeRoutine = "syntaxe_routine",
  syntaxeReaction = "syntaxe_reaction",
  syntaxeDynamique = "syntaxe_dynamique",

  erreurDonjon = "erreur_donjon",

  syntaxeDefinition = "syntaxe_definition",
  synonyme = "synonyme",

  referenceElementGenerique = "reference_element_generique",

  placement = "placement",
  type = "type",

  generation = "generation",

}

/**
 * Code du message
 */
export enum CodeMessage {

  /** structure bloc: sinonsi se trouve après un sinon */
  sinonsiSuitSinon = "structure_bloc/sinonsi_suit_sinon",
  /** structure bloc: fin bloc différent de celui attendu (ex: fin choix au lieu de fin si) */
  finBlocDifferent = "structure_bloc/fin_bloc_different",
  /** structure bloc: fin bloc manquant */
  finBlocManquant = "structure_bloc/fin_bloc_manquant",
  /** structur bloc: fin bloc de contrôle pas attendu ici (aucun bloc commencé) */
  finBlocPasAttendu = "structure_bloc/fin_bloc_pas_attendu",

  /** structure routine: fin routine manquant */
  finRoutineManquant = "structure_routine/fin_routine_manquant",
  /** structure routine: fin routine pas attendu ici (car pas démarrée) */
  finRoutinePasAttendu = "structure_routine/fin_routine_pas_attendu",
  /** fin routine différent de celui attendu (ex: fin action au lieu de fin réaction) */
  finRoutineDifferent = "structure_routine/fin_routine_different",

  /** syntaxe action: l’action n’a pas été trouvée => problème de syntaxe dans l’entête  */
  actionIntrouvable = "syntaxe_action/action_introuvable",
  /** syntaxe action: le complément direct doit être nommé « ceci » et l’indirect « cela ». */
  nommageComplementsAction = "syntaxe_action/nommage_complements_action",
  /** syntaxe action: seules les phases suivantes sont supportées: prérequis, exécution et épilogue. */
  phaseActionInconnue = "syntaxe_action/phase_inconnue",
  /** syntaxe action: utilisation de l’étiquette ceci/cela alors que le complément n’est pas présent dans l’entête de l’action. */
  complementActionInexistant = "syntaxe_action/complement_inexistant",
  /** syntaxe action: une définition de ceci/cela/déplacement est attendue après l’étiquette définitions. */
  definitionAction = "syntaxe_action/definition_action",

  /** syntaxe contrôle: fin de bloc mal écrit (ex: fin sii) */
  finBlocInconnu = "syntaxe_controle/fin_bloc_inconnu",
  /** syntaxe contrôle: bloc attendu pas trouvé => problème de syntaxe dans l’entête */
  instructionControleIntrouvable = "syntaxe_controle/instruction_controle_introuvable",
  /** syntaxe contrôle: l’instruction « si » attendue n’a pas été trouvée => problème de syntaxe dans l’entête (condition) */
  instructionSiIntrouvable = "syntaxe_controle/instruction_si_introuvable",

  /** syntaxe règle: type de règle inconnu => seuls avant et après sont supportés */
  typeRegleInconnu = "syntaxe_regle/type_regle_inconnu",
  /** syntaxe règle: la formulation de l’évènement qui doit déclancher la règle n’a pas été comprise. */
  formulationEvenementReglePasComprise = "syntaxe_regle/formulation_evenement_pas_comprise",

  /** syntaxe réaction: l’interlocuteur n’a pas été trouvé dans ctx analyse. */
  interlocuteurIntrouvable = "syntaxe_reaction/interlocuteur_introuvable",
  /** syntaxe réaction: le sujet doit être un groupe nominal ou une liste de GN. */
  sujetIntrouvable = "syntaxe_reaction/sujet_introuvable",
  /** réaction simple: seul dire est supporté. */
  reactionSimpleUniquement = "syntaxe_reaction/reaction_simple_uniquement",

  /** syntaxe routine: la routine n’a pas été trouvée =>  */
  routineIntrouvable = "syntaxe_routine/routine_introuvable",
  /** syntaxe routine: la règle n’a pas été trouvée => problème de syntaxe dans l’entête */
  regleIntrouvable = "syntaxe_routine/regle_introuvable",
  /** syntaxe routine: nom invalide => le nom d’une routine simple doit faire exactement un mot. */
  nomRoutineInvalide = "syntaxe_routine/nom_routine_invalide",

  /** erreur Donjon: étiquette introuvable alors qu’elle devrait avoir été pré-validée */
  etiquetteEnteteIntrouvable = "erreur_donjon/etiquette_entete_introuvable",

  /** Le même mot est utilisé comme synonyme de plusieurs vebres différents. */
  synonymeDefiniPourPlusieursVerbes = "synonyme/utilise_pour_plusieurs_verbes",
  /** synonyme: le synonyme d’une action n’est pas un verbe à l’infinitif. */
  synonymePasVerbe = "synonyme/synonyme_pas_verbe",
  /** synonyme: le synonyme d’un élément du jeu n’est pas un groupe nominal. */
  synonymePasGroupeNominal = "synonyme/synonyme_pas_groupe_nominal",
  /** synonyme: l’élément du jeu auquel attribuer des synonymes n’a pas été trouvé. */
  synonymeElementOriginalIntrouvable = "synonyme/element_original_introuvable",
  /** synonyme: plusieurs éléments correspondent à l’intitulé à synonymer (ambigu). */
  synonymeElementOriginalAmbigu = "synonyme/element_original_ambigu",

  /** Une définition était attendue mais on n’a pas pur interpréter cette phrase comme une définition */
  definitionAttendue = "syntaxe_definition/definition_attendue",

  /** Référence élément générique: élément ciblé pas trouvé */
  elementCiblePasTrouve = "reference_element_generique/element_cible_pas_trouve",
  /** Référence élément générique: nom de l’autre élément pas supporté */
  nomElementCiblePasSupporte = "reference_element_generique/nom_element_cible_pas_supporte",
  /** Référence élément générique: position de l’autre élément pas supportée */
  positionElementCiblePasSupportee = "reference_element_generique/position_element_cible_pas_supportee",

  /** syntaxe dynamique: crochet ouvrant `[` sans crochet fermant correspondant. */
  crochetOuvrantNonFerme = "syntaxe_dynamique/crochet_ouvrant_non_ferme",
  /** syntaxe dynamique: crochet fermant `]` orphelin (aucun `[` ouvert). */
  crochetFermantOrphelin = "syntaxe_dynamique/crochet_fermant_orphelin",
  /** syntaxe dynamique: mot-clé de continuation (sinon, sinonsi, ou, puis) hors d’un cadre conditionnel ouvert. */
  motCleHorsCadre = "syntaxe_dynamique/mot_cle_hors_cadre",
  /** syntaxe dynamique: [fin] / [fin si] / [fin choix] sans cadre correspondant ouvert. */
  finBlocSansOuverture = "syntaxe_dynamique/fin_bloc_sans_ouverture",
  /** syntaxe dynamique: [sinon] ou [sinonsi …] placé après un [sinon] du même cadre. */
  sinonApresSinon = "syntaxe_dynamique/sinon_apres_sinon",
  /** syntaxe dynamique: cadre conditionnel ouvert non fermé en fin de texte. */
  cadreNonFerme = "syntaxe_dynamique/cadre_non_ferme",

  /** placement: « ici » utilisé alors qu’aucun lieu n’a été défini auparavant. */
  lieuPrealableIntrouvable = "placement/lieu_prealable_introuvable",
  /** placement: « dessus/dedans/dessous » utilisé alors qu’aucun élément n’a été défini auparavant. */
  elementPrealableIntrouvable = "placement/element_prealable_introuvable",
  /** placement: le lieu précédent porte le même nom que l’élément à placer « ici ». */
  conflitNomLieuElement = "placement/conflit_nom_lieu_element",
  /** placement: mot-clé de position non reconnu. */
  motClePositionInconnu = "placement/mot_cle_position_inconnu",

  /** type: le type parent d’un type personnalisé a été défini plusieurs fois. */
  typeParentRedefini = "type/type_parent_redefini",

  /** génération: intitulé d’une valeur de propriété non supporté. */
  generationIntituleNonSupporte = "generation/intitule_non_supporte",
  /** génération: position d’un élément introuvable. */
  generationPositionIntrouvable = "generation/position_introuvable",
  /** génération: élément positionné à plusieurs endroits (non autorisé hors lieux/obstacles). */
  generationPositionsMultiples = "generation/positions_multiples",
  /** génération: une action est définie plusieurs fois. */
  generationActionDupliquee = "generation/action_dupliquee",
  /** génération: « règle remplacer » correspond à plusieurs actions (ambiguë). */
  generationRegleRemplacerAmbigue = "generation/regle_remplacer_ambigue",
  /** génération: deux « règle remplacer » pour la même action. */
  generationRegleRemplacerMultiple = "generation/regle_remplacer_multiple",
  /** génération: aucune commande trouvée pour la règle. */
  generationRegleSansCommande = "generation/regle_sans_commande",
  /** génération: plusieurs commandes trouvées pour la règle. */
  generationRegleCommandesMultiples = "generation/regle_commandes_multiples",
  /** génération: positionnement d’un lieu — position relative pas trouvée. */
  generationLieuPositionIntrouvable = "generation/lieu_position_introuvable",
  /** génération: positionnement d’un lieu — lieu lié pas trouvé. */
  generationLieuLieIntrouvable = "generation/lieu_lie_introuvable",
  /** génération: négation d’un état qui n’existe pas. */
  generationEtatNegationInexistant = "generation/etat_negation_inexistant",
  /** génération: état déjà déclaré (moteur ou déclaration précédente). */
  generationEtatDejaDeclare = "generation/etat_deja_declare",
  /** génération: bascule sur un état déjà déclaré. */
  generationBasculeEtatDejaDeclare = "generation/bascule_etat_deja_declare",
  /** génération: groupe « se contredisent » sur un état déjà déclaré. */
  generationGroupeEtatDejaDeclare = "generation/groupe_etat_deja_declare",
  /** génération: état utilisé dans une relation inexistant (création auto désactivée). */
  generationEtatRelationInexistant = "generation/etat_relation_inexistant",

}