import { ProprieteJeu, TypeProprieteJeu } from '../../models/jeu/propriete-jeu';

import { CandidatCommande } from '../../models/jouer/candidat-commande';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Evenement } from '../../models/jouer/evenement';
import { ExprReg } from '../compilation/expr-reg';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { PositionObjet } from '../../models/jeu/position-objet';
import { RechercheUtils } from './recherche-utils';
import { TypeEvenement } from '../../models/jouer/type-evenement';

export class PhraseUtils {

  public static getEvenementsRegle(evenementsBruts: string) {
    // découper les attributs, les séparateurs possibles sont «, », et « ou ».
    const evenementsSepares = PhraseUtils.separerListeIntitulesOu(evenementsBruts, true);
    let retVal: Evenement[] = [];
    evenementsSepares.forEach(evenementBrut => {
      // A) TESTER S’IL S’AGIT D’UNE COMMANDE
      let els = PhraseUtils.decomposerCommande(evenementBrut.trim());
      // si on a trouvé une formulation correcte
      if (els) {
        const isCeci = els.sujet ? true : false;
        const ceci = els.sujet;
        const ceciNom = (isCeci ? RechercheUtils.transformerCaracteresSpeciauxEtMajuscules((ceci.determinant?.match(/un(e)? /) ? ceci.determinant : '') + ceci.nom + (ceci.epithete ? (" " + ceci.epithete) : "")).trim() : null);
        const ceciClasse = null;
        const prepCeci = els.preposition0;
        const quantiteCeci = 0;

        const isCela = els.sujetComplement1 ? true : false;
        const cela = els.sujetComplement1;
        const celaNom = (isCela ? RechercheUtils.transformerCaracteresSpeciauxEtMajuscules((cela.determinant?.match(/un(e)? /) ? cela.determinant : '') + cela.nom + (cela.epithete ? (" " + cela.epithete) : "")).trim() : null);
        const celaClasse = null;
        const prepCela = els.preposition1;
        const quantiteCela = 0;

        let ev = new Evenement(
          TypeEvenement.action,
          // verbe
          els.infinitif,
          // ceci
          isCeci, prepCeci, quantiteCeci, ceciNom, ceciClasse,
          // cela
          isCela, prepCela, quantiteCela, celaNom, celaClasse,
        );

        retVal.push(ev);

        // B) TESTER S’IL S’AGIT D’UNE RÈGLE GÉNÉRIQUE (IMPLIQUANT UN ÉLÉMENT PARTICULIER)
      } else {
        // règle générique pour « une action impliquant X [et Y] »
        const actImp = ExprReg.rActionImpliquant.exec(evenementBrut.trim());

        if (actImp) {
          const ceci = PhraseUtils.getGroupeNominalDefini(actImp[1], false);
          const isCeci = true;
          const ceciNom = (isCeci ? RechercheUtils.transformerCaracteresSpeciauxEtMajuscules((ceci.determinant?.match(/un(e)? /) ? ceci.determinant : '') + ceci.nom + (ceci.epithete ? (" " + ceci.epithete) : "")).trim() : null);
          const ceciClasse = null;
          const prepCeci = null;
          const quantiteCeci = 0;

          const cela = PhraseUtils.getGroupeNominalDefini(actImp[2], false);
          const isCela = cela ? true : false;
          const celaNom = (isCela ? RechercheUtils.transformerCaracteresSpeciauxEtMajuscules((cela.determinant?.match(/un(e)? /) ? cela.determinant : '') + cela.nom + (cela.epithete ? (" " + cela.epithete) : "")).trim() : null);
          const celaClasse = null;
          const prepCela = null;
          const quantiteCela = 0;

          let ev = new Evenement(
            TypeEvenement.action,
            // verbe
            null,
            // ceci
            isCeci, prepCeci, quantiteCeci, ceciNom, ceciClasse,
            // cela
            isCela, prepCela, quantiteCela, celaNom, celaClasse,
          );

          retVal.push(ev);

          // C) TESTER S’IL S’AGIT D’UNE RÈGLE GÉNÉRIQUE (ACTION QUELCONQUE)
        } else {
          // règle générique pour « une action quelconque »
          if (ExprReg.rActionQuelconque.test(evenementBrut.trim())) {
            let ev = new Evenement(TypeEvenement.action, null);
            retVal.push(ev);
            // D) DÉPLACEMENT VERS X
          } else {
            const deplacement = ExprReg.rDelpacementVers.exec(evenementBrut.trim());
            if (deplacement) {
              let ev = new Evenement(
                TypeEvenement.deplacement,
                // verbe => direction ou lieu
                deplacement[1]
              );

              retVal.push(ev);
              // E) FORMULATION INCONNUE
            } else {
              console.warn("getEvenements >> pas pu décomposer événement:", evenementBrut);
            }
          }
        }
      }
    });
    return retVal;
  }

