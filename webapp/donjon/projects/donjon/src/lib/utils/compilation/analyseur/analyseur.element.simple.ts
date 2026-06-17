import { AnalyseurFond } from "./analyseur.fond";
import { ClasseUtils } from "../../commun/classe-utils";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { Definition } from "../../../models/compilateur/definition";
import { EClasseRacine } from "../../../models/commun/constantes";
import { ElementGenerique } from "../../../models/compilateur/element-generique";
import { ExprReg } from "../expr-reg";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
import { xDefinitionElement1GN, xDefinitionRessource1GN } from "../../../models/commun/gn-fragments";
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

    // FOND : portée déclarée INLINE (« Le sol est un fond propre à chaque lieu. »). La regex de
    //  définition n'absorbe pas le suffixe de portée → on le détecte et on le retire pour analyser
    //  « … est un fond », puis on pose la présence sur l'élément créé.
    const presenceInlineFond = AnalyseurFond.extrairePorteeDeclaration(phrase.morceaux[0]);
    const morceauPrincipal = presenceInlineFond
      ? phrase.morceaux[0].replace(ExprReg.xFondPorteeSuffixe, '$1')
      : phrase.morceaux[0];

    // élément générique simple avec type d'élément (ex: le champignon est un décor)
    //  Les RESSOURCES ont leur propre regex dédiée (tous déterminants : le/la/les/l’ ET un/une/des),
    //  essayée en premier ; sinon on retombe sur la regex générique (autres éléments, inchangée).
    let result = xDefinitionRessource1GN.exec(morceauPrincipal);
    if (result === null) {
      result = xDefinitionElement1GN.exec(morceauPrincipal);
    }
    if (result !== null) {
      // Le groupe nominal est capturé entier (result[1]) puis re-découpé en déterminant/avant/nom/après.
      const gnDef = GroupeNominal.analyser(result[1], { indefini: true });
      let genreSingPlur = result[2];
      let estFeminin = false;
      let estToujoursPluriel = false;
      let autreForme: string = null;
      if (genreSingPlur) {
        // retirer parenthèses
        genreSingPlur = genreSingPlur.slice(1, genreSingPlur.length - 1);
        // séparer les arguments sur la virgule
        const argSupp = genreSingPlur.split(',');

        argSupp.forEach(arg => {
          if (arg.trim() == 'f') {
            // il s’agit d’un mot féminin (f)
            estFeminin = true;
          } else if (arg.trim() == 'tp') {
            // toujours pluriel (tp)
            estToujoursPluriel = true;
          } else {
            // autre forme (singulier ou pluriel)
            autreForme = arg.trim();
          }
        });

      }

      determinant = gnDef?.determinant ? gnDef.determinant.toLowerCase() : null;
      nom = gnDef?.nom;
      epithete = gnDef?.epithete ?? undefined; // préserve « undefined » quand absent (le constructeur ElementGenerique n’a pas de défaut)
      const epithetesAvant = gnDef?.epithetesAvant ?? [];
      intituleClasseNormalise = ClasseUtils.getIntituleNormalise(result[3]);
      genre = MotUtils.getGenre(gnDef?.determinant, estFeminin);
      nombre = MotUtils.getNombre(gnDef?.determinant, estToujoursPluriel);
      quantite = MotUtils.getQuantite(gnDef?.determinant, 1);
      attributsString = result[4];
      initialiseA = result[5] ?? result[8];
      const unite = result[6];
      const uniteGenreMarqueur = result[7];
      attributs = PhraseUtils.separerListeIntitulesEt(attributsString, true);
      if (initialiseA) {
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
      // attribut(s) antéposé(s) (« le grand chat » → avant=[grand])
      nouvelElementGenerique.epithetesAvant = epithetesAvant;

      // FOND : poser la présence détectée inline (suffixe de portée déjà retiré ci-dessus).
      if (presenceInlineFond) {
        nouvelElementGenerique.presenceFond = presenceInlineFond;
      }

      if (autreForme) {
        if (nouvelElementGenerique.nombre === Nombre.s) {
          nouvelElementGenerique.nomP = autreForme;
        } else {
          nouvelElementGenerique.nomS = autreForme;
        }
      }

      if (unite) {
        // l’unité peut être fournie au singulier (« avec l’unité pièce ») ou au pluriel
        // (« exprimée en pièces ») : on stocke les deux formes.
        nouvelElementGenerique.unite = MotUtils.getSingulier(unite);
        nouvelElementGenerique.unites = MotUtils.getPluriel(nouvelElementGenerique.unite);
        // genre grammatical de l’unité (ex. « pièce » est féminin) : marqueur « (f) »/« (m) »,
        //  masculin par défaut. Sert aux accords des messages (« 3 pièces … ajoutées »).
        nouvelElementGenerique.uniteGenre = (uniteGenreMarqueur?.toLowerCase() === 'f') ? Genre.f : Genre.m;
      }

    } else {
      // élément simple avec attributs (ex: le champignon est brun et on peut le cueillir)
      result = ExprReg.xElementSimpleAttributs.exec(phrase.morceaux[0]);
      if (result != null) {
        // (f) / (f, autre forme) / (autre forme)
        let genreSingPlur = result[4];
        let estFeminin = false;
        let estToujoursPluriel = false;
        let autreForme: string = null;
        if (genreSingPlur) {
          // retirer parenthèses
          genreSingPlur = genreSingPlur.slice(1, genreSingPlur.length - 1);
          // séparer les arguments sur la virgule
          const argSupp = genreSingPlur.split(',');

          argSupp.forEach(arg => {
            if (arg.trim() == 'f') {
              // il s’agit d’un mot féminin (f)
              estFeminin = true;
            } else if (arg.trim() == 'tp') {
              // toujours pluriel (tp)
              estToujoursPluriel = true;
            } else {
              // autre forme (singulier ou pluriel)
              autreForme = arg.trim();
            }
          });

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
          MotUtils.getNombre(result[1], estToujoursPluriel),
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
            nouvelElementGenerique.numeroLigne = phrase.ligne;
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
        nouvelElementGenerique.numeroLigne = phrase.ligne;
        ctxAnalyse.elementsGeneriques.push(nouvelElementGenerique);
      }
    }
    return elementConcerne;
  }



}