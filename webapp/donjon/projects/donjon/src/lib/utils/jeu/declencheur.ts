import { Auditeur } from '../../models/jouer/auditeur';
import { ClasseUtils } from '../commun/classe-utils';
import { Declenchement } from '../../models/jouer/declenchement';
import { Evenement } from '../../models/jouer/evenement';
import { TypeRegle } from '../../models/compilateur/type-regle';

export class Declencheur {

  /** Auditeurs pour les règles « avant » */
  private auditeursAvant: Auditeur[] = [];
  /** Auditeurs pour les règles « après » */
  private auditeursApres: Auditeur[] = [];
  /** Auditeurs pour les règles « remplacer » */
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

  private retrouverInstructions(evenement: Evenement, typeRegle: TypeRegle): Declenchement[] {

    let auditeurs: Auditeur[] = null;

    switch (typeRegle) {
      case TypeRegle.avant:
        auditeurs = this.auditeursAvant;
        break;

      case TypeRegle.apres:
        auditeurs = this.auditeursApres;
        break;

      case TypeRegle.remplacer:
        auditeurs = this.auditeursApres;
        break;

      default:
        console.error("retrouverInstructions: type de règle pas connu: ", typeRegle);
        break;
    }

    let declenchements = new Array<Declenchement>();

    let scoreAuditeursDeclanches: [Auditeur, number][] = [];

    const scoreCorrespondanceExact: number = 4000;
    const scoreCorrespondanceSemiExact: number = 2000;
    const scoreCorrespondanceClasse: number = 1000;
    const scoreCorrespondanceSemiClasse: number = 500;
    const scoreCorrespondanceCeciCela: number = 250;
    const scoreCorrespondanceSemiCeciCela: number = 125;

    let meilleurScore = 0;



    auditeurs.forEach(aud => {
      // si un des évènement de l’auditeur est valide, ne pas tester les suivants
      let meilleurScorePourCetAuditeur = 0;
      aud.evenements.forEach(curAudEvenement => {
        // vérifier infinitif
        if (curAudEvenement.infinitif === evenement.infinitif) {
          // A) AUCUN ARGUMENT
          if (!evenement.isCeci && !evenement.isCela) {
            // même type d’évènement ?
            if (!curAudEvenement.isCeci && !curAudEvenement.isCela) {
              meilleurScorePourCetAuditeur = scoreCorrespondanceExact;
            }
            // B) CECI UNIQUEMENT
          } else if (evenement.isCeci && !evenement.isCela) {
            // même type d’évènement ?
            if (curAudEvenement.isCeci && !curAudEvenement.isCela) {
              // ––––––––––––––––––––––––––––––
              // a. ceci: classe
              // ––––––––––––––––––––––––––––––
              if (curAudEvenement.classeCeci !== null) {
                if (ClasseUtils.heriteDe(evenement.classeCeci, curAudEvenement.classeCeci.nom)) {
                  let curScore = scoreCorrespondanceClasse + curAudEvenement.classeCeci.niveau;
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                }
                // ––––––––––––––––––––––––––––––
                // b. ceci: 'ceci' générique (on accepte aussi 'cela')
                // ––––––––––––––––––––––––––––––
              } else if (curAudEvenement.ceci === 'ceci' || curAudEvenement.ceci === 'cela') {
                let curScore = scoreCorrespondanceCeciCela;
                meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                // ––––––––––––––––––––––––––––––
                // c. ceci: élément
                // ––––––––––––––––––––––––––––––
              } else if (curAudEvenement.ceci === evenement.ceci) {
                meilleurScorePourCetAuditeur = scoreCorrespondanceExact;
              }
            }
            // C) CELA UNIQUEMENT => NE DEVRAIT JAMAIS SE PRODUIRE
          } else if (!evenement.isCeci && evenement.isCela) {
            console.error("Déclencheur ne peut pas se faire sur « cela » uniquement. Seuls « (rien) », « ceci » et « ceci et cela » sont autorisés.");
            // D) CECI ET CELA
          } else {
            // même type d’évènement ?
            if (curAudEvenement.isCeci && curAudEvenement.isCela) {
              // ––––––––––––––––––––––––––––––
              // a. ceci: élément, cela: élément
              // ––––––––––––––––––––––––––––––
              if (!curAudEvenement.classeCeci && !curAudEvenement.classeCela) {
                // a.1 ceci: 'ceci' générique, cela: 'cela' générique (on accepte aussi 'cela' et 'ceci')
                if ((curAudEvenement.ceci === 'ceci' || curAudEvenement.ceci === 'cela') && (curAudEvenement.cela === 'cela' || curAudEvenement.cela === 'ceci')) {
                  let curScore = scoreCorrespondanceCeciCela;
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                  // a.2 ceci: 'ceci' générique, cela: élément
                } else if ((curAudEvenement.ceci === 'ceci' || curAudEvenement.ceci === 'cela') && curAudEvenement.cela === evenement.cela) {
                  let curScore = scoreCorrespondanceSemiCeciCela + scoreCorrespondanceSemiExact;
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                  // a.3 ceci: élément, cela: 'cela' générique
                } else if (curAudEvenement.ceci === evenement.ceci && (curAudEvenement.cela === 'cela' || curAudEvenement.cela === 'ceci')) {
                  let curScore = scoreCorrespondanceSemiExact + scoreCorrespondanceSemiCeciCela;
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                  // a.4 ceci: élément, cela: élément
                } else if (curAudEvenement.ceci === evenement.ceci && curAudEvenement.cela === evenement.cela) {
                  meilleurScorePourCetAuditeur = scoreCorrespondanceExact;
                }
                // ––––––––––––––––––––––––––––––
                // b. ceci: élément, cela: classe
                // ––––––––––––––––––––––––––––––
              } else if (!curAudEvenement.classeCeci) {
                // b.1 ceci: 'ceci' générique, cela: classe
                if ((curAudEvenement.ceci === 'ceci' || curAudEvenement.ceci === 'cela') && ClasseUtils.heriteDe(evenement.classeCela, curAudEvenement.classeCela.nom)) {
                  let curScore = scoreCorrespondanceSemiCeciCela + scoreCorrespondanceSemiClasse + curAudEvenement.classeCela.niveau;
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                  // b.2 ceci: élément, cela: classe
                } else if (curAudEvenement.ceci === evenement.ceci && ClasseUtils.heriteDe(evenement.classeCela, curAudEvenement.classeCela.nom)) {
                  let curScore = scoreCorrespondanceSemiExact + scoreCorrespondanceSemiClasse + curAudEvenement.classeCela.niveau;
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                }
                // ––––––––––––––––––––––––––––––
                // c. ceci: classe, cela: élément
                // ––––––––––––––––––––––––––––––
              } else if (!curAudEvenement.classeCela) {
                // c.1 ceci: classe, cela: 'cela' générique
                if (ClasseUtils.heriteDe(evenement.classeCeci, curAudEvenement.classeCeci.nom) && (curAudEvenement.cela === 'cela' || curAudEvenement.cela === 'ceci')) {
                  let curScore = scoreCorrespondanceSemiClasse + curAudEvenement.classeCeci.niveau + scoreCorrespondanceSemiCeciCela;
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                  // c.2 ceci: classe, cela: élément
                } else if (ClasseUtils.heriteDe(evenement.classeCeci, curAudEvenement.classeCeci.nom) && curAudEvenement.cela === evenement.cela) {
                  let curScore = scoreCorrespondanceSemiExact + scoreCorrespondanceSemiClasse + curAudEvenement.classeCeci.niveau;
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                }
                // ––––––––––––––––––––––––––––––
                // d. ceci: classe, cela: classe
                // ––––––––––––––––––––––––––––––
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

      // si l’auditeur a été déclenché
      if (meilleurScorePourCetAuditeur) {
        // ajouter l’auditeur au tableau des scores
        scoreAuditeursDeclanches.push([aud, meilleurScorePourCetAuditeur]);
        // calculer le score le plus élevé
        meilleurScore = Math.max(meilleurScore, meilleurScorePourCetAuditeur);
      }
    });

    // ajouter les instructions du ou des déclencheurs avec le score le plus élevé uniquement.
    scoreAuditeursDeclanches.forEach(auditeurScore => {
      // s’agit-il du meilleur score ?
      if (auditeurScore[1] === meilleurScore) {
        // ajouter un déclenchement
        declenchements.push(new Declenchement(auditeurScore[0].instructions, ++auditeurScore[0].declenchements));
      }
    });

    return declenchements;
  }

  avant(evenement: Evenement): Declenchement[] {
    if (this.verbeux) {
      //   console.log("Declencheur >>> AVANT", evenement);
    }
    return this.retrouverInstructions(evenement, TypeRegle.avant);
  }

  apres(evenement: Evenement): Declenchement[] {
    if (this.verbeux) {
      // console.log("Declencheur >>> APRÈS", evenement);
    }
    return this.retrouverInstructions(evenement, TypeRegle.apres);
  }

  remplacer(evenement: Evenement): Declenchement[] {
    if (this.verbeux) {
      // console.log("Declencheur >>> REMPLACER", evenement);
    }
    return this.retrouverInstructions(evenement, TypeRegle.remplacer);
  }

}
