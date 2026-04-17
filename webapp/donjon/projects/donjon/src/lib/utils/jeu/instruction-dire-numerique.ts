import { Compteur } from "../../models/compilateur/compteur";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { InstructionsUtils } from "./instructions-utils";

export class InstructionDireNumerique {

  constructor(private eju: ElementsJeuUtils) { }

  calculerBaliseCompteur(texteDynamique: string, evenement: Evenement | undefined): string {
    const balises = InstructionsUtils.extraireBalises(texteDynamique, "c (.+?)");
    if (balises) {
      for (const decoupe of balises) {
        const compteurString = decoupe[1];
        let compteur: Compteur = null;
        if (compteurString == 'quantitéCeci' || compteurString == 'quantiteCeci') {
          compteur = new Compteur('quantitéCeci', evenement.quantiteCeci);
        } else if (compteurString == 'quantitéCela' || compteurString == 'quantiteCela') {
          compteur = new Compteur('quantitéCela', evenement.quantiteCela);
        } else {
          compteur = this.eju.trouverCompteurAvecNom(compteurString);
        }
        const resultat = compteur ? compteur.valeur.toString() : "(compteur « " + compteurString + " » pas trouvé)";
        const xCurBalise = new RegExp("\\[c " + compteurString + "\\]", "g");
        texteDynamique = texteDynamique.replace(xCurBalise, resultat);
      }
    }
    return texteDynamique;
  }

  calculerBaliseCalendrier(texteDynamique: string): string {
    const baliseCalendrier = "(calendrier|(?:0?(?:jour|date|mois|ann(?:é|e|è)e)))";
    const balises = InstructionsUtils.extraireBalises(texteDynamique, baliseCalendrier);
    if (balises) {
      const maintenant = new Date();
      const zeroPad = (num, places) => String(num).padStart(places, '0');
      for (const decoupe of balises) {
        const unite = decoupe[1]?.toLocaleLowerCase();
        let valeur: string;
        switch (unite) {
          case 'jour': valeur = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeurdi', 'vendredi', 'samedi'][maintenant.getDay()]; break;
          case 'date': valeur = maintenant.getDate().toString(); break;
          case 'mois': valeur = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][maintenant.getMonth()]; break;
          case 'année': case 'annee': case 'annèe': valeur = maintenant.getFullYear().toString(); break;
          case '0jour': valeur = [7, 1, 2, 3, 4, 5, 6][maintenant.getDay()].toString(); break;
          case '0date': valeur = zeroPad(maintenant.getDate(), 2); break;
          case '0mois': valeur = zeroPad(maintenant.getMonth() + 1, 2); break;
          case '0année': case '0annee': case '0annèe': valeur = maintenant.getFullYear().toString(); break;
          case 'calendrier': default: valeur = `${zeroPad(maintenant.getHours(), 2)}:${zeroPad(maintenant.getMinutes(), 2)}`; break;
        }
        const inner = decoupe[0].slice(1, -1);
        texteDynamique = texteDynamique.replace(new RegExp("\\[" + inner + "\\]", "g"), valeur);
      }
    }
    return texteDynamique;
  }

  calculerBaliseHorloge(texteDynamique: string): string {
    const baliseHorloge = "(horloge|(?:0?(?:heure|minute|seconde)))s*";
    const balises = InstructionsUtils.extraireBalises(texteDynamique, baliseHorloge);
    if (balises) {
      const maintenant = new Date();
      const zeroPad = (num, places) => String(num).padStart(places, '0');
      for (const decoupe of balises) {
        const unite = decoupe[1]?.toLocaleLowerCase();
        let valeur: string;
        switch (unite) {
          case 'heure': valeur = maintenant.getHours().toString(); break;
          case 'minute': valeur = maintenant.getMinutes().toString(); break;
          case 'seconde': valeur = maintenant.getSeconds().toString(); break;
          case '0heure': valeur = zeroPad(maintenant.getHours(), 2); break;
          case '0minute': valeur = zeroPad(maintenant.getMinutes(), 2); break;
          case '0seconde': valeur = zeroPad(maintenant.getSeconds(), 2); break;
          case 'horloge': default: valeur = `${zeroPad(maintenant.getHours(), 2)}:${zeroPad(maintenant.getMinutes(), 2)}`; break;
        }
        const inner = decoupe[0].slice(1, -1);
        texteDynamique = texteDynamique.replace(new RegExp("\\[" + inner + "\\]", "g"), valeur);
      }
    }
    return texteDynamique;
  }

  calculerBaliseMémoire(texteDynamique: string, ctxTour: ContexteTour | undefined): string {
    const baliseMemoire = "(mémoire|memoire) (.+?)";
    const balises = InstructionsUtils.extraireBalises(texteDynamique, baliseMemoire);
    if (balises) {
      for (const decoupe of balises) {
        const memoire = decoupe[1];
        const intituleValeurOuListe = decoupe[2];
        const elementTrouve = ctxTour.trouverValeur(intituleValeurOuListe);
        const valeur = elementTrouve ? elementTrouve.toString() : '(mémoire pas trouvée: ' + intituleValeurOuListe + ')';
        texteDynamique = texteDynamique.replace(new RegExp("\\[" + memoire + " " + intituleValeurOuListe + "\\]", "g"), valeur);
      }
    }
    return texteDynamique;
  }

}
