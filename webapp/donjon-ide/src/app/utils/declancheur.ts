import { Auditeur } from '../models/jouer/auditeur';
import { ElementsPhrase } from '../models/commun/elements-phrase';
import { Evenement } from '../models/jouer/evenement';
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
          this.auditeursApres.push(aud);
          break;

        case TypeRegle.remplacer:
          this.auditeursRemplacer.push(aud);
          break;

        default:
          console.error("Declancheur > type d’auditeur inconnu:", aud.type);
          break;
      }
    });
  }

  private retrouverInstructions(auditeurs: Auditeur[], evenement: Evenement): Instruction[] {
    let instructions = new Array<Instruction>();
    auditeurs.forEach(aud => {
      console.log(">>> check", aud);
      if (aud.evenement.infinitif == evenement.infinitif) {
        if ((!aud.evenement.ceci && !evenement.ceci) || (aud.evenement.ceci === evenement.ceci)) {
          aud.instructions.forEach(ins => {
            instructions.push(ins);
          });
          if (this.verbeux) {
            console.log(">>> infinitif et ceci trouvés: ", aud.evenement.infinitif, aud.evenement.ceci);
          }
        } else {
          if (this.verbeux) {
            console.log(">>> infinitif seul trouvé: ", aud.evenement.infinitif);
          }
        }
      }

    });
    return instructions;
  }

  avant(evenement: Evenement) {
    if (this.verbeux) {
      // console.log("Declancheur >>> AVANT", evenement);
    }
    return this.retrouverInstructions(this.auditeursAvant, evenement);
  }

  apres(evenement: Evenement) {
    if (this.verbeux) {
      // console.log("Declancheur >>> APRÈS", evenement);
    }
    return this.retrouverInstructions(this.auditeursApres, evenement);
  }

  remplacer(evenement: Evenement) {
    if (this.verbeux) {
      // console.log("Declancheur >>> REMPLACER", evenement);
    }
    return this.retrouverInstructions(this.auditeursRemplacer, evenement);
  }

}
