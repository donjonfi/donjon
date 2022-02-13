import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Interruption, TypeContexte, TypeInterruption } from '../models/jeu/interruption';

import { Abreviations } from '../utils/jeu/abreviations';
import { BalisesHtml } from '../utils/jeu/balises-html';
import { CommandesUtils } from '../utils/jeu/commandes-utils';
import { ContextePartie } from '../models/jouer/contexte-partie';
import { Jeu } from '../models/jeu/jeu';

@Component({
  selector: 'djn-lecteur',
  templateUrl: './lecteur.component.html',
  styleUrls: ['./lecteur.component.scss']
})
export class LecteurComponent implements OnInit, OnChanges, OnDestroy {

  static verbeux = true;

  @Input() jeu: Jeu;
  @Input() verbeux = false;
  @Input() debogueur = false;

  /** Le contexte de la partie en cours (jeu, commandeur, déclencheur, …) */
  private ctx: ContextePartie | undefined;

  readonly TAILLE_DERNIERES_COMMANDES: number = 20;
  /** La sortie affichée au joueur (au format HTML). */
  sortieJoueur: string = null;
  /** Commande tapée par le joueur. */
  commande = "";
  /** Historique des commandes tapées par le joueur. */
  historiqueCommandes: string[] = [];
  /** Curseur dans l’historique des commandes */
  curseurHistorique = -1;
  /** Historique de toutes les commandes utilisées pour la partie en cours. */
  historiqueCommandesPartie: string[] = null;

  /** 
   * pour remplir automatiquement les commandes joueur
   * afin de tester plus rapidement le jeu.
   */
  private autoCommandes: string[] = null;

  /**
   * Le système « auto triche » est-il en cours d’exécution ?
   */
  private autoTricheActif = false;

  /**
   * Le système « triche » est-il actif ?
   */
  private tricheActif = false;

  /** Index de la commande dans le système « triche » */
  private indexTriche: number = 0;

  /** Afficher la case à cocher pour activer/désactiver l’audio */
  private activerParametreAudio: boolean = false;

  @ViewChild('txCommande') commandeInputRef: ElementRef;
  @ViewChild('taResultat') resultatInputRef: ElementRef;

  /** le texte restant à afficher dans la sortie (après appuyer sur une touche) */
  resteDeLaSortie: string[] = [];
  /** une commande est en cours */
  commandeEnCours: boolean = false;
  /** une interruption de type choix est en cours */
  interruptionChoixEnCours: boolean = false;
  /** Interruption qui est en cours */
  interruptionEnCours: Interruption | undefined;
  /** Les choix possibles pour l’utilisateur */
  choixPossibles: string[] = [];
  /** Index du choix actuellement sélectionné */
  indexChoixPropose: number = undefined;