  /** Obtenir une liste de nombres sur base d'une chaîne de textes séparés par des "," et un "ou" 
 * @param intitulesString texte à séparer sur les virgules et les et.
 * @param autoriserVirguleEtOu autoriser ", ou" et ",ou"
 */
  public static separerListeNombresEntiers(nombresString: string, autoriserVirguleOu: boolean): number[] {
    if (nombresString && nombresString.trim() !== '') {
      let listeNombresEntiersString: string[];
      // découper les attributs, les séparateurs possibles sont «, », « et » et « ou ».
      if (autoriserVirguleOu) {
        listeNombresEntiersString = nombresString.trim().split(/(?:",ou "|", ou "|", "|" ou ")+/);
      } else {
        listeNombresEntiersString = nombresString.trim().split(/(?:", "|" ou ")+/);
      }
      let listeNombresEntiers = new Array<number>();
      listeNombresEntiersString.forEach(nombreEntierString => {
        const nombreEntier = Number.parseInt(nombreEntierString);
        if (nombreEntier) {
          listeNombresEntiers.push(nombreEntier);
        } else {
          throw new Error("separerListeNombresEntiers: pas pu retrouver le nombre suivant:" + nombreEntierString);
        }
      });
      return listeNombresEntiers;
    } else {
      return new Array<number>();
    }
  }

  /** Obtenir une liste de textes sur base d'une chaîne de textes séparés par des "," et un "ou".
   * Remarques : les textes sont entourés de guillemets.
   * @param intitulesString texte à séparer sur les virgules et les et.
   * @param autoriserVirguleEtOu autoriser ", ou" et ",ou"
   */
  public static separerListeTextesOu(attributsString: string, autoriserVirguleOu: boolean): string[] {
    if (attributsString && attributsString.trim() !== '') {
      let textes: string[] = [];
      // découper les attributs, les séparateurs possibles sont «, », « et » et « ou ».
      if (autoriserVirguleOu) {
        textes = attributsString.trim().split(/(?:"(?: )?(?:(?:,ou)|(?:, ou)|(?:,)|(?:ou))(?: )?")/);
      } else {
        textes = attributsString.trim().split(/(?:"(?: )?(?:(?:,)|(?:ou))(?: )?")/);
      }
      for (let index = 0; index < textes.length; index++) {
        let texteSansGuillemet = textes[index];
        // ajouter guillemet avant (sauf si premier élément de la liste)
        if (index > 0) {
          texteSansGuillemet = '"' + texteSansGuillemet;
        }
        // ajouter guillemet après (sauf si dernier élément de la liste)
        if (index < (textes.length - 1)) {
          texteSansGuillemet = texteSansGuillemet + '"';
        }
        textes[index] = texteSansGuillemet;
      }

      return textes;
    } else {
      return new Array<string>();
    }
  }

  /**
   * Obtenir une liste d’intitulés sur base d'une chaîne d’intitulés séparés par des "," et un "et"/"ou" 
   * @param intitulesString texte à séparer sur les virgules et les et/ou.
   * @param autoriserVirguleEtOu autoriser ", et", ",et" ", ou" et ",ou"
   */
  public static separerListeIntitulesEtOu(intitulesString: string, autoriserVirguleEtOu: boolean): string[] {
    if (intitulesString && intitulesString.trim() !== '') {
      // découper les attributs, les séparateurs possibles sont «, », « et » et « ou ».
      if (autoriserVirguleEtOu) {
        return intitulesString.trim().split(/(?:,et |,ou |, et |, ou |, | et | ou )+/);
      } else {
        return intitulesString.trim().split(/(?:, | et | ou )+/);
      }
    } else {
      return new Array<string>();
    }
  }

