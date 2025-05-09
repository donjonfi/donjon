import { Auditeur } from '../../models/jouer/auditeur';
import { ClasseUtils } from '../commun/classe-utils';
import { Declenchement } from '../../models/jouer/declenchement';
import { Evenement } from '../../models/jouer/evenement';
import { TypeEvenement } from '../../models/jouer/type-evenement';
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
        auditeurs = this.auditeursRemplacer;
        break;

      default:
        console.error("retrouverInstructions: type de règle pas connu: ", typeRegle);
        break;
    }

    let declenchements = new Array<Declenchement>();

    let scoreAuditeursDeclanches: [Auditeur, number][] = [];
    // élément exact
    const scoreCorrespondanceExact: number = 4000;
    const scoreCorrespondanceSemiExact: number = 2000;
    // classe correspond
    const scoreCorrespondanceClasse: number = 1000;
    const scoreCorrespondanceSemiClasse: number = 500;
    // nombre d’arguments correspond
    const scoreCorrespondanceCeciCela: number = 250;
    const scoreCorrespondanceSemiCeciCela: number = 125;
    // bonus si infinitif précisé
    const scoreCorrespondanceInfinif: number = 100;

    let meilleurScore = 0;
    let auditeurActionQuelconque: Auditeur = null;

    auditeurs.forEach(aud => {
      // si un des évènement de l’auditeur est valide, ne pas tester les suivants
      let meilleurScorePourCetAuditeur = 0;

      aud.evenements.forEach(curAudEvenement => {

        // vérifier infinitif ou absence d’infinitif
        if (curAudEvenement.infinitif === evenement.infinitif || !curAudEvenement.infinitif) {

          // s’il l’infinitif est précisé (=> parler à xxxxx), cela vaut plus que si infinitif pas précisé (=> action impliquant xxxx)
          let infinitifPrecise = curAudEvenement.infinitif;

          //  - AUDITEUR LIÉ À UNE ACTION QUELCONQUE
          if (!infinitifPrecise && !curAudEvenement.isCeci && !curAudEvenement.isCela) {
            auditeurActionQuelconque = aud;
            auditeurActionQuelconque.estRegleActionQuelconque = true;
            
           // - AUDITEUR CLASSIQUE
          } else {

            // A) AUCUN ARGUMENT
            if (!evenement.isCeci && !evenement.isCela) {
              // même type d’évènement ?
              if (!curAudEvenement.isCeci && !curAudEvenement.isCela) {
                // s’il s’agit d’un auditeur classique (lié à une action spécifique)
                if (curAudEvenement.infinitif) {
                  meilleurScorePourCetAuditeur = scoreCorrespondanceExact;
                }
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
                    let curScore = scoreCorrespondanceClasse + curAudEvenement.classeCeci.niveau + (infinitifPrecise ? scoreCorrespondanceInfinif : 0);
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                  }
                  // ––––––––––––––––––––––––––––––
                  // b. ceci: 'ceci' générique (on accepte aussi 'cela')
                  // ––––––––––––––––––––––––––––––
                } else if (curAudEvenement.ceci === 'ceci' || curAudEvenement.ceci === 'cela') {
                  let curScore = scoreCorrespondanceCeciCela + (infinitifPrecise ? scoreCorrespondanceInfinif : 0);
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                  // ––––––––––––––––––––––––––––––
                  // c. ceci: élément
                  // ––––––––––––––––––––––––––––––
                } else if (curAudEvenement.ceci === evenement.ceci) {
                  let curScore = scoreCorrespondanceExact + (infinitifPrecise ? scoreCorrespondanceInfinif : 0);
                  meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
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
                  // a.1 ceci: 'ceci' générique, cela: 'cela' générique (on accepte aussi inversion 'cela' et 'ceci')
                  if ((curAudEvenement.ceci === 'ceci' || curAudEvenement.ceci === 'cela') && (curAudEvenement.cela === 'cela' || curAudEvenement.cela === 'ceci')) {
                    let curScore = scoreCorrespondanceCeciCela + (infinitifPrecise ? scoreCorrespondanceInfinif : 0);
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                    // a.2 ceci: 'ceci' générique, cela: élément
                  } else if ((curAudEvenement.ceci === 'ceci' || curAudEvenement.ceci === 'cela') && curAudEvenement.cela === evenement.cela) {
                    let curScore = scoreCorrespondanceSemiCeciCela + scoreCorrespondanceSemiExact + (infinitifPrecise ? scoreCorrespondanceInfinif : 0);
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                    // a.3 ceci: élément, cela: 'cela' générique
                  } else if (curAudEvenement.ceci === evenement.ceci && (curAudEvenement.cela === 'cela' || curAudEvenement.cela === 'ceci')) {
                    let curScore = scoreCorrespondanceSemiExact + scoreCorrespondanceSemiCeciCela + (infinitifPrecise ? scoreCorrespondanceInfinif : 0);
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                    // a.4 ceci: élément, cela: élément
                  } else if (curAudEvenement.ceci === evenement.ceci && curAudEvenement.cela === evenement.cela) {
                    let curScore = scoreCorrespondanceExact + (infinitifPrecise ? scoreCorrespondanceInfinif : 0);
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);

                    // a.22 [Infinitif PAS spécifié] ceci: 'ceci' générique, cela: élément => tester inversion ceci<−>cela quand verbe pas précisé (car le « et » est commutatif)
                  } else if (!infinitifPrecise && (curAudEvenement.cela === 'ceci' || curAudEvenement.cela === 'cela') && curAudEvenement.ceci === evenement.cela) {
                    let curScore = scoreCorrespondanceSemiCeciCela + scoreCorrespondanceSemiExact + 0; // infinitif pas spécifié
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                    // a.33 [Infinitif PAS spécifié] ceci: élément, cela: 'cela' générique => tester inversion ceci<−>cela quand verbe pas précisé (car le « et » est commutatif)
                  } else if (!infinitifPrecise && curAudEvenement.cela === evenement.ceci && (curAudEvenement.ceci === 'cela' || curAudEvenement.ceci === 'ceci')) {
                    let curScore = scoreCorrespondanceSemiExact + 0; // infinitif pas spécifié
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                    // a.44 [Infinitif PAS spécifié] ceci: élément, cela: élément => tester inversion ceci<−>cela quand verbe pas précisé (car le « et » est commutatif)
                  } else if (!infinitifPrecise && curAudEvenement.cela === evenement.ceci && curAudEvenement.ceci === evenement.cela) {
                    let curScore = scoreCorrespondanceExact + 0; // infinitif pas spécifié
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                  }
                  // ––––––––––––––––––––––––––––––
                  // b. ceci: élément, cela: classe
                  // ––––––––––––––––––––––––––––––
                } else if (!curAudEvenement.classeCeci) {
                  // b.1 ceci: 'ceci' générique, cela: classe
                  if ((curAudEvenement.ceci === 'ceci' || curAudEvenement.ceci === 'cela') && ClasseUtils.heriteDe(evenement.classeCela, curAudEvenement.classeCela.nom)) {
                    let curScore = scoreCorrespondanceSemiCeciCela + scoreCorrespondanceSemiClasse + curAudEvenement.classeCela.niveau + (infinitifPrecise ? scoreCorrespondanceInfinif : 0);
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                    // b.2 ceci: élément, cela: classe
                  } else if (curAudEvenement.ceci === evenement.ceci && ClasseUtils.heriteDe(evenement.classeCela, curAudEvenement.classeCela.nom)) {
                    let curScore = scoreCorrespondanceSemiExact + scoreCorrespondanceSemiClasse + curAudEvenement.classeCela.niveau + (infinitifPrecise ? scoreCorrespondanceInfinif : 0);
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);

                    // b.11 [Infinitif PAS spécifié] ceci: 'ceci' générique, cela: classe => tester inversion ceci<−>cela quand verbe pas précisé (car le « et » est commutatif)
                  } else if (!infinitifPrecise && (curAudEvenement.cela === 'ceci' || curAudEvenement.cela === 'cela') && ClasseUtils.heriteDe(evenement.classeCela, curAudEvenement.classeCeci.nom)) {
                    let curScore = scoreCorrespondanceSemiCeciCela + scoreCorrespondanceSemiClasse + curAudEvenement.classeCeci.niveau + 0; // infinitif pas spécifié
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                    // b.22 [Infinitif PAS spécifié] ceci: élément, cela: classe => tester inversion ceci<−>cela quand verbe pas précisé (car le « et » est commutatif)
                  } else if (!infinitifPrecise && curAudEvenement.cela === evenement.ceci && ClasseUtils.heriteDe(evenement.classeCela, curAudEvenement.classeCeci.nom)) {
                    let curScore = scoreCorrespondanceSemiExact + scoreCorrespondanceSemiClasse + curAudEvenement.classeCeci.niveau + 0; // infinitif pas spécifié
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                  }

                  // ––––––––––––––––––––––––––––––
                  // c. ceci: classe, cela: élément
                  // ––––––––––––––––––––––––––––––
                } else if (!curAudEvenement.classeCela) {
                  // c.1 ceci: classe, cela: 'cela' générique
                  if (ClasseUtils.heriteDe(evenement.classeCeci, curAudEvenement.classeCeci.nom) && (curAudEvenement.cela === 'cela' || curAudEvenement.cela === 'ceci')) {
                    let curScore = scoreCorrespondanceSemiClasse + curAudEvenement.classeCeci.niveau + scoreCorrespondanceSemiCeciCela + (infinitifPrecise ? scoreCorrespondanceInfinif : 0);
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                    // c.2 ceci: classe, cela: élément
                  } else if (ClasseUtils.heriteDe(evenement.classeCeci, curAudEvenement.classeCeci.nom) && curAudEvenement.cela === evenement.cela) {
                    let curScore = scoreCorrespondanceSemiExact + scoreCorrespondanceSemiClasse + curAudEvenement.classeCeci.niveau + (infinitifPrecise ? scoreCorrespondanceInfinif : 0);
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                  }

                  // c.11 [Infinitif PAS spécifié] ceci: classe, cela: 'cela' générique => tester inversion ceci<−>cela quand verbe pas précisé (car le « et » est commutatif)
                  else if (!infinitifPrecise && ClasseUtils.heriteDe(evenement.classeCeci, curAudEvenement.classeCela.nom) && (curAudEvenement.ceci === 'cela' || curAudEvenement.ceci === 'ceci')) {
                    let curScore = scoreCorrespondanceSemiClasse + curAudEvenement.classeCela.niveau + 0; // infinitif pas spécifié
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                    // c.22 [Infinitif PAS spécifié] ceci: classe, cela: élément => tester inversion ceci<−>cela quand verbe pas précisé (car le « et » est commutatif)
                  } else if (!infinitifPrecise && ClasseUtils.heriteDe(evenement.classeCeci, curAudEvenement.classeCela.nom) && curAudEvenement.ceci === evenement.cela) {
                    let curScore = scoreCorrespondanceSemiExact + scoreCorrespondanceSemiClasse + curAudEvenement.classeCela.niveau + 0; // infinitif pas spécifié
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                  }

                  // ––––––––––––––––––––––––––––––
                  // d. ceci: classe, cela: classe
                  // ––––––––––––––––––––––––––––––
                } else {
                  if (ClasseUtils.heriteDe(evenement.classeCeci, curAudEvenement.classeCeci.nom) && ClasseUtils.heriteDe(evenement.classeCela, curAudEvenement.classeCela.nom)) {
                    let curScore = scoreCorrespondanceClasse + Math.max(curAudEvenement.classeCeci.niveau, curAudEvenement.classeCela.niveau) + (infinitifPrecise ? scoreCorrespondanceInfinif : 0);
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);

                    // [Infinitif PAS spécifié] => tester inversion ceci<−>cela quand verbe pas précisé (car le « et » est commutatif)
                  } else if (!infinitifPrecise && ClasseUtils.heriteDe(evenement.classeCeci, curAudEvenement.classeCela.nom) && ClasseUtils.heriteDe(evenement.classeCela, curAudEvenement.classeCeci.nom)) {
                    let curScore = scoreCorrespondanceClasse + Math.max(curAudEvenement.classeCela.niveau, curAudEvenement.classeCeci.niveau) + 0; // infinitif pas spécifié
                    meilleurScorePourCetAuditeur = Math.max(curScore, meilleurScorePourCetAuditeur);
                  }
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

    // si règle avant « une action quelconque » on l’ajoute toujours au tout début
    if (auditeurActionQuelconque && typeRegle === TypeRegle.avant && evenement.type == TypeEvenement.action) {
      declenchements.push(auditeurActionQuelconque);
    }

    // ajouter les instructions du ou des déclencheurs avec le score le plus élevé uniquement.
    scoreAuditeursDeclanches.forEach(auditeurScore => {
      // s’agit-il du meilleur score ?
      if (auditeurScore[1] === meilleurScore) {
        // ajouter un déclenchement
        declenchements.push(new Declenchement(auditeurScore[0].instructions, ++auditeurScore[0].declenchements));
      }
    });

    // si règle après « une action quelconque » on l’ajoute toujours à la toute fin
    if (auditeurActionQuelconque && typeRegle === TypeRegle.apres && evenement.type == TypeEvenement.action) {
      declenchements.push(auditeurActionQuelconque);
    }

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
