import { Compteur } from "../../models/compilateur/compteur";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { InstructionsUtils } from "./instructions-utils";

export class InstructionDireNumerique {

  constructor(private eju: ElementsJeuUtils) { }

  calculerBaliseCompteur(texteDynamique: string, evenement: Evenement | undefined): string {
    return InstructionsUtils.processBalises(texteDynamique, "c (.+?)", decoupe => {
      const compteurString = decoupe[1];
      let compteur: Compteur = null;
      if (compteurString == 'quantitéCeci' || compteurString == 'quantiteCeci') {
        compteur = new Compteur('quantitéCeci', evenement.quantiteCeci);
      } else if (compteurString == 'quantitéCela' || compteurString == 'quantiteCela') {
        compteur = new Compteur('quantitéCela', evenement.quantiteCela);
      } else {
        compteur = this.eju.trouverCompteurAvecNom(compteurString);
      }
      return compteur ? compteur.valeur.toString() : "(compteur « " + compteurString + " » pas trouvé)";
    });
  }

  calculerBaliseCalendrier(texteDynamique: string): string {
    const baliseCalendrier = "(calendrier|(?:0?(?:jour|date|mois|ann(?:é|e|è)e)))";
    const maintenant = new Date();
    const zeroPad = (num, places) => String(num).padStart(places, '0');
    return InstructionsUtils.processBalises(texteDynamique, baliseCalendrier, decoupe => {
      const unite = InstructionsUtils.normaliserAccents(decoupe[1]?.toLocaleLowerCase() ?? '');
      switch (unite) {
        case 'jour': return ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeurdi', 'vendredi', 'samedi'][maintenant.getDay()];
        case 'date': return maintenant.getDate().toString();
        case 'mois': return ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][maintenant.getMonth()];
        case 'annee': return maintenant.getFullYear().toString();
        case '0jour': return [7, 1, 2, 3, 4, 5, 6][maintenant.getDay()].toString();
        case '0date': return zeroPad(maintenant.getDate(), 2);
        case '0mois': return zeroPad(maintenant.getMonth() + 1, 2);
        case '0annee': return maintenant.getFullYear().toString();
        case 'calendrier': default: return `${zeroPad(maintenant.getHours(), 2)}:${zeroPad(maintenant.getMinutes(), 2)}`;
      }
    });
  }

  calculerBaliseHorloge(texteDynamique: string): string {
    const baliseHorloge = "(horloge|(?:0?(?:heure|minute|seconde)))s*";
    const maintenant = new Date();
    const zeroPad = (num, places) => String(num).padStart(places, '0');
    return InstructionsUtils.processBalises(texteDynamique, baliseHorloge, decoupe => {
      const unite = decoupe[1]?.toLocaleLowerCase();
      switch (unite) {
        case 'heure': return maintenant.getHours().toString();
        case 'minute': return maintenant.getMinutes().toString();
        case 'seconde': return maintenant.getSeconds().toString();
        case '0heure': return zeroPad(maintenant.getHours(), 2);
        case '0minute': return zeroPad(maintenant.getMinutes(), 2);
        case '0seconde': return zeroPad(maintenant.getSeconds(), 2);
        case 'horloge': default: return `${zeroPad(maintenant.getHours(), 2)}:${zeroPad(maintenant.getMinutes(), 2)}`;
      }
    });
  }

  calculerBaliseMémoire(texteDynamique: string, ctxTour: ContexteTour | undefined): string {
    return InstructionsUtils.processBalises(texteDynamique, "(mémoire|memoire) (.+?)", decoupe => {
      const elementTrouve = ctxTour.trouverValeur(decoupe[2]);
      return elementTrouve ? elementTrouve.toString() : '(mémoire pas trouvée: ' + decoupe[2] + ')';
    });
  }

}
