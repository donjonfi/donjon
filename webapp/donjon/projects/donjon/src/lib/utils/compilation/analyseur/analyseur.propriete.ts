import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";

import { AnalyseurUtils } from "./analyseur.utils";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { ElementGenerique } from "../../../models/compilateur/element-generique";
import { ExprReg } from "../expr-reg";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { ProprieteElement } from "../../../models/commun/propriete-element";
import { ReactionBeta } from "../../../models/compilateur/reaction-beta";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";
import { TexteUtils } from "../../commun/texte-utils";
import { TypeValeur } from "../../../models/compilateur/type-valeur";

export class AnalyseurPropriete {

  public static testerPourProprieteReaction(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

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
        const elementConcerneIntitule = ExprReg.xGroupeNominalArticleDefini.exec(elementConcerneBrut);
        if (elementConcerneIntitule) {
          const elementConcerneNom = elementConcerneIntitule[2].toLowerCase();
          const elementConcerneEpithete = elementConcerneIntitule[3] ? elementConcerneIntitule[3].toLowerCase() : null;
          // retrouver l’élément générique concerné
          const elementsTrouves = ctxAnalyse.elementsGeneriques.filter(x => x.nom.toLowerCase() == elementConcerneNom && x.epithete?.toLowerCase() == elementConcerneEpithete);

          if (elementsTrouves.length === 1) {
            elementCible = elementsTrouves[0];
          } else {
            console.warn("xPropriete: Pas trouvé le complément (" + elementsTrouves.length + "):", elementConcerneBrut);
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
          // - RETROUVER LES INSTRUCTIONS
          const instructionsBrutes = AnalyseurPropriete.retrouverInstructionsBrutes((valeurBrut), ctxAnalyse.erreurs, phrase);
          // AJOUTER LA RÉACTION
          ctxAnalyse.derniereReaction = new ReactionBeta(listeSujets, instructionsBrutes, null);
          // retrouver l’objet qui réagit et lui ajouter la réaction
          elementCible.reactions.push(ctxAnalyse.derniereReaction);
          // résultat
          elementTrouve = ResultatAnalysePhrase.reaction;

          // B) PROPRIÉTÉ
        } else {
          ctxAnalyse.dernierePropriete = new ProprieteElement(nomProprieteCible, (estVaut === 'vaut' ? TypeValeur.nombre : TypeValeur.mots), valeurBrut);
          // ajouter la propriété au dernier élément
          elementCible.proprietes.push(ctxAnalyse.dernierePropriete);

          // si phrase en plusieurs morceaux, ajouter valeur (texte) de la propriété
          if (phrase.morceaux.length > 1) {
            // reconstituer la valeur et enlever les caractèrs spéciaux
            let valeur = "";
            for (let index = 1; index < phrase.morceaux.length; index++) {
              // ajouter la description en enlevant les caractères spéciaux
              valeur += TexteUtils.retrouverTexteOriginal(phrase.morceaux[index]);
            }
            // enlever les guillemets autours de la valeur
            valeur = valeur.trim().replace(/^\"|\"$/g, '');
            ctxAnalyse.dernierePropriete.valeur = valeur;
          }
        }

        // résultat
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