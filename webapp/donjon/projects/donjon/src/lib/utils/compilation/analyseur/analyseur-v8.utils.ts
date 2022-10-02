import { EInstructionControle, InstructionControle } from "../../../models/compilateur/instruction-controle";
import { ERoutine, Routine } from "../../../models/compilateur/routine";

import { AnalyseurV8Instructions } from "./analyseur-v8.instructions";
import { ExprReg } from "../expr-reg";
import { Phrase } from "../../../models/compilateur/phrase";

export class AnalyseurV8Utils {

  /**
   * Déterminer si la phrase correspond exactement à l’étiquette spécifiée.
   * @param etiquette étiquette à rechercher doit être définie en minuscules. Il est possible d’en définir plusieurs variantes (avec/sans accent)
   * @returns true si la phrase correspond exactement à l’étiquette spécifiée. 
   */
  public static chercherEtiquetteExacte(etiquette: string[], phrase: Phrase | string, terminePar2Points: ObligatoireFacultatif): boolean {
    let instruction: string;
    if (phrase instanceof Phrase) {
      instruction = Phrase.retrouverPhraseBrute(phrase);
    } else {
      instruction = phrase;
    }

    if (!etiquette?.length)
      throw new Error("chercherEtiquetteExacte: l’argument etiquette doit contenir au moins une étiquette.");
    let regExp: RegExp;
    let intituleEtiquette: string;
    let deuxPoints: string;
    if (etiquette.length == 1) {
      intituleEtiquette = etiquette[0];
    } else {
      intituleEtiquette = '(' + etiquette.join('|') + ')';
      // regExp = new RegExp('^(' + etiquette.join('|') + ')', 'i');
    }

    if (terminePar2Points == ObligatoireFacultatif.facultatif) {
      deuxPoints = '(?:( )*\\:)?';
    } else {
      deuxPoints = '(?:( )*\\:)';
    }

    regExp = new RegExp('^' + intituleEtiquette + deuxPoints, 'i');

    let resultat = regExp.exec(instruction);

    if (resultat) {
      return true;
    } else {
      return false;
    }

  }

  /** 
   * Retrouver une étiquette dans la phrase.
   * ex:
   *  - routine MaRoutine:
   *  - sinon
   *  - choix "":
   *  - choisir parmi les couleurs:
   * 
   * Tests unitaires: ✔️ (oui)
   * @param motCle mot clé qui débute l’étiquette. Il doit être défini en minuscules.  (ex: routine, sinon, choix, si, …) Il est possible d’en définir plusieurs variantes (avec/sans accent)
   * @returns reste de l’étiquette (ce qui suit le mot clé, sans les «:» finaux)
   */
  public static chercherEtiquetteEtReste(motCle: string[], phrase: Phrase | string, terminePar2Points: ObligatoireFacultatif): string | undefined {
    let reste: string | undefined;
    let instruction: string;
    if (phrase instanceof Phrase) {
      instruction = Phrase.retrouverPhraseBrute(phrase);
    } else {
      instruction = phrase;
    }

    if (!motCle?.length)
      throw new Error("chercherEtiquetteEtReste: l’argument motCle doit contenir au moins un mot clé.");
    let regExp: RegExp;
    if (motCle.length == 1) {
      regExp = new RegExp('^(' + motCle[0] + ')\\b', 'i');
    } else {
      regExp = new RegExp('^(' + motCle.join('|') + ')\\b', 'i');
    }
    // si on a retrouvé le mot clé
    let resultat = regExp.exec(instruction);
    if (resultat) {
      // si termine par :
      if (instruction.endsWith(':')) {
        // retourner le reste de l’étiquette (sans les :)
        reste = instruction.slice(resultat[1].length, instruction.length - 1).trim();
        // sinon si les : ne sont pas obligatoires
      } else if (terminePar2Points == ObligatoireFacultatif.facultatif) {
        // retourner le reste de l’étiquette
        reste = instruction.slice(resultat[1].length, instruction.length).trim();
      }
    }
    return reste;
  }

