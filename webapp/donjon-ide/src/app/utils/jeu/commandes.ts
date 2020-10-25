import { EClasseRacine } from '../../models/commun/classe';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { EmplacementElement } from '../../models/jeu/emplacement-element';
import { Genre } from '../../models/commun/genre.enum';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Instructions } from './instructions';
import { Jeu } from '../../models/jeu/jeu';
import { Localisation } from '../../models/jeu/localisation';
import { OutilsCommandes } from './outils-commandes';

export class Commandes {

  constructor(
    public jeu: Jeu,
    public ins: Instructions,
    private verbeux: boolean,
  ) {
    this.outils = new OutilsCommandes(this.jeu, this.ins, this.verbeux);
    this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
  }

  outils: OutilsCommandes;
  eju: ElementsJeuUtils;


  // =========================================
  // COMMANDES QUI MODIFIENT LE JEU
  // =========================================

  // prendre(els: ElementsPhrase) {

  //   if (els.sujet) {

  //     if (els.sujet.determinant === 'les') {
  //       return "Une chose à la fois !";
  //     }

  //     // la, une et de (=> de la) sont féminin.
  //     let estFeminin = (els.sujet.determinant == 'la' || els.sujet.determinant == 'une' || (els.sujet.determinant == 'de'));
  //     let estSingulier = true;

  //     // TODO: objets dont l'intitulé comprend plusieurs mots !
  //     const objetTrouve = this.eju.trouverElementJeu(els.sujet, EmplacementElement.ici, true, false);
  //     if (objetTrouve === -1) {
  //       return "J'ai trouvé plusieurs éléments correspondant à " + els.sujet.nom + ". Pouvez-vous être plus précis ?";
  //     } else if (objetTrouve) {
  //       if (this.verbeux) {
  //         console.log("l’ojet a été trouvé:", objetTrouve);
  //       }

  //       // on ne peut pas prendre les éléments fixés
  //       if (ElementsJeuUtils.possedeCetEtatAutoF(objetTrouve, "fixé")) {
  //         return "C’est fixé.";
  //       }

  //       // vérîfier le type de l’objet
  //       switch (objetTrouve.type) {
  //         // on ne prend pas les animaux
  //         case ClasseRacine.animal:
  //           if (this.verbeux) {
  //             console.log("on ne prend pas les animaux.");
  //           }
  //           return "Ça ne me parait pas très prudent.";
  //           break;
  //         // on ne prend pas les personnes
  //         case ClasseRacine.personne:
  //           if (this.verbeux) {
  //             console.log("on ne prend pas les personnes.");
  //           }
  //           return "Dites donc !";
  //           break;
  //         // on ne prend pas les décors
  //         // case ClasseRacine.decor:
  //         //   if (this.verbeux) {
  //         //     console.log("on ne prend pas les décors.");
  //         //   }
  //         //   return "Je préfère ne pas m’encombrer avec ça.";
  //         //   break;
  //         // prendre l’élément
  //         default:
  //           if (this.verbeux) {
  //             console.log("on prend les autres types d’éléments.");
  //           }
  //           const nouvelObjet = this.eju.prendreElementJeu(objetTrouve.id);
  //           let cible = nouvelObjet;
  //           // si l'inventaire contient déjà le même objet, augmenter la quantité
  //           let objInv = this.jeu.inventaire.objets.find(x => x.id == nouvelObjet.id);
  //           if (objInv) {
  //             objInv.quantite += 1;
  //             cible = objInv;
  //           } else {
  //             this.jeu.inventaire.objets.push(nouvelObjet);
  //           }
  //           // afficher le résultat à l'utilisateur
  //           return OutilsCommandes.afficherUnUneDesQuantite(cible, true, estFeminin, estSingulier) + cible.intituleS + " a été ajouté" + OutilsCommandes.afficherAccordSimple(cible, estFeminin, estSingulier) + " à votre inventaire.";
  //           break;
  //       }

  //     } else {
  //       return "Je ne trouve pas ça.";
  //     }
  //   } else {
  //     return "prendre quoi ?";
  //   }
  // }

