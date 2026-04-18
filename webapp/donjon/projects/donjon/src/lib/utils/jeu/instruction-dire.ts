import { ConditionDebutee, StatutCondition, xFois } from "../../models/jouer/statut-conditions";
import { ELocalisation, Localisation } from "../../models/jeu/localisation";
import { PositionObjet, PrepositionSpatiale } from "../../models/jeu/position-objet";

import { Action } from "../../models/compilateur/action";
import { AleatoireUtils } from "./aleatoire-utils";
import { AnalyseurCondition } from "../compilation/analyseur/analyseur.condition";
import { ClasseUtils } from "../commun/classe-utils";
import { Compteur } from "../../models/compilateur/compteur";
import { ConditionsUtils } from "./conditions-utils";
import { Conjugaison } from "./conjugaison";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { EClasseRacine, EEtatsBase } from "../../models/commun/constantes";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils, TypeSujet } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { ExprReg } from "../compilation/expr-reg";
import { Genre } from "../../models/commun/genre.enum";
import { InstructionsUtils } from "./instructions-utils";
import { Intitule } from "../../models/jeu/intitule";
import { Jeu } from "../../models/jeu/jeu";
import { Lieu } from "../../models/jeu/lieu";
import { Liste } from "../../models/jeu/liste";
import { Nombre } from "../../models/commun/nombre.enum";
import { Objet } from "../../models/jeu/objet";
import { PhraseUtils } from "../commun/phrase-utils";
import { ProprieteConcept } from "../../models/commun/propriete-element";
import { Resultat } from "../../models/jouer/resultat";
import { StringUtils } from "../commun/string.utils";
import { TexteUtils } from "../commun/texte-utils";
import { TypeProprieteJeu } from "../../models/jeu/propriete-jeu";
import { TypeValeur } from "../../models/compilateur/type-valeur";
import { Concept } from "../../models/compilateur/concept";
import { InstructionDireNumerique } from "./instruction-dire-numerique";
import { InstructionDireFormat } from "./instruction-dire-format";
import { InstructionDireApercuStatut } from "./instruction-dire-apercu-statut";
import { InstructionDireContenu } from "./instruction-dire-contenu";
import { InstructionDirePropriete } from "./instruction-dire-propriete";

export class InstructionDire {

