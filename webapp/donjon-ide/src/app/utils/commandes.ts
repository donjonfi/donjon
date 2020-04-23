import { ElementJeu } from '../models/jeu/element-jeu';
import { ElementsJeuUtils } from './elements-jeu-utils';
import { EmplacementElement } from '../models/jeu/emplacement-element';
import { Genre } from '../models/commun/genre.enum';
import { Jeu } from '../models/jeu/jeu';
import { Localisation } from '../models/jeu/localisation';
import { OutilsCommandes } from './outils-commandes';
import { TypeElement } from '../models/commun/type-element.enum';

export class Commandes {

  constructor(
    public jeu: Jeu,
    private verbeux: boolean,
  ) {
    this.outils = new OutilsCommandes(this.jeu, this.verbeux);
    this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
  }

  outils: OutilsCommandes;
  eju: ElementsJeuUtils;


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
      const objetTrouve = this.eju.trouverElementJeu(mots, EmplacementElement.ici, false);
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
            const nouvelObjet = this.eju.prendreElementJeu(objetTrouve.id);
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

    const voisinSalle = this.eju.getSalle(this.eju.getVoisins(locDest, TypeElement.salle));
    const voisinPorte = this.eju.getPorte(this.eju.getVoisins(locDest, TypeElement.porte));

