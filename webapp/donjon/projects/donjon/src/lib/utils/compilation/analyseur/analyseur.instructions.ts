import { BlocOuvert, ETypeBloc } from "../../../models/compilateur/bloc-ouvert";

import { AnalyseurCondition } from "./analyseur.condition";
import { AnalyseurUtils } from "./analyseur.utils";
import { Choix } from "../../../models/compilateur/choix";
import { ClassesRacines } from "../../../models/commun/classes-racines";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ElementGenerique } from "../../../models/compilateur/element-generique";
import { ExprReg } from "../expr-reg";
import { Instruction } from "../../../models/compilateur/instruction";
import { Intitule } from "../../../models/jeu/intitule";
import { PhraseUtils } from "../../commun/phrase-utils";
import { Reaction } from "../../../models/compilateur/reaction";
import { Regle } from "../../../models/compilateur/regle";
import { Valeur } from "../../../models/jeu/valeur";

export class AnalyseurInstructions {

  /**
   * Séparer les instructions d’une règle, d’une réaction, d’une action, d’une condition ou d’un choix.
   * @param instructionsBrutes 
   * @param erreurs 
   * @param ligne 
   * @param regle 
   * @param reaction 
   * @param el 
   * @returns 
   */
  public static separerInstructions(instructionsBrutes: string, ctxAnalyse: ContexteAnalyse, ligne: number, regle: Regle = null, reaction: Reaction = null, el: ElementGenerique = null) {
    if (!instructionsBrutes) {
      throw new Error("separerInstructions: instructionsBrutes doit être défini !");
    }
    // on ajoute un «;» après les « fin si» si manquant (pour découper après cette instruction également.)
    instructionsBrutes = instructionsBrutes.replace(/(fin si|finsi|fin choisir|finchoisir|fin choix|finchoix)( )?(?!;|\]|\.)/g, "$1;");
    // instructionsBrutes = instructionsBrutes.replace(/fin si( )?(?!;|\]|\.)/g, "fin si;");
    // instructionsBrutes = instructionsBrutes.replace(/finsi( )?(?!;|\]|\.)/g, "finsi;");
    // les instructions sont séparées par des ";"
    const listeInstructions = instructionsBrutes.split(';');

    let instructionsPrincipales: Instruction[] = [];
    // BLOCS
    let blocsOuverts: ETypeBloc[] = [];
    // BLOCS CONDITIONNELS
    /** index du bloc conditionnel  avec lequel on est actuellement occupé */
    let indexBlocCondCommence = -1;
    /** listes d’instructions liés aux blocs conditionnels ouverts (partie SI)  */
    let instructionsBlocsCondEnCoursSi: Instruction[][] = [];
    /** listes d’instructions liés aux blocs conditionnels ouverts (partie SINON)  */
    let instructionsBlocsCondEnCoursSinon: Instruction[][] = [];
    /** est ce qu’on se trouve actuellement dans la partie sinon du bloc conditionnel ouvert ? */
    let dansBlocSinon: boolean[] = [];
    /** est-ce que la prochaine instsructions est attendue (pour cloturer un si rapide) */
    let prochaineInstructionAttenduePourSiRapide: Instruction[] = null;
    /** est-ce que le prochain si est un « sinon si » ? */
    let prochainSiEstSinonSi = false;
    // BLOCS CHOIX
    /** index du bloc choisir avec lequel on est actuellement occupé */
    let indexBlocChoisirCommence = -1;
    /** listes de choix liés aux blocs choisir ouverts */
    let choixBlocsChoisirEnCours: Choix[][] = [];
    /** index du bloc choix avec lequel on est actuellement occupé */
    let indexBlocChoixCommence = -1;
    /** liste d’instructions liées aux blocs choix ouverts */
    let instructionsBlocsChoixEnCours: Instruction[][] = [];

