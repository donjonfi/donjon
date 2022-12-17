import { ClasseUtils } from "../../commun/classe-utils";
import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { EClasseRacine } from "../../../models/commun/constantes";
import { ElementGenerique } from "../../../models/compilateur/element-generique";
import { ExprReg } from "../expr-reg";
import { Genre } from "../../../models/commun/genre.enum";
import { MotUtils } from "../../commun/mot-utils";
import { Nombre } from "../../../models/commun/nombre.enum";
import { Phrase } from "../../../models/compilateur/phrase";
import { PhraseUtils } from "../../commun/phrase-utils";
import { PositionSujetString } from "../../../models/compilateur/position-sujet";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";

export class AnalyseurElementPosition {

  // Tester phrase avec élement générique + position
  public static testerElementAvecPosition(phrase: Phrase, ctx: ContexteAnalyse): ElementGenerique {

    // nouvel élément (sera éventuellement pas ajouté si on se rend compte qu’on fait référence à un élément existant)
    let newElementGenerique: ElementGenerique = null;
    // élément concerné
    let elementConcerne: ElementGenerique = null;

    let determinant: string;
    let nom: string;
    let epithete: string;
    let intituleClasseNonNormalise: string;
    let intituleClasseNormalise: string;
    let genre: Genre;
    let attributsString: string;
    let genreSingPlur: string;
    let estFeminin: boolean;
    let autreForme: string;
    let attributs: string[];
    let nombre: Nombre;
    let position: PositionSujetString;

    // élément positionné défini (la, le, les)
    let result = ExprReg.xPositionElementGeneriqueDefini.exec(phrase.morceaux[0]);
    if (result !== null) {
      // console.log("testerPosition", result);
      genreSingPlur = result[4];
      estFeminin = false;
      autreForme = null;
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
          // TODO: épithète
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
      epithete = result[3],
        intituleClasseNormalise = ClasseUtils.getIntituleNormalise(result[5]);

      if (result[6]) {
        attributs = PhraseUtils.separerListeIntitulesEt(result[6], true);
      } else {
        attributs = [];
      }
      
      position = null;

      // => ici (dernier lieu défini) ou dessus/dedans/dessous (dernier objet défini)
      const iciDedansDessusDessous = result[9];
      if (iciDedansDessusDessous) {
        switch (iciDedansDessusDessous) {
          // ICI
          case 'ici':
            if (ctx.dernierLieu) {
              if (ctx.dernierLieu.nom !== nom || ctx.dernierLieu.epithete !== epithete ) {
                position = new PositionSujetString(
                  // sujet
                  nom.toLowerCase() + (epithete ? (' ' + epithete.toLowerCase()) : ''),
                  // complément
                  ctx.dernierLieu.nom + (epithete ? (' ' + epithete.toLowerCase()) : ''),
                  // position
                  'dans'
                );
              } else {
                ctx.ajouterErreur(phrase.ligne, "Il/Elle est ici : le lieu créé précédemment porte le nom même nom que l'élément à ajouter (" + nom + ").")
              }
            } else {
              ctx.ajouterErreur(phrase.ligne, "Il/Elle est ici : un « lieu » doit avoir été défini précédemment.")
            }
            break;

          case 'dedans':
          case 'dessus':
          case 'dessous':
            if (ctx.dernierElementGenerique && (ctx.dernierElementGenerique.nom !== nom || ctx.dernierElementGenerique.epithete !== epithete)) {
              position = new PositionSujetString(
                // sujet
                nom.toLowerCase() + (epithete ? (' ' + epithete.toLowerCase()) : ''),
                // complément
                ctx.dernierElementGenerique.nom + (ctx.dernierElementGenerique.epithete ? (' ' + ctx.dernierElementGenerique.epithete.toLowerCase()) : ''),
                // position
                PositionSujetString.getPosition(iciDedansDessusDessous)
              );
            } else {
              ctx.ajouterErreur(phrase.ligne, "Il/Elle est ici : un « élément » doit avoir été défini précédemment.")
            }
            break;

          default:
            ctx.ajouterErreur(phrase.ligne, "Il/Elle est iciDedansDessusDessous : mot clé non pris en charge : " + result[9]);
            break;
        }
        // Position relative classique
      } else {
        position = new PositionSujetString(
          // sujet
          nom.toLowerCase() + (epithete ? (' ' + epithete.toLowerCase()) : ''),
          // complément
          result[8].toLowerCase(),
          // position
          result[7]
        );
      }

      newElementGenerique = new ElementGenerique(
        determinant,
        nom,
        epithete,
        intituleClasseNormalise,
        null, // classe
        (position ? [position] : []),
        // genre
        MotUtils.getGenre(determinant, estFeminin),
        // nombre
        MotUtils.getNombre(determinant),
        // quantité
        MotUtils.getQuantite(determinant, 1),
        attributs,
      );

      if (autreForme) {
        if (newElementGenerique.nombre === Nombre.s) {
          newElementGenerique.nomP = autreForme;
        } else {
          newElementGenerique.nomS = autreForme;
        }
      }

      // Pour les humains, on peut déterminer le genre selon que c'est un homme ou une femme
      switch (newElementGenerique.classeIntitule.toLocaleLowerCase()) {
        case 'homme':
        case 'hommmes':
          newElementGenerique.genre = Genre.m;
          break;

        case 'femme':
        case 'femmes':
          newElementGenerique.genre = Genre.f;
          break;

        default:
          break;
      }

      // élément positionné avec "un/une xxxx est" soit "il y a un/une xxxx"
    } else {
      result = ExprReg.xPositionElementGeneriqueIndefini.exec(phrase.morceaux[0]);

      if (result != null) {
        // selon le type de résultat ("il y a un xxx" ou "un xxx est")
        let offset = result[1] ? 0 : 4;
        determinant = result[1 + offset]?.toLowerCase() ?? null;
        nombre = MotUtils.getNombre(determinant);
        nom = result[2 + offset];
        epithete = result[3 + offset];
        genreSingPlur = result[4 + offset];
        intituleClasseNonNormalise = nom;
        intituleClasseNormalise = ClasseUtils.getIntituleNormalise(intituleClasseNonNormalise);
        attributsString = epithete;
        // si la valeur d'attribut est entre parenthèses, ce n'est pas un attribut
        // mais une indication de genre et/ou singulier/pluriel.
        estFeminin = false;
        autreForme = null;

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

        genre = MotUtils.getGenre(determinant, estFeminin);
        // retrouver les attributs
        attributs = PhraseUtils.separerListeIntitulesEt(attributsString, true);

        position = new PositionSujetString(nom.toLowerCase() + (epithete ? (" " + epithete.toLowerCase()) : ""), result[10].toLowerCase(), result[9]);

        newElementGenerique = new ElementGenerique(
          determinant,
          nom,
          epithete,
          intituleClasseNormalise,
          null, // classe
          (position ? [position] : []),
          genre,
          nombre,
          MotUtils.getQuantite(determinant, 1),
          attributs,
        );

        if (autreForme) {
          if (newElementGenerique.nombre == Nombre.s) {
            newElementGenerique.nomP = autreForme;
          } else {
            newElementGenerique.nomS = autreForme;
          }
        }

      }

    }
    // s'il y a un résultat, l'ajouter
    if (newElementGenerique) {
      // normalement l’élément concerné est le nouveau
      elementConcerne = newElementGenerique;
      // avant d'ajouter l'élément vérifier s'il existe déjà
      let newEleNom = newElementGenerique.nom.toLowerCase();
      let newEleEpi = newElementGenerique.epithete?.toLowerCase() ?? null;
      const filtered = ctx.elementsGeneriques.filter(x => x.nom.toLowerCase() == newEleNom && x.epithete?.toLowerCase() == newEleEpi);

      if (filtered.length > 0) {
        // mettre à jour l'élément existant le plus récent.
        let elementGeneriqueFound = filtered[filtered.length - 1];
        // finalement l’élément concerné est l’élément trouvé
        elementConcerne = elementGeneriqueFound;
        // - position
        // // if (newElementGenerique.positionString) {
        // //   // s'il y avait déjà une position définie, c'est un autre élément, donc on ajoute quand même le nouveau !
        // //   if (elementGeneriqueFound.positionString) {
        // //     ctx.elementsGeneriques.push(newElementGenerique);
        // //     elementConcerne = newElementGenerique;
        // //   } else {
        // //     // sinon, ajouter la position à l’élément trouvé
        // //     elementGeneriqueFound.positionString = newElementGenerique.positionString;
        // //   }
        // // }
        //ajouter la position à l’élément trouvé

        elementGeneriqueFound.ajouterPositionsString(newElementGenerique.positionString);

        // - màj attributs de l’élément trouvé
        if ((elementConcerne == elementGeneriqueFound) && newElementGenerique.attributs.length > 0) {
          elementConcerne.attributs = elementGeneriqueFound.attributs.concat(newElementGenerique.attributs);
        }
        // - màj type élément de l’élément trouvé
        if ((elementConcerne == elementGeneriqueFound) && ClasseUtils.getIntituleNormalise(newElementGenerique.classeIntitule) !== EClasseRacine.objet) {
          elementConcerne.classeIntitule = newElementGenerique.classeIntitule;
        }

      } else {
        // ajouter le nouvel élément
        ctx.elementsGeneriques.push(newElementGenerique);
      }
    }
    return elementConcerne;
  }

