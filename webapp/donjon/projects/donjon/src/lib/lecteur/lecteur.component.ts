import { Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Interruption, TypeContexte, TypeInterruption } from '../models/jeu/interruption';

import { Abreviations } from '../utils/jeu/abreviations';
import { BalisesHtml } from '../utils/jeu/balises-html';
import { CommandesUtils } from '../utils/jeu/commandes-utils';
import { ContextePartie } from '../models/jouer/contexte-partie';
import { Jeu } from '../models/jeu/jeu';
import { DOCUMENT } from '@angular/common';
import { Choix } from '../models/compilateur/choix';
import { ExprReg, Sauvegarde, StringUtils } from '../../public-api';
import { TexteUtils } from '../utils/commun/texte-utils';
import { Statisticien } from '../utils/jeu/statisticien';
import * as FileSaver from 'file-saver-es';
import { QuestionCommande } from '../models/jouer/questions-commande';
import { InterruptionsUtils } from '../utils/jeu/interruptions-utils';
import { ProgrammationTemps } from '../models/jeu/programmation-temps';

@Component({
  selector: 'djn-lecteur',
  templateUrl: './lecteur.component.html',
  styleUrls: ['./lecteur.component.scss'],
  standalone: false
})
export class LecteurComponent implements OnInit, OnChanges, OnDestroy {

  static verbeux = true;

  @Input() jeu: Jeu;
  @Input() verbeux = false;
  /** Le débogueur est il actif ? */
  @Input() debogueur = false;
  /** Annuler un certain nombre de tours */
  @Output() nouvellePartieOuAnnulerTour = new EventEmitter();

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

  /** Index de la dernière commande exécutée avec le système « triche/chargement partie » */
  private indexDerniereCommandeRestauration: number = -1;


