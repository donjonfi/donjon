import { Choix } from "./choix";
import { ContexteAnalyse } from "./contexte-analyse";
import { ETypeBloc } from "./bloc-ouvert";
import { ElementGenerique } from "./element-generique";
import { Instruction } from "./instruction";
import { Reaction } from "./reaction";
import { Regle } from "./regle";

export class ContexteSeparerInstructions {

  constructor(
    instructionsBrutes: string,
    public ctxAnalyse: ContexteAnalyse,
    public ligne: number,
    public regle: Regle = null,
    public reaction: Reaction = null,
    public el: ElementGenerique = null
  ) {
    this.listeInstructions = instructionsBrutes.split(';')
  }

  public indexCurInstruction = 0;

  public listeInstructions: string[];

  /** La liste principale des instructions déjà interprétées */
  public instructionsPrincipales: Instruction[] = [];

  // BLOCS
  public blocsOuverts: ETypeBloc[] = [];
  // BLOCS CONDITIONNELS
  /** index du bloc conditionnel  avec lequel on est actuellement occupé */
  public indexBlocCondCommence = -1;
  /** listes d’instructions liés aux blocs conditionnels ouverts (partie SI)  */
  public instructionsBlocsCondEnCoursSi: Instruction[][] = [];
  /** listes d’instructions liés aux blocs conditionnels ouverts (partie SINON)  */
  public instructionsBlocsCondEnCoursSinon: Instruction[][] = [];
  /** est ce qu’on se trouve actuellement dans la partie sinon du bloc conditionnel ouvert ? */
  public dansBlocSinon: boolean[] = [];
  /** est-ce que la prochaine instsructions est attendue (pour cloturer un si rapide) */
  public prochaineInstructionAttenduePourSiRapide: Instruction[] = null;
  /** est-ce que le prochain si est un « sinon si » ? */
  public prochainSiEstSinonSi = false;
  // BLOCS CHOIX
  /** index du bloc choisir avec lequel on est actuellement occupé */
  public indexBlocChoisirCommence = -1;
  /** listes de choix liés aux blocs choisir ouverts */
  public choixBlocsChoisirEnCours: Choix[][] = [];
  /** index du bloc choix avec lequel on est actuellement occupé */
  public indexBlocChoixCommence = -1;
  /** liste d’instructions liées aux blocs choix ouverts */
  public instructionsBlocsChoixEnCours: Instruction[][] = [];

}