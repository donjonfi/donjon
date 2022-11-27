import { AleatoireUtils } from "../../utils/jeu/aleatoire-utils";
import { Commandeur } from "../../utils/jeu/commandeur";
import { ContexteEcran } from "./contexte-ecran";
import { Declencheur } from "../../utils/jeu/declencheur";
import { ElementsJeuUtils } from "../../utils/commun/elements-jeu-utils";
import { Instructions } from "../../utils/jeu/instructions";
import { Jeu } from "../jeu/jeu";
import { StringUtils } from "../../utils/commun/string.utils";

export class ContextePartie {

  public readonly com: Commandeur;
  public readonly ins: Instructions;
  public readonly eju: ElementsJeuUtils;

  public readonly dec: Declencheur;

  /** les écrans de jeu  */
  public readonly ecran: ContexteEcran;

  private _dossierRessourcesComplet: string;

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
    // fournir le commandeur aux instructions (pour intsruction « exéctuter commande »)
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

    this.initialiserAleatoire();
  }

  /** Initialiser le générateur de nombres aléatoires. */
  private initialiserAleatoire() {
    // graine pas encore définie: on en crée une nouvelle
    if (this.jeu.graine == undefined) {
      this.nouvelleGraineAleatoire();
      // graine déjà définie : on la réutilise
    } else {
      AleatoireUtils.init(this.jeu.graine);
    }
  }

  /** 
   * Changer la graine pour la générateur de nombres aléatoires.
   */
  public nouvelleGraineAleatoire(): void {
    // /!\ ATTENTION: il faut sauvegarder l’ensemble des graines de la partie
    // et le moment où on les à changer afin de pouvoir restaurer une partie sauvegardée !
    this.jeu.graine = Math.random().toString();
    AleatoireUtils.init(this.jeu.graine);
  }

  /** Dossier qui contient les ressources de jeu (images, musiques, …) */
  public get dossierRessourcesComplet(): string {
    return this._dossierRessourcesComplet;
  }



  public unload() {
    // supprimer les musiques en court éventuelles
    this.ins.unload();
  }

}