  // jeter(els: ElementsPhrase) {
  //   const objetTrouve = this.eju.trouverElementJeu(els.sujet, EmplacementElement.inventaire, true, false);
  //   if (objetTrouve === -1) {
  //     return "J'ai trouvé plusieurs éléments correspondant à " + els.sujet.nom + ". Pouvez-vous être plus précis ?";
  //   } else if (objetTrouve) {
  //     const result = this.jeu.inventaire.objets.splice(this.jeu.inventaire.objets.findIndex(x => x.id === objetTrouve.id), 1);
  //     this.eju.curLieu.inventaire.objets.push(result[0]);
  //     return "Vous jetez ça.";
  //   } else {
  //     return "Je ne possède pas ça.";
  //   }
  // }

  // donner(els: ElementsPhrase) {

  //   if (els.sujetComplement == null) {
  //     return "Donner ça à qui ?";
  //   } else {
  //     // trouver l’élément à donner
  //     const elementTrouve = this.eju.trouverElementJeu(els.sujet, EmplacementElement.inventaire, true, false);
  //     if (elementTrouve === -1) {
  //       return "J'ai trouvé plusieurs éléments correspondant à " + els.sujet.nom + ". Pouvez-vous être plus précis ?";
  //     } else if (elementTrouve) {

  //       // trouver le destinataire
  //       const destinataireTrouve = this.eju.trouverElementJeu(els.sujetComplement, EmplacementElement.ici, false, false);

  //       if (destinataireTrouve === -1) {
  //         return " J’ai trouvé plusieurs éléments correspondants à " + els.sujetComplement.nom + ". Pouvez-vous être plus précis ?";
  //       } else if (destinataireTrouve) {
  //         const result = this.jeu.inventaire.objets.splice(this.jeu.inventaire.objets.findIndex(x => x.id === elementTrouve.id), 1);
  //         destinataireTrouve.inventaire.objets.push(result[0]);
  //         return "Vous donnez ça.";
  //       } else {
  //         return "Je ne vois pas le destinataire.";
  //       }

  //     } else {
  //       return "Je ne possède pas ça.";
  //     }
  //   }

  // }

  aller(els: ElementsPhrase) {

    let destination: string;

    let locDest: Localisation = Localisation.inconnu;

    switch (els.infinitif) {

      case "aller":
        // vérifier la direction
        switch (els.sujet.nom) {
          case "n":
          case "nord":
            locDest = Localisation.nord;
            break;

          case "s":
          case "sud":
            locDest = Localisation.sud;
            break;

          case "o":
          case "ouest":
          case "l'ouest":
            locDest = Localisation.ouest;
            break;

          case "e":
          case "est":
          case "l'est":
            locDest = Localisation.est;
            break;

          default:
            break;
        }
        break;

      case "sortir":
        locDest = Localisation.exterieur;
        break;
      case "entrer":
        locDest = Localisation.interieur;
        break;
      case "monter":
        locDest = Localisation.haut;
        break;
      case "descendre":
        locDest = Localisation.bas;
        break;

      default:
        break;
    }

    const voisinLieu = this.eju.getLieu(this.eju.getVoisins(locDest, EClasseRacine.lieu));
    const voisinPorte = this.eju.getObjet(this.eju.getVoisins(locDest, EClasseRacine.porte));

    // TODO: vérifier accès…
    if (voisinPorte && !ElementsJeuUtils.possedeCetEtatAutoF(voisinPorte, 'ouvert')) {
      // La porte est fermée
      // TODO: gérer majuscule
      return (voisinPorte.intitule + " est fermé" + (voisinPorte.genre == Genre.f ? "e" : "") + ".");
    } else {
      if (voisinPorte) {
        console.log("porte ouverte :)");
      } else {
        console.log("pas de porte");
      }
      if (voisinLieu) {
        this.jeu.joueur.position.cibleType = EClasseRacine.lieu;
        this.jeu.joueur.position.cibleId = voisinLieu.id;

        this.eju.majVisibiliteDesObjets();

        return this.outils.afficherCurLieu();
      } else {
        return "Pas pu aller par là.";
      }
    }

  }



  // =========================================
  // COMMANDES QUI NE MODIFIENT PAS LE JEU
  // =========================================

