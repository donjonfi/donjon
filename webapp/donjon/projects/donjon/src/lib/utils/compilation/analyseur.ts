import { Action } from '../../models/compilateur/action';
import { Aide } from '../../models/commun/aide';
import { Capacite } from '../../models/commun/capacite';
import { ClasseUtils } from '../commun/classe-utils';
import { Condition } from '../../models/compilateur/condition';
import { Definition } from '../../models/compilateur/definition';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementGenerique } from '../../models/compilateur/element-generique';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Evenement } from '../../models/jouer/evenement';
import { ExprReg } from './expr-reg';
import { Genre } from '../../models/commun/genre.enum';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Instruction } from '../../models/compilateur/instruction';
import { Monde } from '../../models/compilateur/monde';
import { MotUtils } from '../commun/mot-utils';
import { Nombre } from '../../models/commun/nombre.enum';
import { Phrase } from '../../models/compilateur/phrase';
import { PhraseUtils } from '../commun/phrase-utils';
import { PositionSujetString } from '../../models/compilateur/position-sujet';
import { Propriete } from '../../models/commun/propriete';
import { Reaction } from '../../models/compilateur/reaction';
import { Regle } from '../../models/compilateur/regle';
import { StringUtils } from '../commun/string.utils';
import { TypeRegle } from '../../models/compilateur/type-regle';
import { TypeValeur } from '../../models/compilateur/type-valeur';
import { Verification } from '../../models/compilateur/verification';

export class Analyseur {


