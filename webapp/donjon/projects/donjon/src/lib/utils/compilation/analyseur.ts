import { Action } from '../../models/compilateur/action';
import { Aide } from '../../models/commun/aide';
import { Capacite } from '../../models/commun/capacite';
import { ClasseUtils } from '../commun/classe-utils';
import { Condition } from '../../models/compilateur/condition';
import { ContexteAnalyse } from '../../models/compilateur/contexte-analyse';
import { Definition } from '../../models/compilateur/definition';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementGenerique } from '../../models/compilateur/element-generique';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Evenement } from '../../models/jouer/evenement';
import { ExprReg } from './expr-reg';
import { Genre } from '../../models/commun/genre.enum';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Instruction } from '../../models/compilateur/instruction';
import { MotUtils } from '../commun/mot-utils';
import { Nombre } from '../../models/commun/nombre.enum';
import { Phrase } from '../../models/compilateur/phrase';
import { PhraseUtils } from '../commun/phrase-utils';
import { PositionSujetString } from '../../models/compilateur/position-sujet';
import { Propriete } from '../../models/commun/propriete';
import { Reaction } from '../../models/compilateur/reaction';
import { Regle } from '../../models/compilateur/regle';
import { ResultatAnalysePhrase } from '../../models/compilateur/resultat-analyse-phrase';
import { StringUtils } from '../commun/string.utils';
import { TypeRegle } from '../../models/compilateur/type-regle';
import { TypeValeur } from '../../models/compilateur/type-valeur';
import { Verification } from '../../models/compilateur/verification';

export class Analyseur {


  /**
   * Analyser les phrases fournies et ajouter les résultats dans le contexte de l’analyse.
   * @param phrases phrases à analyser.
   * @param ctx contexte de l’analyse.
   */
  public static analyserPhrases(phrases: Phrase[], ctx: ContexteAnalyse) {
    phrases.forEach(phrase => {
      Analyseur.analyserPhrase(phrase, ctx);
    });
  }

  /**
   * Ajouter la phrase fournie et ajouter les résultats dans le contexte de l’analyse.
   * @param phrase phrase à analyser.
   * @param ctx contexte de l’analyse.
   */
  private static analyserPhrase(phrase: Phrase, ctx: ContexteAnalyse) {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    // CODE DESCRIPTIF OU REGLE

    if (ctx.verbeux) {
      console.log("Analyse: ", phrase);
    }

    // 0 - SI PREMIER CARACTÈRE EST UN TIRET (-), NE PAS INTERPRÉTER
    // rem: normalement les commentaires sont déjà retirés du scénario avant d’arriver ici.
    if (phrase.phrase[0].trim().slice(0, 2) === "--") {
      phrase.traitee = true;
      if (ctx.verbeux) {
        console.log("=> commentaire trouvé");
      }
    } else {

      // ===============================================
      // SECTIONS (parties, chapitres, ...)
      // ===============================================
      const section = ExprReg.xSection.exec(phrase.phrase[0]);
      if (section) {
        elementTrouve = ResultatAnalysePhrase.section;
        if (ctx.verbeux) {
          console.log("=> section trouvée");
        }
      }

      // ===============================================
      // AIDE
      // ===============================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        const aide = ExprReg.xAide.exec(phrase.phrase[0]);
        if (aide) {
          elementTrouve = ResultatAnalysePhrase.aide;
          ctx.aides.push(
            new Aide(aide[1],
              phrase.phrase[1]
                .replace(ExprReg.xCaractereDebutCommentaire, '')
                .replace(ExprReg.xCaractereFinCommentaire, '')
                .replace(ExprReg.xCaractereRetourLigne, '\n')
                .replace(ExprReg.xCaracterePointVirgule, ';')
                .replace(ExprReg.xCaractereVirgule, ',')
            )
          );
          if (ctx.verbeux) {
            console.log("=> aide trouvée");
          }
        }
      }

      // ===============================================
      // RÈGLES
      // ===============================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        const regleTrouvee = Analyseur.testerPourRegle(phrase, ctx);
        if (regleTrouvee !== null) {
          elementTrouve = ResultatAnalysePhrase.regle;
          if (ctx.verbeux) {
            console.log("=> trouvé règle :", regleTrouvee);
          }
        }
      }

