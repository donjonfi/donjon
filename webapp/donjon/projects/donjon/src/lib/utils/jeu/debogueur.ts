import { ElementsJeuUtils, TypeSujet } from '../commun/elements-jeu-utils';

import { ClasseUtils } from '../commun/classe-utils';
import { Compteur } from '../../models/compilateur/compteur';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Instructions } from './instructions';
import { Jeu } from '../../models/jeu/jeu';
import { Lieu } from '../../models/jeu/lieu';
import { Liste } from '../../models/jeu/liste';
import { Localisation } from '../../models/jeu/localisation';
import { Objet } from '../../models/jeu/objet';
import { PrepositionSpatiale } from '../../models/jeu/position-objet';
import { TypeValeur } from '../../models/compilateur/type-valeur';
import { Concept } from '../../models/compilateur/concept';

export class Debogueur {

  private eju: ElementsJeuUtils;

  constructor(
    public jeu: Jeu,
    public ins: Instructions,
    private verbeux: boolean,
  ) {
    this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
  }

  // =========================================
  // COMMANDE QUI NE MODIFIE PAS LE JEU
  // =========================================

  deboguer(els: ElementsPhrase): string {
    let retVal = "";

    if (els.sujet) {
      if (els.sujet.nom == 'ici') {
        console.warn("#DEB# ici=", this.eju.curLieu);
      } else if (els.sujet.nom == "états") {
        console.warn("#DEB# états=", this.jeu.etats.obtenirListeDesEtats());
      } else {
        const cor = this.eju.trouverCorrespondance(els.sujet, TypeSujet.SujetEstIntitule, true, true);
        if (cor.elements.length !== 0 || cor.concepts.length !== 0 || cor.compteurs.length !== 0 || cor.listes.length !== 0 || cor.localisation !== null) {
          // éléments
          if (cor.elements.length) {
            if (cor.elements.length > 1) {
              retVal += (cor.elements.length + " éléments trouvés :");
            } else {
              retVal += (" 1 élément trouvé :");
            }
            cor.elements.forEach(el => {
              const estLieu = ClasseUtils.heriteDe(el.classe, EClasseRacine.lieu);
              if (estLieu) {
                retVal += "\n\n" + this.afficherDetailLieu((el as Lieu));
              } else {
                retVal += "\n\n" + this.afficherDetailObjet((el as Objet));
              }
            });
          }

          // concepts
          if (cor.concepts.length) {
            if (cor.concepts.length > 1) {
              retVal += (cor.concepts.length + " concepts trouvés :");
            } else {
              retVal += (" 1 concept trouvé :");
            }
            cor.concepts.forEach(cpt => {
              retVal += "\n\n" + this.afficherDetailConcept(cpt);
            });
          }

          // compteurs
          if (cor.compteurs.length) {
            if (cor.compteurs.length > 1) {
              retVal += (cor.compteurs.length + " compteurs trouvés :");
            } else {
              retVal += (" 1 compteur trouvé :");
            }
            cor.compteurs.forEach(cpt => {
              retVal += "\n\n" + this.afficherDetailCompteur(cpt);
            });
          }

          // listes
          if (cor.listes.length) {
            if (cor.listes.length > 1) {
              retVal += (cor.listes.length + " listes trouvées :");
            } else {
              retVal += (" 1 liste trouvée :");
            }
            cor.listes.forEach(lst => {
              retVal += "\n\n" + this.afficherDetailListe(lst);
            });
          }

          // direction
          if (cor.localisation) {
            retVal += "1 direction trouvée :";
            retVal += "\n\n" + this.afficherDetailDirection(cor.localisation);
          }


        } else {
          console.warn("#DEB# erreur:", "pas pu trouvé le sujet=", els.sujet);
          retVal = "pas trouvé > aucune correspondance (la recherche se fait sur l’intitulé)";
        }
      }
    }
    else {
      retVal = "La commande n’est pas complète.";
    }

    return retVal;
  }

