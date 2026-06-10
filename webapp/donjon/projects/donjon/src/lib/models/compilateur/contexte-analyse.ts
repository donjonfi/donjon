import { Abreviation } from "./abreviation";
import { Action } from "./action";
import { Aide } from "../commun/aide";
import { DeclarationEtat } from "./declaration-etat";
import { Definition } from "./definition";
import { ElementGenerique } from "./element-generique";
import { Parametres } from "../commun/parametres";
import { ProprieteConcept } from "../commun/propriete-element";
import { ReactionBeta } from "./reaction-beta";
import { RegleActionsTactiles } from "../jeu/regle-actions-tactiles";
import { Regle } from "../../interfaces/compilateur/regle";

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
    public declarationsEtats = new Array<DeclarationEtat>(),
  ) { }

  /** Actions principales/secondaires proposées par l’interface tactile. */
  public actionsTactiles = new Array<RegleActionsTactiles>();

  public dernierePropriete: ProprieteConcept = null;
  public dernierElementGenerique: ElementGenerique = null;
  public dernierLieu: ElementGenerique = null;

  /**
   * Signale qu'une phrase « Il y a … » a référencé un nom qui n'est PAS une ressource définie.
   * Porte le nom fautif (sinon null). Permet à l'analyseur V8 d'émettre UN seul message bien
   * formaté (via ctx.probleme) et de considérer la phrase comme traitée (pas de « Définition attendue »).
   */
  public placementNonRessource: string | null = null;

  /** 
   * (beta) Ajouter une nouvelle erreur.
   * @deprecated Utiliser une des méthode conseil(), probleme() ou erreur() à la place.
   */
  public ajouterErreur(ligne: number, erreur: string) {
    let index: number;
    if (ligne) {
      index = this.erreurs.push(("0000" + ligne).slice(-5) + " : " + erreur);
    } else {
      index = this.erreurs.push(erreur);
    }
    console.error(this.erreurs[index - 1]);
  }

}
