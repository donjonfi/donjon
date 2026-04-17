import { Action } from "../../models/compilateur/action";
import { ClasseUtils } from "../commun/classe-utils";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { EClasseRacine, EEtatsBase } from "../../models/commun/constantes";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { Genre } from "../../models/commun/genre.enum";
import { Intitule } from "../../models/jeu/intitule";
import { Jeu } from "../../models/jeu/jeu";
import { Localisation } from "../../models/jeu/localisation";
import { Objet } from "../../models/jeu/objet";
import { StringUtils } from "../commun/string.utils";

type CalcTexteFn = (
  texteDynamique: string,
  nbAffichage: number,
  intact: boolean | undefined,
  ctxTour: ContexteTour | undefined,
  evenement: Evenement | undefined,
  declenchements: number | undefined
) => string;

export class InstructionDireApercuStatut {

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private calculerTexteDynamiqueFn: CalcTexteFn,
  ) { }

  calculerBaliseApercu(texteDynamique: string, ctxTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined): string {
    if (texteDynamique.includes("[aperçu") || texteDynamique.includes("[apercu")) {
      if (texteDynamique.includes("[aperçu ceci]") || texteDynamique.includes("[apercu ceci]")) {
        let apercuCeci = "???";
        if (ctxTour?.ceci) {
          if (ClasseUtils.heriteDe(ctxTour.ceci.classe, EClasseRacine.element)) {
            const eleCeci = ctxTour.ceci as ElementJeu;
            apercuCeci = this.calculerTexteDynamiqueFn(eleCeci.apercu, ++eleCeci.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(eleCeci, this.jeu.etats.intactID), ctxTour, evenement, declenchements);
            this.jeu.etats.ajouterEtatElement(eleCeci, EEtatsBase.vu, this.eju, false);
            ctxTour.elementsMentionnes.push(eleCeci.id);
          } else if (ClasseUtils.heriteDe(ctxTour.ceci.classe, EClasseRacine.direction)) {
            const dirCeci = ctxTour.ceci as Localisation;
            const voisinID = this.eju.getVoisinDirectionID(dirCeci, EClasseRacine.lieu);
            if (voisinID !== -1) {
              const voisin = this.eju.getLieu(voisinID);
              apercuCeci = this.calculerTexteDynamiqueFn(voisin.apercu, ++voisin.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(voisin, this.jeu.etats.intactID), ctxTour, evenement, declenchements);
              this.jeu.etats.ajouterEtatElement(voisin, EEtatsBase.vu, this.eju, false);
            } else {
              console.error("calculerBaliseApercu: apercu ceci direction: voisin pas trouve.");
            }
          } else {
            console.error("calculerBaliseApercu: apercu ceci: ceci n'est pas un element jeu");
          }
        } else {
          console.error("calculerBaliseApercu: apercu ceci: ceci n'a pas ete defini.");
        }
        texteDynamique = texteDynamique.replace(/\[(aperçu|apercu) ceci\]/g, apercuCeci);
      }
      if (texteDynamique.includes("[aperçu cela]") || texteDynamique.includes("[apercu cela]")) {
        let apercuCela = "???";
        if (ctxTour?.cela) {
          if (ClasseUtils.heriteDe(ctxTour.cela.classe, EClasseRacine.element)) {
            const eleCela = ctxTour.cela as ElementJeu;
            apercuCela = this.calculerTexteDynamiqueFn(eleCela.apercu, ++eleCela.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(eleCela, this.jeu.etats.intactID), ctxTour, evenement, declenchements);
            this.jeu.etats.ajouterEtatElement(eleCela, EEtatsBase.vu, this.eju, false);
            ctxTour.elementsMentionnes.push(eleCela.id);
          } else if (ClasseUtils.heriteDe(ctxTour.cela.classe, EClasseRacine.direction)) {
            const dirCela = ctxTour.cela as Localisation;
            const voisinID = this.eju.getVoisinDirectionID(dirCela, EClasseRacine.lieu);
            if (voisinID !== -1) {
              const voisin = this.eju.getLieu(voisinID);
              apercuCela = this.calculerTexteDynamiqueFn(voisin.apercu, ++voisin.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(voisin, this.jeu.etats.intactID), ctxTour, evenement, declenchements);
              this.jeu.etats.ajouterEtatElement(voisin, EEtatsBase.vu, this.eju, false);
            } else {
              console.error("calculerBaliseApercu: apercu cela direction: voisin pas trouve.");
            }
          } else {
            console.error("calculerBaliseApercu: apercu cela: cela n'est pas un element jeu");
          }
        } else {
          console.error("calculerBaliseApercu: apercu cela: cela n'a pas ete defini.");
        }
        texteDynamique = texteDynamique.replace(/\[(aperçu|apercu) cela\]/g, apercuCela);
      }
    }
    return texteDynamique;
  }

  calculerBaliseStatut(texteDynamique: string, ctxTour: ContexteTour | undefined): string {
    if (texteDynamique.includes("[statut")) {
      if (texteDynamique.includes("[statut ceci]")) {
        if (ctxTour?.ceci && ClasseUtils.heriteDe(ctxTour.ceci.classe, EClasseRacine.objet)) {
          texteDynamique = texteDynamique.replace(/\[statut ceci\]/g, this.afficherStatut(ctxTour.ceci as Objet));
        } else {
          console.error("calculerBaliseStatut: ceci n'est pas un objet");
        }
      }
      if (texteDynamique.includes("[statut cela]")) {
        if (ctxTour?.cela && ClasseUtils.heriteDe(ctxTour.cela.classe, EClasseRacine.objet)) {
          texteDynamique = texteDynamique.replace(/\[statut cela\]/g, this.afficherStatut(ctxTour.cela as Objet));
        } else {
          console.error("calculerBaliseStatut: cela n'est pas un objet");
        }
      }
    }
    return texteDynamique;
  }

  calculerBaliseAide(texteDynamique: string, ctxTour: ContexteTour | undefined): string {
    if (texteDynamique.includes("[aide")) {
      if (texteDynamique.includes("[aide ceci]")) {
        if (ctxTour) {
          texteDynamique = texteDynamique.replace(/\[aide ceci\]/g, this.recupererFicheAide(ctxTour.ceci));
        } else {
          console.error("calculerBaliseAide: aide ceci: pas de contexteTour");
        }
      }
      if (texteDynamique.includes("[aide cela]")) {
        if (ctxTour) {
          texteDynamique = texteDynamique.replace(/\[aide cela\]/g, this.recupererFicheAide(ctxTour.cela));
        } else {
          console.error("calculerBaliseAide: aide cela: pas de contexteTour");
        }
      }
    }
    return texteDynamique;
  }

  /** Afficher la fiche d'aide. */
  private recupererFicheAide(intitule: Intitule): string {

    // A) Chercher si une fiche d'aide exacte existe (avec accents)
    let ficheAide = this.jeu.aides.find(x => x.infinitif === intitule.nom);

    // B) Chercher l'infinitif original de l'action
    if (!ficheAide) {
      let actionOriginaleTrouvee: Action | undefined;
      for (const action of this.jeu.actions) {
        for (const synonyme of action.synonymes) {
          if (synonyme == intitule.nom) {
            actionOriginaleTrouvee = action;
            break;
          }
        }
        if (actionOriginaleTrouvee) {
          break;
        }
      }
      if (actionOriginaleTrouvee) {
        ficheAide = this.jeu.aides.find(x => x.infinitif == actionOriginaleTrouvee.infinitif);
      }
    }

    // renvoyer l'aide trouvée
    if (ficheAide) {
      return ficheAide.informations;
    } else {
      return this.recupererFicheAideSansTenirCompteDesAccents(intitule);
    }

  }

  private recupererFicheAideSansTenirCompteDesAccents(intitule: Intitule): string {

    const nomNormalise = StringUtils.normaliserMot(intitule.nom)

    // A) Chercher si une fiche d'aide exacte existe (avec accents)
    let ficheAide = this.jeu.aides.find(x => StringUtils.normaliserMot(x.infinitif) === nomNormalise);

    // B) Chercher l'inifitif original de l'action
    if (!ficheAide) {
      let actionOriginaleTrouvee: Action | undefined;
      for (const action of this.jeu.actions) {
        for (const synonymeSansAccent of action.synonymesSansAccent) {
          if (synonymeSansAccent == nomNormalise) {
            actionOriginaleTrouvee = action;
            break;
          }
        }
        if (actionOriginaleTrouvee) {
          break;
        }
      }
      if (actionOriginaleTrouvee) {
        ficheAide = this.jeu.aides.find(x => x.infinitif == actionOriginaleTrouvee.infinitif);
      }
    }

    // renvoyer l'aide trouvée
    if (ficheAide) {
      return ficheAide.informations;
    } else {
      return "Désolé, je n'ai pas de page d'aide concernant la commande « " + intitule.nom + " »";
    }

  }

  /** Afficher le statut d'une porte ou d'un contenant (verrouillé, ouvrable, ouvert, fermé) */
  afficherStatut(obj: Objet) {
    let retVal = "";
    if (ClasseUtils.heriteDe(obj.classe, EClasseRacine.contenant) || ClasseUtils.heriteDe(obj.classe, EClasseRacine.porte)) {

      const ouvrable = this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.ouvrableID);
      const ouvert = this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.ouvertID);
      const verrouillable = this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.verrouillableID);;
      const verrou = this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.verrouilleID);;

      if (obj.genre == Genre.f) {
        if (ouvert) {
          // pas besoin de préciser qu'on contenant est ouvert, sauf s'il est ouvrable.
          if (!ClasseUtils.heriteDe(obj.classe, EClasseRacine.contenant) || ouvrable) {
            retVal += "Elle est ouverte.";
          }
        } else {
          retVal += "Elle est fermée" + (verrouillable ? (verrou ? " et verrouillée." : " mais pas verrouillée.") : ".");
        }
        if (ouvrable && !verrou) {
          retVal += " Vous pouvez " + (ouvert ? 'la fermer.' : 'l’ouvrir.');
        }
      } else {
        if (ouvert) {
          // pas besoin de préciser qu'on contenant est ouvert, sauf s'il est ouvrable.
          if (!ClasseUtils.heriteDe(obj.classe, EClasseRacine.contenant) || ouvrable) {
            retVal += "Il est ouvert.";
          }
        } else {
          retVal += "Il est fermé" + (verrouillable ? (verrou ? " et verrouillé." : " mais pas verrouillé.") : ".");
        }
        if (ouvrable && !verrou) {
          retVal += " Vous pouvez " + (ouvert ? 'le fermer.' : 'l’ouvrir.');
        }
      }
    }
    return retVal;
  }

}
