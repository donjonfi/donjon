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
import { EClasseRacine } from "../../models/commun/constantes";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
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
import { ProprieteElement } from "../../models/commun/propriete-element";
import { Resultat } from "../../models/jouer/resultat";
import { StringUtils } from "../commun/string.utils";
import { TexteUtils } from "../commun/texte-utils";
import { TypeProprieteJeu } from "../../models/jeu/propriete-jeu";
import { TypeValeur } from "../../models/compilateur/type-valeur";

export class InstructionDire {

  private cond: ConditionsUtils;

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private verbeux: boolean,
  ) {
    this.cond = new ConditionsUtils(this.jeu, this.verbeux);
  }

  /**
   * Calculer le texte dynamique en tenant compte des balises conditionnelles et des états actuels.
   */
  public calculerTexteDynamique(texteDynamiqueOriginal: string, nbAffichage: number, intact: boolean | undefined, contexteTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined) {
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
      // Aperçu (d’un objet)
      if (texteDynamique.includes("[aperçu") || texteDynamique.includes("[apercu")) {
        if (texteDynamique.includes("[aperçu ceci]") || texteDynamique.includes("[apercu ceci]")) {
          let apercuCeci = "???";
          if (contexteTour?.ceci) {
            if (ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.element)) {
              const eleCeci = contexteTour.ceci as ElementJeu;
              apercuCeci = this.calculerTexteDynamique(eleCeci.apercu, ++eleCeci.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(eleCeci, this.jeu.etats.intactID), contexteTour, evenement, declenchements);
              texteDynamique = texteDynamique.replace(/\[(aperçu|apercu) ceci\]/g, apercuCeci);
              // l’objet a été vu par le joueur
              this.jeu.etats.ajouterEtatIdElement(eleCeci, this.jeu.etats.vuID, this.eju);
            } else if (ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.direction)) {
              const dirCeci = contexteTour.ceci as Localisation;
              let voisinID = this.eju.getVoisinDirectionID(dirCeci, EClasseRacine.lieu);
              if (voisinID !== -1) {
                let voisin = this.eju.getLieu(voisinID);
                apercuCeci = this.calculerTexteDynamique(voisin.apercu, ++voisin.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(voisin, this.jeu.etats.intactID), contexteTour, evenement, declenchements);
                // le lieu a été vu par le joueur
                this.jeu.etats.ajouterEtatIdElement(voisin, this.jeu.etats.vuID, this.eju);
              } else {
                console.error("calculerTexteDynamique: aperçu de ceci: voisin pas trouvé dans cette direction.");
              }
            } else {
              console.error("calculerTexteDynamique: aperçu de ceci: ceci n'est pas un élément jeu");
            }
          } else {
            console.error("calculerTexteDynamique: aperçu de ceci: ceci n'a pas été défini.");
          }
          texteDynamique = texteDynamique.replace(/\[(aperçu|apercu) ceci\]/g, apercuCeci);
        }
        if (texteDynamique.includes("[aperçu cela]") || texteDynamique.includes("[apercu cela]")) {
          let apercuCela = "???";
          if (contexteTour?.cela) {
            if (ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.element)) {
              const eleCela = contexteTour.cela as ElementJeu;
              apercuCela = this.calculerTexteDynamique(eleCela.apercu, ++eleCela.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(eleCela, this.jeu.etats.intactID), contexteTour, evenement, declenchements);
              texteDynamique = texteDynamique.replace(/\[(aperçu|apercu) cela\]/g, apercuCela);
              // l’objet a été vu par le joueur
              this.jeu.etats.ajouterEtatIdElement(eleCela, this.jeu.etats.vuID, this.eju);
            } else if (ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.direction)) {
              const dirCela = contexteTour.cela as Localisation;
              let voisinID = this.eju.getVoisinDirectionID(dirCela, EClasseRacine.lieu);
              if (voisinID !== -1) {
                let voisin = this.eju.getLieu(voisinID);
                apercuCela = this.calculerTexteDynamique(voisin.apercu, ++voisin.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(voisin, this.jeu.etats.intactID), contexteTour, evenement, declenchements);
                // le lieu a été vu par le joueur
                this.jeu.etats.ajouterEtatIdElement(voisin, this.jeu.etats.vuID, this.eju);
              } else {
                console.error("calculerTexteDynamique: aperçu de cela: voisin pas trouvé dans cette direction.");
              }
            } else {
              console.error("calculerTexteDynamique: aperçu de cela: cela n'est pas un élément jeu");
            }
          } else {
            console.error("calculerTexteDynamique: aperçu de cela: cela n'a pas été défini.");
          }
          texteDynamique = texteDynamique.replace(/\[(aperçu|apercu) cela\]/g, apercuCela);
        }
      }


      // ================================================================================
      // STATUT
      // ================================================================================

      // statut (porte, contenant)
      if (texteDynamique.includes("[statut")) {
        if (texteDynamique.includes("[statut ceci]")) {
          if (contexteTour?.ceci && ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.objet)) {
            const statutCeci = this.afficherStatut(contexteTour.ceci as Objet);
            texteDynamique = texteDynamique.replace(/\[statut ceci\]/g, statutCeci);
          } else {
            console.error("calculerTexteDynamique: statut de ceci: ceci n'est pas un objet");
          }
        }
        if (texteDynamique.includes("[statut cela]")) {
          if (contexteTour?.cela && ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.objet)) {
            const statutCela = this.afficherStatut(contexteTour.cela as Objet);
            texteDynamique = texteDynamique.replace(/\[statut cela\]/g, statutCela);
          } else {
            console.error("calculerTexteDynamique: statut de cela: cela n'est pas un objet");
          }
        }
      }

      // ================================================================================
      // OBJETS (CONTENU) [liste|décrire objets sur|sous|dans ici|origine|destination|ceci|cela|inventaire]
      // ================================================================================

      const baliseListerDecrireContenu = "(décrire|lister) objets (?:(sur|sous|dans|) )?(ici|origine|destination|ceci|cela|inventaire)(?: (sauf cachés))?";
      const xBaliseListerDecrireContenuMulti = new RegExp("\\[" + baliseListerDecrireContenu + "\\]", "gi");
      const xBaliseListerDecrireContenuSolo = new RegExp("\\[" + baliseListerDecrireContenu + "\\]", "i");


      // if (texteDynamique.includes("[lister objets ") || texteDynamique.includes("[décrire objets ")) {
      if (xBaliseListerDecrireContenuMulti.test(texteDynamique)) {

        // retrouver toutes les balises lister/décrire
        const allBalises = texteDynamique.match(xBaliseListerDecrireContenuMulti);

        // ne garder qu’une seule occurrence de chaque afin de ne pas calculer plusieurs fois la même balise.
        const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)

        // parcourir chaque balise trouvée
        balisesUniques.forEach(curBalise => {
          // retrouver la préposition et la cible
          const decoupe = xBaliseListerDecrireContenuSolo.exec(curBalise);

          const ListerDecrireString = decoupe[1];
          let isLister = ListerDecrireString.toLowerCase() == 'lister';
          const prepositionString = decoupe[2]; // dans par défaut
          const cibleString = decoupe[3];
          const exclureCaches = decoupe[4] && decoupe[4] == 'sauf cachés';

          let phraseSiVide = "";
          let phraseSiQuelqueChose = "";
          let afficherObjetsCaches = !exclureCaches;

          const cible = InstructionsUtils.trouverCibleSpeciale(cibleString, contexteTour, evenement, this.eju, this.jeu);

          // retrouver la préposition (dans par défaut)
          let preposition = PrepositionSpatiale.dans;
          if (prepositionString) {
            preposition = PositionObjet.getPrepositionSpatiale(prepositionString);
          }

          // cas particuliers
          // > ici
          if (cible == this.eju.curLieu) {
            phraseSiQuelqueChose = "{U}Vous apercevez ";
            // > inventaire / joueur
          } else if (cible == this.jeu.joueur) {
            phraseSiQuelqueChose = "";
            phraseSiVide = "Votre inventaire est vide.";
          } else {
            switch (preposition) {
              case PrepositionSpatiale.sur:
                phraseSiQuelqueChose = " Dessus, il y a ";
                phraseSiVide = "Il n’y a rien dessus.";
                break;

              case PrepositionSpatiale.sous:
                phraseSiQuelqueChose = " Dessous, il y a ";
                phraseSiVide = "Il n’y a rien dessous.";
                break;
              case PrepositionSpatiale.dans:
              default:
                phraseSiQuelqueChose = " Dedans, il y a ";
                phraseSiVide = "[Pronom " + cibleString + "] [v être ipr " + cibleString + "] vide[s " + cibleString + "].";
            }
          }

          let resultatCurBalise: string;
          if (cible instanceof ElementJeu) {
            if (isLister) {
              resultatCurBalise = this.executerListerContenu(cible, afficherObjetsCaches, false, false, false, false, preposition).sortie;
            } else {
              resultatCurBalise = this.executerDecrireContenu(cible, phraseSiQuelqueChose, phraseSiVide, afficherObjetsCaches, false, false, false, false, preposition).sortie;
            }
          } else {
            resultatCurBalise = "{+(cible pas trouvée)+}";
          }

          // remplacer la balise par le résultat
          const xCurBalise = new RegExp("\\[" + ListerDecrireString + " objets " + (prepositionString ? (prepositionString + " ") : "") + cibleString + (exclureCaches ? " sauf cachés" : "") + "\\]", "g");
          texteDynamique = texteDynamique.replace(xCurBalise, resultatCurBalise);

        });

      }

      // ================================================================================
      // LISTER/DÉCRIRE UNE LISTE
      // ================================================================================
      const baliseListerDecrireListe = "(lister|décrire) ((?:le |la |l(?:’|')|les )?(?!\\d|un|une|des|le|la|les|l\\b)(?:\\S+?|(?:\\S+? (?:à |en |au(?:x)? |de (?:la |l'|l’)?|du |des |d'|d’)\\S+?))(?:(?: )(?!\\(|(?:ne|n’|n'|d’|d'|et|ou|soit|mais|un|de|du|dans|sur|avec|se|s’|s')\\b)(?:\\S+))?)";
      const xBaliseListerDecrireListeMulti = new RegExp("\\[" + baliseListerDecrireListe + "\\]", "gi");
      const xBaliseListerDecrireListeSolo = new RegExp("\\[" + baliseListerDecrireListe + "\\]", "i");
      if (xBaliseListerDecrireListeMulti.test(texteDynamique)) {
        // retrouver toutes les balises lister/décrire
        const allBalises = texteDynamique.match(xBaliseListerDecrireListeMulti);
        // ne garder qu’une seule occurrence de chaque afin de ne pas calculer plusieurs fois la même balise.
        const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)
        // parcourir chaque balise trouvée
        balisesUniques.forEach(curBalise => {
          // retrouver la préposition et la cible
          const decoupe = xBaliseListerDecrireListeSolo.exec(curBalise);

          const verbeString = decoupe[1];
          let cibleString = decoupe[2];
          let cibleGN = PhraseUtils.getGroupeNominalDefini(cibleString, false);
          const cible: Liste = InstructionsUtils.trouverListe(cibleGN, this.eju, this.jeu, true);

          let resultat: string = '';

          if (cible && ClasseUtils.heriteDe(cible.classe, EClasseRacine.liste)) {
            const cibleElement: Liste = cible as Liste;

            switch (verbeString) {

              case 'lister':
              case 'Lister':
                resultat = cible.lister();
                break;

              case 'décrire':
              case 'Décrire':
                resultat = cible.decrire();
                break;

              // inconnu
              default:
                console.error("calculerTexteDynamique: lister/décrire une liste: verbe pas pris en charge :", verbeString);
                break;
            }
            // ne rien metre si on cible ceci? ou cela? (car argument factultatif)
          } else if (cibleString == 'ceci?' || cibleString == 'cela?') {
            resultat = "";
            // cible non trouvée
          } else {
            resultat = "?!?"
          }

          // echaper le ? à la fin de ceci? cela?
          if (cibleString == 'ceci?' || cibleString == 'cela?') {
            cibleString = cibleString.replace("?", "\\?");
          }

          // remplacer la balise par le résultat
          const xCurBalise = new RegExp("\\[" + verbeString + " " + cibleString + "\\]", "g");
          texteDynamique = texteDynamique.replace(xCurBalise, resultat);

        });

      }

      // ================================================================================
      // OBSTACLE
      // ================================================================================

      if (texteDynamique.includes("[obstacle ")) {
        if (texteDynamique.includes("[obstacle vers ceci]")) {
          if (contexteTour?.ceci) {
            let obstacleVersCeci: string = null;
            if (ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.direction)) {
              obstacleVersCeci = this.afficherObstacle((contexteTour.ceci as Localisation).id);
              texteDynamique = texteDynamique.replace(/\[obstacle vers ceci\]/g, obstacleVersCeci);
            } else if (ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.lieu)) {
              obstacleVersCeci = this.afficherObstacle(contexteTour.ceci as Lieu);
              texteDynamique = texteDynamique.replace(/\[obstacle vers ceci\]/g, obstacleVersCeci);
            } else {
              console.error("calculerTexteDynamique: statut sortie vers ceci: ceci n’est ni une direction ni un lieu.");
            }
          } else {
            console.error("calculerTexteDynamique: statut sortie vers ceci: ceci est null.");
          }
        }
        if (texteDynamique.includes("[obstacle vers cela]")) {
          if (contexteTour?.cela) {
            let obstacleVersCela: string = null;
            if (ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.direction)) {
              obstacleVersCela = this.afficherObstacle((contexteTour.cela as Localisation).id);
              texteDynamique = texteDynamique.replace(/\[obstacle vers cela\]/g, obstacleVersCela);
            } else if (ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.lieu)) {
              obstacleVersCela = this.afficherObstacle(contexteTour.cela as Lieu);
              texteDynamique = texteDynamique.replace(/\[obstacle vers cela\]/g, obstacleVersCela);
            } else {
              console.error("calculerTexteDynamique: statut sortie vers cela: cela n’est ni une direction ni un lieu.");
            }
          } else {
            console.error("calculerTexteDynamique: statut sortie vers cela: cela est null.");
          }
        }
      }

      // sorties
      if (texteDynamique.includes("[sorties ici]")) {
        const sortiesIci = this.afficherSorties(this.eju.curLieu);
        texteDynamique = texteDynamique.replace(/\[sorties ici\]/g, sortiesIci);
      }

      // titre
      if (texteDynamique.includes("[titre ici]")) {
        const titreIci = this.eju.curLieu?.titre ?? "(Je ne sais pas où je suis)";
        texteDynamique = texteDynamique.replace(/\[titre ici\]/g, titreIci);
      }

      // aide
      if (texteDynamique.includes("[aide")) {
        if (texteDynamique.includes("[aide ceci]")) {
          if (contexteTour) {
            const aideCeci = this.recupererFicheAide(contexteTour.ceci);
            texteDynamique = texteDynamique.replace(/\[aide ceci\]/g, aideCeci);
          } else {
            console.error("calculerTexteDynamique: aide ceci: pas de contexteTour");
          }
        }
        if (texteDynamique.includes("[aide cela]")) {
          if (contexteTour) {
            const aideCela = this.recupererFicheAide(contexteTour.cela);
            texteDynamique = texteDynamique.replace(/\[aide cela\]/g, aideCela);
          } else {
            console.error("calculerTexteDynamique: aide cela: pas de contexteTour");
          }
        }
      }

      // ======================================================================================================
      // PROPRIÉTÉS [intitulé|intitule|singulier|pluriel|accord|es|e|s|pronom|Pronom|il|Il|l’|l'|le|lui ceci?|cela?|ici|origine|destination|orientation|réponse|quantitéCeci|quantitéCela
      // ======================================================================================================

      const balisePropriete = "(quantité|quantite|intitulé|intitule|singulier|pluriel|accord|es|s|e|pronom|Pronom|il|Il|l’|l'|le|lui|préposition|preposition) (ceci(?:\\?)?|cela(?:\\?)?|ici|origine|destination|orientation|réponse|quantitéCeci|quantitéCela)";
      const xBaliseProprieteMulti = new RegExp("\\[" + balisePropriete + "\\]", "gi");
      const xBaliseProprieteSolo = new RegExp("\\[" + balisePropriete + "\\]", "i");

      if (xBaliseProprieteMulti.test(texteDynamique)) {
        // retrouver toutes les balises propriétés
        const allBalises = texteDynamique.match(xBaliseProprieteMulti);
        // ne garder qu’une seule occurrence de chaque afin de ne pas calculer plusieurs fois la même balise.
        const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)
        // parcourir chaque balise trouvée
        balisesUniques.forEach(curBalise => {
          // retrouver la préposition et la cible
          const decoupe = xBaliseProprieteSolo.exec(curBalise);

          const proprieteString = decoupe[1];
          let cibleString = decoupe[2];
          const cible = InstructionsUtils.trouverCibleSpeciale(cibleString, contexteTour, evenement, this.eju, this.jeu);

          let resultat: string = '';

          if (cible && ClasseUtils.heriteDe(cible.classe, EClasseRacine.element)) {
            const cibleElement: ElementJeu = cible as ElementJeu;

            switch (proprieteString) {

              case 'Quantité':
              case 'quantité':
              case 'Quantite':
              case 'quantite':
                resultat = cibleElement.quantite.toString();
                break;

              case 'intitulé':
              case 'intitule':
                resultat = this.eju.calculerIntituleElement(cibleElement, false, true);
                break;

              case 'Intitulé':
              case 'Intitule':
                resultat = this.eju.calculerIntituleElement(cibleElement, true, true);
                break;

              case 'Singulier':
                resultat = this.eju.calculerIntituleElement(cibleElement, true, true, Nombre.s);
                break;

              case 'singulier':
                resultat = this.eju.calculerIntituleElement(cibleElement, false, true, Nombre.s);
                break;

              case 'Pluriel':
                resultat = this.eju.calculerIntituleElement(cibleElement, true, true, Nombre.p);
                break;

              case 'pluriel':
                resultat = this.eju.calculerIntituleElement(cibleElement, false, true, Nombre.p);
                break;

              // es ceci | accord ceci (féminin et pluriel)
              case 'accord':
              case 'es':
                resultat = (cibleElement.genre === Genre.f ? "e" : "") + (cibleElement.nombre === Nombre.p ? "s" : "");
                break;

              // s ceci (pluriel)
              case 's':
                resultat = (cibleElement.nombre === Nombre.p ? "s" : "");
                break;

              // e ceci (féminin)
              case 'e':
                resultat = (cibleElement.genre === Genre.f ? "e" : "");
                break;

              // pronom
              case 'pronom':
              case 'il':
                if (ClasseUtils.heriteDe(cibleElement.classe, EClasseRacine.element)) {
                  resultat = (cibleElement.genre === Genre.f ? "elle" : "il") + (cibleElement.nombre === Nombre.p ? "s" : "");
                } else {
                  console.error("calculerTexteDynamique: pronom ceci: ceci n'est pas un élément.");
                }
                break;

              // pronom (majuscule)
              case 'Pronom':
              case 'Il':
                resultat = (cibleElement.genre === Genre.f ? "Elle" : "Il") + (cibleElement.nombre === Nombre.p ? "s" : "");
                break;

              // cod: l’ ou les
              case 'l’':
              case 'l\'':
                resultat = (cibleElement.nombre === Nombre.p ? "les " : "l’");
                break;

              // cod: le, la ou les
              case 'le':
                // singulier
                if (cibleElement.nombre !== Nombre.p) {
                  // masculin
                  if (cibleElement.genre !== Genre.f) {
                    resultat = "le";
                    // féminin
                  } else {
                    resultat = "la";
                  }
                  // pluriel
                } else {
                  resultat = "les";
                }
                break;

              // lui, elle, eux, elles
              case 'lui':
                // singulier
                if (cibleElement.nombre !== Nombre.p) {
                  // masculin
                  if (cibleElement.genre !== Genre.f) {
                    resultat = "lui";
                    // féminin
                  } else {
                    resultat = "elle";
                  }
                  // pluriel
                } else {
                  // masculin
                  if (cibleElement.genre !== Genre.f) {
                    resultat = "eux";
                    // féminin
                  } else {
                    resultat = "elles";
                  }
                }
                break;

              // préposition (ceci/cela)
              case 'préposition':
              case 'preposition':
                if (cibleString == 'ceci' || cibleString == 'ceci?') {
                  resultat = evenement?.prepositionCeci ?? '';
                } else if (cibleString == 'cela' || cibleString == 'cela?') {
                  resultat = evenement?.prepositionCela ?? '';
                } else {
                  resultat = "?!";
                }
                break;

              // inconnu
              default:
                console.error("calculerTexteDynamique: propriete pas prise en charge (Element) :", proprieteString);
                break;
            }
          } else if (cible && ClasseUtils.heriteDe(cible.classe, EClasseRacine.intitule)) {
            switch (proprieteString) {

              case 'intitulé':
              case 'intitule':
                resultat = ElementsJeuUtils.calculerIntituleGenerique(cible, false);
                break;

              case 'Intitulé':
              case 'Intitule':
                resultat = ElementsJeuUtils.calculerIntituleGenerique(cible, true);
                break;

              // préposition (ceci/cela)
              case 'préposition':
              case 'preposition':
                if (cibleString == 'ceci' || cibleString == 'ceci?') {
                  resultat = evenement?.prepositionCeci ?? '';
                } else if (cibleString == 'cela' || cibleString == 'cela?') {
                  resultat = evenement?.prepositionCela ?? '';
                } else {
                  resultat = "?!";
                }
                break;

              // inconnu
              default:
                console.error("calculerTexteDynamique: propriete pas prise en charge (Intitulé) :", proprieteString);
                break;
            }
            // ne rien metre si on cible ceci? ou cela? (car argument factultatif)
          } else if (cibleString == 'ceci?' || cibleString == 'cela?') {
            resultat = "";
            // cible non trouvée
          } else {
            resultat = "?!?"
          }

          // echaper le ? à la fin de ceci? cela?
          if (cibleString == 'ceci?' || cibleString == 'cela?') {
            cibleString = cibleString.replace("?", "\\?");
          }

          // remplacer la balise par le résultat
          const xCurBalise = new RegExp("\\[" + proprieteString + " " + cibleString + "\\]", "g");
          texteDynamique = texteDynamique.replace(xCurBalise, resultat);

        });

      }

      // ===================================================
      // PROPRIÉTÉS [p nomPropriété ici|ceci|cela]
      // ===================================================
      if (texteDynamique.includes("[p ")) {
        // retrouver toutes les balises de propriété [p xxx ceci]
        const xBaliseGenerique = /\[p (\S+) (ici|ceci|cela)\]/gi;
        const allBalises = texteDynamique.match(xBaliseGenerique);
        // ne garder qu’une seule occurrence de chaque afin de ne pas calculer plusieurs fois la même balise.
        const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)
        // parcourir chaque balise trouvée
        balisesUniques.forEach(curBalise => {
          // retrouver la proppriété et la cible
          const decoupe = /\[p (\S+) (ici|ceci|cela)\]/i.exec(curBalise);
          const proprieteString = decoupe[1];
          const cibleString = decoupe[2];
          let cible = InstructionsUtils.trouverCibleSpeciale(cibleString, contexteTour, evenement, this.eju, this.jeu);
          let resultatCurBalise: string = null;
          if (cible) {
            switch (proprieteString) {
              // nom
              case 'nom':
                resultatCurBalise = cible.nom;
                break;
              // intitulé (connu forcé)
              case 'intitulé':
              case 'intitule':
                if (cible instanceof ElementJeu) {
                  resultatCurBalise = this.eju.calculerIntituleElement(cible, false, true);
                } else {
                  resultatCurBalise = cible.intitule.toString();
                }
                break;
              // Intitulé (maj forcée, connu forcé)
              case 'Intitulé':
              case 'Intitule':
                if (cible instanceof ElementJeu) {
                  resultatCurBalise = this.eju.calculerIntituleElement(cible, true, true);
                } else {
                  resultatCurBalise = cible.intitule.toString();
                  // forcer majuscule
                  if (resultatCurBalise.length > 0) {
                    resultatCurBalise = resultatCurBalise[0].toUpperCase() + resultatCurBalise.slice(1);
                  }
                }
                break;
              // quantité
              case 'quantité':
              case 'quantite':
                if (cible instanceof ElementJeu) {
                  resultatCurBalise = cible.quantite.toString();
                } else {
                  resultatCurBalise = "???";
                }
                break;

              // Propriété
              default:
                if (cible instanceof ElementJeu) {
                  const propriete = cible.proprietes.find(x => x.nom == proprieteString);
                  if (propriete) {
                    // texte
                    if (propriete.type == TypeValeur.mots) {
                      resultatCurBalise = this.calculerTexteDynamique(propriete.valeur, ++propriete.nbAffichage, this.jeu.etats.possedeEtatIdElement(cible, this.jeu.etats.intactID), contexteTour, evenement, declenchements);
                      // nombre
                    } else {
                      resultatCurBalise = propriete.valeur;
                    }
                  } else {
                    resultatCurBalise = "(propriété « " + proprieteString + " » pas trouvée)";
                  }
                } else {
                  resultatCurBalise = "???";
                }
                break;
            }

          } else {
            resultatCurBalise = "(" + cibleString + " est null)";
          }
          // remplacer la balise par le résultat
          const xCurBalise = new RegExp("\\[p " + proprieteString + " " + cibleString + "\\]", "g");
          texteDynamique = texteDynamique.replace(xCurBalise, resultatCurBalise);
        });
      }

      // ===================================================
      // COMPTEURS [c nomCompteur]
      // ===================================================
      if (texteDynamique.includes("[c ")) {
        // retrouver toutes les balises de compteurs [c xxx]
        const xBaliseGenerique = /\[c (.+?)\]/gi;
        const allBalises = texteDynamique.match(xBaliseGenerique);
        // ne garder qu’une seule occurrence de chaque afin de ne pas calculer plusieurs fois la même balise.
        const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)
        // parcourir chaque balise trouvée
        balisesUniques.forEach(curBalise => {
          let resultatCurBalise: string = null;
          // retrouver la proppriété et la cible
          const decoupe = /\[c (.+?)\]/i.exec(curBalise);
          const compteurString = decoupe[1];
          let compteur: Compteur = null;
          // quantitéCeci
          if (compteurString == 'quantitéCeci' || compteurString == 'quantiteCeci') {
            compteur = new Compteur('quantitéCeci', evenement.quantiteCeci);
            // quantitéCela
          } else if (compteurString == 'quantitéCela' || compteurString == 'quantiteCela') {
            compteur = new Compteur('quantitéCela', evenement.quantiteCela);
            // compteur normal
          } else {
            compteur = this.eju.trouverCompteurAvecNom(compteurString);
          }

          if (compteur) {
            resultatCurBalise = compteur.valeur.toString();
          } else {
            resultatCurBalise = "(compteur « " + compteurString + " » pas trouvée)";
          }
          // remplacer la balise par le résultat
          const xCurBalise = new RegExp("\\[c " + compteurString + "\\]", "g");
          texteDynamique = texteDynamique.replace(xCurBalise, resultatCurBalise);
        });
      }


      // ===================================================
      // Calendrier [calendrier], [mois], [date], …
      // ===================================================
      const baliseCalendrier = "(calendrier|(?:0?(?:jour|date|mois|ann(?:é|e|è)e)))";
      const xBaliseCalendrierMulti = new RegExp("\\[" + baliseCalendrier + "\\]", "gi");
      const xBaliseCalendrierSolo = new RegExp("\\[" + baliseCalendrier + "\\]", "i");

      if (xBaliseCalendrierMulti.test(texteDynamique)) {
        // retrouver toutes les balises conjugaison
        const allBalises = texteDynamique.match(xBaliseCalendrierMulti);
        // ne garder qu’une seule occurrence de chaque afin de ne pas calculer plusieurs fois la même balise.
        const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index);

        const maintenant = new Date();
        const zeroPad = (num, places) => String(num).padStart(places, '0');

        // parcourir chaque balise trouvée
        balisesUniques.forEach(curBalise => {
          // retrouver la préposition et la cible
          const decoupe = curBalise.match(xBaliseCalendrierSolo);
          const unite = decoupe[1]?.toLocaleLowerCase();
          let valeurCalendrier: string;
          switch (unite) {
            case 'jour':
              const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeurdi', 'vendredi', 'samedi'];
              valeurCalendrier = jours[maintenant.getDay()];
              break;
            case 'date':
              valeurCalendrier = maintenant.getDate().toString();
              break;
            case 'mois':
              const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
              valeurCalendrier = mois[maintenant.getMonth()];
              break;
            case 'année':
            case 'annee':
            case 'annèe':
              valeurCalendrier = maintenant.getFullYear().toString();
              break;
            case '0jour':
              // lundi = 1
              const joursNombre = [7, 1, 2, 3, 4, 5, 6];
              valeurCalendrier = joursNombre[maintenant.getDay()].toString();
              break;
            case '0date':
              valeurCalendrier = zeroPad(maintenant.getDate(), 2);
              break;
            case '0mois':
              // janvier = 1
              valeurCalendrier = zeroPad((maintenant.getMonth() + 1), 2);
              break;
            case '0année':
            case '0annee':
            case '0annèe':
              valeurCalendrier = maintenant.getFullYear().toString();
              break;
            case 'calendrier':
            default:
              valeurCalendrier = `${zeroPad(maintenant.getHours(), 2)}:${zeroPad(maintenant.getMinutes(), 2)}`;
              break;
          }

          // remplacer la balise par l’horloge
          const regExp = new RegExp("\\[" + (curBalise.slice(1, curBalise.length - 1)) + "\\]", "g");
          texteDynamique = texteDynamique.replace(regExp, valeurCalendrier);
        });
      }


      // ===================================================
      // Horloge [horloge], [minutes], [secondes], …
      // ===================================================
      const baliseHorloge = "(horloge|(?:0?(?:heure|minute|seconde)))s*";
      const xBaliseHorlogeMulti = new RegExp("\\[" + baliseHorloge + "\\]", "gi");
      const xBaliseHorlogeSolo = new RegExp("\\[" + baliseHorloge + "\\]", "i");

      if (xBaliseHorlogeMulti.test(texteDynamique)) {
        // retrouver toutes les balises conjugaison
        const allBalises = texteDynamique.match(xBaliseHorlogeMulti);
        // ne garder qu’une seule occurrence de chaque afin de ne pas calculer plusieurs fois la même balise.
        const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index);

        const maintenant = new Date();
        const zeroPad = (num, places) => String(num).padStart(places, '0');

        // parcourir chaque balise trouvée
        balisesUniques.forEach(curBalise => {
          // retrouver la préposition et la cible
          const decoupe = curBalise.match(xBaliseHorlogeSolo);
          const unite = decoupe[1]?.toLocaleLowerCase();
          let valeurHorloge: string;
          switch (unite) {
            case 'heure':
              valeurHorloge = maintenant.getHours().toString();
              break;
            case 'minute':
              valeurHorloge = maintenant.getMinutes().toString();
              break;
            case 'seconde':
              valeurHorloge = maintenant.getSeconds().toString();
              break;
            case '0heure':
              valeurHorloge = zeroPad(maintenant.getHours(), 2);
              break;
            case '0minute':
              valeurHorloge = zeroPad(maintenant.getMinutes(), 2);
              break;
            case '0seconde':
              valeurHorloge = zeroPad(maintenant.getSeconds(), 2);
              break;
            case 'horloge':
            default:
              valeurHorloge = `${zeroPad(maintenant.getHours(), 2)}:${zeroPad(maintenant.getMinutes(), 2)}`;
              break;
          }

          // remplacer la balise par l’horloge
          const regExp = new RegExp("\\[" + (curBalise.slice(1, curBalise.length - 1)) + "\\]", "g");
          texteDynamique = texteDynamique.replace(regExp, valeurHorloge);
        });
      }

      // ===================================================
      // Mémoire [mémoire nom de la mémoire]
      // ===================================================
      const baliseMemoire = "(mémoire|memoire) (.+?)";
      const xBaliseMemoireMulti = new RegExp("\\[" + baliseMemoire + "\\]", "gi");
      const xBaliseMemoireSolo = new RegExp("\\[" + baliseMemoire + "\\]", "i");

      if (xBaliseMemoireMulti.test(texteDynamique)) {
        // retrouver toutes les balises conjugaison
        const allBalises = texteDynamique.match(xBaliseMemoireMulti);
        // ne garder qu’une seule occurrence de chaque afin de ne pas calculer plusieurs fois la même balise.
        const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index);
        // parcourir chaque balise trouvée
        balisesUniques.forEach(curBalise => {
          // retrouver la préposition et la cible
          const decoupe = curBalise.match(xBaliseMemoireSolo);

          const memoire = decoupe[1];
          const intituleValeurOuListe = decoupe[2];

          let valeurMemoire: string;

          const elementTrouve = contexteTour.trouverValeur(intituleValeurOuListe);
          if (elementTrouve) {
            valeurMemoire = elementTrouve.toString();
          } else {
            valeurMemoire = '(mémoire pas trouvée: ' + intituleValeurOuListe + ')';
          }
          // remplacer la balise par le verbe conjugué
          const expression = `${memoire} ${intituleValeurOuListe}`;
          const regExp = new RegExp("\\[" + expression + "\\]", "g");
          texteDynamique = texteDynamique.replace(regExp, valeurMemoire);
        });
      }

      // ===================================================
      // CONJUGAISON
      // ===================================================

      // verbe(1) modeTemps(2) [negation(3)] sujet(4)
      const baliseVerbe = "v ((?:se |s’|s')?\\S+(?:ir|er|re)) (ipr|ipac|iimp|ipqp|ipas|ipaa|ifus|ifua|cpr|cpa|spr|spa|simp|spqp) (?:(pas|plus|que|ni) )?(ceci|cela|ici|quantitéCeci|quantitéCela)";
      const xBaliseVerbeMulti = new RegExp("\\[" + baliseVerbe + "\\]", "gi");
      const xBaliseVerbeSolo = new RegExp("\\[" + baliseVerbe + "\\]", "i");

      if (xBaliseVerbeMulti.test(texteDynamique)) {

        // retrouver toutes les balises conjugaison
        const allBalises = texteDynamique.match(xBaliseVerbeMulti);
        // ne garder qu’une seule occurrence de chaque afin de ne pas calculer plusieurs fois la même balise.
        const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)
        // parcourir chaque balise trouvée
        balisesUniques.forEach(curBalise => {
          // retrouver la préposition et la cible
          const decoupe = xBaliseVerbeSolo.exec(curBalise);

          const verbe = decoupe[1];
          const modeTemps = decoupe[2];
          const negation = decoupe[3];
          const sujet = decoupe[4];

          // retrouver le verbe conjugué
          const verbeConjugue: string = this.calculerConjugaison(verbe, modeTemps, negation, sujet, this.eju.curLieu, contexteTour, evenement);

          // remplacer la balise par le verbe conjugué
          const expression = `v ${verbe} ${modeTemps}${(negation ? (" " + negation) : "")} ${sujet}`;
          const regExp = new RegExp("\\[" + expression + "\\]", "g");
          texteDynamique = texteDynamique.replace(regExp, verbeConjugue);

        });
      }

      // ===================================================
      // IMAGE
      // ===================================================
      // image nom_fichier(1)
      const baliseImage = "image ([\\w.-]*\\w)";
      const xBaliseImageMulti = new RegExp("\\[" + baliseImage + "\\]", "gi");
      const xBaliseImageSolo = new RegExp("\\[" + baliseImage + "\\]", "i");

      if (xBaliseImageMulti.test(texteDynamique)) {
        // retrouver toutes les balises image
        const allBalises = texteDynamique.match(xBaliseImageMulti);
        // ne garder qu’une seule occurrence de chaque afin de ne pas calculer plusieurs fois la même balise.
        const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)
        // parcourir chaque balise trouvée
        balisesUniques.forEach(curBalise => {
          // retrouver le nom du fichier
          const decoupe = xBaliseImageSolo.exec(curBalise);
          const fichier = decoupe[1];
          // générer la balise image
          const baliseImage = '@@image:' + fichier + '@@';
          // remplacer les [] par une balise image
          const expression = `image ${fichier}`;
          const regExp = new RegExp("\\[" + expression + "\\]", "g");
          texteDynamique = texteDynamique.replace(regExp, baliseImage);
        });
      }

      // ===================================================
      // HASHTAG
      // ===================================================
      // #groupe nominal(1)
      const baliseHashtag  = "#\\s?((?:le |la |l(?:’|')|les )?(?!(?:\\d|(?:un|une|de|du|des|le|la|les|l)\\b)|\"|d’|d')(?:\\S+?|(?:\\S+? (?:(?:(?:à|dans|et|sous|sur|vers) (?:la |le |les |l’|'))|de (?:la |l'|l’)?|du |des |d'|d’|à |au(?:x)? |en |qui )\\S+?))(?:(?: )(?!\\(?:|(?:(?:ne|et|ou|soit|mais|un|de|du|dans|sur|avec|concernant|se)\\b)|(?:d’|d'|n’|n'|s’|s'|à))(?:\\S+?))?)";
      const xBaliseHashtagMulti = new RegExp("\\[" + baliseHashtag + "\\]", "gi");
      const xBaliseHashtagSolo = new RegExp("\\[" + baliseHashtag + "\\]", "i");

      if (xBaliseHashtagMulti.test(texteDynamique)) {
        // retrouver toutes les balises image
        const allBalises = texteDynamique.match(xBaliseHashtagMulti);
        // ne garder qu’une seule occurrence de chaque afin de ne pas calculer plusieurs fois la même balise.
        const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)
        // parcourir chaque balise trouvée
        balisesUniques.forEach(curBalise => {
          // retrouver le nom du fichier
          const decoupe = xBaliseHashtagSolo.exec(curBalise);
          const elementJeu = decoupe[1];
          // générer la balise image
          const baliseHashtag = '@@hashtag:' + elementJeu + '@@';
          // remplacer les [] par une balise image
          const expression = `#\\s?${elementJeu}`;
          const regExp = new RegExp("\\[" + expression + "\\]", "g");
          texteDynamique = texteDynamique.replace(regExp, baliseHashtag);
        });
      }

      // ===================================================
      // DIVERS
      // ===================================================

      if (texteDynamique.includes("[infinitif action]")) {
        texteDynamique = texteDynamique.replace(/\[infinitif action\]/g, evenement.infinitif ?? '?!');
      }

      // ===================================================
      // PROPRIÉTÉS
      // ===================================================

      // Le nombre de propriété de élément
      const xBaliseNombreDeProprieteMulti = /\[(le )?nombre (de |d’|d')(\S+) (des |du |de la |de l(?:’|')|de |d'|d’)(\S+?|(\S+? (à |en |au(x)? |de (la |l'|l’)?|du |des |d'|d’)\S+?))( (?!\(|(ne|n’|n'|d’|d'|et|ou|soit|mais|un|de|du|dans|sur|avec|se|s’|s')\b)(\S+?))?\]/gi;
      if (xBaliseNombreDeProprieteMulti.test(texteDynamique)) {
        // retrouver toutes les balises nombre de propriété de élément
        const allBalises = texteDynamique.match(xBaliseNombreDeProprieteMulti);
        // remplacer les balises par leur valeur
        texteDynamique = this.suiteTraiterPropriete(texteDynamique, allBalises, false, contexteTour, evenement, declenchements);
      }

      // Le nombre de classe état1 état2 position
      const xBaliseNombreDeClasseEtatPositionMulti = /\[(le )?nombre (de |d’|d')(\S+)( (?!\(|(ne|n’|n'|d’|d'|et|ou|soit|mais|un|de|du|dans|sur|avec|se|s’|s')\b)(\S+))?(( (et )?)(?!\(|(ne|n’|n'|d’|d'|et|ou|soit|mais|un|de|du|dans|sur|avec|se|s’|s')\b)(\S+))?( ((dans |sur |sous )(la |le |les |l’|l')?)(\S+?|(?:\S+? (à |en |au(x)? |de (la |l'|l’)?|du |des |d'|d’)\S+?))( (?!\(|(?:(?:ne|et|ou|soit|mais|un|de|du|dans|sur|avec|concernant|se)\b)|(?:d’|d'|n’|n'|s’|s'|à))(\S+?))?)?\]/gi;
      if (xBaliseNombreDeClasseEtatPositionMulti.test(texteDynamique)) {
        // retrouver toutes les balises nombre de classe état1 état2 position
        const allBalises = texteDynamique.match(xBaliseNombreDeClasseEtatPositionMulti);
        // remplacer les balises par leur valeur
        texteDynamique = this.suiteTraiterPropriete(texteDynamique, allBalises, false, contexteTour, evenement, declenchements);
      }

      // La propriété de élément
      const xBaliseProprieteDeElementMulti = /\[(le |la |les |l'|l’)?(?!(v|p|le|la|les|l'|l’|si|sinon|sinonsi|ou|au|en|fin|puis|initialement|(([1-9][0-9]?)(?:e|eme|ème|ere|ère|re)))\b)(\S+?) (des |du |de la |de l(?:’|')|de |d'|d’)(\S+?|(\S+? (à |en |au(x)? |de (la |l'|l’)?|du |des |d'|d’)\S+?))( (?!\(|(ne|n’|n'|d’|d'|et|ou|un|de|du|dans|sur|avec|se|s’|s')\b)(\S+?))?\]/gi;
      if (xBaliseProprieteDeElementMulti.test(texteDynamique)) {
        // retrouver toutes les balises propriété de élément
        const allBalises = texteDynamique.match(xBaliseProprieteDeElementMulti);
        // remplacer les balises par leur valeur
        texteDynamique = this.suiteTraiterPropriete(texteDynamique, allBalises, false, contexteTour, evenement, declenchements);
      }

      // propriété élément
      const xBaliseProprieteElementMulti = /\[(?!(v|p|le|la|les|l'|l’|si|sinon|sinonsi|ou|au|en|fin|puis|initialement|(([1-9][0-9]?)(?:e|eme|ème|ere|ère|re)))\b)(\S+?) (\S+?|(\S+? (à |en |au(x)? |de (la |l'|l’)?|du |des |d'|d’)\S+?))( (?!\(|(ne|n’|n'|d’|d'|et|ou|un|de|du|dans|sur|avec|se|s’|s'|si|sinon|sinonsi|au|en|fin|puis|initialement)\b)(\S+?))?\]/gi;
      if (xBaliseProprieteElementMulti.test(texteDynamique)) {
        // retrouver toutes les balises  propriété élément
        const allBalises = texteDynamique.match(xBaliseProprieteElementMulti);
        // remplacer les balises par leur valeur
        texteDynamique = this.suiteTraiterPropriete(texteDynamique, allBalises, true, contexteTour, evenement, declenchements);
      }

      // s’il reste des crochets à interpréter
      if (texteDynamique.includes('[')) {
        // ===================================================
        // > CONDITIONS
        // ===================================================
        texteDynamique = this.calculerCrochetsConditions(texteDynamique, nbAffichage, intact, contexteTour, evenement, declenchements);
      }

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
      if (!curProprieteIntituleCorrige.match(/^(le |la |les |l'|l’)/i)) {
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
            valeur = (curProprieteCible as ProprieteElement).valeur;
          } else if (curPropriete.type === TypeProprieteJeu.proprieteElement) {
            const propriete = (curProprieteCible as ProprieteElement);
            // texte
            if (propriete.type == TypeValeur.mots) {
              valeur = this.calculerTexteDynamique(propriete.valeur, ++propriete.nbAffichage, this.jeu.etats.possedeEtatIdElement(curPropriete.element, this.jeu.etats.intactID), contexteTour, evenement, declenchements);
              // nombre
            } else {
              valeur = (curProprieteCible as ProprieteElement).valeur;
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
              console.log("j’ai débuté un fois et là je suis dans le sinon !");

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
    let verbePronominal = /(se |s’|s')(.+)/.test(verbe);
    let infinitifSansLeSe = verbePronominal ? verbe.replace(/^(se |s’|s')/i, "") : verbe;
    sujet = InstructionsUtils.trouverCibleSpeciale(sujetStr, contexteTour, evenement, this.eju, this.jeu);
    if (!sujet || !ClasseUtils.heriteDe(sujet.classe, EClasseRacine.element)) {
      console.error("calculerConjugaison > «", sujetStr, "» n’est pas un élément du jeu");
    }
    const personne = ((sujet as ElementJeu).nombre == Nombre.p) ? "3pp" : "3ps";

    // si temps avec auxiliaire c’est facile on doit juste conjuguer être/avoir puis ajouter le PP.
    // => on peut le traiter comme n’importe quel verbe régulier
    if (Conjugaison.tempsAvecAuxiliaire(modeTemps)) {
      verbeConjugue = Conjugaison.getConjugaigonVerbeRegulier(infinitifSansLeSe, modeTemps, personne, verbePronominal);
      // sinon il faut vraiment savoir conjuguer le verbe
    } else {
      // retrouver le verbe parmis les verbes irréguliers pris en charge
      let conjugaisonVerbeIrregulier = Conjugaison.getVerbeIrregulier(infinitifSansLeSe);
      // verbe trouvé parmis les irréguliers
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

  private calculerCrochetsConditions(texteDynamique: string, nbAffichage: number, intact: boolean, contexteTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined): string {
    let retVal = "";
    if (texteDynamique) {
      const morceaux = texteDynamique.split(/\[|\]/);
      let statut = new StatutCondition(nbAffichage, intact, morceaux, 0);
      // jamais une condition au début car dans ce cas ça donne une première chaine vide.
      let suivantEstCondition = false; // description.trim().startsWith("[");
      let afficherMorceauSuivant = true;
      let conditionQuiPrecede = "";
      // console.log("$$$$$$$$$$$ morceaux=", morceaux, "suivantEstCondition=", suivantEstCondition);
      for (let index = 0; index < morceaux.length; index++) {
        statut.curMorceauIndex = index;
        const curMorceau = morceaux[index];
        if (suivantEstCondition) {
          conditionQuiPrecede = curMorceau;
          afficherMorceauSuivant = this.estConditionDescriptionRemplie(curMorceau, statut, contexteTour, evenement, declenchements);
          suivantEstCondition = false;
        } else {
          if (afficherMorceauSuivant) {
            // ajouter le morceau s’il n’est pas vide
            if(curMorceau?.length){
              // si on est après un bloc condition
              if(conditionQuiPrecede.match(/^fin/gi)){
                retVal += curMorceau;
              // si on est à l’intérieur d’un bloc condition
              }else{
                retVal += "{E}" + curMorceau + "{E}";
              }
            }
          }
          suivantEstCondition = true;
        }
      }
    } else {
      retVal = "";
    }
    return retVal;
  }

  /** Afficher la fiche d’aide. */
  private recupererFicheAide(intitule: Intitule): string {

    // A) Chercher si une fiche d’aide exacte existe (avec accents)
    let ficheAide = this.jeu.aides.find(x => x.infinitif === intitule.nom);

    // B) Chercher l’infinitif original de l’action
    if (!ficheAide) {
      let actionOriginaleTrouvee: Action | undefined;
      for (const action of this.jeu.actions) {
        for (const synonyme of action.synonymes) {
          if (synonyme == intitule.nom) {
            actionOriginaleTrouvee = action;
            break;
          }
        }
        if (actionOriginaleTrouvee) {
          break;
        }
      }
      if (actionOriginaleTrouvee) {
        ficheAide = this.jeu.aides.find(x => x.infinitif == actionOriginaleTrouvee.infinitif);
      }
    }

    // renvoyer l’aide trouvée
    if (ficheAide) {
      return ficheAide.informations;
    } else {
      return this.recupererFicheAideSansTenirCompteDesAccents(intitule);
    }

  }

  private recupererFicheAideSansTenirCompteDesAccents(intitule: Intitule): string {

    const nomNormalise = StringUtils.normaliserMot(intitule.nom)

    // A) Chercher si une fiche d’aide exacte existe (avec accents)
    let ficheAide = this.jeu.aides.find(x => StringUtils.normaliserMot(x.infinitif) === nomNormalise);

    // B) Chercher l’inifitif original de l’action
    if (!ficheAide) {
      let actionOriginaleTrouvee: Action | undefined;
      for (const action of this.jeu.actions) {
        for (const synonymeSansAccent of action.synonymesSansAccent) {
          if (synonymeSansAccent == nomNormalise) {
            actionOriginaleTrouvee = action;
            break;
          }
        }
        if (actionOriginaleTrouvee) {
          break;
        }
      }
      if (actionOriginaleTrouvee) {
        ficheAide = this.jeu.aides.find(x => x.infinitif == actionOriginaleTrouvee.infinitif);
      }
    }

    // renvoyer l’aide trouvée
    if (ficheAide) {
      return ficheAide.informations;
    } else {
      return "Désolé, je n’ai pas de page d’aide concernant la commande « " + intitule.nom + " »";
    }

  }

  /** Afficher le statut d'une porte ou d'un contenant (verrouillé, ouvrable, ouvert, fermé) */
  private afficherStatut(obj: Objet) {
    let retVal = "";
    if (ClasseUtils.heriteDe(obj.classe, EClasseRacine.contenant) || ClasseUtils.heriteDe(obj.classe, EClasseRacine.porte)) {

      const ouvrable = this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.ouvrableID);
      const ouvert = this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.ouvertID);
      const verrouillable = this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.verrouillableID);;
      const verrou = this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.verrouilleID);;

      if (obj.genre == Genre.f) {
        if (ouvert) {
          // pas besoin de préciser qu’on contenant est ouvert, sauf s’il est ouvrable.
          if (!ClasseUtils.heriteDe(obj.classe, EClasseRacine.contenant) || ouvrable) {
            retVal += "Elle est ouverte.";
          }
        } else {
          retVal += "Elle est fermée" + (verrouillable ? (verrou ? " et verrouillée." : " mais pas verrouillée.") : ".");
        }
        if (ouvrable && !verrou) {
          retVal += " Vous pouvez " + (ouvert ? 'la fermer.' : 'l’ouvrir.');
        }
      } else {
        if (ouvert) {
          // pas besoin de préciser qu’on contenant est ouvert, sauf s’il est ouvrable.
          if (!ClasseUtils.heriteDe(obj.classe, EClasseRacine.contenant) || ouvrable) {
            retVal += "Il est ouvert.";
          }
        } else {
          retVal += "Il est fermé" + (verrouillable ? (verrou ? " et verrouillé." : " mais pas verrouillé.") : ".");
        }
        if (ouvrable && !verrou) {
          retVal += " Vous pouvez " + (ouvert ? 'le fermer.' : 'l’ouvrir.');
        }
      }
    }
    return retVal;
  }

  /**
   * Lister le contenu d'un objet ou d'un lieu.
   * Remarque: le contenu invisible n'est pas affiché.
   */
  public executerListerContenu(ceci: ElementJeu, afficherObjetsCachesDeCeci: boolean, afficherObjetsNonVisiblesDeCeci: boolean, afficherObjetsSecretsDeCeci: boolean, afficherObjetsDansSurSous: boolean, inclureJoueur: boolean, prepositionSpatiale: PrepositionSpatiale, retrait: number = 1): Resultat {

    let resultat = new Resultat(false, '', 1);
    const objets = this.eju.trouverContenu(ceci, afficherObjetsCachesDeCeci, afficherObjetsNonVisiblesDeCeci, afficherObjetsSecretsDeCeci, afficherObjetsDansSurSous, inclureJoueur, prepositionSpatiale);

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
              resultat.sortie += " (fermé" + (obj.genre == Genre.f ? 'e' : '') + (obj.nombre == Nombre.p ? 's' : '') + ")";
            }

            // si on peut voir le contenu du contenant => contenu / (vide)
            if (this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.ouvertID) ||
              this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.transparentID)
            ) {
              let contenu = this.executerListerContenu(obj, false, false, false, false, false, prepositionSpatiale, retrait + 1).sortie;
              if (contenu) {
                resultat.sortie += contenu;
              } else {
                resultat.sortie += " (vide" + (obj.nombre == Nombre.p ? 's' : '') + ")";
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
          const sousRes = this.executerListerContenu(support, false, false, false, false, false, PrepositionSpatiale.sur);
          resultat.sortie += sousRes.sortie;
        });

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
  public executerDecrireContenu(ceci: ElementJeu, texteSiQuelqueChose: string, texteSiRien: string, afficherObjetsCachesDeCeci: boolean, afficherObjetsNonVisiblesDeCeci: boolean, afficherObjetsSecretsDeCeci: boolean, afficherObjetsDansSurSous: boolean, inclureJoueur: boolean, prepositionSpatiale: PrepositionSpatiale): Resultat {

    let resultat = new Resultat(false, '', 1);
    const objets = this.eju.trouverContenu(ceci, afficherObjetsCachesDeCeci, afficherObjetsNonVisiblesDeCeci, afficherObjetsSecretsDeCeci, afficherObjetsDansSurSous, inclureJoueur, prepositionSpatiale);

    // si la recherche n’a pas retourné d’erreur
    if (objets !== undefined) {
      resultat.succes = true;

      // - objets avec aperçu (ne pas inclure les objets décoratifs):
      let objetsAvecApercuSpecifique = objets.filter(x => x.apercu !== null && !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID));
      // const nbObjetsAvecApercus = objetsAvecApercu.length;
      // - objets sans apercu (ne pas inclure les éléments décoratifs)
      let objetsAvecApercuAuto = objets.filter(x => x.apercu === null && !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID));
      // - nombre d’objets sans aperçu (et non décoratifs)
      let nbObjetsApercuAuto = objetsAvecApercuAuto.length;
      // - nombre d’objets sans aperçu
      let nbObjetsSansApercu = objets.filter(x => this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID)).length;

      // - supports décoratifs (eux ne sont pas affichés, mais leur contenu bien !)
      let supportsDecoratifs = objets.filter(x => this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID) && ClasseUtils.heriteDe(x.classe, EClasseRacine.support));

      // A.1 AFFICHER ÉLÉMENTS AVEC UN APERÇU
      objetsAvecApercuSpecifique.forEach(obj => {
        const apercuCalcule = this.calculerTexteDynamique(obj.apercu, ++obj.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.intactID), undefined, undefined, undefined);
        // l’objet a été vu par le joueur
        this.jeu.etats.ajouterEtatIdElement(obj, this.jeu.etats.vuID, this.eju);
        // si l'aperçu n'est pas vide, l'ajouter.
        if (apercuCalcule) {
          // (ignorer les objets dont l'aperçu vaut "-")
          if (apercuCalcule == '-') {
            nbObjetsSansApercu += 1;
          } else {
            resultat.sortie += "{U}" + apercuCalcule;
            // B.2 SI C’EST UN SUPPPORT, AFFICHER SON CONTENU (VISIBLE et NON Caché)
            // (uniquement si option activée)
            if (this.jeu.parametres.activerDescriptionDesObjetsSupportes) {
              if (ClasseUtils.heriteDe(obj.classe, EClasseRacine.support)) {
                // enlever le retour à la ligne auto
                if (resultat.sortie.endsWith('{N}')) {
                  resultat.sortie = resultat.sortie.slice(0, resultat.sortie.length - '{N}'.length);
                }
                // ne pas afficher objets cachés du support, on ne l’examine pas directement
                const sousRes = this.executerDecrireContenu(obj, (" Dessus, il y a "), "", false, false, false, false, false, PrepositionSpatiale.sur);
                resultat.sortie += sousRes.sortie;
              }
            }
          }
          // si l'aperçu est vide, ajouter l'objets à la liste des objets sans aperçu.
        } else {
          objetsAvecApercuAuto.push(obj);
          nbObjetsApercuAuto += 1;
          // TODO: faut-il considérer que les objets forcés sans aperçu ont été vus ?
        }
      });

      // B. AFFICHER LES ÉLÉMENTS POSITIONNÉS SUR DES SUPPORTS DÉCORATIFS
      // (uniquement si option activée)
      if (this.jeu.parametres.activerDescriptionDesObjetsSupportes) {
        supportsDecoratifs.forEach(support => {
          // ne pas afficher les objets cachés du support (on ne l’examine pas directement)
          const sousRes = this.executerDecrireContenu(support, ("{U}Sur " + this.eju.calculerIntituleElement(support, false, true) + " il y a "), "", false, false, false, false, false, PrepositionSpatiale.sur);
          resultat.sortie += sousRes.sortie;
        });
      }

      // C.1 AFFICHER ÉLÉMENTS SANS APERÇU
      if (nbObjetsApercuAuto > 0) {
        resultat.sortie += texteSiQuelqueChose;
        let curObjIndex = 0;
        objetsAvecApercuAuto.forEach(obj => {
          ++curObjIndex;
          // l’objet a été vu par le joueur
          this.jeu.etats.ajouterEtatIdElement(obj, this.jeu.etats.vuID, this.eju);
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
              const sousRes = this.executerDecrireContenu(objetsAvecApercuAuto[0], (" Dessus, il y a "), ("{U}Il n'y a rien de particulier dessus."), false, false, false, false, false, PrepositionSpatiale.sur);
              resultat.sortie += sousRes.sortie;
            }
            // sinon il y en a plusieurs
          } else {
            let supportsAvecApercuAuto = objetsAvecApercuAuto.filter(x => ClasseUtils.heriteDe(x.classe, EClasseRacine.support));
            supportsAvecApercuAuto.forEach(support => {
              // ne pas afficher les objets cachés du support (on ne l’examine pas directement)
              const sousRes = this.executerDecrireContenu(support, ("{U}Sur " + this.eju.calculerIntituleElement(support, false, true) + " il y a "), ("{U}Il n'y a rien de particulier sur " + this.eju.calculerIntituleElement(support, false, true) + "."), false, false, false, false, false, PrepositionSpatiale.sur);
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
            if (this.jeu.etats.estVisible(curPorteObstacle, this.eju)) {
              // décrire l’obstacle
              // - l’objet a été vu par le joueur
              this.jeu.etats.ajouterEtatIdElement(curPorteObstacle, this.jeu.etats.vuID, this.eju);
              // - si aperçu défini
              if (curPorteObstacle.apercu) {
                // afficher l'aperçu.
                if (curPorteObstacle.apercu != '-') {
                  resultat.sortie += "{U}" + this.calculerTexteDynamique(curPorteObstacle.apercu, ++curPorteObstacle.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(curPorteObstacle, this.jeu.etats.intactID), undefined, undefined, undefined);
                } else {
                  // TODO: faut-il considéré qu’un objet est vu quand son aperçu est « - » ?
                }
                // - si pas d’aperçu défini
              } else {
                // porte
                if (ClasseUtils.heriteDe(curPorteObstacle.classe, EClasseRacine.porte)) {
                  // par défaut, afficher le nom de la porte et ouvert/fermé.
                  resultat.sortie += "{U}" + ElementsJeuUtils.calculerIntituleGenerique(curPorteObstacle, true) + (curPorteObstacle.nombre == Nombre.p ? " sont " : " est ");
                  if (this.jeu.etats.possedeEtatIdElement(curPorteObstacle, this.jeu.etats.ouvertID)) {
                    resultat.sortie += this.jeu.etats.obtenirIntituleEtatPourElementJeu(curPorteObstacle, this.jeu.etats.ouvertID)
                  } else {
                    resultat.sortie += this.jeu.etats.obtenirIntituleEtatPourElementJeu(curPorteObstacle, this.jeu.etats.fermeID)
                  }
                  resultat.sortie += ".";
                  // obstacle
                } else {
                  resultat.sortie += "{U}" + ElementsJeuUtils.calculerIntituleGenerique(curPorteObstacle, true) + (curPorteObstacle.nombre == Nombre.p ? " bloquent" : " bloque") + " la sortie (" + Localisation.getLocalisation(voisin.localisation) + ").";
                }

              }
            }
          }
        });
      }

      // si on n’a encore rien affiché, afficher le texte spécifique
      if (!resultat.sortie && nbObjetsSansApercu == 0) {
        resultat.sortie = texteSiRien;
        // enlever le 1er {N} du résultat
        // } else if (resultat.sortie.startsWith("{N}")) {
        // resultat.sortie = resultat.sortie.slice(3);
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
      // si aperçu dispo pour l’obstacle, on l’affiche.
      if (obstacle.apercu) {
        retVal = this.calculerTexteDynamique(obstacle.apercu, ++obstacle.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(obstacle, this.jeu.etats.intactID), undefined, undefined, undefined);
        // l’objet a été vu par le joueur
        this.jeu.etats.ajouterEtatIdElement(obstacle, this.jeu.etats.vuID, this.eju);
        // sinon on affiche texte auto.
      } else {
        retVal = ElementsJeuUtils.calculerIntituleGenerique(obstacle, true) + (obstacle.nombre == Nombre.p ? " sont" : " est") + " dans le chemin.";
      }
    } else {
      // trouver la porte qui est dans le chemin
      const porteID = this.eju.getVoisinDirectionID(loc, EClasseRacine.porte);
      if (porteID !== -1) {
        const porte = this.eju.getObjet(porteID);
        const ouvert = this.jeu.etats.possedeEtatIdElement(porte, this.jeu.etats.ouvertID);
        // const verrouillable = this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.verrouillableID);;
        // const verrou = this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.verrouilleID);;
        if (porte.genre == Genre.f) {
          if (ouvert) {
            // retVal = ElementsJeuUtils.calculerIntitule(porte, true) + " est ouverte.";
            retVal = texteSiAucunObstacle;
          } else {
            retVal = ElementsJeuUtils.calculerIntituleGenerique(porte, true) + " est fermée.";
          }
        } else {
          if (ouvert) {
            // retVal = ElementsJeuUtils.calculerIntitule(porte, true) + " est ouvert.";
            retVal = texteSiAucunObstacle;
          } else {
            retVal = ElementsJeuUtils.calculerIntituleGenerique(porte, true) + " est fermé.";
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
          retVal = "Sorties :";
          // afficher les voisins : directions + lieux
          if (this.jeu.parametres.activerAffichageDirectionSorties) {
            lieuxVoisinsVisibles.forEach(lieuVoisinVisible => {
              retVal += ("{n}{i}- " + this.afficherLieuVoisinEtLocalisation(lieuVoisinVisible.localisation, lieu.id, lieuVoisinVisible.id, this.jeu.parametres.activerAffichageLieuxInconnus));
            });
            // afficher les voisins: lieux
          } else {
            lieuxVoisinsVisibles.forEach(voisinVisible => {
              retVal += ("{n}{i}- " + this.afficherLieuVoisin(voisinVisible.localisation, lieu.id, voisinVisible.id));
            });
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

  private afficherLieuVoisin(localisation: ELocalisation, curLieuIndex: number, voisinIndex: number) {
    let retVal: string = null;
    let lieu = this.eju.getLieu(voisinIndex);
    let titreLieu = lieu.titre;
    let obstacle = this.afficherObstacle(localisation, "");
    if (obstacle) {
      obstacle = " ({/obstrué/})";
    }
    retVal = titreLieu + obstacle;
    return retVal;
  }

  private afficherLieuVoisinEtLocalisation(localisation: ELocalisation, curLieuIndex: number, voisinIndex: number, afficherLieuxInconnus: boolean): string {
    let retVal: string = null;
    let lieu = this.eju.getLieu(voisinIndex);
    let titreLieu = lieu.titre;
    let obstacle = this.afficherObstacle(localisation, "");

    if (obstacle) {
      obstacle = " ({/obstrué/})";
    }

    let lieuDejaVisite = this.jeu.etats.possedeEtatIdElement(lieu, this.jeu.etats.visiteID);

    switch (localisation) {
      case ELocalisation.nord:
        retVal = "au nord" + obstacle + ((lieuDejaVisite || afficherLieuxInconnus) ? ` : {+${titreLieu}+}` : ' : ?');
        break;
      case ELocalisation.nord_est:
        retVal = "au nord-est" + obstacle + ((lieuDejaVisite || afficherLieuxInconnus) ? ` : {+${titreLieu}+}` : ' : ?');
        break;
      case ELocalisation.est:
        retVal = "à l’est" + obstacle + ((lieuDejaVisite || afficherLieuxInconnus) ? ` : {+${titreLieu}+}` : ' : ?');
        break;
      case ELocalisation.sud_est:
        retVal = "au sud-est" + obstacle + ((lieuDejaVisite || afficherLieuxInconnus) ? ` : {+${titreLieu}+}` : ' : ?');
        break;
      case ELocalisation.sud:
        retVal = "au sud" + obstacle + ((lieuDejaVisite || afficherLieuxInconnus) ? ` : {+${titreLieu}+}` : ' : ?');
        break;
      case ELocalisation.sud_ouest:
        retVal = "au sud-ouest" + obstacle + ((lieuDejaVisite || afficherLieuxInconnus) ? ` : {+${titreLieu}+}` : ' : ?');
        break;
      case ELocalisation.ouest:
        retVal = "à l’ouest" + obstacle + ((lieuDejaVisite || afficherLieuxInconnus) ? ` : {+${titreLieu}+}` : ' : ?');
        break;
      case ELocalisation.nord_ouest:
        retVal = "au nord-ouest" + obstacle + ((lieuDejaVisite || afficherLieuxInconnus) ? ` : {+${titreLieu}+}` : ' : ?');
        break;
      case ELocalisation.haut:
        retVal = "en haut" + obstacle + ` : {+${titreLieu}+}`;
        break;
      case ELocalisation.bas:
        retVal = "en bas" + obstacle + ` : {+${titreLieu}+}`;
        break;
      case ELocalisation.interieur:
        retVal = "devant" + obstacle + ` : {+${titreLieu}+}`;
        break;
      case ELocalisation.exterieur:
        retVal = "dehors" + obstacle + ((lieuDejaVisite || afficherLieuxInconnus) ? ` : {+${titreLieu}+}` : ' : ?');
        break;

      default:
        retVal = localisation.toString();
    }

    return retVal;
  }


}