  private cond: ConditionsUtils;
  private numerique: InstructionDireNumerique;
  private format: InstructionDireFormat;
  private apercuStatut: InstructionDireApercuStatut;
  private contenu: InstructionDireContenu;
  private propriete: InstructionDirePropriete;

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private verbeux: boolean,
  ) {
    this.cond = new ConditionsUtils(this.jeu, this.verbeux);
    this.numerique = new InstructionDireNumerique(this.eju);
    this.format = new InstructionDireFormat(this.jeu, this.eju, this.calculerConjugaison.bind(this));
    this.apercuStatut = new InstructionDireApercuStatut(this.jeu, this.eju, this.calculerTexteDynamique.bind(this));
    this.contenu = new InstructionDireContenu(this.jeu, this.eju, this.afficherObstacle.bind(this), this.afficherSorties.bind(this), this.executerListerContenu.bind(this), this.executerDecrireContenu.bind(this), this.executerEnumererContenu.bind(this));
    this.propriete = new InstructionDirePropriete(this.jeu, this.eju, this.calculerTexteDynamique.bind(this));
  }



  /**
   * Calculer le texte dynamique en tenant compte des balises conditionnelles et des états actuels.
   */
  public calculerTexteDynamique(texteDynamiqueOriginal: string, nbAffichage: number, intact: boolean | undefined, ctxTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined) {
    if (texteDynamiqueOriginal === undefined) {
      throw new Error("texteDynamiqueOriginal n’est pas défini.");
    } else if (texteDynamiqueOriginal === null) {
      throw new Error("texteDynamiqueOriginal est null.");
    }

    let texteDynamique = texteDynamiqueOriginal;

    // échapper les crochets doubles pour ne pas les perdre
    texteDynamique = texteDynamique.replace(/\\\[/g, ExprReg.caractereCrochetOuvrant);
    texteDynamique = texteDynamique.replace(/\\\]/g, ExprReg.caractereCrochetFermant);

    // vérifier s’il y a des [] à interpréter
    if (texteDynamique.includes('[')) {
      // ===================================================
      // > CONDITIONS
      // ===================================================
      texteDynamique = this.calculerCrochetsConditions(texteDynamique, nbAffichage, intact, ctxTour, evenement, declenchements);

      // ===================================================
      // > CROCHETS DYNAMIQUES
      // ===================================================
      texteDynamique = this.interpreterLesCrochetsDynamiques(texteDynamique, nbAffichage, intact, ctxTour, evenement, declenchements);

    } // fin interprétation crochets

    // rétablir les crochets échappés
    texteDynamique = texteDynamique.replace(ExprReg.xCaractereCrochetOuvrant, '[');
    texteDynamique = texteDynamique.replace(ExprReg.xCaractereCrochetFermant, ']');

    // ===================================================
    // > RETOURS CONDITIONNELS
    // ===================================================

    // retirer toutes les balises de style
    // => cela permet de savoir s’il y a du texte autre que les balises de style.
    const texteDynamiqueSansBaliseStyle = TexteUtils.enleverBalisesStyleDonjon(texteDynamique);

    if (texteDynamique.includes("{N}")) {
      // texte vide
      if (texteDynamiqueSansBaliseStyle.trim() == "") {
        // => pas de \n
        texteDynamique = texteDynamique.replace(/\{N\}/g, "");
        // texte pas vide
      } else {
        // sera remplacé lors de la transformation en HTML si ne débute pas le bloc de texte.
        // texteDynamiqueSansBaliseStyle = texteDynamiqueSansBaliseStyle.replace(/\{N\}/g, "\n");
      }
    }

    // ======================================================================================================
    // > POINT FINAL => ajout d’un retour à la ligne conditionnel automatiquement, sauf si balise de type {x}
    // ======================================================================================================
    if (texteDynamiqueSansBaliseStyle.match(/(\.|…|:|\?|!)(\)| »)?$/)) {
      // si le texte se termine par une balise de type {x}, ne pas ajouter de retour à la ligne auto.
      if (texteDynamique.match(/\{[a-zA-DF-Z]\}$/)) {
        // sinon ajouter retour à la ligne auto.
      } else {
        texteDynamique += "{N}";
      }
    }



    return texteDynamique;
  }


  private calculerCrochetsConditions(texteDynamique: string, nbAffichage: number, intact: boolean, contexteTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined): string {
    let retVal = "";
    if (texteDynamique) {
      // séparer les textes et les blocs conditionnels
      const morceaux = texteDynamique.split(/\[|\]/);
      let statutCondition = new StatutCondition(nbAffichage, intact, morceaux, 0);
      // on commence toujours par un texte avant les crochets (même si la chaine commence par des crochets car dans ce cas on a une chaîne vide avant)
      let suivantEstContenuCrochets = false; // description.trim().startsWith("[");
      let afficherMorceauSuivant = true;
      let conditionQuiPrecede = '';
      for (let index = 0; index < morceaux.length; index++) {
        statutCondition.curMorceauIndex = index;
        const curMorceau = morceaux[index];
        if (suivantEstContenuCrochets) {
          if (curMorceau.length) {
            // n’interpréter que les conditions
            if (InstructionDire.estBlocCondition(curMorceau)) {
              conditionQuiPrecede = curMorceau;
              afficherMorceauSuivant = this.estConditionDescriptionRemplie(curMorceau, statutCondition, contexteTour, evenement, declenchements);
              suivantEstContenuCrochets = false;
              // sinon remettre le bloc pour l’interpréter plus tard
            } else {
              // remettre le bloc uniquement s’il doit être affiché
              if (afficherMorceauSuivant) {
                retVal += `[${curMorceau}]`;
              }
              suivantEstContenuCrochets = false;
              // (on ne change pas afficherMorceauSuivant puisqu’il ne s’agit pas d’une condition.)
            }
          }
        } else {
          if (afficherMorceauSuivant) {
            // ajouter le morceau s’il n’est pas vide
            if (curMorceau?.length) {
              // s’il s’agit d’un texte qui suit la fin d’une condition
              if (conditionQuiPrecede.match(/^fin/gi) || conditionQuiPrecede == '') {
                retVal += curMorceau;
                // s’il s’agit d’un texte à l’intérieur d’une condition
              } else {
                retVal += "{E}" + curMorceau + "{E}";
              }
            }
          }
          suivantEstContenuCrochets = true;
        }
      }
    } else {
      retVal = "";
    }
    return retVal;
  }


  private interpreterLesCrochetsDynamiques(texteDynamique: string, nbAffichage: number, intact: boolean, contexteTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined): string {

    let retVal = "";
    if (texteDynamique) {
      // séparer les textes et les blocs conditionnels
      const morceaux = texteDynamique.split(/(?=\[)/);
      for (let index = 0; index < morceaux.length; index++) {
        const curMorceau = morceaux[index];
        let curResultat = this.calculerBalise(curMorceau, nbAffichage, intact, contexteTour, evenement, declenchements);
        retVal += curResultat;
      }
    } else {
      retVal = "";
    }

    return retVal;
  }

  /**
   * Traiter les propriétés trouvés dans contenu et remplacer les balises par la valeur.
   * @param texteDynamique 
   * @param allBalises 
   * @param sansDe Le de après le premier mot est manquant (ex: description table => description de table)
   * @param ceci 
   * @param cela 
   */
  private suiteTraiterPropriete(texteDynamique: string, allBalises: RegExpMatchArray, sansDe: boolean, contexteTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number): string {
    // ne garder qu’une seule occurrence de chaque afin de ne pas calculer plusieurs fois la même balise.
    const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)
    // parcourir chaque balise trouvée    
    balisesUniques.forEach(curBalise => {
      let valeur = "{+@problème balise@+}";
      // enlever les []
      const curProprieteIntitule = curBalise.slice(1, (curBalise.length - 1));
      // ajouter le « de » s’il est absent de l’expression (ex: description table => description de table)
      let curProprieteIntituleCorrige = curProprieteIntitule;
      if (sansDe) {
        curProprieteIntituleCorrige = curProprieteIntituleCorrige.replace(" ", " de "); // rem: seul premier espace est remplacé.
      }
      // ajouter déterminant « le » devant la propriété si pas déjà présent (ex: titre de la table => le titre de la table)
      if (!curProprieteIntituleCorrige.match(/^(le |la |les |l'|l\u2019)/i)) {
        curProprieteIntituleCorrige = ("le " + curProprieteIntituleCorrige);
      }

      // informations de la propriété
      const curPropriete = PhraseUtils.trouverPropriete(curProprieteIntituleCorrige);
      if (curPropriete) {
        // retrouver la propriété dans l’objet cible                  
        const curProprieteCible = InstructionsUtils.trouverProprieteCible(curPropriete, contexteTour, this.eju, this.jeu);
        if (curProprieteCible) {
          // récupérer la valeur
          if ((curPropriete.type === TypeProprieteJeu.nombreDeClasseAttributs) || (curPropriete.type === TypeProprieteJeu.nombreDeClasseAttributsPosition)) {
            valeur = (curProprieteCible as Compteur).valeur.toString();
          } else if (curPropriete.type === TypeProprieteJeu.nombreDeProprieteElement) {
            valeur = (curProprieteCible as ProprieteConcept).valeur;
          } else if (curPropriete.type === TypeProprieteJeu.proprieteElement) {
            const propriete = (curProprieteCible as ProprieteConcept);
            // texte
            if (propriete.type == TypeValeur.mots) {
              valeur = this.calculerTexteDynamique(propriete.valeur, ++propriete.nbAffichage, this.jeu.etats.possedeEtatIdElement(curPropriete.element, this.jeu.etats.intactID), contexteTour, evenement, declenchements);
              // nombre
            } else {
              valeur = (curProprieteCible as ProprieteConcept).valeur;
            }
          }
        }
      }

      if (valeur == "{+@problème balise@+}") {
        this.jeu.tamponErreurs.push("Balise pas comprise ou propriété pas trouvée: [" + curProprieteIntitule + "]");
      }

      // remplacer la balise par la valeur
      const regExp = new RegExp("\\[" + curProprieteIntitule + "\\]", "g");
      texteDynamique = texteDynamique.replace(regExp, valeur);
    });
    return texteDynamique;
  }

  private static estBlocCondition(contenuBloc: string) {
    let estCondition = false;
    let conditionLC = contenuBloc.toLowerCase();
    // X-ÈME FOIS
    if (conditionLC.match(xFois)) {
      estCondition = true;
      // AU HASARD, EN BOUCLE, INITIALEMENT
    } else if (conditionLC.match(/^(au hasard|en boucle|initialement)\b/)) {
      estCondition = true;
      // SI, SINON, SINONSI
    } else if (conditionLC.match(/^(si|sinon|sinonsi)\b/)) {
      estCondition = true;
      // SI, SINON, SINONSI
    } else if (conditionLC.match(/^(ou|puis)\b/)) {
      estCondition = true;
    } else if (conditionLC.match(/^fin\b|finchoix|finsi/)) {
      estCondition = true;
    }
    return estCondition;
  }

  /** Vérifier si une condition [] est remplie. */
  private estConditionDescriptionRemplie(condition: string, statut: StatutCondition, contexteTour: ContexteTour, evenement: Evenement, declenchements: number): boolean {

    let retVal = false;
    let conditionLC = condition.toLowerCase();
    const resultFois = conditionLC.match(xFois);

    // X-ÈME FOIS
    if (resultFois) {
      statut.conditionDebutee = ConditionDebutee.fois;
      const nbFois = Number.parseInt(resultFois[1], 10);
      statut.nbChoix = InstructionDire.calculerNbChoix(statut);
      retVal = (statut.nbAffichage === nbFois);
      statut.siFois = (statut.siFois || retVal); // est-ce que au moins 1 des Xe fois est validé ?
      // AU HASARD
    } else if (conditionLC === "au hasard") {
      statut.conditionDebutee = ConditionDebutee.hasard;
      statut.dernIndexChoix = 1;
      // compter le nombre de choix
      statut.nbChoix = InstructionDire.calculerNbChoix(statut);
      // choisir un choix au hasard
      const rand = AleatoireUtils.nombre();
      statut.choixAuHasard = Math.floor(rand * statut.nbChoix) + 1;
      retVal = (statut.choixAuHasard == 1);
      // EN BOUCLE
    } else if (conditionLC === "en boucle") {
      statut.conditionDebutee = ConditionDebutee.boucle;
      statut.dernIndexChoix = 1;
      // compter le nombre de choix
      statut.nbChoix = InstructionDire.calculerNbChoix(statut);
      retVal = (statut.nbAffichage % statut.nbChoix === 1);
      // INITIALEMENT
    } else if (conditionLC === "initialement") {
      statut.conditionDebutee = ConditionDebutee.initialement;
      retVal = statut.initial;
      // SI
    } else if (conditionLC.startsWith("si ")) {
      statut.conditionDebutee = ConditionDebutee.si;
      const conditionMulti = AnalyseurCondition.getConditionMulti(condition);
      if (conditionMulti.nbErreurs) {
        retVal = false;
        console.error("Condition pas comprise: ", condition);
      } else {
        statut.siVrai = this.cond.siEstVrai(null, conditionMulti, contexteTour, evenement, declenchements);
        retVal = statut.siVrai;
      }
      // SUITES
    } else if (statut.conditionDebutee !== ConditionDebutee.aucune) {

      // SINONSI
      if (conditionLC.startsWith("sinonsi ") || conditionLC.startsWith("sinon si ")) {
        if (statut.conditionDebutee === ConditionDebutee.si) {
          // le si précédent était vrai => la suite sera fausse
          if (statut.siVrai) {
            // (on laisse le statut siVrai à true pour les sinonsi/sinon suivants)
            retVal = false;
            // le si précédent était faux => tester le sinonsi
          } else {
            // (on retire le « sinon » qui précède le si)
            const conditionSansSinon = condition.substring('sinon'.length).trim()
            // tester le si
            const conditionMulti = AnalyseurCondition.getConditionMulti(conditionSansSinon);

            if (conditionMulti.nbErreurs) {
              retVal = false;
              console.error("Condition pas comprise: ", condition);
            } else {
              statut.siVrai = this.cond.siEstVrai(null, conditionMulti, contexteTour, evenement, declenchements);
              retVal = statut.siVrai;
            }
          }
        } else {
          console.warn("[sinonsi …] sans 'si'.");
          retVal = false;
        }
      } else {
        retVal = false;
        switch (conditionLC) {
          // OU
          case 'ou':
            if (statut.conditionDebutee === ConditionDebutee.hasard) {
              retVal = (statut.choixAuHasard === ++statut.dernIndexChoix);
            } else {
              console.warn("[ou] sans 'au hasard'.");
            }
            break;
          // PUIS
          case 'puis':
            if (statut.conditionDebutee === ConditionDebutee.fois) {
              // toutes les fois suivant le dernier Xe fois
              retVal = (statut.nbAffichage > statut.plusGrandChoix);
            } else if (statut.conditionDebutee === ConditionDebutee.boucle) {
              // boucler
              statut.dernIndexChoix += 1;
              retVal = (statut.nbAffichage % statut.nbChoix === (statut.dernIndexChoix == statut.nbChoix ? 0 : statut.dernIndexChoix));
            } else if (statut.conditionDebutee === ConditionDebutee.initialement) {
              // quand on est plus dans initialement
              retVal = !statut.initial;
            } else {
              console.warn("[puis] sans 'fois', 'boucle' ou 'initialement'.");
            }
            break;

          // SINON
          case 'sinon':
            if (statut.conditionDebutee === ConditionDebutee.si) {
              retVal = !statut.siVrai;
            } else if (statut.conditionDebutee === ConditionDebutee.fois) {
              retVal = !statut.siFois;
            } else {
              console.warn("[sinon] sans 'si' ou 'fois'.");
              retVal = false;
            }
            break;
          // FIN CHOIX
          case 'fin choix':
          case 'finchoix':
            if (statut.conditionDebutee === ConditionDebutee.boucle || statut.conditionDebutee === ConditionDebutee.fois || statut.conditionDebutee == ConditionDebutee.hasard || statut.conditionDebutee === ConditionDebutee.initialement) {
              retVal = true;
            } else {
              console.warn("[fin choix] sans 'fois', 'boucle', 'hasard' ou 'initialement'.");
            }
            break;
          // FIN SI
          case 'fin si':
          case 'finsi':
            if (statut.conditionDebutee === ConditionDebutee.si) {
              retVal = true;
            } else {
              console.warn("[fin si] sans 'si'.");
            }
            break;
          // FIN
          case 'fin':
            if (statut.conditionDebutee === ConditionDebutee.si || statut.conditionDebutee === ConditionDebutee.boucle || statut.conditionDebutee === ConditionDebutee.fois || statut.conditionDebutee == ConditionDebutee.hasard || statut.conditionDebutee === ConditionDebutee.initialement) {
              retVal = true;
            } else {
              console.warn("[fin choix] sans 'si', 'fois', 'boucle', 'hasard' ou 'initialement'.");
            }
            break;

          default:
            console.warn("estConditionDescriptionRemplie > je ne sais pas quoi faire pour cette balise :", conditionLC);
            break;
        }
      }
    }

    if (this.verbeux) {
      console.log("estConditionDescriptionRemplie", condition, statut, retVal);
    }
    return retVal;
  }

  private static calculerNbChoix(statut: StatutCondition) {
    let nbChoix = 0;
    let index = statut.curMorceauIndex;
    do {
      index += 2;
      nbChoix += 1;
    } while (statut.morceaux[index] !== 'fin choix' && (index < (statut.morceaux.length - 3)));

    // si on est dans une balise fois et si il y a un "puis"
    // => récupérer le dernier élément fois pour avoir le plus élevé
    if (statut.conditionDebutee == ConditionDebutee.fois) {

      if (statut.morceaux[index - 2] === "puis") {
        const result = statut.morceaux[index - 4].match(xFois);
        if (result) {
          statut.plusGrandChoix = Number.parseInt(result[1], 10);
        } else {
          console.warn("'puis' ne suit pas un 'Xe fois'");
        }
      }
    }
    return nbChoix;
  }

  // ===================================================
  // CONJUGAISON
  // ===================================================

  private calculerConjugaison(verbe: string, modeTemps: string, negation: string, sujetStr: string, ici: Lieu, contexteTour: ContexteTour | undefined, evenement: Evenement | undefined): string {

    // retrouver et contrôler le sujet
    let sujet: ElementJeu | Intitule = null;
    let verbeConjugue: string = null;
    let verbePronominal = /(se |s\u2019|s')(.+)/.test(verbe);
    let infinitifSansLeSe = verbePronominal ? verbe.replace(/^(se |s\u2019|s')/i, "") : verbe;
    sujet = InstructionsUtils.trouverCibleSpeciale(sujetStr, contexteTour, evenement, this.eju, this.jeu);
    if (!sujet || !ClasseUtils.heriteDe(sujet.classe, EClasseRacine.element)) {
      console.error("calculerConjugaison > «", sujetStr, "» n’est pas un élément du jeu");
    }
    const personne = ((sujet as ElementJeu).nombre == Nombre.p || (sujet as ElementJeu).nombre == Nombre.tp) ? "3pp" : "3ps";

    // si temps avec auxiliaire c’est facile on doit juste conjuguer être/avoir puis ajouter le PP.
    // => on peut le traiter comme n’importe quel verbe régulier
    if (Conjugaison.tempsAvecAuxiliaire(modeTemps)) {
      verbeConjugue = Conjugaison.getConjugaigonVerbeRegulier(infinitifSansLeSe, modeTemps, personne, verbePronominal);
      // sinon il faut vraiment savoir conjuguer le verbe
    } else {
      // retrouver le verbe parmi les verbes irréguliers pris en charge
      let conjugaisonVerbeIrregulier = Conjugaison.getVerbeIrregulier(infinitifSansLeSe);
      // verbe trouvé parmi les irréguliers
      if (conjugaisonVerbeIrregulier) {
        // retrouver la forme demandée
        const cle = modeTemps + " " + personne;
        // forme trouvée
        if (conjugaisonVerbeIrregulier.has(cle)) {
          verbeConjugue = conjugaisonVerbeIrregulier.get(cle);
          // forme pas trouvée
        } else {
          verbeConjugue = "(forme pas prise en charge : " + verbe + ": " + cle + ")";
        }
        // verbe pas trouvé => verbe régulier
      } else {
        verbeConjugue = Conjugaison.getConjugaigonVerbeRegulier(infinitifSansLeSe, modeTemps, personne, verbePronominal);
      }
    }


    let verbeDecoupe = verbeConjugue.split(" ", 2);

    // tenir compte du se/s’
    if (verbePronominal) {
      let se: string = null;
      if (ExprReg.xCommenceParUneVoyelle.test(verbeConjugue)) {
        se = "s’";
      } else {
        se = "se ";
      }
      // se avec négation
      if (negation) {
        // temps simple
        if (verbeDecoupe.length == 1) {
          verbeConjugue = "ne " + se + verbeConjugue + " " + negation;
          // temps composé
        } else {
          verbeConjugue = "ne " + se + verbeDecoupe[0] + " " + negation + " " + verbeDecoupe[1];
        }
        // se sans négation
      } else {
        verbeConjugue = se + verbeConjugue;
      }
      // pas de se/s’
    } else {
      // ajouter la négation (sans se)
      if (negation) {
        let ne: string = null;
        if (ExprReg.xCommenceParUneVoyelle.test(verbeConjugue)) {
          ne = "n’";
        } else {
          ne = "ne ";
        }
        // temps simple
        if (verbeDecoupe.length == 1) {
          verbeConjugue = ne + verbeConjugue + " " + negation;
          // temps composé
        } else {
          verbeConjugue = ne + verbeDecoupe[0] + " " + negation + " " + verbeDecoupe[1];
        }
      }
    }

    return verbeConjugue;
  }

  public calculerBalise(texteDynamique: string, nbAffichage: number, intact: boolean | undefined, ctxTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined) {
    if (!texteDynamique.includes("[")) return texteDynamique;

    const pipeline: Array<(t: string) => string> = [
      t => this.apercuStatut.calculerBaliseApercu(t, ctxTour, evenement, declenchements),
      t => this.apercuStatut.calculerBaliseStatut(t, ctxTour),
      t => this.contenu.calculerBaliseListerDecrireContenu(t, ctxTour, evenement),
      t => this.contenu.calculerBaliseListerDecrireListe(t, ctxTour, evenement),
      t => this.contenu.calculerBaliseObstacle(t, ctxTour),
      t => this.contenu.calculerBaliseSortiesTitre(t),
      t => this.apercuStatut.calculerBaliseAide(t, ctxTour),
      t => this.propriete.calculerBalisePropriete(t, ctxTour, evenement),
      t => this.propriete.calculerBaliseP(t, ctxTour, evenement, declenchements),
      t => this.numerique.calculerBaliseCompteur(t, evenement),
      t => this.numerique.calculerBaliseCalendrier(t),
      t => this.numerique.calculerBaliseHorloge(t),
      t => this.numerique.calculerBaliseMémoire(t, ctxTour),
      t => this.format.calculerBaliseVerbe(t, ctxTour, evenement),
      t => this.format.calculerBaliseImage(t),
      t => this.format.calculerBaliseHashtag(t, ctxTour),
      t => this.format.calculerBaliseInfinitifAction(t, evenement),
      t => this.calculerBaliseNombreDeProprieteDe(t, ctxTour, evenement, declenchements),
      t => this.calculerBaliseNombreDeClasseEtatPosition(t, ctxTour, evenement, declenchements),
      t => this.calculerBaliseProprieteDeElement(t, ctxTour, evenement, declenchements),
      t => this.calculerBaliseProprieteElement(t, ctxTour, evenement, declenchements),
    ];

    for (const fn of pipeline) {
      texteDynamique = fn(texteDynamique);
    }

    return texteDynamique;
  }

  private calculerBaliseNombreDeProprieteDe(t: string, ctxTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined): string {
    const x = /\[(le )?nombre (de |d\u2019|d’)(\S+) (des |du |de la |de l(?:’|’)|de |d’|d\u2019)(\S+?|(\S+? (à |en |au(x)? |de (la |l’|l\u2019)?|du |des |d’|d\u2019)\S+?))( (?!\(|(ne|n\u2019|n’|d\u2019|d’|et|ou|soit|mais|un|de|du|dans|sur|avec|se|s\u2019|s’)\b)(\S+?))?\]/gi;
    if (!x.test(t)) return t;
    return this.suiteTraiterPropriete(t, t.match(x), false, ctxTour, evenement, declenchements);
  }

  private calculerBaliseNombreDeClasseEtatPosition(t: string, ctxTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined): string {
    const x = /\[(le )?nombre (de |d\u2019|d’)(\S+)( (?!\(|(ne|n\u2019|n’|d\u2019|d’|et|ou|soit|mais|un|de|du|dans|sur|avec|se|s\u2019|s’)\b)(\S+))?(( (et )?)(?!\(|(ne|n\u2019|n’|d\u2019|d’|et|ou|soit|mais|un|de|du|dans|sur|avec|se|s\u2019|s’)\b)(\S+))?( ((dans |sur |sous )(la |le |les |l\u2019|l’)?)(\S+?|(?:\S+? (à |en |au(x)? |de (la |l’|l\u2019)?|du |des |d’|d\u2019)\S+?))( (?!\(|(?:(?:ne|et|ou|soit|mais|un|de|du|dans|sur|avec|concernant|se)\b)|(?:d\u2019|d’|n\u2019|n’|s\u2019|s’|à))(\S+?))?)?\]/gi;
    if (!x.test(t)) return t;
    return this.suiteTraiterPropriete(t, t.match(x), false, ctxTour, evenement, declenchements);
  }

  private calculerBaliseProprieteDeElement(t: string, ctxTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined): string {
    const x = /\[(le |la |les |l’|l\u2019)?(?!(v|p|le|la|les|l’|l\u2019|si|sinon|sinonsi|ou|au|en|fin|puis|initialement|(([1-9][0-9]?)(?:e|eme|ème|ere|ère|re)))\b)(\S+?) (des |du |de la |de l(?:’|’)|de |d’|d\u2019)(\S+?|(\S+? (à |en |au(x)? |de (la |l’|l\u2019)?|du |des |d’|d\u2019)\S+?))( (?!\(|(ne|n\u2019|n’|d\u2019|d’|et|ou|un|de|du|dans|sur|avec|se|s\u2019|s’)\b)(\S+?))?\]/gi;
    if (!x.test(t)) return t;
    return this.suiteTraiterPropriete(t, t.match(x), false, ctxTour, evenement, declenchements);
  }

  private calculerBaliseProprieteElement(t: string, ctxTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined): string {
    const x = /\[(?!(v|p|le|la|les|l’|l\u2019|si|sinon|sinonsi|ou|au|en|fin|puis|initialement|(([1-9][0-9]?)(?:e|eme|ème|ere|ère|re)))\b)(\S+?) (\S+?|(\S+? (à |en |au(x)? |de (la |l’|l\u2019)?|du |des |d’|d\u2019)\S+?))( (?!\(|(ne|n\u2019|n’|d\u2019|d’|et|ou|un|de|du|dans|sur|avec|se|s\u2019|s’|si|sinon|sinonsi|au|en|fin|puis|initialement)\b)(\S+?))?\]/gi;
    if (!x.test(t)) return t;
    return this.suiteTraiterPropriete(t, t.match(x), true, ctxTour, evenement, declenchements);
  }

  // ============================================================
  // Méthodes privées — balises extraites de calculerBalise
  // ============================================================
  /** Afficher la fiche d’aide. */

  /**
   * Lister le contenu d'un objet ou d'un lieu.
   * Remarque: le contenu invisible n'est pas affiché.
   */
  public executerListerContenu(ceci: ElementJeu, afficherObjetsCachesDeCeci: boolean, afficherObjetsNonVisiblesDeCeci: boolean, afficherObjetsDiscretsDeCeci: boolean, afficherObjetsSecretsDeCeci: boolean, afficherObjetsDansSurSous: boolean, inclureJoueur: boolean, prepositionSpatiale: PrepositionSpatiale, idElementsDejaMentionnes: number[], retrait: number = 1): Resultat {

    let resultat = new Resultat(false, '', 1);
    const objets = this.eju.trouverContenu(ceci, afficherObjetsCachesDeCeci, afficherObjetsNonVisiblesDeCeci, afficherObjetsDiscretsDeCeci, afficherObjetsSecretsDeCeci, afficherObjetsDansSurSous, inclureJoueur, prepositionSpatiale);

    // si la recherche n’a pas retourné d’erreur
    if (objets !== undefined) {
      resultat.succes = true;

      // AFFICHER LES ÉLÉMENTS DIRECTS
      const nbObjets = objets.length;
      if (nbObjets > 0) {
        let curObjIndex = 0;
        objets.forEach(obj => {
          ++curObjIndex;
          resultat.sortie += "\n " + InstructionDire.getRetrait(retrait) + (retrait <= 1 ? "- " : "> ") + this.eju.calculerIntituleElement(obj, false, false);

          // l’objet a été mentionné et vu par le joueur
          this.jeu.etats.ajouterEtatElement(obj, EEtatsBase.vu, this.eju, false);
          idElementsDejaMentionnes.push(obj.id);

          // ajouter « (porté) » aux objets portés
          if (this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.enfileID)) {
            resultat.sortie += " (" + this.jeu.etats.obtenirIntituleEtatPourElementJeu(obj, this.jeu.etats.enfileID) + ")";
          } else if (this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.chausseID)) {
            resultat.sortie += " (" + this.jeu.etats.obtenirIntituleEtatPourElementJeu(obj, this.jeu.etats.chausseID) + ")";
          } else if (this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.equipeID)) {
            resultat.sortie += " (" + this.jeu.etats.obtenirIntituleEtatPourElementJeu(obj, this.jeu.etats.equipeID) + ")";
          } else if (this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.porteID)) {
            resultat.sortie += " (" + this.jeu.etats.obtenirIntituleEtatPourElementJeu(obj, this.jeu.etats.porteID) + ")";
          }
          // ajouter « contenu » des contenants ouverts ou transparents
          // S’IL S’AGIT D’UN CONTENANT
          if (ClasseUtils.heriteDe(obj.classe, EClasseRacine.contenant)) {
            // si le contenant est fermé => (fermé)
            if (this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.fermeID)) {
              resultat.sortie += " (fermé" + (obj.genre == Genre.f ? 'e' : '') + (obj.nombre == Nombre.p || obj.nombre == Nombre.tp ? 's' : '') + ")";
            }

            // si on peut voir le contenu du contenant => contenu / (vide)
            if (this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.ouvertID) ||
              this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.transparentID)
            ) {
              let contenu = this.executerListerContenu(obj, false, false, false, false, false, false, prepositionSpatiale, idElementsDejaMentionnes, (retrait + 1)).sortie;
              if (contenu) {
                resultat.sortie += contenu;
              } else {
                resultat.sortie += " (vide" + (obj.nombre == Nombre.p || obj.nombre == Nombre.tp ? 's' : '') + ")";
              }
            }
          }

          // S’IL S’AGIT D’UN SUPPORT, AFFICHER LES ÉLÉMENTS POSITIONNÉS DESSUS
          if (ClasseUtils.heriteDe(obj.classe, EClasseRacine.support)) {

          }

        });

        // AFFICHER LES ÉLÉMENTS POSITIONNÉS SUR DES SUPPORTS
        let supportsSansApercu = objets.filter(x => ClasseUtils.heriteDe(x.classe, EClasseRacine.support));
        supportsSansApercu.forEach(support => {
          // ne pas afficher les objets cachés du support (on ne l’examine pas directement)
          const sousRes = this.executerListerContenu(support, false, false, false, false, false, false, PrepositionSpatiale.sur, idElementsDejaMentionnes);
          resultat.sortie += sousRes.sortie;
        });

      }

    }
    return resultat;
  }

  /**
   * Énumérer le contenu d'un objet ou d'un lieu sous forme de mots séparés par des virgules.
   * Retourne une chaîne vide si le contenant est vide (intégrable dans une phrase).
   */
  public executerEnumererContenu(ceci: ElementJeu, afficherObjetsCachesDeCeci: boolean, prepositionSpatiale: PrepositionSpatiale, idElementsDejaMentionnes: number[]): Resultat {
    const resultat = new Resultat(false, '', 1);
    const objets = this.eju.trouverContenu(ceci, afficherObjetsCachesDeCeci, false, false, false, false, false, prepositionSpatiale);
    if (objets !== undefined) {
      resultat.succes = true;
      const nbObjets = objets.length;
      for (let i = 0; i < nbObjets; i++) {
        const obj = objets[i];
        const intitule = this.eju.calculerIntituleElement(obj, false, false);
        this.jeu.etats.ajouterEtatElement(obj, EEtatsBase.vu, this.eju, false);
        idElementsDejaMentionnes.push(obj.id);
        if (i === 0) {
          resultat.sortie += intitule;
        } else if (i === nbObjets - 1) {
          resultat.sortie += " et " + intitule;
        } else {
          resultat.sortie += ", " + intitule;
        }
      }
    }
    return resultat;
  }

  /**
   * Retourner un retrait de la taille spécifiée.
   */
  private static getRetrait(retrait: number): string {
    let retVal = "";
    for (let index = 0; index < retrait; index++) {
      retVal += "{r}";
    }
    return retVal;
  }

  /**
   * Décrire le contenu d'un objet ou d'un lieu.
   * Remarque: le contenu invisible n'est pas affiché.
   */
  public executerDecrireContenu(ceci: ElementJeu, texteSiQuelqueChose: string, texteSiRien: string, afficherObjetsCachesDeCeci: boolean, afficherObjetsNonVisiblesDeCeci: boolean, afficherObjetsDiscretsDeCeci: boolean, afficherObjetsSecretsDeCeci: boolean, afficherObjetsDansSurSous: boolean, inclureJoueur: boolean, prepositionSpatiale: PrepositionSpatiale, idElementsDejaMentionnes: number[]): Resultat {
    let resultat = new Resultat(false, '', 1);
    const objets = this.eju.trouverContenu(ceci, afficherObjetsCachesDeCeci, afficherObjetsNonVisiblesDeCeci, afficherObjetsDiscretsDeCeci, afficherObjetsSecretsDeCeci, afficherObjetsDansSurSous, inclureJoueur, prepositionSpatiale);

    // TODO: ne pas décrire à nouveau les objets qui ont déjà été mentionnés précédemment dans le même texte. ([# nom de l’objet])

    // si la recherche n’a pas retourné d’erreur
    if (objets !== undefined) {
      resultat.succes = true;

      // - objets avec aperçu spécifique (n’inclure ni les éléments décoratifs, ni les éléments discrets, ni les éléments déjà décrits):
      let objetsAvecApercuSpecifique = objets.filter(x => x.apercu !== null && !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID) && !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.discretID) && !idElementsDejaMentionnes.includes(x.id));
      // const nbObjetsAvecApercus = objetsAvecApercu.length;
      // - objets avec apercu auto (n’inclure ni les éléments décoratifs, ni les éléments discrets, ni les éléments déjà décrits)
      let objetsAvecApercuAuto = objets.filter(x => x.apercu === null && !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID) && !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.discretID) && !idElementsDejaMentionnes.includes(x.id));
      // - nombre d’objets avec aperçu auto (n’inclure ni les éléments décoratifs ni les éléments déjà décrits)
      let nbObjetsApercuAuto = objetsAvecApercuAuto.length;
      // - nombre d’objets sans aperçu (càd les objets décoratifs ou ceux qui ont déjà été cités)
      let nbObjetsSansApercu = objets.filter(x => this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID) || this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.discretID) || idElementsDejaMentionnes.includes(x.id)).length;

      // - supports décoratifs (eux ne sont pas affichés, mais leur contenu bien !)
      let supportsDecoratifs = objets.filter(x => this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID) && ClasseUtils.heriteDe(x.classe, EClasseRacine.support));

      // - objets discrets et mentionnés (ils ne sont pas affichés, mais ils sont vus !)
      let objetsDiscretsMentionnes = objets.filter(x => this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.discretID) || this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.mentionneID));

      objetsDiscretsMentionnes.forEach(obj => {
        this.jeu.etats.ajouterEtatElement(obj, EEtatsBase.vu, this.eju, false);
      });

      // A.1 AFFICHER ÉLÉMENTS AVEC UN APERÇU
      objetsAvecApercuSpecifique.forEach(obj => {
        const apercuCalcule = this.calculerTexteDynamique(obj.apercu, ++obj.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.intactID), undefined, undefined, undefined);
        // l’objet a été mentionné et vu par le joueur
        this.jeu.etats.ajouterEtatElement(obj, EEtatsBase.vu, this.eju, false);
        idElementsDejaMentionnes.push(obj.id);
        // si l'aperçu n'est pas vide, l'ajouter.
        if (apercuCalcule) {
          // ignorer les objets dont l'aperçu vaut "-"
          if (apercuCalcule == '-') {
            nbObjetsSansApercu += 1;
          } else {
            resultat.sortie += "{U}" + apercuCalcule;
            // B.2 SI C’EST UN SUPPORT, AFFICHER SON CONTENU (VISIBLE et NON Caché)
            // (uniquement si option activée)
            if (this.jeu.parametres.activerDescriptionDesObjetsSupportes) {
              if (ClasseUtils.heriteDe(obj.classe, EClasseRacine.support)) {
                // enlever le retour à la ligne auto
                if (resultat.sortie.endsWith('{N}')) {
                  resultat.sortie = resultat.sortie.slice(0, resultat.sortie.length - '{N}'.length);
                }
                // ne pas afficher objets cachés du support, on ne l’examine pas directement
                const sousRes = this.executerDecrireContenu(obj, (" Dessus, il y a "), "", false, false, false, false, false, false, PrepositionSpatiale.sur, idElementsDejaMentionnes);
                resultat.sortie += sousRes.sortie;
              }
            }
          }
          // si l'aperçu est vide, ajouter l'objets à la liste des objets sans aperçu.
        } else {
          objetsAvecApercuAuto.push(obj);
          nbObjetsApercuAuto += 1;
          // (rem: l’objet sera vu lors de l’aperçu auto ci-dessous)
        }
      });

      // B. AFFICHER LES ÉLÉMENTS POSITIONNÉS SUR DES SUPPORTS DÉCORATIFS
      // (uniquement si option activée)
      if (this.jeu.parametres.activerDescriptionDesObjetsSupportes) {
        supportsDecoratifs.forEach(support => {
          // ne pas afficher les objets cachés du support (on ne l’examine pas directement)
          const sousRes = this.executerDecrireContenu(support, ("{U}Sur " + this.eju.calculerIntituleElement(support, false, true) + " il y a "), "", false, false, false, false, false, false, PrepositionSpatiale.sur, idElementsDejaMentionnes);
          resultat.sortie += sousRes.sortie;
        });
      }

      // C.1 AFFICHER ÉLÉMENTS SANS APERÇU
      if (nbObjetsApercuAuto > 0) {
        resultat.sortie += texteSiQuelqueChose;
        let curObjIndex = 0;
        objetsAvecApercuAuto.forEach(obj => {
          ++curObjIndex;
          // l’objet a été mentionné et vu par le joueur
          this.jeu.etats.ajouterEtatElement(obj, EEtatsBase.vu, this.eju, false);
          idElementsDejaMentionnes.push(obj.id);
          // ajouter l’intitulé de l’objet à la liste
          resultat.sortie += this.eju.calculerIntituleElement(obj, false, false);
          if (curObjIndex < (nbObjetsApercuAuto - 1)) {
            resultat.sortie += ", ";
          } else if (curObjIndex == (nbObjetsApercuAuto - 1)) {
            resultat.sortie += " et ";
          } else {
            resultat.sortie += ".";
          }
        });

        // C.2 AFFICHER LES ÉLÉMENTS POSITIONNÉS SUR DES SUPPORTS
        // (uniquement si option activée)
        if (this.jeu.parametres.activerDescriptionDesObjetsSupportes) {
          // s’il n’y a qu’un seul objet avec aperçu auto
          if (objetsAvecApercuAuto.length == 1) {
            // s’il s’agit d’un support
            if (ClasseUtils.heriteDe(objetsAvecApercuAuto[0].classe, EClasseRacine.support)) {
              // ne pas afficher les objets cachés du support (on ne l’examine pas directement)
              const sousRes = this.executerDecrireContenu(objetsAvecApercuAuto[0], (" Dessus, il y a "), ("{U}Il n'y a rien de particulier dessus."), false, false, false, false, false, false, PrepositionSpatiale.sur, idElementsDejaMentionnes);
              resultat.sortie += sousRes.sortie;
            }
            // sinon il y en a plusieurs
          } else {
            let supportsAvecApercuAuto = objetsAvecApercuAuto.filter(x => ClasseUtils.heriteDe(x.classe, EClasseRacine.support));
            supportsAvecApercuAuto.forEach(support => {
              // ne pas afficher les objets cachés du support (on ne l’examine pas directement)
              const sousRes = this.executerDecrireContenu(support, ("{U}Sur " + this.eju.calculerIntituleElement(support, false, true) + " il y a "), ("{U}Il n'y a rien de particulier sur " + this.eju.calculerIntituleElement(support, false, true) + "."), false, false, false, false, false, false, PrepositionSpatiale.sur, idElementsDejaMentionnes);
              resultat.sortie += sousRes.sortie;
            });
          }
        }
      }

      // D. AFFICHER LES PORTES ET LES OBSTACLES SI C'EST UN LIEU
      if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {

        const curLieu: Lieu = ceci as Lieu;
        curLieu.voisins.forEach(voisin => {
          if (voisin.type == EClasseRacine.porte || voisin.type == EClasseRacine.obstacle) {
            // vérifier si l’obstacle/porte est visible
            const curPorteObstacle = this.eju.getObjet(voisin.id);
            if (this.jeu.etats.estVisible(curPorteObstacle, this.eju) && !this.jeu.etats.possedeEtatIdElement(curPorteObstacle, this.jeu.etats.discretID) && !idElementsDejaMentionnes.includes(curPorteObstacle.id)) {
              // décrire l’obstacle
              // - l’objet a été mentionné et vu par le joueur
              this.jeu.etats.ajouterEtatElement(curPorteObstacle, EEtatsBase.vu, this.eju, false);
              // - si aperçu défini
              if (curPorteObstacle.apercu) {
                // afficher l'aperçu.
                if (curPorteObstacle.apercu != '-') {
                  resultat.sortie += "{U}" + this.calculerTexteDynamique(curPorteObstacle.apercu, ++curPorteObstacle.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(curPorteObstacle, this.jeu.etats.intactID), undefined, undefined, undefined);
                } else {
                  // TODO: faut-il considérer qu’un objet est vu quand son aperçu est « - » ?
                }
                // - si pas d’aperçu défini
              } else {
                // porte
                if (ClasseUtils.heriteDe(curPorteObstacle.classe, EClasseRacine.porte)) {
                  // par défaut, afficher le nom de la porte et ouvert/fermé.
                  resultat.sortie += "{U}" + ElementsJeuUtils.calculerIntituleGenerique(curPorteObstacle, true) + (curPorteObstacle.nombre == Nombre.p || curPorteObstacle.nombre == Nombre.tp ? " sont " : " est ");
                  if (this.jeu.etats.possedeEtatIdElement(curPorteObstacle, this.jeu.etats.ouvertID)) {
                    resultat.sortie += this.jeu.etats.obtenirIntituleEtatPourElementJeu(curPorteObstacle, this.jeu.etats.ouvertID)
                  } else {
                    resultat.sortie += this.jeu.etats.obtenirIntituleEtatPourElementJeu(curPorteObstacle, this.jeu.etats.fermeID)
                  }
                  resultat.sortie += ".";
                  // obstacle
                } else {
                  resultat.sortie += "{U}" + ElementsJeuUtils.calculerIntituleGenerique(curPorteObstacle, true) + (curPorteObstacle.nombre == Nombre.p || curPorteObstacle.nombre == Nombre.tp ? " bloquent" : " bloque") + " la sortie (" + Localisation.getLocalisation(voisin.localisation) + ").";
                }

              }
            }
          }
        });
      }

      // si on n’a encore rien affiché, afficher le texte spécifique
      if (!resultat.sortie) {
        if (nbObjetsSansApercu == 0) {
          resultat.sortie = texteSiRien;
        }
      }
    }
    return resultat;
  }

  /** Afficher le statut d'une porte ou d'un contenant (verrouillé, ouvrable, ouvert, fermé) */
  public afficherObstacle(direction: Lieu | ELocalisation, texteSiAucunObstacle = "(aucun obstacle)") {
    let retVal: string = texteSiAucunObstacle;

    let loc: Localisation | ELocalisation = null;

    // si la direction est un lieu
    if (direction instanceof Lieu) {
      // chercher la direction vers ce lieu
      let voisin = this.eju.curLieu.voisins.find(x => x.type == EClasseRacine.lieu && x.id == (direction as Lieu).id);
      loc = voisin.localisation;
      // sinon c’est directement une direction
    } else {
      loc = direction;
      // cas particulier : si le joueur utilise entrer/sortir quand une seule sortie visible, aller dans la direction de cette sortie
      if (direction == ELocalisation.exterieur /*|| direction == ELocalisation.interieur*/) {
        const lieuxVoisinsVisibles = this.eju.getLieuxVoisinsVisibles(this.eju.curLieu);
        if (lieuxVoisinsVisibles.length == 1) {
          loc = lieuxVoisinsVisibles[0].localisation;
        }
        // cas normal
      }
    }

    // trouver l’obstacle (autre que porte) qui est dans le chemin
    const obstacleID = this.eju.getVoisinDirectionID(loc, EClasseRacine.obstacle);
    if (obstacleID !== -1) {
      const obstacle = this.eju.getObjet(obstacleID);
      // si aperçu disponible pour l’obstacle, on l’affiche.
      if (obstacle.apercu) {
        retVal = this.calculerTexteDynamique(obstacle.apercu, ++obstacle.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(obstacle, this.jeu.etats.intactID), undefined, undefined, undefined);
        // l’objet a été mentionné et vu par le joueur
        this.jeu.etats.ajouterEtatElement(obstacle, EEtatsBase.vu, this.eju, false);
        // TODO: faut-il considéré que l’objet a déjà été mentionné ici ?
        // => idElementsDejaMentionnes.push(obstacle.id);
        // sinon on affiche texte auto.
      } else {
        retVal = ElementsJeuUtils.calculerIntituleGenerique(obstacle, true) + (obstacle.nombre == Nombre.p || obstacle.nombre == Nombre.tp ? " sont" : " est") + " dans le chemin.";
      }
    } else {
      // trouver la porte qui est dans le chemin
      const porteID = this.eju.getVoisinDirectionID(loc, EClasseRacine.porte);
      if (porteID !== -1) {
        const porte = this.eju.getObjet(porteID);
        const ouvert = this.jeu.etats.possedeEtatIdElement(porte, this.jeu.etats.ouvertID);
        const invisible = this.jeu.etats.possedeEtatIdElement(porte, this.jeu.etats.invisibleID);
        if (ouvert) {
          retVal = texteSiAucunObstacle;
        } else {
          if (invisible) {
            retVal = 'Je ne vois pas comment y accéder.';
          } else {
            retVal = ElementsJeuUtils.calculerIntituleGenerique(porte, true) + ` est fermé${porte.genre == Genre.f ? 'e' : ''}.`;
          }
        }
      }
    }

    return retVal;
  }

  /**
   * Afficher les sorties du lieu spécifié.
   */
  afficherSorties(lieu: Lieu): string {
    let retVal: string;

    if (lieu) {
      if (this.jeu.parametres.activerAffichageSorties) {
        // retrouver les voisins visibles
        const lieuxVoisinsVisibles = this.eju.getLieuxVoisinsVisibles(lieu);

        if (lieuxVoisinsVisibles.length > 0) {
          retVal = "Sorties : ";
          // afficher les voisins : directions + lieux
          if (this.jeu.parametres.activerAffichageDirectionSorties) {
            const premier = 0;
            const dernier = lieuxVoisinsVisibles.length - 1;

            lieuxVoisinsVisibles.forEach(lieuVoisinVisible => {
              retVal += ("{n}{i}- " + this.afficherLieuVoisinEtLocalisation(lieuVoisinVisible.localisation, lieu.id, lieuVoisinVisible.id, this.jeu.parametres.activerAffichageLieuxInconnus));
            });

            // afficher les voisins: lieux
          } else {

            if (this.jeu.parametres.activerSortiesEnLigne) {
              for (let index = 0; index < lieuxVoisinsVisibles.length; index++) {
                const lieuVoisinVisible = lieuxVoisinsVisibles[index];
                // premier
                if (index == 0) {
                  retVal += (this.afficherLieuVoisin(lieuVoisinVisible.localisation, lieu.id, lieuVoisinVisible.id, false));
                  // dernier (si plusieurs)
                } else if (index == lieuxVoisinsVisibles.length - 1) {
                  retVal += " et " + (this.afficherLieuVoisin(lieuVoisinVisible.localisation, lieu.id, lieuVoisinVisible.id, false)) + ".";
                  // milieu
                } else {
                  retVal += ", " + (this.afficherLieuVoisin(lieuVoisinVisible.localisation, lieu.id, lieuVoisinVisible.id, false));
                }
              }
            } else {
              lieuxVoisinsVisibles.forEach(voisinVisible => {
                retVal += ("{n}{i}- " + this.afficherLieuVoisin(voisinVisible.localisation, lieu.id, voisinVisible.id, true));
              });
            }
          }

        } else {
          retVal = "Il n’y a pas de sortie.";
        }
      } else {
        retVal = "";
      }
    } else {
      retVal = "";
    }
    return retVal;
  }

  private afficherLieuVoisin(localisation: ELocalisation, curLieuIndex: number, voisinIndex: number, majuscule: boolean) {
    let retVal: string = null;
    let lieu = this.eju.getLieu(voisinIndex);
    let titreLieu = majuscule ? lieu.titre : lieu.intitule;
    let obstacle = this.jeu.parametres.activerAffichageObstacles ? this.afficherObstacle(localisation, "") : "";
    if (obstacle) {
      if (this.bloqueParPorteFermeeEtInvisible(localisation)) {
        obstacle = " ({/pas d'accès/})";
      } else {
        obstacle = " ({/obstrué/})";
      }
    }
    retVal = titreLieu + obstacle;
    return retVal;
  }

  private bloqueParPorteFermeeEtInvisible(localisation: ELocalisation): boolean {
    let retVal = false;
    const porteID = this.eju.getVoisinDirectionID(localisation, EClasseRacine.porte);
    if (porteID !== -1) {
      const porte = this.eju.getObjet(porteID);
      const fermee = this.jeu.etats.possedeEtatIdElement(porte, this.jeu.etats.fermeID);
      const invisible = this.jeu.etats.possedeEtatIdElement(porte, this.jeu.etats.invisibleID);
      retVal = fermee && invisible;
    } else {
      retVal = false;
    }
    return retVal;
  }

  private afficherLieuVoisinEtLocalisation(localisation: ELocalisation, curLieuIndex: number, voisinIndex: number, afficherLieuxInconnus: boolean): string {
    let retVal: string = null;
    let lieu = this.eju.getLieu(voisinIndex);
    let titreLieu = lieu.titre;
    let obstacle = this.jeu.parametres.activerAffichageObstacles ? this.afficherObstacle(localisation, "") : "";

    if (obstacle) {
      if (this.bloqueParPorteFermeeEtInvisible(localisation)) {
        obstacle = " ({/pas d’accès/})";
      } else {
        obstacle = " ({/obstrué/})";
      }
    }

    let lieuDejaVisite = this.jeu.etats.possedeEtatIdElement(lieu, this.jeu.etats.visiteID);
    const localisationMap = {
      [ELocalisation.nord]: "nord",
      [ELocalisation.nord_est]: "nord-est",
      [ELocalisation.est]: "est",
      [ELocalisation.sud_est]: "sud-est",
      [ELocalisation.sud]: "sud",
      [ELocalisation.sud_ouest]: "sud-ouest",
      [ELocalisation.ouest]: "ouest",
      [ELocalisation.nord_ouest]: "nord-ouest",
      [ELocalisation.haut]: "monter",
      [ELocalisation.bas]: "descendre",
      [ELocalisation.interieur]: "entrer",
      [ELocalisation.exterieur]: "sortir"
    };

    const locString = localisationMap[localisation];
    if (locString) {
      retVal = `${locString} : ${(lieuDejaVisite || afficherLieuxInconnus || locString.match(/^monter|descendre|entrer$/)) ? `{+${titreLieu}+}` : '?'}` + obstacle;
    } else {
      retVal = localisation.toString();
    }

    return retVal;
  }


}