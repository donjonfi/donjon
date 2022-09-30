import { CategorieMessage, CodeMessage, EMessageAnalyse, MessageAnalyse } from "./message-analyse";

import { BlocInstructions } from "./bloc-instructions";
import { ContexteAnalyse } from "./contexte-analyse";
import { ElementGenerique } from "./element-generique";
import { Phrase } from "./phrase";
import { Routine } from "./routine";
import { RoutineAction } from "./routine-action";
import { RoutineRegle } from "./routine-regle";
import { RoutineSimple } from "./routine-simple";

export class ContexteAnalyseV8 extends ContexteAnalyse {

  public indexProchainePhrase = 0;

  /** Est on occupé à analyser le fichier contenant les actions de base ? */
  public analyseFichierActionsEnCours = false;

  /**
   * Routines présentes dans le scénario.
   * (routines simples, règles, actions, réactions)
   */
  public routines: Routine[] = [];

  /** Les routines simples présentes dans le scénario. */
  public routinesSimples: RoutineSimple[] = [];
  /** Les routines « action » présentes dans le scénario. */
  public routinesAction: RoutineAction[] = [];
  /** Les routines « règle » présentes dans le scénario. */
  public routinesRegles: RoutineRegle[] = [];

  public dernierBloc: BlocInstructions

  /** 
   * Message destinés à aider l’utilisateur à résoudre les problèmes dans son scénario.
   */
  public readonly messages: MessageAnalyse[] = [];

  /**
   * Obtenir la dernière routine
   */
  get derniereRoutine(): Routine | undefined {
    return this.routines?.length ? this.routines[this.routines.length - 1] : undefined;
  }

  /**
   * Obtenir la dernière routine encore ouverte ou undefined si la dernière routine est fermée.
   */
  get routineOuverte(): Routine | undefined {
    let retVal: Routine | undefined;
    if (this.routines?.length && this.routines[this.routines.length - 1].ouvert) {
      retVal = this.routines[this.routines.length - 1];
    }
    return retVal;
  }

  /**
   * Obtenir la routine qui inclut la ligne spécifiée ou undefined sa la ligne ne fait pas partie d'une routine.
   */
  getRoutineLigne(ligne: number): Routine | undefined {
    let retVal: Routine | undefined;
    if (this.routines?.length) {
      retVal = this.routines.find(x => x.debut <= ligne && x.fin >= ligne);
    }
    return retVal;
  }

  /**
   * Ajouter un message de type « erreur Donjon » à destination de l’auteur du scénario.
   * @param phrase Phrase du scénario concernée
   * @param categorie Catégorie du message
   * @param code Code du message
   * @param titre Titre du message
   * @param corps Corps du message
   * @param routine Routine liée au message
   */
  erreur(phrase: Phrase, routine: Routine | undefined,
    categorie: CategorieMessage, code: CodeMessage,
    titre: string, corps: string,
  ): void {
    this.ajouterMessage(EMessageAnalyse.erreur, phrase, categorie, code, titre, corps, routine);
  }

  /**
   * Ajouter un message de type « conseil scénario » à destination de l’auteur du scénario.
   * @param phrase Phrase du scénario concernée
   * @param categorie Catégorie du message
   * @param code Code du message
   * @param titre Titre du message
   * @param corps Corps du message
   * @param routine Routine liée au message
   */
  conseil(phrase: Phrase, routine: Routine | undefined,
    categorie: CategorieMessage, code: CodeMessage,
    titre: string, corps: string,
  ): void {
    this.ajouterMessage(EMessageAnalyse.conseil, phrase, categorie, code, titre, corps, routine);
  }

  /**
   * Ajouter un message de type « problème scénario » à destination de l’auteur du scénario.
   * @param phrase Phrase du scénario concernée
   * @param categorie Catégorie du message
   * @param code Code du message
   * @param titre Titre du message
   * @param corps Corps du message
   * @param routine Routine liée au message
   */
  probleme(phrase: Phrase, routine: Routine | undefined,
    categorie: CategorieMessage, code: CodeMessage,
    titre: string, corps: string,
  ): void {
    this.ajouterMessage(EMessageAnalyse.probleme, phrase, categorie, code, titre, corps, routine);
  }

  /**
   * Ajouter un message à destination de l’auteur du scénario.
   * @param type Type de message (conseil, probleme, erreur)
   * @param phrase Phrase du scénario concernée
   * @param categorie Catégorie du message
   * @param code Code du message
   * @param titre Titre du message
   * @param corps Corps du message
   * @param routine Routine liée au message
   */
  private ajouterMessage(
    type: EMessageAnalyse, phrase: Phrase, categorie: CategorieMessage, code: CodeMessage,
    titre: string, corps: string, routine: Routine | undefined = undefined,
  ): void {
    const message = new MessageAnalyse(type, phrase, categorie, code, titre, corps, routine, this.analyseFichierActionsEnCours);
    this.messages.push(message);
    // écrire l’erreur dans la console
    switch (message.type) {
      case EMessageAnalyse.conseil:
        console.info("CONS:", message);
        break;
      case EMessageAnalyse.probleme:
        console.warn("PROB:", message);
        break;
      case EMessageAnalyse.erreur:
      default:
        console.error("ERRE:", message);
        break;
    }
  }

  private indexDernierePhraseanalysee = -1;

  /** 
   * Obtenir la prochaine phrase (en se basant sur indexProchainePhrase, celui-ci ne sera pas modifié).
   * La phrase sera copiée dans les logs du navigateur si le mode verbeux est actif et si elle a changé depuis le dernier appel.
  */
  public getPhraseAnalysee(phrases: Phrase[]): Phrase {
    const phraseAnalysee = phrases[this.indexProchainePhrase];
    // phrase différente depuis le dernier appel ?
    if (this.indexDernierePhraseanalysee !== this.indexProchainePhrase) {
      this.indexDernierePhraseanalysee = this.indexProchainePhrase;
      this.logPhrase(phraseAnalysee);
    }
    return phraseAnalysee;
  }

  /** Écrire la phrase dans les logs du navigateur si le mode verbeux est actif. */
  public logPhrase(phraseAnalysee: Phrase) {
    if (this.verbeux) {
      console.log(`—————————————————————————————————————`);
      console.log(`[${this.analyseFichierActionsEnCours ? 'A' : 'S'}−${phraseAnalysee.ligne}] ${phraseAnalysee.toString()}`);
    }
  }

  public logResultatOk(message: string) {
    if (this.verbeux) {
      console.log(`✔️ ${message}`);
    }
  }

  public logResultatKo(message: string) {
    if (this.verbeux) {
      console.log(`❌ ${message}`);
    }
  }

  public logResultatTemp(message: string) {
    if (this.verbeux) {
      console.log(`⏳ ${message}`);
    }
  }

  public trouverElementGenerique(nom: string, epithete: string): ElementGenerique {
    let retVal: ElementGenerique;
    const elementConcerneNom = nom.toLowerCase();
    const elementConcerneEpithete = epithete ? epithete.toLowerCase() : null;
    const elementsTrouves = this.elementsGeneriques.filter(x => x.nom.toLowerCase() == elementConcerneNom && x.epithete?.toLowerCase() == elementConcerneEpithete);
    if (elementsTrouves.length === 1) {
      retVal = elementsTrouves[0];
    } else {
      this.logResultatKo(`trouverElement: plusieurs résultats trouvés pour « ${nom}${epithete ? (' ' + epithete) : ''} »`);
    }
    return retVal;
  }

}
