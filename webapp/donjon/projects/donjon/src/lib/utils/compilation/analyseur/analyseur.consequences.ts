import { AnalyseurCondition } from "./analyseur.condition";
import { AnalyseurUtils } from "./analyseur.utils";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ElementGenerique } from "../../../models/compilateur/element-generique";
import { ExprReg } from "../expr-reg";
import { Instruction } from "../../../models/compilateur/instruction";
import { PhraseUtils } from "../../commun/phrase-utils";
import { Reaction } from "../../../models/compilateur/reaction";
import { Regle } from "../../../models/compilateur/regle";

export class AnalyseurConsequences {

  /**
   * Séparer les conséquences d’une règle, d’une réaction ou d’une action.
   * @param consequencesBrutes 
   * @param erreurs 
   * @param ligne 
   * @param regle 
   * @param reaction 
   * @param el 
   * @returns 
   */
  public static separerConsequences(consequencesBrutes: string, ctxAnalyse: ContexteAnalyse, ligne: number, regle: Regle = null, reaction: Reaction = null, el: ElementGenerique = null) {

    // on ajoute un «;» après les « fin si» si manquant (pour découper après cette instruction également.)
    consequencesBrutes = consequencesBrutes.replace(/fin si( )?(?!;|\]|\.)/g, "fin si;");
    consequencesBrutes = consequencesBrutes.replace(/finsi( )?(?!;|\]|\.)/g, "finsi;");
    // les conséquences sont séparées par des ";"
    const listeConsequences = consequencesBrutes.split(';');

    let instructionsPrincipales: Instruction[] = [];
    let indexBlocCondCommence = -1;
    let blocsSiEnCours: Instruction[][] = [];
    let blocsSinonEnCours: Instruction[][] = [];
    let dansBlocSinon: boolean[] = [];
    let prochaineInstructionAttendue: Instruction[] = null;
    let prochainSiEstSinonSi = false;

    // PARCOURIR LES CONSÉQUENCES
    for (let indexCurConsequence = 0; indexCurConsequence < listeConsequences.length; indexCurConsequence++) {
      const curConsequence = listeConsequences[indexCurConsequence];

      // console.log("curConsequence=", curConsequence);

      // NETTOYER CONSÉQUENCE
      let conBruNettoyee = curConsequence
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

        // DÉCOMPOSER CONSÉQUENCE
        const els = PhraseUtils.decomposerInstruction(conBruNettoyee);
        // CAS A > INSTRUCTION SIMPLE
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

          // si la prochaine instruction était attendue, l’ajouter
          if (prochaineInstructionAttendue) {
            prochaineInstructionAttendue.push(newInstruction);
            prochaineInstructionAttendue = null;
            // si un bloc si est commencé, ajouter l’instruction au bloc
          } else if (indexBlocCondCommence != -1) {
            if (dansBlocSinon[indexBlocCondCommence]) {
              blocsSinonEnCours[indexBlocCondCommence].push(newInstruction);
            } else {
              blocsSiEnCours[indexBlocCondCommence].push(newInstruction);
            }
            // sinon ajouter simplement l’instruction à la liste principale
          } else {
            instructionsPrincipales.push(newInstruction);
          }

          // CAS B > INSTRUCTION CONDITIONNELLE
        } else {

          let resultSiCondCons = ExprReg.xSeparerSiConditionConsequences.exec(conBruNettoyee);

          // CAS B.1 >> SI
          if (resultSiCondCons) {
            const conditionStr = resultSiCondCons[1];
            const condition = AnalyseurCondition.getConditionMulti(conditionStr);

            if (!condition) {
              AnalyseurUtils.ajouterErreur(ctxAnalyse, ligne, "condition : " + conditionStr);
            }

            const estBlocCondition = resultSiCondCons[2] == ':' || resultSiCondCons[2] == 'alors';
            // // const consequences = Analyseur.separerConsequences(resultSiCondCons[3], erreurs, ligne);
            // la conséquence directement liée au si doit être insérée dans le liste pour être interprétée à la prochaine itération
            const consequenceAInserer = resultSiCondCons[3];
            listeConsequences.splice(indexCurConsequence + 1, 0, consequenceAInserer);

            let nouvelleListeConsequencesSi = new Array<Instruction>();
            let nouvelleListeConsequencesSinon = new Array<Instruction>();
            let newInstruction = new Instruction(null, condition, nouvelleListeConsequencesSi, nouvelleListeConsequencesSinon);

            // UN SI RAPIDE EST EN COURS
            if (prochaineInstructionAttendue) {
              prochaineInstructionAttendue = null;
              AnalyseurConsequences.afficherErreurBloc("Un si rapide (,) ne peut pas avoir un autre si pour conséquence.", ctxAnalyse, regle, reaction, el, ligne);
              // UN BLOC EST COMMENCÉ
            } else if (indexBlocCondCommence != -1) {
              // console.log("prochainSiEstSinonSi=", prochainSiEstSinonSi);

              // >>> CAS SINONSI (sinon si)
              if (prochainSiEstSinonSi) {
                if (dansBlocSinon[indexBlocCondCommence]) {
                  AnalyseurConsequences.afficherErreurBloc("Un sinonsi peut suivre un si ou un autre sinonsi mais pas un sinon car le sinon doit être le dernier cas.", ctxAnalyse, regle, reaction, el, ligne);
                } else {
                  // on va ajouter l’instruction sinonsi dans le sinon de l’instruction conditionnelle ouverte
                  blocsSinonEnCours[indexBlocCondCommence].push(newInstruction);
                  // le sinonsi cloture l’instruction conditionnelle ouverte
                  indexBlocCondCommence -= 1;
                  blocsSiEnCours.pop();
                  blocsSinonEnCours.pop();
                  dansBlocSinon.pop();
                  prochainSiEstSinonSi = false;
                  // console.warn("sinon si géré.");
                }
                // >>> CAS NORMAL
              } else {
                if (dansBlocSinon[indexBlocCondCommence]) {
                  blocsSinonEnCours[indexBlocCondCommence].push(newInstruction);
                } else {
                  blocsSiEnCours[indexBlocCondCommence].push(newInstruction);
                }
              }
              // AUCUN BLOC COMMENCÉ
            } else {
              // >>> SINONSI ORPHELIN
              if (prochainSiEstSinonSi) {
                prochainSiEstSinonSi = false;
                AnalyseurConsequences.afficherErreurBloc("sinonsi orphelin.", ctxAnalyse, regle, reaction, el, ligne);

                // >>> CAS NORMAL
              } else {
                // ajouter à la liste principale
                instructionsPrincipales.push(newInstruction);
              }
            }

            // console.warn(">>> estBlocCondition=", estBlocCondition);


            // intruction conditionnelle avec un bloc de conséquences
            if (estBlocCondition) {
              indexBlocCondCommence += 1;
              // conséquences du si liées au si ouvert
              blocsSiEnCours.push(nouvelleListeConsequencesSi);
              blocsSinonEnCours.push(nouvelleListeConsequencesSinon);
              dansBlocSinon.push(false);
              // instruction conditionnelle courte
            } else {
              // l’instruction suivante est attendue pour la placer dans les conséquences de l’instruction conditionnelle
              prochaineInstructionAttendue = nouvelleListeConsequencesSi;
            }

          } else {
            // CAS B.2 >> SINON / SINONSI (sinon si)
            let resultSinonCondCons = ExprReg.xSeparerSinonConsequences.exec(conBruNettoyee);
            if (resultSinonCondCons) {

              // console.warn("indexBlocCondCommence=", indexBlocCondCommence, "dansBlocSinon[indexBlocCondCommence]=", dansBlocSinon[indexBlocCondCommence], "prochaineInstructionAttendue=", prochaineInstructionAttendue);

              // si un sinon est attendu
              if (indexBlocCondCommence != -1 && !dansBlocSinon[indexBlocCondCommence] && !prochaineInstructionAttendue) {

                let typeDeSinon = resultSinonCondCons[1];

                // console.log(">>typeDeSinon=", typeDeSinon);

                // sinon classique
                if (typeDeSinon == 'sinon') {
                  // on entre dans le bloc sinon
                  dansBlocSinon[indexBlocCondCommence] = true;
                  // la conséquence directement liée au sinon doit être insérée dans le liste pour être interprétée à la prochaine itération
                  const consequenceAInserer = resultSinonCondCons[2];
                  listeConsequences.splice(indexCurConsequence + 1, 0, consequenceAInserer);

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
                  listeConsequences.splice(indexCurConsequence + 1, 0, conditionAInserer);
                  prochainSiEstSinonSi = true;

                } else {
                  console.error("type de sinon pas pris en charge:", typeDeSinon);
                }

                // sinon il est orphelin
              } else {
                AnalyseurConsequences.afficherErreurBloc("sinon orphelin.", ctxAnalyse, regle, reaction, el, ligne);
              }

              // CAS C > FIN SI
            } else if (conBruNettoyee.trim().toLowerCase() == 'fin si' || conBruNettoyee.trim().toLowerCase() == 'finsi') {

              // si pas de si ouvert, erreur
              if (indexBlocCondCommence < 0) {
                AnalyseurConsequences.afficherErreurBloc("fin si orphelin.", ctxAnalyse, regle, reaction, el, ligne);
                // si bloc conditionnel ouvert => le fermer
              } else {
                indexBlocCondCommence -= 1;
                blocsSiEnCours.pop();
                blocsSinonEnCours.pop();
                dansBlocSinon.pop();
              }

              // CAS D > RIEN TROUVÉ
            } else {
              AnalyseurConsequences.afficherErreurBloc(("pas compris: « " + conBruNettoyee + " »"), ctxAnalyse, regle, reaction, el, ligne);
            }
          }
        } // fin analyse de l’instruction
      } // fin test instruction vide
    } // fin parcours des instructions

    if (indexBlocCondCommence != -1) {
      AnalyseurConsequences.afficherErreurBloc("fin si manquant (" + (indexBlocCondCommence + 1) + ").", ctxAnalyse, regle, reaction, el, ligne);
    }

    // console.warn("@@@@ separerConsequences:\nconsequencesBrutes=", consequencesBrutes, "\ninstructions=", instructionsPrincipales);

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
    console.error("separerConsequences > " + message);
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