    // PARCOURIR LES INSTRUCTIONS
    for (let indexCurInstruction = 0; indexCurInstruction < listeInstructions.length; indexCurInstruction++) {
      const curInstruction = listeInstructions[indexCurInstruction];

      //console.log("curInstruction=", curInstruction);

      // NETTOYER INSTRUCTION
      let conBruNettoyee = curInstruction
        .trim()
        // convertir marque commentaire
        .replace(ExprReg.xCaractereDebutCommentaire, ' "')
        .replace(ExprReg.xCaractereFinCommentaire, '" ')
        // enlever les espaces multiples
        .replace(/( +)/g, " ");
      // enlever le point final ou le point virgule final)
      if (conBruNettoyee.endsWith(';') || conBruNettoyee.endsWith('.')) {
        conBruNettoyee = conBruNettoyee.slice(0, conBruNettoyee.length - 1);
      }

      if (conBruNettoyee) {
        // console.log("conBruNettoyee=", conBruNettoyee);

        // DÉCOMPOSER INSTRUCTION
        const els = PhraseUtils.decomposerInstruction(conBruNettoyee);
        // *****************************************************************************
        //  CAS A > INSTRUCTION SIMPLE
        // *****************************************************************************
        if (els) {
          if (els.complement1) {
            // si le complément est un Texte (entre " "), garder les retours à la ligne
            if (els.complement1.startsWith('"') && els.complement1.endsWith('"')) {
              els.complement1 = els.complement1
                .replace(ExprReg.xCaractereRetourLigne, '\n')
                // remettre les , et les ; initiaux dans les commentaires
                .replace(ExprReg.xCaracterePointVirgule, ';')
                .replace(ExprReg.xCaractereVirgule, ',');
              // sinon remplacer les retours à la ligne par des espaces
            } else {
              els.complement1 = els.complement1.replace(ExprReg.xCaractereRetourLigne, ' ');
            }
          }
          let newInstruction = new Instruction(els);

          // si la prochaine instruction était attendue pour un si rapide, l’ajouter
          if (prochaineInstructionAttenduePourSiRapide) {
            prochaineInstructionAttenduePourSiRapide.push(newInstruction);
            prochaineInstructionAttenduePourSiRapide = null;
            // si un bloc d’instruction (si ou choix) est commencé
          } else if (blocsOuverts.length) {
            // ajouter l’instruction au bloc
            const typeDernierBlocOuvert = blocsOuverts[blocsOuverts.length - 1];
            switch (typeDernierBlocOuvert) {
              case ETypeBloc.si:
                if (dansBlocSinon[indexBlocCondCommence]) {
                  instructionsBlocsCondEnCoursSinon[indexBlocCondCommence].push(newInstruction);
                } else {
                  instructionsBlocsCondEnCoursSi[indexBlocCondCommence].push(newInstruction);
                }
                break;

              case ETypeBloc.choix:
                instructionsBlocsChoixEnCours[indexBlocChoixCommence].push(newInstruction);
                break;

              default:
                console.error("separerInstructions: type de bloc ouvert pas pris en charge pour y ajouter des instructions:", typeDernierBlocOuvert);
                break;
            }
            // si aucun bloc ouvert
          } else {
            // ajouter simplement l’instruction à la liste principale
            instructionsPrincipales.push(newInstruction);
          }


          //   // si un bloc si est commencé, ajouter l’instruction au bloc
          // } else if (indexBlocCondCommence != -1) {
          //   if (dansBlocSinon[indexBlocCondCommence]) {
          //     instructionsBlocsCondEnCoursSinon[indexBlocCondCommence].push(newInstruction);
          //   } else {
          //     instructionsBlocsCondEnCoursSi[indexBlocCondCommence].push(newInstruction);
          //   }
          //   // sinon ajouter simplement l’instruction à la liste principale
          // } else {
          //   instructionsPrincipales.push(newInstruction);
          // }

          // *****************************************************************************
          //  CAS B > INSTRUCTION SI
          // *****************************************************************************
        } else {

          let resultSiCondIns = ExprReg.xSeparerSiConditionInstructions.exec(conBruNettoyee);

          // CAS B.1 >> DÉBUT BLOC SI
          if (resultSiCondIns) {
            const conditionStr = resultSiCondIns[1];
            const condition = AnalyseurCondition.getConditionMulti(conditionStr);

            if (!condition || condition.nbErreurs) {
              AnalyseurUtils.ajouterErreur(ctxAnalyse, ligne, "condition : " + conditionStr);
            }

            const estBlocCondition = resultSiCondIns[2] == ':' || resultSiCondIns[2] == 'alors';
            // la instruction directement liée au si doit être insérée dans le liste pour être interprétée à la prochaine itération
            const instructionAInserer = resultSiCondIns[3];
            listeInstructions.splice(indexCurInstruction + 1, 0, instructionAInserer);

            let nouvelleListeInstructionsSi = new Array<Instruction>();
            let nouvelleListeInstructionsSinon = new Array<Instruction>();
            let newInstruction = new Instruction(undefined, undefined, condition, nouvelleListeInstructionsSi, nouvelleListeInstructionsSinon);

            // UN SI RAPIDE EST EN COURS
            if (prochaineInstructionAttenduePourSiRapide) {
              prochaineInstructionAttenduePourSiRapide = null;
              AnalyseurInstructions.afficherErreurBloc("Un si rapide (,) ne peut pas avoir un autre si pour conséquence.", ctxAnalyse, regle, reaction, el, ligne);
              // UN BLOC SI EST COMMENCÉ
            } else if (indexBlocCondCommence != -1) {
              // console.log("prochainSiEstSinonSi=", prochainSiEstSinonSi);

              // >>> CAS SINONSI (sinon si)
              if (prochainSiEstSinonSi) {
                if (dansBlocSinon[indexBlocCondCommence]) {
                  AnalyseurInstructions.afficherErreurBloc("Un sinonsi peut suivre un si ou un autre sinonsi mais pas un sinon car le sinon doit être le dernier cas.", ctxAnalyse, regle, reaction, el, ligne);
                } else {
                  // on va ajouter l’instruction sinonsi dans le sinon de l’instruction conditionnelle ouverte
                  instructionsBlocsCondEnCoursSinon[indexBlocCondCommence].push(newInstruction);
                  // le sinonsi cloture l’instruction conditionnelle ouverte
                  indexBlocCondCommence -= 1;
                  instructionsBlocsCondEnCoursSi.pop();
                  instructionsBlocsCondEnCoursSinon.pop();
                  dansBlocSinon.pop();
                  prochainSiEstSinonSi = false;
                  blocsOuverts.pop(); // bloc fermé
                  // console.warn("sinon si géré.");
                }
                // >>> CAS NORMAL
              } else {
                if (dansBlocSinon[indexBlocCondCommence]) {
                  instructionsBlocsCondEnCoursSinon[indexBlocCondCommence].push(newInstruction);
                } else {
                  instructionsBlocsCondEnCoursSi[indexBlocCondCommence].push(newInstruction);
                }
              }
              // AUCUN BLOC SI COMMENCÉ
            } else {
              // >>> SINONSI ORPHELIN
              if (prochainSiEstSinonSi) {
                prochainSiEstSinonSi = false;
                AnalyseurInstructions.afficherErreurBloc("sinonsi orphelin.", ctxAnalyse, regle, reaction, el, ligne);

                // >>> CAS NORMAL
              } else {
                // ajouter à la liste principale
                instructionsPrincipales.push(newInstruction);
              }
            }

            // intruction conditionnelle avec un bloc d’instructions
            if (estBlocCondition) {
              indexBlocCondCommence += 1;
              // instructions du si liées au si ouvert
              instructionsBlocsCondEnCoursSi.push(nouvelleListeInstructionsSi);
              instructionsBlocsCondEnCoursSinon.push(nouvelleListeInstructionsSinon);
              dansBlocSinon.push(false);
              blocsOuverts.push(ETypeBloc.si); // nouveau bloc ouvert
              // instruction conditionnelle courte
            } else {
              // l’instruction suivante est attendue pour la placer dans les conséquences de l’instruction conditionnelle
              prochaineInstructionAttenduePourSiRapide = nouvelleListeInstructionsSi;
            }

          } else {
            // CAS B.2 >> SINON / SINONSI (sinon si)
            let resultSinonCondCons = ExprReg.xSeparerSinonInstructions.exec(conBruNettoyee);
            if (resultSinonCondCons) {

              // console.warn("indexBlocCondCommence=", indexBlocCondCommence, "dansBlocSinon[indexBlocCondCommence]=", dansBlocSinon[indexBlocCondCommence], "prochaineInstructionAttendue=", prochaineInstructionAttendue);

              // si un sinon est attendu
              if (indexBlocCondCommence != -1 && !dansBlocSinon[indexBlocCondCommence] && !prochaineInstructionAttenduePourSiRapide) {

                let typeDeSinon = resultSinonCondCons[1];

                // console.log(">>typeDeSinon=", typeDeSinon);

                // sinon classique
                if (typeDeSinon == 'sinon') {
                  // on entre dans le bloc sinon
                  dansBlocSinon[indexBlocCondCommence] = true;
                  // la conséquence directement liée au sinon doit être insérée dans le liste pour être interprétée à la prochaine itération
                  const instructionAInserer = resultSinonCondCons[2];
                  listeInstructions.splice(indexCurInstruction + 1, 0, instructionAInserer);

                  // sinonsi (si sinon)
                } else if (typeDeSinon == 'sinonsi') {
                  // explication : 
                  // On sait que la prochaine instruction est un si on on voudrait qu’il soit placé
                  // dans le sinon de l’instruction en cours mais qu’il ne soit pas considéré comme 
                  // un sinon car il y a encore un sinon qui va suivre après le ssi…
                  // De plus il n’y aura pas de finsi supplémentaire car il est chainé au si
                  // déjà ouvert donc on ne veut pas descendre d’un niveau supplémentaire.

                  // la condition directement liée au ssi doit être insérée dans le liste pour être interprétée à la prochaine itération
                  const conditionAInserer = "si " + resultSinonCondCons[2];
                  listeInstructions.splice(indexCurInstruction + 1, 0, conditionAInserer);
                  prochainSiEstSinonSi = true;

                } else {
                  console.error("type de sinon pas pris en charge:", typeDeSinon);
                }

                // sinon il est orphelin
              } else {
                AnalyseurInstructions.afficherErreurBloc("sinon orphelin.", ctxAnalyse, regle, reaction, el, ligne);
              }

              // CAS B.3 >> FIN SI
            } else if (conBruNettoyee.trim().toLowerCase() == 'fin si' || conBruNettoyee.trim().toLowerCase() == 'finsi') {

              // si pas de si ouvert, erreur
              // if (indexBlocCondCommence < 0) {
              if (!blocsOuverts.length || blocsOuverts[blocsOuverts.length - 1] != ETypeBloc.si) {
                AnalyseurInstructions.afficherErreurBloc("fin si orphelin.", ctxAnalyse, regle, reaction, el, ligne);
                // si bloc conditionnel ouvert => le fermer
              } else {
                indexBlocCondCommence -= 1;
                instructionsBlocsCondEnCoursSi.pop();
                instructionsBlocsCondEnCoursSinon.pop();
                dansBlocSinon.pop();
                blocsOuverts.pop(); // bloc fermé
              }

              // *****************************************************************************
              // CAS C > INSTRUCTION CHOISIR
              // *****************************************************************************
            } else {
              // CAS C.1 >> DÉBUT BLOC CHOISIR
              let resultChoisirIns = ExprReg.xSeparerChoisirInstructions.exec(conBruNettoyee);
              if (resultChoisirIns) {
                console.error("D.1 BLOC CHOISIR", conBruNettoyee);

                // Début d’un nouveau bloc CHOISIR
                blocsOuverts.push(ETypeBloc.choisir); // nouveau bloc ouvert
                let nouvelleListeChoix = new Array<Choix>();
                choixBlocsChoisirEnCours.push(nouvelleListeChoix);
                indexBlocChoisirCommence += 1;

                const premierChoixOuParmis = resultChoisirIns[1];

                console.log("premierChoixOuParmis=", premierChoixOuParmis);


                // a. CHOISIR DIRECTEMENT PARMIS LES CHOIX
                //    ex: choisir
                //          choix "oui":
                //            .......
                //          choix "non":
                //            ....
                //        fin choix
                if (premierChoixOuParmis.match(ExprReg.xChoixTexteNombreOuIntitule)) {
                  console.warn("a. CHOISIR DIRECTEMENT PARMIS LES CHOIX");

                  // => on remet le reste de l’instruction dans la liste des instructions pour l’interpréter à la prochaine itération.
                  listeInstructions.splice(indexCurInstruction + 1, 0, premierChoixOuParmis);

                  // b. CHOISIR PARMIS UNE LISTE DYNAMIQUE
                  //    ex: choisir parmis les couleurs disponibles
                  //          choix rose:
                  //            .......
                  //          choix jaune:
                  //            ....
                  //        fin choix
                } else {
                  console.warn("b. CHOISIR PARMIS UNE LISTE DYNAMIQUE");

                  // => retrouver la liste dynamique (ex: les couleurs disponibles)
                  // TODO: gestion des listes de choix dynamiques
                }

                // TODO: ajouter l’instruction au bon endroit
                let newInstruction = new Instruction(undefined, nouvelleListeChoix);
                instructionsPrincipales.push(newInstruction);

              } else {
                // CAS C.2 >> BLOC CHOIX
                let resultChoixIns = ExprReg.xChoixTexteNombreOuIntitule.exec(conBruNettoyee);
                if (resultChoixIns) {
                  console.error("D.2 BLOC CHOIX:", conBruNettoyee);

                  // s’il ne s’agit PAS du premier choix du bloc choisir
                  if (choixBlocsChoisirEnCours[indexBlocChoisirCommence].length != 0) {
                    // fermer le choix précédent
                    const blocFerme = blocsOuverts.pop();
                    if (blocFerme != ETypeBloc.choix) {
                      console.error("SeparerInstructions: Fermeture choix précédent: le bloc ouvert n’est pas un choix.");
                    }
                    // retirer le choix précédent de la liste des choix ouverts
                    instructionsBlocsChoixEnCours.pop();
                    indexBlocChoixCommence -= 1;
                  }

                  let valeurChoix: Valeur;
                  // texte
                  if (resultChoixIns[1] !== undefined) {
                    valeurChoix = resultChoixIns[1];
                    // nombre
                  } else if (resultChoixIns[2] !== undefined) {
                    // TODO: parseFloat ?
                    valeurChoix = Number.parseInt(resultChoixIns[2]);
                    // intitulé (aucun choix, autre choix, élément précis, élémentA ou élémentB, …)
                    // TODO: à améliorer ?
                  } else {
                    valeurChoix = new Intitule(resultChoixIns[3], undefined, ClassesRacines.Intitule);
                  }

                  // première instruction pour ce choix
                  const premiereInstructionChoix = resultChoixIns[4];

                  console.log("premiereInstructionChoix:", premiereInstructionChoix);


                  // => on l’ajoute à la liste des instructions pour l’interpréter à la prochaine itération.
                  listeInstructions.splice(indexCurInstruction + 1, 0, premiereInstructionChoix);

                  // ajout du nouveau choix au bloc choisir le plus récent
                  let nouvelleListeInstructionsChoix = new Array<Instruction>();
                  choixBlocsChoisirEnCours[indexBlocChoisirCommence].push(new Choix(valeurChoix, nouvelleListeInstructionsChoix));

                  console.log("valeurChoix=", valeurChoix);


                  // ajout d’une liste d’instructions pour ce nouveau choix
                  instructionsBlocsChoixEnCours.push(nouvelleListeInstructionsChoix);
                  indexBlocChoixCommence += 1;

                  // on a ouvert un nouveau bloc choix
                  blocsOuverts.push(ETypeBloc.choix);


                  // CAS C.3 >> FIN BLOC CHOISIR
                } else if (conBruNettoyee.trim().toLowerCase().match(/^(fin choix|finchoix|fin choisir|finchoisir)$/i)) {

                  console.error("D.3 FIN CHOISIR", conBruNettoyee);

                  // si pas de choisir ouvert, erreur
                  // if (indexBlocChoisirCommence < 0) {
                  if (!blocsOuverts.length) {
                    AnalyseurInstructions.afficherErreurBloc("fin choisir orphelin.", ctxAnalyse, regle, reaction, el, ligne);
                    // si bloc choisir (et dernier choix) ouvert => le fermer
                  } else {
                    // 1. fermer le bloc choix le plus récent
                    // => il y a au moins 1 choix dans le bloc choisir
                    const premierBlocFerme = blocsOuverts.pop(); // bloc fermé
                    if (premierBlocFerme == ETypeBloc.choix) {
                      // enlever les instructions du choix fermé
                      instructionsBlocsChoixEnCours.pop();
                      indexBlocChoixCommence -= 1;
                      // 2a. fermer le bloc choisir le plus récent
                      const deuxiemeBlocFerme = blocsOuverts.pop(); // bloc fermé
                      if (deuxiemeBlocFerme == ETypeBloc.choisir) {
                        // enlever les choix du bloc choisir fermé
                        choixBlocsChoisirEnCours.pop();
                        indexBlocChoisirCommence -= 1;
                      } else {
                        AnalyseurInstructions.afficherErreurBloc("fin choisir: bloc précédent mal fini.", ctxAnalyse, regle, reaction, el, ligne);
                      }
                      //  2b. fermer le bloc choisir le plus récent
                      // => il n’y a aucun choix dans le bloc choisir
                    } else if (premierBlocFerme == ETypeBloc.choisir) {
                      AnalyseurInstructions.afficherErreurBloc("fin choisir: bloc choisir sans choix.", ctxAnalyse, regle, reaction, el, ligne);
                      // enlever les choix du bloc choisir fermé
                      choixBlocsChoisirEnCours.pop();
                      indexBlocChoisirCommence -= 1;
                    } else {
                      AnalyseurInstructions.afficherErreurBloc("fin choisir: bloc précédent mal fini.", ctxAnalyse, regle, reaction, el, ligne);
                    }
                  }

                  // *****************************************************************************
                  //  CAS D > RIEN TROUVÉ
                  // *****************************************************************************
                } else {
                  AnalyseurInstructions.afficherErreurBloc(("pas compris: « " + conBruNettoyee + " »"), ctxAnalyse, regle, reaction, el, ligne);
                }
              }
            }
          }
        } // fin analyse de l’instruction
      } // fin test instruction vide
    } // fin parcours des instructions

