import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Abreviations } from '../utils/jeu/abreviations';
import { BalisesHtml } from '../utils/jeu/balises-html';
import { ClassesRacines } from '../models/commun/classes-racines';
import { Commandeur } from '../utils/jeu/commandeur';
import { ContexteTour } from '../models/jouer/contexte-tour';
import { Declencheur } from '../utils/jeu/declencheur';
import { ElementsJeuUtils } from '../utils/commun/elements-jeu-utils';
import { ElementsPhrase } from '../models/commun/elements-phrase';
import { Evenement } from '../models/jouer/evenement';
import { Instruction } from '../models/compilateur/instruction';
import { Instructions } from '../utils/jeu/instructions';
import { Jeu } from '../models/jeu/jeu';
import { Resultat } from '../models/jouer/resultat';
import { StringUtils } from '../../public-api';
import { TypeEvenement } from '../models/jouer/type-evenement';

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

  readonly TAILLE_DERNIERES_COMMANDES: number = 20;

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

  private com: Commandeur;
  private ins: Instructions;
  private eju: ElementsJeuUtils;
  private dec: Declencheur;

  @ViewChild('txCommande') commandeInputRef: ElementRef;
  @ViewChild('taResultat') resultatInputRef: ElementRef;

  resteDeLaSortie: string[] = [];
  commandeEnCours: boolean = false;
  dossierRessourcesComplet: string = "???";
  constructor() { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    // supprimer les musiques en court éventuelles
    if (this.ins) {
      this.ins.unload();
    }

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
    this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
    this.ins = new Instructions(this.jeu, this.eju, this.verbeux);
    this.dec = new Declencheur(this.jeu.auditeurs, this.verbeux);
    this.com = new Commandeur(this.jeu, this.ins, this.dec, this.verbeux);
    // fournir le commandeur aux instructions (pour intsruction « exéctuter commande »)
    this.ins.commandeur = this.com;
    
    // définir le dossier qui contient les ressources
    this.dossierRessourcesComplet = Jeu.dossierRessources;
    if (this.jeu.sousDossierRessources) {
      // sécurisé nom du sous-dossier (au cas où on a chipoté mais normalement devrait déjà être fait)
      const sousDossierSecurise = StringUtils.nomDeDossierSecurise(this.jeu.sousDossierRessources);
      if (sousDossierSecurise.length) {
        this.dossierRessourcesComplet = Jeu.dossierRessources + '/' + sousDossierSecurise;
      }
    }

    // afficher le titre et la version du jeu
    this.sortieJoueur += ("<h5>" + (this.jeu.titre ? BalisesHtml.retirerBalisesHtml(this.jeu.titre) : "(jeu sans titre)"));
    // afficher la version du jeu
    if (this.jeu.version) {
      this.sortieJoueur += ('<small> ' + BalisesHtml.retirerBalisesHtml(this.jeu.version) + '</small>');
    }
    this.sortieJoueur += '</h5><p>Un jeu de ';

    // afficher l’auteur du jeu
    if (this.jeu.auteur) {
      this.sortieJoueur += (BalisesHtml.retirerBalisesHtml(this.jeu.auteur));
    } else if (this.jeu.auteurs) {
      this.sortieJoueur += (BalisesHtml.retirerBalisesHtml(this.jeu.auteurs));
    } else {
      this.sortieJoueur += ("(anonyme)");
    }

    this.sortieJoueur += '</p>';

    if (this.jeu.siteWebLien || this.jeu.licenceTitre) {

      this.sortieJoueur += '<p>';
      // site web du jeu
      if (this.jeu.siteWebLien) {
        if (this.jeu.siteWebTitre) {
          this.sortieJoueur += ('Site web : <a href="' + BalisesHtml.retirerBalisesHtml(this.jeu.siteWebLien) + '" target="_blank">' + BalisesHtml.retirerBalisesHtml(this.jeu.siteWebTitre) + "</a>");
        } else {
          this.sortieJoueur += ('Site web : <a href="' + BalisesHtml.retirerBalisesHtml(this.jeu.siteWebLien) + '" target="_blank">' + BalisesHtml.retirerBalisesHtml(this.jeu.siteWebLien) + "</a>");
        }
      }

      // afficher la licence du jeu
      if (this.jeu.licenceTitre) {
        if (this.jeu.siteWebLien) {
          this.sortieJoueur += '<br>';
        }
        if (this.jeu.licenceLien) {
          this.sortieJoueur += ('Licence : <a href="' + BalisesHtml.retirerBalisesHtml(this.jeu.licenceLien) + '" target="_blank">' + BalisesHtml.retirerBalisesHtml(this.jeu.licenceTitre) + "</a>");
        } else {
          this.sortieJoueur += ('Licence : ' + BalisesHtml.retirerBalisesHtml(this.jeu.licenceTitre));
        }
      }
      this.sortieJoueur += '</p>';
    }

    if (this.jeu.parametres.activerAudio) {
      this.activerParametreAudio = true;
      this.sortieJoueur += "<p>" + BalisesHtml.convertirEnHtml("{/Ce jeu utilise des effets sonores, vous pouvez les désactiver en bas de la page.{n}La commande {-tester audio-} permet de vérifier votre matériel./}", this.dossierRessourcesComplet);
    } else {
      this.activerParametreAudio = false;
    }

    this.verifierTamponErreurs();

    // ==================
    // A. NOUVELLE PARTIE
    // ==================
    if (!this.jeu.commence) {

      this.sortieJoueur += "<p>";

      // évènement COMMENCER JEU
      let evCommencerJeu = new Evenement(TypeEvenement.jeu, 'commencer', true, null, 0, 'jeu', ClassesRacines.Special);

      let contexteTour = new ContexteTour(undefined, undefined);

      // éxécuter les instructions AVANT le jeu commence
      let resultatAvant = new Resultat(true, "", 0);
      // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score
      const declenchementsAvant = this.dec.avant(evCommencerJeu);
      // éxécuter les règles déclenchées
      declenchementsAvant.forEach(declenchement => {
        const sousResultatAvant = this.ins.executerInstructions(declenchement.instructions, contexteTour, evCommencerJeu, declenchement.declenchements);
        resultatAvant.sortie += sousResultatAvant.sortie;
        resultatAvant.succes = resultatAvant.succes && sousResultatAvant.succes;
        resultatAvant.nombre += sousResultatAvant.nombre;
        resultatAvant.stopperApresRegle = resultatAvant.stopperApresRegle || sousResultatAvant.stopperApresRegle;
      });
      // ajouter la sortie
      if (resultatAvant.sortie) {
        this.ajouterSortieJoueur(BalisesHtml.convertirEnHtml(resultatAvant.sortie, this.dossierRessourcesComplet));
      }

      // définir visibilité des objets initiale
      this.eju.majPresenceDesObjets();

      // définir adjacence des lieux initiale
      this.eju.majAdjacenceLieux();

      // continuer l’exécution de l’action si elle n’a pas été arrêtée
      if (!resultatAvant.stopperApresRegle) {
        // // // exécuter les instruction REMPLACER s’il y a lieu, sinon suivre le cours normal
        // // let resultatRemplacer = this.ins.executerInstructions(this.dec.remplacer(evCommencerJeu));
        // // if (resultatRemplacer.nombre === 0) {

        // regarder où on est (sauf si l’action n’existe pas)
        if (this.jeu.actions.some(x => x.infinitif == 'regarder' && !x.ceci && !x.cela)) {
          let instruction = new Instruction(new ElementsPhrase('exécuter', null, null, null, 'la commande "regarder"'));
          const resRegarder = this.ins.executerInstruction(instruction, null, null, null);
          this.ajouterSortieJoueur("<p>" + BalisesHtml.convertirEnHtml(resRegarder.sortie, this.dossierRessourcesComplet) + "</p>");
        }

        this.jeu.commence = true;

        // // }

        // éxécuter les instructions APRÈS le jeu commence
        let resultatApres = new Resultat(true, "", 0);
        // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score
        const declenchementsApres = this.dec.apres(evCommencerJeu);
        // éxécuter les règles déclenchées
        declenchementsApres.forEach(declenchement => {
          const sousResultatApres = this.ins.executerInstructions(declenchement.instructions, contexteTour, evCommencerJeu, declenchement.declenchements);
          resultatApres.sortie += sousResultatApres.sortie;
          resultatApres.succes = resultatApres.succes && sousResultatApres.succes;
          resultatApres.nombre += sousResultatApres.nombre;
          resultatApres.terminerAvantRegle = resultatApres.terminerAvantRegle || sousResultatApres.terminerAvantRegle;
          resultatApres.terminerApresRegle = resultatApres.terminerApresRegle || sousResultatApres.terminerApresRegle;
        });

        if (resultatApres.sortie) {
          this.ajouterSortieJoueur(BalisesHtml.convertirEnHtml(resultatApres.sortie, this.dossierRessourcesComplet));
        }


      }
      //terminer le paragraphe sauf si on attends une touche pour continuer
      if (!this.resteDeLaSortie?.length && !this.sortieJoueur.endsWith("</p>")) {
        this.sortieJoueur += "</p>";
      }

      // ========================
      // B. REPRISE D’UNE PARTIE
      // ========================
    } else {
      this.sortieJoueur += ("<p>" + BalisesHtml.convertirEnHtml("{/{+(reprise de la partie)+}/}", this.dossierRessourcesComplet) + "</p>");
      // regarder où on est.
      let instruction = new Instruction(new ElementsPhrase('exécuter', null, null, null, 'la commande "regarder"'));
      const resRegarder = this.ins.executerInstruction(instruction, null, null, null);
      this.ajouterSortieJoueur("<p>" + BalisesHtml.convertirEnHtml(resRegarder.sortie, this.dossierRessourcesComplet) + "</p>");
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
    setTimeout(() => {
      if (this.jeu) {
        // vérifier s’il reste des erreurs à afficher
        if (this.jeu.tamponErreurs.length) {
          let texteErreurs = "";
          while (this.jeu.tamponErreurs.length) {
            const erreur = this.jeu.tamponErreurs.shift();
            texteErreurs += '{N}' + erreur;
          }
          this.sortieJoueur += '<p>' + BalisesHtml.convertirEnHtml('{+{/' + texteErreurs + '/}+}' + '</p>', this.dossierRessourcesComplet);
          this.scrollSortie();
        }
        // vérifier à nouveau dans quelques temps
        this.verifierTamponErreurs();
      }
    }, 1000);
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
        this.commande = "";
        event.preventDefault();
      }
    }
  }

  /**
   * Historique: aller en arrière (flèche haut)
   * @param event
   */
  onKeyDownArrowUp(event) {
    if (!this.resteDeLaSortie?.length) {
      if (this.curseurHistorique < (this.historiqueCommandes.length - 1)) {
        this.curseurHistorique += 1;
        const index = (this.historiqueCommandes.length - this.curseurHistorique - 1);
        this.commande = this.historiqueCommandes[index];
        this.focusCommande();
      }
    }
  }

  /**
   * Historique: revenir en avant (Flèche bas)
   */
  onKeyDownArrowDown(event) {
    if (!this.resteDeLaSortie?.length) {
      if (this.curseurHistorique >= 0) {
        this.curseurHistorique -= 1;
        const index = (this.historiqueCommandes.length - this.curseurHistorique - 1);
        this.commande = this.historiqueCommandes[index];
        this.focusCommande();
      } else {
        this.commande = "";
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
    this.sortieJoueur += '<p>' + BalisesHtml.convertirEnHtml('{/Fichier solution chargé./}{n}Vous pouvez utiliser {-triche-} ou {-triche auto-} pour tester le jeu à l’aide de ce fichier.' + '</p>', this.dossierRessourcesComplet);

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
      this.ajouterSortieJoueur("<br>" + BalisesHtml.convertirEnHtml("{/Aucun fichier solution (.sol) chargé./}", this.dossierRessourcesComplet));
    }
  }

  private lancerTriche() {
    if (this.autoCommandes && this.autoCommandes.length) {
      this.tricheActif = true;
      this.indexTriche = 0;
      this.commande = this.autoCommandes[this.indexTriche];
    } else {
      this.ajouterSortieJoueur("<br>" + BalisesHtml.convertirEnHtml("{/Aucun fichier solution (.sol) chargé./}", this.dossierRessourcesComplet));
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
    if (!this.resteDeLaSortie?.length) {
      this.curseurHistorique = -1;
      if (this.commande && this.commande.trim() !== "") {
        event?.stopPropagation; // éviter que l’évènement soit encore émis ailleurs
        this.commandeEnCours = true; // éviter qu’il déclenche attendre touche trop tôt et continue le texte qui va être ajouté ci dessous durant cet appuis-ci

        // COMPLÉTER ET NETTOYER LA COMMANDE
        // compléter la commande
        const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande);
        this.sortieJoueur += '<p><span class="text-primary">' + BalisesHtml.convertirEnHtml(' > ' + this.commande + (this.commande !== commandeComplete ? (' (' + commandeComplete + ')') : ''), this.dossierRessourcesComplet) + '</span>';
        // nettoyage commmande (pour ne pas afficher une erreur en cas de faute de frappe…)
        const commandeNettoyee = Commandeur.nettoyerCommande(commandeComplete);

        // VÉREFIER FIN DE PARTIE
        // vérifier si le jeu n’est pas déjà terminé
        if (this.jeu.termine && !commandeComplete.match(/^(déboguer|sauver|effacer) /i)) {
          this.sortieJoueur += "<br>Le jeu est terminé.<br>Pour débuter une nouvelle partie veuillez actualiser la page web.</p>";
        } else {
          // GESTION HISTORIQUE DES DERNIÈRES COMMANDES
          // ajouter à l’historique (à condition que différent du précédent)
          // (commande nettoyée)
          if (this.historiqueCommandes.length === 0 || (this.historiqueCommandes[this.historiqueCommandes.length - 1] !== commandeNettoyee)) {
            this.historiqueCommandes.push(commandeNettoyee);
            if (this.historiqueCommandes.length > this.TAILLE_DERNIERES_COMMANDES) {
              this.historiqueCommandes.shift();
            }
          }

          // GESTION HISTORIQUE DE L’ENSEMBLE DES COMMANDES DE LA PARTIE
          // (commande pas nettoyée car pour sauvegarde « auto-commandes »)
          this.historiqueCommandesPartie.push(this.commande);

          // EXÉCUTION DE LA COMMANDE
          const sortieCommande = this.com.executerCommande(commandeComplete.trim());
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
              this.ajouterSortieJoueur("<br>" + BalisesHtml.convertirEnHtml(sortieCommande, this.dossierRessourcesComplet));
            }
            // aucune sortie
          } else {
            this.ajouterSortieJoueur("<br>" + BalisesHtml.convertirEnHtml("{/La commande n’a renvoyé aucun retour./}", this.dossierRessourcesComplet));
          }

          this.sortieJoueur += "</p>";
        }
        // nettoyer l’entrée commande et scroll du texte
        this.commande = "";

        // mode triche: afficher commande suivante
        if (this.tricheActif && !this.resteDeLaSortie?.length) {
          this.indexTriche += 1;
          if (this.indexTriche < this.autoCommandes.length) {
            this.commande = this.autoCommandes[this.indexTriche];
          }
        }

        this.scrollSortie();
        setTimeout(() => {
          this.commandeEnCours = false;
        }, 100);
      }
    }
  }

  /** afficher la case à cocher pour activer/désactiver l’audio */
  get afficherCheckActiverAudio(): boolean {
    return this.activerParametreAudio;
  }

  /** valeur de la case à cocher pour activer l’audio */
  get audioActif(): boolean {
    return this.jeu.parametres.activerAudio;
  }

  /** valeur de la case à cocher pour activer l’audio */
  set audioActif(actif: boolean) {
    this.jeu.parametres.activerAudio = actif;
    this.ins.onChangementAudioActif();
  }

  ngOnDestroy(): void {
    if (this.jeu && this.ins) {
      this.ins.unload();
    }
  }

}
