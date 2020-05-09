import { Auditeur } from '../models/jouer/auditeur';
import { ElementsPhrase } from '../models/commun/elements-phrase';
import { Instruction } from '../models/compilateur/instruction';
import { TypeRegle } from '../models/compilateur/type-regle';

export class Declancheur {

  private auditeursAvant: Auditeur[] = [];
  private auditeursApres: Auditeur[] = [];
  private auditeursRemplacer: Auditeur[] = [];

  constructor(
    auditeurs: Auditeur[],
    public verbeux = false,
  ) {
    auditeurs.forEach(aud => {
      switch (aud.type) {
        case TypeRegle.avant:
          this.auditeursAvant.push(aud);
          break;

        case TypeRegle.apres:
          this.auditeursAvant.push(aud);
          break;

        case TypeRegle.remplacer:
          this.auditeursAvant.push(aud);
          break;

        default:
          console.error("Declancheur > type d’auditeur inconnu:", aud.type);
          break;
      }
    });
  }

  private retrouverInstructions(auditeurs: Auditeur[], evenement: ElementsPhrase): Instruction[] {
    let instructions = new Array<Instruction>();
    auditeurs.forEach(aud => {
      console.log(">>> check", aud);

      if (aud.sujet.nom == evenement.sujet.nom) {
        if (aud.verbe == evenement.verbe) {
          aud.instructions.forEach(ins => {
            instructions.push(ins);
          });
          if (this.verbeux) {
            console.log(">>> sujet et verbe trouvés: ", aud.sujet, aud.verbe);
          }
        } else {
          if (this.verbeux) {
            console.log(">>> sujet seul trouvé: ", aud.sujet);
          }
        }
      }
    });
    return instructions;
  }

  avant(evenement: ElementsPhrase) {
    if (this.verbeux) {
      console.log("Declancheur >>> AVANT", evenement);
    }
    return this.retrouverInstructions(this.auditeursAvant, evenement);
  }

  apres(evenement: ElementsPhrase) {
    if (this.verbeux) {
      console.log("Declancheur >>> APRÈS", evenement);
    }
    return this.retrouverInstructions(this.auditeursApres, evenement);
  }

  remplacer(evenement: ElementsPhrase) {
    if (this.verbeux) {
      console.log("Declancheur >>> REMPLACER", evenement);
    }
    return this.retrouverInstructions(this.auditeursRemplacer, evenement);
  }

}
