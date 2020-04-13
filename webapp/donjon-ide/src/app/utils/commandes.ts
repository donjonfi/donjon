import { Genre } from '../models/commun/genre.enum';
import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';
import { Nombre } from '../models/commun/nombre.enum';
import { Objet } from '../models/jeu/objet';
import { OutilsCommandes } from './outils-commandes';
import { Porte } from '../models/jeu/porte';
import { Salle } from '../models/jeu/salle';
import { TypeElement } from '../models/commun/type-element.enum';

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

    if (this.verbeux) {
      console.log("commande: PRENDRE >>>", mots);
    }

    // TODO: vérifier si on peut prendre l'objet...

    if (mots[1]) {

      if (mots[1] == 'les') {
        return "Une chose à la fois !";
      }

      // la, une et de (=> de la) sont féminin.
      let estFeminin = (mots[1] == 'la' || mots[1] == 'une' || (mots[1] == 'de'));
      let estSingulier = true;

      // TODO: objets dont l'intitulé comprend plusieurs mots !
      const objetTrouve = this.outils.trouverObjet(mots, false, false);
      if (objetTrouve) {

        if (this.verbeux) {
          console.log("l’ojet a été trouvé:", objetTrouve);
        }

        switch (objetTrouve.type) {
          // on ne prend pas les animaux
          case TypeElement.animal:
            if (this.verbeux) {
              console.log("on ne prend pas les animaux.");
            }
            return "Ça ne me parait pas très prudent.";
            break;
          // on ne prend pas les décors
          case TypeElement.decor:
            if (this.verbeux) {
              console.log("on ne prend pas les décors.");
            }
            return "Je préfère ne pas m’encombrer avec ça.";
            break;
          // prendre l’élément
          default:
            if (this.verbeux) {
              console.log("on prend les autres types d’éléments.");
            }
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
            break;
        }

      } else {
        return "Je ne trouve pas ça.";
      }
    } else {
      return "prendre quoi ?";
    }
  }

  aller(mots: string[]) {

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

    let locDest: Localisation = Localisation.inconnu;

    switch (destination) {

      case "n":
      case "no":
      case "nord":
        locDest = Localisation.nord;
        break;

      case "s":
      case "su":
      case "sud":
        locDest = Localisation.sud;
        break;

      case "o":
      case "ou":
      case "ouest":
      case "l'ouest":
        locDest = Localisation.ouest;
        break;

      case "e":
      case "es":
      case "est":
      case "l'est":
        locDest = Localisation.est;
        break;

      case "so":
      case "sortir":
        locDest = Localisation.exterieur;
        break;
      case "en":
      case "entrer":
        locDest = Localisation.interieur;
        break;
      case "mo":
      case "monter":
      case "haut":
        locDest = Localisation.haut;
        break;
      case "de":
      case "descendre":
      case "bas":
        locDest = Localisation.bas;
        break;

      default:
        break;
    }

    const voisinSalle = this.outils.getSalle(this.outils.getVoisinSalle(locDest));
    const voisinPorte = this.outils.getPorte(this.outils.getVoisinPorte(locDest));

    // TODO: vérifier accès…
    if (voisinPorte && !OutilsCommandes.portePossedeUnDeCesEtats(voisinPorte, 'ouvert', 'ouverte')) {
      // TODO: gérer majuscule
      return (voisinPorte.intitule ? voisinPorte.intitule : (voisinPorte.determinant + voisinPorte.nom) + " est fermé" + (voisinPorte.genre == Genre.f ? "e" : "") + ".");
    } else {
      if (voisinPorte) {
        console.log("porte ouverte :)");
      } else {
        console.log("pas de porte");
      }
      if (voisinSalle) {
        this.jeu.position = voisinSalle.id;
        return this.outils.afficherCurSalle();
      } else {
        return "Pas pu aller par là.";
      }
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
      // return "Votre position : " + (this.outils.curSalle.intitule ? (this.outils.curSalle.intitule) : (this.outils.curSalle.determinant + this.outils.curSalle.nom)) + ".\n"
      return this.outils.afficherCurSalle();

    }
  }

  deverrouiller(mots: string[]) {
    if (mots.length == 1) {
      return "Déverrouiller quoi ?";
    } else if (mots.length < 4) {
      return "Déverrouiller comment ?";
    } else {
      return this.utiliser(mots);
    }
  }

  ouvrir(mots: string[]) {
    if (mots.length == 1) {
      return "Ouvrir quoi ?";
    } else {
      const porte = this.outils.trouverPorte(mots);
      // porte trouvée
      if (porte) {
        // porte verrouillée
        if (OutilsCommandes.portePossedeUnDeCesEtats(porte, "verrouillé", "verrouillée")) {
          return "C’est verrouillé.";
          // porte pas ouvrable
        } else if (!OutilsCommandes.portePossedeUnDeCesEtats(porte, "ouvrable")) {
          return "Je ne sais pas l’ouvrir.";
          // porte pas verrouillée et ouvrable => on l’ouvre
        } else {
          porte.etat.push((porte.genre == Genre.f ? "ouverte" : "ouvert"));
          return "C’est ouvert";
        }
        // pas trouvé la porte
      } else {
        return "Je n’ai pas trouvé ça.";
      }
    }
  }

  fermer(mots: string[]) {
    if (mots.length == 1) {
      return "Fermer quoi ?";
    } else {
      const porte = this.outils.trouverPorte(mots);
      // porte trouvée
      if (porte) {
        // porte verrouillée
        if (OutilsCommandes.portePossedeUnDeCesEtats(porte, "verrouillé", "verrouillée")) {
          return "C’est verrouillé.";
          // porte pas ouvrable
        } else if (!OutilsCommandes.portePossedeUnDeCesEtats(porte, "ouvrable")) {
          return "Je ne sais pas la fermer.";
          // porte pas verrouillée et ouvrable => on la ferme
        } else {
          this.retirerEtat(porte, "ouvert", "ouverte");
          return "C’est fermé.";
        }
        // pas trouvé la porte
      } else {
        return "Je n’ai pas trouvé ça.";
      }
    }
  }

  utiliser(mots: string[]) {
    if (mots.length == 1) {
      return "Utiliser quoi ?";
    } else {
      const phrase = mots.join(" ");
      // Utiliser AVEC => action (1), déterminantA (2), élémentA (3), avec/sur (4) déterminantB (5), élémentB (6)
      // const exUtiliserAvec = /^(\S+(?:er|ir|re)) (la |le |un |une |l’|l'|)(.+) (avec|sur) (la |le |un |une |l’|l'|)(.+)/i;
      const exUtiliserAvec = /^(\S+) (la |le |un |une |l’|l'|)(.+) (avec|sur) (la |le |un |une |l’|l'|)(.+)/i;
      // Utiliser SEUL => action (1), déterminantA (2), élémentA (3)
      // const exUtiliserSeul = /^(\S+(?:er|ir|re)) (la |le |un |une |l’|l'|)(.+)/i;
      const exUtiliserSeul = /^(\S+) (la |le |un |une |l’|l'|)(.+)/i;

      const resultExUtiliserAvec = phrase.match(exUtiliserAvec);

      // utiliser un objet avec un autre objet
      if (resultExUtiliserAvec) {
        return this.utiliserAvec(resultExUtiliserAvec[3], resultExUtiliserAvec[6]);
      } else {
        // utiliser un objet seul
        const resultExUtiliserSeul = phrase.match(exUtiliserSeul);
        if (resultExUtiliserSeul) {
          return this.utiliserSeul(resultExUtiliserSeul[3]);
          // pas compris
        } else {
          return ("Désolé… je n’ai pas compris comment je devais utiliser cela.\nExemple de commande : « utiliser A avec B »");
        }
      }
    }
  }

  utiliserAvec(elA: string, elB: string) {

    let objetTrouveA: Objet;
    let objetTrouveB: Objet;
    let porteTrouveeA: Porte;
    let porteTrouveeB: Porte;

    objetTrouveA = this.outils.trouverObjet(["", elA]);
    if (!objetTrouveA) {
      porteTrouveeA = this.outils.trouverPorte(["", elA]);
    }

    objetTrouveB = this.outils.trouverObjet(["", elB]);
    if (!objetTrouveB) {
      porteTrouveeB = this.outils.trouverPorte(["", elB]);
    }

    if (objetTrouveA && objetTrouveB) {
      return this.utiliserObjetAvecObjet(objetTrouveA, objetTrouveB);
    } else if (objetTrouveA && porteTrouveeB) {
      return this.utiliserObjetAvecPorte(objetTrouveA, porteTrouveeB);
    } else if (porteTrouveeA && objetTrouveB) {
      return this.utiliserObjetAvecPorte(objetTrouveB, porteTrouveeA);
    } else if (porteTrouveeA && porteTrouveeB) {
      if (porteTrouveeA == porteTrouveeB) {
        return "Je ne peux pas l’utiliser sur " + (porteTrouveeA.genre == Genre.f ? 'elle' : 'lui') + "-même.";
      } else {
        return "Hum… essayons autre chose !";
      }
    } else {
      return "Je n’ai pas trouvé ce que je dois utiliser.";
    }
  }

  utiliserObjetAvecObjet(objetA: Objet, objetB: Objet) {
    if (objetA == objetB) {
      return "Je ne peux pas l’utiliser sur " + (objetA.genre == Genre.f ? 'elle' : 'lui') + "-même.";
    } else {
      // TODO: utiliser les objets.
      return "Il ne se passera rien.";
    }
  }

  utiliserObjetAvecPorte(objet: Objet, porte: Porte) {
    let canDeverroullierCettePorte = OutilsCommandes.objetPossedeCapaciteActionCible(objet, "déverrouiller", null, (porte.determinant + porte.nom));
    // cet objet déverrouille cette porte
    if (canDeverroullierCettePorte) {
      this.retirerEtat(porte, "verrouillé", "verrouillée");
      return "À présent ce n’est plus verrouillé.";
    } else {
      // cet objet peut déverrouiller AUTRE CHOSE
      let canDeverroullier = OutilsCommandes.objetPossedeCapaciteAction(objet, "déverrouiller");
      if (canDeverroullier) {
        return "Essayons de déverrouiller autre chose avec.";
      } else {
        return "Ça ne fonctionne pas.";
      }
    }
  }

  retirerEtat(porte: Porte, etatA: string, etatB: string) {
    // retirer l’état verrouillé
    let indexEtat = -1;
    if (OutilsCommandes.portePossedeUnDeCesEtats(porte, etatA)) {
      indexEtat = porte.etat.findIndex(x => x == etatA);
      if (indexEtat != -1) {
        porte.etat.splice(indexEtat, 1);
      } else {
        console.error("Pas pu retirer l'état");
      }
    } else if (OutilsCommandes.portePossedeUnDeCesEtats(porte, etatB)) {
      indexEtat = porte.etat.findIndex(x => x == etatB);
      if (indexEtat != -1) {
        porte.etat.splice(indexEtat, 1);
      } else {
        console.error("Pas pu retirer l'état");
      }
    } else {
      console.log("retirerEtat >> Rien à retirer.");
    }
  }

  utiliserSeul(elA: string) {

    let objetTrouveA: Objet;
    objetTrouveA = this.outils.trouverObjet(["", elA]);

    if (objetTrouveA) {

      if (objetTrouveA.type == TypeElement.animal || objetTrouveA.type == TypeElement.humain) {
        return "Pas de ça ici !";
      } else if (objetTrouveA.type == TypeElement.decor) {
        return "Et comment comptes-tu t’y prendre ?";
      } else {
        return "Et si on combinait avec autre chose ?";
      }
    } else {
      return "Je n’ai pas trouvé ce que je dois utiliser.";
    }
  }

  attaquer(mots: string[]) {
    if (mots.length == 1) {
      return "Attaquer qui ?";
    } else {
      // TODO: changer ça…
      return "Je ne suis pas quelqu’un de violent.";
    }
  }

  examiner(mots: string[]) {

    if (mots.length == 1) {
      return "Que dois-je examiner ?";
    } else {
      // TODO: changer ça…
      return this.regarder(mots);
    }

  }

  regarder(mots: string[]) {

    // regarder la salle actuelle
    if (mots.length == 1) {
      if (this.outils.curSalle) {
        if (this.outils.curSalle.description) {
          return this.outils.curSalle.description
            + this.outils.afficherObjetsCurSalle();
        } else {
          return "Votre position : " + (this.outils.curSalle.intitule ? (this.outils.curSalle.intitule) : (this.outils.curSalle.determinant + this.outils.curSalle.nom)) + ".\n"
            + this.outils.afficherObjetsCurSalle();
        }
      } else {
        return "Mais où suis-je ?";
      }
      // regarder un élément en particulier
    } else {
      // regarder dans les objets
      const trouve = this.outils.trouverObjet(mots, false, true);
      if (trouve) {
        if (trouve.description) {
          return trouve.description;
        } else {
          return (trouve.quantite == 1 ? "C’est… " : "Ce sont… ") + OutilsCommandes.afficherQuantiteIntituleObjet(trouve, false, null);
        }
        // pas trouvé dans les objets
      } else {
        // regarder dans les portes
        const trouve = this.outils.trouverPorte(mots);
        if (trouve) {
          let retVal = "";
          if (trouve.description) {
            retVal = trouve.description;
          } else {
            retVal = (trouve.nombre == Nombre.s ? "C’est… " : "Ce sont… ") + (trouve.intitule ? trouve.intitule : (trouve.determinant + trouve.nom));
          }
          retVal += "\n" + this.outils.afficherStatutPorte(trouve);
          return retVal;
          // rien trouvé
        } else {
          return "Je ne vois pas ça.";
        }
      }
    }
  }

  sorties(mots: string[]) {
    return this.outils.afficherSorties();
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

