import { Capacite } from "../../models/commun/capacite";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { Intitule } from "../../models/jeu/intitule";
import { Jeu } from "../../models/jeu/jeu";
import { Nombre } from "../../models/commun/nombre.enum";
import { Objet } from "../../models/jeu/objet";
import { ProprieteElement } from "../../models/commun/propriete-element";

export class InstructionsUtils {

  /** Retrouver la cible sur base de son texte (ici, ceci, cela, quantitéCeci, quantitéCela, inventaire, joueur) */
  public static getCible(cibleString: string, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule, evenement: Evenement, eju: ElementsJeuUtils, jeu: Jeu): ElementJeu {
    let cible: ElementJeu = null;
    if (cibleString) {
      // retrouver la cible
      switch (cibleString.toLowerCase()) {
        case 'ici':
          cible = eju.curLieu;
          // afficherObjetsCaches = false;
          break;
        case 'ceci':
          cible = ceci as ElementJeu;
          break;
        case 'cela':
          cible = cela as ElementJeu;
          break;
        case 'quantitéceci':
          cible = InstructionsUtils.copierElementTemp(ceci as Objet);
          cible.quantite = evenement.quantiteCeci;
          // nombre
          //     => multiple
          if (cible.quantite > 1) {
            cible.nombre = Nombre.p;
            // => identique à l’original
          } else if (cible.quantite == -1) {
            cible.nombre = (ceci as Objet).nombre;
            // => 0 ou 1
          } else {
            cible.nombre = Nombre.s;
          }
          break;
        case 'quantitécela':
          cible = InstructionsUtils.copierElementTemp(cela as Objet);
          cible.quantite = evenement.quantiteCela;
          // nombre
          //     => multiple
          if (cible.quantite > 1) {
            cible.nombre = Nombre.p;
            // => identique à l’original
          } else if (cible.quantite == -1) {
            cible.nombre = (cela as Objet).nombre;
            // => 0 ou 1
          } else {
            cible.nombre = Nombre.s;
          }
          break;
        case 'inventaire':
        case 'joueur':
          cible = jeu.joueur;
          // phraseSiVide = "";
          // phraseSiQuelqueChose = "";
          break;
      }
    }
    return cible;
  }

  /**
   * Dupliquer l’élément du jeu pour utilisation temporaire (sans l’ajouter au jeu ni lui donner d’ID.)
   * 
   * Remarques:
   *  - Sert uniquement à pouvoir modifier des propriétés sans endomager l’original.
   * - Ne pas utiliser l’élément dans le jeu ensuite ! Pour cela utiliser copierObjet !
   * 
   * @param original élément à dupliquer.
   * @returns copie de l’élément
   */
  private static copierElementTemp(original: ElementJeu) {
    let copie = new ElementJeu(0, original.nom, original.intitule, original.classe); // 1, original.genre, Nombre.s);
    copie.quantite = original.quantite;
    copie.nombre = original.nombre;
    copie.genre = original.genre;
    copie.description = original.description;
    copie.apercu = original.apercu;
    copie.texte = original.texte;
    copie.intituleS = original.intituleS;
    copie.intituleP = original.intituleP;

    // copier le nombre d’affichage de la description
    copie.nbAffichageDescription = original.nbAffichageDescription;
    copie.nbAffichageApercu = original.nbAffichageApercu;
    copie.nbAffichageTexte = original.nbAffichageTexte;

    // copier les états
    original.etats.forEach(etat => {
      copie.etats.push(etat);
    });

    // copier les capacités
    original.capacites.forEach(cap => {
      copie.capacites.push(new Capacite(cap.verbe, cap.complement));
    });

    // copier les propriétés
    original.proprietes.forEach(prop => {
      copie.proprietes.push(new ProprieteElement(prop.nom, prop.type, prop.valeur));
    });


    // TODO: faut-il copier le contenu ?
    return copie;
  }

}