  /**
   * Obtenir une liste d’intitulés sur base d'une chaîne d’intitulés séparés par des "," et un "et"
   * @param intitulesString texte à séparer sur les virgules et les et.
   * @param autoriserVirguleEtOu autoriser ", et", et ",et" "
   */
  public static separerListeIntitulesEt(attributsString: string, autoriserVirguleEt: boolean): string[] {
    if (attributsString && attributsString.trim() !== '') {
      // découper les attributs, les séparateurs possibles sont «, » et « et »
      if (autoriserVirguleEt) {
        return attributsString.trim().split(/(?:,et |, et |, | et )+/);
      } else {
        return attributsString.trim().split(/(?:, | et )+/);
      }
    } else {
      return new Array<string>();
    }
  }

  /** Obtenir une liste d’intitulés sur base d'une chaîne d’intitulés séparés par des "," et un "ou" 
   * @param intitulesString texte à séparer sur les virgules et les et.
   * @param autoriserVirguleEtOu autoriser ", ou" et ",ou"
   */
  public static separerListeIntitulesOu(attributsString: string, autoriserVirguleOu: boolean): string[] {
    if (attributsString && attributsString.trim() !== '') {
      // découper les attributs, les séparateurs possibles sont «, », « et » et « ou ».
      if (autoriserVirguleOu) {
        return attributsString.trim().split(/(?:,ou |, ou |, | ou )+/);
      } else {
        return attributsString.trim().split(/(?:, | ou )+/);
      }
    } else {
      return new Array<string>();
    }
  }