  private afficherDetailObjet(objet: Objet) {
    // retrouver les états de l’élément
    const etats = this.jeu.etats.obtenirIntitulesEtatsElementJeu(objet);
    let proprietes = this.getProprietesConcept(objet);
    let contenant: Objet = null;
    let contenantPreposition = "";
    const estContenant = ClasseUtils.heriteDe(objet.classe, EClasseRacine.contenant);
    const estSupport = ClasseUtils.heriteDe(objet.classe, EClasseRacine.support);
    const visible = this.jeu.etats.estVisible(objet, this.eju);
    const accessible = this.jeu.etats.estAccessible(objet, this.eju);
    const vide = this.jeu.etats.estVide(objet, this.eju);
    const emplacement = this.eju.getLieu(this.eju.getLieuObjet(objet));
    contenant = (objet.position?.cibleType === EClasseRacine.objet ? this.eju.getObjet(objet.position.cibleId) : null)
    // retrouver la préposition de la position de l’objet par rapport à sont contenant/support
    if (contenant) {
      switch (objet.position.pre) {
        case PrepositionSpatiale.dans:
          contenantPreposition = "dans "
          break;
        case PrepositionSpatiale.sous:
          contenantPreposition = "sous "
          break;
        case PrepositionSpatiale.sur:
          contenantPreposition = "sur "
          break;
        case PrepositionSpatiale.inconnu:
          contenantPreposition = "? "
          break;
        default:
          contenantPreposition = "X?X "
          break;
      }
    }

    let infoContenant: string;

    if (contenant === this.jeu.joueur) {

      if (this.jeu.etats.possedeEtatIdElement(objet, this.jeu.etats.enfileID, this.eju)) {
        infoContenant = " (" + this.jeu.etats.obtenirIntituleEtatPourElementJeu(objet, this.jeu.etats.enfileID) + " par joueur)";
      } else if (this.jeu.etats.possedeEtatIdElement(objet, this.jeu.etats.chausseID, this.eju)) {
        infoContenant = " (" + this.jeu.etats.obtenirIntituleEtatPourElementJeu(objet, this.jeu.etats.chausseID) + " par joueur)";
      } else if (this.jeu.etats.possedeEtatIdElement(objet, this.jeu.etats.equipeID, this.eju)) {
        infoContenant = " (" + this.jeu.etats.obtenirIntituleEtatPourElementJeu(objet, this.jeu.etats.equipeID) + " par joueur)";
      } else if (this.jeu.etats.possedeEtatIdElement(objet, this.jeu.etats.porteID, this.eju)) {
        infoContenant = " (" + this.jeu.etats.obtenirIntituleEtatPourElementJeu(objet, this.jeu.etats.porteID) + " par joueur)";
      } else {
        infoContenant = " (dans inventaire joueur)";
      }

    } else {
      infoContenant = (contenant ? (' (' + contenantPreposition + contenant.nom + ')') : '')
    }

    const sortie =
      "{* • " + this.eju.calculerIntituleElement(objet, false, true) + "*} (" + objet.genre + ", " + objet.nombre + ")" +
      "{n}{e}{_type_}{n}" + ClasseUtils.getHierarchieClasse(objet.classe) +
      "{n}{e}{_ID_}{n}" + objet.id + (objet.idOriginal ? (' (copie de ' + objet.idOriginal + ')') : '') +
      "{n}{e}{_synonymes_}{n}" + (objet.synonymes?.length ? objet.synonymes.map(x => x.toString()).join(", ") : '(aucun)') +
      "{n}{e}{_visible / accessible" + ((estContenant || estSupport) ? " / vide" : "") + "_}{n}" + (visible ? 'oui' : 'non') + " / " + (accessible ? 'oui' : 'non') + ((estContenant || estSupport) ? (" / " + (vide ? 'oui' : 'non')) : "") +
      "{n}{e}{_états_}{n}" + etats +
      "{n}{e}{_propriétés_}{n}" + proprietes +
      "{n}{e}{_emplacement_}{n}" + ((emplacement ? emplacement.nom : 'aucun') + infoContenant) +
      (estContenant ? ("{n}{e}{_contenu_}{n}" + (this.ins.dire.executerDecrireContenu(objet, 'dedans : ', '(dedans : vide)', true, true, true, true, false, true, PrepositionSpatiale.dans, []).sortie)) : '') +
      (estSupport ? ("{n}{e}{_contenu_}{n}" + (this.ins.dire.executerDecrireContenu(objet, 'dessus : ', '(dessus : vide)', true, true, true, true, false, true, PrepositionSpatiale.sur, []).sortie)) : '') +
      "";
    return sortie;
  }

