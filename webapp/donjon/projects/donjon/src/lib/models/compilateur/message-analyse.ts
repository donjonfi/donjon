import { BalisesHtml } from "../../utils/jeu/balises-html";
import { Phrase } from "./phrase";
import { Routine } from "./routine";

/** Message à l’utilisateur suite à l’analyse de son scénario. */
export class MessageAnalyse {

  private _htmlCorps

  constructor(
    /** Type de message (conseil, probleme, erreur) */
    public type: EMessageAnalyse,
    /** Phrase du scénario concernée */
    public phrase: Phrase,
    /** Catégorie du message */
    public categorie: CategorieMessage,
    /** Code du message */
    public code: CodeMessage,
    /** Titre du message */
    public titre: string,
    /** Corps du message */
    public corps: string,
    /** Routine liée au message */
    public routine: Routine | undefined = undefined,
  ) {
    this._htmlCorps = BalisesHtml.convertirEnHtml(corps, '');
  }

  get ligne(): string {
    return ("    " + this.phrase.ligne).slice(-5);
  }
  get htmlCorps(): string {
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
  syntaxeControle = "syntaxe_controle",
  structureBloc = "structure_bloc",
  syntaxeRoutine = "syntaxe_routine",
  structureRoutine = "structure_routine",

}

/**
 * Code du message
 */
export enum CodeMessage {
  /** structure: fin bloc différent de celui attendu (ex: fin choix au lieu de fin si) */
  finBlocDifferent = "structure_bloc/fin_bloc_different",
  /** structure: fin bloc différent de celui attendu (ex: fin choix au lieu de fin si) */
  finBlocManquant = "structure_bloc/fin_bloc_manquant",
  /** fin de bloc mal écrit (ex: fin sii) */
  finBlocInconnu = "syntaxe_controle/fin_bloc_inconnu",
  /** bloc attendu pas trouvé => problème de syntaxe dans l’entête */
  instructionControleIntrouvable = "syntaxe_controle/instruction_controle_introuvable",
  /** l’instruction « si » attendue n’a pas été trouvée => problème de syntaxe dans l’entête (condition) */
  InstructionSiIntrouvable = "syntaxe_controle/instruction_si_introuvable",
  /** la règle n’a pas été trouvée => problème de syntaxe dans l’entête */
  RegleIntrouvable = "syntaxe_routine/regle_introuvable",
}