  static obtenirLesCommandesPossibles(commande: string): CandidatCommande[] {

    let resultats: ElementsPhrase[] = [];

    // au cas où
    commande = commande.trim();

    // Forme attendue:
    // infinitif + complément direct + complément indirect

    // A) VÉRIFIER SI LA COMMANDE COMMENCE PAR UN INFINITIF
    // > Séparer l’infinitif (premier mot) du reste de la commande

    // si commence par se, il faudra prendre le 2e espace
    const commenceParSe = commande.match(/^(se|me)\b/i);
    const espaceApresVerbe = commande.indexOf(' ', (commenceParSe ? 3 : 0));
    const infinitifTrouve = (espaceApresVerbe != -1 ? commande.slice(0, espaceApresVerbe) : commande).toLocaleLowerCase();
    const commandeSansInfinitif = (espaceApresVerbe != -1 ? commande.slice(espaceApresVerbe + 1).trim() : undefined);

    // > Vérifier qu’il s’agit bien d’un infinitif
    if (infinitifTrouve.match(ExprReg.xVerbeInfinitif)) {

      let preposition0Trouvee: string | undefined;

      // s’il y a d’autres mots après l’infinitif
      if (commandeSansInfinitif?.trim().length) {

        // tester si le reste commence par une préposition
        const premierMotPreposition = ExprReg.xPremierMotPreposition.exec(commandeSansInfinitif);

        if (premierMotPreposition) {
          preposition0Trouvee = premierMotPreposition[1].trim();
        }
        const commandeSansPreposition0 = (preposition0Trouvee ? (commandeSansInfinitif.slice(preposition0Trouvee.length).trim()) : commandeSansInfinitif);

        // tester le nombre de prépositions potentielles dans le reste de la commande
        const nbPrepositionsTrouvees = (commandeSansPreposition0.match(ExprReg.xPrepositions) || []).length;

        // s’il n’y en a aucune, facile, il y a exactement 1 argument (c’est sûr):
        // - complément direct simple
        if (nbPrepositionsTrouvees == 0) {

          // trouver le complément direct simple
          const decoupeComplement = PhraseUtils.getGroupeNominalDefiniOuIndefini(commandeSansPreposition0, false);

          if (decoupeComplement) {
            let curPossibilite = new ElementsPhrase(infinitifTrouve);
            curPossibilite.preposition0 = preposition0Trouvee;
            curPossibilite.sujet = decoupeComplement;
            resultats.push(curPossibilite);
          } else {
            // console.error("obtenirLesCommandesPossibles > je m’attendais à un [complément direct simple] mais je ne l’ai pas trouvé.", commandeSansPreposition0);
          }


          // s’il y en a 1, c’est un cas ambigu car ça peut être:
          // - complément direct composé
          // - complément direct simple + préposition + complément indirect simple
        } else if (nbPrepositionsTrouvees == 1) {

          // CAS 1: complément direct composé
          // trouver le complément direct composé
          const decoupe1 = PhraseUtils.getGroupeNominalDefiniOuIndefini(commandeSansPreposition0, false);
          if (decoupe1) {
            const curPossibilite = new ElementsPhrase(infinitifTrouve);
            curPossibilite.preposition0 = preposition0Trouvee;
            curPossibilite.sujet = decoupe1;
            resultats.push(curPossibilite);
          } else {
            // console.error("obtenirLesCommandesPossibles > je m’attendais à un [complément direct composé] mais je ne l’ai pas trouvé.", commandeSansPreposition0);
          }

          // CAS 2: complément direct simple + préposition + complément indirect simple
          // découper le reste de la commande en 2 compléments simples
          const decoupe2 = ExprReg.xComplementSimplePrepositionComplementSimple.exec(commandeSansPreposition0);
          if (decoupe2) {
            const curPossibilite = new ElementsPhrase(infinitifTrouve);
            curPossibilite.preposition0 = preposition0Trouvee;
            curPossibilite.sujet = new GroupeNominal(decoupe2[1] ?? undefined, decoupe2[2], decoupe2[3] ?? undefined);
            curPossibilite.preposition1 = decoupe2[4];
            curPossibilite.sujetComplement1 = new GroupeNominal(decoupe2[5] ?? undefined, decoupe2[6], decoupe2[7] ?? undefined);
            resultats.push(curPossibilite);
          } else {
            // console.error("obtenirLesCommandesPossibles > je m’attendais à un [complément direct simple + préposition + complément indirect simple] mais je ne l’ai pas trouvé.", commandeSansPreposition0);
          }

          // s’il y en a 2, c’est un cas ambigu car ça peut être:
          // - complément direct simple + préposition + complément indirect composé
          // - complément direct composé + complément indirect simple
        } else if (nbPrepositionsTrouvees == 2) {

          // CAS 1: complément direct simple + préposition + complément indirect composé
          // découper le reste de la commande en 2 compléments simple et composé
          const decoupe1 = ExprReg.xComplementSimplePrepositionComplementCompose.exec(commandeSansPreposition0);
          if (decoupe1) {
            let curPossibilite = new ElementsPhrase(infinitifTrouve);
            curPossibilite.preposition0 = preposition0Trouvee;
            curPossibilite.sujet = new GroupeNominal(decoupe1[1] ?? undefined, decoupe1[2], decoupe1[3] ?? undefined);
            curPossibilite.preposition1 = decoupe1[4];
            curPossibilite.sujetComplement1 = new GroupeNominal(decoupe1[5] ?? undefined, decoupe1[6], decoupe1[7] ?? undefined);
            resultats.push(curPossibilite);
          } else {
            // console.error("obtenirLesCommandesPossibles > je m’attendais à un [complément direct simple + préposition + complément indirect composé] mais je ne l’ai pas trouvé.", commandeSansPreposition0);
          }

          // CAS 2: complément direct composé + préposition + complément indirect simple
          // découper le reste de la commande en 2 compléments composé et simple
          const decoupe2 = ExprReg.xComplementComposePrepositionComplementSimple.exec(commandeSansPreposition0);
          if (decoupe2) {
            let curPossibilite = new ElementsPhrase(infinitifTrouve);
            curPossibilite.preposition0 = preposition0Trouvee;
            curPossibilite.sujet = new GroupeNominal(decoupe2[1] ?? undefined, decoupe2[2], decoupe2[3] ?? undefined);
            curPossibilite.preposition1 = decoupe2[4];
            curPossibilite.sujetComplement1 = new GroupeNominal(decoupe2[5] ?? undefined, decoupe2[6], decoupe2[7] ?? undefined);
            resultats.push(curPossibilite);
          } else {
            // console.error("obtenirLesCommandesPossibles > je m’attendais à un [complément direct composé + préposition + complément indirect simple] mais je ne l’ai pas trouvé.", commandeSansPreposition0);
          }

          // s’il y en a 3, ça m’est pas ambigu car ça sera d’office
          // - complément direct composé + préposition + complément indirect composé
        } else if (nbPrepositionsTrouvees == 3) {

          // CAS 1: complément direct composé + préposition + complément indirect composé
          // découper le reste de la commande en 2 compléments composés
          const decoupe1 = ExprReg.xComplementComposePrepositionComplementCompose.exec(commandeSansPreposition0);
          if (decoupe1) {
            let curPossibilite = new ElementsPhrase(infinitifTrouve);
            curPossibilite.preposition0 = preposition0Trouvee;
            curPossibilite.sujet = new GroupeNominal(decoupe1[1] ?? undefined, decoupe1[2], decoupe1[3] ?? undefined);
            curPossibilite.preposition1 = decoupe1[4];
            curPossibilite.sujetComplement1 = new GroupeNominal(decoupe1[5] ?? undefined, decoupe1[6], decoupe1[7] ?? undefined);
            resultats.push(curPossibilite);
          } else {
            // console.error("obtenirLesCommandesPossibles > je m’attendais à un [complément direct composé + préposition + complément indirect composé] mais je ne l’ai pas trouvé.", commandeSansPreposition0);
          }
        }
        // s’il n’y a plus rien après le verbe il n’y a aucun argument.
      } else {
        let curPossibilite = new ElementsPhrase(infinitifTrouve);
        resultats.push(curPossibilite);
      }

    }

    let retVal: CandidatCommande[] = [];

    resultats.forEach(els => {
      // un verbe (instruction) n’est pas un nom de sujet valide
      if (!els.sujet?.nom?.match(/^changer|déplacer|effacer|vider$/)) {
        retVal.push(new CandidatCommande(els));
      }
    });

    return retVal;

  }