  aide(els: ElementsPhrase) {
    if (!els.sujet) {
      return "Quelques commandes utiles :\n"
        + " - {-inventaire-} : afficher le contenu de votre inventaire\n"
        + " - {-aller nord-} : aller vers le nord\n"
        + " - {-examiner table-} : examiner la table (pour y trouver des objets)\n"
        + " - {-prendre épée-} : prendre l’épée\n"
        + " - {-position-} : afficher votre position actuelle\n"
        + " - {-ouvrir porte avec clé dorée-} : ouvrir la porte à l’aide de la clé dorée\n"
        + "{+[ Donjon ©2018-2020 Jonathan Claes − see MIT License ]+}";
    } else {
      return "Je n'ai pas encore d’informations à propos de ça.";
    }
  }

  ouSuisJe() {
    if (!this.jeu.joueur.position) {
      return "Je ne sais pas où je suis";
    } else {
      // return "Votre position : " + (this.outils.curLieu.intitule ? (this.outils.curLieu.intitule) : (this.curLieu.determinant + this.outils.curLieu.nom)) + ".\n"
      return this.outils.afficherCurLieu();
    }
  }

  // deverrouiller(els: ElementsPhrase) {
  //     return this.utiliser(els);
  // }

  // ouvrir(els: ElementsPhrase) {
  //   if (!els.sujet) {
  //     return "Ouvrir quoi ?";
  //   } else if (els.infinitif == 'ouvrir' && els.preposition == 'avec') {
  //     return this.deverrouiller(els);
  //   } else {
  //     const porte = this.eju.trouverElementJeu(els.sujet, EmplacementElement.portes, false, true);
  //     // plusiers portes trouvées
  //     if (porte === -1) {
  //       return "J'ai trouvé plusieurs éléments correspondant à " + els.sujet.nom + ". Pouvez-vous être plus précis ?";
  //       // porte trouvée
  //     } else if (porte) {
  //       // porte verrouillée
  //       if (ElementsJeuUtils.possedeCetEtatAutoF(porte, "verrouillé")) {
  //         return "C’est verrouillé.";
  //         // porte pas ouvrable
  //       } else if (!ElementsJeuUtils.possedeCetEtat(porte, "ouvrable")) {
  //         return "Je ne sais pas l’ouvrir.";
  //         // porte pas verrouillée et ouvrable => on l’ouvre
  //       } else {
  //         ElementsJeuUtils.ajouterEtat(porte, (porte.genre === Genre.f ? "ouverte" : "ouvert"));
  //         return "Á présent c'est ouvert.";
  //       }
  //       // pas trouvé la porte
  //     } else {
  //       return "Je n’ai pas trouvé ça (porte).";
  //     }
  //   }
  // }

  // fermer(els: ElementsPhrase) {
  //   if (!els.sujet) {
  //     return "Fermer quoi ?";
  //   } else {
  //     const porte = this.eju.trouverElementJeu(els.sujet, EmplacementElement.portes, false, true);
  //     if (porte === -1) {
  //       return "J'ai trouvé plusieurs éléments correspondant à " + els.sujet.nom + ". Pouvez-vous être plus précis ?";
  //       // porte trouvée
  //     } else if (porte) {
  //       // porte verrouillée
  //       if (ElementsJeuUtils.possedeCetEtatAutoF(porte, "verrouillé")) {
  //         return "C’est verrouillé.";
  //         // porte pas ouvrable
  //       } else if (!ElementsJeuUtils.possedeCetEtat(porte, "ouvrable")) {
  //         return "Je ne sais pas la fermer.";
  //         // porte pas verrouillée et ouvrable => on la ferme
  //       } else {
  //         ElementsJeuUtils.retirerEtat(porte, "ouvert", "ouverte");
  //         return "C’est fermé.";
  //       }
  //       // pas trouvé la porte
  //     } else {
  //       return "Je n’ai pas trouvé ça.";
  //     }
  //   }
  // }

  // utiliser(els: ElementsPhrase) {
  //   if (!els.sujet) {
  //     return "Utiliser quoi ?";
  //   } else {
  //     // utiliser un objet avec un autre objet
  //     if (els.preposition && els.sujetComplement) {
  //       return this.utiliserAvec(els.infinitif, els.sujet, els.sujetComplement);
  //     } else if (els.sujet) {
  //       // utiliser un objet seul
  //       return this.utiliserSeul(els.infinitif, els.sujet);
  //       // pas compris
  //     } else {
  //       return ("Désolé… je n’ai pas compris comment je devais utiliser cela.\nExemple de commande : « utiliser A avec B »");
  //     }
  //   }
  // }


