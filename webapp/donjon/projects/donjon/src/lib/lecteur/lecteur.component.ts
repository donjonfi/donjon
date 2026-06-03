import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, DOCUMENT } from '@angular/core';
import { Interruption, TypeContexte, TypeInterruption } from '../models/jeu/interruption';

import { Abreviations } from '../utils/jeu/abreviations';
import { BalisesHtml } from '../utils/jeu/balises-html';
import { CommandesUtils } from '../utils/jeu/commandes-utils';
import { ContextePartie } from '../models/jouer/contexte-partie';
import { Jeu } from '../models/jeu/jeu';

import { Choix } from '../models/compilateur/choix';
import { ExprReg, Sauvegarde, StringUtils } from '../../public-api';
import { EtapeEnregistrement, FichierEnregistrement } from '../models/jouer/fichier-enregistrement';
import { TexteUtils } from '../utils/commun/texte-utils';
import { MotUtils } from '../utils/commun/mot-utils';
import { ElementsJeuUtils } from '../utils/commun/elements-jeu-utils';
import { Statisticien } from '../utils/jeu/statisticien';
import { AleatoireInstantane, AleatoireUtils } from '../utils/jeu/aleatoire-utils';
import * as FileSaver from 'file-saver-es';
import { QuestionCommande } from '../models/jouer/questions-commande';
import { InterruptionsUtils } from '../utils/jeu/interruptions-utils';
import { ProgrammationTemps } from '../models/jeu/programmation-temps';
import { RoutineEnAttente } from '../models/jeu/routine-en-attente';
import { RoutineSimple } from '../models/compilateur/routine-simple';
import { HorlogeUtils } from '../utils/jeu/horloge-utils';

/** Segment de texte issu de la comparaison de deux sorties dans le magnéto. */
export interface SegmentDiff {
  texte: string;
  diff: boolean;
}

@Component({
  selector: 'djn-lecteur',
  templateUrl: './lecteur.component.html',
  styleUrls: ['./lecteur.component.scss'],
  standalone: false
})
export class LecteurComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {

  static verbeux = true;

  @Input() jeu: Jeu;
  @Input() verbeux = false;
  /** Le débogueur est il actif ? */
  @Input() debogueur = false;
  /** Si true, le tag {L}NNN{L} est rendu en lien cliquable et le clic émet `referenceLigne`. */
  @Input() supportLiensLignes = false;
  /** Annuler un certain nombre de tours */
  @Output() nouvellePartieOuAnnulerTour = new EventEmitter();
  /** Émet le numéro de ligne lorsqu’un lien `{L}NNN{L}` est cliqué dans la sortie. */
  @Output() referenceLigne = new EventEmitter<number>();

  /** Le contexte de la partie en cours (jeu, commandeur, déclencheur, …) */
  private partie: ContextePartie | undefined;

  readonly TAILLE_DERNIERES_COMMANDES: number = 20;

  /** Commande tapée par le joueur. */
  public commande = "";

  /** Historique des commandes tapées par le joueur. */
  public dernieresCommandesDistinctes: string[] = [];

  /** Curseur dans l’historique des commandes */
  private curseurDernieresCommandes = -1;

  /**
   * Le système de triche automatique est-il en cours d’exécution ?
   */
  private autoTricheActif = false;
  private autoTricheEnAttente = false;

  /**
   * Le système de triche manuel est-il en cours d’exécution ?
   */
  private manuTricheActif = false;
  private manuTricheEnAttente = false;

  /**
   * Une sauvegarde est-elle en attente de restauration ?
   */
  private restaurationSauvegardeEnAttente = false;

  // -- Mode enregistrement (.rec) — magnétoscope ----------------------------

  /** Le mode enregistrement (replay d'un .rec avec comparaison de sortie) est-il actif ? */
  public enregistrementActif = false;

  /** Un enregistrement .rec est en attente de lancement (après chargement). */
  private enregistrementEnAttente = false;

  /** L'enregistrement .rec en cours. Ses étapes sont mutées en place. */
  public enregistrementEnCours: FichierEnregistrement | null = null;

  /** Index courant dans etapes. Pointe sur l'étape à exécuter au prochain « Pas suivant ». */
  public magnetoIdx = 0;

  /** Données de la divergence en cours d'examen, ou null si aucune divergence. */
  public magnetoDivergence: { etape: EtapeEnregistrement, idx: number, sortieObtenue: string, diffAttendu: SegmentDiff[], diffObtenue: SegmentDiff[], routineIntrouvable?: boolean } | null = null;

  /** Divergence sur l'intro du jeu (avant la première étape c/r), ou null. */
  public magnetoDivergenceIntro: { sortie: string, sortieObtenue: string, diffAttendu: SegmentDiff[], diffObtenue: SegmentDiff[] } | null = null;

  /**
   * Saisie d'heure : l'étape courante a lu l'horloge sans valeur enregistrée (instruction
   * insérée/modifiée). Le magnéto se met en pause et demande à l'auteur la/les date(s)-heure(s)
   * à rejouer (champs datetime-local éditables). `idx` = étape concernée ; `inputs` = valeurs
   * éditables au format datetime-local (converties depuis les lectures réelles capturées).
   */
  public magnetoSaisieHorloge: { idx: number, inputs: string[] } | null = null;

  /**
   * Index d'étapes dont la sortie attendue doit être **recalculée** au prochain rejeu (après que
   * l'auteur a fourni/modifié l'heure via la saisie) : au lieu de comparer, le rejeu accepte la
   * sortie obtenue (recalculée avec l'heure fournie). Survit au reload de `magnetoRecommencer`.
   */
  public magnetoIdxSortieARecalculer = new Set<number>();

  /**
   * Après une saisie d'heure : position (idx) à laquelle ré-avancer automatiquement le replay
   * une fois le rejeu déterministe relancé, afin que l'auteur retrouve l'endroit où il était
   * (au lieu de rester sur l'intro). null si pas de ré-avance en attente. Survit au reload.
   */
  public magnetoIdxRejeuCible: number | null = null;

  /** Lecture auto en cours (boucle temporisée) ? */
  public magnetoLectureAutoEnCours = false;

  /** Sous-état d'édition (sous-panneau saisie). `inserer-reponse` est une 2e passe
   *  automatique après l'insertion d'un c: qui a déclenché un choisir/question — l'UI
   *  garde le panneau ouvert pour que l'utilisateur saisisse la réponse à enregistrer
   *  comme r: juste après le c:. */
  public magnetoEdition: 'aucun' | 'modifier' | 'inserer' | 'inserer-reponse' = 'aucun';

  /** En mode 'inserer-reponse' : index dans `enregistrementEnCours.etapes` du c: qui
   *  vient d'être inséré et a laissé une interruption de choix pendante. Le r: sera
   *  splicé à `idx + 1`. null hors de ce sous-mode. */
  private magnetoIdxInsertionAvecChoix: number | null = null;

  /** Saisie utilisateur en mode modifier/inserer. */
  public magnetoSaisieCommande = '';

  /** Mémorise la dernière commande testée (avec sortie + lectures d'horloge capturées) pour la séquence Tester → Valider. */
  public magnetoDernierTest: { commande: string, sortie: string, horloge: number[] } | null = null;

  /** Affiche le dialogue « RAZ avant de lancer le magnéto ? » au chargement d'un .rec. */
  public magnetoDemanderRaz = false;

  /** Menu déroulant « Insérer » (Avant / Après) ouvert ? */
  public magnetoInsererMenuOuvert = false;

  /** Idx (dans etapes) de l'étape en cours d'édition (modifier ou inserer). null hors édition. */
  public magnetoIdxEnEdition: number | null = null;

  /** Type de l'étape en cours d'édition ('c' commande / 'r' réponse à un choisir). Pilote
   *  le routage de la nouvelle valeur (envoyerCommande vs handler de choix) et le libellé UI. */
  public magnetoEditionTypeOriginal: 'c' | 'r' | null = null;

  /**
   * Snapshot du PRNG capturé juste AVANT chaque c/r joué (clé = idx dans etapes).
   * Permet à `Précédent` de restaurer l'état exact du PRNG, contournant le re-seed
   * volontaire d'`annuler` (anti-save-scumming en mode jeu normal, indésirable en magnéto).
   */
  private magnetoSnapshotsRng: Map<number, AleatoireInstantane> = new Map();

  /**
   * Indices des étapes 'r' exécutées comme réponse à un `choisir` (attendreChoix /
   * attendreChoixLibre). Mémorisé au moment de l'exécution car `interruptionEnCours`
   * est mis à `undefined` par `terminerInterruption` dès la résolution → on ne peut
   * plus l'interroger une fois l'étape consommée. Sert à griser le bouton Modifier
   * tant que l'édition d'une réponse de choix n'est pas correctement gérée. Vidé à
   * la sortie du magnéto (initialiserMagneto / magnetoQuitter).
   */
  private magnetoIdxReponsesChoix: Set<number> = new Set();

  /** Le panneau de récapitulatif de fin de session est-il affiché ? */
  public recapAffiche = false;

  /** Historique des actions effectuées pendant la session. */
  public enregistrementActions: { idx: number, action: string, detail: string }[] = [];

  /** Compteurs agrégés pour le récap. */
  public enregistrementCompteurs = { acceptations: 0, retraits: 0, modifications: 0, ajouts: 0 };

  /** Index de la dernière commande exécutée avec le système « triche/chargement partie » */
  private indexDerniereCommandeRestauration: number = -1;


  /** Afficher la case à cocher pour activer/désactiver l’audio */
  private activerParametreAudio: boolean = false;

  /** Marge de l’interface en pixels (paliers : 0, 5, 10, 20) */
  margeInterface: number = 10;

  augmenterMarge(): void {
    const paliers = [0, 5, 10, 20];
    const idx = paliers.indexOf(this.margeInterface);
    if (idx < paliers.length - 1) this.margeInterface = paliers[idx + 1];
  }

  diminuerMarge(): void {
    const paliers = [0, 5, 10, 20];
    const idx = paliers.indexOf(this.margeInterface);
    if (idx > 0) this.margeInterface = paliers[idx - 1];
  }

  @ViewChild('txCommande') commandeInputRef: ElementRef;
  @ViewChild('taResultat') resultatInputRef: ElementRef;

  /** le texte restant à afficher dans la sortie (après appuyer sur une touche) */
  resteDeLaSortie: string[] = [];
  /** une commande est en cours */
  commandeEnCours: boolean = false;

  sansDefilement: boolean = false;

  /** Interruption qui est en cours */
  interruptionEnCours: Interruption | undefined;
  /** Les choix possibles pour l’utilisateur */
  choixPossibles: string[] = [];
  /** Index du choix actuellement sélectionné */
  indexChoixPropose: number = undefined;

  /** L'interruption qui a provoqué l'annulation d'un tour de jeu */
  private interruptionEnCoursAvantAnnulation: Interruption | undefined;
  /** Graine pour le générateur aléatoire avant l'annulation d'un tour de jeu */
  private graineAvantAnnulation: string;

