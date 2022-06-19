import { EBlocPrincipal } from "./bloc-principal";

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
    // bloc principal dans lequel se trouve la phrase (action, règle, réaction)
    public region: EBlocPrincipal,
  ) { }


}
