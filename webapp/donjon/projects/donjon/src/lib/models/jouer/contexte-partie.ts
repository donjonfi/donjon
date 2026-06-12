import { AleatoireUtils } from "../../utils/jeu/aleatoire-utils";
import { Commandeur } from "../../utils/jeu/commandeur";
import { ContexteEcran } from "./contexte-ecran";
import { Declencheur } from "../../utils/jeu/declencheur";
import { ElementsJeuUtils } from "../../utils/commun/elements-jeu-utils";
import { Instructions } from "../../utils/jeu/instructions";
import { Jeu } from "../jeu/jeu";
import { StringUtils } from "../../utils/commun/string.utils";
import { Sauvegarde } from "./sauvegarde";
import { EtapeEnregistrement, FichierEnregistrement } from "./fichier-enregistrement";
import { versionNum } from "../commun/constantes";
import { ExprReg } from "donjon";
import { HorlogeUtils } from "../../utils/jeu/horloge-utils";

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
   * Utilisé pour générer un FichierEnregistrement.
   */
  private _sortiesParEtape: (string | null)[] = [];

  /**
   * Lectures d'horloge (epoch ms) produites par chaque étape, aligné par index sur _etapesPartie
   * (même pattern que _sortiesParEtape). null tant qu'aucune lecture pour l'étape.
   * Utilisé pour rejouer l'heure de façon déterministe (au lieu de l'heure réelle).
   */
  private _horlogesParEtape: (number[] | null)[] = [];

  /** Lectures d'horloge de la phase intro (avant la première étape c/r/d). */
  private _horlogeIntro: number[] = [];

  /**
   * Sortie textuelle de l'intro du jeu — accumulée avant la première commande joueur.
   * Inclut les sorties produites par « commencer le jeu », « regarder » initial,
   * et les routines déclenchées au démarrage. Stockée dans FichierEnregistrement.sortieIntro.
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
    this._horlogesParEtape.push(null);
  }

  public ajouterReponseDansSauvegarde(reponseBrute: string) {
    this._etapesPartie.push(ExprReg.caractereReponse + ":" + reponseBrute);
    this._sortiesParEtape.push(null);
    this._horlogesParEtape.push(null);
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
    // Lectures d'horloge accumulées depuis le dernier prélèvement (= pendant cette étape).
    const lectures = HorlogeUtils.preleverLecturesEtape();
    for (let i = this._sortiesParEtape.length - 1; i >= 0; i--) {
      const brut = this._etapesPartie[i];
      if (brut?.startsWith('c:') || brut?.startsWith('r:') || brut?.startsWith('d:')) {
        const existant = this._sortiesParEtape[i];
        this._sortiesParEtape[i] = (existant === null) ? sortie : (existant + sortie);
        if (lectures.length) {
          if (this._horlogesParEtape[i] == null) this._horlogesParEtape[i] = [];
          this._horlogesParEtape[i]!.push(...lectures);
        }
        this._phaseIntroTerminee = true;
        return;
      }
    }
    // Aucune étape c/r/d encore enregistrée : on est en phase intro. Accumuler.
    if (!this._phaseIntroTerminee) {
      this._sortieIntro += (this._sortieIntro ? '\n' : '') + sortie;
      if (lectures.length) this._horlogeIntro.push(...lectures);
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
    this._horlogesParEtape.push(null);
  }

  /**
   * Enregistre un déclenchement de routine dans la sauvegarde.
   * @param routine nom de la routine déclenchée.
   * @param trailerCanonique arguments résolus sous forme canonique (jointe par « et »),
   *   ou undefined si la routine n’a pas d’arguments. Forme stockée : `d:nom` (sans args,
   *   byte-identique à l’ancien format) ou `d:nom avec <trailerCanonique>`.
   */
  public ajouterDeclenchementDansSauvegarde(routine: string, trailerCanonique?: string) {
    const valeur = (trailerCanonique && trailerCanonique.length)
      ? `${routine} avec ${trailerCanonique}`
      : routine;
    this.etapesPartie.push(`${ExprReg.caractereDeclenchement}:${valeur}`);
    this._sortiesParEtape.push(null);
    this._horlogesParEtape.push(null);
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
    // lectures d'horloge par étape (déterminisme du replay)
    sauvegarde.horlogesSauvegarde = this._horlogesParEtape;
    sauvegarde.horlogeIntro = this._horlogeIntro;
    // scénario (on ne le connait pas ici, il sera ajouté ensuite par Donjon Jouer)
    sauvegarde.scenario = undefined;

    return sauvegarde;
  }

  public enleverCommandeGenererSolution() {
    this._etapesPartie.pop();
    this._sortiesParEtape.pop();
    this._horlogesParEtape.pop();
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
      this._horlogesParEtape.pop();
    }
  }

  /**
   * Crée un FichierEnregistrement à partir de l'historique courant et des sorties capturées.
   * À appeler après enleverCommandeGenererSolution si la dernière commande est
   * la commande déclencheuse de la génération (« générer enregistrement »).
   */
  public creerFichierEnregistrement(): FichierEnregistrement {
    const fichier = new FichierEnregistrement();
    fichier.version = versionNum;
    fichier.declenchementsFuturs = this.jeu.declenchementsFuturs;
    fichier.scenario = undefined;

    const etapes: EtapeEnregistrement[] = [];
    let graineInitiale: string | undefined;

    for (let i = 0; i < this._etapesPartie.length; i++) {
      const brut = this._etapesPartie[i];
      const idxSep = brut.indexOf(':');
      const type = brut.substring(0, idxSep) as EtapeEnregistrement['type'];
      const valeur = brut.substring(idxSep + 1);
      const etape: EtapeEnregistrement = { type, valeur };
      if ((type === 'c' || type === 'r' || type === 'd') && this._sortiesParEtape[i] != null) {
        etape.sortie = this._sortiesParEtape[i]!;
      }
      const lectures = this._horlogesParEtape[i];
      if (lectures && lectures.length) {
        etape.horloge = lectures;
      }
      etapes.push(etape);
      if (type === 'g' && graineInitiale === undefined) {
        graineInitiale = valeur;
      }
    }

    fichier.graine = graineInitiale;
    fichier.etapes = etapes;
    fichier.sortieIntro = this._sortieIntro;
    if (this._horlogeIntro.length) {
      fichier.horlogeIntro = this._horlogeIntro;
    }
    return fichier;
  }

  public unload() {
    // supprimer les musiques en cours éventuelles
    this.ins.unload();
  }

}