import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Abreviations } from '../utils/jeu/abreviations';
import { BalisesHtml } from '../utils/jeu/balises-html';
import { ClassesRacines } from '../models/commun/classes-racines';
import { Commandeur } from '../utils/jeu/commandeur';
import { Declencheur } from '../utils/jeu/declencheur';
import { ElementsJeuUtils } from '../utils/commun/elements-jeu-utils';
import { ElementsPhrase } from '../models/commun/elements-phrase';
import { Evenement } from '../models/jouer/evenement';
import { Instruction } from '../models/compilateur/instruction';
import { Instructions } from '../utils/jeu/instructions';
import { Jeu } from '../models/jeu/jeu';
import { Resultat } from '../models/jouer/resultat';

@Component({
  selector: 'djn-lecteur',
  templateUrl: './lecteur.component.html',
  styleUrls: ['./lecteur.component.scss']
})
export class LecteurComponent implements OnInit, OnChanges {

  static verbeux = true;

  @Input() jeu: Jeu;
  @Input() verbeux = false;
  @Input() debogueur = false;

  readonly TAILLE_DERNIERES_COMMANDES: number = 10;

  sortieJoueur: string = null;
  commande = "";
  historiqueCommandes = new Array<string>();
  curseurHistorique = -1;

  private com: Commandeur;
  private ins: Instructions;
  private eju: ElementsJeuUtils;
  private dec: Declencheur;

  @ViewChild('txCommande') commandeInputRef: ElementRef;
  @ViewChild('taResultat') resultatInputRef: ElementRef;

  resteDeLaSortie: string[] = [];
  commandeEnCours: boolean = false;

