import { EClasseRacine, EEtatsBase } from '../../models/commun/constantes';
import { ELocalisation, Localisation } from '../../models/jeu/localisation';
import { ElementsJeuUtils, TypeSujet } from '../commun/elements-jeu-utils';

import { AleatoireUtils } from './aleatoire-utils';
import { AnalyseurCondition } from '../compilation/analyseur/analyseur.condition';
import { ClasseUtils } from '../commun/classe-utils';
import { ClassesRacines } from '../../models/commun/classes-racines';
import { Compteur } from '../../models/compilateur/compteur';
import { CompteursUtils } from './compteurs-utils';
import { ConditionMulti } from '../../models/compilateur/condition-multi';
import { ConditionSolo } from '../../models/compilateur/condition-solo';
import { ContexteTour } from '../../models/jouer/contexte-tour';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { Evenement } from '../../models/jouer/evenement';
import { ExprReg } from '../compilation/expr-reg';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { InstructionsUtils } from './instructions-utils';
import { Intitule } from '../../models/jeu/intitule';
import { Jeu } from '../../models/jeu/jeu';
import { LienCondition } from '../../models/compilateur/lien-condition';
import { Lieu } from '../../models/jeu/lieu';
import { Liste } from '../../models/jeu/liste';
import { Objet } from '../../models/jeu/objet';
import { PhraseUtils } from '../commun/phrase-utils';
import { RechercheUtils } from '../commun/recherche-utils';
import { TypeValeur } from '../../models/compilateur/type-valeur';

export class ConditionsUtils {

  constructor(
    private jeu: Jeu,
    private verbeux: boolean,
  ) {
    this.eju = new ElementsJeuUtils(jeu, verbeux);
  }

  /** Utilitaires - Éléments du jeu */
  private eju: ElementsJeuUtils;


  /** Vérifier la condition (multi) */
  siEstVrai(conditionBrute: string | undefined, conditionMulti: ConditionMulti | undefined, contexteTour: ContexteTour, evenement: Evenement | undefined, declenchements: number | undefined): boolean {

    let resultatFinal: boolean = false;

    // si condition toujours brute, récupérer la condition multi correspondante.
    if (!conditionMulti) {
      conditionMulti = AnalyseurCondition.getConditionMulti(conditionBrute);
    }

    // console.warn("conditionBrute: ", conditionBrute, "\nconditionMulti:", conditionMulti);


    // s’il s’agit d’une condition simple
    if (conditionMulti.condition) {
      resultatFinal = this.siEstVraiSansLien(null, conditionMulti.condition, contexteTour, evenement, declenchements);
      // sinon il s’agit d’une condition composée
    } else if (conditionMulti.sousConditions?.length) {
      switch (conditionMulti.typeLienSousConditions) {
        // A) ET
        case LienCondition.et:
          let toutVrai = true;
          for (let indexEt = 0; indexEt < conditionMulti.sousConditions.length; indexEt++) {
            if (!this.siEstVrai(null, conditionMulti.sousConditions[indexEt], contexteTour, evenement, declenchements)) {
              toutVrai = false;
              break;
            }
          }
          resultatFinal = toutVrai;
          break;

        // B) OU (ou inclusif)
        case LienCondition.ou:
          let unVrai = false;
          for (let indexOu = 0; indexOu < conditionMulti.sousConditions.length; indexOu++) {
            if (this.siEstVrai(null, conditionMulti.sousConditions[indexOu], contexteTour, evenement, declenchements)) {
              unVrai = true;
              break;
            }
          }
          resultatFinal = unVrai;
          break;

        // C) SOIT (ou exclusif)
        case LienCondition.soit:
          let nbVrai = 0;
          for (let indexSoit = 0; indexSoit < conditionMulti.sousConditions.length; indexSoit++) {
            if (this.siEstVrai(null, conditionMulti.sousConditions[indexSoit], contexteTour, evenement, declenchements)) {
              nbVrai += 1;
              if (nbVrai > 1) {
                break;
              }
            }
          }
          resultatFinal = (nbVrai === 1);
          break;

        default:
          console.error("siEstVrai > typeLien pas pris en charge (et|ou|soit sont pris en charge) > ", conditionMulti.typeLienSousConditions);
          break;
      }
    } else {
      console.error("siEstVrai > condition et/ou sous-conditions non trouvées");
    }

    if (this.verbeux) {
      if (conditionBrute) {
        console.log("🔀 « " + conditionBrute + " »\n => " + (resultatFinal ? "🙆‍♂️ " : "🙅 ") + resultatFinal + (contexteTour ? ("\nceci: " + contexteTour.ceci + "\ncela: " + contexteTour.cela) : ""));
      } else if (conditionMulti) {
        console.log("🔀 « " + conditionMulti.toString() + " »\n => " + (resultatFinal ? "🙆‍♂️ " : "🙅 ") + resultatFinal + (contexteTour ? ("\nceci: " + contexteTour.ceci + "\ncela: " + contexteTour.cela) : ""));
      } else {
        console.error("🔀 ni conditionBrute ni conditionMulti ici ! ")
      }
    }

    return resultatFinal;
  }


