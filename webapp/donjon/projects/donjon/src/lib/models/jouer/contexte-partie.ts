import { AleatoireUtils } from "../../utils/jeu/aleatoire-utils";
import { Commandeur } from "../../utils/jeu/commandeur";
import { ContexteEcran } from "./contexte-ecran";
import { Declencheur } from "../../utils/jeu/declencheur";
import { ElementsJeuUtils } from "../../utils/commun/elements-jeu-utils";
import { Instructions } from "../../utils/jeu/instructions";
import { Jeu } from "../jeu/jeu";
import { StringUtils } from "../../utils/commun/string.utils";
import { Sauvegarde } from "./sauvegarde";
import { EtapeTest, FichierTest } from "./fichier-test";
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

  /**
   * Sortie textuelle produite par chaque étape (aligné par index sur _etapesPartie).
   * - Pour c/r : la sortie brute de ContexteCommande après exécution.
   * - Pour g/d : null (placeholder pour conserver l'alignement d'index).
   * Utilisé pour générer un FichierTest.
   */
  private _sortiesParEtape: (string | null)[] = [];

  /**
   * Sortie textuelle de l'intro du jeu — accumulée avant la première commande joueur.
   * Inclut les sorties produites par « commencer le jeu », « regarder » initial,
   * et les routines déclenchées au démarrage. Stockée dans FichierTest.sortieIntro.
   */
  private _sortieIntro: string = '';

  /** Indique si une première étape c/r a déjà été enregistrée (= fin de la phase intro). */
  private _phaseIntroTerminee: boolean = false;

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
    this._sortiesParEtape.push(null);
  }

  public ajouterReponseDansSauvegarde(reponseBrute: string) {
    this._etapesPartie.push(ExprReg.caractereReponse + ":" + reponseBrute);
    this._sortiesParEtape.push(null);
  }

  /**
   * Enregistre la sortie textuelle produite par la dernière étape c/r/d exécutée.
   * - Si la dernière étape steppable n'a pas encore de sortie : l'y stocke.
   * - Si elle en a déjà une : **concatène** (cas continuation post-interruption — un `attendre touche`
   *   coupe la sortie d'une commande/routine en plusieurs morceaux, chacun ré-enregistré).
   * Les étapes 'g' (graines) sont ignorées (elles ne portent pas de sortie).
   * Avant la première c/r/d (phase intro), les sorties sont accumulées dans _sortieIntro.
   */
  public enregistrerSortieEtapeCourante(sortie: string) {
    // _derniereSortieEnregistree accumule sur toute la durée d'une étape (depuis la dernière
    // réinitialisation). Indispensable pour que le magnéto récupère la sortie complète d'une
    // commande qui produit plusieurs morceaux séparés par `attendre touche`.
    this._derniereSortieEnregistree = (this._derniereSortieEnregistree === null)
      ? sortie
      : (this._derniereSortieEnregistree + sortie);
    for (let i = this._sortiesParEtape.length - 1; i >= 0; i--) {
      const brut = this._etapesPartie[i];
      if (brut?.startsWith('c:') || brut?.startsWith('r:') || brut?.startsWith('d:')) {
        const existant = this._sortiesParEtape[i];
        this._sortiesParEtape[i] = (existant === null) ? sortie : (existant + sortie);
        this._phaseIntroTerminee = true;
        return;
      }
    }
    // Aucune étape c/r/d encore enregistrée : on est en phase intro. Accumuler.
    if (!this._phaseIntroTerminee) {
      this._sortieIntro += (this._sortieIntro ? '\n' : '') + sortie;
    }
  }

  public get sortieIntro(): string {
    return this._sortieIntro;
  }

  /** Dernière sortie enregistrée via enregistrerSortieEtapeCourante. */
  private _derniereSortieEnregistree: string | null = null;
  public get derniereSortieEnregistree(): string | null {
    return this._derniereSortieEnregistree;
  }
  public reinitialiserDerniereSortieEnregistree() {
    this._derniereSortieEnregistree = null;
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
    this._sortiesParEtape.push(null);
  }

  public ajouterDeclenchementDansSauvegarde(routine: string) {
    this.etapesPartie.push(`${ExprReg.caractereDeclenchement}:${routine}`);
    this._sortiesParEtape.push(null);
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
    this._sortiesParEtape.pop();
  }

  /**
   * Retire les entrées trailing de `_etapesPartie` qui ne sont ni des commandes ('c')
   * ni des réponses ('r'), c'est-à-dire les déclenchements ('d') et graines ('g') accumulés
   * APRÈS la dernière commande joueur.
   *
   * Utilisé par le magnéto avant `annuler` : sans ça, `enleverToursDeJeux` préserve les 'd'
   * (comportement voulu en jeu normal pour éviter de ré-exécuter une routine déjà déclenchée),
   * ce qui les fait re-forcer lors du reload — les sorties de routines réapparaissent à l'écran.
   * Les 'g' trailing (souvent ajoutés par `nouvelleGraineAleatoire()` en fin de replay auto-triche)
   * doivent aussi être traversés sinon ils masquent les 'd' qu'on cherche à retirer.
   */
  public enleverDeclenchementsTrailing(): void {
    while (this._etapesPartie.length > 0) {
      const last = this._etapesPartie[this._etapesPartie.length - 1];
      const estCommandeOuReponse =
        last?.startsWith(ExprReg.caractereCommande + ':') ||
        last?.startsWith(ExprReg.caractereReponse + ':');
      if (estCommandeOuReponse) break;
      this._etapesPartie.pop();
      this._sortiesParEtape.pop();
    }
  }

  /**
   * Crée un FichierTest à partir de l'historique courant et des sorties capturées.
   * À appeler après enleverCommandeGenererSolution si la dernière commande est
   * la commande déclencheuse de la génération (« sauver verification »).
   */
  public creerFichierTest(): FichierTest {
    const fichier = new FichierTest();
    fichier.version = versionNum;
    fichier.declenchementsFuturs = this.jeu.declenchementsFuturs;
    fichier.scenario = undefined;

    const etapes: EtapeTest[] = [];
    let graineInitiale: string | undefined;

    for (let i = 0; i < this._etapesPartie.length; i++) {
      const brut = this._etapesPartie[i];
      const idxSep = brut.indexOf(':');
      const type = brut.substring(0, idxSep) as EtapeTest['type'];
      const valeur = brut.substring(idxSep + 1);
      const etape: EtapeTest = { type, valeur };
      if ((type === 'c' || type === 'r' || type === 'd') && this._sortiesParEtape[i] != null) {
        etape.sortie = this._sortiesParEtape[i]!;
      }
      etapes.push(etape);
      if (type === 'g' && graineInitiale === undefined) {
        graineInitiale = valeur;
      }
    }

    fichier.graine = graineInitiale;
    fichier.etapesTest = etapes;
    fichier.sortieIntro = this._sortieIntro;
    return fichier;
  }

  public unload() {
    // supprimer les musiques en cours éventuelles
    this.ins.unload();
  }

}