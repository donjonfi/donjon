import { Abreviation } from "./abreviation";
import { Action } from "./action";
import { Aide } from "../commun/aide";
import { Definition } from "./definition";
import { ElementGenerique } from "./element-generique";
import { Parametres } from "../commun/parametres";
import { ProprieteElement } from "../commun/propriete-element";
import { Reaction } from "./reaction";
import { Regle } from "./regle";

export class ContexteAnalyse {
  constructor(
    public verbeux: boolean = false,
    public elementsGeneriques = new Array<ElementGenerique>(),
    public regles = new Array<Regle>(),
    public actions = new Array<Action>(),
    public abreviations = new Array<Abreviation>(),
    public aides = new Array<Aide>(),
    public typesUtilisateur = new Map<string, Definition>(),
    public erreurs = new Array<string>(),
    public parametres = new Parametres(),
  ) { }

  public dernierePropriete: ProprieteElement = null;
  public derniereReaction: Reaction = null;
  public dernierElementGenerique: ElementGenerique = null;
  public dernierLieu: ElementGenerique = null;

}