  public static analyserPhrases(phrases: Phrase[], monde: Monde, elementsGeneriques: ElementGenerique[], regles: Regle[], actions: Action[], aides: Aide[], typesUtilisateur: Map<string, Definition>, erreurs: string[], verbeux: boolean) {

    let dernierePropriete: Propriete = null;
    let derniereReaction: Reaction = null;
    let dernierElementGenerique: ElementGenerique = null;
    let result: RegExpExecArray;

    phrases.forEach(phrase => {

      // 1) COMMENTAIRE
      if (phrase.commentaire) {
        // le commentaire se rapporte au dernier sujet
        console.error("Commentaire pas attaché :", phrase.phrase[0]);
        erreurs.push("Commentaire orphelin:", phrase.phrase[0])
        phrase.traitee = true;
        // 2) CODE DESCRIPTIF OU REGLE
      } else {

        if (verbeux) {
          console.log("Analyse: ", phrase);
        }

        // 0 - SI PREMIER CARACTÈRE EST UN TIRET (-), NE PAS INTERPRÉTER
        if (phrase.phrase[0].slice(0, 2) === "--") {
          phrase.traitee = true;
          if (verbeux) {
            console.log("=> commentaire");
          }
        } else {

          let elementGeneriqueTrouve = false;
          let regleTrouvee: Regle = null;
          let synonymeTrouve = false;
          let actionTrouvee: Action = null;
          let proprieteTrouvee = false;
          let reactionTrouvee = false;
          let sectionTrouvee = false;
          let trouveQuelqueChose = false;

          // ===============================================
          // SECTIONS (parties, chapitres, ...)
          // ===============================================
          const section = ExprReg.xSection.exec(phrase.phrase[0]);
          if (section) {
            trouveQuelqueChose = true;
          }

          // ===============================================
          // AIDE
          // ===============================================
          if (!trouveQuelqueChose) {
            const aide = ExprReg.xAide.exec(phrase.phrase[0]);
            if (aide) {
              trouveQuelqueChose = true;
              aides.push(
                new Aide(aide[1],
                  phrase.phrase[1]
                    .replace(ExprReg.xCaractereDebutCommentaire, '')
                    .replace(ExprReg.xCaractereFinCommentaire, '')
                    .replace(ExprReg.xCaractereRetourLigne, '\n')
                    .replace(ExprReg.xCaracterePointVirgule, ';')
                    .replace(ExprReg.xCaractereVirgule, ',')
                )
              );
            }
          }
          // ===============================================
          // RÈGLES
          // ===============================================
          if (!trouveQuelqueChose) {
            regleTrouvee = Analyseur.testerRegle(regles, phrase, erreurs);
            trouveQuelqueChose = regleTrouvee !== null;
          }
          // ===============================================
          // SYNONYMES
          // ===============================================
          if (!trouveQuelqueChose) {
            trouveQuelqueChose = synonymeTrouve = Analyseur.testerSynonyme(actions, elementsGeneriques, phrase, erreurs, verbeux)
          }
          // ===============================================
          // ACTIONS
          // ===============================================
          if (!trouveQuelqueChose) {
            actionTrouvee = Analyseur.testerAction(actions, phrase, erreurs, verbeux);
            trouveQuelqueChose = actionTrouvee !== null;
          }

          // ===============================================
          // MONDE
          // ===============================================
          if (!trouveQuelqueChose) {
            // on part du principe qu’on va trouver quelque chosee, sinon on le mettra à faux.
            elementGeneriqueTrouve = true;
            trouveQuelqueChose = true;
            // 1 - TESTER NOUVEL ÉLÉMENT / ÉLÉMENT EXISTANT AVEC POSITION
            let elementConcerne = Analyseur.testerPosition(elementsGeneriques, phrase);
            if (elementConcerne) {
              dernierElementGenerique = elementConcerne;
              if (verbeux) {
                console.log("=> trouvé testerPosition:", dernierElementGenerique);
              }
            } else {
              // 2 - TESTER NOUVEL ÉLÉMENT / ÉLÉMENT EXISTANT SANS POSITION
              elementConcerne = Analyseur.testerElementSimple(typesUtilisateur, elementsGeneriques, phrase, verbeux);
              if (elementConcerne) {
                dernierElementGenerique = elementConcerne;
                if (verbeux) {
                  console.log("=> trouvé testerElementSimple:", dernierElementGenerique);
                }
              } else {
                // 3 - TESTER LES INFORMATIONS SE RAPPORTANT AU DERNIER ÉLÉMENT
                // pronom démonstratif
                result = ExprReg.xPronomDemonstratif.exec(phrase.phrase[0]);
                if (result !== null) {
                  // définir type de l'élément précédent
                  if (result[2] && result[2].trim() !== '') {
                    dernierElementGenerique.classeIntitule = ClasseUtils.getClasseIntitule(result[2]);
                  }
                  // attributs de l'élément précédent
                  if (result[3] && result[3].trim() !== '') {
                    dernierElementGenerique.attributs.push(result[3]);
                  }
                  if (verbeux) {
                    console.log("=> trouvé xPronomDemonstratif:", dernierElementGenerique);
                  }
                } else {
                  // pronom personnel position
                  result = ExprReg.xPronomPersonnelPosition.exec(phrase.phrase[0]);
                  if (result !== null) {
                    // genre de l'élément précédent
                    dernierElementGenerique.genre = MotUtils.getGenre(phrase.phrase[0].split(" ")[0], null);
                    // attributs de l'élément précédent
                    dernierElementGenerique.positionString = new PositionSujetString(dernierElementGenerique.nom, result[2], result[1]);
                    if (verbeux) {
                      console.log("=> trouvé xPronomPersonnelPosition:", dernierElementGenerique);
                    }
                  } else {
                    // pronom personnel attributs
                    result = ExprReg.xPronomPersonnelAttribut.exec(phrase.phrase[0]);
                    if (result !== null) {
                      // attributs de l'élément précédent
                      if (result[1] && result[1].trim() !== '') {
                        // découper les attributs
                        const attributs = PhraseUtils.separerListeIntitules(result[1]);
                        dernierElementGenerique.attributs = dernierElementGenerique.attributs.concat(attributs);
                      }
                      // genre de l'élément précédent
                      dernierElementGenerique.genre = MotUtils.getGenre(phrase.phrase[0].split(" ")[0], null);

                      if (verbeux) {
                        console.log("=> trouvé xPronomPersonnelAttribut:", dernierElementGenerique);
                      }
                    } else {
                      // TESTER ATTRIBUT/PROPRIÉTÉ/RÉACTION
                      // **********************************
                      result = ExprReg.xAttribut.exec(phrase.phrase[0]);
                      if (result) {

                        let elementCible: ElementGenerique = null;
                        let nomProprieteCible: string = null;
                        // cas 1 (son/sa xxx[1] est)
                        if (result[1]) {
                          elementCible = dernierElementGenerique;
                          nomProprieteCible = result[1];
                          // cas 2 (la xxx[2] de yyy[3] est)
                        } else {
                          nomProprieteCible = result[2];
                          const elementConcerneBrut = result[3];
                          const elementConcerneIntitule = ExprReg.xGroupeNominal.exec(result[3]);
                          if (elementConcerneIntitule) {
                            const elementConcerneNom = elementConcerneIntitule[2];
                            const elementConcerneEpithete = elementConcerneIntitule[3] ? elementConcerneIntitule[3] : null;
                            // retrouver l’élément générique concerné
                            let elementsTrouves = elementsGeneriques.filter(x => x.nom === elementConcerneNom);
                            if (elementConcerneEpithete) {
                              elementsTrouves = elementsGeneriques.filter(x => x.epithete === elementConcerneEpithete);
                            }
                            if (elementsTrouves.length === 1) {
                              elementCible = elementsTrouves[0];
                            } else {
                              console.warn("xAttribut: Pas trouvé le complément:", elementConcerneBrut);
                            }
                          } else {
                            erreurs.push(("00000" + phrase.ligne).slice(-5) + " : l’élément concerné doit être un groupe nominal: " + elementConcerneBrut);
                          }
                        }

                        // si on a trouvé l’élément cible, lui attribuer la réaction ou la propriété
                        if (elementCible) {

                          // RÉACTION
                          if (nomProprieteCible === ("réaction")) {
                            // on a trouvée une réaction et non un élément générique
                            reactionTrouvee = true;
                            elementGeneriqueTrouve = false;
                            // - RETROUVER LA LISTE DES SUJETS
                            const listeSujets = Analyseur.retrouverSujets(result[5], erreurs, phrase);
                            // s’il s’agit du sujet par défaut (aucun sujet)
                            if (listeSujets.length === 0) {
                              listeSujets.push(new GroupeNominal(null, "aucun", "sujet"));
                            }
                            // - RETROUVER LES INSTRUCTIONS
                            const instructionsBrutes = Analyseur.retrouverInstructionsBrutes(result[7], erreurs, phrase);
                            // AJOUTER LA RÉACTION
                            derniereReaction = new Reaction(listeSujets, instructionsBrutes, null);
                            // retrouver l’objet qui réagit et lui ajouter la réaction
                            elementCible.reactions.push(derniereReaction);
                            if (verbeux) {
                              console.log("=> trouvé xAttribut réaction:", elementCible);
                            }
                            // PROPRIÉTÉ
                          } else {
                            proprieteTrouvee = true;
                            dernierePropriete = new Propriete(nomProprieteCible, (result[6] === 'vaut' ? TypeValeur.nombre : TypeValeur.mots), result[7]);
                            // ajouter la propriété au dernier élément
                            elementCible.proprietes.push(dernierePropriete);
                            if (verbeux) {
                              console.log("=> trouvé xAttribut propriété:", elementCible);
                            }
                          }

                        }
                        // TESTER CAPACITÉ
                        // ***************
                      } else {
                        result = ExprReg.xCapacite.exec(phrase.phrase[0]);

                        if (result) {
                          const capacite = new Capacite(result[1], (result[2] ? result[2].trim() : null));
                          // ajouter la capacité au dernier élément
                          dernierElementGenerique.capacites.push(capacite);
                          if (verbeux) {
                            console.log("=> trouvé pour xCapacite:", dernierElementGenerique);
                          }
                        } else {
                          // AUCUN DES TESTS N’A PERMIS DE COMPRENDRE CETTE PHRASE
                          // *****************************************************
                          elementGeneriqueTrouve = false;
                          trouveQuelqueChose = false;
                          erreurs.push(("00000" + phrase.ligne).slice(-5) + " : " + phrase.phrase);
                          if (verbeux) {
                            console.warn("=> PAS trouvé de signification.");
                          }
                        }
                      }
                    }
                  }

                }
              }
            }
          } // fin test monde

          // ===============================================
          // IMPORT D’UN AUTRE FICHIER DE CODE
          // ===============================================
          if (!trouveQuelqueChose) {

          } // fin test import

          // ===============================================
          // FINALISATION
          // ===============================================
          // si on a trouvé est un élément générique
          if (elementGeneriqueTrouve) {
            // si phrase en plusieurs morceaux, ajouter commentaire qui suit.
            if (phrase.phrase.length > 1) {
              // si le dernier élément trouvé est une propriété, il s'agit de
              // la valeur de cette propriété
              if (proprieteTrouvee) {
                // ajouter la valeur en enlevant les caractères spéciaux
                dernierePropriete.valeur = phrase.phrase[1]
                  .replace(ExprReg.xCaractereDebutCommentaire, '')
                  .replace(ExprReg.xCaractereFinCommentaire, '')
                  .replace(ExprReg.xCaractereRetourLigne, '\n')
                  .replace(ExprReg.xCaracterePointVirgule, ';')
                  .replace(ExprReg.xCaractereVirgule, ',');


                // si dernier élémént trouvé est une réaction, il s’agit de
                // la valeur de cette réaction (dire).
              } else if (reactionTrouvee) {


                // sinon c’est la description du dernier élément
              } else {
                // ajouter la description en enlevant les caractères spéciaux
                dernierElementGenerique.description = phrase.phrase[1]
                  .replace(ExprReg.xCaractereDebutCommentaire, '')
                  .replace(ExprReg.xCaractereFinCommentaire, '')
                  .replace(ExprReg.xCaractereRetourLigne, '\n')
                  .replace(ExprReg.xCaracterePointVirgule, ';')
                  .replace(ExprReg.xCaractereVirgule, ',');
              }
            }
            // si on a trouvé une réaction (réponse à une conversation)
          } else if (reactionTrouvee) {
            if (verbeux) {
              console.log("=> trouvé Réaction:", reactionTrouvee);
            }
            // si on a trouvé une règle
          } else if (regleTrouvee) {
            if (verbeux) {
              console.log("=> trouvé Règle:", regleTrouvee);
            }
          } else if (actionTrouvee) {
            if (verbeux) {
              console.log("=> trouvé Action:", actionTrouvee);
            }
          } else if (synonymeTrouve) {
            if (verbeux) {
              console.log("=> trouvé synonyme(s)");
            }
          }

        } // fin analyse phrase != commentaire
      } // fin analyse de la phrase
    });
  }

