import { ElementsJeuUtils, TypeSujet } from "../commun/elements-jeu-utils";

import { ActionsUtils } from "./actions-utils";
import { CandidatCommande } from "../../models/jouer/candidat-commande";
import { ContexteCommande } from "../../models/jouer/contexte-commande";
import { MotUtils } from "../commun/mot-utils";
import { PhraseUtils } from "../commun/phrase-utils";

export class CommandeurDecomposer {

  /** 
   * Décomposer une commande du joueur.
   * La fonction renvoit éventuellement plusieurs candidats.
   * Les candidats sont triés par score décroissants.
   * Le score est basé sur le nombre d’arguments et la correspondance 
   * entre les arguments et les éléments existants dans le jeu.
   */
  public static decomposerCommande(commande, eju: ElementsJeuUtils, act: ActionsUtils): ContexteCommande {
    // 0. COMMANDE BRUTE
    let ctx = new ContexteCommande();
    ctx.brute = commande;
    // 1. COMMANDE DÉCOMPOSÉE EN ÉLÉMENTS DE PHRASE
    ctx.candidats = PhraseUtils.obtenirLesCommandesPossibles(ctx.brute);

    ctx.candidats.forEach(candidat => {

      // 2. MANIPULATIONS COMMANDE PARLER/DEMANDER/DONNER/MONTRER/…
      // pour la commande parler on s’arrange pour toujours avoir le même ordre pour
      // les arguments (interlocuteur et sujet) de plus certaines formulations sans
      // ambiguïté augmentent le score.
      CommandeurDecomposer.manipulationVerbesParlerDemanderDonnerMontrer(candidat);

      // 3. ANALYSE DE CONSTITUANTS DE LA COMMANDE
      // 1er argument
      candidat.isCeciV1 = candidat.els.sujet ? true : false;
      candidat.ceciIntituleV1 = candidat.els.sujet;
      candidat.ceciQuantiteV1 = candidat.isCeciV1 ? (MotUtils.getQuantite(candidat.els.sujet.determinant, (MotUtils.estFormePlurielle(candidat.els.sujet.nom) ? -1 : 1))) : 0;;
      candidat.correspondCeci = candidat.isCeciV1 ? eju.trouverCorrespondance(candidat.ceciIntituleV1, TypeSujet.SujetEstIntitule, true, true) : null;
      // 2e argument
      candidat.isCelaV1 = candidat.els.sujetComplement1 ? true : false;
      candidat.celaIntituleV1 = candidat.els.sujetComplement1;
      candidat.celaQuantiteV1 = candidat.isCelaV1 ? (MotUtils.getQuantite(candidat.els.sujetComplement1.determinant, (MotUtils.estFormePlurielle(candidat.els.sujetComplement1.nom) ? -1 : 1))) : 0;
      candidat.correspondCela = candidat.isCelaV1 ? eju.trouverCorrespondance(candidat.celaIntituleV1, TypeSujet.SujetEstIntitule, true, true) : null;

      // 4. ÉTABLISSEMENT DU SCORE DU CANDIDAT
      // 4.1 - SCORE CORRESPONDANCE DES ARGUMENTS
      // a) 2 arguments
      if (candidat.isCeciV1 && candidat.isCelaV1) {
        if (candidat.correspondCeci.nbCor > 0) {
          if (candidat.correspondCela.nbCor > 0) {
            // les 2 arguments ont une correspondance (100% correspondance)
            candidat.score += 100;
          } else {
            // 1 des 2 arguments a une correspondance (50% correspondance)
            candidat.score += 30;
          }
        } else if (candidat.correspondCela.nbCor > 0) {
          // 1 des 2 arguments a une correspondance (50% correspondance)
          candidat.score += 30;
        }
        // b) 1 argument
      } else if (candidat.isCeciV1) {
        if (candidat.correspondCeci.nbCor > 0) {
          // l’argument a une correspondance (100% correspondance)
          candidat.score += 100;
        }
      } else if (candidat.isCelaV1) {
        if (candidat.correspondCela.nbCor > 0) {
          // l’argument a une correspondance (100% correspondance)
          candidat.score += 100;
        }
        // c) aucun argument (100% correspondance)
      } else {
        candidat.score += 100;
      }

      // 4.2 - SCORE NOMBRE D’ARGUMENTS
      // vérifier si le nombre d’arguments trouvés correspond à une action existante
      candidat.score += act.scoreInfinitifExisteAvecCeciCela(
        candidat.els.infinitif,
        candidat.isCeciV1, candidat.isCelaV1,
        candidat.els.preposition0 ?? undefined, candidat.els.preposition1 ?? undefined
      );


    });

    // 5. TRIER LES RÉSULTATS (par score décroissant)
    ctx.candidats.sort((a, b) => (
      a.score > b.score ? -1 : 1
    ));

    return ctx;
  }