  /** Décomposer la commande (string => ElementsPhrase) 
   *  @argument: la commande brute
   *  @returns la phrase décomposée si la décomposition à fonctionné sinon undefined.
   */
  static decomposerCommande(commande: string): ElementsPhrase | undefined {
    let els: ElementsPhrase | undefined;

    // A. COMMANDE DIALOGUE (par ordre de préférence)
    // le phrase peut-être tournée de 2 manière différentes, on veut pouvoir
    // détecter les 2.

    // => 1) PARLER DE SUJET AVEC INTERLOCUTEUR (formulation qui évite les ambiguïtés avec les noms composés)
    let sensInterlocSujet = false;
    let res = ExprReg.xCommandeParlerSujetAvecInterlocuteur.exec(commande);
    //  => 2) PARLER AVEC INTERLOCUTEUR CONCERNANT SUJET (formulation qui évite les ambiguïtés avec les noms composés)
    if (!res) {
      sensInterlocSujet = true;
      res = ExprReg.xCommandeParlerAvecInterlocuteurConcernantSujet.exec(commande);
    }
    // => 3) INTERROGER INTERLOCUTEUR CONCERNANT SUJET (formulation qui évite les ambiguïtés avec les noms composés)
    if (!res) {
      sensInterlocSujet = true;
      res = ExprReg.xCommandeQuestionnerInterlocuteurConcernantSujet.exec(commande);
    }
    // => 4a) DEMANDER/COMMANDER/DONNER/MONTRER SUJET À INTERLOCUTEUR
    if (!res) {
      sensInterlocSujet = false;
      res = ExprReg.xCommandeDemanderSujetAInterlocuteur.exec(commande);
    }
    // => 4b) DEMANDER/COMMANDER/DONNER À VERBE À INTERLOCUTEUR
    if (!res) {
      sensInterlocSujet = false;
      res = ExprReg.xCommandeDemanderAVerbeAInterlocuteur.exec(commande);
    }
    // => 5) PARLER AVEC INTERLOCUTEUR DE SUJET (formulation qui peut poser des soucis avec les noms composés)
    if (!res) {
      sensInterlocSujet = true;
      res = ExprReg.xCommandeParlerAvecInterlocuteurDeSujet.exec(commande);
    }
    // => 6) MONTRER/DEMANDER/DONNER À INTERLOCUTEUR SUJET (formulation qui peut poser des soucis avec les noms composés de plus on privilégie infinitif + compl. direct + compl. indirect)
    if (!res) {
      sensInterlocSujet = true;
      res = ExprReg.xCommandeDemanderAInterlocuteurSujet.exec(commande);
    }

    // DIALOGUE TROUVÉ (parler, demander, montrer, …)
    if (res) {
      let interlocuteur: GroupeNominal = null;
      let sujetDialogue: GroupeNominal = null;
      const infinitif = res[1];
      if (sensInterlocSujet) {
        // déterminant difficile à déterminer donc on met rien
        interlocuteur = new GroupeNominal((res[2] ? res[2] : null), res[3], (res[4] ? res[4] : null));
        if (res[7]) {
          sujetDialogue = new GroupeNominal((res[6] ? res[6] : (res[5]?.trim() === 'au' ? 'au' : null)), res[7], (res[8] ? res[8] : null));
        }
      } else {
        interlocuteur = new GroupeNominal((res[6] ? res[6] : (res[5]?.trim() === 'au' ? 'au' : null)), res[7], (res[8] ? res[8] : null));
        sujetDialogue = new GroupeNominal((res[2] ? res[2] : null), res[3], (res[4] ? res[4] : null));
      }

      // console.log("interlocuteur.determinant=,", interlocuteur.determinant, "interlocuteur=", interlocuteur);
      // console.log("sujetDialogue.determinant=,", sujetDialogue.determinant, "sujetDialogue=", sujetDialogue);

      // corriger déterminants
      interlocuteur.determinant = PhraseUtils.trouverDeterminant(interlocuteur.determinant);
      if (sujetDialogue) {
        sujetDialogue.determinant = PhraseUtils.trouverDeterminant(sujetDialogue.determinant);
      }

      // console.log("interlocuteur.determinant=,", interlocuteur.determinant, "interlocuteur=", interlocuteur);
      // console.log("sujetDialogue.determinant=,", sujetDialogue.determinant, "sujetDialogue=", sujetDialogue);

      switch (infinitif) {
        case 'discuter':
        case 'parler':
          // parler avec interlocuteur (concernant sujet)
          els = new ElementsPhrase(infinitif, interlocuteur, null, null, (sujetDialogue?.nom));
          els.preposition0 = 'avec';
          els.sujetComplement1 = sujetDialogue;
          els.preposition1 = sujetDialogue ? 'concernant' : null;
          break;

        case 'montrer':
        case 'donner':
        case 'demander':
          // montrer/donner/demander sujet à interlocuteur
          els = new ElementsPhrase(infinitif, sujetDialogue, null, null, interlocuteur.nom);
          els.preposition0 = null;
          els.preposition1 = 'à';
          els.sujetComplement1 = interlocuteur;
          break;

        case 'interroger':
        case 'questionner':
          // interroger interlocuteur concernant sujet
          els = new ElementsPhrase(infinitif, interlocuteur, null, null, sujetDialogue.nom);
          els.preposition0 = null;
          els.preposition1 = 'concernant';
          els.sujetComplement1 = sujetDialogue;
          break;

        default:
          throw new Error("DécomposerCommande > dialogue > infinitif inconnu: " + infinitif);
      }

      // B. COMMANDE NORMALE (infinitif)
    } else {
      res = ExprReg.xCommandeInfinitif.exec(commande);
      if (res) {
        const sujet = res[4] ? new GroupeNominal(res[3], res[4], res[5] ? res[5] : null) : null;
        els = new ElementsPhrase(res[1], sujet, null, null, (res[6] ? res[6] : null));
        els.preposition0 = res[2] ? res[2] : null;
        els.preposition1 = res[7] ? res[7] : null;
        els.sujetComplement1 = res[9] ? new GroupeNominal(res[8], res[9], res[10] ? res[10] : null) : null;
      }
    }

    // afin de ne pas avoir à s’en inquiéter après, on met l’infinitif en minuscules
    if (els && els.infinitif) {
      els.infinitif = els.infinitif.toLowerCase();
    }

    return els;
  }

