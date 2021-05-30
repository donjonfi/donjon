import { ClasseUtils } from '../commun/classe-utils';
import { Compteur } from '../../models/compilateur/compteur';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Instructions } from './instructions';
import { Jeu } from '../../models/jeu/jeu';
import { Lieu } from '../../models/jeu/lieu';
import { Localisation } from '../../models/jeu/localisation';
import { Objet } from '../../models/jeu/objet';
import { OutilsCommandes } from './outils-commandes';
import { PrepositionSpatiale } from '../../models/jeu/position-objet';

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


    if (els.sujet) {
      if (els.sujet.nom == 'ici') {
        console.warn("#DEB# ici=", this.eju.curLieu);
      } else if (els.sujet.nom == "états") {
        console.warn("#DEB# états=", this.jeu.etats.obtenirListeDesEtats());
      } else {
        const cor = this.eju.trouverCorrespondance(els.sujet, true, true);
        if (cor.elements.length !== 0 || cor.compteurs.length !== 0 || cor.localisation !== null) {
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

          // compteurs
          if (cor.compteurs.length) {
            if (cor.compteurs.length > 1) {
              retVal += (cor.compteurs.length + " compteurs trouvés :");
            } else {
              retVal += (" 1 compteur trouvé :");
            }
            cor.compteurs.forEach(cpt => {
              retVal += "\n\n" + this.afficherDetailCompteur((cpt as Compteur));
            });
          }

          // direction
          if (cor.localisation) {
            retVal += "1 direction trouvée :";
            retVal += "\n\n" + this.afficherDetailDirection(cor.localisation);
          }


        } else {
          console.warn("#DEB# erreur:", "pas pu trouvé le sujet=", els.sujet);
          retVal = "pas trouvé > aucune correspondance";
        }
      }
    }
    else{
      retVal = "La commande n’est pas complète.";
    }

    return retVal;
  }

  private afficherDetailObjet(objet: Objet) {
    // retrouver les états de l’élément
    const etats = this.jeu.etats.obtenirIntitulesEtatsElementJeu(objet);
    let visible: boolean = null;
    let accessible: boolean = null;
    let emplacement: ElementJeu = null;
    let contenant: Objet = null;
    const estContenant = ClasseUtils.heriteDe(objet.classe, EClasseRacine.contenant);
    const estSupport = ClasseUtils.heriteDe(objet.classe, EClasseRacine.support);
    visible = this.jeu.etats.estVisible(objet, this.eju);
    accessible = this.jeu.etats.estAccessible(objet, this.eju);
    emplacement = this.eju.getLieu(this.eju.getLieuObjet(objet));
    contenant = (objet.position?.cibleType === EClasseRacine.objet ? this.eju.getObjet(objet.position.cibleId) : null)

    const sortie =
      "{* • " + this.eju.calculerIntituleElement(objet, false, true) + "*} (" + objet.genre + ", " + objet.nombre + ")" +
      "{n}{e}{_type_}{n}" + ClasseUtils.getHierarchieClasse(objet.classe) +
      "{n}{e}{_ID_}{n}" + objet.id + (objet.idOriginal ? (' (copie de ' + objet.idOriginal + ')') : '') +
      "{n}{e}{_quantité_}{n}" + objet.quantite +
      "{n}{e}{_synonymes_}{n}" + (objet.synonymes?.length ? objet.synonymes.map(x => x.toString()).join(", ") : '(aucun)') +
      "{n}{e}{_visible / accessible_}{n}" + (visible ? 'oui' : 'non') + " / " + (accessible ? 'oui' : 'non') +
      "{n}{e}{_états_}{n}" + etats +
      "{n}{e}{_lieu_}{n}" + ((emplacement ? emplacement.nom : 'aucune') + (contenant ? (' (' + contenant.nom + ')') : '')) +
      (estContenant ? ("{n}{e}{_contenu_}{n}" + (this.ins.dire.executerDecrireContenu(objet, 'dedans : ', '(dedans : vide)', true, true, PrepositionSpatiale.dans).sortie)) : '') +
      (estSupport ? ("{n}{e}{_contenu_}{n}" + (this.ins.dire.executerDecrireContenu(objet, 'dessus : ', '(dessus : vide)', true, true, PrepositionSpatiale.sur).sortie)) : '') +
      "";
    return sortie;
  }

  private afficherDetailLieu(lieu: Lieu) {
    // retrouver les états de l’élément
    const etats = this.jeu.etats.obtenirIntitulesEtatsElementJeu(lieu);
    const sortie =
      "{* • " + ElementsJeuUtils.calculerIntituleGenerique(lieu, false) + "*} (" + lieu.genre + ", " + lieu.nombre + ")" +
      "{n}{e}{_titre_}{n}" + lieu.titre +
      "{n}{e}{_type_}{n}" + ClasseUtils.getHierarchieClasse(lieu.classe) +
      "{n}{e}{_synonymes_}{n}" + (lieu.synonymes?.length ? lieu.synonymes.map(x => x.toString()).join(", ") : '(aucun)') +
      "{n}{e}{_états_}{n}" + etats +
      ("{n}{e}{_contenu_}{n}" + (this.ins.dire.executerDecrireContenu(lieu, 'Il y a ', '(vide)', true, true, PrepositionSpatiale.inconnu).sortie)) +

      "";
    return sortie;
  }

  private afficherDetailCompteur(compteur: Compteur) {
    const sortie =
      "{* • " + ElementsJeuUtils.calculerIntituleGenerique(compteur, false) + "*}" +
      "{n}{e}{_type_}{n}" + ClasseUtils.getHierarchieClasse(compteur.classe) +
      "{n}{e}{_valeur_}{n}" + compteur.valeur?.toString() ?? '?' +
      "";
    return sortie;
  }

  private afficherDetailDirection(direction: Localisation) {
    const sortie =
      "{* • " + ElementsJeuUtils.calculerIntituleGenerique(direction, false) + "*}" +
      "{n}{e}{_type_}{n}" + ClasseUtils.getHierarchieClasse(direction.classe) +
      "";
    return sortie;
  }

  ouSuisJe() {
    if (!this.jeu.joueur.position) {
      return "Je ne sais pas où je suis";
    } else {
      // return "Votre position : " + (this.outils.curLieu.intitule ? (this.outils.curLieu.intitule) : (this.curLieu.determinant + this.outils.curLieu.nom)) + ".\n"
      return this.outils.afficherCurLieu();
    }
  }



}