  private static testerRegle(regles: Regle[], phrase: Phrase, erreurs: string[]) {
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
            erreurs.push(("00000" + phrase.ligne).slice(-5) + " : évènement(s) : " + resultRegle[2]);
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
          erreurs.push(("00000" + phrase.ligne).slice(-5) + " : type règle : " + resultRegle[2]);
          console.error("tester regle: opérateur inconnu:", resultRegle[1]);
          typeRegle = TypeRegle.inconnu;
          break;
      }

      // evenements.forEach(evenement => {
      let nouvelleRegle = new Regle(typeRegle, condition, evenements, commande, resultRegle[3]);
      // });

      regles.push(nouvelleRegle);

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
        // TODO: épithète
        new PositionSujetString(result[2], result[8], result[7]),
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

        position = new PositionSujetString(result[2], result[10], result[9]);

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
      const filtered = elementsGeneriques.filter(x => x.nom === newElementGenerique.nom);
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
          let ephitete = resultatGn[3] ? resultatGn[3] : null;
          // retrouver l’élément générique correspondant
          let elementsTrouves = elementsGeneriques.filter(x => x.nom === nom);
          if (ephitete) {
            elementsTrouves = elementsTrouves.filter(x => x.epithete === ephitete);
          }
          // 1 élément trouvé
          if (elementsTrouves.length === 1) {
            let elementTrouve = elementsTrouves[0];
            listeSynonymesBruts.forEach(synonymeBrut => {
              // s’il s’agit d’un verbe, l’ajouter la liste des synonymes
              resultatGn = ExprReg.xGroupeNominal.exec(synonymeBrut);
              if (resultatGn) {
                determinant = resultatGn[1] ? resultatGn[1] : null;
                nom = resultatGn[2];
                ephitete = resultatGn[3] ? resultatGn[3] : null;
                const synonyme = new GroupeNominal(determinant, nom, ephitete);
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
              action.instructions = Analyseur.separerConsequences(complement, erreurs, false);
              break;
            case 'terminer':
              action.instructionsFinalesBrutes = complement;
              action.instructionsFinales = Analyseur.separerConsequences(complement, erreurs, false);
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

          action.instructions = Analyseur.separerConsequences(complement, erreurs, false);

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
        if (result[6] && result[6].trim() !== '') {
          // découper les attributs qui sont séparés par des ', ' ou ' et '
          attributs = PhraseUtils.separerListeIntitules(result[6]);
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
      const filtered = elementsGeneriques.filter(x => x.nom === nouvelElementGenerique.nom);
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
          elementGeneriqueTrouve.attributs = elementGeneriqueTrouve.attributs.concat(nouvelElementGenerique.attributs);
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
        const consequences = Analyseur.separerConsequences(result[3], erreurs, false);
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


  public static separerConsequences(consequencesBrutes: string, erreurs: string[], sousConsequences: boolean) {

    // les conséquences sont séparées par des ";"
    // les sous-conséquences sont séparées par des ","
    const listeConsequences = consequencesBrutes.split((sousConsequences ? ',' : ';'));

    let instructions: Instruction[] = [];
    listeConsequences.forEach(curConsequence => {
      let conBruNettoyee = curConsequence
        .trim()
        // convertir marque commentaire
        .replace(ExprReg.xCaractereDebutCommentaire, ' "')
        .replace(ExprReg.xCaractereFinCommentaire, '" ')
        // enlever les espaces multiples
        .replace(/( +)/g, " ");
      // enlever le point final (ou le ; final pour les sous-conséquences)
      if (conBruNettoyee.endsWith((sousConsequences ? ';' : '.'))) {
        conBruNettoyee = conBruNettoyee.slice(0, conBruNettoyee.length - 1);
      }

      const els = PhraseUtils.decomposerInstruction(conBruNettoyee);
      // cas A: INSTRUCTION SIMPLE
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
            // // remettre les , et les ; initiaux dans les instructions
            // .replace(ExprReg.xCaracterePointVirgule, ';')
            // .replace(ExprReg.xCaractereVirgule, ',');
          }

          // // retirer le \n initial éventuel
          // if (els.complement1.startsWith(ExprReg.caractereRetourLigne)) {
          //   els.complement1 = els.complement1.substr(1);
          // }
          // // retirer le \n final éventuel
          // if (els.complement1.length > 1 && els.complement1.endsWith(ExprReg.caractereRetourLigne)) {
          //   els.complement1 = els.complement1.substr(0, els.complement1.length - 2);
          // }
        }

        instructions.push(new Instruction(els));
        // cas B: INSTRUCTION CONDITIONNELLE
      } else {

        let resultSiCondCons = ExprReg.xSeparerSiConditionConsequences.exec(conBruNettoyee);

        // cas B.1 => SI
        if (resultSiCondCons && !sousConsequences) {
          const condition = PhraseUtils.getCondition(resultSiCondCons[1]);
          const consequences = Analyseur.separerConsequences(resultSiCondCons[2], erreurs, true);

          instructions.push(new Instruction(null, condition, consequences, null));

          // pas de si trouvé
        } else {
          // cas B.2 => SINON
          let resultSinonCondCons = ExprReg.xSeparerSinonConsequences.exec(conBruNettoyee);
          if (resultSinonCondCons && !sousConsequences) {

            const consequences = Analyseur.separerConsequences(resultSinonCondCons[2], erreurs, true);

            // récupérer la dernière instruction et remplir le sinon
            let precInstruction = instructions.pop();

            if (precInstruction && precInstruction.condition) {
              precInstruction.instructionsSiConditionPasVerifiee = consequences;
              instructions.push(precInstruction);
            } else {
              console.error("« sinon » orphelin : " + conBruNettoyee);
              erreurs.push("« sinon » orphelin : " + conBruNettoyee);
            }
            // cas C => RIEN TROUVÉ
          } else {
            console.error("separerConsequences > RIEN TROUVÉ resultSiCondCons= ", resultSiCondCons, "sousConsequences=", sousConsequences);
            erreurs.push("conséquence : " + conBruNettoyee);
          }
        }
      }
    });
    return instructions;
  }


}