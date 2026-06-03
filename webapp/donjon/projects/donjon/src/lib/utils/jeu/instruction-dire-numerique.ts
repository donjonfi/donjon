import { ClasseUtils } from "../commun/classe-utils";
import { HorlogeUtils } from "./horloge-utils";
import { Compteur } from "../../models/compilateur/compteur";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { EClasseRacine } from "../../models/commun/constantes";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { InstructionsUtils } from "./instructions-utils";

const xTailleListe = /^taille (du |de la |de l\S|des |de )(.+)$/i;

export class InstructionDireNumerique {

  constructor(private eju: ElementsJeuUtils) { }

  calculerBaliseCompteur(texteDynamique: string, evenement: Evenement | undefined, ctxTour: ContexteTour | undefined): string {
    return InstructionsUtils.processBalises(texteDynamique, "c (.+?)", decoupe => {
      const nomBalise = decoupe[1];
      const val = this.obtenirValeurNumeriqueBalise(nomBalise, evenement, ctxTour);
      return val !== null ? val.toString() : "(compteur « " + nomBalise + " » pas trouvé)";
    });
  }

  calculerBalisePluriel(texteDynamique: string, evenement: Evenement | undefined, ctxTour: ContexteTour | undefined): string {
    return InstructionsUtils.processBalises(texteDynamique, "s (.+?)", decoupe => {
      const val = this.obtenirValeurNumeriqueBalise(decoupe[1], evenement, ctxTour);
      return val !== null ? (val <= 1 ? "" : "s") : "";
    });
  }

  private obtenirValeurNumeriqueBalise(nomBalise: string, evenement: Evenement | undefined, ctxTour: ContexteTour | undefined): number | null {
    const matchTaille = xTailleListe.exec(nomBalise);
    if (matchTaille) {
      const liste = this.eju.trouverListeAvecNom(matchTaille[2]);
      return liste !== undefined ? liste.taille : null;
    }
    if (nomBalise === 'quantitéCeci' || nomBalise === 'quantiteCeci') {
      return evenement?.quantiteCeci ?? null;
    }
    if (nomBalise === 'quantitéCela' || nomBalise === 'quantiteCela') {
      return evenement?.quantiteCela ?? null;
    }
    // Param de routine : [c ceci] / [c cela] quand ceci/cela est un compteur
    // (réel ou synthétique via param `nombre`).
    if (nomBalise === 'ceci' && ctxTour?.ceci && ClasseUtils.heriteDe(ctxTour.ceci.classe, EClasseRacine.compteur)) {
      return (ctxTour.ceci as Compteur).valeur;
    }
    if (nomBalise === 'cela' && ctxTour?.cela && ClasseUtils.heriteDe(ctxTour.cela.classe, EClasseRacine.compteur)) {
      return (ctxTour.cela as Compteur).valeur;
    }
    const compteur = this.eju.trouverCompteurAvecNom(nomBalise);
    return compteur !== undefined ? compteur.valeur : null;
  }

  calculerBaliseCalendrier(texteDynamique: string, getMaintenant?: () => Date): string {
    const baliseCalendrier = "(calendrier|(?:0?(?:jour|date|mois|ann(?:é|e|è)e)))";
    // Lecture d'horloge paresseuse et partagée (cf. instruction-dire.calculerTexteDynamique) :
    // une seule lecture par `dire`, partagée entre calendrier et horloge.
    let maintenant: Date | undefined;
    const lire = getMaintenant ?? (() => HorlogeUtils.maintenant());
    const zeroPad = (num, places) => String(num).padStart(places, '0');
    return InstructionsUtils.processBalises(texteDynamique, baliseCalendrier, decoupe => {
      maintenant ??= lire();
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

  calculerBaliseHorloge(texteDynamique: string, getMaintenant?: () => Date): string {
    const baliseHorloge = "(horloge|(?:0?(?:heure|minute|seconde)))s*";
    // Lecture d'horloge paresseuse et partagée (cf. calculerBaliseCalendrier).
    let maintenant: Date | undefined;
    const lire = getMaintenant ?? (() => HorlogeUtils.maintenant());
    const zeroPad = (num, places) => String(num).padStart(places, '0');
    return InstructionsUtils.processBalises(texteDynamique, baliseHorloge, decoupe => {
      maintenant ??= lire();
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
