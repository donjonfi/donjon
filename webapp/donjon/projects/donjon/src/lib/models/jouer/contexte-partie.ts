import { Commandeur } from "../../utils/jeu/commandeur";
import { Declencheur } from "../../utils/jeu/declencheur";
import { ElementsJeuUtils } from "../../utils/commun/elements-jeu-utils";
import { Instructions } from "../../utils/jeu/instructions";
import { Jeu } from "../jeu/jeu";
import { StringUtils } from "../../utils/commun/string.utils";

export class ContextePartie {

  public com: Commandeur;
  public ins: Instructions;
  public eju: ElementsJeuUtils;
  public dec: Declencheur;

  private _dossierRessourcesComplet: string;

  constructor(
    /** L’état du jeu correspondant à la partie. */
    public jeu: Jeu,
    /** Faut-il afficher un maximum de messages d’erreurs ? */
    public verbeux: boolean = false
  ) {
    this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
    this.ins = new Instructions(this.jeu, this.eju, this.verbeux);
    this.dec = new Declencheur(this.jeu.auditeurs, this.verbeux);
    this.com = new Commandeur(this.jeu, this.ins, this.dec, this.verbeux);
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

  }

  /** Dossier qui contient les ressources de jeu (images, musiques, …) */
  public get dossierRessourcesComplet() {
    return this._dossierRessourcesComplet;
  }

  public unload() {
    // supprimer les musiques en court éventuelles
    this.ins.unload();
  }

}