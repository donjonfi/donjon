import { AnalyseurCommunUtils } from "../../utils/compilation/analyseur/analyseur-commun-utils";
import { ERoutine } from "./routine";
import { PhraseUtils } from "../../utils/commun/phrase-utils";

export class Phrase {

  constructor(
    // la phrase est constituée de une ou plusieurs parties.
    public morceaux: string[],
    // la phrase a déjà été traitée
    public traitee: boolean,
    // le sujet de la phrase (utilisé pour retrouvé le sujet cible lorsque le sujet est un pronom)
    public sujet: Element,
    // ordre de la phrase
    public ordre: number,
    // ligne dans le scénario où se trouvait cette phrase
    public ligne: number,
    // utilisé pour découper les blocs d’instructions
    public finie: boolean,
    // routine dans laquelle se trouve la phrase (routine, action, règle, réaction)
    public region: ERoutine,
  ) { }

  /**
   * Retrouver la phrase brute à partir de la phrase décomposée.
   * 
   * @param phrase 
   * @returns 
   */
  public static retrouverPhraseBrute(phrase: Phrase): string {
    let phraseBrute = "";
    phrase.morceaux.forEach(morceau => {
      phraseBrute += morceau;
    });
    phraseBrute = AnalyseurCommunUtils.nettoyerInstruction(phraseBrute);
    return phraseBrute;
  }

  toString() {
    return Phrase.retrouverPhraseBrute(this);
  }

}
