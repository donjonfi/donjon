import { Auditeur } from '../../models/jouer/auditeur';
import { Evenement } from '../../models/jouer/evenement';
import { Instruction } from '../../models/compilateur/instruction';
import { TypeRegle } from '../../models/compilateur/type-regle';
import { ClasseUtils } from '../commun/classe-utils';

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

    let scoreAuditeursDeclanches: [Auditeur, number][] = [];

    const scoreCorrespondanceExact: number = 1000;
    const scoreCorrespondanceSemiExact: number = 500;
    const scoreCorrespondanceClasse: number = 1;

    let meilleurScore = 0;

    auditeurs.forEach(aud => {
      // si un des évènement de l’auditeur est valide, ne pas tester les suivants
      let meilleurScorePourCetAuditeur = 0;
      aud.evenements.forEach(curAudEvenement => {
        // vérifier infinitif
        if (curAudEvenement.infinitif === evenement.infinitif) {
          // A) aucun argument
          if (!evenement.isCeci && !evenement.isCela) {
            // même type d’évènement ?
            if (!curAudEvenement.isCeci && !curAudEvenement.isCela) {
              meilleurScorePourCetAuditeur = scoreCorrespondanceExact;
            }
            // B) ceci uniquement
          } else if (evenement.isCeci && !evenement.isCela) {
            // même type d’évènement ?
            if (curAudEvenement.isCeci && !curAudEvenement.isCela) {
              // classe => vérifier si la classe hérite
              if (curAudEvenement.classeCeci !== null) {
                if (ClasseUtils.heriteDe(evenement.classeCeci, curAudEvenement.classeCeci.nom)) {
                  let curScore = scoreCorrespondanceClasse + curAudEvenement.classeCeci.niveau;
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                }
                // élément => vérifier si l’élément exact correspond
              } else if (curAudEvenement.ceci === evenement.ceci) {
                meilleurScorePourCetAuditeur = scoreCorrespondanceExact;
              }
            }
            // C) cela uniquement
          } else if (!evenement.isCeci && evenement.isCela) {
            // même type d’évènement ?
            if (!curAudEvenement.isCeci && curAudEvenement.isCela) {
              // classe => vérifier si la classe hérite
              if (curAudEvenement.classeCela !== null) {
                if (ClasseUtils.heriteDe(evenement.classeCela, curAudEvenement.classeCela.nom)) {
                  let curScore = scoreCorrespondanceClasse + curAudEvenement.classeCela.niveau;
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                }
                // élément => vérifier si l’élément exact correspond
              } else if (curAudEvenement.cela === evenement.cela) {
                meilleurScorePourCetAuditeur = scoreCorrespondanceExact;
              }
            }
            // D) ceci et cela
          } else {
            // même type d’évènement ?
            if (curAudEvenement.isCeci && curAudEvenement.isCela) {
              // a. ceci: élément, cela: élément
              if (!curAudEvenement.classeCeci && !curAudEvenement.classeCela) {
                if (curAudEvenement.ceci === evenement.ceci && curAudEvenement.cela === curAudEvenement.cela) {
                  meilleurScorePourCetAuditeur = scoreCorrespondanceExact;
                }
                // b. ceci: élément, cela: classe
              } else if (!curAudEvenement.classeCeci) {
                if (curAudEvenement.ceci === evenement.ceci && ClasseUtils.heriteDe(evenement.classeCela, curAudEvenement.classeCela.nom)) {
                  let curScore = scoreCorrespondanceSemiExact + curAudEvenement.classeCela.niveau;
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                }
                // c. ceci: classe, cela: élément
              } else if (!curAudEvenement.classeCela) {
                if (ClasseUtils.heriteDe(evenement.classeCeci, curAudEvenement.classeCeci.nom) && curAudEvenement.cela === curAudEvenement.cela) {
                  let curScore = scoreCorrespondanceSemiExact + curAudEvenement.classeCeci.niveau;
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                }
                // d. ceci: classe, cela: classe
              } else {
                if (ClasseUtils.heriteDe(evenement.classeCeci, curAudEvenement.classeCeci.nom) && ClasseUtils.heriteDe(evenement.classeCela, curAudEvenement.classeCela.nom)) {
                  let curScore = scoreCorrespondanceClasse + Math.max(curAudEvenement.classeCeci.niveau, curAudEvenement.classeCela.niveau);
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                }
              }
            }
          }

        }
      });

      // si l’auditeur a été délclanché
      if (meilleurScorePourCetAuditeur) {
        // ajouter l’auditeur au tableau des scores
        scoreAuditeursDeclanches.push([aud, meilleurScorePourCetAuditeur]);
        // calculer le score le plus élevé
        meilleurScore = Math.max(meilleurScore, meilleurScorePourCetAuditeur);
      }
    });

    // ajouter les instructions du ou des déclancheurs avec le score le plus élevé uniquement.
    scoreAuditeursDeclanches.forEach(auditeurScore => {
      if (auditeurScore[1] === meilleurScore) {
        auditeurScore[0].instructions.forEach(ins => {
          instructions.push(ins);
        });
      }
    });

    return instructions;
  }

  avant(evenement: Evenement): Instruction[] {
    if (this.verbeux) {
      //   console.log("Declencheur >>> AVANT", evenement);
    }
    return this.retrouverInstructions(this.auditeursAvant, evenement);
  }

  apres(evenement: Evenement): Instruction[] {
    if (this.verbeux) {
      // console.log("Declencheur >>> APRÈS", evenement);
    }
    return this.retrouverInstructions(this.auditeursApres, evenement);
  }

  remplacer(evenement: Evenement): Instruction[] {
    if (this.verbeux) {
      // console.log("Declencheur >>> REMPLACER", evenement);
    }
    return this.retrouverInstructions(this.auditeursRemplacer, evenement);
  }

}
