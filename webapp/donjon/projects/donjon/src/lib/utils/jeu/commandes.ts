import { ClasseUtils } from '../commun/classe-utils';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Genre } from '../../models/commun/genre.enum';
import { Instructions } from './instructions';
import { Jeu } from '../../models/jeu/jeu';
import { Localisation } from '../../models/jeu/localisation';
import { Objet } from '../../models/jeu/objet';
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

  aller(els: ElementsPhrase) {

    let locDest: Localisation = Localisation.inconnu;

    switch (els.infinitif) {

      case "aller":
        // vérifier la direction
        switch (els.sujet.nom) {
          case "nord":
            locDest = Localisation.nord;
            break;

          case "sud":
            locDest = Localisation.sud;
            break;

          case "ouest":
            locDest = Localisation.ouest;
            break;

          case "est":
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

    // console.log("voisinLieu", voisinLieu);
    // console.log("voisinPorte", voisinPorte);

    // TODO: vérifier accès…
    if (voisinPorte && this.jeu.etats.possedeEtatIdElement(voisinPorte, this.jeu.etats.fermeID)) {
      // La porte est fermée
      // TODO: gérer majuscule
      return (this.outils.afficherIntitule(voisinPorte.intitule) + " est fermé" + (voisinPorte.genre === Genre.f ? "e" : "") + ".");
    } else {
      if (voisinPorte) {
        console.log("porte ouverte :)");
      } else {
        console.log("pas de porte");
      }
      if (voisinLieu) {
        this.jeu.joueur.position.cibleType = EClasseRacine.lieu;
        this.jeu.joueur.position.cibleId = voisinLieu.id;

        this.eju.majPresenceDesObjets();

        return this.outils.afficherCurLieu();
      } else {
        return "Pas pu aller par là.";
      }
    }

  }



  // =========================================
  // COMMANDES QUI NE MODIFIENT PAS LE JEU
  // =========================================

  // aide(els: ElementsPhrase) {
  //   if (!els.sujet) {
  //     return "{_Quelques commandes utiles_}\n"
  //       + " - {-aide {/parler/}-} : afficher l’aide d’une commande\n"
  //       + " - {-aller {/nord/}-} : aller vers le nord\n"
  //       + " - {-regarder-} : regarder autours de vous\n"
  //       + " - {-examiner {/table/}-} : examiner un élément pour trouver des objets ou des informations\n"
  //       + " - {-prendre {/épée/}-} : prendre un objet\n"
  //       + " - {-inventaire-} : afficher le contenu de votre inventaire\n"
  //       + " - {-parler à {/magicienne/}-} : parler à un personnage\n"
  //       + " - {-interroger {/couturier/} concernant {/tissu/}-} : faire parler un personnage concernant un sujet spécifique\n"
  //       + " - {-ouvrir {/porte/} avec {/clé dorée/}-} : ouvrir la porte à l’aide de la clé dorée\n"
  //       + "{+[Jeu créé avec Donjon FI ©2018-2021 Jonathan Claes − see MIT License ]+}";
  //   } else {
  //     const ficheAide = this.jeu.aides.find(x => x.infinitif === els.sujet.nom);
  //     if (ficheAide) {
  //       return ficheAide.informations;
  //     } else {
  //       return "Désolé, je n’ai pas de page d’aide concernant la commande « " + els.sujet.nom + " »";
  //     }
  //   }
  // }

  deboguer(els: ElementsPhrase) {
    let retVal = "";
    if (els.sujet.nom == 'ici') {
      console.warn("#DEB# ici=", this.eju.curLieu);
    } else if (els.sujet.nom == "états") {
      console.warn("#DEB# états=", this.jeu.etats.obtenirListeDesEtats());
    } else {
      const cor = this.eju.trouverCorrespondance(els.sujet, true);
      if (cor.elements.length !== 0) {
        if (cor.elements.length === 1) {
          const el = cor.elements[0];
          // retrouver les états de l’élément
          const etats = this.jeu.etats.obtenirIntitulesEtatsElementJeu(el);
          let visible: boolean = null;
          let emplacement: ElementJeu = null;
          if (ClasseUtils.heriteDe(el.classe, EClasseRacine.objet)) {
            let obj = (el as Objet);
            visible = this.jeu.etats.estVisible(obj, this.eju);
            emplacement = this.eju.getLieu(this.eju.getLieuObjet(obj));
          }
          console.warn("#DEB# trouvé " + els.sujet.nom, "\n >> el=", el, "\n >> etats=", etats, "\n >> visible=", visible, "\n >> position=", emplacement);
          retVal = "trouvé.";
        } else {
          console.warn("#DEB# erreur: plusieurs correspondances pour sujet=", els.sujet);
          retVal = "pas trouvé > plusieurs correspondances";
        }
      } else {
        console.warn("#DEB# erreur:", "pas pu trouvé le sujet=", els.sujet);
        retVal = "pas trouvé > aucune correspondance";
      }
    }
    if (retVal) {
      retVal += "{n}";
    }
    retVal += "{/(voir console)/}";
    return retVal;
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

  sorties() {
    return this.ins.afficherSorties(this.eju.curLieu);
  }

  inventaire() {
    let retVal = this.ins.executerListerContenu(this.jeu.joueur, true).sortie;
    if (!retVal) {
      retVal = "{/Votre inventaire est vide./}";
    } else {
      retVal = "Votre inventaire contient:" + retVal;
    }
    return retVal;
  }

}