  /** Afficher la case à cocher pour activer/désactiver l’audio */
  private activerParametreAudio: boolean = false;

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
        this.ajouterConseil("Restauration de partie : sauvegarde vide.")
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
      this.envoyerCommande("commencer le jeu", false, true, false, true);
      // sinon initialiser les éléments du jeu en fonction de la position du joueur
    } else {
      // définir visibilité des objets initiale
      this.partie.eju.majPresenceDesObjets();
      // définir adjacence des lieux initiale
      this.partie.eju.majAdjacenceLieux();

      // si la commande regarder existe et s’il y a au moins 1 lieu, l’exécuter
      if (this.partie.jeu.actions.some(x => x.infinitif == 'regarder' && !x.ceci && !x.cela) && this.partie.jeu.lieux.length > 0) {
        // exécuter la commande « regarder »
        this.envoyerCommande("regarder", false, true, false, true);
      } else {
        // this.sortieJoueur = "";
      }
    }

    // le jeu est commencé à moins qu’il ne soit interrompu
    if (!this.interruptionEnCours) {
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
      // si la partie n’est pas en pause, vérifier les chronos
      if (!this.jeu.interrompu) {
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
            // retrouver la routine
            const routine = this.jeu.routines.find(x => x.nom.toLocaleLowerCase() == programmation.routine);
            if (routine) {
              if (this.partie.verbeux) {
                console.log("routine trouvée");
              }
              this.jeu.tamponRoutinesEnAttente.push(routine);

              // enregistrer le moment où la routine a été mise sur le pile pour la sauvegarde
              this.partie.ajouterDeclenchementDansSauvegarde(routine.nom);

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
              this.partie.eju.ajouterErreur(`Programmation routine: routine pas trouvée: ${programmation.routine}.`);
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
      // en mode auto-triche ou restauration partie, on n’attend pas !
      if (this.autoTricheActif || this.autoTricheEnAttente || this.restaurationSauvegardeEnAttente) {
        // contenu = contenu.replace(/@@attendre touche@@/g, '{n}{/Appuyez sur une touche…/}{n}')
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

  private traiterProchaineRoutine() {
    const routine = this.jeu.tamponRoutinesEnAttente.shift();

    if (this.verbeux) {
      console.warn("routine exécutée: ", routine.nom);
    }

    const sortieRoutine = this.partie.com.executerRoutine(routine);
    this.partie.ecran.ajouterParagrapheDonjon(sortieRoutine);
    this.scrollSortie();

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
            const identifiantsChoix = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            this.choixPossibles = identifiantsChoix.slice(0, this.interruptionEnCours.choix.length);

            let texteChoix = '<ul class="no-bullet">';
            for (let indexChoix = 0; indexChoix < this.interruptionEnCours.choix.length; indexChoix++) {
              const curChoix = this.interruptionEnCours.choix[indexChoix];
              // pour les QCM: toujours 1 seule valeur par choix !
              // sinon on s'en sort pas avec les lettres et la gestion des index...
              texteChoix += '<li>' + identifiantsChoix[indexChoix] + ' − ' + BalisesHtml.convertirEnHtml(curChoix.valeurs[0].toString(), this.partie.dossierRessourcesComplet) + '</li>';
            }
            texteChoix += '</ul>'
            this.partie.ecran.ajouterContenuHtml(texteChoix);
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
          // alors on n'attend pas !
          if (this.autoTricheActif || this.restaurationSauvegardeEnAttente || this.autoTricheEnAttente || this.interruptionEnCoursAvantAnnulation) {
            this.terminerInterruption(undefined);
          }
          break;

        case TypeInterruption.attendreSecondes:
          let nbMillisecondes = Math.floor(this.interruptionEnCours.nbSecondesAttendre * 1000);
          this.commande = "";
          this.focusCommande();
          // si on est en auto-triche où qu'une sauvegarde doit
          // être restaurée, ou qu'un tour doit être annulé, on n'attend pas !
          if (this.autoTricheActif || this.restaurationSauvegardeEnAttente || this.autoTricheEnAttente || this.interruptionEnCoursAvantAnnulation) {
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
        this.envoyerCommande(this.commande, false, false, false, false);
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
      if (!this.partie.jeu.commence) {
        this.partie.jeu.commence = true;
        // si une sauvegarde doit être restaurée
        if (this.restaurationSauvegardeEnAttente) {
          this.lancerAutoTriche();
          // sinon lancer le système de routines programmées
        } else {
          this.lancerRoutinesProgrammees();
        }
      }

      // mode triche: afficher commande suivante
      this.executerProchaineEtapeManuTriche();
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

        this.jeu.sauvegarde.etapesSauvegarde.forEach(async curCom => {

          if (ignorerEtapeGraine) {
            ignorerEtapeGraine = false;
          } else {
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
                const routine = this.jeu.routines.find(x => x.nom.toLocaleLowerCase() == valeur);
                if (routine) {
                  if (this.partie.verbeux) {
                    console.log("routine trouvée");
                  }
                  this.jeu.tamponRoutinesEnAttente.push(routine);
                  // enregistrer le moment où la routine a été mise sur le pile pour la sauvegarde
                  this.partie.ajouterDeclenchementDansSauvegarde(routine.nom);
                  this.traiterProchaineRoutine();
                } else {
                  this.ajouteErreur(`Triche auto: routine pas trouvée: ${valeur}`)
                }
                break;

              default:
                throw new Error(`Restauration sauvegarde: type de commande pas pris en charge:  ${type}`);
            }
          }


        });

        // fin du mode triche
        this.autoTricheActif = false;
        this.partie.ins.restaurationPartieEnCours = false;

        // // nouvelle graine pour l’aléatoire
        // /!\ ATTENTION: il faut sauvegarder l’ensemble des graines de la partie
        // et le moment où on les a changé afin de pouvoir restaurer une partie sauvegardée !
        this.partie.nouvelleGraineAleatoire();

        // rétablir l'audio
        this.audioActif = backAudioActif;

        // aucune commande à exécuter
      } else {
        this.ajouterContenuHtmlAvecTagsDonjon("<br>" + BalisesHtml.convertirEnHtml("{/Aucune commande à exécuter./}", this.partie.dossierRessourcesComplet));
      }
      // s'il n'y a pas de sauvegarde/solution chargée
    } else {
      this.ajouterContenuHtmlAvecTagsDonjon("<br>" + BalisesHtml.convertirEnHtml("{/Aucun fichier solution (.sol) chargé./}", this.partie.dossierRessourcesComplet));
    }

    // si on était occupé à annuler des tours de jeu, terminer le tour commencé
    // avant le début de l'annulation
    if (this.interruptionEnCoursAvantAnnulation) {
      this.interruptionEnCours = this.interruptionEnCoursAvantAnnulation;
      this.interruptionEnCoursAvantAnnulation = undefined;
      this.terminerInterruption(undefined);
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

  /** Tabulation: continuer le mot */
  onKeyDownTab(event) {
    if (!this.resteDeLaSortie?.length) {
      const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande, this.jeu.abreviations);
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
      const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande, this.jeu.abreviations);
      // nettoyage commmande (pour ne pas afficher une erreur en cas de faute de frappe…)
      const commandeNettoyee = CommandesUtils.nettoyerCommande(commandeComplete);

      this.envoyerCommande(commandeNettoyee, true, false, true, true);
    }
  }

  /**
   * Envoyer la commande au commandeur pour qu’il l’exécute.
   * @param commandeNettoyee la commande déjà nettoyée avec CommandesUtils.nettoyerCommande();
   * @param ajouterCommandeDansHistoriqueEtSauvegarde faut-il ajouter la commande à l’historique des commandes du joueur ?
   * @param nouveauParagraphe faut-il ouvrir un nouveau paragraphe avant toute chose ou bien y a-t-il déjà un paragraphe ouvert ?
   * @param ecrireCommande faut-il écrire la commande dans la sortie du jeu ?
   */
  private envoyerCommande(commandeNettoyee: string, ajouterCommandeDansHistoriqueEtSauvegarde: boolean, nouveauParagraphe: boolean, ecrireCommande: boolean, continuerTricheApresCommande: boolean): void {
    // VÉRIFIER FIN DE PARTIE
    // vérifier si le jeu n’est pas déjà terminé
    if (this.partie.jeu.termine && !commandeNettoyee.match(/^(déboguer|sauver|recommencer|effacer|afficher l’aide|générer solution|annuler|nombre (de )?(mots|caractères)|(commencer )?nouvelle partie)\b/i)) {
      if (ecrireCommande) {
        this.partie.ecran.ajouterParagrapheDonjonOuvert('{- > ' + this.commande + (this.commande !== commandeNettoyee ? (' (' + commandeNettoyee + ')') : '') + '-}')
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
          // (commande pas nettoyée car pour sauvegarde « auto-commandes »)
          this.partie.ajouterCommandeDansSauvegarde(this.commande);
        }
      }

      // EXÉCUTION DE LA COMMANDE
      const contexteCommande = this.partie.com.executerCommande(commandeNettoyee, false);

      if (ecrireCommande) {
        let affichageCommande: string;
        // commande comprise
        if (contexteCommande.evenement?.commandeComprise) {
          // afficher la commande entrée par le joueur + son interprétation
          const commandeFinale = contexteCommande.evenement.commandeComprise;
          affichageCommande = ' > ' + this.commande + (CommandesUtils.commandesSimilaires(this.commande, TexteUtils.enleverBalisesStyleDonjon(commandeFinale)) ? '' : (' (' + commandeFinale + ')'));
        } else {
          // commande PAS comprise ou incomplète (ou bien commande spéciale)
          // -> afficher la commande entrée par le joueur + son interprétation
          affichageCommande = ' > ' + this.commande + (CommandesUtils.commandesSimilaires(this.commande, commandeNettoyee) ? '' : (' (' + commandeNettoyee + ')'));
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
