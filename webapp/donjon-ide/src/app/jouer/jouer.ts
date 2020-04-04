import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';

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
          retVal = this.printInventaire();
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
    return this.printCurSalle();
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

    let voisin: Salle = null;

    let destination: string;

    if (mots[0] === 'aller' || mots[0] === 'a') {
      if (mots[1] == 'en' || mots[1] == 'à' || mots[1] == 'au') {
        destination = mots[2];
      } else {
        destination = mots[1];
      }
    } else {
      destination = mots[0];
    }

    switch (destination) {

      case "n":
      case "no":
      case "nord":
        voisin = this.getSalle(this.getVoisin(Localisation.nord));
        break;

      case "s":
      case "su":
      case "sud":
        voisin = this.getSalle(this.getVoisin(Localisation.sud));
        break;

      case "o":
      case "ou":
      case "ouest":
      case "l'ouest":
        voisin = this.getSalle(this.getVoisin(Localisation.ouest));
        break;

      case "e":
      case "es":
      case "est":
      case "l'est":
        voisin = this.getSalle(this.getVoisin(Localisation.est));
        break;

      case "so":
      case "sortir":
        voisin = this.getSalle(this.getVoisin(Localisation.exterieur));
        break;
      case "en":
      case "entrer":
        voisin = this.getSalle(this.getVoisin(Localisation.interieur));
        break;
      case "mo":
      case "monter":
      case "haut":
        voisin = this.getSalle(this.getVoisin(Localisation.haut));
        break;
      case "de":
      case "descendre":
      case "bas":
        voisin = this.getSalle(this.getVoisin(Localisation.bas));
        break;

      default:
        break;
    }

    // TODO: vérifier accès…

    if (voisin) {
      this.jeu.position = voisin.id;
      return this.printCurSalle();
    } else {
      return "Pas pu aller par là.";
    }
  }

  doRegarder(mots: string[]) {
    if (this.curSalle) {
      if (this.curSalle.description) {
        return this.curSalle.description
          + this.printObjets();
      } else {
        return "Vous êtes dans " + this.curSalle.déterminant + this.curSalle.intitulé + ".\n"
          + this.printObjets();
      }
    } else {
      return "Mais où suis-je ?";
    }
  }

  doFouiller(mots: string[]) {
    return "Je n’ai pas le courage de fouiller ça.";
  }

  doPrendre(mots: string[]) {

    // TODO: vérifier si on peut prendre l'objet...

    if (mots[1]) {
      // TODO: objets dont l'intitulé comprend plusieurs mots !
      const objetTrouve = this.doTrouverObjet(mots);
      if (objetTrouve) {
        const nouvelObjet = this.doPrendreObjet(objetTrouve.id);
        this.jeu.inventaire.objets.push(nouvelObjet);
        return this.printUnUneDes(nouvelObjet, true) + nouvelObjet.intitulé + " a été ajouté" + this.printAccordSimple(objetTrouve) + " à votre inventaire.";
      } else {
        return "Je ne trouve pas ça.";
      }
    } else {
      return "prendre quoi ?";
    }
  }

  doPrendreObjet(objetID) {
    let retVal: Objet = null;
    // un seul exemplaire : on le retire de l'inventaire et on le retourne.
    let objetIndex = this.curSalle.inventaire.objets.findIndex(x => x.id === objetID);
    let objet = this.curSalle.inventaire.objets[objetIndex];
    if (objet.quantité == 1) {
      retVal = this.curSalle.inventaire.objets.splice(objetIndex, 1)[0];

      // plusieurs exemplaires : on le clone
    } else {
      // décrémenter quantité si pas infini
      if (objet.quantité != -1) {
        objet.quantité -= 1;
      }
      // faire une copie
      retVal = this.copierObjet(objet);
    }
    return retVal;
  }

  private copierObjet(original: Objet) {
    let retVal = new Objet();
    retVal.quantité = 1;
    retVal.nombre = Nombre.s;
    retVal.genre = original.genre;
    retVal.determinant = original.determinant;
    retVal.intitulé = original.intitulé;
    retVal.id = original.id; // TODO: quid des ID pour les clones ?
    return retVal;
  }

  doTrouverObjet(mots: string[]) {

    let retVal: Objet = null;

    // commencer par chercher avec le 2e mot
    let premierMot: string;

    if (mots[1] == 'la' || mots[1] == 'le' || mots[2] == 'du' || mots[2] == 'un' || mots[2] == 'une') {
      premierMot = mots[2];
    } else {
      premierMot = mots[1];
    }

    let objetsTrouves = this.curSalle.inventaire.objets.filter(x => x.intitulé.startsWith(premierMot) && x.quantité !== 0);
    if (objetsTrouves.length == 1) {
      retVal = objetsTrouves[0];
    } else if (objetsTrouves.length > 1) {
      // TODO: ajouter des mots en plus
    }
    return retVal;
  }

  getSalle(index: number) {
    return this.jeu.salles.find(x => x.id === index);
  }

  getVoisin(loc: Localisation) {
    console.log("getVoisin:", loc);

    let found = this.curSalle.voisins.find(x => x.localisation == loc);

    console.log("  >> found:", found);

    return found ? found.salleIndex : -1;
  }

  get curSalle() {
    // TODO: retenir la salle
    const retVal = this.jeu.salles.find(x => x.id === this.jeu.position);
    if (!retVal) {
      console.warn("Pas trouvé la curSalle:", this.jeu.position);
    }
    return retVal;
  }

  printCurSalle() {
    if (this.curSalle) {
      return "—————————————————\n" + this.curSalle.déterminant + this.curSalle.intitulé + "\n—————————————————\n"
        + (this.curSalle.description ? (this.curSalle.description + "\n") : "")
        + this.printSorties()
    } else {
      console.warn("Pas trouvé de curSalle :(");
      return "Je suis où moi ? :(";
    }

  }

  printSorties() {
    let retVal: string;

    if (this.curSalle.voisins.length > 0) {
      retVal = "Sorties :";
      this.curSalle.voisins.forEach(voisin => {
        retVal += ("\n - " + this.printLocalisation(voisin.localisation, this.curSalle.id, voisin.salleIndex));
      });
    } else {
      retVal = "Il n’y a pas de sortie.";
    }
    return retVal;
  }

  printInventaire() {
    let retVal: string;
    let objets = this.jeu.inventaire.objets.filter(x => x.quantité !== 0);
    if (objets.length == 0) {
      retVal = "\nVotre inventaire est vide.";
    } else {
      retVal = "\nContenu de l'inventaire :";
      objets.forEach(o => {
        retVal += "\n - " + (this.printUnUneDes(o, false) + o.intitulé);
      });
    }
    return retVal;
  }

  printObjets() {
    let retVal: string;

    let objets = this.curSalle.inventaire.objets.filter(x => x.quantité !== 0);

    if (objets.length == 0) {
      retVal = "\nJe ne vois rien ici.";
    } else {
      retVal = "\nContenu de la pièce :";
      objets.forEach(o => {
        retVal += "\n - Il y a " + (this.printUnUneDes(o, false) + o.intitulé);
      });
    }
    return retVal;
  }

  printUnUneDes(o: Objet, majuscule: boolean) {
    let retVal: string;
    if (o.nombre == Nombre.s) {
      if (o.genre == Genre.f) {
        retVal = majuscule ? "Une " : "une ";
      } else {
        retVal = majuscule ? "Un " : "un ";
      }
    } else {
      retVal = majuscule ? "Des " : "des ";
    }
    return retVal;
  }

  printAccordSimple(o: Objet) {
    let retVal: string;
    if (o.nombre == Nombre.s) {
      if (o.genre == Genre.f) {
        retVal = "e";
      } else {
        retVal = "";
      }
    } else {
      if (o.genre == Genre.f) {
        retVal = "es";
      } else {
        retVal = "s";
      }
    }
    return retVal;
  }

  printLocalisation(localisation: Localisation, curSalleIndex: number, voisinIndex: number) {
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
        return "descendre " + this.getSalle(voisinIndex)?.intitulé + " (de)";
      case Localisation.haut:
        return "monter " + this.getSalle(voisinIndex)?.intitulé + " (mo)";
      case Localisation.exterieur:
        return "sortir " + this.getSalle(curSalleIndex)?.intitulé + " (so)";
      case Localisation.interieur:
        return "entrer " + this.getSalle(voisinIndex)?.intitulé + " (en)";

      default:
        return localisation.toString();
    }
  }

}
