import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Commandes } from '../utils/commandes';
import { Genre } from '../models/commun/genre.enum';
import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';
import { Nombre } from '../models/commun/nombre.enum';
import { Objet } from '../models/jeu/objet';
import { Salle } from '../models/jeu/salle';

@Component({
  selector: 'app-jouer',
  templateUrl: './jouer.component.html',
  styleUrls: ['./jouer.component.scss']
})
export class JouerComponent implements OnInit, OnChanges {

  @Input() jeu: Jeu;

  readonly TAILLE_DERNIERES_COMMANDES: number = 10;

  resultat: string = null;
  commande = "";
  historiqueCommandes = new Array<string>();
  curseurHistorique = -1;

  private com: Commandes;

  @ViewChild('txCommande') commandeInputRef: ElementRef;
  @ViewChild('taResultat') resultatInputRef: ElementRef;


  constructor() { }

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.jeu) {
      console.warn("jeu: ", this.jeu);

      this.com = new Commandes(this.jeu);

      this.resultat = "" + (this.jeu.titre ? (this.jeu.titre + "\n==============================") : "");
      // afficher où on est.
      this.resultat += "\n" + this.com.ouSuisJe();
    } else {
      console.warn("pas de jeu :(");
    }
  }

  /**
   * Historique: aller en arrière.
   * @param event
   */
  onKeyDownArrowUp(event) {
    if (this.curseurHistorique < (this.historiqueCommandes.length - 1)) {
      this.curseurHistorique += 1;
      const index = this.historiqueCommandes.length - this.curseurHistorique - 1;
      this.commande = this.historiqueCommandes[index];
      this.focusCommande();
    }
  }

  /**
   * Historique: revenir en avant
   */
  onKeyDownArrowDown(event) {
    if (this.curseurHistorique > 0) {
      this.curseurHistorique -= 1;
      const index = this.historiqueCommandes.length - this.curseurHistorique - 1;
      this.commande = this.historiqueCommandes[index];
      this.focusCommande();
    } else {
      this.commande = "";
    }
  }

  private focusCommande() {
    setTimeout(() => {
      this.commandeInputRef.nativeElement.focus();
      this.commandeInputRef.nativeElement.selectionStart = this.commandeInputRef.nativeElement.selectionEnd = this.commande.length;
    }, 100);
  }

  onKeyDownTab(event) {
    switch (this.commande) {

      case 'n':
        this.commande = "aller au nord";
        this.focusCommande();
        break;

      case 's':
        this.commande = "aller au sud";
        this.focusCommande();
        break;

      case 'e':
        this.commande = "aller à l’est";
        this.focusCommande();
        break;

      case 'o':
        this.commande = "aller à l’ouest";
        this.focusCommande();
        break;

      case 'r':
      case 're':
        this.commande = "regarder ";
        this.focusCommande();
        break;

      case 'ob':
        this.commande = "observer ";
        this.focusCommande();
        break;

      case 'i':
      case 'in':
        this.commande = "inventaire";
        this.focusCommande();
        break;

      case 'p':
      case 'pr':
        this.commande = "prendre ";
        this.focusCommande();
        break;

      default:
        break;
    }
  }

  /**
   * Valider une commande.
   * @param event 
   */
  onKeyDownEnter(event) {
    this.curseurHistorique = -1;
    if (this.commande && this.commande.trim() !== "") {
      const result = this.doCommande(this.commande);
      this.resultat += "\n > " + this.commande;
      this.resultat += "\n" + result;
      this.commande = "";
      setTimeout(() => {
        this.resultatInputRef.nativeElement.scrollTop = this.resultatInputRef.nativeElement.scrollHeight;
        this.commandeInputRef.nativeElement.focus();
      }, 100);

    }
  }

  doCommande(commande: string): string {

    // GESTION HISTORIQUE
    // ajouter à l’historique (à condition que différent du précédent)
    if (this.historiqueCommandes.length === 0 || (this.historiqueCommandes[this.historiqueCommandes.length - 1] !== commande)) {
      this.historiqueCommandes.push(commande);
      if (this.historiqueCommandes.length > this.TAILLE_DERNIERES_COMMANDES) {
        this.historiqueCommandes.shift();
      }
    }

    // COMPRENDRE LA COMMANDE
    const mots = commande.trim().split(" ");

    let retVal = null;

    if (mots.length > 0) {
      const verbe = mots[0];

      switch (verbe.toLowerCase()) {

        case "?":
        case "aide":
        case "perdu":
          retVal = this.com.aide(mots);
          break;

        case "a": // aller
        case "al":
        case "aller":
        case "n": // nord
        case "no": // nord
        case "nord":
        case "s": // sud
        case "su": // sud
        case "sud":
        case "e": // est
        case "es": // est
        case "est":
        case "o": // ouest
        case "ou": // ouest
        case "ouest":
        case "en": // entrer
        case "entrer": // entrer
        case "so": // sortir
        case "sortir":
        case "mo": // monter
        case "monter":
        case "de": // descendre
        case "descendre":
          retVal = this.com.aller(mots);
          break;

        case "i": // inventaire
        case "in":
        case "inventaire":
          retVal = this.com.inventaire();
          break;

        case "p": // prendre
        case "pr":
        case "at": // attraper
        case "prendre":
        case "attraper":
          retVal = this.com.prendre(mots);
          break;

        case "r": // regarder
        case "re":
        case "ob": // observer
        case "regarder":
        case "observer":
          retVal = this.com.regarder(mots);
          break;

        case "f": // fouiller
        case "fouiller":
          retVal = this.com.fouiller(mots);
          break;

        case "où":
        case "ou":
          retVal = this.com.ou(mots);
          break;
        case "position":
        case "x":
          retVal = this.com.ouSuisJe();
          break;

        case "effacer":
        case "ef": // effacer
          this.resultat = "";
          retVal = this.com.effacer();
          break;

        default:
          retVal = "Désolé je n’ai pas compris « " + verbe + " »";
          break;
      }
    }

    return retVal;
  }

}
