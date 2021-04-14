import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ElementGenerique } from "../../../models/compilateur/element-generique";
import { ExprReg } from "../expr-reg";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { Propriete } from "../../../models/commun/propriete";
import { Reaction } from "../../../models/compilateur/reaction";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";
import { TypeValeur } from "../../../models/compilateur/type-valeur";
import { AnalyseurUtils } from "./analyseur.utils";

export class AnalyseurPropriete {

  public static testerPourProprieteReaction(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    const result = ExprReg.xProprieteReaction.exec(phrase.phrase[0]);
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
        const elementConcerneIntitule = ExprReg.xGroupeNominal.exec(elementConcerneBrut);
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
          AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, "l’élément concerné doit être un groupe nominal: " + elementConcerneBrut);
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
          ctxAnalyse.derniereReaction = new Reaction(listeSujets, instructionsBrutes, null);
          // retrouver l’objet qui réagit et lui ajouter la réaction
          elementCible.reactions.push(ctxAnalyse.derniereReaction);
          // résultat
          elementTrouve = ResultatAnalysePhrase.reaction;

          // B) PROPRIÉTÉ
        } else {
          ctxAnalyse.dernierePropriete = new Propriete(nomProprieteCible, (estVaut === 'vaut' ? TypeValeur.nombre : TypeValeur.mots), valeurBrut);
          // ajouter la propriété au dernier élément
          elementCible.proprietes.push(ctxAnalyse.dernierePropriete);

          // si phrase en plusieurs morceaux, ajouter valeur (texte) de la propriété
          if (phrase.phrase.length > 1) {
            // ajouter la valeur en enlevant les caractères spéciaux
            ctxAnalyse.dernierePropriete.valeur = phrase.phrase[1]
              .replace(ExprReg.xCaractereDebutCommentaire, '')
              .replace(ExprReg.xCaractereFinCommentaire, '')
              .replace(ExprReg.xCaractereRetourLigne, '\n')
              .replace(ExprReg.xCaracterePointVirgule, ';')
              .replace(ExprReg.xCaractereVirgule, ',');
          }
        }

        // résultat
        elementTrouve = ResultatAnalysePhrase.propriete;
      }
    }
    return elementTrouve;

  }


  /** Retrouver les sujets (pour les réactions) */
  private static retrouverSujets(sujets: string, ctxAnalyse: ContexteAnalyse, phrase: Phrase) {
    const listeSujetsBruts = PhraseUtils.separerListeIntitules(sujets);
    let listeSujets: GroupeNominal[] = [];
    listeSujetsBruts.forEach(sujetBrut => {
      const resultGn = ExprReg.xGroupeNominal.exec(sujetBrut);
      if (resultGn) {
        // on met en minuscules d’office pour éviter les soucis lors des comparaisons
        const sujetNom = resultGn[2]?.toLocaleLowerCase();
        const sujetEpithete = resultGn[3]?.toLowerCase();
        listeSujets.push(new GroupeNominal(null, sujetNom, sujetEpithete));
      } else {
        AnalyseurUtils.ajouterErreur(ctxAnalyse, phrase.ligne, "réaction : les sujets doivent être des groupes nominaux: " + sujetBrut);
      }
    });
    return listeSujets;
  }

  private static retrouverInstructionsBrutes(instructions: string, erreurs: string[], phrase: Phrase) {
    let instructionsBrutes = instructions;
    // si phrase morcelée, rassembler les morceaux (réaction complète)
    if (phrase.phrase.length > 1) {
      for (let index = 1; index < phrase.phrase.length; index++) {
        instructionsBrutes += phrase.phrase[index];
      }
    }
    instructionsBrutes = instructionsBrutes.trim();
    return instructionsBrutes;
  }

}