  /** 
   * Retrouver une étiquette dans la phrase.
   * ex:
   *  - ceci:
   *  - cela:
   * 
   * Tests unitaires: ❌ (non)
   * @param motCle mot clé qui débute l’étiquette. Il doit être défini en minuscules.  (ex: ceci, cela, …) Il est possible d’en définir plusieurs différents.
   * @returns étiquette trouvée parmi les propositions ou undefined si aucune étiquette correspondante trouvée.
   */
  public static chercherEtiquetteParmiListe(motCle: string[], phrase: Phrase | string, terminePar2Points: ObligatoireFacultatif): string | undefined {
    let motCleTrouve: string | undefined;
    let phraseBrute: string

    if (phrase instanceof Phrase) {
      phraseBrute = Phrase.retrouverPhraseBrute(phrase);
    } else {
      phraseBrute = phrase;
    }

    let regExp: RegExp;
    if (!motCle?.length)
      throw new Error("chercherEtiquetteParmiListe: l’argument motCle doit contenir au moins un mot clé.");

    if (motCle.length == 1) {
      regExp = new RegExp('^(' + motCle[0] + ')\\b', 'i');
    } else {
      regExp = new RegExp('^(' + motCle.join('|') + ')\\b', 'i');
    }
    // si on a retrouvé le mot clé
    let resultat = regExp.exec(phraseBrute);
    if (resultat) {
      // si termine par :
      if (phraseBrute.endsWith(':')) {
        // retourner le reste de l’étiquette (sans les :)
        motCleTrouve = resultat[1];
        // sinon si les : ne sont pas obligatoires
      } else if (terminePar2Points == ObligatoireFacultatif.facultatif) {
        // retourner le reste de l’étiquette
        motCleTrouve = resultat[1];
      }
    }
    return motCleTrouve;
  }

  /**
   * Est-ce que le mot fourni contient exactement 1 mot ?
   * Tests unitaires: ✔️ (oui)
   */
  public static contientExactement1Mot(mot: string): boolean {
    if (mot) {
      const motNettoye = mot.trim();
      return (motNettoye.length && motNettoye.indexOf(' ') === -1);
    } else {
      return false;
    }
  }

  /**
   * La phrase fournie est est-elle une fin de routine ?
   * @param phrase phrase à analyser
   * @returns le type de fin de routine trouvé ou undefined s’il ne s’agit pas d’une fin de routine.
   * Tests unitaires: ✔️ (oui)
   */
  public static chercherFinRoutine(phrase: Phrase): ERoutine | undefined {
    const fermetureRoutine = ExprReg.xFinRoutine.exec(phrase.morceaux[0])
    // fermeture d’une routine (routine, règle, action, réaction, …)
    if (fermetureRoutine) {
      return Routine.ParseType(fermetureRoutine[1]);
    } else {
      return undefined;
    }
  }

  /**
   * La phrase fournie est est-elle un début de routine ?
   * @param phrase phrase à analyser
   * @returns le type de début de routine trouvé ou undefined s’il ne s’agit pas d’un début de routine.
   * 
   * Tests unitaires: ✔️ (oui)
   */
  public static chercherDebutRoutine(phrase: Phrase): ERoutine | undefined {
    const ouvertureRoutine = ExprReg.xDebutRoutine.exec(phrase.morceaux[0]);
    // ouverture d’une routine (routine, règle, action, réaction, …)
    if (ouvertureRoutine) {
      return Routine.ParseType(ouvertureRoutine[1]);
    } else {
      return undefined;
    }
  }

  /**
   * La phrase fournie est est-elle un début de bloc contrôle (si, choisir) ?
   * @param phrase phrase à analyser
   * @returns le type de début de bloc contrôle trouvé ou undefined s’il ne s’agit pas d’un début de bloc contrôle.
   * 
   * Tests unitaires: ❌ (non)
   */
  public static chercherDebutInstructionControle(phrase: Phrase): EInstructionControle | undefined {
    const ouvertureBloc = ExprReg.xDebutInstructionControle.exec(phrase.morceaux[0]);
    // ouverture d’un bloc de contrôle (si, choisir)
    if (ouvertureBloc) {
      return InstructionControle.ParseType(ouvertureBloc[1]);
    } else {
      return undefined;
    }
  }

  /**
   * La phrase fournie est est-elle une fin de bloc contrôle ?
   * @param phrase phrase à analyser
   * @returns le type de fin de bloc contrôle trouvé ou undefined s’il ne s’agit pas d’une fin de bloc contrôle.
   * 
   * Tests unitaires: ❌ (non)
   */
  public static chercherFinInstructionControle(phrase: Phrase): EInstructionControle | undefined {
    const fermetureBloc = ExprReg.xFinInstructionControle.exec(phrase.morceaux[0])
    // fermeture d’une routine (routine, règle, action, réaction, …)
    if (fermetureBloc) {
      return InstructionControle.ParseType(fermetureBloc[1]);
    } else {
      return undefined;
    }
  }

  /**
   * La phrase fournie est est-elle une fin de bloc inconnu ?
   * @param phrase phrase à analyser
   * @returns true si un fin xxxx a été trouvé.
   * 
   * Tests unitaires: ❌ (non)
   */
  public static chercherFinBlocInconnu(phrase: Phrase): boolean {
    const fermetureBloc = ExprReg.xFinBlocErrone.test(phrase.morceaux[0])
    return fermetureBloc;
  }

}

export enum ObligatoireFacultatif {
  obligatoire = 1,
  facultatif = 2,
}
