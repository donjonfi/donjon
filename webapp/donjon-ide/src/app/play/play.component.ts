import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit, OnChanges {

  @Input() jeu: Jeu;

  readonly TAILLE_DERNIERES_COMMANDES: number = 10;

  resultat: string = null;
  commande = "";
  historiqueCommandes = new Array<string>();
  curseurHistorique = -1;

  @ViewChild('txCommande') commandeInputRef: ElementRef;
  @ViewChild('taResultat') resultatInputRef: ElementRef;


  constructor() { }

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.jeu) {
      console.warn("jeu: ", this.jeu);
      this.resultat = "" + (this.jeu.titre ? (this.jeu.titre + "\n==============================") : "");
      // afficher où on est.
      this.resultat += "\n" + this.doOuSuisJe();
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
          retVal = this.doAide(mots);
          break;

        case "a": // aller
        case "al":
        case "aller":
        case "n": // nord
        case "s": // sud
        case "e": // est
        case "o": // ouest
        case "en": // entrer
        case "entrer": // entrer
        case "so": // sortir
        case "sortir":
        case "mo": // monter
        case "monter":
        case "de": // descendre
        case "descendre":
          retVal = this.doAller(mots);
          break;

        case "i": // inventaire
        case "in":
        case "inventaire":
          retVal = this.showInventaire();
          break;

        case "p": // prendre
        case "pr":
        case "at": // attraper
        case "prendre":
        case "attraper":
          retVal = this.doPrendre(mots);
          break;

        case "r": // regarder
        case "re":
        case "ob": // observer
        case "regarder":
        case "observer":
          retVal = this.doRegarder(mots);
          break;

        case "f": // fouiller
        case "fouiller":
          retVal = this.doFouiller(mots);
          break;

        case "où":
        case "ou":
          retVal = this.doOu(mots);
          break;
        case "position":
        case "x":
          retVal = this.doOuSuisJe();
          break;

        case "effacer":
        case "ef": // effacer
          retVal = this.doEffacer();
          break;

        default:
          retVal = "Désolé je n’ai pas compris « " + verbe + " »";
          break;
      }
    }

    return retVal;
  }

  doAide(mots: string[]) {
    return "Quelques commandes utiles :\n"
      + " - aide (?) : afficher les commandes de base\n"
      + " - inventaire (i) : afficher le contenu de votre inventaire\n"
      + " - aller nord (n) : aller vers le nord\n"
      + " - prendre épée (p) : prendre l’épée\n"
      + " - regarder bureau (r) : regarder le bureau\n"
      + " - fouiller coffre (f) : fouiller le coffre\n"
      + " - position (x) : afficher position actuelle\n"
      + "[ Donjon ©2018-2020 Jonathan Claes − see MIT License ]";
  }

  doEffacer() {
    this.resultat = "";
    return this.doOuSuisJe();
  }

  doOu(mots: string[]) {
    let retVal = "où… quoi ?";

    if (mots[1]) {
      // suis-je
      switch (mots[1]) {
        case "suis-je":
        case "suis je":
        case "es-tu":
        case "es tu":
        case "sommes-nous":
        case "sommes nous":
          retVal = this.doOuSuisJe();
          break;

        default:
          retVal = "Je n’ai pas compris où…";
          break;
      }
    }
    return retVal;
  }

  doOuSuisJe() {
    if (this.jeu.position == -1) {
      return "Je ne sais pas où je suis";
    } else {
      return "Vous êtes dans " + this.curSalle.déterminant + this.curSalle.intitulé + ".\n"
        + this.printCurSalle();

    }
  }



  doAller(mots: string[]) {

    switch (mots[0]) {
      case "n":
        if (this.curSalle.voisins.find)
          break;

      default:
        break;
    }

    return "Je ne sais pas encore me déplacer.";
  }

  doRegarder(mots: string[]) {
    if (this.curSalle) {
      if (this.curSalle.description) {
        return this.curSalle.description;
      } else {
        return "Vous êtes dans " + this.curSalle.déterminant + this.curSalle.intitulé + ".\n"
          + "Rien à signaler.";
      }
    } else {
      return "Mais où suis-je ?";
    }
  }

  doFouiller(mots: string[]) {
    return "Je n’ai pas le courage de fouiller ça.";
  }

  doPrendre(mots: string[]) {
    return "Je ne sais pas encore attraper.";
  }

  showInventaire() {
    return "L’inventaire est vide.";
  }

  getSalle(index: number) {
    return this.jeu.salles.find(x => x.id === index);
  }

  getVoisin(loc: Localisation) {
    let found = this.curSalle.voisins.find(x => x.localisation == loc);
    return found;
  }

  get curSalle() {
    // TODO: retenir la salle
    return this.jeu.salles.find(x => x.id === this.jeu.position);
  }

  printCurSalle() {
    return "—————————————————\n" + this.curSalle.déterminant + this.curSalle.intitulé + "\n—————————————————\n"
      + (this.curSalle.description ? (this.curSalle.description + "\n") : "")
      + this.printSorties();
  }

  printSorties() {
    let retVal: string;

    if (this.curSalle.voisins.length > 0) {
      retVal = "Sorties :";
      this.curSalle.voisins.forEach(voisin => {
        const curSalle = this.getSalle(voisin.salleIndex);
        retVal += ("\n - " + this.printLocalisation(voisin.localisation));
      });
    } else {
      retVal = "Il n’y a pas de sortie.";
    }
    return retVal;
  }

  printLocalisation(localisation: Localisation) {
    switch (localisation) {
      case Localisation.nord:
        return "nord (n)";
      case Localisation.sud:
        return "sud (s)";
      case Localisation.est:
        return "est (e)";
      case Localisation.ouest:
        return "ouest (o)";

      case Localisation.bas:
        return "descendre (de)";
      case Localisation.haut:
        return "monter (mo)";
      case Localisation.exterieur:
        return "sortir (so)";
      case Localisation.interieur:
        return "entrer (en)";

      default:
        return localisation.toString();
    }
  }

}