    // TODO: vérifier accès…
    if (voisinPorte && !ElementsJeuUtils.possedeUnDeCesEtats(voisinPorte, 'ouvert', 'ouverte')) {
      // La porte est fermée
      // TODO: gérer majuscule
      return (voisinPorte.intitule + " est fermé" + (voisinPorte.genre == Genre.f ? "e" : "") + ".");
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
    } else if (mots.join(" ").match(/^ouvrir .+ avec .+/i)) {
      return this.deverrouiller(mots);
    } else {
      const porte = this.eju.trouverElementJeu(mots, EmplacementElement.portes, true);
      // porte trouvée
      if (porte) {
        // porte verrouillée
        if (ElementsJeuUtils.possedeUnDeCesEtats(porte, "verrouillé", "verrouillée")) {
          return "C’est verrouillé.";
          // porte pas ouvrable
        } else if (!ElementsJeuUtils.possedeUnDeCesEtats(porte, "ouvrable")) {
          return "Je ne sais pas l’ouvrir.";
          // porte pas verrouillée et ouvrable => on l’ouvre
        } else {
          ElementsJeuUtils.ajouterEtat(porte, (porte.genre === Genre.f ? "ouverte" : "ouvert"));
          return "Á présent c'est ouvert.";
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
      const porte = this.eju.trouverElementJeu(mots, EmplacementElement.portes, true);
      // porte trouvée
      if (porte) {
        // porte verrouillée
        if (ElementsJeuUtils.possedeUnDeCesEtats(porte, "verrouillé", "verrouillée")) {
          return "C’est verrouillé.";
          // porte pas ouvrable
        } else if (!ElementsJeuUtils.possedeUnDeCesEtats(porte, "ouvrable")) {
          return "Je ne sais pas la fermer.";
          // porte pas verrouillée et ouvrable => on la ferme
        } else {
          ElementsJeuUtils.retirerEtat(porte, "ouvert", "ouverte");
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
        return this.utiliserAvec(resultExUtiliserAvec[1], resultExUtiliserAvec[3], resultExUtiliserAvec[6]);
      } else {
        // utiliser un objet seul
        const resultExUtiliserSeul = phrase.match(exUtiliserSeul);
        if (resultExUtiliserSeul) {
          return this.utiliserSeul(resultExUtiliserAvec[1], resultExUtiliserSeul[3]);
          // pas compris
        } else {
          return ("Désolé… je n’ai pas compris comment je devais utiliser cela.\nExemple de commande : « utiliser A avec B »");
        }
      }
    }
  }

  utiliserAvec(infinitif: string, elA: string, elB: string) {
    // retrouver les 2 éléments
    const eleJeuA = this.eju.trouverElementJeu(["", elA], EmplacementElement.iciEtInventaire, true);
    const eleJeuB = this.eju.trouverElementJeu(["", elB], EmplacementElement.iciEtInventaire, true);
    // Les 2 objets ont été trouvés
    if (eleJeuA && eleJeuB) {
      // 2x le même objet
      if (eleJeuA == eleJeuB) {
        return "Je ne peux pas l’utiliser sur " + (eleJeuA.genre == Genre.f ? 'elle' : 'lui') + "-même.";
        // 2x une porte
      } else if (eleJeuA.type === TypeElement.porte && eleJeuB.type === TypeElement.porte) {
        return "Hum… essayons autre chose !";
        // 1x un objet et 1x une porte
      } else if (eleJeuA.type === TypeElement.porte && eleJeuB.type !== TypeElement.porte) {
        return this.utiliserObjetAvecPorte(infinitif, eleJeuB, eleJeuA);
      } else if (eleJeuB.type === TypeElement.porte && eleJeuA.type !== TypeElement.porte) {
        return this.utiliserObjetAvecPorte(infinitif, eleJeuA, eleJeuB);
        // 2x un objet
      } else {
        return this.utiliserObjetAvecObjet(infinitif, eleJeuA, eleJeuB);
      }
    } else {
      return "Je n’ai pas trouvé ce que je dois utiliser.";
    }
  }

  utiliserObjetAvecObjet(infinitif: string, objetA: ElementJeu, objetB: ElementJeu) {
    if (objetA == objetB) {
      return "Je ne peux pas l’utiliser sur " + (objetA.genre == Genre.f ? 'elle' : 'lui') + "-même.";
    } else {
      // TODO: utiliser les objets.
      return "Il ne se passera rien.";
    }
  }

  utiliserObjetAvecPorte(infinitif: string, objet: ElementJeu, porte: ElementJeu) {
    const canDeverroullierCettePorte = ElementsJeuUtils.possedeCapaciteActionCible(objet, "déverrouiller", null, (porte.determinant + porte.nom));
    // cet objet déverrouille cette porte
    if (canDeverroullierCettePorte) {
      ElementsJeuUtils.retirerEtat(porte, "verrouillé", "verrouillée");
      // ouvrir la porte en plus si le verbe utilisé est ouvrir
      console.log("utiliserObjetAvecPorte >>> infinitif:", infinitif);
      
      if (infinitif.toLowerCase() === 'ouvrir' && ElementsJeuUtils.possedeUnDeCesEtats(porte, "ouvrable")) {
        ElementsJeuUtils.ajouterEtat(porte, (porte.genre === Genre.f ? "ouverte" : "ouvert"));
        return "Á présent c'est ouvert.";
        // sinon juste déverrouiller
      } else {
        return "À présent ce n’est plus verrouillé.";
      }

    } else {
      // cet objet peut déverrouiller AUTRE CHOSE
      const canDeverroullier = OutilsCommandes.objetPossedeCapaciteAction(objet, "déverrouiller");
      if (canDeverroullier) {
        return "Essayons de déverrouiller autre chose avec.";
      } else {
        return "Ça ne fonctionne pas.";
      }
    }
  }



  utiliserSeul(infinitif: string, elA: string) {

    let eleTrouve: ElementJeu;
    //todo: inclure les portes ou pas ?
    eleTrouve = this.eju.trouverElementJeu(["", elA], EmplacementElement.iciEtInventaire, true);

    if (eleTrouve) {

      if (eleTrouve.type === TypeElement.animal || eleTrouve.type === TypeElement.humain) {
        return "Pas de ça ici !";
      } else if (eleTrouve.type == TypeElement.decor) {
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
    let retVal: string;

    // regarder la salle actuelle
    if (mots.length === 1) {
      if (this.eju.curSalle) {
        if (this.eju.curSalle.description) {
          retVal = this.outils.calculerDescription(this.eju.curSalle.description, ++this.eju.curSalle.nbAffichageDescription)
            + this.outils.afficherObjetsCurSalle();
        } else {
          retVal = "Votre position : " + this.eju.curSalle.intitule + ".\n"
            + this.outils.afficherObjetsCurSalle();
        }
      } else {
        retVal = "Mais où suis-je ?";
      }
      // regarder un élément en particulier
    } else {
      // regarder dans les éléments de jeu
      const trouve = this.eju.trouverElementJeu(mots, EmplacementElement.iciEtInventaire, true);
      if (trouve) {
        if (trouve.description) {
          retVal = this.outils.calculerDescription(trouve.description, ++trouve.nbAffichageDescription);
        } else {
          retVal = (trouve.quantite == 1 ? "C’est… " : "Ce sont… ") + OutilsCommandes.afficherQuantiteIntitule(trouve, false, null);
        }
        if (trouve.type == TypeElement.porte) {
          retVal += "\n" + this.outils.afficherStatutPorte(trouve)
        }
        // rien trouvé
      } else {
        retVal = "Je ne vois pas ça.";
      }
    }
    return retVal;
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
