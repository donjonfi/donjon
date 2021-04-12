import { ClasseUtils } from '../commun/classe-utils';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Instructions } from './instructions';
import { Jeu } from '../../models/jeu/jeu';
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
  // COMMANDES QUI NE MODIFIENT PAS LE JEU
  // =========================================

  deboguer(els: ElementsPhrase) {
    let retVal = "";
    if (els.sujet.nom == 'ici') {
      console.warn("#DEB# ici=", this.eju.curLieu);
    } else if (els.sujet.nom == "états") {
      console.warn("#DEB# états=", this.jeu.etats.obtenirListeDesEtats());
    } else {
      const cor = this.eju.trouverCorrespondance(els.sujet, true, true);
      if (cor.elements.length !== 0) {
        if (cor.elements.length === 1) {
          const el = cor.elements[0];
          // retrouver les états de l’élément
          const etats = this.jeu.etats.obtenirIntitulesEtatsElementJeu(el);
          let visible: boolean = null;
          let accessible: boolean = null;
          let emplacement: ElementJeu = null;
          let estObjet = ClasseUtils.heriteDe(el.classe, EClasseRacine.objet);
          if (estObjet) {
            let obj = (el as Objet);
            visible = this.jeu.etats.estVisible(obj, this.eju);
            accessible = this.jeu.etats.estAccessible(obj, this.eju);
            emplacement = this.eju.getLieu(this.eju.getLieuObjet(obj));
          }
          console.warn("#DEB# trouvé " + els.sujet.nom, "\n >> el=", el, "\n >> etats=", etats, "\n >> visible=", visible, "\n >> position=", emplacement);
          retVal =
            "{*" + ElementsJeuUtils.calculerIntitule(el, false) + "*} (" + el.genre + ", " + el.nombre + ")" +
            "{n}{e}{_type_}{n}" + el.classe.intitule +
            "{n}{e}{_synonymes_}{n}" + (el.synonymes?.length ? el.synonymes.map(x=> x.toString()).join(", ") : '(aucun)') +
            (estObjet ? ("{n}{e}{_visible / accessible_}{n}" + (visible ? 'oui' : 'non') + " / " + (accessible ? 'oui' : 'non')) : '') +
            "{n}{e}{_états_}{n}" + etats +
            (estObjet ? ("{n}{e}{_position_}{n}" + (emplacement ? emplacement.nom : 'aucune')) : '') +
            "";
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
    retVal += "{/(voir également console du navigateur {+ctrl+maj+i+})/}";
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



}
