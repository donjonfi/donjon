import { ClasseUtils } from "../../commun/classe-utils";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { Definition } from "../../../models/compilateur/definition";
import { EClasseRacine } from "../../../models/commun/constantes";
import { ElementGenerique } from "../../../models/compilateur/element-generique";
import { ExprReg } from "../expr-reg";
import { Genre } from "../../../models/commun/genre.enum";
import { MotUtils } from "../../commun/mot-utils";
import { Nombre } from "../../../models/commun/nombre.enum";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { PositionSujetString } from "../../../models/compilateur/position-sujet";

export class AnalyseurElementSimple {

  // Élement simple non positionné
  // public static testerElementSimple(dictionnaire: Map<string, Definition>, elementsGeneriques: ElementGenerique[], phrase: Phrase, verbeux: boolean): ElementGenerique {
  public static testerElementSansPosition(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ElementGenerique {
    let nouvelElementGenerique: ElementGenerique = null;
    let elementConcerne: ElementGenerique = null;

    let determinant: string;
    let nom: string;
    let epithete: string;
    let intituleClasseNormalise: string;
    let genre: Genre;
    let attributsString: string;
    let initialiseA: string;
    let attributs: string[];
    let nombre: Nombre;
    let quantite: number;
    let position: PositionSujetString;

    // élément générique simple avec type d'élément (ex: le champignon est un décor)
    let result = ExprReg.xDefinitionElementAvecType.exec(phrase.morceaux[0]);
    if (result !== null) {
      let genreSingPlur = result[4];
      let estFeminin = false;
      let autreForme: string = null;
      if (genreSingPlur) {
        // retirer parenthèses
        genreSingPlur = genreSingPlur.slice(1, genreSingPlur.length - 1);
        // séparer les arguments sur la virgule
        const argSupp = genreSingPlur.split(',');
        // le premier argument est le signe féminin
        if (argSupp[0].trim() === 'f') {
          estFeminin = true;
          // le premier argument est l'autre forme (singulier ou pluriel)
        } else {
          autreForme = argSupp[0].trim();
        }
        // s'il y a 2 arguments
        if (argSupp.length > 1) {
          // le 2e argument est le signe féminin
          if (argSupp[1].trim() === 'f') {
            estFeminin = true;
            // le 2e argument est l'autre forme (singulier ou pluriel)
          } else {
            autreForme = argSupp[1].trim();
          }
        }
      }

      determinant = result[1] ? result[1].toLowerCase() : null;
      nom = result[2];
      epithete = result[3];
      intituleClasseNormalise = ClasseUtils.getIntituleNormalise(result[5]);
      genre = MotUtils.getGenre(result[1], estFeminin);
      nombre = MotUtils.getNombre(result[1]);
      quantite = MotUtils.getQuantite(result[1], 1);
      attributsString = result[6];
      initialiseA = result[7];
      attributs = PhraseUtils.separerListeIntitulesEt(attributsString, true);
      if(initialiseA){
        attributs.push(initialiseA);
      }
      position = null;

      // Pourquoi ajouter un nouveau type ici ?
      // // AnalyseurElementSimple.addOrUpdDefinition(ctxAnalyse.typesUtilisateur, nom, nombre, intituleClasse, attributs);

      nouvelElementGenerique = new ElementGenerique(
        determinant,
        nom,
        epithete,
        intituleClasseNormalise,
        null,
        (position ? [position] : []),
        genre,
        nombre,
        quantite,
        attributs,
      );

      if (autreForme) {
        if (nouvelElementGenerique.nombre === Nombre.s) {
          nouvelElementGenerique.nomP = autreForme;
        } else {
          nouvelElementGenerique.nomS = autreForme;
        }
      }

    } else {
      // élément simple avec attributs (ex: le champignon est brun et on peut le cueillir)
      result = ExprReg.xElementSimpleAttributs.exec(phrase.morceaux[0]);
      if (result != null) {
        // (f) / (f, autre forme) / (autre forme)
        let genreSingPlur = result[4];
        let estFeminin = false;
        let autreForme: string = null;
        if (genreSingPlur) {
          // retirer parenthèses
          genreSingPlur = genreSingPlur.slice(1, genreSingPlur.length - 1);
          // séparer les arguments sur la virgule
          const argSupp = genreSingPlur.split(',');
          // le premier argument est le signe féminin
          if (argSupp[0].trim() == 'f') {
            estFeminin = true;
            // le premier argument est l'autre forme (singulier ou pluriel)
          } else {
            autreForme = argSupp[0].trim();
          }
          // s'il y a 2 arguments
          if (argSupp.length > 1) {
            // le 2e argument est le signe féminin
            if (argSupp[1].trim() == 'f') {
              estFeminin = true;
              // le 2e argument est l'autre forme (singulier ou pluriel)
            } else {
              autreForme = argSupp[1].trim();
            }
          }
        }

        // attributs ?
        attributs = null;
        if (result[5] && result[5].trim() !== '') {
          // découper les attributs qui sont séparés par des ', ' ou ' et '
          attributs = PhraseUtils.separerListeIntitulesEt(result[5], true);
        }

        nouvelElementGenerique = new ElementGenerique(
          result[1] ? result[1].toLowerCase() : null,
          result[2],
          result[3],
          EClasseRacine.objet,
          null,
          [],
          MotUtils.getGenre(result[1], estFeminin),
          MotUtils.getNombre(result[1]),
          MotUtils.getQuantite(result[1], 1),
          (attributs ? attributs : new Array<string>()),
        );

        if (autreForme) {
          if (nouvelElementGenerique.nombre == Nombre.s) {
            nouvelElementGenerique.nomP = autreForme;
          } else {
            nouvelElementGenerique.nomS = autreForme;
          }
        }
      } else {
        // élément simple avec attributs (ex: le champignon est brun et on peut le cueillir)
        result = ExprReg.xElementSimpleAttributs.exec(phrase.morceaux[0]);
        if (result != null) {

        }
      }
    }

    // s'il y a un résultat
    if (nouvelElementGenerique) {

      // normalement l’élément concerné est le nouvel élément
      elementConcerne = nouvelElementGenerique;

      // avant d'ajouter l'élément vérifier s'il existe déjà
      let nomLower = nouvelElementGenerique.nom.toLowerCase();
      let epiLower = nouvelElementGenerique.epithete?.toLowerCase();
      const filtered = ctxAnalyse.elementsGeneriques.filter(x => x.nom.toLowerCase() == nomLower && x.epithete?.toLowerCase() == epiLower);

      if (filtered.length > 0) {
        // mettre à jour l'élément existant le plus récent.
        let elementGeneriqueTrouve = filtered[filtered.length - 1];
        // l’élément concerné est en fait l’élément retrouvé
        elementConcerne = elementGeneriqueTrouve;

        // - type d'élément
        if (ClasseUtils.getIntituleNormalise(nouvelElementGenerique.classeIntitule) !== EClasseRacine.objet) {
          // s'il y avait déjà un type défini, c'est un autre élément donc finalement on va quand même l’ajouter
          if (ClasseUtils.getIntituleNormalise(elementGeneriqueTrouve.classeIntitule) !== EClasseRacine.objet) {
            ctxAnalyse.elementsGeneriques.push(nouvelElementGenerique);
            // finalement c’est le nouvel élément qui est concerné
            elementConcerne = nouvelElementGenerique;
          } else {
            // sinon, mettre à jour le type de l’élément retrouvé
            elementGeneriqueTrouve.classeIntitule = nouvelElementGenerique.classeIntitule;
          }
        }
        // - attributs

        if (ctxAnalyse.verbeux) {
          console.log("e:", nouvelElementGenerique);
          console.log("found.attributs:", elementGeneriqueTrouve.attributs);
        }

        if (elementConcerne == elementGeneriqueTrouve && nouvelElementGenerique.attributs.length > 0) {
          if (elementGeneriqueTrouve.attributs) {
            elementGeneriqueTrouve.attributs = elementGeneriqueTrouve.attributs.concat(nouvelElementGenerique.attributs);
          } else {
            elementGeneriqueTrouve.attributs = nouvelElementGenerique.attributs;
          }
        }
      } else {
        // ajouter le nouvel élément
        ctxAnalyse.elementsGeneriques.push(nouvelElementGenerique);
      }
    }
    return elementConcerne;
  }



}