      // ===============================================
      // SYNONYMES
      // ===============================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        const synonymeTrouve = Analyseur.testerSynonyme(ctx.actions, ctx.elementsGeneriques, phrase, ctx.erreurs, ctx.verbeux)
        if (synonymeTrouve) {
          elementTrouve = ResultatAnalysePhrase.synonyme;
          if (ctx.verbeux) {
            console.log("=> trouvé synonyme(s)");
          }
        }
      }

      // ===============================================
      // ACTIONS
      // ===============================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        const actionTrouvee = Analyseur.testerAction(ctx.actions, phrase, ctx.erreurs, ctx.verbeux);
        if (actionTrouvee) {
          if (ctx.verbeux) {
            console.log("=> trouvé Action:", actionTrouvee);
          }
          elementTrouve = ResultatAnalysePhrase.action;
        }
      }

      // ===============================================
      // ACTIVER / DÉSACTIVER
      // ===============================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        const trouveDesactiver = ExprReg.xActiverDesactiver.test(phrase.phrase[0]) !== false;
        if (trouveDesactiver) {
          elementTrouve = ResultatAnalysePhrase.desactiver;
          if (ctx.verbeux) {
            console.log("=> trouvé Activer/Désactier.");
          }
        }
      }

      // ===================================================================
      // MONDE 1 - TESTER ÉLÉMENT (NOUVEAU OU EXISTANT) AVEC POSITION
      // ===================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        const elementConcerne = Analyseur.testerPosition(ctx.elementsGeneriques, phrase);
        if (elementConcerne) {
          ctx.dernierElementGenerique = elementConcerne;
          Analyseur.ajouterDescriptionDernierElement(phrase, ctx);
          elementTrouve = ResultatAnalysePhrase.elementAvecPosition;
          if (ctx.verbeux) {
            console.log("=> trouvé élément avec position:", ctx.dernierElementGenerique);
          }
        }
      }

      // ===================================================================
      // MONDE 2 - TESTER ÉLÉMENT (NOUVEAU OU EXISTANT) SANS POSITION
      // ===================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        const elementConcerne = Analyseur.testerElementSimple(ctx.typesUtilisateur, ctx.elementsGeneriques, phrase, ctx.verbeux);
        if (elementConcerne) {
          ctx.dernierElementGenerique = elementConcerne;
          Analyseur.ajouterDescriptionDernierElement(phrase, ctx);
          elementTrouve = ResultatAnalysePhrase.elementSansPosition;
          if (ctx.verbeux) {
            console.log("=> trouvé testerElementSimple:", ctx.dernierElementGenerique);
          }
        }
      }

      // ===================================================================================================
      // MONDE 3 - INFOS SE RAPPORTANT AU DERNIER ÉLÉMENT > PRONOM DÉMONSTRATIF (C’EST)
      // ===================================================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        // pronom démonstratif (C’est)
        const result = ExprReg.xPronomDemonstratif.exec(phrase.phrase[0]);
        if (result !== null) {
          // définir type de l'élément précédent
          if (result[2] && result[2].trim() !== '') {
            ctx.dernierElementGenerique.classeIntitule = ClasseUtils.getClasseIntitule(result[2]);
          }
          // attributs de l'élément précédent
          if (result[3] && result[3].trim() !== '') {
            ctx.dernierElementGenerique.attributs.push(result[3]);
          }
          Analyseur.ajouterDescriptionDernierElement(phrase, ctx);
          // résultat
          elementTrouve = ResultatAnalysePhrase.pronomDemontratifTypeAttribut;
          if (ctx.verbeux) {
            console.log("=> trouvé type et/ou attributs (pronom démonstratif) :", ctx.dernierElementGenerique);
          }
        }
      }

      // ==========================================================================================================
      // MONDE 4 - INFOS SE RAPPORTANT AU DERNIER ÉLÉMENT > PRONOM PERSONNEL POSITION (IL/ELLE)
      // ==========================================================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        const result = ExprReg.xPronomPersonnelPosition.exec(phrase.phrase[0]);
        if (result !== null) {
          // genre de l'élément précédent
          ctx.dernierElementGenerique.genre = MotUtils.getGenre(phrase.phrase[0].split(" ")[0], null);
          // attributs de l'élément précédent
          ctx.dernierElementGenerique.positionString = new PositionSujetString(
            ctx.dernierElementGenerique.nom.toLowerCase() + (ctx.dernierElementGenerique.epithete ? (' ' + ctx.dernierElementGenerique.epithete.toLowerCase()) : ''),
            result[2].toLowerCase(),
            result[1]
          );
          Analyseur.ajouterDescriptionDernierElement(phrase, ctx);
          // résultat
          elementTrouve = ResultatAnalysePhrase.pronomPersonnelPosition;
          if (ctx.verbeux) {
            console.log("=> trouvé position (pronom personnel) :", ctx.dernierElementGenerique);
          }
        }
      }

      // ==========================================================================================================
      // MONDE 5 - INFOS SE RAPPORTANT AU DERNIER ÉLÉMENT > PRONOM PERSONNEL ATTRIBUT (IL/ELLE)
      // ==========================================================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        // pronom personnel attributs
        const result = ExprReg.xPronomPersonnelAttribut.exec(phrase.phrase[0]);
        if (result !== null) {
          // attributs de l'élément précédent
          if (result[1] && result[1].trim() !== '') {
            // découper les attributs
            const attributs = PhraseUtils.separerListeIntitules(result[1]);
            ctx.dernierElementGenerique.attributs = ctx.dernierElementGenerique.attributs.concat(attributs);
          }
          // genre de l'élément précédent
          ctx.dernierElementGenerique.genre = MotUtils.getGenre(phrase.phrase[0].split(" ")[0], null);
          Analyseur.ajouterDescriptionDernierElement(phrase, ctx);
          // résultat
          elementTrouve = ResultatAnalysePhrase.pronomPersonnelAttribut;
          if (ctx.verbeux) {
            console.log("=> trouvé attribut (pronom personnel) :", ctx.dernierElementGenerique);
          }
        }
      }

      // ==========================================================================================================
      // MONDE 6 - PROPRIÉTÉ/RÉACTION SE RAPPORTANT À UN ÉLÉMENT EXISTANT
      // ==========================================================================================================
      if (elementTrouve === ResultatAnalysePhrase.aucun) {
        const result = ExprReg.xAttribut.exec(phrase.phrase[0]);
        if (result) {
          let elementCible: ElementGenerique = null;
          let nomProprieteCible: string = null;
          // cas 1 (son/sa xxx[1] est)
          if (result[1]) {
            elementCible = ctx.dernierElementGenerique;
            nomProprieteCible = result[1];
            // cas 2 (la xxx[2] de yyy[3] est)
          } else {
            nomProprieteCible = result[2];
            const elementConcerneBrut = result[3];
            const elementConcerneIntitule = ExprReg.xGroupeNominal.exec(result[3]);
            if (elementConcerneIntitule) {
              const elementConcerneNom = elementConcerneIntitule[2].toLowerCase();
              const elementConcerneEpithete = elementConcerneIntitule[3] ? elementConcerneIntitule[3].toLowerCase() : null;
              // retrouver l’élément générique concerné
              const elementsTrouves = ctx.elementsGeneriques.filter(x => x.nom.toLowerCase() == elementConcerneNom && x.epithete?.toLowerCase() == elementConcerneEpithete);

              if (elementsTrouves.length === 1) {
                elementCible = elementsTrouves[0];
              } else {
                console.warn("xPropriete: Pas trouvé le complément (" + elementsTrouves.length + "):", elementConcerneBrut);
              }
            } else {
              ctx.erreurs.push(("00000" + phrase.ligne).slice(-5) + " : l’élément concerné doit être un groupe nominal: " + elementConcerneBrut);
            }
          }

          // si on a trouvé l’élément cible, lui attribuer la réaction ou la propriété
          if (elementCible) {

            // RÉACTION
            if (nomProprieteCible === ("réaction")) {
              // - RETROUVER LA LISTE DES SUJETS
              const listeSujets = Analyseur.retrouverSujets(result[5], ctx.erreurs, phrase);
              // s’il s’agit du sujet par défaut (aucun sujet)
              if (listeSujets.length === 0) {
                listeSujets.push(new GroupeNominal(null, "aucun", "sujet"));
              }
              // - RETROUVER LES INSTRUCTIONS
              const instructionsBrutes = Analyseur.retrouverInstructionsBrutes(result[7], ctx.erreurs, phrase);
              // AJOUTER LA RÉACTION
              ctx.derniereReaction = new Reaction(listeSujets, instructionsBrutes, null);
              // retrouver l’objet qui réagit et lui ajouter la réaction
              elementCible.reactions.push(ctx.derniereReaction);
              // résultat
              elementTrouve = ResultatAnalysePhrase.reaction;
              // // reactionTrouvee = true;
              // // elementGeneriqueTrouve = false;
              if (ctx.verbeux) {
                console.log("=> trouvé réaction :", elementCible);
              }
              // PROPRIÉTÉ
            } else {
              ctx.dernierePropriete = new Propriete(nomProprieteCible, (result[6] === 'vaut' ? TypeValeur.nombre : TypeValeur.mots), result[7]);
              // ajouter la propriété au dernier élément
              elementCible.proprietes.push(ctx.dernierePropriete);

              // si phrase en plusieurs morceaux, ajouter valeur (texte) de la propriété
              if (phrase.phrase.length > 1) {
                // ajouter la valeur en enlevant les caractères spéciaux
                ctx.dernierePropriete.valeur = phrase.phrase[1]
                  .replace(ExprReg.xCaractereDebutCommentaire, '')
                  .replace(ExprReg.xCaractereFinCommentaire, '')
                  .replace(ExprReg.xCaractereRetourLigne, '\n')
                  .replace(ExprReg.xCaracterePointVirgule, ';')
                  .replace(ExprReg.xCaractereVirgule, ',');
              }
            }

            // résultat
            elementTrouve = ResultatAnalysePhrase.propriete;
            // // proprieteTrouvee = true;
            if (ctx.verbeux) {
              console.log("=> trouvé propriété :", elementCible);
            }
          }
        }
      }
    }

    // ==========================================================================================================
    // MONDE 7 - CAPACITÉ SE RAPPORTANT À UN ÉLÉMENT EXISTANT
    // ==========================================================================================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      const result = ExprReg.xCapacite.exec(phrase.phrase[0]);
      if (result) {
        const capacite = new Capacite(result[1], (result[2] ? result[2].trim() : null));
        // ajouter la capacité au dernier élément
        ctx.dernierElementGenerique.capacites.push(capacite);
        // résultat
        elementTrouve = ResultatAnalysePhrase.capacite;
        if (ctx.verbeux) {
          console.log("=> trouvé capacité :", ctx.dernierElementGenerique);
        }
      }
    }

    // ===============================================
    // IMPORT D’UN AUTRE FICHIER DE CODE (TODO)
    // ===============================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {

    } // fin test import

    // ==========================================================================================================
    // AUCUN DES TESTS N’A PERMIS DE COMPRENDRE CETTE PHRASE
    // ==========================================================================================================
    if (elementTrouve === ResultatAnalysePhrase.aucun) {
      // résultat
      ctx.erreurs.push(("00000" + phrase.ligne).slice(-5) + " : " + phrase.phrase);
      if (ctx.verbeux) {
        console.warn("=> PAS trouvé de signification.");
      }
    }

  }

  private static ajouterDescriptionDernierElement(phrase: Phrase, ctx: ContexteAnalyse) {
    // si phrase en plusieurs morceaux, ajouter commentaire qui suit.
    if (phrase.phrase.length > 1) {
      // ajouter la description en enlevant les caractères spéciaux
      ctx.dernierElementGenerique.description = phrase.phrase[1]
        .replace(ExprReg.xCaractereDebutCommentaire, '')
        .replace(ExprReg.xCaractereFinCommentaire, '')
        .replace(ExprReg.xCaractereRetourLigne, '\n')
        .replace(ExprReg.xCaracterePointVirgule, ';')
        .replace(ExprReg.xCaractereVirgule, ',');
    }
  }


  /**
   * Tester la phrase afin d’y trouver une règle.
   */
  private static testerPourRegle(phrase: Phrase, ctxAnalyse: ContexteAnalyse) {
    let resultRegle = ExprReg.rAvantApresRemplacer.exec(phrase.phrase[0]);

    if (resultRegle !== null) {

      let typeRegle: TypeRegle;
      let motCle = StringUtils.normaliserMot(resultRegle[1]);
      let condition: Condition = null;
      let evenements: Evenement[] = null;
      let commande: ElementsPhrase = null;

      switch (motCle) {
        // case 'si':
        //   typeRegle = TypeRegle.si;
        //   condition = PhraseUtils.getCondition(resultRegle[2]);
        //   if (!condition) {
        //     erreurs.push(("00000" + phrase.ligne).slice(-5) + " : condition : " + resultRegle[2]);
        //   }
        //   break;

        // case 'quand':
        case 'avant':
        case 'apres':
          typeRegle = TypeRegle[motCle];
          evenements = PhraseUtils.getEvenements(resultRegle[2]);
          if (!evenements?.length) {
            ctxAnalyse.erreurs.push(("00000" + phrase.ligne).slice(-5) + " : évènement(s) : " + resultRegle[2]);
          }
          break;

        // case 'remplacer':
        //   typeRegle = TypeRegle.remplacer;
        //   commande = PhraseUtils.getCommande(resultRegle[2]);
        //   if (!commande) {
        //     erreurs.push(("00000" + phrase.ligne).slice(-5) + " : commande : " + resultRegle[2]);
        //   }
        //   break;

        default:
          ctxAnalyse.erreurs.push(("00000" + phrase.ligne).slice(-5) + " : type règle : " + resultRegle[2]);
          console.error("tester regle: opérateur inconnu:", resultRegle[1]);
          typeRegle = TypeRegle.inconnu;
          break;
      }

      // evenements.forEach(evenement => {
      let nouvelleRegle = new Regle(typeRegle, condition, evenements, commande, resultRegle[3]);
      // });

      ctxAnalyse.regles.push(nouvelleRegle);

      // si phrase morcelée, rassembler les morceaux
      if (phrase.phrase.length > 1) {
        for (let index = 1; index < phrase.phrase.length; index++) {
          nouvelleRegle.consequencesBrutes += phrase.phrase[index];
        }
      }
      return nouvelleRegle; // trouvé une règle
    } else {
      return null; // rien trouvé
    }
  }

  /** Retrouver les sujets (pour les réactions) */
  private static retrouverSujets(sujets: string, erreurs: string[], phrase: Phrase) {
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
        erreurs.push(("00000" + phrase.ligne).slice(-5) + " : réaction : les sujets doivent être des groupes nominaux: " + sujetBrut);
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

  // Élement positionné
  private static testerPosition(elementsGeneriques: ElementGenerique[], phrase: Phrase): ElementGenerique {

    // nouvel élément (sera éventuellement pas ajouté si on se rend compte qu’on fait référence à un élément existant)
    let newElementGenerique: ElementGenerique = null;
    // élément concerné
    let elementConcerne: ElementGenerique = null;

    let determinant: string;
    let nom: string;
    let epithete: string;
    let intituleClasse: string;
    let type: string;
    let genre: Genre;
    let attributsString: string;
    let genreSingPlur: string;
    let estFeminin: boolean;
    let autreForme: string;
    let attributs: string[];
    let nombre: Nombre;
    let position: PositionSujetString;

    // élément positionné défini (la, le, les)
    let result = ExprReg.xPositionElementGeneriqueDefini.exec(phrase.phrase[0]);
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
      newElementGenerique = new ElementGenerique(
        result[1] ? result[1].toLowerCase() : null,
        result[2],
        result[3],
        ClasseUtils.getClasseIntitule(result[5]),
        null,
        new PositionSujetString(result[2].toLowerCase() + (result[3] ? (' ' + result[3].toLowerCase()) : ''), result[8].toLowerCase(), result[7]),
        MotUtils.getGenre(result[1], estFeminin),
        MotUtils.getNombre(result[1]),
        MotUtils.getQuantite(result[1]),
        (result[6] ? new Array<string>(result[6]) : new Array<string>()),
      );

      if (autreForme) {
        if (newElementGenerique.nombre === Nombre.s) {
          newElementGenerique.nomP = autreForme;
        } else {
          newElementGenerique.nomS = autreForme;
        }
      }

      // Pour les humains, on peut déterminer le genre selon que c'est un homme ou une femme
      switch (newElementGenerique.classeIntitule) {
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
      result = ExprReg.xPositionElementGeneriqueIndefini.exec(phrase.phrase[0]);

      if (result != null) {
        // selon le type de résultat ("il y a un xxx" ou "un xxx est")
        let offset = result[1] ? 0 : 4;
        determinant = result[1 + offset] ? result[1 + offset].toLowerCase() : null;
        nombre = MotUtils.getNombre(result[1 + offset]);
        nom = result[2 + offset];
        epithete = result[3 + offset];
        genreSingPlur = result[4 + offset];
        intituleClasse = nom;
        type = ClasseUtils.getClasseIntitule(intituleClasse);
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
        attributs = PhraseUtils.separerListeIntitules(attributsString);

        position = new PositionSujetString(nom.toLowerCase() + (epithete ? (" " + epithete.toLowerCase()) : ""), result[10].toLowerCase(), result[9]);

        newElementGenerique = new ElementGenerique(
          determinant,
          nom,
          epithete,
          intituleClasse,
          null,
          position,
          genre,
          nombre,
          MotUtils.getQuantite(determinant),
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
      const filtered = elementsGeneriques.filter(x => x.nom.toLowerCase() == newEleNom && x.epithete?.toLowerCase() == newEleEpi);

      if (filtered.length > 0) {
        // mettre à jour l'élément existant le plus récent.
        let elementGeneriqueFound = filtered[filtered.length - 1];
        // finalement l’élément concerné est l’élément trouvé
        elementConcerne = elementGeneriqueFound;
        // - position
        if (newElementGenerique.positionString) {
          // s'il y avait déjà une position définie, c'est un autre élément, donc on ajoute quand même le nouveau !
          if (elementGeneriqueFound.positionString) {
            elementsGeneriques.push(newElementGenerique);
            elementConcerne = newElementGenerique;
          } else {
            // sinon, ajouter la position à l’élément trouvé
            elementGeneriqueFound.positionString = newElementGenerique.positionString;
          }
        }

        // - màj attributs de l’élément trouvé
        if ((elementConcerne == elementGeneriqueFound) && newElementGenerique.attributs.length > 0) {
          elementConcerne.attributs = elementGeneriqueFound.attributs.concat(newElementGenerique.attributs);
        }
        // - màj type élément de l’élément trouvé
        if ((elementConcerne == elementGeneriqueFound) && newElementGenerique.classeIntitule !== EClasseRacine.objet) {
          elementConcerne.classeIntitule = newElementGenerique.classeIntitule;
        }

      } else {
        // ajouter le nouvel élément
        elementsGeneriques.push(newElementGenerique);
      }

    }
    return elementConcerne;
  }

  /**
   * Rechecher un synonyme d’action ou d’élment du jeu
   * @param actions actions déjà trouvées.
   * @param elementsGeneriques  éléments du jeu déjà trouvés.
   * @param phrase phrase à analyser.
   * @param erreurs liste des erreurs.
   * @param verbeux faut-il être verbeux ?
   */
  private static testerSynonyme(actions: Action[], elementsGeneriques: ElementGenerique[], phrase: Phrase, erreurs: string[], verbeux: boolean) {
    let retVal = false;
    const result = ExprReg.xSynonymes.exec(phrase.phrase[0]);
    if (result !== null) {

      const synonymesBruts = result[1];
      const listeSynonymesBruts = PhraseUtils.separerListeIntitules(synonymesBruts);
      const originalBrut = result[2];

      // tester si l’original est un VERBE
      let resultatVerbe = ExprReg.xVerbeInfinitif.exec(originalBrut);
      // si l’original est un verbe
      if (resultatVerbe) {
        // retrouver les action liés à ce verbe
        let infinitif = resultatVerbe[1];
        let actionsTrouvees = actions.filter(x => x.infinitif === infinitif);
        if (actionsTrouvees.length !== 0) {
          // parcourir les synonymes
          listeSynonymesBruts.forEach(synonymeBrut => {
            // s’il s’agit d’un verbe, l’ajouter la liste des synonymes
            resultatVerbe = ExprReg.xVerbeInfinitif.exec(synonymeBrut);
            if (resultatVerbe) {
              let synonyme = resultatVerbe[1];
              // parcourir les actions trouvées
              actionsTrouvees.forEach(action => {
                // ajouter le synonyme à l’action
                action.synonymes.push(synonyme);
              });
              retVal = true;
            } else {
              erreurs.push(("0000" + phrase.ligne).slice(-5) + " : synonymes d’une action : le synonyme n’est pas un verbe : " + synonymeBrut);
            }
          });
        } else {
          erreurs.push(("0000" + phrase.ligne).slice(-5) + " : synonymes d’une action : action originale pas trouvée : " + infinitif);
        }
      } else {
        // tester si l’original est un GROUPE NOMINAL
        let resultatGn = ExprReg.xGroupeNominal.exec(originalBrut);
        if (resultatGn) {
          let determinant = resultatGn[1] ? resultatGn[1] : null;
          let nom = resultatGn[2];
          let epithete = resultatGn[3] ? resultatGn[3] : null;
          // retrouver l’élément générique correspondant
          let nomLower = nom.toLowerCase();
          let epiLower = epithete?.toLowerCase();
          const elementsTrouves = elementsGeneriques.filter(x => x.nom.toLowerCase() == nomLower && x.epithete?.toLowerCase() == epiLower);
          // 1 élément trouvé
          if (elementsTrouves.length === 1) {
            let elementTrouve = elementsTrouves[0];
            listeSynonymesBruts.forEach(synonymeBrut => {
              // s’il s’agit d’un verbe, l’ajouter la liste des synonymes
              resultatGn = ExprReg.xGroupeNominal.exec(synonymeBrut);
              if (resultatGn) {
                determinant = resultatGn[1] ? resultatGn[1] : null;
                nom = resultatGn[2];
                epithete = resultatGn[3] ? resultatGn[3] : null;
                const synonyme = new GroupeNominal(determinant, nom, epithete);
                // ajouter le synonyme à l’élément
                elementTrouve.synonymes.push(synonyme);
              } else {
                erreurs.push(("0000" + phrase.ligne).slice(-5) + " : synonymes d’un élément du jeu : le synonyme n’est pas un groupe nominal : " + synonymeBrut);
              }
            });
            retVal = true;

            // AUCUN élément trouvé
          } else if (elementsTrouves.length === 0) {
            erreurs.push(("0000" + phrase.ligne).slice(-5) + " : synonymes d’un élément du jeu : élément original pas trouvé : " + originalBrut);
            // PLUSIEURS éléments trouvés
          } else {
            erreurs.push(("0000" + phrase.ligne).slice(-5) + " : synonymes d’un élément du jeu : plusieurs éléments trouvés pour : " + originalBrut);
          }
        }
      }
    }
    return retVal;
  }

  /**
   * Rechercher une description d’action
   * @param actions actions déjà trouvées.
   * @param phrase phrase à analyser.
   * @param erreurs liste des erreurs.
   */
  private static testerAction(actions: Action[], phrase: Phrase, erreurs: string[], verbeux: boolean) {
    const result = ExprReg.xAction.exec(phrase.phrase[0]);
    if (result !== null) {
      const verbe = result[1].toLocaleLowerCase();
      const ceci = result[3] === 'ceci';
      const cela = result[5] === 'cela';
      let action = new Action(verbe, ceci, cela);
      // concerne un élément ?
      if (ceci) {
        action.cibleCeci = new GroupeNominal(result[6], result[7], result[8]);
        // concerne également un 2e élément ?
        if (cela) {
          if (result[6] === 'deux') {
            action.cibleCela = new GroupeNominal(result[6], result[7], result[8]);
          } else {
            action.cibleCela = new GroupeNominal(result[9], result[10], result[11]);
          }
        }
      }
      actions.push(action);
      return action; // nouvelle action

    } else {
      let resultDescriptionAction = ExprReg.xDescriptionAction.exec(phrase.phrase[0]);
      if (resultDescriptionAction) {
        const motCle = resultDescriptionAction[1].toLocaleLowerCase();
        const verbe = resultDescriptionAction[2].toLocaleLowerCase();
        const ceci = resultDescriptionAction[3] === 'ceci';
        const cela = resultDescriptionAction[4] === 'cela';
        let complement = resultDescriptionAction[5];
        // si phrase morcelée, rassembler les morceaux
        if (phrase.phrase.length > 1) {
          for (let index = 1; index < phrase.phrase.length; index++) {
            complement += phrase.phrase[index];
          }
        }
        complement = complement.trim();
        // retrouver l'action correspondante
        let action = actions.find(x => x.infinitif === verbe && x.ceci == ceci && x.cela == cela);
        // déterminer les instructions pour 'refuser', 'exécuter' ou 'terminer'
        if (action) {
          switch (motCle) {
            case 'refuser':
              action.verificationsBrutes = complement;
              action.verifications = Analyseur.testerRefuser(complement, phrase, erreurs);
              break;
            case 'exécuter':
              action.instructionsBrutes = complement;
              action.instructions = Analyseur.separerConsequences(complement, erreurs, phrase.ligne);
              break;
            case 'terminer':
              action.instructionsFinalesBrutes = complement;
              action.instructionsFinales = Analyseur.separerConsequences(complement, erreurs, phrase.ligne);
              break;

            default:
              console.error("xDescriptionAction >>> motCle pas gérée:", motCle);
              break;
          }

        } else {
          if (verbeux) {
            console.error("Action pas trouvée: verbe:", verbe, "ceci:", ceci, "cela:", cela);
          }
          erreurs.push(("0000" + phrase.ligne).slice(-5) + " : action pas trouvée : " + phrase.phrase);
        }
        return action; // action existante mise à jour avec nouvelle description.
      } else {
        const resultActionSimple = ExprReg.xActionSimple.exec(phrase.phrase[0]);
        // Trouvé action simple
        if (resultActionSimple) {

          const verbe = resultActionSimple[1].toLocaleLowerCase();
          const ceci = resultActionSimple[3] !== undefined;
          let complement = resultActionSimple[5];

          // si phrase morcelée, rassembler les morceaux
          if (phrase.phrase.length > 1) {
            for (let index = 1; index < phrase.phrase.length; index++) {
              complement += phrase.phrase[index];
            }
          }

          let action = new Action(verbe, ceci, false);
          if (ceci) {
            action.cibleCeci = new GroupeNominal(resultActionSimple[2], resultActionSimple[3], resultActionSimple[4]);
          }

          action.instructions = Analyseur.separerConsequences(complement, erreurs, phrase.ligne);

          actions.push(action);
          return action; // trouvé action simple
        } else {
          return null; // rien trouvé
        }
      }
    }
    // }
  }

  // Élement simple non positionné
  private static testerElementSimple(dictionnaire: Map<string, Definition>, elementsGeneriques: ElementGenerique[], phrase: Phrase, verbeux: boolean): ElementGenerique {
    let nouvelElementGenerique: ElementGenerique = null;
    let elementConcerne: ElementGenerique = null;

    let determinant: string;
    let nom: string;
    let epithete: string;
    let intituleClasse: string;
    let genre: Genre;
    let attributsString: string;
    let attributs: string[];
    let nombre: Nombre;
    let quantite: number;
    let position: PositionSujetString;

    // élément générique simple avec type d'élément (ex: le champignon est un décor)
    let result = ExprReg.xDefinitionTypeElement.exec(phrase.phrase[0]);
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
      intituleClasse = ClasseUtils.getClasseIntitule(result[5]);
      genre = MotUtils.getGenre(result[1], estFeminin);
      nombre = MotUtils.getNombre(result[1]);
      quantite = MotUtils.getQuantite(result[1]);
      attributsString = result[6];
      attributs = PhraseUtils.separerListeIntitules(attributsString);
      position = null;

      Analyseur.addOrUpdDefinition(dictionnaire, nom, nombre, intituleClasse, attributs);

      nouvelElementGenerique = new ElementGenerique(
        determinant,
        nom,
        epithete,
        intituleClasse,
        null,
        position,
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
      result = ExprReg.xElementSimpleAttribut.exec(phrase.phrase[0]);
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
          attributs = PhraseUtils.separerListeIntitules(result[5]);
        }

        nouvelElementGenerique = new ElementGenerique(
          result[1] ? result[1].toLowerCase() : null,
          result[2],
          result[3],
          EClasseRacine.objet,
          null,
          null,
          MotUtils.getGenre(result[1], estFeminin),
          MotUtils.getNombre(result[1]),
          MotUtils.getQuantite(result[1]),
          (attributs ? attributs : new Array<string>()),
        );

        if (autreForme) {
          if (nouvelElementGenerique.nombre == Nombre.s) {
            nouvelElementGenerique.nomP = autreForme;
          } else {
            nouvelElementGenerique.nomS = autreForme;
          }
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
      const filtered = elementsGeneriques.filter(x => x.nom.toLowerCase() == nomLower && x.epithete?.toLowerCase() == epiLower);

      if (filtered.length > 0) {
        // mettre à jour l'élément existant le plus récent.
        let elementGeneriqueTrouve = filtered[filtered.length - 1];
        // l’élément concerné est en fait l’élément retrouvé
        elementConcerne = elementGeneriqueTrouve;

        // - type d'élément
        if (nouvelElementGenerique.classeIntitule !== EClasseRacine.objet) {
          // s'il y avait déjà un type défini, c'est un autre élément donc finalement on va quand même l’ajouter
          if (elementGeneriqueTrouve.classeIntitule !== EClasseRacine.objet) {
            elementsGeneriques.push(nouvelElementGenerique);
            // finalement c’est le nouvel élément qui est concerné
            elementConcerne = nouvelElementGenerique;
          } else {
            // sinon, mettre à jour le type de l’élément retrouvé
            elementGeneriqueTrouve.classeIntitule = nouvelElementGenerique.classeIntitule;
          }
        }
        // - attributs

        if (verbeux) {
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
        elementsGeneriques.push(nouvelElementGenerique);
      }
    }
    return elementConcerne;
  }

  private static testerRefuser(complement: string, phrase: Phrase, erreurs: string[]) {
    let verification: Verification[] = [];

    // séparer les conditions avec le ";"
    const conditions = complement.split(';');

    conditions.forEach(cond => {
      let result = ExprReg.rRefuser.exec(cond.trim());
      if (result) {
        const typeRefuser = result[1]; // si uniquement pour l'instant
        const condition = PhraseUtils.getCondition(result[2]);
        if (!condition) {
          erreurs.push(("00000" + phrase.ligne).slice(-5) + " : condition : " + result[2]);
        }
        const consequences = Analyseur.separerConsequences(result[3], erreurs, phrase.ligne);
        verification.push(new Verification([condition], consequences));
      } else {
        console.error("testerRefuser: format pas reconu:", cond);
        erreurs.push(("00000" + phrase.ligne).slice(-5) + " : refuser : " + cond);
      }
    });

    return verification;
  }

  private static addOrUpdDefinition(dictionnaire: Map<string, Definition>, intitule: string, nombre: Nombre, typeParent: string, attributs: string[]) {
    // mise à jour
    if (dictionnaire.has(intitule)) {
      let found = dictionnaire.get(intitule);
      found.typeParent = typeParent;
      found.attributs.concat(attributs);
      // ajout
    } else {
      const definition = new Definition(intitule, typeParent, nombre, attributs);
      dictionnaire.set(intitule, definition)
    }
  }


  public static separerConsequences(consequencesBrutes: string, erreurs: string[], ligne: number, regle: Regle = null, reaction: Reaction = null, el: ElementGenerique = null) {

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
            const condition = PhraseUtils.getCondition(resultSiCondCons[1]);
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
              Analyseur.afficherErreurBloc("Un si rapide (,) ne peut pas avoir un autre si pour conséquence.", erreurs, regle, reaction, el, ligne);
              // UN BLOC EST COMMENCÉ
            } else if (indexBlocCondCommence != -1) {
              // console.log("prochainSiEstSinonSi=", prochainSiEstSinonSi);

              // >>> CAS SINONSI (sinon si)
              if (prochainSiEstSinonSi) {
                if (dansBlocSinon[indexBlocCondCommence]) {
                  Analyseur.afficherErreurBloc("Un sinonsi peut suivre un si ou un autre sinonsi mais pas un sinon car le sinon doit être le dernier cas.", erreurs, regle, reaction, el, ligne);
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
                Analyseur.afficherErreurBloc("sinonsi orphelin.", erreurs, regle, reaction, el, ligne);

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
                Analyseur.afficherErreurBloc("sinon orphelin.", erreurs, regle, reaction, el, ligne);
              }

              // CAS C > FIN SI
            } else if (conBruNettoyee.trim().toLowerCase() == 'fin si' || conBruNettoyee.trim().toLowerCase() == 'finsi') {

              // si pas de si ouvert, erreur
              if (indexBlocCondCommence < 0) {
                Analyseur.afficherErreurBloc("fin si orphelin.", erreurs, regle, reaction, el, ligne);
                // si bloc conditionnel ouvert => le fermer
              } else {
                indexBlocCondCommence -= 1;
                blocsSiEnCours.pop();
                blocsSinonEnCours.pop();
                dansBlocSinon.pop();
              }

              // CAS D > RIEN TROUVÉ
            } else {
              Analyseur.afficherErreurBloc(("pas compris: « " + conBruNettoyee + " »"), erreurs, regle, reaction, el, ligne);
            }
          }
        } // fin analyse de l’instruction
      } // fin test instruction vide
    } // fin parcours des instructions

    if (indexBlocCondCommence != -1) {
      Analyseur.afficherErreurBloc("fin si manquant (" + (indexBlocCondCommence + 1) + ").", erreurs, regle, reaction, el, ligne);
    }

    // console.warn("@@@@ separerConsequences:\nconsequencesBrutes=", consequencesBrutes, "\ninstructions=", instructionsPrincipales);

    return instructionsPrincipales;
  }

  private static afficherErreurBloc(message, erreurs: string[], regle: Regle, reaction: Reaction, el: ElementGenerique, ligne: number) {
    console.error("separerConsequences > " + message);
    if (ligne > 0) {
      erreurs.push(("00000" + ligne).slice(-5) + " : conséquence : " + message);
    } else if (regle) {
      let ev = regle.evenements[0];
      erreurs.push("règle « " + Regle.regleIntitule(regle) + " » : " + message);
    } else if (reaction) {
      erreurs.push("élément « " + ElementGenerique.elIntitule(el) + " » : réaction « " + Reaction.reactionIntitule(reaction) + " » : " + message);
    } else {
      erreurs.push("----- : conséquence : " + message);
    }
  }

}