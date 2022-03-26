import { AnalyseurCondition } from "./analyseur.condition";
import { Choix } from "../../../models/compilateur/choix";
import { ClassesRacines } from "../../../models/commun/classes-racines";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ContexteSeparerInstructions } from "../../../models/compilateur/contexte-separer-instructions";
import { ETypeBloc } from "../../../models/compilateur/bloc-ouvert";
import { ElementGenerique } from "../../../models/compilateur/element-generique";
import { ElementsPhrase } from "../../../models/commun/elements-phrase";
import { ExprReg } from "../expr-reg";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
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

    // les instructions sont séparées par des ";"

    let ctx = new ContexteSeparerInstructions(instructionsBrutes, ctxAnalyse, ligne, regle, reaction, el);

    // PARCOURIR LES INSTRUCTIONS
    for (ctx.indexCurInstruction = 0; ctx.indexCurInstruction < ctx.listeInstructions.length; ctx.indexCurInstruction++) {
      const curInstruction = ctx.listeInstructions[ctx.indexCurInstruction];

      // nettoyer l’instruction
      const conBruNettoyee = AnalyseurInstructions.nettoyerInstruction(curInstruction)
      if (conBruNettoyee) {
        // DÉCOMPOSER INSTRUCTION
        const els = PhraseUtils.decomposerInstruction(conBruNettoyee);
        // *****************************************************************************
        //  CAS A > INSTRUCTION SIMPLE
        // *****************************************************************************
        if (els) {
          this.traiterInstructionSimple(els, ctx);

          // *****************************************************************************
          //  CAS B > INSTRUCTION SI
          // *****************************************************************************
        } else {

          let resultSiCondIns = ExprReg.xSeparerSiConditionInstructions.exec(conBruNettoyee);

          // CAS B.1 >> DÉBUT BLOC SI
          if (resultSiCondIns) {
            AnalyseurInstructions.traiterInstructionSi(resultSiCondIns, ctx);

          } else {
            // CAS B.2 >> SINON / SINONSI (sinon si)
            let resultSinonCondCons = ExprReg.xSeparerSinonInstructions.exec(conBruNettoyee);
            if (resultSinonCondCons) {

              this.traiterInstructionSinon(resultSinonCondCons, ctx);

              // CAS B.3 >> FIN SI
            } else if (conBruNettoyee.trim().toLowerCase() == 'fin si' || conBruNettoyee.trim().toLowerCase() == 'finsi') {

              this.traiterInstructionFinSi(ctx);

              // *****************************************************************************
              // CAS C > INSTRUCTION CHOISIR
              // *****************************************************************************
            } else {
              // CAS C.1 >> DÉBUT BLOC CHOISIR
              const resultChoisirIns = ExprReg.xSeparerChoisirInstructions.exec(conBruNettoyee);
              if (resultChoisirIns) {
                this.traiterInstructionChoisir(resultChoisirIns, ctx);
              } else {
                // CAS C.2 >> BLOC CHOIX
                const resultChoixIns = ExprReg.xChoixTexteNombreOuIntitule.exec(conBruNettoyee);
                if (resultChoixIns) {
                  this.traiterInstructionChoix(resultChoixIns, ctx);
                  // CAS C.3 >> BLOC AUTRE CHOIX
                } else {
                  const resultAutreChoixIns = ExprReg.xAutreChoix.exec(conBruNettoyee);
                  if (resultAutreChoixIns) {
                    this.traiterInstructionAutreChoix(resultAutreChoixIns, ctx);
                    // CAS C.4 >> FIN BLOC CHOISIR
                  } else if (conBruNettoyee.trim().toLowerCase().match(/^(fin choix|finchoix|fin choisir|finchoisir)$/i)) {
                    this.traiterInstructionFinChoisir(ctx);

                    // *****************************************************************************
                    //  CAS D > RIEN TROUVÉ
                    // *****************************************************************************
                  } else {
                    AnalyseurInstructions.afficherErreurBloc(("pas compris: « " + conBruNettoyee + " »"), ctx);
                  }
                }
              }
            }
          }
        } // fin analyse de l’instruction
      } // fin test instruction vide
    } // fin parcours des instructions

    // vérifier bloc conditionnel pas fermé
    if (ctx.indexBlocCondCommence != -1) {
      AnalyseurInstructions.afficherErreurBloc("fin si manquant (" + (ctx.indexBlocCondCommence + 1) + ").", ctx);
    }
    // vérifier si bloc choix pas fermé
    if (ctx.indexBlocChoixCommence != -1) {
      AnalyseurInstructions.afficherErreurBloc("fin choix manquant (" + (ctx.indexBlocChoixCommence + 1) + ").", ctx);
    }
    // vérifier si bloc choisir pas fermé
    if (ctx.indexBlocChoisirCommence != -1) {
      AnalyseurInstructions.afficherErreurBloc("fin choisir manquant (" + (ctx.indexBlocChoisirCommence + 1) + ").", ctx);
    }

    return ctx.instructionsPrincipales;
  }

  /** Nettoyer l’instruction (guillemets, espaces multiples, point, …) */
  private static nettoyerInstruction(instruction: string): string {
    // NETTOYER INSTRUCTION
    let insBruNettoyee = instruction
      .trim()
      // convertir marque commentaire
      .replace(ExprReg.xCaractereDebutCommentaire, ' "')
      .replace(ExprReg.xCaractereFinCommentaire, '" ')
      // enlever les espaces multiples
      .replace(/( +)/g, " ");
    // enlever le point final ou le point virgule final)
    if (insBruNettoyee.endsWith(';') || insBruNettoyee.endsWith('.')) {
      insBruNettoyee = insBruNettoyee.slice(0, insBruNettoyee.length - 1);
    }

    return insBruNettoyee;
  }

  private static placerInstructionTraiteeAuBonEndroit(instructionTraitee: Instruction, ctx: ContexteSeparerInstructions) {
    // si la prochaine instruction était attendue pour un si rapide, l’ajouter
    if (ctx.prochaineInstructionAttenduePourSiRapide) {
      ctx.prochaineInstructionAttenduePourSiRapide.push(instructionTraitee);
      ctx.prochaineInstructionAttenduePourSiRapide = null;
      // si un bloc d’instruction (si ou choix) est commencé
    } else if (ctx.blocsOuverts.length) {
      // ajouter l’instruction au bloc
      const typeDernierBlocOuvert = ctx.blocsOuverts[ctx.blocsOuverts.length - 1];
      switch (typeDernierBlocOuvert) {
        case ETypeBloc.si:
          if (ctx.dansBlocSinon[ctx.indexBlocCondCommence]) {
            ctx.instructionsBlocsCondEnCoursSinon[ctx.indexBlocCondCommence].push(instructionTraitee);
          } else {
            ctx.instructionsBlocsCondEnCoursSi[ctx.indexBlocCondCommence].push(instructionTraitee);
          }
          break;

        case ETypeBloc.choix:
          ctx.instructionsBlocsChoixEnCours[ctx.indexBlocChoixCommence].push(instructionTraitee);
          break;

        default:
          console.error("separerInstructions: type de bloc ouvert pas pris en charge pour y ajouter des instructions:", typeDernierBlocOuvert);
          break;
      }
      // si aucun bloc ouvert
    } else {
      // ajouter simplement l’instruction à la liste principale
      ctx.instructionsPrincipales.push(instructionTraitee);
    }
  }

  /** Traiter une instruction simple */
  private static traiterInstructionSimple(instruction: ElementsPhrase, ctx: ContexteSeparerInstructions) {
    if (instruction.complement1) {
      // si le complément est un Texte (entre " "), garder les retours à la ligne
      if (instruction.complement1.startsWith('"') && instruction.complement1.endsWith('"')) {
        instruction.complement1 = instruction.complement1
          .replace(ExprReg.xCaractereRetourLigne, '\n')
          // remettre les , et les ; initiaux dans les commentaires
          .replace(ExprReg.xCaracterePointVirgule, ';')
          .replace(ExprReg.xCaractereVirgule, ',');
        // sinon remplacer les retours à la ligne par des espaces
      } else {
        instruction.complement1 = instruction.complement1.replace(ExprReg.xCaractereRetourLigne, ' ');
      }
    }
    let newInstruction = new Instruction(instruction);

    AnalyseurInstructions.placerInstructionTraiteeAuBonEndroit(newInstruction, ctx);

  }

  /** Traiter le début d’un bloc si */
  private static traiterInstructionSi(resultSiCondIns: RegExpExecArray, ctx: ContexteSeparerInstructions) {

    const conditionStr = resultSiCondIns[1];
    const condition = AnalyseurCondition.getConditionMulti(conditionStr);

    if (!condition || condition.nbErreurs) {
      ctx.ctxAnalyse.ajouterErreur(ctx.ligne, "condition : " + conditionStr);
    }

    const estBlocCondition = resultSiCondIns[2] == ':' || resultSiCondIns[2] == 'alors';
    // la instruction directement liée au si doit être insérée dans le liste pour être interprétée à la prochaine itération
    const instructionAInserer = resultSiCondIns[3];
    ctx.listeInstructions.splice(ctx.indexCurInstruction + 1, 0, instructionAInserer);

    let nouvelleListeInstructionsSi = new Array<Instruction>();
    let nouvelleListeInstructionsSinon = new Array<Instruction>();
    let newInstruction = new Instruction(undefined, undefined, condition, nouvelleListeInstructionsSi, nouvelleListeInstructionsSinon);

    // UN SI RAPIDE EST EN COURS
    if (ctx.prochaineInstructionAttenduePourSiRapide) {
      ctx.prochaineInstructionAttenduePourSiRapide = null;
      AnalyseurInstructions.afficherErreurBloc("Un si rapide (,) ne peut pas avoir un autre si pour conséquence.", ctx);
      // UN BLOC SI EST COMMENCÉ
    } else if (ctx.indexBlocCondCommence != -1) {
      // console.log("ctx.prochainSiEstSinonSi=", ctx.prochainSiEstSinonSi);

      // >>> CAS SINONSI (sinon si)
      if (ctx.prochainSiEstSinonSi) {
        if (ctx.dansBlocSinon[ctx.indexBlocCondCommence]) {
          AnalyseurInstructions.afficherErreurBloc("Un sinonsi peut suivre un si ou un autre sinonsi mais pas un sinon car le sinon doit être le dernier cas.", ctx);
        } else {
          // on va ajouter l’instruction sinonsi dans le sinon de l’instruction conditionnelle ouverte
          ctx.instructionsBlocsCondEnCoursSinon[ctx.indexBlocCondCommence].push(newInstruction);
          // le sinonsi cloture l’instruction conditionnelle ouverte
          ctx.indexBlocCondCommence -= 1;
          ctx.instructionsBlocsCondEnCoursSi.pop();
          ctx.instructionsBlocsCondEnCoursSinon.pop();
          ctx.dansBlocSinon.pop();
          ctx.prochainSiEstSinonSi = false;
          ctx.blocsOuverts.pop(); // bloc fermé
          // console.warn("sinon si géré.");
        }
        // >>> CAS NORMAL
      } else {
        if (ctx.dansBlocSinon[ctx.indexBlocCondCommence]) {
          ctx.instructionsBlocsCondEnCoursSinon[ctx.indexBlocCondCommence].push(newInstruction);
        } else {
          ctx.instructionsBlocsCondEnCoursSi[ctx.indexBlocCondCommence].push(newInstruction);
        }
      }
      // AUCUN BLOC SI COMMENCÉ
    } else {
      // >>> SINONSI ORPHELIN
      if (ctx.prochainSiEstSinonSi) {
        ctx.prochainSiEstSinonSi = false;
        AnalyseurInstructions.afficherErreurBloc("sinonsi orphelin.", ctx);

        // >>> CAS NORMAL
      } else {
        // ajouter l’instruction au bon endroit
        this.placerInstructionTraiteeAuBonEndroit(newInstruction, ctx);
      }
    }

    // intruction conditionnelle avec un bloc d’instructions
    if (estBlocCondition) {
      ctx.indexBlocCondCommence += 1;
      // instructions du si liées au si ouvert
      ctx.instructionsBlocsCondEnCoursSi.push(nouvelleListeInstructionsSi);
      ctx.instructionsBlocsCondEnCoursSinon.push(nouvelleListeInstructionsSinon);
      ctx.dansBlocSinon.push(false);
      ctx.blocsOuverts.push(ETypeBloc.si); // nouveau bloc ouvert
      // instruction conditionnelle courte
    } else {
      // l’instruction suivante est attendue pour la placer dans les conséquences de l’instruction conditionnelle
      ctx.prochaineInstructionAttenduePourSiRapide = nouvelleListeInstructionsSi;
    }

  }

  /**
   * Traiter un bloc « sinon » ou « sinonsi ».
   */
  private static traiterInstructionSinon(resultSinonCondCons: RegExpExecArray, ctx: ContexteSeparerInstructions) {
    // console.warn("ctx.indexBlocCondCommence=", ctx.indexBlocCondCommence, "ctx.dansBlocSinon[ctx.indexBlocCondCommence]=", ctx.dansBlocSinon[ctx.indexBlocCondCommence], "prochaineInstructionAttendue=", prochaineInstructionAttendue);

    // si un sinon est attendu
    if (ctx.indexBlocCondCommence != -1 && !ctx.dansBlocSinon[ctx.indexBlocCondCommence] && !ctx.prochaineInstructionAttenduePourSiRapide) {

      let typeDeSinon = resultSinonCondCons[1].toLocaleLowerCase();

      // console.log(">>typeDeSinon=", typeDeSinon);

      // sinon classique
      if (typeDeSinon == 'sinon') {
        // on entre dans le bloc sinon
        ctx.dansBlocSinon[ctx.indexBlocCondCommence] = true;
        // la conséquence directement liée au sinon doit être insérée dans le liste pour être interprétée à la prochaine itération
        const instructionAInserer = resultSinonCondCons[2];
        ctx.listeInstructions.splice(ctx.indexCurInstruction + 1, 0, instructionAInserer);

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
        ctx.listeInstructions.splice(ctx.indexCurInstruction + 1, 0, conditionAInserer);
        ctx.prochainSiEstSinonSi = true;

      } else {
        console.error("type de sinon pas pris en charge:", typeDeSinon);
      }

      // sinon il est orphelin
    } else {
      AnalyseurInstructions.afficherErreurBloc("sinon orphelin.", ctx);
    }

  }

  /** Traiter une instruction « fin si » */
  private static traiterInstructionFinSi(ctx: ContexteSeparerInstructions) {
    // si pas de si ouvert, erreur
    // if (ctx.indexBlocCondCommence < 0) {
    if (!ctx.blocsOuverts.length || ctx.blocsOuverts[ctx.blocsOuverts.length - 1] != ETypeBloc.si) {
      AnalyseurInstructions.afficherErreurBloc("fin si orphelin.", ctx);
      // si bloc conditionnel ouvert => le fermer
    } else {
      ctx.indexBlocCondCommence -= 1;
      ctx.instructionsBlocsCondEnCoursSi.pop();
      ctx.instructionsBlocsCondEnCoursSinon.pop();
      ctx.dansBlocSinon.pop();
      ctx.blocsOuverts.pop(); // bloc fermé
    }/*  */
  }

  /** Traiter le début d’un bloc choisir  */
  private static traiterInstructionChoisir(resultChoisirIns: RegExpExecArray, ctx: ContexteSeparerInstructions) {

    // créer l’instruction choisir avec une liste de choix vide
    let nouvelleListeChoix = new Array<Choix>();
    let instructionChoisir = new Instruction(undefined, nouvelleListeChoix);
    // palcer l’instruction au bon endroit
    this.placerInstructionTraiteeAuBonEndroit(instructionChoisir, ctx);

    // Ajout d’un nouveau bloc CHOISIR (qui va contenir des choix)
    ctx.blocsOuverts.push(ETypeBloc.choisir); // nouveau bloc ouvert
    ctx.choixBlocsChoisirEnCours.push(nouvelleListeChoix);
    ctx.indexBlocChoisirCommence += 1;

    const premierChoixOuParmis = resultChoisirIns[1];

    // a. CHOISIR DIRECTEMENT PARMIS LES CHOIX
    //    ex: choisir
    //          choix "oui":
    //            .......
    //          choix "non":
    //            ....
    //        fin choisir
    if (premierChoixOuParmis.match(ExprReg.xChoixTexteNombreOuIntitule)) {
      // console.warn("a. CHOISIR DIRECTEMENT PARMIS LES CHOIX");

      // => on remet le reste de l’instruction dans la liste des instructions pour l’interpréter à la prochaine itération.
      ctx.listeInstructions.splice(ctx.indexCurInstruction + 1, 0, premierChoixOuParmis);

    } else {
      // b. CHOISIR LIBREMENT
      //    ex: choisir librement[:]
      //          choix "mlkjmlkj":
      //            ....
      //          autre choix:
      //            ...
      //         fin choisir
      const resLibrement = /^(librement(?:\s*:)?(?:\s+))(?:autre )?choix/i.exec(premierChoixOuParmis);
      if (resLibrement) {
        instructionChoisir.choixLibre = true;
        // => on remet le reste de l’instruction dans la liste des instructions pour l’interpréter à la prochaine itération.
        ctx.listeInstructions.splice(ctx.indexCurInstruction + 1, 0, premierChoixOuParmis.slice(resLibrement[1].length).trim());

        // c. CHOISIR PARMIS UNE LISTE DYNAMIQUE
        //    ex: choisir parmis les couleurs disponibles
        //          choix rose:
        //            .......
        //          choix jaune:
        //            ....
        //        fin choisir
      } else {
        console.warn("c. CHOISIR PARMIS UNE LISTE DYNAMIQUE");

        // => retrouver la liste dynamique (ex: les couleurs disponibles)
        // TODO: gestion des listes de choix dynamiques
      }
    }
  }

  /** Traiter un choix spécial (d’une instruction choisir) */
  private static traiterInstructionAutreChoix(resultChoixIns: RegExpExecArray, ctx: ContexteSeparerInstructions) {
    // valeur du choix: autre choix
    let valeurChoix: Valeur = new Intitule("autre choix", new GroupeNominal(null, "autre choix", null), ClassesRacines.Intitule);
    // première instruction pour ce choix
    const premiereInstructionChoix = resultChoixIns[2];
    // console.log("premiereInstructionChoix:", premiereInstructionChoix);
    this.suiteTraiterInstructionChoix(valeurChoix, premiereInstructionChoix, ctx);
  }

  /** Traiter un choix (d’une instruction choisir) */
  private static traiterInstructionChoix(resultChoixIns: RegExpExecArray, ctx: ContexteSeparerInstructions) {
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

    // console.log("premiereInstructionChoix:", premiereInstructionChoix);

    this.suiteTraiterInstructionChoix(valeurChoix, premiereInstructionChoix, ctx);

  }

  private static suiteTraiterInstructionChoix(valeurChoix: Valeur, premiereInstructionChoix: string, ctx: ContexteSeparerInstructions) {
    // s’il ne s’agit PAS du premier choix du bloc choisir
    if (ctx.choixBlocsChoisirEnCours[ctx.indexBlocChoisirCommence].length != 0) {
      // fermer le choix précédent
      const blocFerme = ctx.blocsOuverts.pop();
      if (blocFerme != ETypeBloc.choix) {
        console.error("SeparerInstructions: Fermeture choix précédent: le bloc ouvert n’est pas un choix.");
      }
      // retirer le choix précédent de la liste des choix ouverts
      ctx.instructionsBlocsChoixEnCours.pop();
      ctx.indexBlocChoixCommence -= 1;
    }

    // => on l’ajoute à la liste des instructions pour l’interpréter à la prochaine itération.
    ctx.listeInstructions.splice(ctx.indexCurInstruction + 1, 0, premiereInstructionChoix);

    // ajout du nouveau choix au bloc choisir le plus récent
    let nouvelleListeInstructionsChoix = new Array<Instruction>();
    ctx.choixBlocsChoisirEnCours[ctx.indexBlocChoisirCommence].push(new Choix(valeurChoix, nouvelleListeInstructionsChoix));

    // ajout d’une liste d’instructions pour ce nouveau choix
    ctx.instructionsBlocsChoixEnCours.push(nouvelleListeInstructionsChoix);
    ctx.indexBlocChoixCommence += 1;

    // on a ouvert un nouveau bloc choix
    ctx.blocsOuverts.push(ETypeBloc.choix);
  }

  /** Traiter une instruction « fin choisir » */
  private static traiterInstructionFinChoisir(ctx: ContexteSeparerInstructions) {

    // si pas de choisir ouvert, erreur
    // if (ctx.indexBlocChoisirCommence < 0) {
    if (!ctx.blocsOuverts.length) {
      AnalyseurInstructions.afficherErreurBloc("fin choisir orphelin.", ctx);
      // si bloc choisir (et dernier choix) ouvert => le fermer
    } else {
      // 1. fermer le bloc choix le plus récent
      // => il y a au moins 1 choix dans le bloc choisir
      const premierBlocFerme = ctx.blocsOuverts.pop(); // bloc fermé
      if (premierBlocFerme == ETypeBloc.choix) {
        // enlever les instructions du choix fermé
        ctx.instructionsBlocsChoixEnCours.pop();
        ctx.indexBlocChoixCommence -= 1;
        // 2a. fermer le bloc choisir le plus récent
        const deuxiemeBlocFerme = ctx.blocsOuverts.pop(); // bloc fermé
        if (deuxiemeBlocFerme == ETypeBloc.choisir) {
          // enlever les choix du bloc choisir fermé
          ctx.choixBlocsChoisirEnCours.pop();
          ctx.indexBlocChoisirCommence -= 1;
        } else {
          AnalyseurInstructions.afficherErreurBloc("fin choisir: bloc précédent mal fini.", ctx);
        }
        //  2b. fermer le bloc choisir le plus récent
        // => il n’y a aucun choix dans le bloc choisir
      } else if (premierBlocFerme == ETypeBloc.choisir) {
        AnalyseurInstructions.afficherErreurBloc("fin choisir: bloc choisir sans choix.", ctx);
        // enlever les choix du bloc choisir fermé
        ctx.choixBlocsChoisirEnCours.pop();
        ctx.indexBlocChoisirCommence -= 1;
      } else {
        AnalyseurInstructions.afficherErreurBloc("fin choisir: bloc précédent mal fini.", ctx);
      }
    }
  }

  /**
   * Ajouter une erreur dans son contexte précis (règle, réaction)
   */
  private static afficherErreurBloc(message: string, ctx: ContexteSeparerInstructions) {
    console.error("separerInstructions > " + message);
    if (ctx.ligne > 0) {
      ctx.ctxAnalyse.ajouterErreur(ctx.ligne, "conséquence : " + message);
    } else if (ctx.regle) {
      ctx.ctxAnalyse.ajouterErreur(0, "règle « " + Regle.regleIntitule(ctx.regle) + " » : " + message);
    } else if (ctx.reaction) {
      ctx.ctxAnalyse.ajouterErreur(0, "élément « " + ctx.el.elIntitule + " » : réaction « " + Reaction.reactionIntitule(ctx.reaction) + " » : " + message);
    } else {
      ctx.ctxAnalyse.ajouterErreur(0, "----- : conséquence : " + message);
    }
  }
}