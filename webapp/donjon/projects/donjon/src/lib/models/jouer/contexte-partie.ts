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
  // /** Index de la prochaine commande dans l’historique des commandes de la partie */
  // private _indexProchaineCommandePartie: number = 0;


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

    // initialiser le générateur de nombres aléatoire en début de partie
    // this.initialiserAleatoire();
    this.nouvelleGraineAleatoire(this.jeu.graine);
  }

  public get etapesPartie(): string[] {
    return this._etapesPartie;
  }

  // public get indexProchaineCommandePartie(): number {
  //   return this._indexProchaineCommandePartie;
  // }

  //   /** Sauvegarder la commande dans l’historique des commandes et incrémenter l’index de la prochaine commande.
  //  * L’index de la prochaine commande est utilisé pour la sauvegarde du déclenchement des routines programmées.
  //  */
  //   public ajouterCommandeOuReponseDansSauvegarde(commandeBrute: string) {
  //     this._indexProchaineCommandePartie = this._commandesEtReponsesPartie.push(commandeBrute);
  //   }

  public ajouterCommandeDansSauvegarde(commandeBrute: string) {
    this._etapesPartie.push(ExprReg.caractereCommande + ":" + commandeBrute);
  }

  public ajouterReponseDansSauvegarde(reponseBrute: string) {
    this._etapesPartie.push(ExprReg.caractereReponse + ":" + reponseBrute);
  }

  // /** Initialiser le générateur de nombres aléatoires. */
  // private initialiserAleatoire() {
  //   // graine pas encore définie: on en crée une nouvelle
  //   if (this.jeu.graine == undefined) {
  //     this.nouvelleGraineAleatoire();
  //     // graine déjà définie : on la réutilise
  //   } else {
  //     AleatoireUtils.init(this.jeu.graine);
  //   }
  // }

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

    // let graine = Math.random();
    // // sauvegarde v2
    // this.ajouterGraineDansHistorique(graine, this.indexProchaineCommandePartie);
    // // sauvegarde v1
    // this.jeu.graine = graine.toString();
    // // initialisation du jeu avec la nouvelle graine
    // AleatoireUtils.init(this.jeu.graine);
  }

  // /**
  //  * Historique des routines programmées déjà déclenchées.
  //  * (sauvegarde V2)
  //  */
  // get sauvegardeDeclenchements() {
  //   return this._sauvegardeDeclenchements;
  // }

  // private _sauvegardeDeclenchements: DeclenchementPasse[] = [];

  // public ajouterDeclenchementDansSauvegarde(routine: string, indexProchaineCommande: number) {
  //   let dec = new DeclenchementPasse();
  //   dec.routine = routine;
  //   dec.idxComSuivante = indexProchaineCommande;
  //   this.sauvegardeDeclenchements.push(dec);
  // }

  public ajouterDeclenchementDansSauvegarde(routine: string) {
    this.etapesPartie.push(`${ExprReg.caractereDeclenchement}:${routine}`);
  }

  // /**
  //  * Historique de l’ensemble des graines utilisées pour
  //  * initialiser le générateur de nombres aléatoires.
  //  * (sauvegarde V2)
  //  */
  // get historiqueGraines() {
  //   return this._historiqueGraines;
  // }
  // _historiqueGraines: GraineSauvegarde[] = [];

  // public ajouterGraineDansHistorique(graine: number, indexProchaineCommande: number) {
  //   let newGraine = new GraineSauvegarde();
  //   newGraine.graine = graine;
  //   newGraine.idxComSuivante = indexProchaineCommande;
  //   this._historiqueGraines.push(newGraine);
  // }

  // /** 
  //  * Commandes à exécuter à l'initialisation du jeu
  //  * afin de rétablir la sauvegarde précédemment chargée.
  //  */
  // public commandesRestaurationSauvegarde: string[] | undefined;

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

  public enleverDerniereCommande() {
    this._etapesPartie.pop();

  }

  // /** Récupérer la liste de l'ensemble des commandes de la partie. */
  // public getCommandesEtReponsesPartieNettoyees(): string[] {
  //   // enlever le caractère spécial qui identifie les réponses et renvoyer 
  //   // l'historique de la partie.
  //   return CommandesUtils.enleverCaractereReponse(this._commandesEtReponsesPartie);
  // }

  public unload() {
    // supprimer les musiques en cours éventuelles
    this.ins.unload();
  }

}