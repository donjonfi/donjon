import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';
import { OutilsCommandes } from './outils-commandes';
import { Salle } from '../models/jeu/salle';

export class Commandes {

  constructor(
    public jeu: Jeu,
    private verbeux: boolean,
  ) {
    this.outils = new OutilsCommandes(this.jeu, this.verbeux);
  }


  outils: OutilsCommandes;


  // =========================================
  // COMMANDES QUI MODIFIENT LE JEU
  // =========================================

  prendre(mots: string[]) {

    // TODO: vérifier si on peut prendre l'objet...

    if (mots[1]) {

      if (mots[1] == 'les') {
        return "Une chose à la fois !";
      }

      // la, une et de (=> de la) sont féminin.
      let estFeminin = (mots[1] == 'la' || mots[1] == 'une' || (mots[1] == 'de'));
      let estSingulier = true;

      // TODO: objets dont l'intitulé comprend plusieurs mots !
      const objetTrouve = this.outils.trouverObjet(mots);
      if (objetTrouve) {
        const nouvelObjet = this.outils.prendreObjet(objetTrouve.id);
        let cible = nouvelObjet;
        // si l'inventaire contient déjà le même objet, augmenter la quantité
        let objInv = this.jeu.inventaire.objets.find(x => x.id == nouvelObjet.id);
        if (objInv) {
          objInv.quantite += 1;
          cible = objInv;
        } else {
          this.jeu.inventaire.objets.push(nouvelObjet);
        }
        // afficher le résultat à l'utilisateur
        return OutilsCommandes.afficherUnUneDesQuantite(cible, true, estFeminin, estSingulier) + cible.intituleS + " a été ajouté" + OutilsCommandes.afficherAccordSimple(cible, estFeminin, estSingulier) + " à votre inventaire.";
      } else {
        return "Je ne trouve pas ça.";
      }
    } else {
      return "prendre quoi ?";
    }
  }

  aller(mots: string[]) {

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
        voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.nord));
        break;

      case "s":
      case "su":
      case "sud":
        voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.sud));
        break;

      case "o":
      case "ou":
      case "ouest":
      case "l'ouest":
        voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.ouest));
        break;

      case "e":
      case "es":
      case "est":
      case "l'est":
        voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.est));
        break;

      case "so":
      case "sortir":
        voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.exterieur));
        break;
      case "en":
      case "entrer":
        voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.interieur));
        break;
      case "mo":
      case "monter":
      case "haut":
        voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.haut));
        break;
      case "de":
      case "descendre":
      case "bas":
        voisin = this.outils.getSalle(this.outils.getVoisin(Localisation.bas));
        break;

      default:
        break;
    }

    // TODO: vérifier accès…

    if (voisin) {
      this.jeu.position = voisin.id;
      return this.outils.afficherCurSalle();
    } else {
      return "Pas pu aller par là.";
    }
  }



  // =========================================
  // COMMANDES QUI NE MODIFIENT PAS LE JEU
  // =========================================

  aide(mots: string[]) {
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

  ou(mots: string[]) {
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
          retVal = this.ouSuisJe();
          break;

        default:
          retVal = "Je n’ai pas compris où…";
          break;
      }
    }
    return retVal;
  }

  ouSuisJe() {
    if (this.jeu.position == -1) {
      return "Je ne sais pas où je suis";
    } else {
      return "Vous êtes dans " + this.outils.curSalle.déterminant + this.outils.curSalle.intitulé + ".\n"
        + this.outils.afficherCurSalle();

    }
  }

  regarder(mots: string[]) {
    if (this.outils.curSalle) {
      if (this.outils.curSalle.description) {
        return this.outils.curSalle.description
          + this.outils.afficherObjetsCurSalle();
      } else {
        return "Vous êtes dans " + this.outils.curSalle.déterminant + this.outils.curSalle.intitulé + ".\n"
          + this.outils.afficherObjetsCurSalle();
      }
    } else {
      return "Mais où suis-je ?";
    }
  }

  fouiller(mots: string[]) {
    return "Je n’ai pas le courage de fouiller ça.";
  }

  inventaire() {
    return this.outils.afficherInventaire();
  }

  /**
   * au préalable, il faut avoir vidé la console !
   */
  effacer() {
    return this.outils.afficherCurSalle();
  }

}

