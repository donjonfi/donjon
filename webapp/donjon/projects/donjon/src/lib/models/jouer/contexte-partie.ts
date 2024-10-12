import { AleatoireUtils } from "../../utils/jeu/aleatoire-utils";
import { Commandeur } from "../../utils/jeu/commandeur";
import { ContexteEcran } from "./contexte-ecran";
import { Declencheur } from "../../utils/jeu/declencheur";
import { ElementsJeuUtils } from "../../utils/commun/elements-jeu-utils";
import { Instructions } from "../../utils/jeu/instructions";
import { Jeu } from "../jeu/jeu";
import { StringUtils } from "../../utils/commun/string.utils";
import { Sauvegarde } from "./sauvegarde";
import { versionNum } from "../commun/constantes";
import { ExprReg } from "donjon";

export class ContextePartie {

  public readonly com: Commandeur;
  public readonly ins: Instructions;
  public readonly eju: ElementsJeuUtils;

  public readonly dec: Declencheur;

  /** les écrans de jeu  */
  public readonly ecran: ContexteEcran;

  private _dossierRessourcesComplet: string;

  /** historique des commandes déjà exécutées depuis le début de la partie*/
  private _etapesPartie: string[] = [];

  constructor(
    /** L’état du jeu correspondant à la partie. */
    public jeu: Jeu,
    /** Le document (pour le thème) */
    public document: Document | undefined = undefined,
    /** Faut-il afficher un maximum de messages d’erreurs ? */
    public verbeux: boolean = false,
    /** Le débogueur est-il actif ? */
    public debogueur: boolean = false,
  ) {
    this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
    this.ins = new Instructions(this.jeu, this.eju, this.document, this.verbeux);
    this.dec = new Declencheur(this.jeu.auditeurs, this.verbeux);
    this.com = new Commandeur(this.jeu, this.ins, this.dec, this.verbeux, this.debogueur);
    // fournir le commandeur aux instructions (pour instruction « exécuter commande »)
    this.ins.commandeur = this.com;

    // définir le dossier qui contient les ressources du jeu (musiques, images, …)
    this._dossierRessourcesComplet = Jeu.dossierRessources;
    if (this.jeu.sousDossierRessources) {
      // sécurisé nom du sous-dossier (au cas où on a chipoté mais normalement devrait déjà être fait)
      const sousDossierSecurise = StringUtils.nomDeDossierSecurise(this.jeu.sousDossierRessources);
      if (sousDossierSecurise.length) {
        this._dossierRessourcesComplet = Jeu.dossierRessources + '/' + sousDossierSecurise;
      }
    }

    this.ecran = new ContexteEcran(this._dossierRessourcesComplet);

  }

  public get etapesPartie(): string[] {
    return this._etapesPartie;
  }

  public ajouterCommandeDansSauvegarde(commandeBrute: string) {
    this._etapesPartie.push(ExprReg.caractereCommande + ":" + commandeBrute);
  }

  public ajouterReponseDansSauvegarde(reponseBrute: string) {
    this._etapesPartie.push(ExprReg.caractereReponse + ":" + reponseBrute);
  }

  /** 
   * Changer la graine pour la générateur de nombres aléatoires.
   */
  public nouvelleGraineAleatoire(graineForcee?: string | undefined): void {
    // /!\ ATTENTION: il faut sauvegarder l’ensemble des graines de la partie
    // et le moment où on les a changé afin de pouvoir restaurer une partie sauvegardée !

    // création d’une nouvelle graine

    let nouvelleGraine: string;

    if (graineForcee !== undefined) {
      nouvelleGraine = graineForcee;
    } else {
      nouvelleGraine = Math.random().toString();
    }
    AleatoireUtils.init(nouvelleGraine);

    // sauvegarde de la graine
    this.etapesPartie.push(`${ExprReg.caractereGraine}:${nouvelleGraine}`);
  }

  public ajouterDeclenchementDansSauvegarde(routine: string) {
    this.etapesPartie.push(`${ExprReg.caractereDeclenchement}:${routine}`);
  }

  /** Dossier qui contient les ressources de jeu (images, musiques, …) */
  public get dossierRessourcesComplet(): string {
    return this._dossierRessourcesComplet;
  }

  public creerSauvegardeSolution(): Sauvegarde {

    let sauvegarde = new Sauvegarde();
    // version
    sauvegarde.version = versionNum;
    // routines programmées pas encore déclenchées
    sauvegarde.declenchementsFuturs = this.jeu.declenchementsFuturs;
    // commandes du joueur
    sauvegarde.etapesSauvegarde = this.etapesPartie;
    // scénario (on ne le connait pas ici, il sera ajouté ensuite par Donjon Jouer)
    sauvegarde.scenario = undefined;

    return sauvegarde;
  }

  public enleverCommandeGenererSolution() {
    this._etapesPartie.pop();
  }

  public unload() {
    // supprimer les musiques en cours éventuelles
    this.ins.unload();
  }

}