  // 
  /**
   * Tester phrase avec pronom personnel (il/elle) et position du dernier élément.
   * @param elementsGeneriques 
   * @param phrase 
   */
  public static testerPronomPersonnelPosition(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    const result = ExprReg.xPronomPersonnelPosition.exec(phrase.morceaux[0]);
    if (result !== null) {
      // genre de l'élément précédent
      ctxAnalyse.dernierElementGenerique.genre = MotUtils.getGenre(phrase.morceaux[0].split(" ")[0], null);
      // attributs de l'élément précédent
      // => position par rapport à un complément (ex: à l’intérieur de la cuisine ou dans le salon)
      if (result[3]) {
        const pos = result[1] ? result[1] : result[2];
        const compl = result[3].toLowerCase();
        ctxAnalyse.dernierElementGenerique.ajouterPositionString(
          new PositionSujetString(
            // sujet
            ctxAnalyse.dernierElementGenerique.nom.toLowerCase() + (ctxAnalyse.dernierElementGenerique.epithete ? (' ' + ctxAnalyse.dernierElementGenerique.epithete.toLowerCase()) : ''),
            // complément
            compl,
            // position
            pos
          )
        );
        // => ici (dernier lieu défini)
      } else {
        if (ctxAnalyse.dernierLieu && ctxAnalyse.dernierLieu.nom !== ctxAnalyse.dernierElementGenerique.nom) {
          ctxAnalyse.dernierElementGenerique.ajouterPositionString(
            new PositionSujetString(
              // sujet
              ctxAnalyse.dernierElementGenerique.nom.toLowerCase() + (ctxAnalyse.dernierElementGenerique.epithete ? (' ' + ctxAnalyse.dernierElementGenerique.epithete.toLowerCase()) : ''),
              // complément
              ctxAnalyse.dernierLieu.nom + (ctxAnalyse.dernierLieu.epithete ? (' ' + ctxAnalyse.dernierLieu.epithete.toLowerCase()) : ''),
              // position
              "dans"
            )
          );
        } else {
          ctxAnalyse.ajouterErreur(phrase.ligne, "Il/Elle est ici : un « lieu » doit avoir été défini précédemment.")
        }
      }
      elementTrouve = ResultatAnalysePhrase.pronomPersonnelPosition;
    }

    return elementTrouve;
  }

}