  constructor() { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {

    /** Décharcher la partie en cours (arrêter musiques par exemple) */
    if (this.ctx) {
      this.ctx.unload();
    }

    /** Initialiser une nouvelle partie si un jeu est fourni. */
    if (this.jeu) {
      console.warn("jeu: ", this.jeu);
      this.initialiserJeu();
    } else {
      console.log("Lecteur: Pas de jeu chargé.");
    }
  }

  /** Initialiser une nouvelle partie (ou reprendre une partie) */
  private initialiserJeu() {
    this.sortieJoueur = "";
    this.resteDeLaSortie = [];
    this.historiqueCommandesPartie = [];
    this.commandeEnCours = false;
    this.interruptionChoixEnCours = false;

    // initialiser le contexte de la partie
    this.ctx = new ContextePartie(this.jeu, this.verbeux);

    this.verifierTamponErreurs();

    // afficher le titre et la version du jeu
    this.sortieJoueur += ("<h5>" + (this.ctx.jeu.titre ? BalisesHtml.retirerBalisesHtml(this.ctx.jeu.titre) : "(jeu sans titre)"));
    // afficher la version du jeu
    if (this.ctx.jeu.version) {
      this.sortieJoueur += ('<small> ' + BalisesHtml.retirerBalisesHtml(this.ctx.jeu.version) + '</small>');
    }
    this.sortieJoueur += '</h5><p>Un jeu de ';

    // afficher l’auteur du jeu
    if (this.ctx.jeu.auteur) {
      this.sortieJoueur += (BalisesHtml.retirerBalisesHtml(this.ctx.jeu.auteur));
    } else if (this.ctx.jeu.auteurs) {
      this.sortieJoueur += (BalisesHtml.retirerBalisesHtml(this.ctx.jeu.auteurs));
    } else {
      this.sortieJoueur += ("(anonyme)");
    }

    this.sortieJoueur += '</p>';

    if (this.ctx.jeu.siteWebLien || this.ctx.jeu.licenceTitre) {

      this.sortieJoueur += '<p>';
      // site web du jeu
      if (this.ctx.jeu.siteWebLien) {
        if (this.ctx.jeu.siteWebTitre) {
          this.sortieJoueur += ('Site web : <a href="' + BalisesHtml.retirerBalisesHtml(this.ctx.jeu.siteWebLien) + '" target="_blank">' + BalisesHtml.retirerBalisesHtml(this.ctx.jeu.siteWebTitre) + "</a>");
        } else {
          this.sortieJoueur += ('Site web : <a href="' + BalisesHtml.retirerBalisesHtml(this.ctx.jeu.siteWebLien) + '" target="_blank">' + BalisesHtml.retirerBalisesHtml(this.ctx.jeu.siteWebLien) + "</a>");
        }
      }

      // afficher la licence du jeu
      if (this.ctx.jeu.licenceTitre) {
        if (this.ctx.jeu.siteWebLien) {
          this.sortieJoueur += '<br>';
        }
        if (this.ctx.jeu.licenceLien) {
          this.sortieJoueur += ('Licence : <a href="' + BalisesHtml.retirerBalisesHtml(this.ctx.jeu.licenceLien) + '" target="_blank">' + BalisesHtml.retirerBalisesHtml(this.ctx.jeu.licenceTitre) + "</a>");
        } else {
          this.sortieJoueur += ('Licence : ' + BalisesHtml.retirerBalisesHtml(this.ctx.jeu.licenceTitre));
        }
      }
      this.sortieJoueur += '</p>';
    }

    if (this.ctx.jeu.parametres.activerAudio) {
      this.activerParametreAudio = true;
      this.sortieJoueur += "<p>" + BalisesHtml.convertirEnHtml("{/Ce jeu utilise des effets sonores, vous pouvez les désactiver en bas de la page.{n}La commande {-tester audio-} permet de vérifier votre matériel./}", this.ctx.dossierRessourcesComplet) + "</p>";
    } else {
      this.activerParametreAudio = false;
    }

    // ==================
    // A. NOUVELLE PARTIE
    // ==================
    if (!this.ctx.jeu.commence) {
      // si la commande commencer le jeu existe, commencer le jeu
      if (this.ctx.jeu.actions.some(x => x.infinitif == 'commencer' && x.ceci && !x.cela)) {
        // exécuter la commande « commencer le jeu »
        this.executerLaCommande("commencer le jeu", false, true);
        // sinon initialiser les éléments du jeu en fonction de la position du joueur
      } else {
        // définir visibilité des objets initiale
        this.ctx.eju.majPresenceDesObjets();
        // définir adjacence des lieux initiale
        this.ctx.eju.majAdjacenceLieux();

        // si la commande regarder existe et s’il y a au moins 1 lieu, l’exécuter
        if (this.ctx.jeu.actions.some(x => x.infinitif == 'regarder' && !x.ceci && !x.cela) && this.ctx.jeu.lieux.length > 0) {
          // exécuter la commande « regarder »
          this.executerLaCommande("regarder", false, true);
        } else {
          this.sortieJoueur = "";
        }
      }
      // le jeu est commencé à moins qu’il ne soit interrompu
      if (!this.interruptionEnCours) {
        this.ctx.jeu.commence = true;
      }

      // ========================
      // B. REPRISE D’UNE PARTIE
      // ========================
    } else {
      // si la commande continuer le jeu existe, continuer le jeu
      if (this.ctx.jeu.actions.some(x => x.infinitif == 'continuer' && x.ceci && !x.cela)) {
        // exécuter la commande « continuer le jeu »
        this.executerLaCommande("continuer le jeu", false, true);
        // sinon, si la commande regarder existe, et s’il y a au moins 1 lieu, l’exécuter
      } else {
        // afficher info suite partie
        this.sortieJoueur += "<p><i>(reprise de la partie)</i>";
        // regarder
        if (this.ctx.jeu.actions.some(x => x.infinitif == 'regarder' && !x.ceci && !x.cela) && this.ctx.jeu.lieux.length > 0) {
          // exécuter la commande « regarder »
          this.executerLaCommande("regarder", false, false);
        }
      }
    }

    // donner le focus sur « entrez une commande » 
    this.focusCommande();
  }

  /**
   * Ajouter du contenu à la sortie pour le joueur.
   * Cette méthode tient compte des pauses (attendre touche).
   */
  private ajouterSortieJoueur(contenu: string) {

    if (contenu) {

      // en mode auto-triche, on n’attend pas !
      if (this.autoTricheActif) {
        // contenu = contenu.replace(/@@attendre touche@@/g, '{n}{/Appuyez sur une touche…/}{n}')
        contenu = contenu.replace(/@@attendre touche@@/g, '<p class="text-primary font-italic">Appuyez sur une touche…</p>')
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
        const texteSection = sectionsContenu[0];
        const indexDernierEffacement = texteSection.lastIndexOf("@@effacer écran@@");
        // s’il ne faut pas effacer l’écran
        if (indexDernierEffacement == -1) {
          // ajouter à la suite
          this.sortieJoueur += texteSection;
          // sinon
        } else {
          // remplacer la sortie du joueur
          this.sortieJoueur = "<p>" + texteSection.slice(indexDernierEffacement + "@@effacer écran@@".length);
        }
        // attendre pour afficher la suite éventuelle
        if (sectionsContenu.length > 1) {
          this.sortieJoueur += '<p class="text-primary font-italic">Appuyez sur une touche…'
          this.resteDeLaSortie = this.resteDeLaSortie.concat(sectionsContenu.slice(1));
        }
      }
    }
  }

  private verifierTamponErreurs() {
    // vérifier s’il reste des erreurs à afficher
    if (this.ctx.jeu?.tamponErreurs.length) {
      let texteErreurs = "";
      while (this.ctx.jeu.tamponErreurs.length) {
        const erreur = this.ctx.jeu.tamponErreurs.shift();
        texteErreurs += '{N}# ' + erreur + '';
      }
      this.sortieJoueur += '<p>' + BalisesHtml.convertirEnHtml('{+{/' + texteErreurs + '/}+}' + '</p>', this.ctx.dossierRessourcesComplet);
      this.scrollSortie();
    }

    // vérifier à nouveau dans quelques temps
    setTimeout(() => {
      this.verifierTamponErreurs();
    }, 1000);
  }

  private traiterProchaineInterruption() {
    // console.warn("+++ traiterInterruptions +++");

    // traiter la prochaine interruption
    this.interruptionEnCours = this.jeu.tamponInterruptions.shift();
    if (this.interruptionEnCours) {
      switch (this.interruptionEnCours.typeInterruption) {
        case TypeInterruption.attendreChoix:
          if (this.interruptionEnCours.choix?.length) {
            const identifiantsChoix = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            this.choixPossibles = identifiantsChoix.slice(0, this.interruptionEnCours.choix.length);
            this.sortieJoueur += '<ul class="no-bullet">';
            for (let indexChoix = 0; indexChoix < this.interruptionEnCours.choix.length; indexChoix++) {
              const curChoix = this.interruptionEnCours.choix[indexChoix];
              this.sortieJoueur += '<li>' + identifiantsChoix[indexChoix] + ' − ' + curChoix.valeur + '</li>';
            }
            this.sortieJoueur += '</ul>'
            this.interruptionChoixEnCours = true;
            if (this.choixPossibles.length > 0) {
              this.indexChoixPropose = 0;
              this.commande = this.choixPossibles[this.indexChoixPropose];
              this.focusCommande();
            }
          } else {
            this.jeu.tamponErreurs.push("interruptions: le joueur doit faire un choix mais il n’y a aucun choix dans la liste");
          }
          break;

        case TypeInterruption.attendreTouche:

          break;

        default:
          this.jeu.tamponErreurs.push("interruptions: je ne connais pas ce type d’interruption: " + this.interruptionEnCours.typeInterruption);
          break;
      }
    }
  }

  private traiterChoixJoueur() {
    this.commande = this.commande?.trim();
    this.sortieJoueur += '<p><span class="text-primary">' + BalisesHtml.convertirEnHtml(' > ' + this.commande, this.ctx.dossierRessourcesComplet) + '</span>';

    const indexChoix = this.choixPossibles.findIndex(x => x == this.commande);
    if (indexChoix != -1) {
      // effacer la commande
      this.commande = '';
      const choix = this.interruptionEnCours.choix[indexChoix];
      if (!choix) {
        this.jeu.tamponErreurs.push("Traiter choix: le choix correspondant à l’index n’a pas été retrouvé");
      } else {
        // Il s’agit d’un tour interrompu
        if (this.interruptionEnCours.typeContexte == TypeContexte.tour) {
          // tour à continuer
          const tourInterrompu = this.interruptionEnCours.tour;
          // l’interruption est terminée
          this.interruptionChoixEnCours = false;
          this.interruptionEnCours = undefined;
          // ajouter les instructions découlant du choix au reste des instructions à exécuter pour ce tour
          if (choix.instructions?.length) {
            tourInterrompu.reste.unshift(...choix.instructions);
          }
          // continuer le tour interrompu
          const sortieCommande = this.ctx.com.continuerLeTourInterrompu(tourInterrompu);
          // afficher la sortie du tour
          this.ajouterSortieJoueur("<br>" + BalisesHtml.convertirEnHtml(sortieCommande, this.ctx.dossierRessourcesComplet));

        } else {
          this.jeu.tamponErreurs.push("Traiter choix: actuellement je ne gère que les interruptions du tour.");
          // l’interruption est terminée
          this.interruptionChoixEnCours = false;
          this.interruptionEnCours = undefined;
        }

        // s’il y a encore des interruptions à gérer, il faut les gérer
        if (this.jeu.tamponInterruptions.length) {
          this.traiterProchaineInterruption();
          // sinon la commande est terminée
        } else {

          // si le jeu n’étais pas encore commencé, il l’est à présent
          if (!this.ctx.jeu.commence) {
            this.ctx.jeu.commence = true;
          }

          // mode triche: afficher commande suivante
          if (this.tricheActif && !this.resteDeLaSortie?.length) {
            this.indexTriche += 1;
            if (this.indexTriche < this.autoCommandes.length) {
              this.commande = this.autoCommandes[this.indexTriche];
            }
          }
        }
        this.scrollSortie();

      }
    } else {
      this.sortieJoueur += "<p>Veuillez entrer la lettre correspondante à votre choix.</p>";
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
      this.sortieJoueur += ("<p>" + texteSection + "</p>");
      // sinon
    } else {
      // remplacer la sortie du joueur
      this.sortieJoueur = "<p>" + texteSection.slice(indexDernierEffacement + "@@effacer écran@@".length) + "</p>";
    }

    // s’il reste d’autres sections, attendre
    if (this.resteDeLaSortie.length) {
      this.sortieJoueur += '<p class="text-primary font-italic">Appuyez sur une touche…'
    } else {
      // mode triche : afficher commande suivante
      if (this.tricheActif) {
        this.indexTriche += 1;
        if (this.indexTriche < this.autoCommandes.length) {
          this.commande = this.autoCommandes[this.indexTriche];
        }
      }
    }
    this.scrollSortie();
  }

  private scrollSortie() {
    // scroll
    setTimeout(() => {
      this.resultatInputRef.nativeElement.scrollTop = this.resultatInputRef.nativeElement.scrollHeight;
      this.commandeInputRef.nativeElement.focus();
    }, 100);
  }

  /**
   * Appuis sur une touche par le joueur.
   */
  onKeyDown(event: Event) {
    // éviter de déclencher appuis touche avant la fin de la commande en cours
    if (!this.commandeEnCours) {
      // regarder s’il reste du texte à afficher
      if (this.resteDeLaSortie?.length) {
        this.afficherSuiteSortie();
        // effacer sortie sauf si mode triche actif
        if (!this.tricheActif) {
          this.commande = "";
        }
        event.preventDefault();
      }
    }
  }

  /**
   * Historique: aller en arrière (flèche haut)
   * @param event
   */
  onKeyDownArrowUp(event) {
    if (!this.resteDeLaSortie?.length && !this.interruptionChoixEnCours) {
      if (this.curseurHistorique < (this.historiqueCommandes.length - 1)) {
        this.curseurHistorique += 1;
        const index = (this.historiqueCommandes.length - this.curseurHistorique - 1);
        this.commande = this.historiqueCommandes[index];
        this.focusCommande();
      }
      // proposer le choix précédent
    } else if (this.interruptionChoixEnCours) {
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
    if (!this.resteDeLaSortie?.length && !this.interruptionChoixEnCours) {
      if (this.curseurHistorique >= 0) {
        this.curseurHistorique -= 1;
        const index = (this.historiqueCommandes.length - this.curseurHistorique - 1);
        this.commande = this.historiqueCommandes[index];
        this.focusCommande();
      } else {
        this.commande = "";
      }
      // proposer le choix suivant
    } else if (this.interruptionChoixEnCours) {
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
  public setAutoCommandes(autoCommandes: string) {
    this.autoCommandes = autoCommandes.split(/(?:\r\n|\r|\n|@;@)/);
    // retirer dernière entrée si vide
    if (!this.autoCommandes[this.autoCommandes.length]) {
      this.autoCommandes.pop();
    }
    console.log("Fichier auto commandes chargé : ", this.autoCommandes.length, " commande(s).");
    this.sortieJoueur += '<p>' + BalisesHtml.convertirEnHtml('{/Fichier solution chargé./}{n}Vous pouvez utiliser {-triche-} ou {-triche auto-} pour tester le jeu à l’aide de ce fichier.' + '</p>', this.ctx.dossierRessourcesComplet);

  }

  private lancerAutoTriche() {
    if (this.autoCommandes && this.autoCommandes.length) {
      this.autoTricheActif = true;
      this.autoCommandes.forEach(async curCom => {
        this.commande = curCom;
        this.onKeyDownEnter(null);
      });
      this.autoTricheActif = false;
    } else {
      this.ajouterSortieJoueur("<br>" + BalisesHtml.convertirEnHtml("{/Aucun fichier solution (.sol) chargé./}", this.ctx.dossierRessourcesComplet));
    }
  }

  private lancerTriche() {
    if (this.autoCommandes && this.autoCommandes.length) {
      this.tricheActif = true;
      this.indexTriche = 0;
      this.commande = this.autoCommandes[this.indexTriche];
    } else {
      this.ajouterSortieJoueur("<br>" + BalisesHtml.convertirEnHtml("{/Aucun fichier solution (.sol) chargé./}", this.ctx.dossierRessourcesComplet));
    }
  }

  private lancerSauverCommandes() {
    this.sortieJoueur = '<p><b>Commandes utilisées durant la partie :</b><br><i>Sauvez ces commandes dans un fichier texte dont le nom se termine par l’extension <b>.sol</b> afin de pouvoir utiliser votre solution avec le mode <b>triche</b>.</i></p>';
    // enlever la dernière commande, qui est « sauver commandes »
    this.historiqueCommandesPartie.pop();
    // afficher l’historique des commandes
    if (this.historiqueCommandesPartie.length > 0) {
      this.sortieJoueur += '<code>' + this.historiqueCommandesPartie.join("<br>") + '</code>';
    } else {
      this.ajouterSortieJoueur("<br>(Aucune commande à afficher.)");
    }
  }

  /** Tabulation: continuer le mot */
  onKeyDownTab(event) {
    if (!this.resteDeLaSortie?.length) {
      const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande);
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
    if (this.interruptionChoixEnCours) {
      this.traiterChoixJoueur();
    } else if (!this.resteDeLaSortie?.length) {
      this.curseurHistorique = -1;
      if (this.commande && this.commande.trim() !== "") {
        event?.stopPropagation; // éviter que l’évènement soit encore émis ailleurs
        this.commandeEnCours = true; // éviter qu’il déclenche attendre touche trop tôt et continue le texte qui va être ajouté ci dessous durant cet appuis-ci

        // COMPLÉTER ET NETTOYER LA COMMANDE
        // compléter la commande
        const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande);
        this.sortieJoueur += '<p><span class="text-primary">' + BalisesHtml.convertirEnHtml(' > ' + this.commande + (this.commande !== commandeComplete ? (' (' + commandeComplete + ')') : ''), this.ctx.dossierRessourcesComplet) + '</span>';
        // nettoyage commmande (pour ne pas afficher une erreur en cas de faute de frappe…)
        const commandeNettoyee = CommandesUtils.nettoyerCommande(commandeComplete);

        this.executerLaCommande(commandeNettoyee, true, false);
      }
    }
  }

  /**
   * Exécuter la commande avec le commandeur
   * @param commandeNettoyee la commande déjà nettoyée avec CommandesUtils.nettoyerCommande();
   * @param ajouterCommandeDansHistorique faut-il ajouter la commande à l’historique des commandes du joueur ?
   * @param nouveauParagraphe faut-il ouvrir un nouveau paragraphe avant toute chose ou bien y a-t-il déjà un paragraphe ouvert ?
   */
  private executerLaCommande(commandeNettoyee: string, ajouterCommandeDansHistorique: boolean, nouveauParagraphe: boolean) {
    // VÉREFIER FIN DE PARTIE
    // vérifier si le jeu n’est pas déjà terminé
    if (this.ctx.jeu.termine && !commandeNettoyee.match(/^(déboguer|sauver|effacer) /i)) {
      this.sortieJoueur += "<br>Le jeu est terminé.<br>Pour débuter une nouvelle partie veuillez actualiser la page web.</p>";
    } else {
      // GESTION HISTORIQUE DES DERNIÈRES COMMANDES
      if (ajouterCommandeDansHistorique) {
        // ajouter à l’historique (à condition que différent du précédent)
        // (commande nettoyée)
        if (this.historiqueCommandes.length === 0 || (this.historiqueCommandes[this.historiqueCommandes.length - 1] !== commandeNettoyee)) {
          this.historiqueCommandes.push(commandeNettoyee);
          if (this.historiqueCommandes.length > this.TAILLE_DERNIERES_COMMANDES) {
            this.historiqueCommandes.shift();
          }
        }
      }

      // GESTION HISTORIQUE DE L’ENSEMBLE DES COMMANDES DE LA PARTIE
      // (commande pas nettoyée car pour sauvegarde « auto-commandes »)
      this.historiqueCommandesPartie.push(this.commande);

      // EXÉCUTION DE LA COMMANDE
      const sortieCommande = this.ctx.com.executerCommande(commandeNettoyee);
      if (sortieCommande) {
        // sortie spéciale: auto-triche
        if (sortieCommande == "@auto-triche@") {
          setTimeout(() => {
            this.lancerAutoTriche();
          }, 100);
          // sortie spéciale: triche
        } else if (sortieCommande == "@triche@") {
          setTimeout(() => {
            this.lancerTriche();
          }, 100);
          // sortie spéciale: sauver-commandes
        } else if (sortieCommande == "@sauver-commandes@") {
          // setTimeout(() => {
          this.lancerSauverCommandes();
          // }, 100);
          // sortie normale
        } else {
          this.ajouterSortieJoueur((nouveauParagraphe ? "<p>" : "<br>") + BalisesHtml.convertirEnHtml(sortieCommande, this.ctx.dossierRessourcesComplet));
        }
        // aucune sortie
      } else {
        // si on n’a pas été interrompu, informé que la commande n’a rien renvoyé
        if (this.jeu.tamponInterruptions.length) {
          this.ajouterSortieJoueur((nouveauParagraphe ? "<p>" : "<br>") + BalisesHtml.convertirEnHtml("{/La commande n’a renvoyé aucun retour./}", this.ctx.dossierRessourcesComplet));
        }
      }

      // terminer le paragraphe si on n’a pas d’interruptions à gérer
      if (!this.jeu.tamponInterruptions.length) {
        this.sortieJoueur += "</p>";
      }
    }
    // nettoyer l’entrée commande et scroll du texte
    this.commande = "";

    // s’il y a encore des interruptions à gérer, il faut les gérer
    if (this.jeu.tamponInterruptions.length) {
      this.traiterProchaineInterruption();
      // sinon la commande est terminée
    } else {

      // si le jeu n’étais pas encore commencé, il l’est à présent
      if (!this.ctx.jeu.commence) {
        this.ctx.jeu.commence = true;
      }

      // mode triche: afficher commande suivante
      if (this.tricheActif && !this.resteDeLaSortie?.length) {
        this.indexTriche += 1;
        if (this.indexTriche < this.autoCommandes.length) {
          this.commande = this.autoCommandes[this.indexTriche];
        }
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
    return this.ctx.jeu.parametres.activerAudio;
  }

  /** valeur de la case à cocher pour activer l’audio */
  set audioActif(actif: boolean) {
    this.ctx.jeu.parametres.activerAudio = actif;
    this.ctx.ins.onChangementAudioActif();
  }

  get placeHolder(): string {
    if (this.interruptionChoixEnCours) {
      return 'Veuillez faire un choix';
    } else if (this.resteDeLaSortie?.length) {
      return 'Appuyez sur une touche…';
    } else {
      return 'Entrez une commande (infinitif + compl. direct + compl. indirect)';
    }
  }

  get maxLen(): number {
    if (this.interruptionChoixEnCours) {
      return 1;
    } else if (this.resteDeLaSortie?.length) {
      return 0;
    } else {
      return -1;
    }
  }

  ngOnDestroy(): void {
    if (this.ctx) {
      this.ctx.unload();
    }
  }

}