  static trouverDeterminant(determinant: string): string {
    let retVal = determinant?.trim();
    if (retVal) {
      switch (retVal) {

        // la
        case 'la':
        case 'à la':
        case 'avec la':
        case 'sur la':
        case 'sous la':
        case 'dans la':
        case 'concernant la':
        case 'de la':
        case 'd\'une':
        case 'd\’une':
        case 'ma':
        case 'sa':
          retVal = 'la ';
          break;

        // le
        case 'le':
        case 'au':
        case 'avec le':
        case 'sur le':
        case 'sous le':
        case 'dans le':
        case 'du':
        case 'd\'un':
        case 'd’un':
        case 'mon':
        case 'son':
          retVal = 'le ';
          break;

        // les
        case 'les':
        case 'aux':
        case 'avec les':
        case 'sur les':
        case 'sous les':
        case 'dans les':
        case 'des':
        case 'mes':
        case 'ses':
          retVal = 'les ';
          break;

        // l'
        case 'l\'':
        case 'à l’':
        case 'avec l’':
        case 'sur l’':
        case 'sous l’':
        case 'dans l’':
        case 'de l’':
        // l’
        case 'l’':
        case 'à l\'':
        case 'avec l\'':
        case 'sur l\'':
        case 'sous l\'':
        case 'dans l\'':
        case 'de l\'':
          retVal = 'l’';
          break;

        case 'à':
        case 'de':
        case 'se':
        case 'avec':
        case 'sur':
        case 'sous':
        case 'dans':
          retVal = null;
          break;

        default:
          break;
      }
    }
    return retVal;
  }

