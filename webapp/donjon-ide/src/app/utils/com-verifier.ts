import { ElementsPhrase } from '../models/commun/elements-phrase';

export class VerifierCommande {

  aide() {
    return true;
  }

  ouSuisJe() {
    return true;
  }

  deverrouillerCeciAvecCela(els: ElementsPhrase) {
    if (!els.sujet) {
      return "Déverrouiller quoi ?";
    } else if (!els.preposition || !els.sujetComplement) {
      return "Déverrouiller comment ?";
    } else {
      return true;
    }
  }
  
}