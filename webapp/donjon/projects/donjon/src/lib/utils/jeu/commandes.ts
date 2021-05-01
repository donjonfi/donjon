import { ClasseUtils } from '../commun/classe-utils';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Instructions } from './instructions';
import { Jeu } from '../../models/jeu/jeu';
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
          let contenant: Objet = null;
          const estObjet = ClasseUtils.heriteDe(el.classe, EClasseRacine.objet);
          const estContenant = ClasseUtils.heriteDe(el.classe, EClasseRacine.contenant);
          const estSupport = ClasseUtils.heriteDe(el.classe, EClasseRacine.support);
          let obj: Objet = null;
          if (estObjet) {
            obj = (el as Objet);
            visible = this.jeu.etats.estVisible(obj, this.eju);
            accessible = this.jeu.etats.estAccessible(obj, this.eju);
            emplacement = this.eju.getLieu(this.eju.getLieuObjet(obj));
            contenant = (obj.position?.cibleType === EClasseRacine.objet ? this.eju.getObjet(obj.position.cibleId) : null)
          }
          console.warn(
            "#DEB# trouvé " + els.sujet.nom,
            "\n >> el=", el,
            "\n >> etats=", etats,
            "\n >> visible=", visible,
            "\n >> position=", obj.position,
            "\n >> lieu=", emplacement,
            "\n >> contenant=", contenant
          );
          retVal =
            "{*" + ElementsJeuUtils.calculerIntitule(el, false) + "*} (" + el.genre + ", " + el.nombre + ")" +
            "{n}{e}{_type_}{n}" + ClasseUtils.getHierarchieClasse(el.classe) +
            "{n}{e}{_synonymes_}{n}" + (el.synonymes?.length ? el.synonymes.map(x => x.toString()).join(", ") : '(aucun)') +
            (estObjet ? ("{n}{e}{_visible / accessible_}{n}" + (visible ? 'oui' : 'non') + " / " + (accessible ? 'oui' : 'non')) : '') +
            "{n}{e}{_états_}{n}" + etats +
            (estObjet ? ("{n}{e}{_lieu_}{n}" + ((emplacement ? emplacement.nom : 'aucune') + (contenant ? (' (' + contenant.nom + ')') : ''))) : '') +
            (estContenant ? ("{n}{e}{_contenu_}{n}" + (this.ins.dire.executerDecrireContenu(obj, 'dedans : ', '(dedans : vide)', true, PrepositionSpatiale.dans).sortie)) : '') +
            (estSupport ? ("{n}{e}{_contenu_}{n}" + (this.ins.dire.executerDecrireContenu(obj, 'dessus : ', '(dessus : vide)', true, PrepositionSpatiale.sur).sortie)) : '') +
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

}