  /** Retrouver une propriété valide */
  public static trouverPropriete(intitule: string): ProprieteJeu {

    let retVal: ProprieteJeu = null;

    // A) vérifier si la propriété correspond au type « nombre de propriété d’un élément » :
    const intituleEstUnNombreDePropriete = ExprReg.xNombreDeProprieteElement.exec(intitule);
    if (intituleEstUnNombreDePropriete) {
      retVal = new ProprieteJeu(TypeProprieteJeu.nombreDeProprieteElement);
      // propriété
      const propriete = intituleEstUnNombreDePropriete[1];
      retVal.intituleProprieteElement = new GroupeNominal(null, propriete, null);
      // élément
      const prepositionElement = intituleEstUnNombreDePropriete[2] ?? null;
      const determinantElement = PhraseUtils.trouverDeterminant(prepositionElement);
      const nomElement = intituleEstUnNombreDePropriete[3] ?? null;
      const epitheteElement = intituleEstUnNombreDePropriete[4] ?? null;
      retVal.intituleElement = new GroupeNominal(determinantElement, nomElement, epitheteElement);

      // B) vérifier si la propriété correspond au type « propriété d’un élément » :
    } else {
      const intituleEstUnePropriete = ExprReg.xProprieteElement.exec(intitule);
      if (intituleEstUnePropriete) {
        retVal = new ProprieteJeu(TypeProprieteJeu.proprieteElement);
        // propriété
        const determinantPropriete = intituleEstUnePropriete[1] ?? null;
        const nomPropriete = intituleEstUnePropriete[2];
        retVal.intituleProprieteElement = new GroupeNominal(determinantPropriete, nomPropriete, null);
        // élément
        const prepositionElement = intituleEstUnePropriete[3];
        const determinantElement = PhraseUtils.trouverDeterminant(prepositionElement);
        const nomElement = intituleEstUnePropriete[4];
        const epitheteElement = intituleEstUnePropriete[5];
        retVal.intituleElement = new GroupeNominal(determinantElement, nomElement, epitheteElement);

        // C) vérifier si la propriété correspond au type « nombre de classe » ou « nombre de classe position »:
      } else {
        const intituleEstUnNombreDeClasse = ExprReg.xNombreDeClasseEtatPosition.exec(intitule);
        if (intituleEstUnNombreDeClasse) {
          retVal = new ProprieteJeu(TypeProprieteJeu.nombreDeClasseAttributs);
          // classe
          const nomClasse = intituleEstUnNombreDeClasse[1];
          retVal.intituleClasse = nomClasse;
          // attributs (facultatif)
          const attribut1Classe = intituleEstUnNombreDeClasse[2] ?? null;
          const attribut2Classe = intituleEstUnNombreDeClasse[3] ?? null;
          retVal.nomsEtats = [];
          if (attribut1Classe) {
            retVal.nomsEtats.push(attribut1Classe);
            if (attribut2Classe) {
              retVal.nomsEtats.push(attribut2Classe);
            }
          }
          // position relative à un élément (facultatif)
          const prepositionElement = intituleEstUnNombreDeClasse[4] ?? null;
          if (prepositionElement) {
            retVal.type = TypeProprieteJeu.nombreDeClasseAttributsPosition;
            // position
            const prepositionSpatiale = PositionObjet.getPrepositionSpatiale(prepositionElement);
            retVal.prepositionSpatiale = prepositionSpatiale;
            // élément
            const determinantElement = PhraseUtils.trouverDeterminant(prepositionElement);
            const nomElement = intituleEstUnNombreDeClasse[5];
            const epitheteElement = intituleEstUnNombreDeClasse[6];
            retVal.intituleElement = new GroupeNominal(determinantElement, nomElement, epitheteElement);

          }
        }

      }

    }

    return retVal;
  }

