import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";

import { AnalyseurCommunUtils } from "./analyseur-commun-utils";
import { AnalyseurFond } from "./analyseur.fond";
import { AnalyseurUtils } from "./analyseur.utils";
import { AnalyseurV8Instructions } from "./analyseur-v8.instructions";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { EClasseRacine } from "../../../models/commun/constantes";
import { ElementGenerique } from "../../../models/compilateur/element-generique";
import { ExprReg } from "../expr-reg";
import { Genre } from "../../../models/commun/genre.enum";
import { MotUtils } from "../../commun/mot-utils";
import { StringUtils } from "../../commun/string.utils";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { ProprieteConcept } from "../../../models/commun/propriete-element";
import { ReactionBeta } from "../../../models/compilateur/reaction-beta";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";
import { RoutineReaction } from "../../../models/compilateur/routine-reaction";
import { TexteUtils } from "../../commun/texte-utils";
import { TypeValeur } from "../../../models/compilateur/type-valeur";

export class AnalyseurPropriete {

  public static testerPourProprieteReaction(phrase: Phrase, ctxAnalyse: ContexteAnalyseV8): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    const result = ExprReg.xProprieteReaction.exec(phrase.morceaux[0]);
    if (result) {
      let elementCible: ElementGenerique = null;
      let nomProprieteCible: string = null;
      // cas 1 (son/sa xxx[1] est)
      if (result[1]) {
        elementCible = ctxAnalyse.dernierElementGenerique;
        nomProprieteCible = result[1];
        // cas 2 (la xxx[2] de yyy[3] est)
      } else {
        nomProprieteCible = result[2];
        const elementConcerneBrut = result[3];

        // FOND : surcharge d'une propriété PAR LIEU via locateur
        //  (« La description du sol situé dans la cuisine est "…" » / « … situé ici … »).
        const locFond = PhraseUtils.extraireLocalisationReference(elementConcerneBrut);
        if (locFond && (locFond.cible || locFond.ici)) {
          // extraire la valeur (même logique que le cas « propriété » plus bas)
          let valeurSurcharge = result[7] ?? '';
          if (phrase.morceaux.length > 1) {
            let v = "";
            for (let i = 1; i < phrase.morceaux.length; i++) {
              v += TexteUtils.retrouverTexteOriginal(phrase.morceaux[i]);
            }
            valeurSurcharge = v.trim().replace(/^\"|\"$/g, '');
          }
          if (AnalyseurFond.enregistrerSurchargeParLieu(locFond, nomProprieteCible, valeurSurcharge, ctxAnalyse)) {
            return ResultatAnalysePhrase.propriete;
          }
          // sinon (base ≠ fond propre) : on laisse le flux normal (qui signalera « élément pas trouvé »).
        }

        const elementConcerneIntitule = ExprReg.xGroupeNominalArticleDefini.exec(elementConcerneBrut);
        if (elementConcerneIntitule) {
          const elementConcerneNom = elementConcerneIntitule[2].toLowerCase();
          const elementConcerneEpithete = elementConcerneIntitule[3] ? elementConcerneIntitule[3].toLowerCase() : null;
          // retrouver l’élément générique concerné
          const elementsTrouves = ctxAnalyse.elementsGeneriques.filter(x => x.nom.toLowerCase() == elementConcerneNom && x.epithete?.toLowerCase() == elementConcerneEpithete);

          if (elementsTrouves.length === 1) {
            elementCible = elementsTrouves[0];
          } else {
            // Signaler l'erreur uniquement si c'est clairement une affectation de propriété :
            // - "vaut/valent" (valeur numérique) ou
            // - phrase multi-morceaux (valeur entre guillemets)
            const estSurementUnePropriete = (result[6] === "vaut" || result[6] === "valent") || phrase.morceaux.length > 1;
            if (estSurementUnePropriete) {
              const elementsSuggeres = ctxAnalyse.elementsGeneriques.filter(x => x.nom.toLowerCase() == elementConcerneNom);
              let corps = "L'élément « " + elementConcerneBrut + " » n'a pas été trouvé.";
              if (elementsSuggeres.length > 0) {
                const noms = elementsSuggeres.map(x => x.epithete ? x.epithete + " " + x.nom : x.nom);
                corps += " Élément(s) portant ce nom : « " + noms.join("», «") + " ».";
              }
              ctxAnalyse.erreur(phrase, undefined,
                CategorieMessage.referenceElementGenerique, CodeMessage.elementCiblePasTrouve,
                "élément « " + elementConcerneBrut + " » pas trouvé",
                corps,
              );
            }
          }
        } else {
          ctxAnalyse.ajouterErreur(phrase.ligne, "l’élément concerné doit être un groupe nominal: " + elementConcerneBrut);
        }
      }

      // si on a trouvé l’élément cible, lui attribuer la réaction ou la propriété
      if (elementCible) {

        ctxAnalyse.dernierElementGenerique = elementCible;

        const valeurBrut = result[7] ?? '';
        const estVaut = result[6];

        // A) RÉACTION
        if (nomProprieteCible === ("réaction")) {
          // - RETROUVER LA LISTE DES SUJETS
          const sujetsBruts = result[5];
          const listeSujets = AnalyseurPropriete.retrouverSujets(sujetsBruts, ctxAnalyse, phrase);
          // s’il s’agit du sujet par défaut (aucun sujet)
          if (listeSujets.length === 0) {
            listeSujets.push(new GroupeNominal(null, "aucun", "sujet"));
          }
          // - RETROUVER L’INSRTRUCTION
          let instructionBrute = AnalyseurPropriete.retrouverInstructionsBrutes((valeurBrut), ctxAnalyse.erreurs, phrase);
          let instructionBruteNettoyee = AnalyseurCommunUtils.nettoyerInstruction(instructionBrute);
          // transformer forme rapide en instruction dire
          if (instructionBruteNettoyee.startsWith('"') && instructionBruteNettoyee.endsWith('"')) {
            instructionBruteNettoyee = 'dire ' + instructionBruteNettoyee;
          }

          let instructionDecomposee = AnalyseurCommunUtils.decomposerInstructionSimple(instructionBruteNettoyee);
          // instruction simple a été trouvée
          if (instructionDecomposee) {
            let instructionDire = AnalyseurCommunUtils.creerInstructionSimple(instructionDecomposee);
            instructionDire.ligne = phrase.ligne;

            if (instructionDire?.instruction?.infinitif == 'dire') {
              // - AJOUTER LA RÉACTION
              const reaction = new RoutineReaction(listeSujets, phrase.ligne);
              reaction.instructions.push(instructionDire);
              // retrouver l’objet qui réagit et lui ajouter la réaction
              elementCible.reactions.push(reaction);
              // résultat
              elementTrouve = ResultatAnalysePhrase.reaction;
            } else {
              ctxAnalyse.erreur(phrase, undefined,
                CategorieMessage.syntaxeReaction, CodeMessage.reactionSimpleUniquement,
                "instruction pas prise en charge ici",
                `Veuillez utiliser un bloc « réactions » si vous souhaitez une réaction plus compliquée qu’un simple « dire ».`,
              );
            }
          } else {

          }
          // B) UNITÉ d’une ressource (« Son unité est le barile »)
        } else if (StringUtils.normaliserMot(nomProprieteCible) === 'unite' && elementCible.classeIntitule === EClasseRacine.ressource) {
          // genre de l’unité : marqueur « (f) »/« (m) » prioritaire, sinon déduit de l’article
          //  (« la » → féminin, « le » → masculin), sinon masculin par défaut.
          const valeurNettoyee = valeurBrut.trim();
          const mMarqueur = /\((f|m)\)\s*$/i.exec(valeurNettoyee);
          const valeurSansMarqueur = valeurNettoyee.replace(/\s*\((?:f|m)\)\s*$/i, '').trim();
          let uniteGenre = Genre.m;
          if (mMarqueur) {
            uniteGenre = (mMarqueur[1].toLowerCase() === 'f') ? Genre.f : Genre.m;
          } else if (/^la\s/i.test(valeurSansMarqueur)) {
            uniteGenre = Genre.f;
          } else if (/^le\s/i.test(valeurSansMarqueur)) {
            uniteGenre = Genre.m;
          }
          // valeurBrut p.ex. « le barile » → retirer l’article et dériver singulier/pluriel
          const uniteNom = valeurSansMarqueur.replace(/^(le |la |les |l'|l’|un |une |des |du |de la |de l'|de l’)/i, '').trim();
          if (uniteNom) {
            elementCible.unite = MotUtils.getSingulier(uniteNom.toLowerCase());
            elementCible.unites = MotUtils.getPluriel(elementCible.unite);
            elementCible.uniteGenre = uniteGenre;
          }
          elementTrouve = ResultatAnalysePhrase.propriete;
          // C) PROPRIÉTÉ
        } else {
          ctxAnalyse.dernierePropriete = new ProprieteConcept(null, nomProprieteCible, (estVaut === 'vaut' ? TypeValeur.nombre : TypeValeur.mots), valeurBrut);
          // ajouter la propriété au dernier élément
          elementCible.proprietes.push(ctxAnalyse.dernierePropriete);

          // si phrase en plusieurs morceaux, ajouter valeur (texte) de la propriété
          if (phrase.morceaux.length > 1) {
            // reconstituer la valeur et enlever les caractères spéciaux
            let valeur = "";
            for (let index = 1; index < phrase.morceaux.length; index++) {
              // ajouter la description en enlevant les caractères spéciaux
              valeur += TexteUtils.retrouverTexteOriginal(phrase.morceaux[index]);
            }
            // enlever les guillemets autours de la valeur
            valeur = valeur.trim().replace(/^\"|\"$/g, '');
            ctxAnalyse.dernierePropriete.valeur = valeur;
          }
          // résultat
          elementTrouve = ResultatAnalysePhrase.propriete;
        }
      // élément cible pas trouvé — si l'erreur a été signalée plus haut, retourner propriete
      // (non-aucun) pour éviter le message générique "formulation inconnue"
      } else if (result[3] && ((result[6] === "vaut" || result[6] === "valent") || phrase.morceaux.length > 1)) {
        elementTrouve = ResultatAnalysePhrase.propriete;
      }
    }
    return elementTrouve;
  }

  /** Retrouver les sujets (pour les réactions) */
  public static retrouverSujets(sujets: string, ctxAnalyse: ContexteAnalyse, phrase: Phrase) {
    const listeSujetsBruts = PhraseUtils.separerListeIntitulesEtOu(sujets, true);
    let listeSujets: GroupeNominal[] = [];
    listeSujetsBruts.forEach(sujetBrut => {
      const resultGn = ExprReg.xGroupeNominalArticleDefiniEtIndefini.exec(sujetBrut);
      if (resultGn) {
        // on met en minuscules d’office pour éviter les soucis lors des comparaisons
        const sujetNom = resultGn[2]?.toLocaleLowerCase();
        const sujetEpithete = resultGn[3]?.toLowerCase();
        listeSujets.push(new GroupeNominal(null, sujetNom, sujetEpithete));
      } else {
        if (ctxAnalyse instanceof ContexteAnalyseV8) {
          ctxAnalyse.erreur(phrase, undefined,
            CategorieMessage.syntaxeReaction, CodeMessage.sujetIntrouvable,
            "format du sujet pas pris en charge",
            `Les sujets de la réaction doivent être des groupes nominaux. Sujet pas compris: ${sujetBrut}`,
          );
        } else {
          ctxAnalyse.ajouterErreur(phrase.ligne, "réaction : les sujets doivent être des groupes nominaux: " + sujetBrut);
        }
      }
    });
    return listeSujets;
  }

  private static retrouverInstructionsBrutes(instructions: string, erreurs: string[], phrase: Phrase) {
    let instructionsBrutes = instructions;
    // si phrase morcelée, rassembler les morceaux (réaction complète)
    if (phrase.morceaux.length > 1) {
      for (let index = 1; index < phrase.morceaux.length; index++) {
        instructionsBrutes += phrase.morceaux[index];
      }
    }
    instructionsBrutes = instructionsBrutes.trim();
    return instructionsBrutes;
  }

}