  constructor() { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
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
    this.commandeEnCours = false;
    this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
    this.ins = new Instructions(this.jeu, this.eju, this.verbeux);
    this.dec = new Declencheur(this.jeu.auditeurs, this.verbeux);
    this.com = new Commandeur(this.jeu, this.ins, this.dec, this.verbeux);
    // fournir le commandeur aux instructions (pour intsruction « exéctuter commande »)
    this.ins.commandeur = this.com;
    // afficher le titre et la version du jeu
    this.sortieJoueur += ("<h5>" + (this.jeu.titre ? BalisesHtml.retirerBalisesHtml(this.jeu.titre) : "(jeu sans titre)"));
    // afficher la version du jeu
    if (this.jeu.version) {
      this.sortieJoueur += ("<small> " + BalisesHtml.retirerBalisesHtml(this.jeu.version) + "</small>");
    }
    this.sortieJoueur += "</h5><p>Un jeu de ";

    // afficher l’auteur du jeu
    if (this.jeu.auteur) {
      this.sortieJoueur += (BalisesHtml.retirerBalisesHtml(this.jeu.auteur));
    } else if (this.jeu.auteurs) {
      this.sortieJoueur += (BalisesHtml.retirerBalisesHtml(this.jeu.auteurs));
    } else {
      this.sortieJoueur += ("(anonyme)");
    }

    // afficher la licence du jeu
    if (this.jeu.licenceTitre) {
      if (this.jeu.licenceLien) {
        this.sortieJoueur += ('<br>Licence : <a href="' + BalisesHtml.retirerBalisesHtml(this.jeu.licenceLien) + '" target="_blank">' + BalisesHtml.retirerBalisesHtml(this.jeu.licenceTitre) + "</a>");
      } else {
        this.sortieJoueur += ("<br>Licence : " + BalisesHtml.retirerBalisesHtml(this.jeu.licenceTitre));
      }
    }
    this.sortieJoueur += "</p>";

    // ==================
    // A. NOUVELLE PARTIE
    // ==================
    if (!this.jeu.commence) {

      this.sortieJoueur += "<p>";

      // évènement COMMENCER JEU
      let evCommencerJeu = new Evenement('commencer', true, null, 0, 'jeu', ClassesRacines.Special);

      // éxécuter les instructions AVANT le jeu commence
      let resultatAvant = new Resultat(true, "", 0);
      // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score
      const declenchementsAvant = this.dec.avant(evCommencerJeu);
      // éxécuter les règles déclenchées
      declenchementsAvant.forEach(declenchement => {
        const sousResultatAvant = this.ins.executerInstructions(declenchement.instructions);
        resultatAvant.sortie += sousResultatAvant.sortie;
        resultatAvant.succes = resultatAvant.succes && sousResultatAvant.succes;
        resultatAvant.nombre += sousResultatAvant.nombre;
        resultatAvant.stopperApresRegle = resultatAvant.stopperApresRegle || sousResultatAvant.stopperApresRegle;
      });
      // ajouter la sortie
      if (resultatAvant.sortie) {
        this.ajouterSortieJoueur(BalisesHtml.doHtml(resultatAvant.sortie));
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

        // regarder où on est.
        let instruction = new Instruction(new ElementsPhrase('exécuter', null, null, null, "l’action regarder"));
        const resRegarder = this.ins.executerInstruction(instruction, null, null, null);
        this.ajouterSortieJoueur("<p>" + BalisesHtml.doHtml(resRegarder.sortie) + "</p>");
        this.jeu.commence = true;

        // // }

        // éxécuter les instructions APRÈS le jeu commence
        let resultatApres = new Resultat(true, "", 0);
        // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score
        const declenchementsApres = this.dec.apres(evCommencerJeu);
        // éxécuter les règles déclenchées
        declenchementsApres.forEach(declenchement => {
          const sousResultatApres = this.ins.executerInstructions(declenchement.instructions);
          resultatApres.sortie += sousResultatApres.sortie;
          resultatApres.succes = resultatApres.succes && sousResultatApres.succes;
          resultatApres.nombre += sousResultatApres.nombre;
          resultatApres.terminerAvantRegle = resultatApres.terminerAvantRegle || sousResultatApres.terminerAvantRegle;
          resultatApres.terminerApresRegle = resultatApres.terminerApresRegle || sousResultatApres.terminerApresRegle;
        });

        if (resultatApres.sortie) {
          this.ajouterSortieJoueur(BalisesHtml.doHtml(resultatApres.sortie));
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
      this.sortieJoueur += ("<p>" + BalisesHtml.doHtml("{/{+(reprise de la partie)+}/}") + "</p>");
      // regarder où on est.
      let instruction = new Instruction(new ElementsPhrase('exécuter', null, null, null, "l’action regarder"));
      const resRegarder = this.ins.executerInstruction(instruction, null, null, null);
      this.ajouterSortieJoueur("<p>" + BalisesHtml.doHtml(resRegarder.sortie) + "</p>");
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
    }
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

  public focusCommande() {
    setTimeout(() => {
      this.commandeInputRef.nativeElement.focus();
      this.commandeInputRef.nativeElement.selectionStart = this.commandeInputRef.nativeElement.selectionEnd = this.commande?.length ?? 0;
    }, 100);
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
        event.stopPropagation; // éviter que l’évènement soit encore émis ailleurs
        this.commandeEnCours = true; // éviter qu’il déclenche attendre touche trop tôt et continue le texte qui va être ajouté ci dessous durant cet appuis-ci

        // COMPLÉTER ET NETTOYER LA COMMANDE
        // compléter la commande
        const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande);
        this.sortieJoueur += '<p><span class="text-primary">' + BalisesHtml.doHtml(' > ' + this.commande + (this.commande !== commandeComplete ? (' (' + commandeComplete + ')') : '')) + '</span>';
        // nettoyage commmande (pour ne pas afficher une erreur en cas de faute de frappe…)
        const commandeNettoyee = Commandeur.nettoyerCommande(commandeComplete);

        // VÉREFIER FIN DE PARTIE
        // vérifier si le jeu n’est pas déjà terminé
        if (this.jeu.termine) {
          return "Le jeu est terminé.{n}Pour débuter une nouvelle partie veuillez actualiser la page web.";
        }

        // GESTION HISTORIQUE
        // ajouter à l’historique (à condition que différent du précédent)
        if (this.historiqueCommandes.length === 0 || (this.historiqueCommandes[this.historiqueCommandes.length - 1] !== commandeNettoyee)) {
          this.historiqueCommandes.push(commandeNettoyee);
          if (this.historiqueCommandes.length > this.TAILLE_DERNIERES_COMMANDES) {
            this.historiqueCommandes.shift();
          }
        }

        // EXÉCUTION DE LA COMMANDE
        const sortieCommande = this.com.executerCommande(commandeComplete.trim());
        if (sortieCommande) {
          this.ajouterSortieJoueur("<br>" + BalisesHtml.doHtml(sortieCommande));
        } else {
          this.ajouterSortieJoueur("<br>" + BalisesHtml.doHtml("{/La commande n’a renvoyé aucun retour./}"));
        }

        this.sortieJoueur += "</p>";
        this.commande = "";
        setTimeout(() => {
          this.resultatInputRef.nativeElement.scrollTop = this.resultatInputRef.nativeElement.scrollHeight;
          this.commandeInputRef.nativeElement.focus();
          this.commandeEnCours = false;
        }, 100);
      }
    }
  }



}