  private trouverSujetCondition(condition: ConditionSolo | undefined, contexteTour: ContexteTour, evenement: Evenement | undefined, declenchements: number | undefined): ElementJeu | Intitule | null {

    let sujet: ElementJeu | Intitule | null = null;

    const conditionSujetNomNettoye = RechercheUtils.transformerCaracteresSpeciauxEtMajuscules(condition.sujet.nom);

    if (condition.sujet) {
      // ici
      if (conditionSujetNomNettoye === 'ici') {
        sujet = this.eju.curLieu;
        // ceci
      } else if (conditionSujetNomNettoye === 'ceci') {
        sujet = contexteTour.ceci;
        if (!contexteTour.ceci) {
          console.warn("siEstVraiSansLien: le « ceci » de la condition est null.");
        }
        // cela
      } else if (conditionSujetNomNettoye === 'cela') {
        sujet = contexteTour.cela;
        if (!contexteTour.cela) {
          console.warn("siEstVraiSansLien: le « cela » de la condition est null.");
        }
        // quantitéCeci
      } else if (conditionSujetNomNettoye === RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('quantitéCeci')) {
        const cpt = new Compteur("quantitéCeci", evenement.quantiteCeci);
        sujet = cpt;
        if (!contexteTour.ceci) {
          console.warn("siEstVraiSansLien: quantitéCeci: le « ceci » de la condition est null.");
        }
        // quantitéCela
      } else if (conditionSujetNomNettoye === RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('quantitéCela')) {
        const cpt = new Compteur("quantitéCela", evenement.quantiteCela);
        sujet = cpt;
        if (!contexteTour.cela) {
          console.warn("siEstVraiSansLien: quantitéCela: le « cela » de la condition est null.");
        }
        // quantité de ceci
      } else if (conditionSujetNomNettoye === RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('quantité de ceci')) {
        if (!contexteTour.ceci || !ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.element)) {
          console.warn("siEstVraiSansLien: quantité de ceci: le « ceci » de la condition est null.");
        } else {
          const cpt = new Compteur("quantité de ceci", (contexteTour.ceci as ElementJeu).quantite);
          sujet = cpt;
        }
        // quantité de cela
      } else if (conditionSujetNomNettoye === RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('quantité de cela')) {
        if (!contexteTour.cela || !ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.element)) {
          console.warn("siEstVraiSansLien: quantité de cela: le « cela » de la condition n’est pas un élément.");
        } else {
          const cpt = new Compteur("quantité de cela", (contexteTour.cela as ElementJeu).quantite);
          sujet = cpt;
        }
        // préposition ceci
      } else if (condition.sujet.nom.match(/pr(?:é|e)position (?:de )?ceci/i)) {
        sujet = new Intitule(evenement.prepositionCeci, new GroupeNominal(null, evenement.prepositionCeci, null), ClassesRacines.Intitule);
        // préposition cela
      } else if (condition.sujet.nom.match(/pr(?:é|e)position (?:de )?cela/i)) {
        sujet = new Intitule(evenement.prepositionCela, new GroupeNominal(null, evenement.prepositionCela, null), ClassesRacines.Intitule);
        // origine
      } else if (conditionSujetNomNettoye === 'origine') {
        sujet = contexteTour.origine;
        if (!contexteTour.origine) {
          console.warn("siEstVraiSansLien: le « origine » de la condition est null.");
        }
        // origine
      } else if (conditionSujetNomNettoye === 'destination') {
        sujet = contexteTour.destination;
        if (!contexteTour.destination) {
          console.warn("siEstVraiSansLien: le « destination » de la condition est null.");
        }
        // orientation
      } else if (conditionSujetNomNettoye === 'orientation') {
        sujet = contexteTour.orientation;
        if (!contexteTour.orientation) {
          console.warn("siEstVraiSansLien: le « orientation » de la condition est null.");
        }
        // réponse (au dernier choisir)
      } else if (conditionSujetNomNettoye === RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('réponse')) {
        if (!contexteTour.reponse) {
          this.eju.ajouterConseil("Condition sur « réponse » : il n’y a pas de réponse pour ce tour de jeu.")
        } else {
          sujet = new Intitule(contexteTour.reponse.toString(), PhraseUtils.getGroupeNominalDefiniOuIndefini(contexteTour.reponse.toString(), false), ClassesRacines.Intitule);
        }
        // règle
      } else if (conditionSujetNomNettoye === RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('règle')) {
        if (!declenchements) {
          console.warn("siEstVraiSansLien: règle: il ne s’agit pas d’une règle (« déclenchements » pas défini).");
        } else {
          const cpt = new Compteur("déclenchements règle", declenchements);
          sujet = cpt;
        }
        // action (c’est à dire l’action liée à l’événement)
        // => infinitif
      } else if (conditionSujetNomNettoye.match(/infinitif (?:de l(?:'|’))?action/i)) {
        sujet = new Intitule(evenement.infinitif, new GroupeNominal(null, evenement.infinitif, null), ClassesRacines.Intitule);

        // sortie/obstacle/porte vers ceci/cela
      } else if (conditionSujetNomNettoye.match(/(sortie|obstacle|porte) vers/i)) {
        let locString: string = condition.sujet.epithete;
        if (condition.sujet.epithete == 'ceci') {
          locString = contexteTour.ceci.intitule.nom;
        } else if (condition.sujet.epithete == 'cela') {
          locString = contexteTour.cela.intitule.nom;
        }
        const loc = ElementsJeuUtils.trouverLocalisation(new GroupeNominal(null, locString));

        if (loc == null) {
          console.error("siEstVraiSansLien: sortie/porte vers '", sujet.intitule.nom, "': direction inconnue.");
          // regarder s'il y a une sortie dans la direction indiquée
        } else {
          // sortie vers
          if (conditionSujetNomNettoye.startsWith("sortie")) {
            const voisinID = this.eju.getVoisinDirectionID(loc, EClasseRacine.lieu);
            if (voisinID !== -1) {
              sujet = this.eju.getLieu(voisinID);
            }
            // porte vers
          } else if (conditionSujetNomNettoye.startsWith("porte")) {
            const porteID = this.eju.getVoisinDirectionID(loc, EClasseRacine.porte);
            if (porteID !== -1) {
              sujet = this.eju.getObjet(porteID);
            }
            // obstacle vers
          } else {
            const obstacleID = this.eju.getVoisinDirectionID(loc, EClasseRacine.obstacle);
            if (obstacleID !== -1) {
              sujet = this.eju.getObjet(obstacleID);
            }
          }
        }
        // horloge
      } else if ((ExprReg.oHorloge).test(conditionSujetNomNettoye)) {
        sujet = this.getValeurHorloge(conditionSujetNomNettoye, condition.verbe);
        // calendrier
      } else if ((ExprReg.oCalendrier).test(conditionSujetNomNettoye)) {
        sujet = this.getValeurCalendrier(conditionSujetNomNettoye, condition.verbe);
      } else {
        // chercher dans les valeurs
        const valeurTrouvee = contexteTour?.trouverValeur(condition.sujet.nomEpithete);

        // valeur
        if (valeurTrouvee) {

          switch (typeof valeurTrouvee) {
            // texte
            // TODO: texte plutôt que intitulé
            case 'string':
              sujet = new Intitule(valeurTrouvee, new GroupeNominal(null, valeurTrouvee, null), ClassesRacines.Intitule);
              break;

            // nombre
            case 'number':
              sujet = new Compteur('valeur', valeurTrouvee)
              break

            // intiutlé
            default:
              sujet = valeurTrouvee;
              break;
          }
          // pas une valeur
        } else {
          const correspondances = this.eju.trouverCorrespondance(condition.sujet, TypeSujet.SujetEstNom, false, false);
          if (correspondances.elements.length == 1) {
            sujet = correspondances.elements[0];
          } else if (correspondances.elements.length > 1 || correspondances.compteurs.length > 1) {
            console.error("siEstVraiSansLien >>> plusieurs éléments trouvés pour le sujet:", condition.sujet, condition, correspondances);
          } else if (correspondances.compteurs.length === 1) {
            sujet = correspondances.compteurs[0];
          } else if (correspondances.listes.length === 1) {
            sujet = correspondances.listes[0];
          } else {
            // chercher dans les propriétés
            const proprieteJeu = PhraseUtils.trouverPropriete(condition.sujet.toString());
            if (proprieteJeu) {
              const proprieteCible = InstructionsUtils.trouverProprieteCible(proprieteJeu, contexteTour, this.eju, this.jeu);
              if (proprieteCible instanceof Compteur) {
                sujet = proprieteCible;
              } else {
                if (proprieteCible.type == TypeValeur.nombre) {
                  sujet = CompteursUtils.proprieteElementVersCompteur(proprieteCible);
                } else {
                  sujet = new Intitule(proprieteCible.valeur, null, ClassesRacines.Intitule);
                }
              }
              // le jeu n’est pas dans les objets mais il est géré plus loin
            } else if (conditionSujetNomNettoye == 'jeu' && !condition.sujet.epithete) {
              // le tirage n'est pas un objet, mais il est géré plus loin
            } else if (conditionSujetNomNettoye == 'tirage' && !condition.sujet.epithete) {
              // rien à dire ici
            } else {
              console.error("siEstVraiSansLien >>> pas d’élément trouvé pour pour le sujet:", condition.sujet, condition, correspondances);
              contexteTour.ajouterErreurCondition(condition, `Sujet de la condition pas trouvé : ${condition.sujet}`);
            }
          }
        }
      }
    }
    return sujet;
  }

  /**
   * Tester si la condition est vraie.
   * Remarque: le LIEN (et/ou/soit) n'est PAS TESTÉ. La méthode siEstVraiAvecLiens le fait.
   */
  public siEstVraiSansLien(conditionString: string | undefined, condition: ConditionSolo | undefined, contexteTour: ContexteTour, evenement: Evenement | undefined, declenchements: number | undefined) {

    let retVal = false;
    // si condition toujours brute, récupérer la condition correspondante.
    if (!condition) {
      condition = AnalyseurCondition.getConditionMulti(conditionString)?.condition;
    }

    if (condition) {
      // 1 - Trouver le sujet
      // ++++++++++++++++++++
      let sujet = this.trouverSujetCondition(condition, contexteTour, evenement, declenchements);

      // *********************************************
      //  A. ÉLÉMENT DU JEU
      // *********************************************
      if (sujet && ClasseUtils.heriteDe(sujet.classe, EClasseRacine.element)) {

        // 2 - Trouver le verbe
        // ++++++++++++++++++++
        switch (condition.verbe) {
          // ÉTAT
          case 'est':
          case 'sont':
            // remarque: négation appliquée plus loin.
            if (condition.complement?.startsWith('défini')) {
              retVal = true;
            } else {
              // est une [classe] | est [état]
              // remarque: négation appliquée plus loin.
              retVal = this.verifierConditionEst(condition, (sujet as ElementJeu));
            }
            break;

          // CONTENU
          case 'contient':
          case 'contiennent':
          case 'inclut':
          case 'incluent':
            // remarque: négation appliquée plus loin.
            if (condition.sujetComplement &&
              condition.sujetComplement.determinant?.match(/un |des |d'|d’/i) &&
              condition.sujetComplement.nom.match(/objet(s)?/i)
            ) {
              retVal = this.eju.verifierContientObjet(sujet as ElementJeu);
            } else if (condition.sujetComplement && condition.sujetComplement.nom === 'aucun' && condition.sujetComplement.epithete?.match(/objet(s)?/i)) {
              retVal = !this.eju.verifierContientObjet(sujet as ElementJeu);
            } else {
              contexteTour.ajouterErreurCondition(condition, `siEstVraiSansLien > condition « contient » pas encore gérée pour le complément ${condition.complement}`)
            }
            break;


          // EXISTANCE
          // forme "aucun·e xxxx pour yyyy" ou "aucun·e xxx vers yyyy"
          // Ex: aucune description n’existe pour ceci. 
          // Ex: aucune sortie n’existe vers le nord.
          // Ex: un aperçu existe pour cela.
          case 'existe':
            retVal = this.verifierConditionExiste(condition, sujet, contexteTour, evenement, declenchements);
            break;

          // ÉLÉMENT POSSÉDÉ (PAR LE JOUEUR)
          case 'possède':
            if (sujet.nom === "joueur") {
              // vérifier si l’objet cible est possédé par le joueur
              // > remarque: négation appliquée plus loin.
              const objetCible = this.trouverObjetCible(condition.complement, condition.sujetComplement, contexteTour);
              if (objetCible) {
                retVal = this.jeu.etats.possedeEtatIdElement(objetCible, this.jeu.etats.possedeID);
              }
              break;
            } else {
              console.error("siEstVraiSansLien > condition « possède » prise en charge uniquement pour le joueur.");
            }
            break;


          // ÉLÉMENT PORTÉ (PAR LE JOUEUR)
          case 'porte':
            if (sujet.nom.toLowerCase() === "joueur") {
              // vérifier si l’objet cible est porté par le joueur
              // > remarque: négation appliquée plus loin.
              const objetCible = this.trouverObjetCible(condition.complement, condition.sujetComplement, contexteTour);
              if (objetCible) {
                retVal = this.jeu.etats.possedeEtatIdElement(objetCible, this.jeu.etats.porteID);
              }
              break;
            } else {
              console.error("siEstVraiSansLien > condition « porte » prise en charge uniquement pour le joueur.", sujet.nom);
            }
            break;

          // LOCALISATION
          case 'se trouve':
          case 'se trouvent':
            // retrouver la destination
            // remarque: négation appliquée plus loin.
            let destination: ElementJeu = null;

            const conditionSujetComplementNomNettoye = RechercheUtils.transformerCaracteresSpeciauxEtMajuscules(condition.sujetComplement?.nom);


            if (condition.sujetComplement?.nom === "ici") {
              destination = this.eju.curLieu;
            } else if (condition.sujetComplement?.nom === "ceci") {
              if (contexteTour.ceci && ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.lieu)) {
                destination = contexteTour.ceci as Lieu;
                // (la commande aller passe par ici avec une direction)
              } else if (!contexteTour.ceci || !ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.direction)) {
                console.error("siEstVraiSansLien > condition se trouve dans ceci: ceci n’est pas un lieu ceci=", contexteTour.ceci);
              }
            } else if (condition.sujetComplement?.nom === "cela") {
              if (contexteTour.cela && ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.lieu)) {
                destination = contexteTour.cela as Lieu;
                // (la commande aller passe par ici avec une direction)
              } else if (!contexteTour.cela || !ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.direction)) {
                console.error("siEstVraiSansLien > condition se trouve dans cela : cela n’est pas un lieu cela=", contexteTour.cela);
              }
              // origine
            } else if (conditionSujetComplementNomNettoye === 'origine') {
              destination = contexteTour.origine;
              if (!contexteTour.origine) {
                console.warn("siEstVraiSansLien: le « origine » de la condition est null.");
              }
              // destination
            } else if (conditionSujetComplementNomNettoye === 'destination') {
              destination = contexteTour.destination;
              if (!contexteTour.destination) {
                console.warn("siEstVraiSansLien: le « destination » de la condition est null.");
              }
              //   // orientation
              // } else if (conditionSujetComplementNomNettoye === 'orientation') {
              //   destination = contexteTour.orientation;
              //   if (!contexteTour.orientation) {
              //     console.warn("siEstVraiSansLien: le « orientation » de la condition est null.");
              //   }
            } else {
              const correspondances = this.eju.trouverCorrespondance(condition.sujetComplement, TypeSujet.SujetEstNom, false, false);
              if (correspondances.nbCor === 1) {
                destination = correspondances.elements[0];
              } else if (correspondances.nbCor === 0) {
                console.error("siEstVraiSansLien > condition se trouve: pas de correspondance trouvée pour dest=", condition.sujetComplement);
              } else if (correspondances.nbCor > 1) {
                console.error("siEstVraiSansLien > condition se trouve: plusieurs correspondances trouvées pour dest=", condition.sujetComplement, "cor=", correspondances);
              }
            }

            // si on a trouvé la cible et la destination
            // TODO: destination pourrait être un objet ou une direction !
            if (sujet && destination) {
              // vérifier que la cible se trouve au bon endroit
              if ((sujet as Objet).position.cibleId === destination.id) {
                retVal = true;
              }
            }
            break;

          case 'réagit':
          case 'réagissent':
            // remarque: négation appliquée plus loin.
            if ((sujet as Objet).reactions && (sujet as Objet).reactions.length > 0) {
              retVal = true;
            }
            break;

          // comparaison : égalité
          case 'valent':
          case 'vaut':
            // TODO: gérer plus de situations (en test)
            // remarque: négation appliquée plus loin.

            // console.warn("vaut condi=", condition, "ceci=", contexteTour.ceci, "cela=", contexteTour.cela);

            if (('"' + sujet.nom + '"') === condition.complement) {
              retVal = true;
            }
            break;

          // comparaison : commence par
          case 'commence':
            if (sujet.nom.startsWith(condition.complement.replace(/^\"|\"$/g, ''))) {
              retVal = true;
            }
            break;

          // comparaison : termine par
          case 'termine':
            if (sujet.nom.endsWith(condition.complement.replace(/^\"|\"$/g, ''))) {
              retVal = true;
            }
            break;

          default:
            console.error(
              "siEstVraiSansLien > Condition élément du jeu: verbe pas connu (" + condition.verbe + ").\n",
              "Les verbes connus sont : être, contenir, exister, posséder, porter, se trouver, réagir et valoir.\n",
              condition);
            break;
        }
        // *********************************************
        //  B. COMPTEUR
        // *********************************************
      } else if (sujet && ClasseUtils.heriteDe(sujet.classe, EClasseRacine.compteur)) {

        const compteur = sujet as Compteur;

        // 2 - Trouver le verbe
        // ++++++++++++++++++++
        switch (condition.verbe) {

          case 'est':
          case 'sont':
            // remarque: négation appliquée plus loin.
            if (condition.complement?.startsWith('défini')) {
              retVal = true;
            } else {
              console.error("Condition compteur: est: supporté seulement pour « défini »");
            }
            break;

          // comparaison : égal (vaut) − différent (ne vaut pas)
          case 'valent':
          case 'vaut':
            // remarque: négation appliquée plus loin.
            retVal = compteur.valeur === CompteursUtils.intituleValeurVersNombre(condition.complement, contexteTour, evenement, this.eju, this.jeu);
            break;

          // comparaison: plus grand que (dépasse) - plus petit ou égal (ne dépasse pas)
          case 'dépasse':
          case 'dépassent':
            // remarque: négation appliquée plus loin.
            retVal = compteur.valeur > CompteursUtils.intituleValeurVersNombre(condition.complement, contexteTour, evenement, this.eju, this.jeu);
            break;

          // comparaison: plus grand ou égal (atteint) − plus petit que (n’atteint pas)
          case 'atteint':
          case 'atteignent':
            // remarque: négation appliquée plus loin.
            retVal = compteur.valeur >= CompteursUtils.intituleValeurVersNombre(condition.complement, contexteTour, evenement, this.eju, this.jeu);
            break;

          case 'se déclenche':
            // remarque: négation appliquée plus loin.
            if (compteur.nom === RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('déclenchements règle') && condition.complement === 'pour la première fois') {
              retVal = (compteur.valeur === 1);
            } else if (compteur.nom === RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('déclenchements règle') && condition.complement === 'pour la deuxième fois') {
              retVal = (compteur.valeur === 2);
            } else if (compteur.nom === RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('déclenchements règle') && condition.complement === 'pour la troisième fois') {
              retVal = (compteur.valeur === 3);
            } else {
              console.error("Condition compteur: déclenche: supporté seulement pour « la règle se déclenche pour la première fois.");
            }
            break;

          default:
            console.error(
              "Condition compteur: verbe pas connu (" + condition.verbe + ").\n",
              "Les verbes connus sont : valoir, déppasser et atteindre.\n",
              condition);
            break;

        }
        // *********************************************
        //  C. LISTE
        // *********************************************
      } else if (sujet && ClasseUtils.heriteDe(sujet.classe, EClasseRacine.liste)) {

        const liste = sujet as Liste;

        // 2 - Trouver le verbe
        // ++++++++++++++++++++
        switch (condition.verbe) {

          case 'est':
          case 'sont':
            // remarque: négation appliquée plus loin.
            if (condition.complement == 'vide' || condition.complement == 'vides') {
              retVal = liste.vide;
            } else if (condition.complement?.startsWith('défini')) {
              retVal = true;
            } else {
              console.error("Condition liste: est: supporté seulement pour « vide » et « défini »");
            }
            break;

          case 'contient':
          case 'contiennent':
          case 'inclut':
          case 'incluent':
            // remarque: négation appliquée plus loin.
            if (condition.complement) {
              // A. NOMBRE
              if (condition.complement.match(ExprReg.xNombreEntier)) {
                retVal = liste.contientNombre(Number.parseInt(condition.complement));
              } else if (condition.complement.match(ExprReg.xNombreDecimal)) {
                retVal = liste.contientNombre(Number.parseFloat(condition.complement));
                // B. INTITULÉ
              } else if (condition.sujetComplement) {
                let intitule: Intitule;
                // i) rechercher parmi les cibles spéciales (ceci, cela, …)
                const cibleSpeciale: Intitule = InstructionsUtils.trouverCibleSpeciale(condition.sujetComplement.nom, contexteTour, evenement, this.eju, this.jeu);
                if (cibleSpeciale) {
                  intitule = cibleSpeciale;
                  // ii) rechercher parmis tous les éléments du jeu
                } else {
                  const cor = this.eju.trouverCorrespondance(condition.sujetComplement, TypeSujet.SujetEstNom, false, false);
                  if (cor.nbCor == 1) {
                    intitule = cor.unique;
                  } else {
                    intitule = cor.intitule;
                  }
                }
                retVal = liste.contientIntitule(intitule);
                // C. TEXTE
              } else {
                retVal = liste.contientTexte(condition.complement);
              }
            } else {
              this.jeu.tamponErreurs.push('Condition "liste contient": il manque un complément. (' + (conditionString ? conditionString : condition.toString()) + ')')
            }

            break;

          default:
            console.error(
              "Condition liste: verbe pas connu (" + condition.verbe + ").\n",
              "Les verbes connus sont : être.\n",
              condition);
            break;

        }
        // *********************************************
        //  C. DIRECTION
        // *********************************************
      } else if (sujet && ClasseUtils.heriteDe(sujet.classe, EClasseRacine.direction)) {

        // 2 - Trouver le verbe
        // ++++++++++++++++++++
        switch (condition.verbe) {

          case 'est':
            // est une [classe] | est [état]
            // remarque: négation appliquée plus loin.
            retVal = this.verifierConditionEst(condition, (sujet as Intitule));
            break;

          // EXISTANCE
          // forme "aucun·e xxxx pour yyyy" ou "aucun·e xxx vers yyyy"
          // Ex: aucune description n’existe pour ceci. 
          // Ex: aucune sortie n’existe vers le nord.
          // Ex: un aperçu existe pour cela.
          case 'existe':
            retVal = this.verifierConditionExiste(condition, sujet, contexteTour, evenement, declenchements);
            break;

          // comparaison : égalité
          case 'valent':
          case 'vaut':
            // remarque: négation appliquée plus loin.
            if (('"' + sujet.nom + '"') === condition.complement) {
              retVal = true;
            }
            break;



          default:
            console.error(
              "Condition intitulé: verbe pas connu (" + condition.verbe + ").\n",
              "Les verbes connus sont : valoir.\n",
              condition);
            break;
        }

        // *********************************************
        //  D. INTITULÉ
        // *********************************************
      } else if (sujet && ClasseUtils.heriteDe(sujet.classe, EClasseRacine.intitule)) {

        // 2 - Trouver le verbe
        // ++++++++++++++++++++
        switch (condition.verbe) {

          case 'est':

            // remarque: négation appliquée plus loin.
            if (condition.complement?.startsWith('défini')) {
              retVal = true;
            } else {
              // est une [classe] | est [état]
              // remarque: négation appliquée plus loin.
              retVal = this.verifierConditionEst(condition, (sujet as Intitule));
            }

            break;

          // comparaison : égalité
          case 'valent':
          case 'vaut':
            // remarque: négation appliquée plus loin.
            if (condition.sujetComplement) {
              if (sujet.intitule.nom == condition.sujetComplement.nom && (sujet.intitule.epithete == condition.sujetComplement.epithete)) {
                retVal = true;
              }
            } else if (sujet.intitule.toString() == condition.complement) {
              retVal = true;
            }
            break;

          // comparaison: commence par
          case 'commence':
            retVal = sujet.intitule.toString().startsWith(condition.complement.replace(/^\"|\"$/g, ''));
            break;

          // comparaison: termine par
          case 'termine':
            retVal = sujet.intitule.toString().endsWith(condition.complement.replace(/^\"|\"$/g, ''));
            break;

          case 'existe':
            if (condition.complement = 'préposition') {
              if (condition.sujet.nom == 'ceci') {
                // remarque: négation appliquée plus loin.
                if (evenement.prepositionCeci) {
                  retVal = true;
                }
              } else if (condition.sujet.nom == 'cela') {
                // remarque: négation appliquée plus loin.
                if (evenement.prepositionCela) {
                  retVal = true;
                }
              } else {
                console.error("Seul ceci/cela sont pris en charge pour la formulation « (auc)une préposition (n’)existe pour ».");
              }
            } else {
              console.error("Seul « préposition » pris en charge pour la formulation « (auc)une préposition (n’)existe pour ».");
            }
            break;

          default:
            console.error(
              "Condition intitulé: verbe pas connu (" + condition.verbe + ").\n",
              "Les verbes connus sont : valoir.\n",
              condition);
            break;

        }
        // *********************************************
        //  D. AUCUN SUJET
        // *********************************************
      } else {

        // condition spéciale: le jeu est commencé
        // remarque: négation appliquée plus loin.
        if (condition.sujet.nomEpithete == 'jeu' && condition.verbe == 'est' && condition.complement == 'commencé') {
          if (this.jeu.commence) {
            retVal = true;
          }
          // condition spéciale: le jeu est commencé
          // remarque: négation appliquée plus loin.
        } else if (condition.sujet.nomEpithete == 'jeu' && condition.verbe == 'est' && condition.complement == 'terminé') {
          if (this.jeu.termine) {
            retVal = true;
          }
          // condition spéciale : tirage à X chance sur Y réussit
          // remarque: négation appliquée plus loin.
        } else if (condition.sujet.nomEpithete == 'tirage') {
          // le seul verbe autorisé pour un tirage est 'réussit'
          if (condition.verbe == 'réussit') {
            const motsClesComplement = condition.complement.split(' ');
            if (motsClesComplement.length == 4 && motsClesComplement[1].startsWith('chance') && motsClesComplement[2] == 'sur') {
              const nbChance = Number.parseInt(motsClesComplement[0]);
              const totalTirage = Number.parseInt(motsClesComplement[3]);
              if (nbChance > 0 && totalTirage > 0 && nbChance <= totalTirage) {
                const rand = AleatoireUtils.nombre();
                const ratio = (1 - (nbChance / totalTirage));
                if (rand >= ratio) {
                  retVal = true;
                } else {
                  retVal = false;
                }
              } else {
                this.jeu.tamponErreurs.push("condition « un tirage à x chances sur y » : x et y doivent être supérieurs à 0, x ne peut pas dépasser y.");
              }
            } else {
              this.jeu.tamponErreurs.push("condition « un tirage à x chances sur y » : formulation pas supportée: ", condition.toString());
            }
          } else {
            this.jeu.tamponErreurs.push("condition sur un tirage : seuls les verbes 'échouer' et 'réussir' sont pris en charge.");
          }
          // rien trouvé comme sujet
        } else {
          // si le verbe est "être", on retourne toujours faux, puisqu’un élément indéfini n’est pas.
          if (condition.verbe == 'est' || condition.verbe == 'sont') {
            retVal = false;
            console.log("Pas défini donc.");
            if (!condition.complement?.startsWith('défini')) {
              this.jeu.tamponConseils.push("le sujet de la condition n’étant pas défini, le résultat est faux: si " + condition + " (" + condition.sujet + ")");
            }
          } else {
            this.jeu.tamponErreurs.push("le sujet de la condition n’est pas défini, le résultat est faux: si " + condition + " (" + condition.sujet + ")");
          }
        }
      }

    } else {
      console.error("siEstVraiSansLien > condition pas comprise:", condition);
    }

    if (this.verbeux) {
      console.log("siEstVraiSansLien > ", condition, retVal);
    }
    // prise en compte de la négation
    if (condition.negation) {
      retVal = !retVal;
    }

    // // -------------------------------------------------------
    // // DEB: Affichage détaillé de la condition et du retour
    // // -------------------------------------------------------
    // console.warn(
    //   "Condition:",
    //   "\n Suj:", ((condition.sujet?.nom ?? "") + " " + (condition.sujet?.epithete ?? "")),
    //   ((condition.sujet ? (condition.sujet.nom === 'ceci' ? ("(" + (ceci?.nom ?? '-') + ")") : '') : '') +
    //   (condition.sujet ? (condition.sujet.nom === 'cela' ? ("(" + (cela?.nom ?? '-') + ")") : '') : '') +
    //   (condition.sujet ? (condition.sujet.nom === 'ici' ? ("(" + this.eju.curLieu.nom + ")") : '') : '')),
    //   "\n Ver:", condition.verbe,
    //   "\n Neg:", (condition.negation ?? "−"),
    //   "\n Com:", ((condition.sujetComplement?.nom ?? "") + " " + (condition.sujetComplement?.epithete ?? "")),
    //   "\n >>> ", retVal);

    return retVal;
  }

  /**
   * Retrouver l’objet cible de la condition.
   * @param brute « ceci » et « cela » sont gérés.
   * @param intitule un objet à retrouver
   * @param ceci pour le cas où brute vaut « ceci ».
   * @param cela pour le cas où brute vaut « cela ».
   */
  private trouverObjetCible(brute: string, intitule: GroupeNominal, contexteTour: ContexteTour): Objet {
    let objetCible: Objet = null;

    const bruteNettoye = RechercheUtils.transformerCaracteresSpeciauxEtMajuscules(brute);

    // retrouver OBJET SPÉCIAL
    if (bruteNettoye === 'ceci') {
      if (contexteTour.ceci && ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.objet)) {
        objetCible = contexteTour.ceci as Objet;
      } else {
        console.error("ConditionsUtils > trouverObjetCible > ceci n’est pas un objet.");
      }
    } else if (bruteNettoye === 'cela') {
      if (contexteTour.cela && ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.objet)) {
        objetCible = contexteTour.cela as Objet;
      } else {
        console.error("ConditionsUtils > trouverObjetCible > cela n’est pas un objet.");
      }
    } else {
      // retrouver OBJET CLASSIQUE
      if (intitule) {
        const objetsTrouves = this.eju.trouverObjet(intitule, false);
        if (objetsTrouves.length == 1) {
          objetCible = objetsTrouves[0];
        } else if (objetsTrouves.length != 0) {
          console.warn("Instructions > trouverObjetCible > plusieurs correspondances trouvées pour :", brute);
        }
        // retrouver OBJET SPÉCIAL
      } else {
        console.error("ConditionsUtils > trouverObjetCible > objet spécial pas pris en change :", brute);
      }
    }

    if (!objetCible) {
      console.warn("ConditionsUtils > trouverObjetCible > pas pu trouver :", brute);
    }

    return objetCible;
  }

  /** 
 * Vérifier une condition de type "est", c'est à dire vérifer l'état ou la classe.
 * /!\ La négation n'est pas appliquée ici, il faut le faire ensuite.
 */
  private verifierConditionEst(condition: ConditionSolo, sujet: ElementJeu | Intitule) {
    let resultCondition: boolean = null;

    if (!condition.sujetComplement || !condition.sujetComplement.determinant) {
      // vérifier la liste des états (si c’est un élémentJeu)
      if (ClasseUtils.heriteDe(sujet.classe, EClasseRacine.element)) {
        resultCondition = this.jeu.etats.possedeEtatElement((sujet as ElementJeu), condition.complement, this.eju);
        // sinon comparer l’intitulé du sujet avec le complément
      } else if (ClasseUtils.heriteDe(sujet.classe, EClasseRacine.intitule)) {
        resultCondition = (sujet.intitule.toString() == condition.complement);
      } else {
        console.error("verbe « est » utilisé sur un type non supporté.");
        resultCondition = false;
      }
    } else {
      switch (condition.sujetComplement.determinant) {
        case "un ":
        case "une ":
        case "des ":
        case "de la ":
        case "du ":
        case "de l’":
        case "de l'":
          resultCondition = ClasseUtils.heriteDe(sujet.classe, condition.sujetComplement.nom);
          break;

        case "la ":
        case "le ":
        case "l’":
        case "l'":
        case "les ":
          resultCondition = (sujet.intitule.nom === condition.sujetComplement.nom) && (sujet.intitule.epithete === condition.sujetComplement.epithete);
          // si le complément est un groupe nominal, vérifier également les synonymes du sujet
          if (!resultCondition && ClasseUtils.heriteDe(sujet.classe, EClasseRacine.element)) {
            if ((sujet as ElementJeu).synonymes?.length) {
              (sujet as ElementJeu).synonymes.forEach(syn => {
                if (!resultCondition && (syn.nom === condition.sujetComplement.nom) && (syn.epithete === condition.sujetComplement.epithete)) {
                  resultCondition = true;
                }
              });
            }
          }
          break;

        default:
          console.error("verifierConditionEst : déterminant pas géré:", condition.sujetComplement.determinant);
          resultCondition = false;
          break;
      }
    }

    return resultCondition;

  }

  private verifierConditionExiste(condition: ConditionSolo, sujet: ElementJeu | Intitule, contexteTour: ContexteTour, evenement: Evenement, declenchements: number) {

    let retVal = false;

    // remarque: négation appliquée plus loin.
    // A) SORTIE
    if (condition.sujetComplement.nom === 'sortie') {
      // console.warn("Test des sorties", condition, sujet);
      // trouver direction
      let loc: Localisation | ELocalisation = null;
      // si le sujet est un lieu
      if (ClasseUtils.heriteDe(sujet.classe, EClasseRacine.lieu)) {
        // chercher la direction vers ce lieu
        let voisin = this.eju.curLieu.voisins.find(x => x.type == EClasseRacine.lieu && x.id == (sujet as Lieu).id);
        loc = voisin.localisation;
        // sinon c’est directement une direction
      } else {
        loc = ElementsJeuUtils.trouverLocalisation(sujet.intitule);
      }
      if (loc == null) {
        console.error("siEstVraiSansLien: sorties vers '", sujet.intitule.nom, "': direction inconnue.");
        // regarder s'il y a une sortie dans la direction indiquée
      } else {
        let voisinID = this.eju.getVoisinDirectionID(loc, EClasseRacine.lieu);
        // cas particulier : si le joueur utilise entrer/sortir quand une seule sortie visible, aller dans la direction de cette sortie
        if (loc instanceof Localisation && (loc.id == ELocalisation.exterieur /*|| loc.id == ELocalisation.interieur*/)) {
          const lieuxVoisinsVisibles = this.eju.getLieuxVoisinsVisibles(this.eju.curLieu);
          if (lieuxVoisinsVisibles.length == 1) {
            voisinID = lieuxVoisinsVisibles[0].id;
            loc = lieuxVoisinsVisibles[0].localisation;
          }
        }

        // Pas de voisin => aucune sortie dans cette direction
        if (voisinID == -1) {
          retVal = false;
          // voisin existe
        } else {
          // trouver si porte sépare voisin
          const porteID = this.eju.getVoisinDirectionID(loc, EClasseRacine.porte);
          // aucune porte => sortie existe et est accessible
          if (porteID == -1) {
            retVal = true;
            // une porte
          } else {
            const porte = this.eju.getObjet(porteID);
            // si on teste « existe sortie » tout court, il y a une sortie (sauf si porte invisible fermée.)
            if (!condition.sujetComplement.epithete) {
              // retVal = !this.jeu.etats.possedeCesEtatsElement(porte, EEtatsBase.invisible, EEtatsBase.ferme, LienCondition.et, this.eju);
              retVal = !(!this.jeu.etats.possedeEtatIdElement(porte, this.jeu.etats.visibleID, this.eju) && this.jeu.etats.possedeEtatIdElement(porte, this.jeu.etats.fermeID, this.eju));
              // si on test « existe sortie accessible », il faut que la porte soit ouverte pour retourner vrai.
            } else if (condition.sujetComplement.epithete == 'accessible') {
              retVal = this.jeu.etats.possedeEtatElement(porte, EEtatsBase.ouvert, this.eju);
              // attribut pas pris en charge
            } else {
              console.error("siEstVrai sorties «", condition.sujetComplement.epithete, "» : attribut pas pris en charge.");
              retVal = false; // => pas de sortie
            }
          }

          // s’il y a une sortie, vérifier qu’elle n’est pas obstruée par un obstacle
          if (retVal == true) {
            // trouver si obstacle (autre que porte) sépare voisin
            const obstacleID = this.eju.getVoisinDirectionID(loc, EClasseRacine.obstacle);
            if (obstacleID !== -1) {
              const obstacle = this.eju.getObjet(obstacleID);
              // si on teste « existe sortie » tout court, il y a une sortie (sauf si obstacle couvrant.)
              if (!condition.sujetComplement.epithete) {
                retVal = !this.jeu.etats.possedeEtatIdElement(obstacle, this.jeu.etats.couvrantID, this.eju);
                // si on test « existe sortie accessible », c’est forcément faut puisqu’il y a un obstacle.
              } else if (condition.sujetComplement.epithete == 'accessible') {
                retVal = false; // => pas de sortie accessible
                // attribut pas pris en charge
              } else {
                console.error("siEstVrai sorties «", condition.sujetComplement.epithete, "» : attribut pas pris en charge.");
                retVal = false; // => pas de sortie
              }
            }
          }
        }
      }
      // B) PORTE
    } else if (condition.sujetComplement.nom === 'porte') {
      console.warn("Test des portes", condition, sujet);
      // trouver direction
      const loc = ElementsJeuUtils.trouverLocalisation(sujet.intitule);
      if (loc != null) {
        console.error("siEstVraiSansLien: porte vers '", sujet.intitule.nom, "' : direction inconnue.");
        // regarder s'il y a une porte dans la direction indiquée
      } else {
        const porteID = this.eju.getVoisinDirectionID(loc, EClasseRacine.porte);
        // aucune porte
        if (porteID == -1) {
          retVal = false;
          // la porte est invisible => aucune porte
        } else {
          const porte = this.eju.getObjet(porteID);
          retVal = !this.jeu.etats.possedeEtatIdElement(porte, this.jeu.etats.invisibleID);
        }
      }
      // C) OBSTACLE (AUTRE QUE PORTE)
    } else if (condition.sujetComplement.nom === 'obstacle') {
      console.warn("Test des obstacles", condition, sujet);
      // trouver direction
      const loc = ElementsJeuUtils.trouverLocalisation(sujet.intitule);
      if (loc != null) {
        console.error("siEstVraiSansLien: obstacle vers '", sujet.intitule.nom, "' : direction inconnue.");
        // regarder s'il y a une porte dans la direction indiquée
      } else {
        const obstacleID = this.eju.getVoisinDirectionID(loc, EClasseRacine.obstacle);
        // aucun obstacle
        if (obstacleID == -1) {
          retVal = false;
          // l’obstacle est invisible => aucun obstacle
        } else {
          const obstacle = this.eju.getObjet(obstacleID);
          retVal = !this.jeu.etats.possedeEtatIdElement(obstacle, this.jeu.etats.invisibleID);
        }
      }
      // D) PRÉPOSITION
    } else if (condition.complement === 'préposition') {
      if (condition.sujet.nom == 'ceci') {
        // remarque: négation appliquée plus loin.
        if (evenement.prepositionCeci) {
          retVal = true;
        }
      } else if (condition.sujet.nom == 'cela') {
        // remarque: négation appliquée plus loin.
        if (evenement.prepositionCela) {
          retVal = true;
        }
      } else {
        console.error("Seul ceci/cela sont pris en charge pour la formulation « (auc)une préposition (n’)existe pour ».");
      }
      // E) PROPRIÉTÉ
      // e.1 aperçu
    } else if ((condition.complement === 'aperçu') || (condition.complement === 'apercu')) {
      // => aperçu dans une direction
      if (ClasseUtils.heriteDe(sujet.classe, EClasseRacine.direction)) {
        const dirSujet = sujet as Localisation;
        let voisinID = this.eju.getVoisinDirectionID(dirSujet, EClasseRacine.lieu);
        if (voisinID !== -1) {
          let voisin = this.eju.getLieu(voisinID);
          retVal = voisin.apercu ? true : false;
        } else {
          console.error("cond aperçu existe vers direction: voisin pas trouvé dans cette direction.");
        }
        // => aperçu d’un objet
      } else {
        retVal = (sujet as ElementJeu).apercu ? true : false;
      }
      // e.2 autre
    } else {
      // à moins qu’on ne trouve la propriété et une valeur, le retour vaudra false
      retVal = false;
      // parcourir les propriétés
      (sujet as ElementJeu).proprietes.forEach(propriete => {
        // si on a trouvé la propriété et qu’elle a une valeur
        if (propriete.nom.toLocaleLowerCase() === condition.complement.toLowerCase() && propriete.valeur) {
          // on a trouvé la propriété et celle-ci a une valeur
          retVal = true;
        }
      });
    }

    return retVal;
  }

  private getValeurHorloge(valeurRecherchee: string, verbe: string): Compteur | undefined {
    let retVal: Compteur | undefined;
    const match = valeurRecherchee.match(ExprReg.oHorloge);
    if (match) {
      switch (match[1]) {
        case 'heure':
          retVal = new Compteur("heure", new Date().getHours());
          break;
        case 'minute':
          retVal = new Compteur("minute", new Date().getMinutes());
          break;
        case 'seconde':
          retVal = new Compteur("seconde", new Date().getSeconds());
          break;
        default:
          this.eju.ajouterErreur("getValeurHorloge: valeurRecherchee doit être en minuscules.")
          break;
      }
    }
    return retVal;
  }

  private getValeurCalendrier(valeurRecherchee: string, verbe: string): Compteur | Intitule | undefined {
    let retVal: Compteur | Intitule | undefined;
    const match = valeurRecherchee.match(ExprReg.oCalendrier);
    if (match) {
      switch (match[1]) {
        // jour de la semaine
        case 'jour':
          const indexJour = new Date().getDay();
          // valeur numérique (1 => 7)
          if (ExprReg.verbesCompteur.test(verbe)) {
            const jours = [7, 1, 2, 3, 4, 5, 6];
            retVal = new Compteur('jour', jours[indexJour]);
            // valeur textuelle (lundi => dimanche)
          } else {
            const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeurdi', 'vendredi', 'samedi'];
            retVal = new Intitule(jours[indexJour], new GroupeNominal(null, jours[indexJour], null), ClassesRacines.Intitule);
          }
          break;
        // date du mois
        case 'date':
          retVal = new Compteur("date", new Date().getDate());
          break;
        // mois (1 => 12)
        case 'mois':
          const indexMois = new Date().getMonth();
          // valeur numérique (1 => 12)
          if (ExprReg.verbesCompteur.test(verbe)) {
            const mois = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
            retVal = new Compteur('mois', mois[indexMois]);
            // valeur textuelle (janvier => décembre)
          } else {
            const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
            retVal = new Intitule(mois[indexMois], new GroupeNominal(null, mois[indexMois], null), ClassesRacines.Intitule);
          }
          break;
        case 'année':
          retVal = new Compteur("année", new Date().getFullYear());
          break;
        default:
          this.eju.ajouterErreur("getValeurCalendrier: valeurRecherchee doit être en minuscules.")
          break;
      }
    }
    return retVal;
  }

}