  // utiliserAvec(infinitif: string, elA: GroupeNominal, elB: GroupeNominal) {
  //   // retrouver les 2 éléments
  //   const eleJeuA = this.eju.trouverElementJeu(elA, EmplacementElement.iciEtInventaire, true, true);
  //   const eleJeuB = this.eju.trouverElementJeu(elB, EmplacementElement.iciEtInventaire, true, true);
  //   // Les 2 objets ont été trouvés
  //   if (eleJeuA === -1) {
  //     return "J'ai trouvé plusieurs éléments correspondant à " + elA.nom + ". Pouvez-vous être plus précis ?";
  //   } else if (eleJeuB === -1) {
  //     return "J'ai trouvé plusieurs éléments correspondant à " + elB.nom + ". Pouvez-vous être plus précis ?";
  //   } else if (eleJeuA && eleJeuB) {
  //     // 2x le même objet
  //     if (eleJeuA == eleJeuB) {
  //       return "Je ne peux pas l’utiliser sur " + (eleJeuA.genre == Genre.f ? 'elle' : 'lui') + "-même.";
  //       // 2x une porte
  //     } else if (eleJeuA.type === ClasseRacine.porte && eleJeuB.type === ClasseRacine.porte) {
  //       return "Hum… essayons autre chose !";
  //       // 1x un objet et 1x une porte
  //     } else if (eleJeuA.type === ClasseRacine.porte && eleJeuB.type !== ClasseRacine.porte) {
  //       return this.utiliserObjetAvecPorte(infinitif, eleJeuB, eleJeuA);
  //     } else if (eleJeuB.type === ClasseRacine.porte && eleJeuA.type !== ClasseRacine.porte) {
  //       return this.utiliserObjetAvecPorte(infinitif, eleJeuA, eleJeuB);
  //       // 2x un objet
  //     } else {
  //       return this.utiliserObjetAvecObjet(infinitif, eleJeuA, eleJeuB);
  //     }
  //   } else {
  //     return "Je n’ai pas trouvé ce que je dois utiliser.";
  //   }
  // }

  // utiliserObjetAvecObjet(infinitif: string, objetA: ElementJeu, objetB: ElementJeu) {
  //   if (objetA == objetB) {
  //     return "Je ne peux pas l’utiliser sur " + (objetA.genre == Genre.f ? 'elle' : 'lui') + "-même.";
  //   } else {
  //     // TODO: utiliser les objets.
  //     return "Il ne se passera rien.";
  //   }
  // }

  // utiliserObjetAvecPorte(infinitif: string, objet: ElementJeu, porte: ElementJeu) {
  //   const canDeverroullierCettePorte = ElementsJeuUtils.possedeCapaciteActionCible(objet, "déverrouiller", null, (porte.determinant + porte.nom));
  //   // cet objet déverrouille cette porte
  //   if (canDeverroullierCettePorte) {
  //     ElementsJeuUtils.retirerEtat(porte, "verrouillé", "verrouillée");
  //     // ouvrir la porte en plus si le verbe utilisé est ouvrir
  //     console.log("utiliserObjetAvecPorte >>> infinitif:", infinitif);

  //     if (infinitif.toLowerCase() === 'ouvrir' && ElementsJeuUtils.possedeCetEtat(porte, "ouvrable")) {
  //       ElementsJeuUtils.ajouterEtat(porte, (porte.genre === Genre.f ? "ouverte" : "ouvert"));
  //       return "Á présent c'est ouvert.";
  //       // sinon juste déverrouiller
  //     } else {
  //       return "À présent ce n’est plus verrouillé.";
  //     }

  //   } else {
  //     // cet objet peut déverrouiller AUTRE CHOSE
  //     const canDeverroullier = OutilsCommandes.objetPossedeCapaciteAction(objet, "déverrouiller");
  //     if (canDeverroullier) {
  //       return "Essayons de déverrouiller autre chose avec.";
  //     } else {
  //       return "Ça ne fonctionne pas.";
  //     }
  //   }
  // }



  // utiliserSeul(infinitif: string, elA: GroupeNominal) {