  private afficherDetailLieu(lieu: Lieu) {
    // retrouver les états de l’élément
    const etats = this.jeu.etats.obtenirIntitulesEtatsElementJeu(lieu);
    const proprietes = this.getProprietesConcept(lieu);
    const sortie =
      "{* • " + ElementsJeuUtils.calculerIntituleGenerique(lieu, false) + "*} (" + lieu.genre + ", " + lieu.nombre + ")" +
      "{n}{e}{_titre_}{n}" + lieu.titre +
      "{n}{e}{_type_}{n}" + ClasseUtils.getHierarchieClasse(lieu.classe) +
      "{n}{e}{_synonymes_}{n}" + (lieu.synonymes?.length ? lieu.synonymes.map(x => x.toString()).join(", ") : '(aucun)') +
      "{n}{e}{_états_}{n}" + etats +
      "{n}{e}{_propriétés_}{n}" + proprietes +
      ("{n}{e}{_contenu_}{n}" + (this.ins.dire.executerDecrireContenu(lieu, 'Il y a ', '(vide)', true, true, true, true, false, true, PrepositionSpatiale.inconnu, []).sortie)) +
      "";
    return sortie;
  }

  private getProprietesConcept(concept: Concept): string {
    let proprietes = (concept.proprietes.length > 0 ? "" : "(néant)");
    if (concept.nom) {
      proprietes += '{-nom :-} "' + concept.nom + '"{u}';
    }
    if (concept.intitule) {
      proprietes += '{-intitulé :-} "' + concept.intitule + '"{u}';
    }
    concept.proprietes.forEach(prop => {
      if (prop.type == TypeValeur.mots) {
        proprietes += "{-" + prop.nom + " :-} \"" + prop.valeur + "\"{u}";
      } else {
        proprietes += "{-" + prop.nom + " :-} " + prop.valeur + "{u}";
      }
    });

    return proprietes;
  }

  private afficherDetailConcept(concept: Concept) {
    const etats = this.jeu.etats.obtenirIntitulesEtatsElementJeu(concept);
    const proprietes = this.getProprietesConcept(concept);
    const sortie =
      "{* • " + ElementsJeuUtils.calculerIntituleGenerique(concept, false) + "*}" +
      "{n}{e}{_type_}{n}" + ClasseUtils.getHierarchieClasse(concept.classe) +
      "{n}{e}{_synonymes_}{n}" + (concept.synonymes?.length ? concept.synonymes.map(x => x.toString()).join(", ") : '(aucun)') +
      "{n}{e}{_états_}{n}" + etats +
      "{n}{e}{_propriétés_}{n}" + proprietes +
      "";
    return sortie;
  }

  private afficherDetailCompteur(compteur: Compteur) {
    const sortie =
      "{* • " + ElementsJeuUtils.calculerIntituleGenerique(compteur, false) + "*}" +
      "{n}{e}{_type_}{n}" + ClasseUtils.getHierarchieClasse(compteur.classe) +
      "{n}{e}{_valeur_}{n}" + compteur.valeur.toString() +
      "";
    return sortie;
  }

  private afficherDetailListe(liste: Liste) {
    let sortie =
      "{* • " + ElementsJeuUtils.calculerIntituleGenerique(liste, false) + "*}" +
      "{n}{e}{_type_}{n}" + ClasseUtils.getHierarchieClasse(liste.classe) +
      "{n}{e}{_taille_}{n}" + liste.taille.toString() +
      "{n}{e}{_contenu_}{n}" + liste.decrire();
    return sortie;
  }

  private afficherDetailDirection(direction: Localisation) {
    const sortie =
      "{* • " + ElementsJeuUtils.calculerIntituleGenerique(direction, false) + "*}" +
      "{n}{e}{_type_}{n}" + ClasseUtils.getHierarchieClasse(direction.classe) +
      "";
    return sortie;
  }


}
