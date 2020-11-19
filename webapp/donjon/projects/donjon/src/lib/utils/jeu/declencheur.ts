import { Auditeur } from '../../models/jouer/auditeur';
import { Evenement } from '../../models/jouer/evenement';
import { Instruction } from '../../models/compilateur/instruction';
import { TypeRegle } from '../../models/compilateur/type-regle';

export class Declencheur {

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
          console.error("Declencheur > type d’auditeur inconnu:", aud.type);
          break;
      }
    });
  }

  private retrouverInstructions(auditeurs: Auditeur[], evenement: Evenement): Instruction[] {
    let instructions = new Array<Instruction>();
    auditeurs.forEach(aud => {
      // console.log(">>> check", aud);
      if (aud.evenement.infinitif === evenement.infinitif) {
        if (((!aud.evenement.ceci && !evenement.ceci) || (aud.evenement.ceci === evenement.ceci))
          && ((!aud.evenement.cela && !evenement.cela) || (aud.evenement.cela === evenement.cela))
        ) {
          aud.instructions.forEach(ins => {
            instructions.push(ins);
          });
          if (this.verbeux) {
            console.log(">> déclanchement pour : ", aud.evenement.infinitif, (aud.evenement.ceci ? aud.evenement.ceci : '-'), (aud.evenement.cela ? aud.evenement.cela : '-'));
          }
        }
      }

    });
    return instructions;
  }

  avant(evenement: Evenement) {
    if (this.verbeux) {
      // console.log("Declencheur >>> AVANT", evenement);
    }
    return this.retrouverInstructions(this.auditeursAvant, evenement);
  }

  apres(evenement: Evenement) {
    if (this.verbeux) {
      // console.log("Declencheur >>> APRÈS", evenement);
    }
    return this.retrouverInstructions(this.auditeursApres, evenement);
  }

  remplacer(evenement: Evenement) {
    if (this.verbeux) {
      // console.log("Declencheur >>> REMPLACER", evenement);
    }
    return this.retrouverInstructions(this.auditeursRemplacer, evenement);
  }

}