    // vérifier bloc conditionnel pas fermé
    if (indexBlocCondCommence != -1) {
      AnalyseurInstructions.afficherErreurBloc("fin si manquant (" + (indexBlocCondCommence + 1) + ").", ctxAnalyse, regle, reaction, el, ligne);
    }
    // vérifier si bloc choix pas fermé
    if (indexBlocChoixCommence != -1) {
      AnalyseurInstructions.afficherErreurBloc("fin choix manquant (" + (indexBlocChoixCommence + 1) + ").", ctxAnalyse, regle, reaction, el, ligne);
    }
    // vérifier si bloc choisir pas fermé
    if (indexBlocChoisirCommence != -1) {
      AnalyseurInstructions.afficherErreurBloc("fin choisir manquant (" + (indexBlocChoisirCommence + 1) + ").", ctxAnalyse, regle, reaction, el, ligne);
    }

    return instructionsPrincipales;
  }

  /**
   * Ajouter une erreur dans son contexte précis (règle, réaction)
   * @param message 
   * @param erreurs 
   * @param regle 
   * @param reaction 
   * @param el 
   * @param ligne 
   */
  private static afficherErreurBloc(message, ctxAnalyse: ContexteAnalyse, regle: Regle, reaction: Reaction, el: ElementGenerique, ligne: number) {
    console.error("separerInstructions > " + message);
    if (ligne > 0) {
      AnalyseurUtils.ajouterErreur(ctxAnalyse, ligne, "conséquence : " + message);
    } else if (regle) {
      AnalyseurUtils.ajouterErreur(ctxAnalyse, 0, "règle « " + Regle.regleIntitule(regle) + " » : " + message);
    } else if (reaction) {
      AnalyseurUtils.ajouterErreur(ctxAnalyse, 0, "élément « " + ElementGenerique.elIntitule(el) + " » : réaction « " + Reaction.reactionIntitule(reaction) + " » : " + message);
    } else {
      AnalyseurUtils.ajouterErreur(ctxAnalyse, 0, "----- : conséquence : " + message);
    }
  }
}