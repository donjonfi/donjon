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
    let estToujoursPluriel: boolean;
    let autreForme: string;
    let attributs: string[];
    let nombre: Nombre;
    let position: PositionSujetString;

    // C4 — placement de ressource quantifié « il y a N <unité> de <ressource> [position|ici] »
    newElementGenerique = AnalyseurElementPosition.testerPlacementRessource(phrase, ctx);

    // élément positionné défini (la, le, les)
    let result = newElementGenerique ? null : ExprReg.xPositionElementGeneriqueDefini.exec(phrase.morceaux[0]);
    if (result !== null) {
      // console.log("testerPosition", result);
      genreSingPlur = result[4];
      estFeminin = false;
      estToujoursPluriel = false;
      autreForme = null;
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
              if (ctx.dernierLieu.nom !== nom || ctx.dernierLieu.epithete !== epithete) {
                position = new PositionSujetString(
                  // sujet
                  nom.toLowerCase() + (epithete ? (' ' + epithete.toLowerCase()) : ''),
                  // complément
                  ctx.dernierLieu.nom + (ctx.dernierLieu.epithete ? (' ' + ctx.dernierLieu.epithete.toLowerCase()) : ''),
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
        MotUtils.getNombre(determinant, estToujoursPluriel),
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
      result = newElementGenerique ? null : ExprReg.xPositionElementGeneriqueIndefini.exec(phrase.morceaux[0]);

      if (result != null) {
        // selon le type de résultat ("il y a un xxx" ou "un xxx est")
        let offset = result[1] ? 0 : 4;
        determinant = result[1 + offset]?.toLowerCase() ?? null;
        nom = result[2 + offset];
        epithete = result[3 + offset];
        genreSingPlur = result[4 + offset];
        intituleClasseNonNormalise = nom;
        intituleClasseNormalise = ClasseUtils.getIntituleNormalise(intituleClasseNonNormalise);
        attributsString = epithete;
        // si la valeur d'attribut est entre parenthèses, ce n'est pas un attribut
        // mais une indication de genre et/ou singulier/pluriel.
        estFeminin = false;
        estToujoursPluriel = false;
        autreForme = null;

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

        genre = MotUtils.getGenre(determinant, estFeminin);
        nombre = MotUtils.getNombre(determinant, estToujoursPluriel);

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

        // Cas particulier RESSOURCE : une même ressource peut exister en plusieurs piles
        // localisées indépendantes (« Il y a 5 X dans le coffre. Il y a 3 X sur la table. »).
        // → chaque emplacement supplémentaire devient un exemplaire DISTINCT, et le premier
        //   placement reporte sa quantité sur le type (sinon elle serait perdue).
        const foundEstRessource = (elementGeneriqueFound.classeIntitule === EClasseRacine.ressource);
        const foundADejaPosition = (elementGeneriqueFound.positionString?.length ?? 0) > 0;
        const newAPosition = (newElementGenerique.positionString?.length ?? 0) > 0;

        if (foundEstRessource && newAPosition && foundADejaPosition) {
          // emplacement supplémentaire d’une ressource → exemplaire distinct (pile séparée)
          // (conserver la classe « ressource » et l’unité héritées du type)
          newElementGenerique.classeIntitule = elementGeneriqueFound.classeIntitule;
          if (!newElementGenerique.unite && elementGeneriqueFound.unite) {
            newElementGenerique.unite = elementGeneriqueFound.unite;
          }
          if (!newElementGenerique.unites && elementGeneriqueFound.unites) {
            newElementGenerique.unites = elementGeneriqueFound.unites;
          }
          newElementGenerique.numeroLigne = phrase.ligne;
          ctx.elementsGeneriques.push(newElementGenerique);
          elementConcerne = newElementGenerique;
        } else {
          // finalement l’élément concerné est l’élément trouvé
          elementConcerne = elementGeneriqueFound;
          // ajouter la position à l’élément trouvé
          elementGeneriqueFound.ajouterPositionsString(newElementGenerique.positionString);

          // RESSOURCE : reporter la quantité du placement sur le type (premier emplacement),
          //  sinon « Il y a 5 X » perdrait sa quantité au profit de la valeur par défaut du type.
          if (foundEstRessource && newAPosition) {
            elementGeneriqueFound.quantite = newElementGenerique.quantite;
            // reporter aussi l’unité issue du placement (« 30 unités de bois ») si le type n’en a pas
            if (!elementGeneriqueFound.unite && newElementGenerique.unite) {
              elementGeneriqueFound.unite = newElementGenerique.unite;
              elementGeneriqueFound.unites = newElementGenerique.unites;
            }
          }

          // - màj attributs de l’élément trouvé
          if (newElementGenerique.attributs.length > 0) {
            elementConcerne.attributs = elementGeneriqueFound.attributs.concat(newElementGenerique.attributs);
          }
          // - màj type élément de l’élément trouvé
          //  (ne pas écraser une classe racine « ressource » par le nom du placement)
          if (!foundEstRessource && ClasseUtils.getIntituleNormalise(newElementGenerique.classeIntitule) !== EClasseRacine.objet) {
            elementConcerne.classeIntitule = newElementGenerique.classeIntitule;
          }
        }

      } else {
        newElementGenerique.numeroLigne = phrase.ligne;
        // ajouter le nouvel élément
        ctx.elementsGeneriques.push(newElementGenerique);
      }
    }
    return elementConcerne;
  }

  /**
   * C4 — Placement d’une ressource quantifiée : « il y a N <unité> de <ressource> [position|ici] ».
   * Ne crée l’exemplaire que si <ressource> est une ressource déjà déclarée et que <unité> est
   * « unité(s) » ou l’unité (singulier/pluriel) déclarée de cette ressource. Sinon renvoie null
   * (la phrase est alors analysée normalement, p.ex. « 5 pommes de terre »).
   */
  public static testerPlacementRessource(phrase: Phrase, ctx: ContexteAnalyse): ElementGenerique {
    const result = ExprReg.xPlacementRessourceQuantifiee.exec(phrase.morceaux[0]);
    if (!result) { return null; }

    const quantiteStr = result[1].toLowerCase();
    const uniteMot = result[2].toLowerCase();
    const ressourceNom = result[3].toLowerCase();

    // la ressource doit avoir été déclarée auparavant
    const ressource = ctx.elementsGeneriques.find(x => x.nom.toLowerCase() === ressourceNom);
    if (!ressource || ressource.classeIntitule !== EClasseRacine.ressource) {
      return null;
    }

    // l’unité doit être « unité(s) » (défaut) ou l’unité déclarée de la ressource (singulier/pluriel)
    const estUniteDefaut = (MotUtils.getSingulier(uniteMot) === 'unité');
    const uniteDeclaree = ressource.unite ? ressource.unite.toLowerCase() : null;
    const unitesDeclarees = ressource.unites ? ressource.unites.toLowerCase() : null;
    const matchUniteDeclaree = (uniteMot === uniteDeclaree) || (uniteMot === unitesDeclarees);
    if (!estUniteDefaut && !matchUniteDeclaree) {
      return null;
    }

    // quantité (chiffres ou « un/une »)
    const quantite = /^\d+$/.test(quantiteStr) ? parseInt(quantiteStr, 10) : 1;
    const nombre = (quantite === 1) ? Nombre.s : Nombre.p;

    // position : « ici »/dessus/dedans/dessous (relatif au dernier lieu/élément) ou préposition + complément
    const sujet = ressourceNom;
    let position: PositionSujetString = null;
    if (result[6]) {
      const mot = result[6].toLowerCase();
      if (mot === 'ici') {
        if (ctx.dernierLieu) {
          position = new PositionSujetString(sujet, ctx.dernierLieu.nom + (ctx.dernierLieu.epithete ? (' ' + ctx.dernierLieu.epithete.toLowerCase()) : ''), 'dans');
        } else {
          ctx.ajouterErreur(phrase.ligne, "« ici » : un lieu doit avoir été défini précédemment.");
        }
      } else {
        if (ctx.dernierElementGenerique) {
          position = new PositionSujetString(sujet, ctx.dernierElementGenerique.nom + (ctx.dernierElementGenerique.epithete ? (' ' + ctx.dernierElementGenerique.epithete.toLowerCase()) : ''), PositionSujetString.getPosition(mot));
        } else {
          ctx.ajouterErreur(phrase.ligne, "« " + mot + " » : un élément doit avoir été défini précédemment.");
        }
      }
    } else {
      position = new PositionSujetString(sujet, result[5].toLowerCase(), result[4]);
    }

    // exemplaire localisé de la ressource (classe « ressource » + unité héritées du type)
    const el = new ElementGenerique(
      quantiteStr + ' ', ressourceNom, null, EClasseRacine.ressource, null,
      (position ? [position] : []), ressource.genre, nombre, quantite, [],
    );
    // unité : celle déclarée par la ressource, sinon « unité/unités » (forme par défaut du placement)
    el.unite = ressource.unite ?? 'unité';
    el.unites = ressource.unites ?? 'unités';
    return el;
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