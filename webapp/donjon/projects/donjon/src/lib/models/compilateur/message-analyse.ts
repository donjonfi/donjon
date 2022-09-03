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
    /** Phrase du scénario concernée */
    phrase: Phrase,
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
  ) {
    this.numeroLigne = phrase.ligne;
    this.phrase = phrase.toString();
    this.titreRoutine = routine?.titre ?? undefined;
  }

  /** Numéro de la ligne mis en forme. */
  get numeroLigneFormate(): string {
    if(this._numeroLigneFormate === undefined){
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

  erreurDonjon = "erreur_donjon",

}

/**
 * Code du message
 */
export enum CodeMessage {

  /** structure bloc: sinonsi se trouve après un sinon */
  sinonsiSuitSinon = "structure_bloc/sinonsi_suit_sinon",
  /** structure bloc: sinon se trouve après un sinon */
  sinonSuitSinon = "structure_bloc/sinon_suit_sinon",
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

  /** syntaxe routine: la routine n’a pas été trouvée =>  */
  routineIntrouvable = "syntaxe_routine/routine_introuvable",
  /** syntaxe routine: la règle n’a pas été trouvée => problème de syntaxe dans l’entête */
  regleIntrouvable = "syntaxe_routine/regle_introuvable",
  /** syntaxe routine: nom invalide => le nom d’une routine simple doit faire exactement un mot. */
  nomRoutineInvalide = "syntaxe_routine/nom_routine_invalide",

  /** erreur Donjon: étiquette introuvable alors qu’elle devrait avoir été pré-validée */
  etiquetteEnteteIntrouvable = "erreur_donjon/etiquette_entete_introuvable",

}