  constructor(
    @Inject(DOCUMENT) private htmlDocument: Document,
    private elementRef: ElementRef<HTMLElement>
  ) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    // Délégation d’événement : un seul listener pour tous les liens {L}NNN{L} rendus dans la sortie.
    // La ligne est encodée dans le href (`#LNNN`) car le sanitizer Angular retire les data-attributes.
    this.resultatInputRef.nativeElement.addEventListener('click', (event: Event) => {
      const lien = (event.target as HTMLElement).closest('.t-lien-ligne') as HTMLAnchorElement | null;
      if (!lien) return;
      event.preventDefault();
      const match = (lien.getAttribute('href') ?? '').match(/^#L(\d+)$/);
      if (match) {
        const ligne = parseInt(match[1], 10);
        if (!isNaN(ligne)) this.referenceLigne.emit(ligne);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    /** S'assurer de décharger la partie en cours (arrêter musiques par exemple) */
    if (this.partie) {
      this.partie.unload();
    }

    /** Initialiser une nouvelle partie si un jeu est fourni. */
    if (this.jeu) {
      console.warn("jeu: ", this.jeu);
      this.initialiserJeu();
    } else {
      console.log("Lecteur: Pas de jeu chargé.");
    }
  }

  public get ecran(): string {
    return this.partie?.ecran.ecran ?? "";
  }

  /** Initialiser une nouvelle partie (ou reprendre une partie) */
  private initialiserJeu() {
    this.resteDeLaSortie = [];
    this.commandeEnCours = false;
    this.interruptionEnCours = undefined;
    this.manuTricheActif = false;
    this.autoTricheActif = false;

    if (this.autoTricheEnAttente && !this.jeu.sauvegarde) {
      this.autoTricheEnAttente = false;
      this.ajouteErreur("Mode triche auto: aucun fichier solution chargé.");
    }

    // initialiser le contexte de la partie
    this.partie = new ContextePartie(this.jeu, this.htmlDocument, this.verbeux, this.debogueur);
    this.partie.ecran.supportLiensLignes = this.supportLiensLignes;

    // Si le magnéto est actif (cas typique : reload après annuler), restaurer le flag
    // qui supprime les programmations de routines. Sinon, le replay auto-triche
    // réinjecte des ProgrammationTemps que verifierChrono finit par déclencher,
    // produisant des sorties de routine fantômes à la fin de la partie.
    if (this.enregistrementActif) {
      this.partie.ins.restaurationPartieEnCours = true;
    }

    this.verifierTamponErreurs();

    // ajouter le IFID à la page web
    this.definirIFID();

    this.partie.ecran.ajouterContenuHtml("<center>")

    // afficher le titre et la version du jeu
    let texteTitreVersion = ("<h1>" + (this.partie.jeu.titre ? BalisesHtml.retirerBalisesHtml(this.partie.jeu.titre) : "(jeu sans titre)"));
    // afficher la version du jeu
    if (this.partie.jeu.version) {
      texteTitreVersion += ('<small> ' + BalisesHtml.retirerBalisesHtml(this.partie.jeu.version) + '</small>');
    }
    texteTitreVersion += '</h1>';
    this.partie.ecran.ajouterContenuHtml(texteTitreVersion);

    // afficher l’auteur du jeu
    let texteAuteur = '<h2>';
    if (this.partie.jeu.auteur) {
      texteAuteur += (BalisesHtml.retirerBalisesHtml(this.partie.jeu.auteur));
    } else if (this.partie.jeu.auteurs) {
      texteAuteur += (BalisesHtml.retirerBalisesHtml(this.partie.jeu.auteurs));
    } else {
      texteAuteur += ("(anonyme)");
    }
    texteAuteur += '</h2>';
    this.partie.ecran.ajouterContenuHtml(texteAuteur);

    if (this.partie.jeu.participants) {
      let texteParticipants = '<h3>Avec la participation de ';
      texteParticipants += (BalisesHtml.retirerBalisesHtml(this.partie.jeu.participants));
      texteParticipants += '</h3>';
      this.partie.ecran.ajouterContenuHtml(texteParticipants);
    }

    if (this.partie.jeu.remerciements) {
      let texteRemerciements = '<h3>Remerciements : ';
      texteRemerciements += (BalisesHtml.retirerBalisesHtml(this.partie.jeu.remerciements));
      texteRemerciements += '</h3>';
      this.partie.ecran.ajouterContenuHtml(texteRemerciements);
    }

    // afficher site web et/ou licence
    if (this.partie.jeu.siteWebLien || this.partie.jeu.licenceTitre) {
      let texteSiteWebLicence = '<p>';

      // site web du jeu
      if (this.partie.jeu.siteWebLien) {
        if (this.partie.jeu.siteWebTitre) {
          texteSiteWebLicence += ('Site web : <a href="' + BalisesHtml.retirerBalisesHtml(this.partie.jeu.siteWebLien) + '" target="_blank">' + BalisesHtml.retirerBalisesHtml(this.partie.jeu.siteWebTitre) + "</a>");
        } else {
          texteSiteWebLicence += ('Site web : <a href="' + BalisesHtml.retirerBalisesHtml(this.partie.jeu.siteWebLien) + '" target="_blank">' + BalisesHtml.retirerBalisesHtml(this.partie.jeu.siteWebLien) + "</a>");
        }
      }
      // licence du jeu
      if (this.partie.jeu.licenceTitre) {
        if (this.partie.jeu.siteWebLien) {
          texteSiteWebLicence += '<br>';
        }
        if (this.partie.jeu.licenceLien) {
          texteSiteWebLicence += ('Licence : <a href="' + BalisesHtml.retirerBalisesHtml(this.partie.jeu.licenceLien) + '" target="_blank">' + BalisesHtml.retirerBalisesHtml(this.partie.jeu.licenceTitre) + "</a>");
        } else {
          texteSiteWebLicence += ('Licence : ' + BalisesHtml.retirerBalisesHtml(this.partie.jeu.licenceTitre));
        }
      }

      texteSiteWebLicence += '</p>';
      this.partie.ecran.ajouterContenuHtml(texteSiteWebLicence);
    }

    this.partie.ecran.ajouterContenuHtml("</center>")

    if (this.partie.jeu.parametres.activerAudio) {
      this.activerParametreAudio = true;
      this.partie.ecran.ajouterParagrapheDonjon('{/Ce jeu utilise des effets sonores, vous pouvez les désactiver en bas de la page.{n}@@tester audio@@./}');
    } else {
      this.activerParametreAudio = false;
    }

    // // =========================
    // // GÉNÉRATEUR DE HASARD
    // // =========================

    let graineDeDepart: string | undefined;

    this.indexDerniereCommandeRestauration = -1;

    // utilisation d’une sauvegarde: on initialise graine du générateur de hasard avec valeur présente dans la sauvegarde
    if (this.restaurationSauvegardeEnAttente || this.autoTricheEnAttente || this.manuTricheEnAttente || this.interruptionEnCoursAvantAnnulation) {
      if (this.jeu.sauvegarde?.etapesSauvegarde?.length) {
        const prochaineEtape = this.jeu.sauvegarde.etapesSauvegarde[++this.indexDerniereCommandeRestauration];
        let [type, graineRestauree] = prochaineEtape.split(":");
        if (type == ExprReg.caractereGraine) {
          //this.ajouteConseils("Graine du générateur de hasard restaurée.")
          graineDeDepart = graineRestauree;
        } else {
          this.ajouteErreur("Restauration de partie : la première étape n’est pas la graine du générateur de hasard.");
        }
      } else {
        if (!this.enregistrementActif) this.ajouterConseil("Restauration de partie : sauvegarde vide.")
      }
    }

    // nouvelle graine
    if (graineDeDepart == undefined) {
      this.partie.nouvelleGraineAleatoire();
      // restauration graine
    } else {
      // initialiser le générateur de hasard avec la graine choisie
      this.partie.nouvelleGraineAleatoire(graineDeDepart);
    }

    // ============================================
    //  HORLOGE DÉTERMINISTE (même principe que la graine)
    // ============================================
    // On repart à zéro, puis — si on (re)démarre une partie à rejouer — on charge les lectures
    // d'horloge de la phase intro pour les rejouer (au lieu de l'heure réelle). L'intro est
    // jouée juste après (« commencer le jeu » / « regarder »), donc on charge avant.
    HorlogeUtils.reinitialiser();
    if (this.enregistrementEnAttente && this.enregistrementEnCours) {
      HorlogeUtils.chargerRejeuEtape(this.enregistrementEnCours.horlogeIntro ?? null);
    } else if ((this.restaurationSauvegardeEnAttente || this.autoTricheEnAttente || this.manuTricheEnAttente || this.interruptionEnCoursAvantAnnulation) && this.jeu.sauvegarde) {
      HorlogeUtils.chargerRejeuEtape(this.jeu.sauvegarde.horlogeIntro ?? null);
    }

    // =====================
    //  COMMENCER LA PARTIE
    // =====================

    // restauration auto d’une partie : éviter le déclenchement des routines programmées
    if (this.restaurationSauvegardeEnAttente || this.autoTricheEnAttente || this.interruptionEnCoursAvantAnnulation) {
      // éviter de programmer les déclenchements de routines
      this.partie.ins.restaurationPartieEnCours = true;
    }

    // si la commande commencer le jeu existe, commencer le jeu
    if (this.partie.jeu.actions.some(x => x.infinitif == 'commencer' && x.ceci && !x.cela)) {
      // exécuter la commande « commencer le jeu »
      this.envoyerCommande("commencer le jeu", "commencer le jeu", false, true, false, true);
      // sinon initialiser les éléments du jeu en fonction de la position du joueur
    } else {
      // définir visibilité des objets initiale
      this.partie.eju.majPresenceDesObjets();
      // définir adjacence des lieux initiale
      this.partie.eju.majAdjacenceLieux();

      // si la commande regarder existe et s’il y a au moins 1 lieu, l’exécuter
      if (this.partie.jeu.actions.some(x => x.infinitif == 'regarder' && !x.ceci && !x.cela) && this.partie.jeu.lieux.length > 0) {
        // exécuter la commande « regarder »
        this.envoyerCommande("regarder", "regarder", false, true, false, true);
      } else {
        // this.sortieJoueur = "";
      }
    }

    // le magnéto se lance même si l’intro a été interrompue (attendre touche / choisir en
    // intro) : sinon l’utilisateur charge un .rec et rien ne démarre. initialiserMagneto
    // s’occupe d’auto-résoudre les attentes de touche pendantes pour finaliser sortieIntro
    // avant la comparaison ; un choisir pendant intro reste actif et sera résolu par la
    // 1re étape r du .rec via Pas suivant.
    if (this.enregistrementEnAttente) {
      if (!this.interruptionEnCours) this.partie.jeu.commence = true;
      this.initialiserMagneto();
    } else if (!this.interruptionEnCours) {
      this.partie.jeu.commence = true;
      // restauration d’un jeu précédent en mode manuel
      if (this.manuTricheEnAttente) {
        this.manuTricheEnAttente = false;
        this.lancerManuTriche();
        // restauration d’un jeu précédent en mode automatique
      } else if (this.restaurationSauvegardeEnAttente || this.autoTricheEnAttente || this.interruptionEnCoursAvantAnnulation) {
        this.lancerAutoTriche();
        // partie normale
      } else {
        this.lancerRoutinesProgrammees();
      }
    }

    // donner le focus sur « entrez une commande » 
    this.focusCommande();
  }

  private lancerRoutinesProgrammees() {
    setTimeout(() => {
      this.verifierChrono();
    }, 1000);
  }

  private comptabiliserDerniereInterruptionDeLaPartie(): void {
    // calculer le temps de l’interruption de la partie
    const deltaMs = (this.jeu.finInterruption - this.jeu.debutInterruption);
    this.jeu.debutInterruption = undefined;
    this.jeu.finInterruption = undefined;
    // ajouter ce temps aux programmations de routines en cours
    this.jeu.programmationsTemps.forEach(prog => {
      prog.duree += deltaMs;
    });
  }

  private verifierChrono() {
    if (!this.jeu.termine) {
      // si partie interrompue, vérifier s’il faut continue la partie
      if (this.jeu.interrompu && this.jeu.finInterruption !== undefined) {
        this.comptabiliserDerniereInterruptionDeLaPartie();
        // restaurer la partie
        this.jeu.interrompu = false;
      }
      // si la partie n’est pas en pause, vérifier les chronos.
      // Pendant un replay (restauration .sol, triche, magnétoscope), on NE déclenche PAS les
      // routines via le chrono temps réel : les étapes 'd' enregistrées les forcent au bon moment.
      // Sans ce garde-fou, une routine programmée pendante serait jouée 2× (1× forcée + 1× chrono).
      // (Les routines encore en attente en fin d'enregistrement relèvent de declenchementsFuturs.)
      if (!this.jeu.interrompu && !this.partie.ins.restaurationPartieEnCours) {
        if (this.jeu.programmationsTemps.length) {
          // vérifier les programmations qui sont terminées (temps écoulé)
          const tempsActuel = Date.now();
          let programmationTerminee: number[] = [];
          for (let indexProgrammation = 0; indexProgrammation < this.jeu.programmationsTemps.length; indexProgrammation++) {
            const programmation = this.jeu.programmationsTemps[indexProgrammation];
            if (programmation == undefined) {
              throw new Error("Programmation pas retrouvée !");
            }
            // vérifier si le chrono est arrivé à terme
            if (tempsActuel - programmation.debutTemps > programmation.duree) {
              programmationTerminee.push(indexProgrammation);
            }
          }

          // récupérer les programmations terminées et exécuter la routine
          programmationTerminee.forEach(programmationIndex => {
            // retirer la programmation terminée
            const programmation = this.jeu.programmationsTemps.splice(programmationIndex, 1)[0];
            if (this.partie.verbeux) {
              console.log("Chrono écoulé");
            }
            // résoudre la routine + ses arguments (résolus au déclenchement = fire-time).
            // Le trailer brut a été mémorisé à la programmation ; on le découpe puis on lie.
            const valeurDeclenchement = programmation.argsTrailer
              ? `${programmation.routine} avec ${programmation.argsTrailer}`
              : programmation.routine;
            const { nom, argsCanoniques } = this.partie.ins.parseDeclenchement(valeurDeclenchement);
            const resLiaison = this.lierEtEnfilerRoutine(nom, argsCanoniques);
            if (resLiaison.routine) {
              if (this.partie.verbeux) {
                console.log("routine trouvée");
              }
              // a) commande/interruption déjà en cours => garder pour plus tard.
              if (this.commandeEnCours || this.interruptionEnCours) {
                if (this.verbeux) {
                  console.log("routine pour le futur");
                }
                // b) rien en cours => exécuter la routine
              } else {
                this.traiterProchaineRoutine();
              }
            } else {
              this.partie.eju.ajouterErreur(`Programmation routine: ${resLiaison.erreur}`);
            }
          });

        }
      }
      // prochaine vérification des chronos
      if (!this.jeu.termine) {
        setTimeout(() => {
          this.verifierChrono();
        }, 1000);
      }
    }
  }

  /**
   * Ajouter du contenu à la sortie pour le joueur.
   * Cette méthode tient compte des pauses (attendre touche) et effacements (effacer écran).
   */
  private ajouterContenuHtmlAvecTagsDonjon(contenu: string) {

    if (contenu) {
      // en mode auto-triche, restauration partie ou MAGNÉTO (replay d'un .rec), on n’attend
      // pas la touche : le marker `@@attendre touche@@` inline dans un `dire` est remplacé
      // par un placeholder visuel et la chute est affichée immédiatement après. Sans ça, le
      // magnéto se retrouvait avec resteDeLaSortie pendante en fin de Pas suivant —
      // l'utilisateur voyait le prompt « Appuyez sur une touche… » mais la chute ne sortait
      // jamais (puisque magnetoPasSuivant ne déclenche pas onKeyDown/afficherSuiteSortie).
      if (this.autoTricheActif || this.autoTricheEnAttente || this.restaurationSauvegardeEnAttente || this.enregistrementActif) {
        contenu = contenu.replace(/@@attendre touche@@/g, '<br><span class="t-commande font-italic">Appuyez sur une touche…</span><br>')
      }

      // découper en fonction des pauses
      const sectionsContenu = contenu.split("@@attendre touche@@");
      // s'il y a du texte en attente, ajouter au texte en attente
      if (this.resteDeLaSortie?.length) {
        this.resteDeLaSortie[this.resteDeLaSortie.length - 1] += ("</p><p>" + sectionsContenu[0]);
        this.resteDeLaSortie = this.resteDeLaSortie.concat(sectionsContenu.slice(1));
        // s'il n'y a pas de texte en attente, afficher la première partie
      } else {
        // retrouver le dernier effacement d’écran éventuel
        let texteSection = sectionsContenu[0];
        const indexDernierEffacement = texteSection.lastIndexOf("@@effacer écran@@");

        if (texteSection.includes("@@sans défilement@@")) {
          this.sansDefilement = true;
          texteSection = texteSection.replace(/@@sans défilement@@/g, "");
        }

        // s’il ne faut pas effacer l’écran
        if (indexDernierEffacement == -1) {
          // ajouter à la suite
          this.partie.ecran.ajouterContenuHtml(texteSection);
          // sinon
        } else {
          // remplacer la sortie du joueur
          this.partie.ecran.remplacerContenuHtml(texteSection.slice(indexDernierEffacement + "@@effacer écran@@".length));
        }
        // attendre pour afficher la suite éventuelle
        if (sectionsContenu.length > 1) {
          this.partie.ecran.ajouterContenuHtml('<p class="t-commande font-italic">Appuyez sur une touche…');
          this.resteDeLaSortie = this.resteDeLaSortie.concat(sectionsContenu.slice(1));
        }
      }
    }
  }

  private verifierTamponErreurs() {
    // vérifier s’il reste des erreurs à afficher
    if (this.partie.jeu?.tamponErreurs.length) {
      let texteErreurs = "";
      while (this.partie.jeu.tamponErreurs.length) {
        const erreur = this.partie.jeu.tamponErreurs.shift();
        texteErreurs += '{N}■ ' + erreur + '';
      }
      this.ajouterErreurs(texteErreurs);
    }

    // vérifier s’il reste des conseils à afficher
    if (this.debogueur && this.partie.jeu?.tamponConseils.length) {
      let texteConseils = "";
      while (this.partie.jeu.tamponConseils.length) {
        const conseil = this.partie.jeu.tamponConseils.shift();
        texteConseils += '{N}💡' + conseil + '';
      }
      this.ajouteConseils(texteConseils);
    }

    // vérifier à nouveau dans quelques temps
    setTimeout(() => {
      this.verifierTamponErreurs();
    }, 1000);
  }

  private ajouteConseils(texteConseils: string) {
    const texteIgnore = this.partie.ecran.ajouterContenuDonjon('{-{/' + texteConseils + '/}-}');
    this.partie.ecran.sautParagraphe();
    this.ajouterTexteAIgnorerAuxStatistiques(texteIgnore);
    this.scrollSortie();
  }

  private ajouterErreurs(texteErreurs: string) {
    const texteIgnore = this.partie.ecran.ajouterContenuDonjon('{+{/' + texteErreurs + '/}+}');
    this.ajouterTexteAIgnorerAuxStatistiques(texteIgnore);
    this.partie.ecran.sautParagraphe();
    this.scrollSortie();
  }

  /**
   * Lie un appel de routine déclenchée (nom + arguments, bruts ou canoniques) à une routine
   * concrète via la résolution de surcharge, puis — en cas de succès — met la routine en file
   * (`tamponRoutinesEnAttente`) avec ses arguments liés et enregistre l'étape 'd' dans la
   * sauvegarde avec les arguments **canoniques** (rejouables à l'identique).
   *
   * Utilisé par les 4 sites de déclenchement (chrono, restauration .sol, intro magnéto,
   * pas-à-pas magnéto) pour éviter toute divergence de résolution entre eux.
   */
  private lierEtEnfilerRoutine(nom: string, args: string[]): { routine?: RoutineSimple, valeurCanonique?: string, erreur?: string } {
    const liaison = this.partie.ins.lierAppelRoutine(nom, args);
    if (liaison.erreur || !liaison.routine) {
      return { erreur: liaison.erreur ?? `La routine n’a pas pu être liée : ${nom}` };
    }
    const routine = liaison.routine;
    // Recomposer le trailer canonique à partir des valeurs liées (pour la sauvegarde) — idempotent
    // si les args étaient déjà canoniques (cas replay).
    const parts: string[] = [];
    if (routine.ceci && liaison.ceciVal) parts.push(this.partie.ins.canoniserArg(liaison.ceciVal, routine.paramCeci!));
    if (routine.cela && liaison.celaVal) parts.push(this.partie.ins.canoniserArg(liaison.celaVal, routine.paramCela!));
    const trailer = parts.join(' et ');
    this.jeu.tamponRoutinesEnAttente.push(new RoutineEnAttente(routine, liaison.ceciVal, liaison.celaVal));
    this.partie.ajouterDeclenchementDansSauvegarde(routine.nom, trailer);
    // Valeur 'd' canonique (même format que l'entrée de sauvegarde) pour reconstruire une étape.
    const valeurCanonique = trailer.length ? `${routine.nom} avec ${trailer}` : routine.nom;
    return { routine, valeurCanonique };
  }

  /**
   * Force immédiatement les routines programmées par une commande insérée au magnéto (qui n'a pas
   * de temps réel) : chaque programmation en attente est exécutée tout de suite et ajoutée comme
   * étape 'd' juste après `posApres` (avec sa sortie et ses lectures d'horloge). Le délai est ignoré.
   * À appeler en mode replay (flag `restaurationPartieEnCours` à true) pour qu'une routine récurrente
   * ne se re-programme pas pendant le forçage. Retourne le nombre d'étapes 'd' insérées.
   * Limite connue : une routine programmée *par une routine forcée* n'est pas re-forcée (chaînage).
   */
  private magnetoForcerRoutinesProgrammees(posApres: number): number {
    if (!this.enregistrementEnCours) return 0;
    let nbInserees = 0;
    while (this.jeu.programmationsTemps.length) {
      const prog = this.jeu.programmationsTemps.shift()!;
      const valeurBrute = prog.argsTrailer ? `${prog.routine} avec ${prog.argsTrailer}` : prog.routine;
      const { nom, argsCanoniques } = this.partie.ins.parseDeclenchement(valeurBrute);
      this.partie.reinitialiserDerniereSortieEnregistree();
      HorlogeUtils.chargerRejeuEtape(null); // lectures live, capturées pour rejeu déterministe
      const res = this.lierEtEnfilerRoutine(nom, argsCanoniques);
      if (!res.routine || res.valeurCanonique === undefined) {
        this.ajouteErreur(`Magnéto: routine programmée introuvable: ${res.erreur ?? nom}`);
        continue;
      }
      this.traiterProchaineRoutine();
      this.terminerInterruptionsBloquantesPourMagneto();
      const etape: EtapeEnregistrement = { type: 'd', valeur: res.valeurCanonique, sortie: this.partie.derniereSortieEnregistree ?? '' };
      const horloge = HorlogeUtils.lecturesUtiliseesEtape();
      if (horloge.length) etape.horloge = horloge;
      this.enregistrementEnCours.etapes.splice(posApres + nbInserees, 0, etape);
      this.enregistrementCompteurs.ajouts++;
      this.enregistrementActions.push({ idx: posApres + nbInserees, action: 'routine forcée', detail: `« ${res.valeurCanonique} »` });
      nbInserees++;
    }
    return nbInserees;
  }

  private traiterProchaineRoutine() {
    const enAttente = this.jeu.tamponRoutinesEnAttente.shift();
    const routine = enAttente.routine;

    if (this.verbeux) {
      console.warn("routine exécutée: ", routine.nom);
    }

    const sortieRoutine = this.partie.com.executerRoutine(routine, enAttente.ceciVal, enAttente.celaVal);
    this.partie.ecran.ajouterParagrapheDonjon(sortieRoutine);
    this.scrollSortie();

    // Capturer la sortie de la routine pour génération de FichierEnregistrement.
    // En phase intro, elle s'accumule dans _sortieIntro. Plus tard, elle pourrait être
    // attachée à un slot 'd:' si la sémantique évolue.
    this.partie.enregistrerSortieEtapeCourante(sortieRoutine ?? '');

    // s’il y a des interruptions à gérer, il faut les gérer
    if (this.jeu.tamponInterruptions.length) {
      this.traiterProchaineInterruption();
      // s’il reste des routines à exécuter, il faut les exécuter
    } else if (this.jeu.tamponRoutinesEnAttente.length) {
      this.traiterProchaineRoutine();
    }
  }

  private traiterProchaineInterruption() {

    // traiter la prochaine interruption
    this.interruptionEnCours = this.jeu.tamponInterruptions.shift();

    if (this.interruptionEnCours) {
      switch (this.interruptionEnCours.typeInterruption) {
        case TypeInterruption.attendreChoixLibre:
          this.commande = "";
          // si mode triche, proposer le choix de la solution (commande suivante)
          this.executerProchaineEtapeManuTriche();
          // focus sur l'entrée de commande
          this.focusCommande();
          // si restauration automatique doit être démarrée
          if (this.restaurationSauvegardeEnAttente || this.autoTricheEnAttente || (this.interruptionEnCoursAvantAnnulation && !this.autoTricheActif)) {
            this.lancerAutoTriche();
          }
          break;
        case TypeInterruption.attendreChoix:
          if (this.interruptionEnCours.choix?.length) {
            const nbChoix = this.interruptionEnCours.choix.length;
            const identifiantsChoix = this.partie.jeu.parametres.activerChoixNumeriques
              ? Array.from({ length: nbChoix }, (_, i) => String(i + 1))
              : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            this.choixPossibles = identifiantsChoix.slice(0, nbChoix);

            let texteChoix = '<ul class="no-bullet">';
            for (let indexChoix = 0; indexChoix < this.interruptionEnCours.choix.length; indexChoix++) {
              const curChoix = this.interruptionEnCours.choix[indexChoix];
              // pour les QCM: toujours 1 seule valeur par choix !
              // sinon on s'en sort pas avec les lettres et la gestion des index...
              texteChoix += '<li>' + identifiantsChoix[indexChoix] + ' − ' + BalisesHtml.convertirEnHtml(curChoix.valeurs[0].toString(), this.partie.dossierRessourcesComplet) + '</li>';
            }
            texteChoix += '</ul>'
            this.partie.ecran.ajouterContenuHtml(texteChoix);
            // Capture aussi la liste des propositions dans le pipeline d'enregistrement :
            // sans cela, ajouterContenuHtml écrit à l'écran uniquement et le magnéto ne
            // peut pas détecter qu'un libellé de choix a été modifié dans le scénario.
            this.partie.enregistrerSortieEtapeCourante(texteChoix);
            if (this.choixPossibles.length > 0) {
              this.indexChoixPropose = 0;
              this.commande = this.choixPossibles[this.indexChoixPropose];

              // si mode triche manuel, proposer le choix de la solution (commande suivante)
              this.executerProchaineEtapeManuTriche();

              // focus sur l'entrée de commande
              this.focusCommande();
              // si restauration automatique doit être démarrée
              if (this.restaurationSauvegardeEnAttente || this.autoTricheEnAttente || (this.interruptionEnCoursAvantAnnulation && !this.autoTricheActif)) {
                this.lancerAutoTriche();
              }
            }
          } else {
            this.ajouteErreur("interruptions: le joueur doit faire un choix mais il n’y a aucun choix dans la liste");
          }
          break;

        case TypeInterruption.attendreTouche:

          if (this.interruptionEnCours.messageAttendre) {
            this.partie.ecran.ajouterContenuDonjon(this.interruptionEnCours.messageAttendre);
          } else {
            this.partie.ecran.ajouterContenuDonjon('{p}{-{/Veuillez appuyer sur une touche…/}-}{p}');
          }
          this.commande = "";
          this.focusCommande();

          // si (on est en auto-triche)
          // ou bien si (une sauvegarde est en cours de restauration ou un tour doit être annulé)
          // ou bien si l'attente est désactivée
          // alors on n'attend pas !
          if (this.autoTricheActif || this.restaurationSauvegardeEnAttente || this.autoTricheEnAttente || this.interruptionEnCoursAvantAnnulation || !this.partie.jeu.parametres.activerAttendre) {
            this.terminerInterruption(undefined);
          }
          break;

        case TypeInterruption.attendreSecondes:
          let nbMillisecondes = Math.floor(this.interruptionEnCours.nbSecondesAttendre * 1000);
          this.commande = "";
          this.focusCommande();
          // si on est en auto-triche où qu'une sauvegarde doit
          // être restaurée, ou qu'un tour doit être annulé, ou que l'attente est désactivée, on n'attend pas !
          if (this.autoTricheActif || this.restaurationSauvegardeEnAttente || this.autoTricheEnAttente || this.interruptionEnCoursAvantAnnulation || !this.partie.jeu.parametres.activerAttendre) {
            this.terminerInterruption(undefined);
            // sinon attendre avant de terminer l’interruption
          } else {
            setTimeout(() => {
              this.terminerInterruption(undefined);
            }, nbMillisecondes);
          }
          break;

        case TypeInterruption.annulerTour:
          this.interruptionEnCoursAvantAnnulation = this.interruptionEnCours;
          this.jeu.sauvegarde = this.partie.creerSauvegardeSolution();
          CommandesUtils.enleverToursDeJeux(1 + this.interruptionEnCoursAvantAnnulation.nbToursAnnuler, this.jeu.sauvegarde);
          this.nouvellePartieOuAnnulerTour.emit(this.jeu.sauvegarde);
          break;

        case TypeInterruption.changerEcran:
          this.partie.ecran.afficherEcran(this.interruptionEnCours.ecran);
          this.terminerInterruption(undefined);
          break;

        case TypeInterruption.questionCommande:

          // si mode triche manuel, proposer le choix de la solution (commande suivante)
          this.executerProchaineEtapeManuTriche();

          // focus sur l'entrée de commande
          this.focusCommande();
          // si restauration automatique doit être démarrée
          if (this.restaurationSauvegardeEnAttente || this.autoTricheEnAttente) {
            this.lancerAutoTriche();
          }
          break;

        default:
          this.ajouteErreur("interruptions: je ne connais pas ce type d’interruption: " + this.interruptionEnCours.typeInterruption);
          break;
      }
    } else {

    }
  }

  private executerProchaineEtapeManuTriche() {


    if (this.manuTricheActif && !this.jeu.sauvegarde) {
      throw new Error("Manu triche actif mais aucune sauvegarde trouvée !");
    }

    // si mode triche manuel, proposer le choix de la solution (commande suivante)
    if (this.manuTricheActif && !this.resteDeLaSortie?.length) {
      this.indexDerniereCommandeRestauration += 1;
      if (this.indexDerniereCommandeRestauration < this.jeu.sauvegarde.etapesSauvegarde.length) {

        const prochaineEtape = this.jeu.sauvegarde.etapesSauvegarde[this.indexDerniereCommandeRestauration];
        let [type, valeur] = prochaineEtape.split(":");

        switch (type) {
          // commande
          case ExprReg.caractereCommande:
            this.commande = valeur;
            break;
          // réponse
          case ExprReg.caractereReponse:
            this.commande = valeur;
            break;

          // déclenchement
          case ExprReg.caractereDeclenchement:
            this.ajouterConseil(`La routine « ${valeur} » avait été déclenchée avant la prochaine commande`);
            // afficher commande suivante
            this.executerProchaineEtapeManuTriche();
            break;

          // graine
          case ExprReg.caractereGraine:
            this.partie.nouvelleGraineAleatoire(valeur);
            this.ajouterConseil(`Générateur de hasard mis à jour selon fichier solution`);
            // afficher commande suivante
            this.executerProchaineEtapeManuTriche();
            break;

          // autre
          default:
            throw new Error("La prochaine étape n’est pas d’un type connu");

        }
      } else {
        this.ajouterConseil(`Fin du fichier solution.`);
      }
    }
  }

  /** Ajouter le texte spécifié (peut contenir du HTML) au texte à ignorer dans les statistiques. */
  private ajouterTexteAIgnorerAuxStatistiques(texteAIgnorer: string) {
    // comptabiliser la commandes dans les statistiques
    const affichageCommandeNettoye = Statisticien.nettoyerTexteSortie(texteAIgnorer);
    this.partie.jeu.statistiques.nbMotsCommandesAffichees += Statisticien.compterMotsTexte(affichageCommandeNettoye);
    this.partie.jeu.statistiques.nbCaracteresCommandesAffichees += affichageCommandeNettoye.length;
  }

  private ajouterConseil(conseil: string) {
    this.jeu.tamponConseils.push(conseil);
  }

  private ajouteErreur(erreur: string) {
    this.jeu.tamponErreurs.push(erreur);
  }

  private effacerEcran() {
    Statisticien.sauverStatistiquesAvantEffacerSortie(this.partie, this.partie.ecran.ecran);
    this.partie.ecran.effacerEcran();
  }

  private traiterChoixStatiqueJoueur() {
    this.commande = this.commande?.trim();
    const affichageCommande = this.partie.ecran.ajouterParagrapheDonjonOuvert('{- > ' + this.commande + '-}');
    this.ajouterTexteAIgnorerAuxStatistiques(affichageCommande);

    // choix classique
    let indexChoix = this.choixPossibles.findIndex(x => x == this.commande);

    if (indexChoix != -1) {

      // GESTION HISTORIQUE DE L’ENSEMBLE DES COMMANDES DE LA PARTIE
      // (commande pas nettoyée car pour sauvegarde « auto-commandes »)
      this.partie.ajouterReponseDansSauvegarde(this.commande)

      // effacer la commande
      this.commande = '';
      const choix = this.interruptionEnCours.choix[indexChoix];
      if (!choix) {
        this.ajouteErreur("Traiter choix: le choix correspondant à l’index n’a pas été retrouvé");
      } else {
        // sauvegarder la réponse dans le contexte du tour
        // remarques : toujours une seule valeur pour les choix statiques !
        this.interruptionEnCours.tour.reponse = choix.valeurs[0].toString();
        // terminer l’interruption
        this.terminerInterruption(choix);
      }
    } else {
      this.partie.ecran.ajouterParagrapheDonjon('Veuillez entrer la lettre correspondante à votre choix.');
    }
    this.scrollSortie();
  }

  private traiterChoixLibreJoueur() {
    this.commande = this.commande?.trim();
    const affichageCommande = this.partie.ecran.ajouterParagrapheDonjonOuvert('{- > ' + this.commande + '-}');
    this.ajouterTexteAIgnorerAuxStatistiques(affichageCommande);

    const choixPasNettoye = this.commande.trim();
    const choixNettoye = StringUtils.normaliserReponse(this.commande);

    let estAutreChoix = false;

    // choix classique
    let indexChoix = this.interruptionEnCours.choix.findIndex(x => x.valeursNormalisees.includes(choixNettoye));
    // essayer "autre choix"
    if (indexChoix == -1) {
      indexChoix = this.interruptionEnCours.choix.findIndex(x => x.valeursNormalisees.includes("autre choix"));
      estAutreChoix = true;
    }

    if (indexChoix != -1) {
      // GESTION HISTORIQUE DE L’ENSEMBLE DES COMMANDES DE LA PARTIE
      // (commande pas nettoyée car pour sauvegarde « auto-commandes »)
      this.partie.ajouterReponseDansSauvegarde(this.commande);

      // effacer la commande
      this.commande = '';
      const choix = this.interruptionEnCours.choix[indexChoix];
      if (!choix) {
        this.ajouteErreur("Traiter choix: le choix correspondant à l’index n’a pas été retrouvé");
      } else {
        // sauvegarder la réponse dans le contexte du tour
        if (estAutreChoix) {
          this.interruptionEnCours.tour.reponse = choixPasNettoye;
        } else {
          // retrouver la valeurs parmi les valeurs possibles
          const indexValeur = choix.valeursNormalisees.findIndex(x => x == choixNettoye);
          this.interruptionEnCours.tour.reponse = choix.valeurs[indexValeur];
        }
        // terminer l’interruption
        this.terminerInterruption(choix);
      }
    } else {
      this.partie.ecran.ajouterParagrapheDonjon('Veuillez entrer la lettre correspondante à votre choix.');
    }
    this.scrollSortie();
  }

  /**
   * Fin de l’interruption:
   *  - traiter la prochaine instruction éventuelle, 
   *  - démarrer le jeu, 
   *  - commande suivante si mode triche,
   *  - faire défiler la sortie
   */
  private terminerInterruption(choix: Choix | undefined) {

    // Il s’agit d’un tour interrompu
    if (this.interruptionEnCours.typeContexte == TypeContexte.tour || this.interruptionEnCours.typeContexte == TypeContexte.routine) {
      const typeContexte = this.interruptionEnCours.typeContexte;
      // tour à continuer
      const tourInterrompu = this.interruptionEnCours.tour;
      // ajouter les instructions découlant du choix au reste des instructions à exécuter pour ce tour
      if (choix?.instructions?.length) {
        tourInterrompu.reste.unshift(...choix.instructions);
      }
      // l’interruption est terminée
      this.interruptionEnCours = undefined;

      let sortieCommande: string;
      if (typeContexte == TypeContexte.tour) {
        // continuer le tour interrompu
        sortieCommande = this.partie.com.continuerLeTourInterrompu(tourInterrompu);
      } else if (typeContexte == TypeContexte.routine) {
        sortieCommande = this.partie.com.continuerRoutineInterrompue(tourInterrompu);
      } else {
        throw new Error("TypeContexte pas pris en charge");
      }

      // Enregistrement de la sortie pour génération d'un enregistrement (.rec)
      this.partie.enregistrerSortieEtapeCourante(sortieCommande ?? '');

      // s'il faut lancer une nouvelle partie
      if (sortieCommande.includes('@nouvelle partie@')) {
        this.nouvellePartieOuAnnulerTour.emit();
        // sinon afficher la sortie du tour
      } else {
        this.ajouterContenuHtmlAvecTagsDonjon("<br>" + BalisesHtml.convertirEnHtml(sortieCommande, this.partie.dossierRessourcesComplet));
      }
    } else if (this.interruptionEnCours.typeContexte == TypeContexte.commande) {

      if (this.interruptionEnCours.derniereQuestion.Reponse != undefined) {
        const commandeEnCours = this.interruptionEnCours.commande;
        // l’interruption est terminé (une correction a eu lieu)
        this.interruptionEnCours = undefined;
        // exécuter à nouveau la commande corrigée
        this.partie.com.setCorrectionCommande(commandeEnCours);
        this.partie.ecran.ajouterContenuDonjon(`{n}{-> ${this.commande}-}`)
        // sauver choix pour la sauvegarde
        this.partie.ajouterReponseDansSauvegarde(this.commande)
        // exécuter à nouveau la commande originale
        this.commande = commandeEnCours.brute;
        this.envoyerCommande(this.commande, this.commande, false, false, false, false);
      } else {
        // l’interruption est terminé (pas de correction)
        this.interruptionEnCours = undefined;
      }

    } else {
      this.ajouteErreur("Terminer interruption: type d’interruption pas pris en charge");
      // l’interruption est terminée
      this.interruptionEnCours = undefined;
    }

    // s’il y a encore des interruptions à gérer, il faut les gérer
    if (this.jeu.tamponInterruptions.length) {
      this.traiterProchaineInterruption();
      // s’il reste des routines à exécuter, il faut les exécuter
    } else if (this.jeu.tamponRoutinesEnAttente.length) {
      this.traiterProchaineRoutine();
      // sinon la commande est terminée
    } else {

      // TODO: traiter routines en attente.


      // si le jeu n’étais pas encore commencé, il l’est à présent
      let tricheVientDeDemarrer = false;
      if (!this.partie.jeu.commence) {
        this.partie.jeu.commence = true;
        // si une sauvegarde doit être restaurée
        if (this.restaurationSauvegardeEnAttente || this.autoTricheEnAttente) {
          this.lancerAutoTriche();
          // si mode triche manuel en attente
        } else if (this.manuTricheEnAttente) {
          this.manuTricheEnAttente = false;
          this.lancerManuTriche(); // appelle déjà executerProchaineEtapeManuTriche()
          tricheVientDeDemarrer = true;
          // sinon lancer le système de routines programmées
        } else {
          this.lancerRoutinesProgrammees();
        }
      }

      // mode triche: afficher commande suivante
      // (pas si on vient de démarrer le mode triche : lancerManuTriche l’a déjà fait)
      if (!tricheVientDeDemarrer) {
        this.executerProchaineEtapeManuTriche();
      }
    }
    this.scrollSortie();
  }

  private afficherSuiteSortie() {
    // prochaine section à afficher
    let texteSection = this.resteDeLaSortie.shift();
    // retrouver le dernier effacement d’écran éventuel
    const indexDernierEffacement = texteSection.lastIndexOf("@@effacer écran@@");
    // s’il ne faut pas effacer l’écran
    if (indexDernierEffacement == -1) {
      // enlever premier retour à la ligne
      if (texteSection.startsWith("<br>")) {
        texteSection = texteSection.slice("<br>".length);
      }
      // ajouter à la suite
      this.partie.ecran.ajouterParagrapheHtml(texteSection);
      // sinon (il faut effacer écran)
    } else {
      // remplacer la sortie du joueur
      this.effacerEcran();
      this.partie.ecran.ajouterParagrapheHtml(texteSection.slice(indexDernierEffacement + "@@effacer écran@@".length));
    }

    // s’il reste d’autres sections, attendre
    if (this.resteDeLaSortie.length) {
      this.partie.ecran.ajouterParagrapheDonjonOuvert
      this.partie.ecran.ajouterContenuHtml('<p class="t-commande font-italic">Appuyez sur une touche…');
    } else {
      // mode triche : afficher commande suivante
      this.executerProchaineEtapeManuTriche();
    }
    this.scrollSortie();
  }

  private scrollSortie() {

    if (this.sansDefilement) {
      this.sansDefilement = false;
    } else {
      // scroll 1
      setTimeout(() => {
        this.resultatInputRef.nativeElement.scrollTop = this.resultatInputRef.nativeElement.scrollHeight;
        this.commandeInputRef.nativeElement.focus();

        // activer le lien tester l’audio au besoin
        if (this.audioActif) {
          this.elementRef.nativeElement.querySelector('.tester-audio')?.addEventListener('click', this.testerAudio.bind(this));
        }

        // scroll 2 (afin de prendre en compte temps chargement images)
        setTimeout(() => {
          this.resultatInputRef.nativeElement.scrollTop = this.resultatInputRef.nativeElement.scrollHeight;
          this.commandeInputRef.nativeElement.focus();
        }, 500);
      }, 100);
    }
  }

  /**
   * Appuis sur une touche par le joueur.
   */
  onKeyDown(event: KeyboardEvent) {
    // éviter de déclencher appuis touche avant la fin de la commande en cours
    if (!this.commandeEnCours) {
      // regarder s’il reste du texte à afficher
      if (this.resteDeLaSortie?.length) {
        this.afficherSuiteSortie();
        // effacer sortie sauf si mode triche manuel est actif
        if (!this.manuTricheActif) {
          this.commande = "";
        }
        event.preventDefault();
      } else if (this.interruptionAttendreToucheEnCours) {
        this.terminerInterruption(undefined);
      }
    }

    // choix: garder la dernière lettre entrée
    if (this.interruptionAttendreChoixEnCours && this.commande.length && (
      event.key != "Enter" && event.key != "Backspace" &&
      event.key != "ArrowDown" && event.key != "ArrowUp" &&
      event.key != "Shift" && event.key != "Tab")
    ) {
      this.commande = "";
    }
  }

  /**
   * Historique: aller en arrière (flèche haut)
   * @param event
   */
  onKeyDownArrowUp(event) {
    if (!this.resteDeLaSortie?.length && !this.interruptionEnCours) {
      if (this.curseurDernieresCommandes < (this.dernieresCommandesDistinctes.length - 1)) {
        this.curseurDernieresCommandes += 1;
        const index = (this.dernieresCommandesDistinctes.length - this.curseurDernieresCommandes - 1);
        this.commande = this.dernieresCommandesDistinctes[index];
        this.focusCommande();
      }
      // proposer le choix précédent
    } else if (this.interruptionAttendreChoixEnCours) {
      if (this.choixPossibles.length > 0) {
        this.indexChoixPropose--;
        if (this.indexChoixPropose < 0) {
          this.indexChoixPropose = (this.choixPossibles.length - 1);
        }
        this.commande = this.choixPossibles[this.indexChoixPropose];
        this.focusCommande();
      }
    }
  }

  /**
   * Historique: revenir en avant (Flèche bas)
   */
  onKeyDownArrowDown(event) {
    if (!this.resteDeLaSortie?.length && !this.interruptionEnCours) {
      if (this.curseurDernieresCommandes >= 0) {
        this.curseurDernieresCommandes -= 1;
        const index = (this.dernieresCommandesDistinctes.length - this.curseurDernieresCommandes - 1);
        this.commande = this.dernieresCommandesDistinctes[index];
        this.focusCommande();
      } else {
        this.commande = "";
      }
      // proposer le choix suivant
    } else if (this.interruptionAttendreChoixEnCours) {
      if (this.choixPossibles.length > 0) {
        this.indexChoixPropose++;
        if (this.indexChoixPropose > (this.choixPossibles.length - 1)) {
          this.indexChoixPropose = 0;
        }
        this.commande = this.choixPossibles[this.indexChoixPropose];
        this.focusCommande();
      }
    }
  }

  /** Échap: interrompre le mode triche manuel. */
  onKeyDownEscape(event: Event) {
    if (this.manuTricheActif) {
      this.manuTricheActif = false;
      this.commande = "";
      event.preventDefault();
    }
  }

  /** Définir le focus sur l’entrée commande utilisateur. */
  public focusCommande() {
    setTimeout(() => {
      this.commandeInputRef.nativeElement.focus();
      this.commandeInputRef.nativeElement.selectionStart = this.commandeInputRef.nativeElement.selectionEnd = this.commande?.length ?? 0;
    }, 100);
  }

  /** Définir la liste des auto commandes (pour tester un jeu plus rapidement avec triche et auto-triche) */
  public setSolution(sauvegarde: Sauvegarde) {
    this.jeu.sauvegarde = sauvegarde;
    this.partie.ecran.ajouterParagrapheDonjon('{/Fichier solution chargé./}{n}Vous pouvez utiliser {-triche-} ou {-triche auto-} pour tester le jeu à l’aide de ce fichier.');
    this.scrollSortie();
  }

  public restaurerProchainJeu() {
    this.restaurationSauvegardeEnAttente = true;
  }

  private lancerAutoTriche() {
    // on a lancé la restauration de la sauvegarde
    this.restaurationSauvegardeEnAttente = false;
    this.autoTricheEnAttente = false;
    this.autoTricheActif = true;

    // si on est occupé à restaurer une sauvegarde
    if (this.jeu.sauvegarde) {
      // s'il reste des commandes à exécuter
      if (this.jeu.sauvegarde.etapesSauvegarde.length) {

        // désactiver temporairement l'audio
        const backAudioActif = this.jeu.parametres.activerAudio;
        this.audioActif = false;

        this.autoTricheActif = true;
        this.partie.ins.restaurationPartieEnCours = true;

        let ignorerEtapeGraine = true;

        this.jeu.sauvegarde.etapesSauvegarde.forEach(async (curCom, idxEtape) => {

          if (ignorerEtapeGraine) {
            ignorerEtapeGraine = false;
          } else {
            // Charger les lectures d'horloge de cette étape (rejeu déterministe) avant de l'exécuter.
            HorlogeUtils.chargerRejeuEtape(this.jeu.sauvegarde.horlogesSauvegarde?.[idxEtape] ?? null);
            let [type, valeur] = curCom.split(":");
            switch (type) {
              // commande et réponse
              case 'c':
              case 'r': // TODO: est-ce que r doit être possible ici ou cela n’est pas normal de tomber dans ce cas ?
                this.commande = valeur;
                this.onKeyDownEnter(null);
                break;

              // graine
              case 'g':
                this.partie.nouvelleGraineAleatoire(valeur);
                break;

              // déclenchement
              case 'd':
                const declTriche = this.partie.ins.parseDeclenchement(valeur);
                const resTriche = this.lierEtEnfilerRoutine(declTriche.nom, declTriche.argsCanoniques);
                if (resTriche.routine) {
                  if (this.partie.verbeux) {
                    console.log("routine trouvée");
                  }
                  this.traiterProchaineRoutine();
                } else {
                  this.ajouteErreur(`Triche auto: ${resTriche.erreur}`)
                }
                break;

              default:
                throw new Error(`Restauration sauvegarde: type de commande pas pris en charge:  ${type}`);
            }
          }


        });

        // fin du mode triche
        this.autoTricheActif = false;
        // En magnéto, l'auto-triche ne sert qu'à restaurer l'état (ex. reload post-« Précédent ») :
        // le magnéto reste actif ensuite, donc on NE lève PAS le flag de replay ni le rejeu horloge
        // (sinon le « Suivant » suivant reprogrammerait réellement les routines au lieu de les forcer).
        if (!this.enregistrementActif) {
          this.partie.ins.restaurationPartieEnCours = false;
          // fin du rejeu horloge : les prochaines lectures utiliseront l'heure réelle
          HorlogeUtils.terminerRejeu();
        }

        // // nouvelle graine pour l’aléatoire
        // /!\ ATTENTION: il faut sauvegarder l’ensemble des graines de la partie
        // et le moment où on les a changé afin de pouvoir restaurer une partie sauvegardée !
        this.partie.nouvelleGraineAleatoire();

        // rétablir l'audio
        this.audioActif = backAudioActif;

        // aucune commande à exécuter
      } else if (!this.enregistrementActif) {
        // En magnéto, sauvegarde vide post-annuler est normal — on ne pollue pas l’écran.
        this.ajouterContenuHtmlAvecTagsDonjon("<br>" + BalisesHtml.convertirEnHtml("{/Aucune commande à exécuter./}", this.partie.dossierRessourcesComplet));
      }
      // s'il n'y a pas de sauvegarde/solution chargée
    } else {
      this.ajouterContenuHtmlAvecTagsDonjon("<br>" + BalisesHtml.convertirEnHtml("{/Aucun fichier solution (.sol) chargé./}", this.partie.dossierRessourcesComplet));
    }

    // si on était occupé à annuler des tours de jeu, terminer le tour commencé
    // avant le début de l'annulation
    if (this.interruptionEnCoursAvantAnnulation) {
      if (this.enregistrementActif) {
        // En magnéto, magnetoIdx pilote l’avancement ; terminer ici écraserait
        // l’interruption attendreChoix d’intro qui vient d’être posée par le reload
        // et la r suivante serait traitée comme commande.
        this.interruptionEnCoursAvantAnnulation = undefined;
      } else {
        this.interruptionEnCours = this.interruptionEnCoursAvantAnnulation;
        this.interruptionEnCoursAvantAnnulation = undefined;
        this.terminerInterruption(undefined);
      }
    }

  }

  private lancerManuTriche(): void {
    if (this.jeu.sauvegarde) {
      if (this.jeu.sauvegarde?.etapesSauvegarde?.length) {
        this.manuTricheActif = true;
        // on a déjà lu la première étape qui est la graine de hasard
        this.indexDerniereCommandeRestauration = 0;
        this.executerProchaineEtapeManuTriche();
      } else {
        this.ajouterContenuHtmlAvecTagsDonjon("<br>" + BalisesHtml.convertirEnHtml("{/Aucune commande à exécuter./}", this.partie.dossierRessourcesComplet));
      }
    } else {
      this.ajouterContenuHtmlAvecTagsDonjon("<br>" + BalisesHtml.convertirEnHtml("{/Aucun fichier solution (.sol) chargé./}", this.partie.dossierRessourcesComplet));
    }
  }

  private genererFichierSolution(): void {
    // enlever la dernière commande, qui est « sauver commandes »
    this.partie.enleverCommandeGenererSolution();
    let texteIgnore: string;
    if (this.partie.etapesPartie.length > 0) {
      texteIgnore = this.partie.ecran.ajouterParagrapheHtml('<i>Fichier solution généré. Vous pouvez utiliser votre fichier solution avec le mode <b>triche</b>.</i>');

      // rem: le scénario n’est pas présent dans la sauvegarde d’une solution !
      const sauvegarde = this.partie.creerSauvegardeSolution();
      const contenuJson = JSON.stringify(sauvegarde);
      const file = new File([contenuJson], (StringUtils.normaliserMot(this.jeu.titre ? this.jeu.titre : "partie") + ".sol"), { type: "text/plain;charset=utf-8" });
      FileSaver.saveAs(file);

    } else {
      texteIgnore = this.partie.ecran.ajouterContenuDonjon('{n}Aucune commande dans l’historique, il n’y a rien à mettre dans le fichier solution.');
    }
    this.ajouterTexteAIgnorerAuxStatistiques(texteIgnore);
  }

  // ============================================================
  //  Mode enregistrement (.rec) — magnétoscope
  // ============================================================

  /**
   * Charge un fichier .rec et entre en mode magnéto en pause à l'étape 1.
   * L'utilisateur pilote ensuite manuellement (Pas suivant, Lire auto, etc.).
   */
  public setEnregistrement(fichier: FichierEnregistrement) {
    this.enregistrementEnCours = fichier;
    this.magnetoIdxSortieARecalculer.clear();
    this.magnetoIdxRejeuCible = null;
    this.partie.ecran.ajouterParagrapheDonjon('{/Enregistrement chargé./}');
    this.scrollSortie();
    // Inclure le cas « intro en pause sur attendre touche / choisir » dans la branche
    // « jeu en cours » : `jeu.commence` reste false tant que l'intro est interrompue,
    // mais un état partiel est déjà accumulé (sortieIntro non vide, interruption pendante)
    // — sans demander la RAZ on tomberait dans la branche « pas encore démarré » qui
    // attend un ngOnChanges qui n'arriverait jamais, et le magnéto resterait muet.
    if (this.partie.jeu?.commence || this.interruptionEnCours) {
      // Jeu déjà en cours : demander à l'utilisateur s'il veut remettre à zéro avant le replay.
      // Sans RAZ, l'état courant pollue le replay et produit des fausses divergences.
      this.magnetoDemanderRaz = true;
    } else {
      // Jeu pas encore démarré : lancer le magnéto dès le démarrage de la partie.
      this.enregistrementEnAttente = true;
    }
  }

  /** L'utilisateur accepte le RAZ : on déclenche une nouvelle partie, le magnéto démarrera au commence du jeu. */
  public magnetoConfirmerRazOui(): void {
    this.magnetoDemanderRaz = false;
    this.enregistrementEnAttente = true;
    // Émet la même event que les autres modes pour que le parent recompile et fournisse un nouveau jeu.
    this.nouvellePartieOuAnnulerTour.emit(undefined);
  }

  /** L'utilisateur refuse le RAZ : on lance le magnéto sur l'état courant. */
  public magnetoConfirmerRazNon(): void {
    this.magnetoDemanderRaz = false;
    this.initialiserMagneto();
  }

  /**
   * Initialise l'état magnéto au début d'une session d'enregistrement.
   * Pas d'exécution automatique — l'utilisateur prend la main.
   */
  private initialiserMagneto(): void {
    if (!this.enregistrementEnCours) return;
    this.enregistrementEnAttente = false;
    this.enregistrementActif = true;
    // Désactiver les routines programmées tant que le magnéto est affiché :
    // les déclenchements 'd' du .rec les forcent au bon moment, sinon double exécution
    // (chrono temps réel + 'd' forcé). Même mécanisme que la restauration d'une sauvegarde .sol.
    this.partie.ins.restaurationPartieEnCours = true;
    // Vider les routines en attente issues d'un éventuel jeu en cours (magnéto lancé sans RAZ) :
    // le .rec redéfinit complètement le scénario de déclenchements.
    this.jeu.programmationsTemps.length = 0;
    this.jeu.tamponRoutinesEnAttente.length = 0;
    this.enregistrementActions = [];
    this.enregistrementCompteurs = { acceptations: 0, retraits: 0, modifications: 0, ajouts: 0 };
    this.magnetoIdx = 0;
    this.magnetoDivergence = null;
    this.magnetoSaisieHorloge = null;
    this.magnetoLectureAutoEnCours = false;
    this.magnetoEdition = 'aucun';
    this.magnetoSaisieCommande = '';
    this.magnetoDernierTest = null;
    this.magnetoIdxEnEdition = null;
    this.magnetoEditionTypeOriginal = null;
    this.magnetoSnapshotsRng.clear();
    this.magnetoIdxReponsesChoix.clear();

    // Appliquer la graine du fichier pour rendre le replay déterministe.
    if (this.enregistrementEnCours.graine) {
      this.partie.nouvelleGraineAleatoire(this.enregistrementEnCours.graine);
    }

    // Bypass des attendre touche (et attendre N secondes) pendantes en fin d'intro :
    // sans ça, la sortie d'intro produite par le replay s'arrête sur le marqueur de
    // touche alors que celle enregistrée contient la continuation post-touche — diff
    // fantôme garanti. Comportement aligné avec le mode triche, qui ne demande pas
    // à l'utilisateur de presser une touche pendant un replay.
    // (Les attendreChoix d'intro ne sont PAS consommés ici : la réponse vient de la 1re
    // étape r du .rec, résolue au 1er Pas suivant.)
    this.terminerInterruptionsBloquantesPourMagneto();

    // Sauter les étapes initiales g (graine déjà appliquée) et d (déclenchements) jusqu'à
    // tomber sur la première étape c ou r — point d'entrée du magnéto.
    this.magnetoIdx = this.avancerJusquAEtapeJouable(0, /*sauterGrainInitiale*/ true);

    // Re-consommer les attendre touche/secondes pendantes : une routine d: forcée
    // silencieusement par avancerJusquAEtapeJouable a pu laisser une interruption en place.
    this.terminerInterruptionsBloquantesPourMagneto();

    // Comparer la sortie d'intro produite par la partie en cours à celle stockée dans le .rec.
    // Si elles diffèrent, ouvrir une divergence intro avant tout pas suivant.
    if (this.enregistrementEnCours.sortieIntro !== undefined &&
        this.enregistrementEnCours.sortieIntro !== this.partie.sortieIntro) {
      const diff = LecteurComponent.calculerDiffSorties(this.enregistrementEnCours.sortieIntro, this.partie.sortieIntro);
      this.magnetoDivergenceIntro = {
        sortie: this.enregistrementEnCours.sortieIntro,
        sortieObtenue: this.partie.sortieIntro,
        diffAttendu: diff.gauche,
        diffObtenue: diff.droite,
      };
    }

    // Ré-avance automatique après une saisie d'heure : on rejoue jusqu'à la position où l'auteur
    // était, pour qu'il continue son enregistrement plutôt que de rester sur l'intro.
    if (this.magnetoIdxRejeuCible !== null && !this.magnetoDivergenceIntro) {
      const cible = this.magnetoIdxRejeuCible;
      this.magnetoIdxRejeuCible = null;
      setTimeout(() => {
        if (this.enregistrementActif && this.enregistrementEnCours) {
          this.avancerAutoJusqua(cible);
        }
      }, 0);
    } else {
      // Divergence d'intro (ou pas de ré-avance) : on abandonne la cible éventuelle.
      this.magnetoIdxRejeuCible = null;
    }
  }

  /** Valide la sortie d'intro obtenue comme nouvelle sortie attendue. */
  public magnetoValiderIntro(): void {
    if (!this.magnetoDivergenceIntro || !this.enregistrementEnCours) return;
    this.enregistrementEnCours.sortieIntro = this.magnetoDivergenceIntro.sortieObtenue;
    this.enregistrementCompteurs.acceptations++;
    this.enregistrementActions.push({ idx: -1, action: 'validé intro', detail: 'sortie d\'intro mise à jour' });
    this.magnetoDivergenceIntro = null;
  }

  /**
   * Retourne le prochain idx ≥ depuis qui pointe sur une étape jouable.
   * - En intro (sauterGrainInitiale=true) : force silencieusement les 'g' et 'd' jusqu'à la première c/r.
   *   La sortie d'intro globale (sortieIntro) couvre la comparaison de cette phase.
   * - En live (sauterGrainInitiale=false) : applique les 'g' rencontrées mais s'arrête sur 'c', 'r' OU 'd'.
   *   Le curseur peut donc se poser sur un 'd' — chaque routine forcée devient une étape distincte
   *   du pas-à-pas, avec sa propre comparaison de sortie.
   */
  private avancerJusquAEtapeJouable(depuis: number, sauterGrainInitiale: boolean): number {
    if (!this.enregistrementEnCours) return depuis;
    const etapes = this.enregistrementEnCours.etapes;
    const enIntro = sauterGrainInitiale;
    let idx = depuis;
    let premiereGraineSautee = !sauterGrainInitiale;
    while (idx < etapes.length) {
      const e = etapes[idx];
      if (e.type === 'g') {
        if (!premiereGraineSautee) {
          premiereGraineSautee = true;
        } else {
          this.partie.nouvelleGraineAleatoire(e.valeur);
        }
        idx++;
        continue;
      }
      if (e.type === 'd' && enIntro) {
        // En intro : forcer la routine silencieusement. Pas de comparaison ici (gérée par sortieIntro).
        const declIntro = this.partie.ins.parseDeclenchement(e.valeur);
        const resIntro = this.lierEtEnfilerRoutine(declIntro.nom, declIntro.argsCanoniques);
        if (resIntro.routine) {
          this.traiterProchaineRoutine();
        }
        idx++;
        continue;
      }
      break; // c, r ou d (en live)
    }
    return idx;
  }

  /**
   * Force la routine référencée par une étape 'd' et compare sa sortie à celle attendue.
   * Retourne true si la routine a été exécutée sans divergence, false si une divergence
   * a été ouverte (magnetoDivergence posé).
   */
  private executerEtapeDeclenchement(etape: EtapeEnregistrement, idx: number): boolean {
    this.partie.reinitialiserDerniereSortieEnregistree();
    // Charger les lectures d'horloge de cette étape (rejeu déterministe) avant exécution.
    HorlogeUtils.chargerRejeuEtape(etape.horloge ?? null);
    const decl = this.partie.ins.parseDeclenchement(etape.valeur);
    const resLiaison = this.lierEtEnfilerRoutine(decl.nom, decl.argsCanoniques);
    if (!resLiaison.routine) {
      // Routine référencée par le .rec absente du scénario (ou surcharge non liable) : ouvrir une
      // divergence dédiée pour informer l'utilisateur via l'UI plutôt que via un texte de jeu.
      this.magnetoDivergence = { etape, idx, sortieObtenue: '', diffAttendu: [], diffObtenue: [], routineIntrouvable: true };
      this.magnetoLectureAutoEnCours = false;
      return false;
    }
    this.traiterProchaineRoutine();
    // Si la routine forcée contient un `attendre touche` ou `attendre N secondes`, on
    // doit auto-presser/auto-consommer comme pour une c/r, sinon le magnéto resterait
    // bloqué sur l'interruption en fin d'étape `d` (l'utilisateur devrait cliquer Suivant
    // sans rien faire pour la consommer).
    this.terminerInterruptionsBloquantesPourMagneto();
    const sortieObtenue = this.partie.derniereSortieEnregistree ?? '';
    if (this.magnetoIdxSortieARecalculer.has(idx)) {
      // Sortie recalculée avec l'heure fournie : on l'accepte (pas de divergence).
      etape.sortie = sortieObtenue;
      this.magnetoIdxSortieARecalculer.delete(idx);
      return true;
    }
    if (etape.sortie !== undefined && etape.sortie !== sortieObtenue) {
      const diff = LecteurComponent.calculerDiffSorties(etape.sortie, sortieObtenue);
      this.magnetoDivergence = { etape, idx, sortieObtenue, diffAttendu: diff.gauche, diffObtenue: diff.droite };
      this.magnetoLectureAutoEnCours = false;
      return false;
    }
    return true;
  }

  // -- Diff de sortie (surlignage des sections divergentes) ---------------

  /**
   * Calcule un diff mot-à-mot entre deux sorties textuelles. Renvoie deux
   * suites de segments (gauche=attendu, droite=obtenu) qui, concaténées,
   * redonnent le texte original — chaque segment porte un flag `diff`
   * indiquant s'il appartient à une portion divergente.
   *
   * Algorithme : LCS sur la tokenisation `/(\s+)/` (mots + blancs préservés).
   * Complexité O(n·m), suffisant pour les sorties courtes typiques d'IF.
   */
  public static calculerDiffSorties(attendu: string, obtenu: string): { gauche: SegmentDiff[], droite: SegmentDiff[] } {
    const a = (attendu ?? '').split(/(\s+)/).filter(t => t.length > 0);
    const b = (obtenu ?? '').split(/(\s+)/).filter(t => t.length > 0);
    const n = a.length, m = b.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = (a[i] === b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const gauche: SegmentDiff[] = [];
    const droite: SegmentDiff[] = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        gauche.push({ texte: a[i], diff: false });
        droite.push({ texte: b[j], diff: false });
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        gauche.push({ texte: a[i], diff: true });
        i++;
      } else {
        droite.push({ texte: b[j], diff: true });
        j++;
      }
    }
    while (i < n) { gauche.push({ texte: a[i++], diff: true }); }
    while (j < m) { droite.push({ texte: b[j++], diff: true }); }
    return { gauche, droite };
  }

  // -- Contrôles magnéto (toolbar principale) ------------------------------

  /** Exécute l'étape courante et compare la sortie. Met en pause sur divergence. */
  public magnetoPasSuivant(): void {
    if (!this.enregistrementActif || !this.enregistrementEnCours) return;
    if (this.magnetoDivergence || this.magnetoDivergenceIntro || this.magnetoSaisieHorloge) return; // bloqué tant que divergence / saisie non résolue
    if (this.magnetoIdx >= this.enregistrementEnCours.etapes.length) {
      this.afficherRecap();
      return;
    }
    const etape = this.enregistrementEnCours.etapes[this.magnetoIdx];
    if (etape.type !== 'c' && etape.type !== 'r' && etape.type !== 'd') {
      this.magnetoIdx = this.avancerJusquAEtapeJouable(this.magnetoIdx, false);
      return;
    }
    // Snapshot du PRNG AVANT exécution : permet à Précédent de restaurer l'état exact
    // (puisqu'annuler regénère volontairement la graine en mode jeu normal).
    const snap = AleatoireUtils.instantane();
    if (snap) this.magnetoSnapshotsRng.set(this.magnetoIdx, snap);

    if (etape.type === 'd') {
      // Étape « routine forcée » : sa sortie est comparée séparément de la commande qui précède.
      const ok = this.executerEtapeDeclenchement(etape, this.magnetoIdx);
      // Une lecture d'horloge non enregistrée prime sur la divergence (qui serait fondée sur
      // l'heure réelle) : on demande l'heure à l'auteur.
      if (this.detecterLectureHorlogeManquante(this.magnetoIdx)) { this.magnetoDivergence = null; return; }
      if (ok) {
        this.magnetoIdx = this.avancerJusquAEtapeJouable(this.magnetoIdx + 1, false);
        if (this.magnetoIdx >= this.enregistrementEnCours.etapes.length) {
          this.afficherRecap();
        }
      }
      return;
    }

    const sortieObtenue = this.executerEtapeEnregistrement(etape);
    if (this.detecterLectureHorlogeManquante(this.magnetoIdx)) return;
    if (this.magnetoIdxSortieARecalculer.has(this.magnetoIdx)) {
      // Sortie recalculée avec l'heure fournie : on l'accepte (pas de divergence).
      etape.sortie = sortieObtenue;
      this.magnetoIdxSortieARecalculer.delete(this.magnetoIdx);
      this.magnetoIdx = this.avancerJusquAEtapeJouable(this.magnetoIdx + 1, false);
      if (this.magnetoIdx >= this.enregistrementEnCours.etapes.length) {
        this.afficherRecap();
      }
      return;
    }
    if ((etape.sortie ?? '') === sortieObtenue) {
      this.magnetoIdx = this.avancerJusquAEtapeJouable(this.magnetoIdx + 1, false);
      if (this.magnetoIdx >= this.enregistrementEnCours.etapes.length) {
        this.afficherRecap();
      }
    } else {
      // divergence : pause
      const diff = LecteurComponent.calculerDiffSorties(etape.sortie ?? '', sortieObtenue);
      this.magnetoDivergence = { etape, idx: this.magnetoIdx, sortieObtenue, diffAttendu: diff.gauche, diffObtenue: diff.droite };
      this.magnetoLectureAutoEnCours = false;
    }
  }

  /**
   * Si l'étape qui vient d'être jouée a lu l'horloge sans valeur enregistrée (instruction
   * insérée/modifiée), ouvre la saisie d'heure (pause). Retourne true dans ce cas.
   */
  private detecterLectureHorlogeManquante(idx: number): boolean {
    if (!HorlogeUtils.aLectureManquante) return false;
    this.magnetoSaisieHorloge = {
      idx,
      inputs: HorlogeUtils.lecturesUtiliseesEtape().map(ts => this.horlogeVersInput(ts)),
    };
    this.magnetoLectureAutoEnCours = false;
    return true;
  }

  /**
   * Valide les heures saisies : les inscrit dans l'étape (.rec), marque sa sortie pour recalcul,
   * puis rejoue de façon déterministe et **ré-avance automatiquement** jusqu'à la position courante
   * (équivaut à « Précédent puis Suivant » sur l'instruction : sa sortie est recalculée avec l'heure
   * fournie, et l'auteur retrouve sa place au lieu de rester sur l'intro).
   */
  public magnetoConfirmerSaisieHorloge(): void {
    if (!this.magnetoSaisieHorloge || !this.enregistrementEnCours) return;
    const { idx, inputs } = this.magnetoSaisieHorloge;
    const lectures = inputs.map(s => this.inputVersHorloge(s));
    this.enregistrementEnCours.etapes[idx].horloge = lectures;
    // La sortie attendue a été capturée avec l'heure réelle : la marquer pour recalcul au rejeu
    // (l'instruction sera rejouée avec l'heure fournie, et sa sortie acceptée sans divergence).
    this.magnetoIdxSortieARecalculer.add(idx);
    this.enregistrementActions.push({ idx, action: 'heure', detail: `${lectures.length} lecture(s) d'horloge définie(s)` });
    this.magnetoSaisieHorloge = null;
    // Position à retrouver après le rejeu (là où on était — juste après l'instruction).
    this.magnetoIdxRejeuCible = this.magnetoIdx;
    // Rejeu déterministe ; initialiserMagneto ré-avancera automatiquement jusqu'à la cible.
    this.magnetoRecommencer();
  }

  /**
   * Ré-avance le replay (pas-à-pas) jusqu'à atteindre `cible`, en s'arrêtant si une divergence /
   * saisie s'ouvre ou si le curseur n'avance plus. Utilisé après une saisie d'heure pour ramener
   * l'auteur là où il était, après le rejeu déterministe.
   */
  private avancerAutoJusqua(cible: number): void {
    let garde = 0;
    while (this.enregistrementActif && this.enregistrementEnCours
      && !this.magnetoDivergence && !this.magnetoDivergenceIntro && !this.magnetoSaisieHorloge
      && this.magnetoIdx < cible && this.magnetoIdx < this.enregistrementEnCours.etapes.length
      && garde++ < 100000) {
      const avant = this.magnetoIdx;
      this.magnetoPasSuivant();
      if (this.magnetoIdx === avant) break; // plus de progression : on s'arrête
    }
  }

  /** Convertit un horodatage (epoch ms) en valeur de champ `datetime-local` (heure locale). */
  public horlogeVersInput(ts: number): string {
    const d = new Date(ts);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  /** Convertit une valeur de champ `datetime-local` en horodatage (epoch ms). */
  public inputVersHorloge(valeur: string): number {
    const t = new Date(valeur).getTime();
    return isNaN(t) ? Date.now() : t;
  }

  /** Recule d'une étape : annule la commande exécutée à l'écran et décrémente l'idx. */
  public magnetoPrecedent(): void {
    if (!this.enregistrementActif) return;
    // Si on n'a pas encore exécuté la première c/r, rien à faire
    if (this.magnetoIdx === 0 && !this.magnetoDivergence && !this.magnetoDivergenceIntro) return;

    // Divergence intro : « Précédent » la ferme sans valider (la sortie d'intro
    // attendue du .rec reste inchangée). L'utilisateur peut ensuite « Pas suivant ».
    if (this.magnetoDivergenceIntro) {
      this.enregistrementActions.push({ idx: -1, action: 'reculé intro', detail: 'divergence d\'intro ignorée' });
      this.magnetoDivergenceIntro = null;
      return;
    }

    // Si une divergence est affichée, c'est qu'on vient juste d'exécuter cette étape.
    // « Précédent » revient à l'état pré-divergence : annule et abandonne la divergence.
    if (this.magnetoDivergence) {
      const idxDiv = this.magnetoDivergence.idx;
      const etapeDiv = this.enregistrementEnCours.etapes[idxDiv];
      // Retirer les 'd' (et 'g' trailing qui les masquent) du sauvegarde de replay : sinon le reload
      // post-annuler re-force les routines et leurs sorties réapparaissent à l'écran.
      this.partie.enleverDeclenchementsTrailing();
      this.executerCommandeAffichee('annuler');
      this.enregistrementActions.push({ idx: idxDiv, action: 'reculé', detail: `« ${this.magnetoDivergence.etape.valeur} » annulée` });
      this.magnetoDivergence = null;
      // Si la divergence portait sur un 'd', `annuler` a reculé la c/r qui le précédait — la
      // routine seule ne pouvant être annulée. On replace le curseur sur cette c/r, puis on
      // re-exécute cette c/r automatiquement après le reload pour que l'état revienne à
      // « post-c/r, avant routine » et que le curseur arrive sur le 'd' (= dernière étape
      // VISIBLE comme courante dans la mini-liste).
      let idxRestore = idxDiv;
      let rejouerCRApresReload = false;
      if (etapeDiv && etapeDiv.type === 'd') {
        let idxRecul = idxDiv - 1;
        while (idxRecul >= 0) {
          const t = this.enregistrementEnCours.etapes[idxRecul].type;
          if (t === 'c' || t === 'r') break;
          idxRecul--;
        }
        if (idxRecul >= 0) {
          this.magnetoIdx = idxRecul;
          idxRestore = idxRecul;
          rejouerCRApresReload = true;
        } else {
          this.magnetoIdx = 0;
          idxRestore = 0;
        }
      }
      this.restaurerSnapshotRng(idxRestore);
      // En production, le parent (donjon-jouer/creer) reload la partie de façon async
      // après l'annuler — ce reload ré-applique la graine et écrase notre restauration sync.
      // On re-restaure après le reload pour imposer l'état PRNG du snapshot.
      const idxRecCRAttendue = this.magnetoIdx;
      setTimeout(() => {
        if (this.enregistrementActif && this.enregistrementEnCours) {
          this.restaurerSnapshotRng(idxRestore);
          if (rejouerCRApresReload && this.magnetoIdx === idxRecCRAttendue && !this.magnetoDivergence) {
            // Re-jouer la c/r automatiquement pour avancer le curseur jusqu'au 'd'.
            this.magnetoPasSuivant();
          }
        }
      }, 250);
      // Recule d'une étape (idx pointe sur celle qui vient d'être annulée).
      // Pour pouvoir « Pas suivant » et re-jouer cette étape, on garde idx à sa valeur.
      return;
    }

    // Sinon (pas de divergence) : reculer d'une c/r en arrière, annulant l'étape précédemment validée.
    let idxRecul = this.magnetoIdx - 1;
    while (idxRecul >= 0) {
      const e = this.enregistrementEnCours!.etapes[idxRecul];
      if (e.type === 'c' || e.type === 'r') break;
      idxRecul--;
    }
    if (idxRecul < 0) return;
    // Si on recule sur une 'r' (réponse à un choisir), l'engine annule tout le tour (c + r
    // ensemble — enleverToursDeJeux consomme les r trailing avec la c qui les précède). Pour
    // que Pas suivant sur cette r retrouve un choisir pendant côté partie, on doit replanifier
    // la re-exécution de la c qui originait le choisir : même pattern que la divergence-d
    // (F050-MAG-T034) — magnetoIdx pointe sur la c, puis un magnetoPasSuivant programmatique
    // re-joue la c et fait avancer naturellement le curseur sur la r. Si aucune c en amont
    // (cas intro-only), on laisse magnetoIdx sur la r : l'intro elle-même reposera le choisir
    // après le reload.
    let idxRestore = idxRecul;
    let rejouerCRApresReload = false;
    if (this.enregistrementEnCours!.etapes[idxRecul].type === 'r') {
      let idxC = idxRecul - 1;
      while (idxC >= 0) {
        const t = this.enregistrementEnCours!.etapes[idxC].type;
        if (t === 'c' || t === 'r') break;
        idxC--;
      }
      if (idxC >= 0 && this.enregistrementEnCours!.etapes[idxC].type === 'c') {
        idxRecul = idxC;
        idxRestore = idxC;
        rejouerCRApresReload = true;
      }
    }
    // Retirer les 'd' (et 'g' trailing qui les masquent) du sauvegarde de replay : sinon le reload
    // post-annuler re-force les routines et leurs sorties réapparaissent à l'écran.
    this.partie.enleverDeclenchementsTrailing();
    this.executerCommandeAffichee('annuler');
    this.magnetoIdx = idxRecul;
    this.restaurerSnapshotRng(idxRestore);
    // En production, le parent (donjon-jouer/creer) reload la partie de façon async
    // après l'annuler — ce reload ré-applique la graine et écrase notre restauration sync.
    // On re-restaure après le reload pour imposer l'état PRNG du snapshot.
    const idxRecCRAttendue = this.magnetoIdx;
    setTimeout(() => {
      if (this.enregistrementActif && this.enregistrementEnCours) {
        this.restaurerSnapshotRng(idxRestore);
        if (rejouerCRApresReload && this.magnetoIdx === idxRecCRAttendue && !this.magnetoDivergence) {
          // Re-jouer la c automatiquement pour ramener le choisir pendant et avancer le curseur sur la r.
          this.magnetoPasSuivant();
        }
      }
    }, 250);
    this.enregistrementActions.push({ idx: idxRecul, action: 'reculé', detail: `retour à l'étape précédente` });
  }

  /**
   * Restaure le PRNG dans l'état où il était JUSTE AVANT que la c/r à `idx` ne s'exécute.
   * À défaut de snapshot (étape jamais jouée dans la session), retombe sur la dernière
   * graine déclarée en amont dans etapes pour rester déterministe.
   */
  private restaurerSnapshotRng(idx: number): void {
    if (!this.enregistrementEnCours) return;
    const snap = this.magnetoSnapshotsRng.get(idx);
    if (snap) {
      AleatoireUtils.restaurer(snap);
      return;
    }
    const etapes = this.enregistrementEnCours.etapes;
    let graine: string | undefined = this.enregistrementEnCours.graine;
    for (let i = 0; i < etapes.length && i < idx; i++) {
      if (etapes[i].type === 'g') graine = etapes[i].valeur;
    }
    if (graine !== undefined && graine !== '') {
      AleatoireUtils.init(graine);
    }
  }

  /** Lance la lecture auto. S'arrête à la première divergence ou à la fin. */
  public async magnetoLireAuto(): Promise<void> {
    if (!this.enregistrementActif || !this.enregistrementEnCours) return;
    if (this.magnetoDivergence) return;
    this.magnetoLectureAutoEnCours = true;
    while (this.magnetoLectureAutoEnCours && this.enregistrementActif && !this.magnetoDivergence && this.enregistrementEnCours && this.magnetoIdx < this.enregistrementEnCours.etapes.length) {
      this.magnetoPasSuivant();
      // Yield au scheduler pour que le clic « Stop » et le rendu Angular puissent s'intercaler.
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    this.magnetoLectureAutoEnCours = false;
  }

  /** Arrête la lecture auto et remet en pause. */
  public magnetoStop(): void {
    this.magnetoLectureAutoEnCours = false;
  }

  /**
   * Recommence le replay depuis le début (intro). Garde le `.rec` en mémoire (y compris
   * les modifications éventuelles déjà appliquées) et marque le magnéto en attente de
   * relance. Émet `nouvellePartieOuAnnulerTour` pour que le parent recompile/redémarre
   * la partie : le ngOnChanges qui suit redéclenchera `initialiserMagneto` à partir de
   * l'état zéro (intro rejouée, magnetoIdx = 0 sur la 1ère étape jouable).
   */
  public magnetoRecommencer(): void {
    if (!this.enregistrementEnCours) return;
    this.magnetoLectureAutoEnCours = false;
    this.partie.ins.restaurationPartieEnCours = false;
    // Reset des sous-états d'édition / divergence.
    this.magnetoDivergence = null;
    this.magnetoDivergenceIntro = null;
    this.magnetoSaisieHorloge = null;
    this.magnetoEdition = 'aucun';
    this.magnetoSaisieCommande = '';
    this.magnetoDernierTest = null;
    this.magnetoIdxEnEdition = null;
    this.magnetoEditionTypeOriginal = null;
    this.magnetoIdxInsertionAvecChoix = null;
    this.magnetoSnapshotsRng.clear();
    this.magnetoIdxReponsesChoix.clear();
    this.magnetoIdx = 0;
    // Conserve le .rec ; bascule en attente pour que le prochain ngOnChanges du parent
    // relance la magnéto via initialiserMagneto.
    this.enregistrementActif = false;
    this.enregistrementEnAttente = true;
    this.enregistrementActions.push({ idx: 0, action: 'recommencé', detail: 'replay rejoué depuis l\'intro' });
    this.nouvellePartieOuAnnulerTour.emit();
  }

  /** Quitte le mode enregistrement (avec confirmation côté template). */
  public magnetoQuitter(): void {
    this.magnetoLectureAutoEnCours = false;
    this.enregistrementActif = false;
    this.partie.ins.restaurationPartieEnCours = false;
    HorlogeUtils.terminerRejeu();
    this.enregistrementEnCours = null;
    this.magnetoDivergence = null;
    this.magnetoSaisieHorloge = null;
    this.magnetoIdxSortieARecalculer.clear();
    this.magnetoIdxRejeuCible = null;
    this.magnetoIdxReponsesChoix.clear();
  }

  /** Télécharge une sauvegarde du .rec à tout moment. */
  public magnetoTelechargerSauvegarde(): void {
    if (!this.enregistrementEnCours) return;
    const contenuJson = JSON.stringify(this.enregistrementEnCours);
    const file = new File([contenuJson], (StringUtils.normaliserMot(this.jeu.titre ? this.jeu.titre : 'partie') + '.rec'), { type: 'text/plain;charset=utf-8' });
    FileSaver.saveAs(file);
  }

  // -- Actions sur divergence ----------------------------------------------

  /** Valide la sortie obtenue comme nouvelle sortie attendue, avance. */
  public magnetoValider(): void {
    if (!this.magnetoDivergence) return;
    const d = this.magnetoDivergence;
    d.etape.sortie = d.sortieObtenue;
    this.enregistrementCompteurs.acceptations++;
    this.enregistrementActions.push({ idx: d.idx, action: 'validé', detail: `« ${d.etape.valeur} » : nouvelle sortie acceptée` });
    this.magnetoDivergence = null;
    this.magnetoIdx = this.avancerJusquAEtapeJouable(d.idx + 1, false);
    if (this.enregistrementEnCours && this.magnetoIdx >= this.enregistrementEnCours.etapes.length) {
      this.afficherRecap();
    }
  }

  /**
   * Supprime du .rec la commande qui vient d'être exécutée (ou la commande divergente).
   * Le moteur du jeu est ramené à l'état précédant cette commande avant le splice.
   */
  public magnetoSupprimerCommande(): void {
    if (!this.enregistrementEnCours) return;
    if (this.magnetoEstSurIntro) return;

    let idxCible: number;
    let valeurEtape: string;

    if (this.magnetoDivergence) {
      const d = this.magnetoDivergence;
      // Une réponse à un choix (r:) ne peut pas être supprimée : retirer un r:
      // laisserait l'interruption choisir/question sans réponse côté replay.
      if (d.etape.type === 'r') return;
      idxCible = d.idx;
      valeurEtape = d.etape.valeur;
      // Pas d'annuler quand la routine n'a jamais été exécutée (routine introuvable) :
      // il n'y a pas de tour à défaire, et `annuler` reculerait la c/r précédente à tort.
      if (!d.routineIntrouvable) {
        this.executerCommandeAffichee('annuler');
      }
      this.magnetoDivergence = null;
    } else {
      idxCible = this.magnetoIdxCommande;
      if (idxCible < 0) return;
      const etape = this.enregistrementEnCours.etapes[idxCible];
      // Idem hors divergence : pas de suppression d'un r: (cf. note ci-dessus).
      if (etape.type === 'r') return;
      valeurEtape = etape.valeur;
      this.executerCommandeAffichee('annuler');
      this.magnetoIdx = idxCible;
    }

    this.enregistrementEnCours.etapes.splice(idxCible, 1);
    this.magnetoSnapshotsRng.clear();
    // Les indices stockés dans magnetoIdxReponsesChoix sont désormais décalés par le splice :
    // on les vide. Les r: à venir seront re-marqués lors de leur prochaine exécution.
    this.magnetoIdxReponsesChoix.clear();
    this.enregistrementCompteurs.retraits++;
    this.enregistrementActions.push({ idx: idxCible, action: 'supprimé', detail: `« ${valeurEtape} »` });
    this.magnetoIdx = this.avancerJusquAEtapeJouable(idxCible, false);
    if (this.magnetoIdx >= this.enregistrementEnCours.etapes.length) {
      this.afficherRecap();
    }
  }

  // -- Modification / Insertion --------------------------------------------

  public magnetoEntrerModification(): void {
    if (!this.enregistrementEnCours) return;
    if (this.magnetoEstSurIntro) return;
    if (this.magnetoEtapeCouranteEstRoutine) return; // modifier non applicable à une routine forcée

    if (this.magnetoDivergence) {
      this.magnetoIdxEnEdition = this.magnetoDivergence.idx;
      this.magnetoEdition = 'modifier';
      this.magnetoEditionTypeOriginal = this.magnetoDivergence.etape.type === 'r' ? 'r' : 'c';
      this.magnetoSaisieCommande = this.magnetoDivergence.etape.valeur;
      this.magnetoDernierTest = null;
      // Annule la commande divergente pour permettre de tester proprement la nouvelle.
      this.executerCommandeAffichee('annuler');
      // Si la divergence porte sur un r:, l'annuler a retiré le TOUR (c + r) → la source
      // du choisir/question n'est plus pendante. Re-jouer la c source pour la ré-établir.
      if (this.magnetoEditionTypeOriginal === 'r') {
        this.rejouerSourceChoisirPourMagneto(this.magnetoDivergence.idx);
      }
      return;
    }

    // Sans divergence : on modifie la commande qui vient d'être exécutée
    // → annuler son exécution et reculer magnetoIdx pour la rejouer.
    const idxCible = this.magnetoIdxCommande;
    if (idxCible < 0) return;
    this.executerCommandeAffichee('annuler');
    this.magnetoIdx = idxCible;
    this.magnetoIdxEnEdition = idxCible;
    const etape = this.enregistrementEnCours.etapes[idxCible];
    this.magnetoEdition = 'modifier';
    this.magnetoEditionTypeOriginal = etape.type === 'r' ? 'r' : 'c';
    this.magnetoSaisieCommande = etape.valeur;
    this.magnetoDernierTest = null;
    // Si l'étape originale est un r:, l'annuler a retiré le TOUR (c + r). Re-jouer la
    // c source pour ré-établir le choisir / la question avant l'application de la
    // nouvelle réponse via executerReponseChoix.
    if (etape.type === 'r') {
      this.rejouerSourceChoisirPourMagneto(idxCible);
    }
  }

  /**
   * Quand on modifie ou teste un `r:` lié à une action (choisir personnalisé OU
   * désambiguïsation auto via questionCommande), l'`annuler` envoyé pour rembobiner
   * retire le TOUR entier (c + r). La nouvelle réponse ne peut plus être appliquée
   * car l'interruption n'est plus pendante. Cette méthode parcourt les étapes en
   * amont du r: pour retrouver la c source et la re-exécute (ce qui repose
   * l'interruption attendue). Pour un r: lié uniquement à l'intro (aucune c source
   * en amont), ne fait rien : c'est au cycle de vie de re-poser le choisir d'intro.
   */
  private rejouerSourceChoisirPourMagneto(idxR: number): void {
    if (!this.enregistrementEnCours) return;
    for (let i = idxR - 1; i >= 0; i--) {
      const e = this.enregistrementEnCours.etapes[i];
      if (e.type === 'c') {
        this.executerCommandeAffichee(e.valeur);
        return;
      }
      if (e.type === 'r') return; // r: d'intro en amont — l'intro re-pose son propre choisir
    }
  }

  /**
   * Entre en mode insertion.
   * - En divergence : insère après l'étape divergente (paramètre ignoré).
   * - Sans divergence : `position='avant'` annule la commande exécutée et insère juste avant ;
   *   `position='apres'` insère juste après la commande exécutée (sans annulation).
   */
  public magnetoEntrerInsertion(position: 'avant' | 'apres' = 'avant'): void {
    if (this.magnetoEtapeCouranteEstRoutine) return; // insérer non applicable autour d'une routine forcée
    if (!this.enregistrementEnCours) return;
    if (this.magnetoEstSurIntro) return;

    if (this.magnetoDivergence) {
      this.magnetoIdxEnEdition = this.magnetoDivergence.idx;
      this.magnetoEdition = 'inserer';
      this.magnetoSaisieCommande = '';
      this.magnetoDernierTest = null;
      return;
    }

    const idxCible = this.magnetoIdxCommande;
    if (idxCible < 0) return;
    if (position === 'avant') {
      // Reculer pour insérer avant la commande qui vient d'être jouée.
      this.executerCommandeAffichee('annuler');
      this.magnetoIdx = idxCible;
    }
    // En 'apres' : magnetoIdx pointe déjà après la commande exécutée → splice à magnetoIdx.
    this.magnetoIdxEnEdition = idxCible;
    this.magnetoEdition = 'inserer';
    this.magnetoSaisieCommande = '';
    this.magnetoDernierTest = null;
  }

  /** Exécute la commande saisie pour voir le résultat sans valider. */
  public magnetoTesterSaisie(): void {
    if (!this.magnetoSaisieCommande.trim()) return;
    // Si on a déjà testé, annuler l'exécution précédente avant de re-tester.
    if (this.magnetoDernierTest) {
      this.executerCommandeAffichee('annuler');
    }
    // Restaurer le PRNG dans l'état pré-étape pour que le tirage aléatoire de la
    // commande testée soit déterministe (annuler regénère la graine en mode jeu normal).
    // EXCEPTION : en mode 'inserer-reponse', le c: a déjà été joué live et l'interruption
    // de choix est toujours pendante ; pas de snapshot pré-c: à restaurer.
    if (this.magnetoIdxEnEdition !== null && this.magnetoEdition !== 'inserer-reponse') {
      this.restaurerSnapshotRng(this.magnetoIdxEnEdition);
    }
    const cmd = this.magnetoSaisieCommande.trim();
    // Repartir d'une bande d'horloge vide : les lectures de cette commande (testée à l'instant,
    // donc en heure réelle) sont capturées pour être inscrites dans l'étape à la validation.
    HorlogeUtils.chargerRejeuEtape(null);
    const sortie = (this.magnetoEditionTypeOriginal === 'r' || this.magnetoEdition === 'inserer-reponse')
      ? this.executerReponseChoix(cmd)
      : this.executerCommandeAffichee(cmd);
    this.magnetoDernierTest = { commande: cmd, sortie, horloge: HorlogeUtils.lecturesUtiliseesEtape() };
  }

  /** Valide la saisie (modifier/inserer/inserer-reponse) : applique au .rec en mémoire. */
  public magnetoValiderSaisie(): void {
    if (!this.magnetoSaisieCommande.trim() || !this.enregistrementEnCours) return;
    const cmd = this.magnetoSaisieCommande.trim();
    const etaitEnModification = this.magnetoEdition === 'modifier';
    const etaitEnInsererReponse = this.magnetoEdition === 'inserer-reponse';

    // Garantir que la nouvelle commande est exécutée. Si on a déjà testé cette commande, on garde
    // l'exécution — SAUF en insertion : on ré-exécute pour autoriser la programmation des routines
    // (le flag de replay est levé le temps de l'exécution de la commande insérée).
    let sortieNouvelle: string;
    let horlogeNouvelle: number[];
    if (this.magnetoDernierTest?.commande === cmd && this.magnetoEdition !== 'inserer') {
      sortieNouvelle = this.magnetoDernierTest.sortie;
      horlogeNouvelle = this.magnetoDernierTest.horloge;
    } else {
      // Pas testée (ou autre commande testée puis non annulée) : annuler éventuel test précédent et exécuter celle-ci.
      if (this.magnetoDernierTest) {
        this.executerCommandeAffichee('annuler');
      }
      // En mode 'inserer-reponse', le c: a déjà été joué live (la pile choisir est encore
      // pendante). Pas de snapshot pré-c: à restaurer. Pour les autres modes, restaurer le PRNG
      // dans l'état pré-étape avant l'exécution (idem que Tester).
      if (!etaitEnInsererReponse && this.magnetoIdxEnEdition !== null) {
        this.restaurerSnapshotRng(this.magnetoIdxEnEdition);
      }
      // Bande d'horloge vide : capturer les lectures (en heure réelle) de la nouvelle commande.
      HorlogeUtils.chargerRejeuEtape(null);
      // Insertion : la commande est nouvelle (« live ») et peut programmer une routine ; on lève le
      // flag de replay le temps de son exécution pour que `programmerRoutine` ne la saute pas. Les
      // routines ainsi programmées sont ensuite forcées immédiatement (cf. magnetoForcerRoutinesProgrammees).
      const flagReplay = this.partie.ins.restaurationPartieEnCours;
      if (this.magnetoEdition === 'inserer') this.partie.ins.restaurationPartieEnCours = false;
      sortieNouvelle = (this.magnetoEditionTypeOriginal === 'r' || etaitEnInsererReponse)
        ? this.executerReponseChoix(cmd)
        : this.executerCommandeAffichee(cmd);
      this.partie.ins.restaurationPartieEnCours = flagReplay;
      horlogeNouvelle = HorlogeUtils.lecturesUtiliseesEtape();
    }

    // Fabrique d'étape : attache les lectures d'horloge capturées (si la commande lit l'heure),
    // afin que l'heure soit sauvegardée à côté de la nouvelle commande et rejouable.
    const construireEtape = (type: 'c' | 'r', valeur: string): EtapeEnregistrement =>
      horlogeNouvelle.length
        ? { type, valeur, sortie: sortieNouvelle, horloge: horlogeNouvelle.slice() }
        : { type, valeur, sortie: sortieNouvelle };
    // Index de l'étape nouvellement créée/modifiée (pour proposer la saisie d'heure ensuite).
    let idxNouvelleEtape: number | null = null;

    // Branche 2e passe : on commit le r: associé à l'insertion c: précédente.
    if (etaitEnInsererReponse) {
      const idxC = this.magnetoIdxInsertionAvecChoix!;
      const idxR = idxC + 1;
      this.enregistrementEnCours.etapes.splice(idxR, 0, construireEtape('r', cmd));
      this.enregistrementCompteurs.ajouts++;
      this.enregistrementActions.push({ idx: idxR, action: 'inséré r:', detail: `« ${cmd} »` });
      this.magnetoIdx = this.avancerJusquAEtapeJouable(idxR + 1, false);
      this.magnetoSnapshotsRng.clear();
      this.magnetoIdxReponsesChoix.clear();
      this.magnetoEdition = 'aucun';
      this.magnetoSaisieCommande = '';
      this.magnetoDernierTest = null;
      this.magnetoIdxEnEdition = null;
      this.magnetoEditionTypeOriginal = null;
      this.magnetoIdxInsertionAvecChoix = null;
      if (this.magnetoIdx >= this.enregistrementEnCours.etapes.length) {
        this.afficherRecap();
      }
      return;
    }

    if (this.magnetoDivergence) {
      const d = this.magnetoDivergence;
      this.magnetoSnapshotsRng.clear();
      // Splice/modification mute des indices : on vide la trace des r: déjà replayés
      // pour qu'elle soit re-remplie lors du prochain Pas suivant.
      this.magnetoIdxReponsesChoix.clear();
      if (this.magnetoEdition === 'modifier') {
        const typeNouvelle: 'c' | 'r' = this.magnetoEditionTypeOriginal === 'r' ? 'r' : 'c';
        this.enregistrementEnCours.etapes[d.idx] = construireEtape(typeNouvelle, cmd);
        idxNouvelleEtape = d.idx;
        this.enregistrementCompteurs.modifications++;
        this.enregistrementActions.push({ idx: d.idx, action: 'modifié', detail: `« ${d.etape.valeur} » → « ${cmd} »` });
        this.magnetoIdx = this.avancerJusquAEtapeJouable(d.idx + 1, false);
      } else if (this.magnetoEdition === 'inserer') {
        // L'étape divergente est acceptée (sortie obtenue devient attendue), la nouvelle est insérée après.
        d.etape.sortie = d.sortieObtenue;
        this.enregistrementEnCours.etapes.splice(d.idx + 1, 0, construireEtape('c', cmd));
        idxNouvelleEtape = d.idx + 1;
        this.enregistrementCompteurs.ajouts++;
        this.enregistrementActions.push({ idx: d.idx + 1, action: 'inséré après', detail: `« ${cmd} »` });
        // Forcer les routines programmées par la commande insérée (étapes 'd' juste après).
        const nbD = this.magnetoForcerRoutinesProgrammees(d.idx + 2);
        this.magnetoIdx = this.avancerJusquAEtapeJouable(d.idx + 2 + nbD, false);
      }
      this.magnetoDivergence = null;
    } else {
      // Pas de divergence : on opère sur l'étape à venir (magnetoIdx).
      const idx = this.magnetoIdx;
      this.magnetoSnapshotsRng.clear();
      this.magnetoIdxReponsesChoix.clear();
      if (this.magnetoEdition === 'modifier') {
        const ancienne = this.enregistrementEnCours.etapes[idx];
        const typeNouvelle: 'c' | 'r' = this.magnetoEditionTypeOriginal === 'r' ? 'r' : 'c';
        this.enregistrementEnCours.etapes[idx] = construireEtape(typeNouvelle, cmd);
        idxNouvelleEtape = idx;
        this.enregistrementCompteurs.modifications++;
        this.enregistrementActions.push({ idx, action: 'modifié', detail: `« ${ancienne.valeur} » → « ${cmd} »` });
        this.magnetoIdx = this.avancerJusquAEtapeJouable(idx + 1, false);
      } else if (this.magnetoEdition === 'inserer') {
        // Insère AVANT l'étape courante ; l'étape originale est repoussée à idx+1.
        this.enregistrementEnCours.etapes.splice(idx, 0, construireEtape('c', cmd));
        idxNouvelleEtape = idx;
        this.enregistrementCompteurs.ajouts++;
        this.enregistrementActions.push({ idx, action: 'inséré avant', detail: `« ${cmd} »` });
        // Avance d'un cran : la nouvelle commande a déjà été jouée, l'étape originale est à idx+1.
        this.magnetoIdx = this.avancerJusquAEtapeJouable(idx + 1, false);

        // Si le c: inséré a laissé pendante une interruption de choix → 2e passe automatique :
        // on garde le panneau de saisie ouvert pour que l'utilisateur saisisse la réponse,
        // qui sera enregistrée comme r: juste après le c:. (Scope v1 : non-divergence seulement.)
        if (this.magnetoChoixPendantApresInsertion) {
          this.magnetoIdxInsertionAvecChoix = idx;
          this.magnetoEdition = 'inserer-reponse';
          this.magnetoEditionTypeOriginal = 'r';
          this.magnetoSaisieCommande = '';
          this.magnetoDernierTest = null;
          this.magnetoIdxEnEdition = idx;
          // Pas de reset à 'aucun' — on reste dans le sous-panneau saisie.
          return;
        }

        // Forcer les routines programmées par la commande insérée (étapes 'd' juste après).
        const nbD = this.magnetoForcerRoutinesProgrammees(idx + 1);
        if (nbD) this.magnetoIdx = this.avancerJusquAEtapeJouable(idx + 1 + nbD, false);
      }
    }

    this.magnetoEdition = 'aucun';
    this.magnetoSaisieCommande = '';
    this.magnetoDernierTest = null;
    this.magnetoIdxEnEdition = null;
    this.magnetoEditionTypeOriginal = null;

    // La nouvelle commande lit l'horloge : ses lectures (capturées en heure réelle) sont déjà
    // inscrites dans l'étape ; on propose à l'auteur de fixer/ajuster l'heure à rejouer.
    if (idxNouvelleEtape !== null && horlogeNouvelle.length) {
      this.magnetoSaisieHorloge = {
        idx: idxNouvelleEtape,
        inputs: horlogeNouvelle.map(ts => this.horlogeVersInput(ts)),
      };
      return; // pause sur la saisie ; recap/Pas suivant reprendront après validation
    }

    if (this.magnetoIdx >= this.enregistrementEnCours.etapes.length) {
      this.afficherRecap();
    } else if (etaitEnModification) {
      // Valider une modification équivaut à enchaîner avec « Suivant ».
      this.magnetoPasSuivant();
    }
  }

  /** Vide la saisie, annule un test éventuel, retour mode saisie pour retaper. */
  public magnetoReessayerSaisie(): void {
    if (this.magnetoDernierTest) {
      this.executerCommandeAffichee('annuler');
      this.magnetoDernierTest = null;
    }
    this.magnetoSaisieCommande = '';
  }

  /** Annule la modification/insertion en cours : restaure l'état pré-édition. */
  public magnetoAnnulerSaisie(): void {
    if (this.magnetoDernierTest) {
      this.executerCommandeAffichee('annuler');
      this.magnetoDernierTest = null;
    }
    // Mode 'inserer-reponse' : cascade rollback. Le c: a déjà été splicé dans le .rec
    // au passage précédent, et l'interruption de choix est encore pendante. On consomme
    // l'interruption en cours (sentinel) pour pouvoir envoyer 'annuler' et défaire le c:
    // côté moteur ; puis on retire le c: du .rec pour que l'utilisateur revienne à
    // l'état pré-insertion (option B du plan).
    if (this.magnetoEdition === 'inserer-reponse' && this.enregistrementEnCours && this.magnetoIdxInsertionAvecChoix !== null) {
      // Consommer l'interruption pendante (si elle l'est encore) pour ne pas bloquer 'annuler'.
      if (this.interruptionEnCours) {
        this.terminerInterruptionsBloquantesPourMagneto();
        if (this.interruptionEnCours) {
          // Pour attendreChoix/Libre/questionCommande, le helper ci-dessus ne consomme rien.
          // Forcer la fin via terminerInterruption(undefined) (sentinel).
          this.terminerInterruption(undefined);
        }
      }
      this.executerCommandeAffichee('annuler');
      // Retirer le c: orphelin du .rec.
      const idxC = this.magnetoIdxInsertionAvecChoix;
      const etapeC = this.enregistrementEnCours.etapes[idxC];
      this.enregistrementEnCours.etapes.splice(idxC, 1);
      if (this.enregistrementCompteurs.ajouts > 0) this.enregistrementCompteurs.ajouts--;
      this.enregistrementActions.push({ idx: idxC, action: 'annulé', detail: `insertion c+r annulée (${etapeC?.valeur ?? ''})` });
      this.magnetoIdx = this.avancerJusquAEtapeJouable(idxC, false);
      this.magnetoSnapshotsRng.clear();
      this.magnetoIdxReponsesChoix.clear();
      this.magnetoEdition = 'aucun';
      this.magnetoSaisieCommande = '';
      this.magnetoIdxEnEdition = null;
      this.magnetoEditionTypeOriginal = null;
      this.magnetoIdxInsertionAvecChoix = null;
      return;
    }
    // Si on était en mode 'modifier', la commande divergente avait été annulée à l'entrée
    // → la rejouer pour restaurer l'état pré-saisie (avec la divergence affichée).
    if (this.magnetoEdition === 'modifier' && this.magnetoDivergence) {
      // Restaurer le PRNG pour que la sortie obtenue soit identique à celle observée à l'origine.
      this.restaurerSnapshotRng(this.magnetoDivergence.idx);
      const sortie = this.executerCommandeAffichee(this.magnetoDivergence.etape.valeur);
      this.magnetoDivergence.sortieObtenue = sortie;
      const diff = LecteurComponent.calculerDiffSorties(this.magnetoDivergence.etape.sortie ?? '', sortie);
      this.magnetoDivergence.diffAttendu = diff.gauche;
      this.magnetoDivergence.diffObtenue = diff.droite;
    } else if (!this.magnetoDivergence && this.enregistrementEnCours && this.magnetoIdxEnEdition !== null
               && (this.magnetoEdition === 'modifier' || this.magnetoEdition === 'inserer')
               && this.magnetoIdx === this.magnetoIdxEnEdition) {
      // Non-divergence, modify ou inserer 'avant' : on avait annulé la commande d'origine à l'entrée.
      // Rejouer pour rétablir l'état post-exécution.
      const etape = this.enregistrementEnCours.etapes[this.magnetoIdxEnEdition];
      if (etape && (etape.type === 'c' || etape.type === 'r')) {
        // Restaurer le PRNG pour que la re-exécution produise la même sortie que l'originale.
        this.restaurerSnapshotRng(this.magnetoIdxEnEdition);
        this.executerCommandeAffichee(etape.valeur);
        this.magnetoIdx = this.avancerJusquAEtapeJouable(this.magnetoIdxEnEdition + 1, false);
      }
    }
    this.magnetoEdition = 'aucun';
    this.magnetoSaisieCommande = '';
    this.magnetoIdxEnEdition = null;
    this.magnetoEditionTypeOriginal = null;
  }

  // -- Helpers compteur 1/X (sur c+r uniquement) ---------------------------

  /** Idx (dans etapes) de l'étape qui vient d'être exécutée (c/r/d), -1 si intro/néant. */
  public get magnetoIdxCommande(): number {
    if (!this.enregistrementEnCours) return -1;
    if (this.magnetoDivergenceIntro) return -1;
    if (this.magnetoDivergence) return this.magnetoDivergence.idx;
    // En édition (modifier ou inserer) : le focus reste sur l'étape ciblée.
    if (this.magnetoEdition !== 'aucun' && this.magnetoIdxEnEdition !== null) return this.magnetoIdxEnEdition;
    const etapes = this.enregistrementEnCours.etapes;
    let last = -1;
    for (let i = 0; i < etapes.length && i < this.magnetoIdx; i++) {
      const t = etapes[i].type;
      if (t === 'c' || t === 'r' || t === 'd') last = i;
    }
    return last;
  }

  /** Vrai quand le curseur est sur l'intro (avant toute commande jouée, ou divergence d'intro). */
  public get magnetoEstSurIntro(): boolean {
    return this.magnetoIdxCommande === -1;
  }

  /** Vrai quand le c: qu'on vient d'insérer a laissé pendante une interruption de choix
   *  (attendreChoix / attendreChoixLibre / questionCommande). Utilisé par `magnetoValiderSaisie`
   *  pour déclencher automatiquement le sous-mode 'inserer-reponse'. */
  public get magnetoChoixPendantApresInsertion(): boolean {
    const t = this.interruptionEnCours?.typeInterruption;
    return t === TypeInterruption.attendreChoix
        || t === TypeInterruption.attendreChoixLibre
        || t === TypeInterruption.questionCommande;
  }

  /** Liste des choix disponibles pour le sous-panneau « Réponse au choix » (mode 'inserer-reponse').
   *  Renvoie tableau vide pour `attendreChoixLibre` (saisie libre) ou hors mode choix. */
  public get magnetoListeChoixPendants(): { id: string, libelle: string }[] {
    const interr = this.interruptionEnCours;
    if (!interr) return [];
    if (interr.typeInterruption === TypeInterruption.attendreChoix && interr.choix?.length) {
      const nbChoix = interr.choix.length;
      const identifiants = this.partie.jeu.parametres.activerChoixNumeriques
        ? Array.from({ length: nbChoix }, (_, i) => String(i + 1))
        : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      return interr.choix.map((c, i) => ({ id: identifiants[i] ?? String(i + 1), libelle: c.valeurs[0]?.toString() ?? '' }));
    }
    if (interr.typeInterruption === TypeInterruption.questionCommande && interr.derniereQuestion?.Choix?.length) {
      return interr.derniereQuestion.Choix.map((c, i) => ({ id: String(i + 1), libelle: c.valeurs[0]?.toString() ?? '' }));
    }
    return [];
  }

  /** Vrai quand l'étape courante est une routine forcée ('d') : modifier/insérer non applicables. */
  public get magnetoEtapeCouranteEstRoutine(): boolean {
    if (!this.enregistrementEnCours) return false;
    const idx = this.magnetoIdxCommande;
    if (idx < 0) return false;
    return this.enregistrementEnCours.etapes[idx]?.type === 'd';
  }

  /** Vrai quand l'étape courante est une réponse à un `choisir` (statique ou libre). Sert
   *  à interdire l'insertion AVANT (séparerait c qui pose le choisir, et r qui y répond)
   *  et à libeller le panneau d'édition « Nouveau choix ». La modification d'un r: lié à
   *  un choisir est désormais supportée (re-jeu de la c source via rejouerSourceChoisirPourMagneto). */
  public get magnetoEtapeCouranteEstChoix(): boolean {
    if (!this.enregistrementEnCours) return false;
    const idx = this.magnetoIdxCommande;
    if (idx < 0) return false;
    // On ne peut pas se fier à `interruptionEnCours` ici : la résolution du choix
    // l'a déjà clear. On consulte la trace remplie au moment de l'exécution.
    return this.magnetoIdxReponsesChoix.has(idx);
  }

  /** Vrai quand insérer "Avant" la position courante séparerait l'entité (c qui
   *  déclenche un choisir, r qui y répond) : interdit dès que le curseur est posé
   *  sur le r issu d'un choisir. */
  public get magnetoInsererAvantInterdit(): boolean {
    return this.magnetoEtapeCouranteEstChoix;
  }

  /** Vrai quand insérer "Après" la position courante séparerait l'entité (c, r) d'un
   *  choisir : le c/d qu'on vient de jouer a posé une interruption choisir, le r
   *  n'a pas encore été consommé → toute insertion ici tomberait entre les deux. */
  public get magnetoInsererApresInterdit(): boolean {
    const t = this.interruptionEnCours?.typeInterruption;
    return t === TypeInterruption.attendreChoix
        || t === TypeInterruption.attendreChoixLibre;
  }

  /** Vrai quand l'étape courante est une réponse à un choix ('r') : libellé « Choix » et non « Commande ». */
  public get magnetoEtapeCouranteEstReponse(): boolean {
    if (!this.enregistrementEnCours) return false;
    const idx = this.magnetoIdxCommande;
    if (idx < 0) return false;
    return this.enregistrementEnCours.etapes[idx]?.type === 'r';
  }

  public get magnetoCompteurTotal(): number {
    if (!this.enregistrementEnCours) return 0;
    return this.enregistrementEnCours.etapes.filter(e => e.type === 'c' || e.type === 'r').length;
  }

  public get magnetoCompteurCourant(): number {
    if (!this.enregistrementEnCours) return 0;
    let n = 0;
    for (let i = 0; i <= this.magnetoIdx && i < this.enregistrementEnCours.etapes.length; i++) {
      const e = this.enregistrementEnCours.etapes[i];
      if (e.type === 'c' || e.type === 'r') n++;
    }
    return n;
  }

  /**
   * Mini-liste des étapes autour du curseur (3 avant / courante / 3 après, comptés sur c/r),
   * précédée de l'entrée virtuelle « intro » (#1) quand la fenêtre touche le début.
   * Les déclenchements 'd' intercalés dans la fenêtre sont également affichés (non numérotés) ;
   * les graines 'g' sont ignorées.
   * Le statut « courant » désigne la dernière étape c/r exécutée (ou en divergence).
   */
  public get magnetoMiniListe(): { idx: number, etape: EtapeEnregistrement | null, commande: string, statut: 'passe' | 'courant' | 'futur', estIntro: boolean, estDeclenchement: boolean, estReponse: boolean, estDivergent: boolean, enEdition: boolean, num: number | null }[] {
    if (!this.enregistrementEnCours) return [];
    const etapes = this.enregistrementEnCours.etapes;
    const idxDivergence = this.magnetoDivergence?.idx ?? -1;
    // stepIdx : positions des étapes navigables (c, r, d). Sert d'ancrage de la fenêtre.
    // crIdx : sous-ensemble c/r — sert uniquement à numéroter les commandes joueur.
    const stepIdx: number[] = [];
    const crIdx: number[] = [];
    for (let i = 0; i < etapes.length; i++) {
      const t = etapes[i].type;
      if (t === 'c' || t === 'r') { stepIdx.push(i); crIdx.push(i); }
      else if (t === 'd') { stepIdx.push(i); }
    }
    const idxCommandeReel = this.magnetoIdxCommande;
    let idxCourantDansStep: number;
    let introCourante = false;
    if (idxCommandeReel < 0) {
      introCourante = true;
      idxCourantDansStep = -1;
    } else {
      idxCourantDansStep = stepIdx.indexOf(idxCommandeReel);
      if (idxCourantDansStep === -1) idxCourantDansStep = stepIdx.length - 1;
    }
    const ancre = idxCourantDansStep;
    // Fenêtre adaptive : ~9 entrées visibles. Si on est près d'un bord, on décale plutôt que
    // de tronquer, pour garder une mini-liste de taille à peu près constante (pas de vide).
    const TAILLE_FENETRE = 9;
    let debut = ancre - Math.floor((TAILLE_FENETRE - 1) / 2);
    let fin = ancre + Math.ceil((TAILLE_FENETRE - 1) / 2);
    if (debut < 0) { fin += -debut; debut = 0; }
    if (fin > stepIdx.length - 1) { debut -= (fin - (stepIdx.length - 1)); fin = stepIdx.length - 1; }
    debut = Math.max(0, debut);
    fin = Math.min(stepIdx.length - 1, fin);
    const result: { idx: number, etape: EtapeEnregistrement | null, commande: string, statut: 'passe' | 'courant' | 'futur', estIntro: boolean, estDeclenchement: boolean, estReponse: boolean, estDivergent: boolean, enEdition: boolean, num: number | null }[] = [];
    if (debut === 0) {
      const statut: 'passe' | 'courant' = introCourante ? 'courant' : 'passe';
      result.push({ idx: -1, etape: null, commande: 'intro', statut, estIntro: true, estDeclenchement: false, estReponse: false, estDivergent: false, enEdition: false, num: 1 });
    }
    // Étend la plage réelle pour inclure les 'g' intercalés ; on les ignore au rendu (non pertinents pour le joueur).
    const realStart = (debut === 0) ? 0 : stepIdx[debut];
    const realEnd = (fin === stepIdx.length - 1) ? etapes.length - 1 : stepIdx[fin + 1] - 1;
    for (let realIdx = realStart; realIdx <= realEnd; realIdx++) {
      const e = etapes[realIdx];
      if (e.type === 'g') continue;
      const iStep = stepIdx.indexOf(realIdx);
      const statut: 'passe' | 'courant' | 'futur' =
        iStep === idxCourantDansStep ? 'courant' : (iStep < idxCourantDansStep ? 'passe' : 'futur');
      if (e.type === 'c' || e.type === 'r') {
        const iCr = crIdx.indexOf(realIdx);
        const enEdition = this.magnetoEdition === 'modifier' && this.magnetoIdxEnEdition === realIdx;
        const commande = (enEdition && this.magnetoDernierTest) ? this.magnetoDernierTest.commande : e.valeur;
        result.push({ idx: realIdx, etape: e, commande, statut, estIntro: false, estDeclenchement: false, estReponse: e.type === 'r', estDivergent: realIdx === idxDivergence, enEdition, num: iCr + 2 });
      } else if (e.type === 'd') {
        result.push({ idx: realIdx, etape: e, commande: e.valeur, statut, estIntro: false, estDeclenchement: true, estReponse: false, estDivergent: realIdx === idxDivergence, enEdition: false, num: null });
      }
    }
    return result;
  }

  /**
   * Marque le replay comme terminé. On NE désactive PAS le mode enregistrement et on
   * n'ouvre PAS de modale : l'utilisateur doit pouvoir voir la sortie de la dernière
   * étape, et peut encore Insérer/Modifier/Supprimer/Télécharger via la toolbar. Pour
   * quitter le mode, il clique sur Quitter (croix en bout de toolbar).
   * (Avant : ouverture d'une modale popup qui masquait la sortie de jeu — le user
   * devait refermer la modale pour voir le résultat de la dernière étape.)
   */
  private afficherRecap(): void {
    this.partie.ins.restaurationPartieEnCours = false;
    HorlogeUtils.terminerRejeu();
  }

  /**
   * Exécute une étape c/r du fichier .rec et retourne la sortie textuelle produite.
   * Passe par le flux normal du lecteur (envoyerCommande) afin que :
   *   - l'écran de jeu soit mis à jour (affichage commande + sortie) ;
   *   - les abréviations soient développées comme pour une saisie utilisateur ;
   *   - l'historique de la partie reste cohérent.
   * La sortie est récupérée via ContextePartie.derniereSortieEnregistree, alimentée
   * par les hooks de capture dans envoyerCommande et terminerInterruption.
   */
  private executerEtapeEnregistrement(etape: EtapeEnregistrement): string {
    this.partie.reinitialiserDerniereSortieEnregistree();
    // Charger les lectures d'horloge de cette étape (rejeu déterministe) avant exécution.
    HorlogeUtils.chargerRejeuEtape(etape.horloge ?? null);
    // Une étape 'r' avec une interruption attendreChoix / attendreChoixLibre pendante
    // est une RÉPONSE au choisir, pas une commande. La router via le handler de choix
    // (qui pousse r:* dans la sauvegarde et résout l'interruption) au lieu de
    // envoyerCommande (qui exécuterait 'a' comme la commande `aller`).
    if (etape.type === 'r' && this.interruptionEnCours) {
      const t = this.interruptionEnCours.typeInterruption;
      if (t === TypeInterruption.attendreChoix) {
        this.magnetoIdxReponsesChoix.add(this.magnetoIdx);
        this.commande = etape.valeur;
        this.traiterChoixStatiqueJoueur();
        this.terminerInterruptionsBloquantesPourMagneto();
        return this.partie.derniereSortieEnregistree ?? '';
      }
      if (t === TypeInterruption.attendreChoixLibre) {
        this.magnetoIdxReponsesChoix.add(this.magnetoIdx);
        this.commande = etape.valeur;
        this.traiterChoixLibreJoueur();
        this.terminerInterruptionsBloquantesPourMagneto();
        return this.partie.derniereSortieEnregistree ?? '';
      }
      if (t === TypeInterruption.questionCommande) {
        // Désambiguïsation (ex. « prendre chaise » avec 2 chaises) : la réponse est
        // un numéro de choix. Router via le même handler que onKeyDownEnter, qui
        // pousse r:* dans la sauvegarde et termine l'interruption (re-jouant la
        // commande corrigée), au lieu de l'exécuter comme commande de jeu.
        this.commande = etape.valeur;
        this.resoudreQuestionCommandePourMagneto();
        this.terminerInterruptionsBloquantesPourMagneto();
        return this.partie.derniereSortieEnregistree ?? '';
      }
    }
    const commandeComplete = Abreviations.obtenirCommandeComplete(etape.valeur, this.jeu.abreviations, this.jeu.lieux, this.jeu.objets);
    const commandeNettoyee = CommandesUtils.nettoyerCommande(commandeComplete);
    this.envoyerCommande(etape.valeur, commandeNettoyee, true, true, true, false);
    // En magnéto, on auto-presse à travers les `attendre touche` / `attendre N secondes` afin
    // que la sortie complète de la commande (incluant les suites post-pause) soit capturée.
    this.terminerInterruptionsBloquantesPourMagneto();
    return this.partie.derniereSortieEnregistree ?? '';
  }

  /**
   * Tant qu'une interruption « attendre touche / secondes » bloque le tour courant, la
   * terminer immédiatement pour capturer la suite de la sortie. Garde-fou contre les
   * chaînes infinies (limite à 100 itérations).
   */
  private terminerInterruptionsBloquantesPourMagneto(): void {
    let safety = 100;
    while (this.interruptionEnCours && safety-- > 0) {
      const t = this.interruptionEnCours.typeInterruption;
      if (t !== TypeInterruption.attendreTouche && t !== TypeInterruption.attendreSecondes) break;
      this.terminerInterruption(undefined);
    }
  }

  /**
   * Exécute une RÉPONSE à un choisir/choisir libre en cours, via le handler de choix
   * (et non envoyerCommande qui traiterait la valeur comme une commande de jeu).
   * Retourne la sortie brute capturée pendant la résolution du choisir.
   */
  private executerReponseChoix(reponse: string): string {
    this.partie.reinitialiserDerniereSortieEnregistree();
    this.commande = reponse;
    const t = this.interruptionEnCours?.typeInterruption;
    if (t === TypeInterruption.attendreChoix) {
      this.traiterChoixStatiqueJoueur();
    } else if (t === TypeInterruption.attendreChoixLibre) {
      this.traiterChoixLibreJoueur();
    } else if (t === TypeInterruption.questionCommande) {
      this.resoudreQuestionCommandePourMagneto();
    } else {
      // Pas de choisir pendant : on n'a rien à faire (le handler tomberait dans l'erreur
      // "Veuillez entrer la lettre correspondant à votre choix" qui n'a pas de sens en édition).
      this.ajouterConseil("Le choisir attendu n'est plus pendant — la réponse n'a pas pu être appliquée.");
    }
    this.terminerInterruptionsBloquantesPourMagneto();
    return this.partie.derniereSortieEnregistree ?? '';
  }

  /**
   * Réplique le handler `questionCommande` de `onKeyDownEnter` pour le contexte magnéto :
   * lit `this.commande` (numéro de choix attendu), valide contre la liste de choix de la
   * question, fixe `Reponse` et termine l'interruption (ce qui re-joue la commande
   * corrigée et pousse r:* dans la sauvegarde via `terminerInterruption`).
   */
  private resoudreQuestionCommandePourMagneto(): void {
    if (!this.interruptionEnCours || this.interruptionEnCours.typeInterruption !== TypeInterruption.questionCommande) return;
    if (!this.commande) this.commande = "1";
    const number = Number.parseInt(this.commande);
    const choix = this.interruptionEnCours.derniereQuestion?.Choix;
    if (number && choix && (number - 1) < choix.length) {
      this.interruptionEnCours.derniereQuestion.Reponse = (number - 1);
      this.terminerInterruption(undefined);
    } else {
      this.ajouterConseil(`Numéro de choix invalide pour la désambiguïsation : « ${this.commande} ».`);
    }
  }

  /** Exécute une commande dans le flux normal du lecteur et retourne sa sortie brute. */
  private executerCommandeAffichee(commandeBrute: string): string {
    this.partie.reinitialiserDerniereSortieEnregistree();
    const commandeComplete = Abreviations.obtenirCommandeComplete(commandeBrute, this.jeu.abreviations, this.jeu.lieux, this.jeu.objets);
    const commandeNettoyee = CommandesUtils.nettoyerCommande(commandeComplete);
    this.envoyerCommande(commandeBrute, commandeNettoyee, true, true, true, false);
    return this.partie.derniereSortieEnregistree ?? '';
  }

  // Handlers UI du récap

  public recapTelecharger() {
    if (!this.enregistrementEnCours) return;
    const contenuJson = JSON.stringify(this.enregistrementEnCours);
    const file = new File([contenuJson], (StringUtils.normaliserMot(this.jeu.titre ? this.jeu.titre : 'partie') + '.rec'), { type: 'text/plain;charset=utf-8' });
    FileSaver.saveAs(file);
    this.recapAffiche = false;
  }

  public recapFermer() {
    this.recapAffiche = false;
  }

  /** Ré-ouvre le mode enregistrement depuis le récap et recule d'une étape. */
  public recapReculer(): void {
    if (!this.enregistrementEnCours) return;
    this.recapAffiche = false;
    this.enregistrementActif = true;
    this.partie.ins.restaurationPartieEnCours = true;
    this.magnetoPrecedent();
  }

  /**
   * Actions affichées dans le récap : on masque les marches arrière, qui sont
   * de la navigation et non des modifications du fichier .rec.
   */
  public get recapActionsAffichables(): { idx: number, action: string, detail: string }[] {
    return this.enregistrementActions.filter(a => a.action !== 'reculé');
  }

  private genererFichierEnregistrement(): void {
    // enlever la dernière commande, qui est « générer enregistrement »
    this.partie.enleverCommandeGenererSolution();
    let texteIgnore: string;
    if (this.partie.etapesPartie.length > 0) {
      texteIgnore = this.partie.ecran.ajouterParagrapheHtml('<i>Enregistrement généré. Rechargez le <b>.rec</b> à tout moment pour vérifier que les sorties du jeu correspondent toujours.</i>');

      const fichierEnregistrement = this.partie.creerFichierEnregistrement();
      const contenuJson = JSON.stringify(fichierEnregistrement);
      const file = new File([contenuJson], (StringUtils.normaliserMot(this.jeu.titre ? this.jeu.titre : "partie") + ".rec"), { type: "text/plain;charset=utf-8" });
      FileSaver.saveAs(file);

    } else {
      texteIgnore = this.partie.ecran.ajouterContenuDonjon('{n}Aucune commande dans l’historique, il n’y a rien à mettre dans l’enregistrement.');
    }
    this.ajouterTexteAIgnorerAuxStatistiques(texteIgnore);
  }

  /** Tabulation: continuer le mot */
  onKeyDownTab(event) {
    if (!this.resteDeLaSortie?.length) {
      const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande, this.jeu.abreviations, this.jeu.lieux, this.jeu.objets);
      if (commandeComplete !== this.commande) {
        this.commande = commandeComplete;
        this.focusCommande();
      }
    }
  }

  onClickValidate(event: Event) {
    if (this.resteDeLaSortie?.length) {
      event.preventDefault(); // éviter que l’évènement soit encore émis ailleurs
      this.afficherSuiteSortie();
    } else {
      this.onKeyDownEnter(event);
    }
  }

  /**
   * Enter: Valider une commande.
   * @param event 
   */
  onKeyDownEnter(event: Event) {
    if (this.interruptionAttendreChoixEnCours) {
      this.traiterChoixStatiqueJoueur();
    } else if (this.interruptionAttendreChoixLibreEnCours) {
      this.traiterChoixLibreJoueur();
    } else if (this.interruptionQuestionCommande) {
      // nombre => réponse question
      // > par défaut: choix 1
      if (!this.commande) {
        this.commande = "1";
      }
      // > retrouver le choix éventuel
      let number = Number.parseInt(this.commande);
      // > si un choix a été fait
      if (number) {
        if ((number - 1) < this.interruptionEnCours.derniereQuestion.Choix.length) {
          this.interruptionEnCours.derniereQuestion.Reponse = (number - 1);
          this.terminerInterruption(undefined);
        } else {
          this.ajouteErreur("Choix pas dispo!");
        }
        // sinon => c’est une commande
      } else {
        this.terminerInterruption(undefined);
        this.validationCommande();
      }

    } else if (!this.resteDeLaSortie?.length && !this.interruptionEnCours) {
      this.validationCommande();
    }
  }

  /** Lorsque le joueur valide une commande */
  private validationCommande(): void {
    this.curseurDernieresCommandes = -1;
    if (this.commande && this.commande.trim() !== "") {
      event?.stopPropagation; // éviter que l’évènement soit encore émis ailleurs
      this.commandeEnCours = true; // éviter qu’il déclenche attendre touche trop tôt et continue le texte qui va être ajouté ci dessous durant cet appuis-ci

      // COMPLÉTER ET NETTOYER LA COMMANDE
      // compléter la commande
      const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande, this.jeu.abreviations, this.jeu.lieux, this.jeu.objets);
      // nettoyage commmande (pour ne pas afficher une erreur en cas de faute de frappe…)
      const commandeNettoyee = CommandesUtils.nettoyerCommande(commandeComplete);

      this.envoyerCommande(this.commande, commandeNettoyee, true, false, true, true);
    }
  }

  /**
   * Envoyer la commande au commandeur pour qu’il l’exécute.
   * @param commandeBrute la commande brute (telle que tapée par le joueur, ou telle que stockée dans un .rec pour le magnéto). Stockée dans la pile d'instructions de la partie (`_etapesPartie`), lue par le DSL `annuler N tour(s)` et `creerFichierEnregistrement`.
   * @param commandeNettoyee la commande déjà nettoyée avec CommandesUtils.nettoyerCommande();
   * @param ajouterCommandeDansHistoriqueEtSauvegarde faut-il ajouter la commande à l’historique des commandes du joueur ?
   * @param nouveauParagraphe faut-il ouvrir un nouveau paragraphe avant toute chose ou bien y a-t-il déjà un paragraphe ouvert ?
   * @param ecrireCommande faut-il écrire la commande dans la sortie du jeu ?
   */
  private envoyerCommande(commandeBrute: string, commandeNettoyee: string, ajouterCommandeDansHistoriqueEtSauvegarde: boolean, nouveauParagraphe: boolean, ecrireCommande: boolean, continuerTricheApresCommande: boolean): void {
    // VÉRIFIER FIN DE PARTIE
    // vérifier si le jeu n’est pas déjà terminé
    if (this.partie.jeu.termine && !commandeNettoyee.match(/^(déboguer|sauver|recommencer|effacer|afficher l’aide|générer solution|générer enregistrement|annuler|nombre (de )?(mots|caractères)|(commencer )?nouvelle partie)\b/i)) {
      if (ecrireCommande) {
        this.partie.ecran.ajouterParagrapheDonjonOuvert('{- > ' + commandeBrute + (commandeBrute !== commandeNettoyee ? (' (' + commandeNettoyee + ')') : '') + '-}')
      }
      this.partie.ecran.ajouterContenuDonjon('{n}Le jeu est terminé.{n}{e}- pour commencer une nouvelle partie: tapez {-recommencer-}{n}{e}- pour annuler votre dernière action: tapez {-annuler-}');
    } else {
      // LISTE DES DERNIÈRES COMMANDES DISTINCTES ENTRÉES PAR L’UTILISATEUR
      if (ajouterCommandeDansHistoriqueEtSauvegarde) {
        // ajouter à l’historique (à condition que différent du précédent)
        // (commande nettoyée)
        if (this.dernieresCommandesDistinctes.length === 0 || (this.dernieresCommandesDistinctes[this.dernieresCommandesDistinctes.length - 1] !== commandeNettoyee)) {
          this.dernieresCommandesDistinctes.push(commandeNettoyee);
          if (this.dernieresCommandesDistinctes.length > this.TAILLE_DERNIERES_COMMANDES) {
            this.dernieresCommandesDistinctes.shift();
          }
        }
      }

      // MÀJ DE LA LISTE DE L’ENSEMBLE DES COMMANDES DE LA PARTIE
      if (ajouterCommandeDansHistoriqueEtSauvegarde) {
        // ne pas inclure la commande déboguer triche à l'historique pour
        // éviter les boucles lorsqu'on annule une commande...
        if (!commandeNettoyee.startsWith('déboguer triche')) {
          // (commande brute, pas nettoyée, pour fidélité du replay « auto-commandes »)
          this.partie.ajouterCommandeDansSauvegarde(commandeBrute);
        }
      }

      // EXÉCUTION DE LA COMMANDE
      const contexteCommande = this.partie.com.executerCommande(commandeNettoyee, false);

      // Enregistrement de la sortie pour génération d'un enregistrement (.rec).
      // On capture toujours : si ajouterCommandeDansHistoriqueEtSauvegarde=false (intro :
      // « commencer le jeu », « regarder »), la sortie va dans _sortieIntro.
      if (!commandeNettoyee.startsWith('déboguer triche')) {
        this.partie.enregistrerSortieEtapeCourante(contexteCommande.sortie ?? '');
      }

      if (ecrireCommande) {
        let affichageCommande: string;
        // commande comprise
        if (contexteCommande.evenement?.commandeComprise) {
          // afficher la commande entrée par le joueur + son interprétation
          const commandeFinale = contexteCommande.evenement.commandeComprise;
          affichageCommande = ' > ' + commandeBrute + (CommandesUtils.commandesSimilaires(commandeBrute, TexteUtils.enleverBalisesStyleDonjon(commandeFinale)) ? '' : (' (' + commandeFinale + ')'));
        } else {
          // commande PAS comprise ou incomplète (ou bien commande spéciale)
          // -> afficher la commande entrée par le joueur + son interprétation
          affichageCommande = ' > ' + commandeBrute + (CommandesUtils.commandesSimilaires(commandeBrute, commandeNettoyee) ? '' : (' (' + commandeNettoyee + ')'));
        }
        // commentaire à l’auteur
        if (commandeNettoyee.startsWith("*") || commandeNettoyee.startsWith("@")) {
          const texteIgnore = this.partie.ecran.ajouterParagrapheDonjon('{+' + affichageCommande + '+}');
          this.ajouterTexteAIgnorerAuxStatistiques(texteIgnore);
          // commande normale
        } else {
          const texteIgnore = this.partie.ecran.ajouterParagrapheDonjonOuvert('{-' + affichageCommande + '-}');
          this.ajouterTexteAIgnorerAuxStatistiques(texteIgnore);
        }
      }

      let sortieCommande = contexteCommande.sortie;

      // s’il y a une question en suspend:
      if (contexteCommande.questions != undefined) {
        let nouvelleQuestion: QuestionCommande;
        if (contexteCommande.questions.QcmDecoupe && contexteCommande.questions.QcmDecoupe.Reponse == undefined) {
          nouvelleQuestion = contexteCommande.questions.QcmDecoupe;
        } else if (contexteCommande.questions.QcmInfinitif && contexteCommande.questions.QcmInfinitif.Reponse == undefined) {
          nouvelleQuestion = contexteCommande.questions.QcmInfinitif;
        } else if (contexteCommande.questions.QcmCeci && contexteCommande.questions.QcmCeci.Reponse == undefined) {
          nouvelleQuestion = contexteCommande.questions.QcmCeci;
        } else if (contexteCommande.questions.QcmCela && contexteCommande.questions.QcmCela.Reponse == undefined) {
          nouvelleQuestion = contexteCommande.questions.QcmCela;
        } else if (contexteCommande.questions.QcmCeciEtCela && contexteCommande.questions.QcmCeciEtCela.Reponse == undefined) {
          nouvelleQuestion = contexteCommande.questions.QcmCeciEtCela;
        }

        if (nouvelleQuestion) {
          sortieCommande = nouvelleQuestion.Question;
          for (let index = 0; index < nouvelleQuestion.Choix.length; index++) {
            sortieCommande += `{n}${index + 1} − ${nouvelleQuestion.Choix[index].valeurs[0]}`;
          }
          this.jeu.tamponInterruptions.push(InterruptionsUtils.creerInterruptionQuestionCommande(contexteCommande, nouvelleQuestion));
        }
      }

      if (sortieCommande) {
        // sortie spéciale: auto-triche
        if (sortieCommande == "@auto-triche@") {
          setTimeout(() => {
            this.autoTricheEnAttente = true;
            this.nouvellePartieOuAnnulerTour.emit(this.jeu.sauvegarde);
          }, 100);
          // sortie spéciale: triche
        } else if (sortieCommande == "@triche@") {
          setTimeout(() => {
            this.manuTricheEnAttente = true;
            this.nouvellePartieOuAnnulerTour.emit(this.jeu.sauvegarde);
          }, 100);
          // sortie spéciale: sauver-commandes
        } else if (sortieCommande == "@générer-solution@") {
          this.genererFichierSolution();
          // sortie spéciale: générer enregistrement (.rec)
        } else if (sortieCommande == "@générer-enregistrement@") {
          this.genererFichierEnregistrement();
          // sortie spéciale: statistiques
        } else if (sortieCommande == "@statistiques@") {
          const sortieStatistiques = BalisesHtml.convertirEnHtml(Statisticien.afficherStatistiques(this.partie), this.partie.dossierRessourcesComplet);
          // éviter de comptabiliser l’affichage des statistiques dans le nombre de mots
          this.ajouterTexteAIgnorerAuxStatistiques(sortieStatistiques);
          this.ajouterContenuHtmlAvecTagsDonjon(sortieStatistiques);
          // sortie spéciale: nouvelle partie
        } else if (sortieCommande.includes("@nouvelle partie@")) {
          this.nouvellePartieOuAnnulerTour.emit();
          // commentaire à destination de l’auteur
        } else if (sortieCommande == "@@commentaire@@") {
          // (ne rien faire)
          // sortie normale
        } else {
          const sortieCommandeHtml = (nouveauParagraphe ? "<p>" : "<br>") + BalisesHtml.convertirEnHtml(sortieCommande, this.partie.dossierRessourcesComplet);
          // si commande pas comprise, refusée ou spéciale (déboguer), on va ignorer sa sortie pour les statistiques
          if (!contexteCommande.evenement?.commandeComprise) {
            this.ajouterTexteAIgnorerAuxStatistiques(sortieCommandeHtml);
            // ne pas ajouter les commande « afficher aide » aux statistiques
          } else if (contexteCommande.evenement?.infinitif == 'afficher' && contexteCommande.evenement?.ceci == 'aide') {
            this.ajouterTexteAIgnorerAuxStatistiques(sortieCommandeHtml);
          }
          this.ajouterContenuHtmlAvecTagsDonjon(sortieCommandeHtml);
        }
        // aucune sortie
      } else {
        // si on n’a pas été interrompu, informer que la commande n’a rien renvoyé
        if (!this.jeu.tamponInterruptions.length) {
          this.ajouterContenuHtmlAvecTagsDonjon((nouveauParagraphe ? "<p>" : "<br>") + BalisesHtml.convertirEnHtml("{/La commande n’a renvoyé aucun retour./}", this.partie.dossierRessourcesComplet));
        }
      }

      // terminer le paragraphe si on n’a pas d’interruptions à gérer
      if (!this.jeu.tamponInterruptions.length) {
        this.partie.ecran.fermerParagrahpe();
      }
    }
    // nettoyer l’entrée commande et scroll du texte
    this.commande = "";

    // s’il y a encore des interruptions à gérer, il faut les gérer
    if (this.jeu.tamponInterruptions.length) {
      this.traiterProchaineInterruption();
      // s’il reste des routines à exécuter, il faut les exécuter
    } else if (this.jeu.tamponRoutinesEnAttente.length) {
      this.traiterProchaineRoutine();
      // sinon la commande est terminée
    } else {
      // si le jeu n’étais pas encore commencé, il l’est à présent
      if (!this.partie.jeu.commence) {
        this.partie.jeu.commence = true;
        if (!this.autoTricheActif) {
          this.lancerRoutinesProgrammees();
        }
      }

      if (continuerTricheApresCommande) {
        // mode triche: afficher commande suivante
        this.executerProchaineEtapeManuTriche();
      }
    }

    this.scrollSortie();
    setTimeout(() => {
      this.commandeEnCours = false;
    }, 100);
  }

  get titreLieuActuel(): string | undefined {
    const lieu = this.partie?.eju?.curLieu;
    if (!lieu) return undefined;
    return lieu.titre ?? lieu.intitule?.nom;
  }

  get positionAffichageLieu(): 'haut' | 'bas' | 'aucun' {
    return this.partie?.jeu?.parametres?.afficherTitreLieu ?? 'haut';
  }

  get afficherLieuDansCartoucheHaut(): boolean {
    return this.positionAffichageLieu === 'haut' && !!this.titreLieuActuel;
  }

  get afficherLieuDansCartoucheBas(): boolean {
    return this.positionAffichageLieu === 'bas' && !!this.titreLieuActuel;
  }

  get afficherCartoucheHaut(): boolean {
    return this.afficherLieuDansCartoucheHaut || this.compteursHautGauche.length > 0 || this.compteursHautDroite.length > 0;
  }

  get afficherCartoucheBas(): boolean {
    return this.afficherLieuDansCartoucheBas || this.compteursBasGauche.length > 0 || this.compteursBasDroite.length > 0;
  }

  get compteursHautGauche() { return [...(this.jeu?.compteurs.filter(c => c.positionAffichage === "haut-gauche") ?? []), ...this.ressourcesCartouche("haut-gauche")]; }
  get compteursHautDroite() { return [...(this.jeu?.compteurs.filter(c => c.positionAffichage === "haut-droite") ?? []), ...this.ressourcesCartouche("haut-droite")]; }
  get compteursBasGauche() { return [...(this.jeu?.compteurs.filter(c => c.positionAffichage === "bas-gauche") ?? []), ...this.ressourcesCartouche("bas-gauche")]; }
  get compteursBasDroite() { return [...(this.jeu?.compteurs.filter(c => c.positionAffichage === "bas-droite") ?? []), ...this.ressourcesCartouche("bas-droite")]; }

  /**
   * Ressources affichées dans un coin du cartouche, adaptées au format des compteurs.
   * La quantité est sommée EN DIRECT à chaque rendu (selon le périmètre possede/disponible),
   * si bien que prendre/lâcher/consommer/créer mettent le cartouche à jour automatiquement.
   * Une pile illimitée donne « ∞ ».
   */
  private ressourcesCartouche(position: 'haut-gauche' | 'haut-droite' | 'bas-gauche' | 'bas-droite') {
    const jeu = this.jeu;
    if (!jeu?.ressourcesAffichees?.length || !jeu.joueur) { return []; }
    return jeu.ressourcesAffichees
      .filter(r => r.positionAffichage === position)
      .map(r => {
        const somme = ElementsJeuUtils.sommeQuantiteRessource(jeu.objets, jeu.joueur.id, r.nom, r.scope);
        return {
          nom: r.nom,
          titre: r.titre,
          intitule: { nom: r.intituleNom },
          valeur: somme === -1 ? '∞' : somme,
          unite: r.unite,
          unites: r.unites,
          sansIntitule: r.sansIntitule,
          sansUnite: r.sansUnite,
        };
      });
  }

  /** Retourne l'unité accordée selon la valeur (singulier si |valeur| ≤ 1, pluriel sinon). */
  uniteAccordee(compteur: { valeur: number | string, unite?: string | null, unites?: string | null }): string | null {
    if (!compteur.unite) return null;
    // ressource illimitée (« ∞ ») ou valeur non numérique → pluriel
    const valeurNum = typeof compteur.valeur === 'number' ? compteur.valeur : 2;
    if (Math.abs(valeurNum) <= 1) return compteur.unite;
    return compteur.unites ?? MotUtils.getPluriel(compteur.unite);
  }

  get paddingTopCompteurs(): number {
    return (this.compteursHautGauche.length > 0 || this.compteursHautDroite.length > 0) ? 36 : 0;
  }
  get paddingBottomCompteurs(): number {
    return (this.compteursBasGauche.length > 0 || this.compteursBasDroite.length > 0) ? 36 : 0;
  }

  /** afficher la case à cocher pour activer/désactiver l’audio */
  get afficherCheckActiverAudio(): boolean {
    return this.activerParametreAudio;
  }

  /** valeur de la case à cocher pour activer l’audio */
  get audioActif(): boolean {
    return this.partie.jeu.parametres.activerAudio;
  }

  /** valeur de la case à cocher pour activer l’audio */
  set audioActif(actif: boolean) {
    this.partie.jeu.parametres.activerAudio = actif;
    this.partie.ins.onChangementAudioActif();
  }

  get placeHolder(): string {
    if (this.interruptionAttendreChoixEnCours) {
      return 'Veuillez faire un choix';
    } else if (this.interruptionAttendreChoixLibreEnCours) {
      return 'Veuillez répondre';
    } else if (this.interruptionAttendreToucheEnCours || this.resteDeLaSortie?.length) {
      return 'Appuyez sur une touche…';
    } else if (this.interruptionAttendreSecondesEnCours) {
      return 'Veuillez patienter…';
    } else if (this.interruptionQuestionCommande) {
      return 'Veuillez entrer un nombre ou une commande';
    } else {
      return 'Entrez une commande (infinitif + compl. direct + compl. indirect)';
    }
  }

  get maxLen(): number {
    if (this.interruptionAttendreChoixEnCours) {
      return 2;
    } else if (this.interruptionAttendreSecondesEnCours || this.interruptionAttendreToucheEnCours || this.resteDeLaSortie?.length) {
      return 0;
    } else {
      return -1;
    }
  }

  /** une interruption de type attendre choix est en cours */
  get interruptionAttendreChoixEnCours(): boolean {
    return this.interruptionEnCours?.typeInterruption === TypeInterruption.attendreChoix;
  }

  /** une interruption de type attendre choix libre est en cours */
  get interruptionAttendreChoixLibreEnCours(): boolean {
    return this.interruptionEnCours?.typeInterruption === TypeInterruption.attendreChoixLibre;
  }

  /** une interruption de type attendre touche est en cours */
  get interruptionAttendreToucheEnCours(): boolean {
    return this.interruptionEnCours?.typeInterruption === TypeInterruption.attendreTouche;
  }

  /** une interruption de type attendre X secondes est en cours */
  get interruptionAttendreSecondesEnCours(): boolean {
    return this.interruptionEnCours?.typeInterruption === TypeInterruption.attendreSecondes;
  }

  get interruptionQuestionCommande(): boolean {
    return this.interruptionEnCours?.typeInterruption === TypeInterruption.questionCommande;
  }

  public testerAudio() {
    console.log("testerAudio ");
    this.partie.ins.testerSon();
  }

  /**
   * Charger IFID dans le header de la page
   */
  private definirIFID() {
    if (this.htmlDocument) {
      // si on a un IFID, l'ajouter à la page web
      if (this.jeu?.IFID) {
        // récuperer ancienne balise
        let oldMetaIFID = this.htmlDocument.querySelector("meta[name='ifid']") as HTMLMetaElement;
        const metaContent = "UUID://" + BalisesHtml.retirerBalisesHtml(this.jeu.IFID) + "//";
        // balise déjà présente
        if (oldMetaIFID) {
          oldMetaIFID.content = metaContent;
          // ajouter balise
        } else {
          const head = this.htmlDocument.getElementsByTagName('head')[0];
          const newMetaIFID = this.htmlDocument.createElement('meta');
          newMetaIFID.name = 'ifid';
          newMetaIFID.content = metaContent;
          head.appendChild(newMetaIFID);
        }
        // si pas d'IFID
      } else {
        this.enleverIFID();
      }
    }
  }

  public creerSauvegardePartie(scenario: string): Sauvegarde {
    // générer fichier solution
    let sauvegarde = this.partie.creerSauvegardeSolution();
    // ajouter scénario
    sauvegarde.scenario = scenario;
    return sauvegarde;
  }

  private enleverIFID() {
    // récuperer ancienne balise
    let oldMetaIFID = this.htmlDocument.querySelector("meta[name='ifid']") as HTMLMetaElement;
    // supprimer l'ancienne balise
    if (oldMetaIFID) {
      oldMetaIFID.remove();
    }
  }

  ngOnDestroy(): void {
    if (this.partie) {
      this.partie.unload();
    }
    this.enleverIFID();
  }

}