  /**
 * Toujours fournir les arguments de la commande parler/interroger/demander/discuter/montrer/… 
 * dans le même order.
 */
  private static manipulationVerbesParlerDemanderDonnerMontrer(candidat: CandidatCommande) {

    switch (candidat.els.infinitif) {
      // 1) PARLER/DISCUTER => PARLER AVEC INTERLOCUTEUR (CONCERNANT SUJET) => 
      case 'parler':
      case 'discuter':

        // A. PARLER *DE* SUJET *AVEC* INTERLOCUTEUR
        // préposition après parler
        if (candidat.els.preposition0) {
          // du/de/des/à propos/concernant
          if (candidat.els.preposition0.match(/(du|de(?: la| l(?:’|'))?|des|d(?:’|')(?:un|une)?|à propos|concernant)/)) {
            // préposition 1
            if (candidat.els.preposition1) {
              // avec/à/au/aux
              if (candidat.els.preposition1.match(/(avec|à|au(?:x)?)/)) {

                // on inverse l’ordre de la formulation (sujet/interrlocuteur)
                const sujet = candidat.els.sujet;
                const interlocuteur = candidat.els.sujetComplement1;
                candidat.els.preposition0 = 'avec';
                candidat.els.preposition1 = 'concernant';
                candidat.els.sujet = interlocuteur;
                candidat.els.sujetComplement1 = sujet;

                if (candidat.els.preposition1 == 'avec') {
                  // formulation priviliégiée car évite les ambiguïtés avec les noms composés
                  candidat.score += 200;
                } else {
                  // peut être ambigu donc peu de points en plus
                  candidat.score += 25;
                }
              } else {
                // formulation étrange => probablement une mauvaise interprétation
              }

              // pas de seconde préposition
            } else {
              candidat.els.preposition0 = 'concernant'; // on uniformise

            }
            // B. PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
            // avec/à/au
          } else if (candidat.els.preposition0.match(/(avec|à|au(?:x)?)/)) {
            candidat.els.preposition0 = 'avec'; // on uniformise
            if (candidat.els.preposition1) {
              // B.a parler avec interlocuteur concernant/à propos de sujet
              if (candidat.els.preposition1.match(/(à propos(?:| d’| d')?|concernant)/)) {
                // l’ordre est déjà bon, formulation priviliégiée car évite les ambiguïtés avec les noms composés
                candidat.score += 200;
                candidat.els.preposition1 = 'concernant'; // on uniformise
                // B.a parler avec interlocuteur de sujet
              } else {
                candidat.els.preposition1 = 'concernant'; // on uniformise
                // (l’ordre est déjà bon, peut être ambigu donc pas de points en plus )
              }
            } else {
              // (parler avec interloculteur)
            }
            // deuxième préposition par reconnue
          } else {

          }
          // pas de préposition après parler
        } else {
          // la 2e préposition est sans ambiguïté
          if (candidat.els.preposition1?.match(/(à propos|concernant)/)) {
            // l’ordre est déjà bon, formulation priviliégiée car évite les ambiguités avec les noms composés
            candidat.score += 200;
            candidat.els.preposition0 = 'avec'; // on uniformise
            candidat.els.preposition1 = 'concernant'; // on uniformise

            // il n’y a pas de 2e préposition claire pour nous éclairer…
          } else {

          }
        }
        break;

      // 2) INTERROGER/QUESTIONNER => INTERROGER INTERLOCUTEUR *CONCERNANT* SUJET
      case 'interroger':
      case 'questionner':
        // aucune préposition après l’infinitif mais prépostion entre les 2 compléments
        if (!candidat.els.preposition0 && candidat.els.preposition1) {
          if (candidat.els.preposition1.match(/(à propos|concernant)/)) {
            // l’ordre est déjà bon, formulation priviliégiée car évite les ambiguïtés avec les noms composés
            candidat.score += 200;
            candidat.els.preposition1 = 'concernant'; // on uniformise
          } else if (candidat.els.preposition1.match('sur')) {
            // l’ordre est déjà bon, peut être ambigu donc peu de points en plus
            candidat.score += 25;
            candidat.els.preposition1 = 'concernant'; // on uniformise
          }
          // préposition après infinitif
        } else {
          // formulation pas prévue
        }
        break;

      // 3) DEMANDER/COMMANDER/DONNER/OFFRIR/MONTRER => DEMANDER SUJET À INTERLOCUTEUR
      case 'demander':
      case 'commander':
      case 'donner':
      case 'offrir':
      case 'montrer':
        // A. DEMANDER SUJET *À* INTERLOCUTEUR
        if (!candidat.els.preposition0 || candidat.els.preposition0.match(/de|d'|d’|du|des/)) {
          // préposition
          if (candidat.els.preposition1) {
            // prépositon (à/au/aux)
            if (candidat.els.preposition1.match('à|au|aux')) {
              // l’ordre est déjà bon, peut être ambigu donc peu de points en plus
              candidat.score += 25;
            }
            // pas de préposition
          } else {
            // probablement une mauvaise interprétation ou un complément manquant
          }

          // à infinitif (sujet) à interlocuteur / à interlocuteur sujet
        } else if (candidat.els.preposition0.match(/à/)) {
          // B. DEMANDER *À* INFINITIF (SUJET) *À* INTERLOCUTEUR
          // suivi d’un infinitif: c’est le sujet => ex: à manger
          if (candidat.els.sujet.nom.match(/^\S+(?:ir|er|re)\b/)) {
            // préposition (à/au/aux)
            if (candidat.els.preposition1) {
              if (candidat.els.preposition1.match('à|au|aux')) {
                // l’ordre est déjà bon, peut être ambigu donc peu de points en plus
                candidat.score += 25;
                // on va rassembler le premier « à » avec l’infinitif => ex: à manger
                candidat.els.preposition0 = undefined;
                candidat.els.sujet.nom = 'à ' + candidat.els.sujet.nom;
              }
              // pas de préposition
            } else {
              // => probablement une mauvaise découpe ou bien il manque un complément
            }
            // C. *À* INTERLOCUTEUR SUJET
            // sinon c’est l’interlocuteur => ex: à Louis de l'argent
          } else {
            // il y a une 2e préposition (ça va être le sujet)
            if (candidat.els.preposition1) {
              // demander à sujet à infinitif (ex: demander à Louis à boire)
              if (candidat.els.preposition1.match(/à/) && candidat.els.sujetComplement1.nom.match(/^\S+(?:ir|er|re)\b/)) {
                candidat.els.preposition1 = undefined;
                candidat.els.sujetComplement1.nom = 'à ' + candidat.els.sujetComplement1.nom
                // changer l'ordre, peut être ambigu donc peu de points en plus
                const interlocuteur = candidat.els.sujet;
                const sujet = candidat.els.sujetComplement1;
                candidat.els.preposition0 = undefined;
                candidat.els.preposition1 = 'à';
                candidat.els.sujet = sujet;
                candidat.els.sujetComplement1 = interlocuteur;
                candidat.score += 25;
              } else if (candidat.els.preposition1.match(/de|d'|d’|du|des/)) {
                // changer l'ordre, peut être ambigu donc peu de points en plus
                const interlocuteur = candidat.els.sujet;
                const sujet = candidat.els.sujetComplement1;
                candidat.els.preposition0 = undefined;
                candidat.els.preposition1 = 'à';
                candidat.els.sujet = sujet;
                candidat.els.sujetComplement1 = interlocuteur;
                candidat.score += 50;
              } else {
                // formulation pas pris en charge
              }
              // il n'y a pas de 2e préposition
              // ex: demander à Louis
            } else {

            }
          }
        }
        break;

      default:
        break;
    }


    // TODO: on pourrait ajouter des points pour les sujets de discutions prévus dans le jeu


  }

}