  /**
   * Décomposer l’intitulé brut en un groupe nominal.
   */
  public static getGroupeNominalDefini(intituleBrut: string, forcerMinuscules: boolean): GroupeNominal | undefined {

    let determinant: string | undefined;
    let nom: string | undefined;
    let epithete: string | undefined;
    let retVal: GroupeNominal | undefined;
    if (intituleBrut) {
      const resultatGn = ExprReg.xGroupeNominalArticleDefini.exec(intituleBrut);
      if (resultatGn) {
        // forcer minuscules
        if (forcerMinuscules) {
          determinant = resultatGn[1]?.toLowerCase() ?? undefined;
          nom = resultatGn[2].toLowerCase();
          epithete = resultatGn[3]?.toLowerCase() ?? undefined;
          // garder casse originale
        } else {
          determinant = resultatGn[1] ?? undefined;
          nom = resultatGn[2];
          epithete = resultatGn[3] ?? undefined;
        }
        retVal = new GroupeNominal(determinant, nom, epithete);
      }
    }
    return retVal;
  }

  /**
 * Décomposer l’intitulé brut en un groupe nominal.
 */
  public static getGroupeNominalDefiniOuIndefini(intituleBrut: string, forcerMinuscules: boolean): GroupeNominal | undefined {
    let determinant: string | undefined;
    let nom: string | undefined;
    let epithete: string | undefined;
    let retVal: GroupeNominal | undefined;
    const resultatGn = ExprReg.xGroupeNominalArticleDefiniEtIndefini.exec(intituleBrut);
    if (resultatGn) {
      // forcer minuscules
      if (forcerMinuscules) {
        determinant = resultatGn[1]?.toLowerCase() ?? undefined;
        nom = resultatGn[2].toLowerCase();
        epithete = resultatGn[3]?.toLowerCase() ?? undefined;
        // garder casse originale
      } else {
        determinant = resultatGn[1] ?? undefined;
        nom = resultatGn[2];
        epithete = resultatGn[3] ?? undefined;
      }
      retVal = new GroupeNominal(determinant, nom, epithete);
    }
    return retVal;
  }
}