  //   //todo: inclure les portes ou pas ?
  //   const eleTrouve = this.eju.trouverElementJeu(elA, EmplacementElement.iciEtInventaire, true, true);
  //   if (eleTrouve === -1) {
  //     return "J'ai trouvé plusieurs éléments correspondant à " + elA.nom + ". Pouvez-vous être plus précis ?";
  //   } else if (eleTrouve) {
  //     if (eleTrouve.type === ClasseRacine.animal || eleTrouve.type === ClasseRacine.personne) {
  //       return "Pas de ça ici !";
  //     }  else {
  //       return "Et si on combinait avec autre chose ?";
  //     }
  //   } else {
  //     return "Je n’ai pas trouvé ce que je dois utiliser.";
  //   }
  // }

  // examiner(els: ElementsPhrase) {

  //   let retVal: string;

  //   // si on ne sait pas ce qu’il faut examiner
  //   if (!els.sujet) {
  //     return "Que dois-je examiner ?";
  //     // examiner un élément en particulier
  //   } else {
  //     // regarder dans les éléments de jeu
  //     const trouve = this.eju.trouverElementJeu(els.sujet, EmplacementElement.iciEtInventaire, true, true);
  //     if (trouve === -1) {
  //       retVal = "J'ai trouvé plusieurs éléments correspondant à " + els.sujet.nom + ". Pouvez-vous être plus précis ?";
  //     } else if (trouve) {

  //       switch (trouve.type) {
  //         // Contenant
  //         case ClasseRacine.contenant:
  //           retVal = this.outils.afficherContenu(trouve, "Je ne vois rien d’intéressant dedans.");
  //           break;
  //         // Support
  //         case ClasseRacine.support:
  //           retVal = this.outils.afficherContenu(trouve, "Je ne vois rien d’intéressant dessus.");
  //           break;
  //         // Porte
  //         case ClasseRacine.porte:
  //           retVal += "\n" + this.outils.afficherStatutPorte(trouve);

  //         default:
  //           retVal = this.outils.afficherContenu(trouve);
  //           break;
  //       }

  //       // rien trouvé
  //     } else {
  //       retVal = "Je ne vois pas ça.";
  //     }
  //   }
  //   return retVal;
  // }

  // regarder(els: ElementsPhrase) {
  //   let retVal: string;

  //   // regarder le lieu actuel
  //   if (!els.sujet) {
  //     if (this.eju.curLieu) {
  //       if (this.eju.curLieu.description) {
  //         retVal = this.outils.calculerDescription(this.eju.curLieu.description, ++this.eju.curLieu.nbAffichageDescription)
  //           + this.outils.afficherObjetsCurLieu();
  //       } else {
  //         retVal = "Votre position : " + this.eju.curLieu.intitule + ".\n"
  //           + this.outils.afficherObjetsCurLieu();
  //       }
  //     } else {
  //       retVal = "Mais où suis-je ?";
  //     }
  //     // regarder un élément en particulier
  //   } else {
  //     // regarder dans les éléments de jeu
  //     const trouve = this.eju.trouverElementJeu(els.sujet, EmplacementElement.iciEtInventaire, true, true);
  //     if (trouve == -1) {
  //       retVal = "J'ai trouvé plusieurs éléments correspondant à " + els.sujet.nom + ". Pouvez-vous être plus précis ?";
  //     } else if (trouve) {
  //       if (trouve.description) {
  //         retVal = this.outils.calculerDescription(trouve.description, ++trouve.nbAffichageDescription);
  //       } else {
  //         retVal = (trouve.quantite == 1 ? "C’est… " : "Ce sont… ") + OutilsCommandes.afficherQuantiteIntitule(trouve, false, null);
  //       }
  //       if (trouve.type == ClasseRacine.porte) {
  //         retVal += "\n" + this.outils.afficherStatutPorte(trouve)
  //       }
  //       // rien trouvé
  //     } else {
  //       retVal = "Je ne vois pas ça.";
  //     }
  //   }
  //   return retVal;
  // }

  sorties() {
    return this.outils.afficherSorties();
  }

  fouiller(els: ElementsPhrase) {
    return "Je n’ai pas le courage de fouiller ça.";
  }

  inventaire() {
    // return this.outils.afficherInventaire();
    let retVal = this.ins.executerAfficherContenu(this.jeu.joueur).sortie;
    if (!retVal) {
      retVal = "{/Votre inventaire est vide./}";
    }
    return retVal;
  }

  /**
   * au préalable, il faut avoir vidé la console !
   */
  effacer() {
    return this.outils.afficherCurLieu();
  }

}
