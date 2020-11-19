import { ClassesRacines } from '../../models/commun/classes-racines';
import { ConditionsUtils } from './conditions-utils';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { Genre } from '../../models/commun/genre.enum';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Instructions } from './instructions';
import { Jeu } from '../../models/jeu/jeu';
import { Nombre } from '../../models/commun/nombre.enum';
import { Objet } from '../../models/jeu/objet';

export class OutilsCommandes {

  constructor(
    private jeu: Jeu,
    private ins: Instructions,
    private verbeux: boolean,
  ) {

    this.cond = new ConditionsUtils(jeu, verbeux);
    this.eju = new ElementsJeuUtils(jeu, verbeux);

  }
  /** Utilitairs - Conditions */
  private cond: ConditionsUtils;
  /** Utilitaires - Éléments du jeu */
  private eju: ElementsJeuUtils;



  /**
   * Obtenir l'accord ('', 'e' ou 'es') en fonction de l'objet.
   * @param ej élément à tester
   * @param estFeminin forcer féminin
   * @param estSingulier forcer singulier
   */
  static afficherAccordSimple(ej: ElementJeu, estFeminin: boolean, estSingulier: boolean) {
    let retVal: string;
    if (ej.nombre == Nombre.s || estSingulier) {
      if (ej.genre == Genre.f || estFeminin) {
        retVal = "e";
      } else {
        retVal = "";
      }
    } else {
      if (ej.genre == Genre.f || estFeminin) {
        retVal = "es";
      } else {
        retVal = "s";
      }
    }
    return retVal;
  }

  static afficherUnUneDesQuantite(ej: ElementJeu, majuscule: boolean, estFeminin: boolean, estSingulier: boolean) {
    let retVal: string;
    if (ej.quantite == 1 || estSingulier) {
      if (ej.genre == Genre.f || estFeminin) {
        retVal = majuscule ? "Une " : "une ";
      } else {
        retVal = majuscule ? "Un " : "un ";
      }
    } else if (ej.quantite >= 10 || ej.quantite == -1) {
      retVal = majuscule ? "Des " : "des ";
    } else {
      retVal = (ej.quantite + " ");
    }
    return retVal;
  }

  static afficherQuantiteIntitule(ej: Objet, majuscule: boolean, estFeminin: boolean) {

    let determinant = OutilsCommandes.afficherUnUneDesQuantite(ej, majuscule, estFeminin, null);
    let intitule = ej.intitule;

    if (ej.intituleS && ej.quantite == 1) {
      intitule = ej.intituleS;
    } else if (ej.intituleP) {
      intitule = ej.intituleP;
    }

    return determinant + intitule;
  }



  static objetPossedeCapaciteAction(obj: Objet, actionA: string, actionB: string = null): boolean {
    if (obj) {
      var retVal = false;
      obj.capacites.forEach(cap => {
        const curAction = cap.verbe.toLocaleLowerCase().trim();
        if ((curAction === actionA.toLocaleLowerCase().trim()) || (actionB && curAction === actionB.toLocaleLowerCase().trim())) {
          retVal = true;
        }
      });
      return retVal;
    } else {
      console.error("portePossedeCapaciteAction >> ElementJeu pas défini.");
    }
  }

  afficherStatutPorte(porte: Objet) {
    let retVal = "";
    if (!porte) {
      console.error("afficherStatutPorte >> porte pas définie");
    } else if (porte.classe !== ClassesRacines.Porte) {
      console.error("afficherStatutPorte >> l’élément de jeu n’est pas de type Porte");
    } else {
      const ouvrable = this.jeu.etats.possedeEtatIdElement(porte, this.jeu.etats.ouvrableID);
      const ouvert = this.jeu.etats.possedeEtatIdElement(porte, this.jeu.etats.ouvertID);
      const verrou = this.jeu.etats.possedeEtatIdElement(porte, this.jeu.etats.verrouilleID);;

      if (porte.genre == Genre.f) {
        if (ouvert) {
          retVal += "Elle est ouverte.";
        } else {
          retVal += "Elle est fermée " + (verrou ? "et verrouillée." : "mais pas verrouillée.");
        }
        if (ouvrable && !verrou) {
          retVal += " Vous pouvez " + (ouvert ? 'la fermer.' : 'l’ouvrir.');
        }
      } else {
        if (ouvert) {
          retVal += "Il est ouvert.";
        } else {
          retVal += "Il est fermé " + (verrou ? "et verrouillé." : "mais pas verrouillé.");
        }
        if (ouvrable && !verrou) {
          retVal += " Vous pouvez " + (ouvert ? 'le fermer.' : 'l’ouvrir.');
        }
      }

    }
    return retVal;
  }

  afficherCurLieu() {
    if (this.eju.curLieu) {
      return "{_{*" + this.eju.curLieu.titre + "*}_}\n"
        + (this.eju.curLieu.description ? (this.ins.calculerDescription(this.eju.curLieu.description, ++this.eju.curLieu.nbAffichageDescription, null, null, null)) : "")
        + this.ins.executerDecrireContenu(this.eju.curLieu, "{n}Vous voyez ", "", false).sortie
        + "\n\n" + this.ins.afficherSorties(this.eju.curLieu);
    } else {
      console.warn("Pas trouvé de curLieu :(");
      return "Je suis où moi ? :(";
    }
  }

  afficherInventaire() {
    let retVal: string;
    const objets = this.jeu.objets.filter(x => x.position.cibleType == EClasseRacine.objet && x.position.cibleId === this.jeu.joueur.id && x.quantite !== 0);
    if (objets.length == 0) {
      retVal = "\nVotre inventaire est vide.";
    } else {
      retVal = "\nContenu de l'inventaire :";
      objets.forEach(o => {
        if (o.quantite > 0) {
          retVal += "\n - " + OutilsCommandes.afficherQuantiteIntitule(o, false, null);
        }
      });
    }
    return retVal;
  }

  afficherIntitule(intitule: GroupeNominal) {
    let retVal = "";
    if (intitule) {
      if (intitule.determinant) {
        retVal += intitule.determinant;
      }
      retVal += intitule.nom;
      if (intitule.epithete) {
        retVal += ' ' + intitule.epithete;
      }
    }
    return retVal;
  }

  afficherContenu(obj: Objet, phraseSiVide = "Il n’y a rien d’intéressant.") {
    let retVal: string;
    let objets = this.jeu.objets.filter(x => x.position.cibleType == EClasseRacine.objet && x.position.cibleId == obj.id);
    if (objets.length == 0) {
      retVal = phraseSiVide;
    } else {
      retVal = "Vous trouvez :";
      objets.forEach(o => {
        if (o.quantite > 0) {
          retVal += "\n - " + OutilsCommandes.afficherQuantiteIntitule(o, false, null);
        }
      });
    }
    return retVal;
  }

  afficherObjetsCurLieu() {
    let retVal: string;

    let objets = this.jeu.objets.filter(x => x.position.cibleType == EClasseRacine.lieu && x.position.cibleId === this.eju.curLieu.id);

    if (objets.length == 0) {
      retVal = "\nJe ne vois pas d’objet ici.";
    } else {
      retVal = "\nCe que vous voyez ici :";
      objets.forEach(o => {
        retVal += "\n - Il y a " + OutilsCommandes.afficherQuantiteIntitule(o, false, null);
      });
    }
    return retVal;
  }



}
