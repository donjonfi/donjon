import { ConditionDebutee, StatutCondition, xFois } from "../../models/jouer/statut-conditions";
import { ELocalisation, Localisation } from "../../models/jeu/localisation";
import { PositionObjet, PrepositionSpatiale } from "../../models/jeu/position-objet";

import { AnalyseurCondition } from "../compilation/analyseur/analyseur.condition";
import { ClasseUtils } from "../commun/classe-utils";
import { Compteur } from "../../models/compilateur/compteur";
import { ConditionsUtils } from "./conditions-utils";
import { Conjugaison } from "./conjugaison";
import { EClasseRacine } from "../../models/commun/constantes";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { Genre } from "../../models/commun/genre.enum";
import { InstructionsUtils } from "./instructions-utils";
import { Intitule } from "../../models/jeu/intitule";
import { Jeu } from "../../models/jeu/jeu";
import { Lieu } from "../../models/jeu/lieu";
import { Nombre } from "../../models/commun/nombre.enum";
import { Objet } from "../../models/jeu/objet";
import { PhraseUtils } from "../commun/phrase-utils";
import { ProprieteElement } from "../../models/commun/propriete-element";
import { Resultat } from "../../models/jouer/resultat";
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

  public interpreterContenuDire(contenu: string, nbExecutions: number, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null, evenement: Evenement = null, declenchements: number) {
    // A) 

    // ======================================================================================================
    // PROPRIÉTÉS [description|intitulé|intitule|singulier|pluriel|accord|es|e|s|pronom|Pronom|il|Il|l’|l'|le|lui ceci|cela|ici|quantitéCeci|quantitéCela
    // ======================================================================================================

    const balisePropriete = "(quantité|quantite|intitulé|intitule|singulier|pluriel|accord|es|s|e|pronom|Pronom|il|Il|l’|l'|le|lui|préposition|preposition) (ceci(?:\\?)?|cela(?:\\?)?|ici|quantitéCeci|quantitéCela)";
    const xBaliseProprieteMulti = new RegExp("\\[" + balisePropriete + "\\]", "gi");
    const xBaliseProprieteSolo = new RegExp("\\[" + balisePropriete + "\\]", "i");

    if (xBaliseProprieteMulti.test(contenu)) {
      // retrouver toutes les balises de contenu [objets {sur|dans|sous} ceci|cela|ici|inventaire]
      const allBalises = contenu.match(xBaliseProprieteMulti);
      // ne garder qu’une seule occurence de chaque afin de ne pas calculer plusieurs fois la même balise.
      const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)
      // parcourir chaque balise trouvée
      balisesUniques.forEach(curBalise => {
        // retrouver la préposition et la cible
        const decoupe = xBaliseProprieteSolo.exec(curBalise);

        const proprieteString = decoupe[1];
        let cibleString = decoupe[2];
        const cible: ElementJeu = InstructionsUtils.trouverCibleSpeciale(cibleString, ceci, cela, evenement, this.eju, this.jeu);

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
                console.error("interpreterContenuDire: pronom ceci: ceci n'est pas un élément.");
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
              if ((ceci as ElementJeu).nombre !== Nombre.p) {
                // masculin
                if ((ceci as ElementJeu).genre !== Genre.f) {
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
              if ((ceci as ElementJeu).nombre !== Nombre.p) {
                // masculin
                if ((ceci as ElementJeu).genre !== Genre.f) {
                  resultat = "lui";
                  // féminin
                } else {
                  resultat = "elle";
                }
                // pluriel
              } else {
                // masculin
                if ((ceci as ElementJeu).genre !== Genre.f) {
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
              console.error("interpreterContenuDire: propriete pas prise en charge (Element) :", proprieteString);
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

            // inconnu
            default:
              console.error("interpreterContenuDire: propriete pas prise en charge (Intitulé) :", proprieteString);
              break;
          }
          // ne rien metre si on cible ceci? ou cela? (car argument factultatif)
        } else if (cibleString == 'ceci?' || cibleString == 'cela?') {
          resultat = "";
          // cible non trouvée
        } else {
          resultat = "???"
        }

        // echaper le ? à la fin de ceci? cela?
        if (cibleString == 'ceci?' || cibleString == 'cela?') {
          cibleString = cibleString.replace("?", "\\?");
        }

        // remplacer la balise par le résultat
        const xCurBalise = new RegExp("\\[" + proprieteString + " " + cibleString + "\\]", "g");
        contenu = contenu.replace(xCurBalise, resultat);

      });

    }

    // Aperçu (d’un objet)
    if (contenu.includes("[aperçu") || contenu.includes("[apercu")) {
      if (contenu.includes("[aperçu ceci]") || contenu.includes("[apercu ceci]")) {
        let apercuCeci = "???";
        if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.element)) {
          const eleCeci = ceci as ElementJeu;
          apercuCeci = this.calculerDescription(eleCeci.apercu, ++eleCeci.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(eleCeci, this.jeu.etats.intactID), ceci, cela, evenement, declenchements);
          contenu = contenu.replace(/\[(aperçu|apercu) ceci\]/g, apercuCeci);
        } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.direction)) {
          const dirCeci = ceci as Localisation;
          let voisinID = this.eju.getVoisinDirectionID(dirCeci, EClasseRacine.lieu);
          if (voisinID !== -1) {
            let voisin = this.eju.getLieu(voisinID);
            apercuCeci = this.calculerDescription(voisin.apercu, ++voisin.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(voisin, this.jeu.etats.intactID), ceci, cela, evenement, declenchements);
          } else {
            console.error("interpreterContenuDire: aperçu de ceci: voisin pas trouvé dans cette direction.");
          }
        } else {
          console.error("interpreterContenuDire: aperçu de ceci: ceci n'est pas un élément jeu");
        }
        contenu = contenu.replace(/\[(aperçu|apercu) ceci\]/g, apercuCeci);
      }
      if (contenu.includes("[aperçu cela]") || contenu.includes("[apercu cela]")) {
        let apercuCela = "???";
        if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.element)) {
          const eleCela = cela as ElementJeu;
          apercuCela = this.calculerDescription(eleCela.apercu, ++eleCela.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(eleCela, this.jeu.etats.intactID), ceci, cela, evenement, declenchements);
          contenu = contenu.replace(/\[(aperçu|apercu) cela\]/g, apercuCela);
        } else if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.direction)) {
          const dirCela = cela as Localisation;
          let voisinID = this.eju.getVoisinDirectionID(dirCela, EClasseRacine.lieu);
          if (voisinID !== -1) {
            let voisin = this.eju.getLieu(voisinID);
            apercuCela = this.calculerDescription(voisin.apercu, ++voisin.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(voisin, this.jeu.etats.intactID), ceci, cela, evenement, declenchements);
          } else {
            console.error("interpreterContenuDire: aperçu de cela: voisin pas trouvé dans cette direction.");
          }
        } else {
          console.error("interpreterContenuDire: aperçu de cela: cela n'est pas un élément jeu");
        }
      }
    }


    // ================================================================================
    // STATUT
    // ================================================================================

    // statut (porte, contenant)
    if (contenu.includes("[statut")) {
      if (contenu.includes("[statut ceci]")) {
        if (ceci && ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
          const statutCeci = this.afficherStatut(ceci as Objet);
          contenu = contenu.replace(/\[statut ceci\]/g, statutCeci);
        } else {
          console.error("interpreterContenuDire: statut de ceci: ceci n'est pas un objet");
        }
      }
      if (contenu.includes("[statut cela]")) {
        if (cela && ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
          const statutCela = this.afficherStatut(cela as Objet);
          contenu = contenu.replace(/\[statut cela\]/g, statutCela);
        } else {
          console.error("interpreterContenuDire: statut de cela: cela n'est pas un objet");
        }
      }
    }

    // ================================================================================
    // OBJETS (CONTENU) [liste|décrire objets sur|sous|dans ici|ceci|cela|inventaire]
    // ================================================================================
    if (contenu.includes("[lister objets ") || contenu.includes("[décrire objets ")) {

      // retrouver toutes les balises de contenu [objets {sur|dans|sous} ceci|cela|ici|inventaire]
      const xBaliseContenu = /\[(décrire|lister) objets (?:(sur|sous|dans|) )?(ici|ceci|cela|inventaire)\]/gi;
      const allBalises = contenu.match(xBaliseContenu);
      // ne garder qu’une seule occurence de chaque afin de ne pas calculer plusieurs fois la même balise.
      const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)

      // parcourir chaque balise trouvée
      balisesUniques.forEach(curBalise => {
        // retrouver la préposition et la cible
        const decoupe = /\[(décrire|lister) objets (?:(sur|sous|dans|) )?(ici|ceci|cela|inventaire)\]/i.exec(curBalise);

        const ListerDecrireString = decoupe[1];
        let isLister = ListerDecrireString.toLowerCase() == 'lister';
        const prepositionString = decoupe[2]; // dans par défaut
        const cibleString = decoupe[3];

        let phraseSiVide = "";
        let phraseSiQuelqueChose = "{U}Vous voyez ";
        let afficherObjetsCaches = true;

        const cible: ElementJeu = InstructionsUtils.trouverCibleSpeciale(cibleString, ceci, cela, evenement, this.eju, this.jeu);

        // cas particuliers
        // > inventaire / joueur
        if (cible == this.jeu.joueur) {
          phraseSiQuelqueChose = "";
          // > ici
        } else if (cible == this.eju.curLieu) {
          afficherObjetsCaches = false;
        }

        // retrouver la préposition (dans par défaut)
        let preposition = PrepositionSpatiale.dans;
        if (prepositionString) {
          preposition = PositionObjet.getPrepositionSpatiale(prepositionString);
        }
        if (cible != this.eju.curLieu) {
          switch (preposition) {
            case PrepositionSpatiale.sur:
              phraseSiVide = "Il n’y a rien dessus.";
              break;

            case PrepositionSpatiale.sous:
              phraseSiVide = "Il n’y a rien dessous.";

            case PrepositionSpatiale.dans:
            default:
              phraseSiVide = "[Pronom " + cibleString + "] [v être ipr " + cibleString + "] vide[s " + cibleString + "].";
          }
        }

        let resultatCurBalise: string;

        if (isLister) {
          resultatCurBalise = this.executerListerContenu(cible, afficherObjetsCaches, false, false, preposition).sortie;
        } else {
          resultatCurBalise = this.executerDecrireContenu(cible, phraseSiQuelqueChose, phraseSiVide, afficherObjetsCaches, false, false, preposition).sortie;
        }

        // remplacer la balise par le résultat
        const xCurBalise = new RegExp("\\[" + ListerDecrireString + " objets " + (prepositionString ? (prepositionString + " ") : "") + cibleString + "\\]", "g");
        contenu = contenu.replace(xCurBalise, resultatCurBalise);

      });

    }

    // ================================================================================
    // OSTACLE
    // ================================================================================

    if (contenu.includes("[obstacle ")) {
      if (contenu.includes("[obstacle vers ceci]")) {
        if (ceci) {
          let obstacleVersCeci: string = null;
          if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.direction)) {
            obstacleVersCeci = this.afficherObstacle((ceci as Localisation).id);
            contenu = contenu.replace(/\[obstacle vers ceci\]/g, obstacleVersCeci);
          } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {
            obstacleVersCeci = this.afficherObstacle(ceci as Lieu);
            contenu = contenu.replace(/\[obstacle vers ceci\]/g, obstacleVersCeci);
          } else {
            console.error("interpreterContenuDire: statut sortie vers ceci: ceci n’est ni une direction ni un lieu.");
          }
        } else {
          console.error("interpreterContenuDire: statut sortie vers ceci: ceci est null.");
        }
      }
      if (contenu.includes("[obstacle vers cela]")) {
        if (cela) {
          let obstacleVersCela: string = null;
          if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.direction)) {
            obstacleVersCela = this.afficherObstacle((cela as Localisation).id);
            contenu = contenu.replace(/\[obstacle vers cela\]/g, obstacleVersCela);
          } else if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.lieu)) {
            obstacleVersCela = this.afficherObstacle(cela as Lieu);
            contenu = contenu.replace(/\[obstacle vers cela\]/g, obstacleVersCela);
          } else {
            console.error("interpreterContenuDire: statut sortie vers cela: cela n’est ni une direction ni un lieu.");
          }
        } else {
          console.error("interpreterContenuDire: statut sortie vers cela: cela est null.");
        }
      }
    }

    // sorties
    if (contenu.includes("[sorties ici]")) {
      const sortiesIci = this.afficherSorties(this.eju.curLieu);
      contenu = contenu.replace(/\[sorties ici\]/g, sortiesIci);
    }

    // titre
    if (contenu.includes("[titre ici]")) {
      const titreIci = this.eju.curLieu?.titre ?? "(Je ne sais pas où je suis)";
      contenu = contenu.replace(/\[titre ici\]/g, titreIci);
    }

    // aide
    if (contenu.includes("[aide")) {
      if (contenu.includes("[aide ceci]")) {
        const aideCeci = this.recupererFicheAide(ceci);
        contenu = contenu.replace(/\[aide ceci\]/g, aideCeci);
      }
      if (contenu.includes("[aide cela]")) {
        const aideCela = this.recupererFicheAide(cela);
        contenu = contenu.replace(/\[aide cela\]/g, aideCela);
      }
    }


    // ===================================================
    // PROPRIÉTÉS [p nomPropriété ici|ceci|cela]
    // ===================================================
    if (contenu.includes("[p ")) {
      // retrouver toutes les balises de propriété [p xxx ceci]
      const xBaliseGenerique = /\[p (\S+) (ici|ceci|cela)\]/gi;
      const allBalises = contenu.match(xBaliseGenerique);
      // ne garder qu’une seule occurence de chaque afin de ne pas calculer plusieurs fois la même balise.
      const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)
      // parcourir chaque balise trouvée
      balisesUniques.forEach(curBalise => {
        // retrouver la proppriété et la cible
        const decoupe = /\[p (\S+) (ici|ceci|cela)\]/i.exec(curBalise);
        const proprieteString = decoupe[1];
        const cibleString = decoupe[2];
        let cible: ElementJeu = InstructionsUtils.trouverCibleSpeciale(cibleString, ceci, cela, evenement, this.eju, this.jeu);
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
              resultatCurBalise = this.eju.calculerIntituleElement(cible, false, true);
              break;
            // Intitulé (maj forcée, connu forcé)
            case 'Intitulé':
            case 'Intitule':
              resultatCurBalise = this.eju.calculerIntituleElement(cible, true, true);
              break;
            // quantité
            case 'quantité':
            case 'quantite':
              resultatCurBalise = cible.quantite.toString();
              break;

            // Propriété
            default:
              const propriete = cible.proprietes.find(x => x.nom == proprieteString);
              if (propriete) {
                // texte
                if (propriete.type == TypeValeur.mots) {
                  resultatCurBalise = this.calculerDescription(propriete.valeur, ++propriete.nbAffichage, this.jeu.etats.possedeEtatIdElement(cible, this.jeu.etats.intactID), ceci, cela, evenement, declenchements);
                  // nombre
                } else {
                  resultatCurBalise = propriete.valeur;
                }
              } else {
                resultatCurBalise = "(propriété « " + proprieteString + " » pas trouvée)";
              }
              break;
          }

        } else {
          resultatCurBalise = "(" + cibleString + " est null)";
        }
        // remplacer la balise par le résultat
        const xCurBalise = new RegExp("\\[p " + proprieteString + " " + cibleString + "\\]", "g");
        contenu = contenu.replace(xCurBalise, resultatCurBalise);
      });
    }

    // ===================================================
    // COMPTEURS [c nomCompteur]
    // ===================================================
    if (contenu.includes("[c ")) {
      // retrouver toutes les balises de compteurs [c xxx]
      const xBaliseGenerique = /\[c (\S+)\]/gi;
      const allBalises = contenu.match(xBaliseGenerique);
      // ne garder qu’une seule occurence de chaque afin de ne pas calculer plusieurs fois la même balise.
      const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)
      // parcourir chaque balise trouvée
      balisesUniques.forEach(curBalise => {
        let resultatCurBalise: string = null;
        // retrouver la proppriété et la cible
        const decoupe = /\[c (\S+)\]/i.exec(curBalise);
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
          compteur = this.jeu.compteurs.find(x => x.nom == compteurString);
        }

        if (compteur) {
          resultatCurBalise = compteur.valeur.toString();
        } else {
          resultatCurBalise = "(compteur « " + compteurString + " » pas trouvée)";
        }
        // remplacer la balise par le résultat
        const xCurBalise = new RegExp("\\[c " + compteurString + "\\]", "g");
        contenu = contenu.replace(xCurBalise, resultatCurBalise);
      });
    }

    // ===================================================
    // CONJUGAISON
    // ===================================================

    // verbe(1) modeTemps(2) [negation(3)] sujet(4)
    const baliseVerbe = "v ((?:s’|s')?être|avoir|vivre|(?:s’|s')?ouvrir|(?:se )?fermer|pouvoir) (ipr|ipac|iimp|ipqp|ipas|ipaa|ifus|ifua|cpr|cpa|spr|spa|simp|spqp) (?:(pas|plus|que|ni) )?(ceci|cela|ici|quantitéCeci|quantitéCela)";
    const xBaliseVerbeMulti = new RegExp("\\[" + baliseVerbe + "\\]", "gi");
    const xBaliseVerbeSolo = new RegExp("\\[" + baliseVerbe + "\\]", "i");

    if (xBaliseVerbeMulti.test(contenu)) {

      // retrouver toutes les balises de contenu [objets {sur|dans|sous} ceci|cela|ici|inventaire]
      const allBalises = contenu.match(xBaliseVerbeMulti);
      // ne garder qu’une seule occurence de chaque afin de ne pas calculer plusieurs fois la même balise.
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
        const verbeConjugue: string = this.calculerConjugaison(verbe, modeTemps, negation, sujet, this.eju.curLieu, ceci, cela, evenement);

        // remplacer la balise par le verbe conjugué
        const expression = `v ${verbe} ${modeTemps}${(negation ? (" " + negation) : "")} ${sujet}`;
        const regExp = new RegExp("\\[" + expression + "\\]", "g");
        contenu = contenu.replace(regExp, verbeConjugue);

      });
    }

    // ===================================================
    // DIVERS
    // ===================================================

    if (contenu.includes("[infinitif action]")) {
      contenu = contenu.replace(/\[infinitif action\]/g, evenement.infinitif ?? '?!');
    }

    // ===================================================
    // PROPRIÉTÉS
    // ===================================================

    // Le nombre de propriété de élément
    // const baliseNombreDePropriete = "(le )?nombre (de |d’|d')(\\S+) (du |de la |de |d'|d’|des )(\\S+?|(\\S+? (à |en |au(x)? |de (la |l'|l’)?|du |des |d'|d’)\\S+?))( (?!\\(|(ne|n’|n'|d’|d'|et|ou|un|de|dans|sur|avec|se|s’|s')\\b)(\\S+?))?";
    // const xBaliseNombreDeProprieteMulti = new RegExp("\\[" + baliseNombreDePropriete + "\\]", "gi");
    const xBaliseNombreDeProprieteMulti = /\[(le )?nombre (de |d’|d')(\S+) (du |de la |de |d'|d’|des )(\S+?|(\S+? (à |en |au(x)? |de (la |l'|l’)?|du |des |d'|d’)\S+?))( (?!\(|(ne|n’|n'|d’|d'|et|ou|soit|mais|un|de|du|dans|sur|avec|se|s’|s')\b)(\S+?))?\]/gi;
    if (xBaliseNombreDeProprieteMulti.test(contenu)) {
      // retrouver toutes les balises de contenu [objets {sur|dans|sous} ceci|cela|ici|inventaire]
      const allBalises = contenu.match(xBaliseNombreDeProprieteMulti);
      // remplacer les balises par leur valeur
      contenu = this.suiteTraiterPropriete(contenu, allBalises, false, ceci, cela, evenement, declenchements);
    }

    // Le nombre de classe état1 état2 position
    const xBaliseNombreDeClasseEtatPossitionMulti = /\[(le )?nombre (de |d’|d')(\S+)( (?!\(|(ne|n’|n'|d’|d'|et|ou|soit|mais|un|de|du|dans|sur|avec|se|s’|s')\b)(\S+))?(( (et )?)(?!\(|(ne|n’|n'|d’|d'|et|ou|soit|mais|un|de|du|dans|sur|avec|se|s’|s')\b)(\S+))?( ((dans |sur |sous )(la |le |les |l’|l')?)(\S+?|(?:\S+? (à |en |au(x)? |de (la |l'|l’)?|du |des |d'|d’)\S+?))( (?!\(|(?:ne|n’|n'|d’|d'|et|ou|soit|mais|un|de|du|dans|sur|avec|se|s’|s')\b)(\S+?))?)?\]/gi;
    if (xBaliseNombreDeClasseEtatPossitionMulti.test(contenu)) {
      // retrouver toutes les balises de contenu [objets {sur|dans|sous} ceci|cela|ici|inventaire]
      const allBalises = contenu.match(xBaliseNombreDeClasseEtatPossitionMulti);
      // remplacer les balises par leur valeur
      contenu = this.suiteTraiterPropriete(contenu, allBalises, false, ceci, cela, evenement, declenchements);
    }

    // La propriété de élément
    const xBaliseProprieteDeElementMulti = /\[(le |la |les |l'|l’)?(?!nombre)(\S+?) (du |de la |de |d'|d’|des )(\S+?|(\S+? (à |en |au(x)? |de (la |l'|l’)?|du |des |d'|d’)\S+?))( (?!\(|(ne|n’|n'|d’|d'|et|ou|un|de|du|dans|sur|avec|se|s’|s')\b)(\S+?))?\]/gi;
    if (xBaliseProprieteDeElementMulti.test(contenu)) {
      // retrouver toutes les balises de contenu [objets {sur|dans|sous} ceci|cela|ici|inventaire]
      const allBalises = contenu.match(xBaliseProprieteDeElementMulti);
      // remplacer les balises par leur valeur
      contenu = this.suiteTraiterPropriete(contenu, allBalises, false, ceci, cela, evenement, declenchements);
    }

    // propriété élément
    const xBaliseProprieteElementMulti = /\[(?!(v|p|le|la|les|l'|l’|si|sinon|ou|au|en|fin|puis|initialement|(([1-9][0-9]?)(?:e|eme|ème|ere|ère|re)))\b)(\S+?) (\S+?|(\S+? (à |en |au(x)? |de (la |l'|l’)?|du |des |d'|d’)\S+?))( (?!\(|(ne|n’|n'|d’|d'|et|ou|un|de|du|dans|sur|avec|se|s’|s'|si|sinon|au|en|fin|puis|initialement)\b)(\S+?))?\]/gi;
    if (xBaliseProprieteElementMulti.test(contenu)) {
      // retrouver toutes les balises de contenu [objets {sur|dans|sous} ceci|cela|ici|inventaire]
      const allBalises = contenu.match(xBaliseProprieteElementMulti);
      // remplacer les balises par leur valeur
      contenu = this.suiteTraiterPropriete(contenu, allBalises, true, ceci, cela, evenement, declenchements);
    }

    // ===================================================
    // CONDITIONS
    // ===================================================

    // interpréter les balises encore présentes
    if (contenu.includes("[")) {
      contenu = this.calculerDescription(contenu, nbExecutions, null, ceci, cela, evenement, declenchements);
    }

    // ===================================================
    // RETOUR CONDITIONNEL
    // ===================================================

    // retirer toutes les balises de style
    const contenuSansBaliseStyle = contenu
      .replace(/\{\S\}/g, "") // {x}
      .replace(/\{\S/g, "")   // {x
      .replace(/\S\}/g, "");   // x}

    if (contenu.includes("{N}")) {
      // contenu vide
      if (contenuSansBaliseStyle.trim() == "") {
        // => pas de \n
        contenu = contenu.replace(/\{N\}/g, "");
        // contenu pas vide
      } else {
        // sera remplacé lors de la transformation en HTML si ne débute pas le bloc de texte.
        // contenu = contenu.replace(/\{N\}/g, "\n");
      }
    }

    // ======================================================================================================
    // POINT FINAL => ajout d’un retour à la ligne conditionnel automatiquement, sauf si balise {+}
    // ======================================================================================================
    if (contenuSansBaliseStyle.match(/(\.|…|:|\?|!)$/)) {
      // si le contenu se termine par une balise de type {x}, ne pas ajouter de retour à la ligne auto.
      if (contenu.match(/\{\w\}$/)) {
        // sinon ajouter retour à la ligne auto.
      } else {
        // contenu += "@{N}";
        contenu += "{N}";
      }
    }

    return contenu;

  }

  /**
   * Traiter les propriétés trouvés dans contenu et remplacer les balises par la valeur.
   * @param contenu 
   * @param allBalises 
   * @param sansDe Le de après le premier mot est manquant (ex: description table => description de table)
   * @param ceci 
   * @param cela 
   */
  private suiteTraiterPropriete(contenu: string, allBalises: RegExpMatchArray, sansDe: boolean, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null, evenement: Evenement = null, declenchements: number): string {
    // ne garder qu’une seule occurence de chaque afin de ne pas calculer plusieurs fois la même balise.
    const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)
    // parcourir chaque balise trouvée
    balisesUniques.forEach(curBalise => {
      let valeur = "???";
      // enlever les []
      const curProprieteIntitule = curBalise.slice(1, (curBalise.length - 1));
      // ajouter le « de » s’il est asbent de l’expression (ex: description table => description de table)
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
        const curProprieteCible = InstructionsUtils.trouverProprieteCible(curPropriete, ceci, cela, this.eju, this.jeu);
        if (curProprieteCible) {
          // récupérer la valeur
          if ((curPropriete.type === TypeProprieteJeu.nombreDeClasseAttributs) || (curPropriete.type === TypeProprieteJeu.nombreDeClasseAttributsPosition)) {
            valeur = (curProprieteCible as Compteur).valeur.toString();
          } else {
            valeur = (curProprieteCible as ProprieteElement).valeur;
          }
        }
      }


      // remplacer la balise par la valeur
      const regExp = new RegExp("\\[" + curProprieteIntitule + "\\]", "g");
      contenu = contenu.replace(regExp, valeur);
    });
    return contenu;
  }

  /** Vérifier si une condition [] est remplie. */
  private estConditionDescriptionRemplie(condition: string, statut: StatutCondition, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule, evenement: Evenement, declenchements: number): boolean {

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
      const rand = Math.random();
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
      const condition = AnalyseurCondition.getConditionMulti(conditionLC);
      if (condition.nbErreurs) {
        retVal = false;
        console.error("Condition pas comprise: ", conditionLC);
      } else {
        statut.siVrai = this.cond.siEstVrai(null, condition, ceci, cela, evenement, declenchements);
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
            conditionLC = conditionLC.substr('sinon'.length).trim()
            // tester le si
            const condition = AnalyseurCondition.getConditionMulti(conditionLC);

            if (condition.nbErreurs) {
              retVal = false;
              console.error("Condition pas comprise: ", conditionLC);
            } else {
              statut.siVrai = this.cond.siEstVrai(null, condition, ceci, cela, evenement, declenchements);
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

  private calculerConjugaison(verbe: string, modeTemps: string, negation: string, sujetStr: string, ici: Lieu, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule, evenement: Evenement): string {

    // retrouver et contrôler le sujet
    let sujet: ElementJeu | Intitule = null;

    sujet = InstructionsUtils.trouverCibleSpeciale(sujetStr, ceci, cela, evenement, this.eju, this.jeu);

    if (!sujet || !ClasseUtils.heriteDe(sujet.classe, EClasseRacine.element)) {
      console.error("calculerConjugaison > «", sujetStr, "» n’est pas un élément du jeu");
    }

    // retrouver le verbe
    let conjugaison = Conjugaison.getVerbe(verbe);
    let verbeConjugue: string = null;
    // verbe trouvé
    if (conjugaison) {
      // retrouver la forme demandée
      const personne = ((sujet as ElementJeu).nombre == Nombre.p) ? "3pp" : "3ps";
      const cle = modeTemps + " " + personne;
      // forme trouvée
      if (conjugaison.has(cle)) {
        verbeConjugue = conjugaison.get(cle);
        // forme pas trouvée
      } else {
        verbeConjugue = "(forme pas prise en charge : " + verbe + ": " + cle + ")";
      }
      // verbe pas trouvé
    } else {
      console.error("calculerConjugaison > verbe pas pris en charge:", verbe);
      verbeConjugue = "(verbe pas pris en charge : " + verbe + ")";
    }

    let verbeDecoupe = verbeConjugue.split(" ", 2);

    // tenir compte du se/s’
    if (verbe.match(/(se |s’|s')(.+)/)) {
      let se: string = null;
      if (verbeConjugue.match(/^(a|e|é|è|ê|i|o|u|y)(.+)/)) {
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
        if (verbeConjugue.match(/^(a|e|é|è|ê|i|o|u|y)(.+)/)) {
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

  /**
 * Calculer une description en tenant compte des balises conditionnelles et des états actuels.
 */
  private calculerDescription(description: string, nbAffichage: number, intact: boolean, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule, evenement: Evenement, declenchements: number) {
    let retVal = "";
    if (description) {
      const morceaux = description.split(/\[|\]/);
      let statut = new StatutCondition(nbAffichage, intact, morceaux, 0);
      // jamais une condition au début car dans ce cas ça donne une première chaine vide.
      let suivantEstCondition = false; // description.trim().startsWith("[");
      let afficherMorceauSuivant = true;
      // console.log("$$$$$$$$$$$ morceaux=", morceaux, "suivantEstCondition=", suivantEstCondition);
      for (let index = 0; index < morceaux.length; index++) {
        statut.curMorceauIndex = index;
        const curMorceau = morceaux[index];
        if (suivantEstCondition) {
          afficherMorceauSuivant = this.estConditionDescriptionRemplie(curMorceau, statut, ceci, cela, evenement, declenchements);
          suivantEstCondition = false;
        } else {
          if (afficherMorceauSuivant) {
            retVal += curMorceau;
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
  private recupererFicheAide(intitule: Intitule) {
    const ficheAide = this.jeu.aides.find(x => x.infinitif === intitule.nom);
    if (ficheAide) {
      return ficheAide.informations;
    } else {
      return "Désolé, je n’ai pas de page d’aide concernant la commande « " + intitule.nom + " »";
    }
  }

  /** Afficher le statut d'une porte ou d'un contenant (verrouilé, ouvrable, ouvert, fermé) */
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
  public executerListerContenu(ceci: ElementJeu, afficherObjetsCachesDeCeci: boolean, afficherObjetsNonVisiblesDeCeci: boolean, afficherObjetsDansSurSous: boolean, prepositionSpatiale: PrepositionSpatiale, retrait: number = 1): Resultat {

    let resultat = new Resultat(false, '', 1);
    const objets = this.eju.trouverContenu(ceci, afficherObjetsCachesDeCeci, afficherObjetsNonVisiblesDeCeci, afficherObjetsDansSurSous, prepositionSpatiale);

    // si la recherche n’a pas retourné d’erreur
    if (objets !== null) {
      resultat.succes = true;

      // AFFICHER LES ÉLÉMENTS DIRECTS
      const nbObjets = objets.length;
      if (nbObjets > 0) {
        let curObjIndex = 0;
        objets.forEach(obj => {
          ++curObjIndex;
          resultat.sortie += "\n " + InstructionDire.getRetrait(retrait) + (retrait <= 1 ? "- " : "> ") + this.eju.calculerIntituleElement(obj, false, false);
          // ajouter « (porté) » aux objets portés
          if (this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.porteID)) {
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
              let contenu = this.executerListerContenu(obj, false, false, false, prepositionSpatiale, retrait + 1).sortie;
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
          const sousRes = this.executerListerContenu(support, false, false, false, PrepositionSpatiale.sur);
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
  public executerDecrireContenu(ceci: ElementJeu, texteSiQuelqueChose: string, texteSiRien: string, afficherObjetsCachesDeCeci: boolean, afficherObjetsNonVisiblesDeCeci: boolean, afficherObjetsDansSurSous: boolean, prepositionSpatiale: PrepositionSpatiale): Resultat {

    let resultat = new Resultat(false, '', 1);
    const objets = this.eju.trouverContenu(ceci, afficherObjetsCachesDeCeci, afficherObjetsNonVisiblesDeCeci, afficherObjetsDansSurSous, prepositionSpatiale);

    // console.log("@@@ executerDecrireContenu > \nceci:", ceci, "\nprepositionSpatiale:", prepositionSpatiale, "\nobjets:", objets);

    // si la recherche n’a pas retourné d’erreur
    if (objets !== null) {
      resultat.succes = true;

      // - objets avec aperçu (ne pas lister les objets décoratifs):
      let objetsAvecApercu = objets.filter(x => x.apercu !== null && !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID));
      // const nbObjetsAvecApercus = objetsAvecApercu.length;
      // - objets sans apercu (ne pas lister les éléments décoratifs)
      let objetsSansApercu = objets.filter(x => x.apercu === null && !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID));
      let nbObjetsSansApercus = objetsSansApercu.length;

      // - supports décoratifs (eux ne sont pas affichés, mais leur contenu bien !)
      let supportsDecoratifs = objets.filter(x => this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID) && ClasseUtils.heriteDe(x.classe, EClasseRacine.support));

      // A.1 AFFICHER ÉLÉMENTS AVEC UN APERÇU
      objetsAvecApercu.forEach(obj => {
        const apercuCalcule = this.calculerDescription(obj.apercu, obj.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.intactID), null, null, null, null);
        // si l'aperçu n'est pas vide, l'ajouter.
        if (apercuCalcule) {
          // (ignorer les objets dont l'aperçu vaut "-")
          if (apercuCalcule !== '-') {
            resultat.sortie += "{U}" + apercuCalcule;
            // B.2 SI C’EST UN SUPPPORT, AFFICHER SON CONTENU (VISIBLE et NON Caché)
            if (ClasseUtils.heriteDe(obj.classe, EClasseRacine.support)) {
              // ne pas afficher objets cachés du support, on ne l’examine pas directement
              const sousRes = this.executerDecrireContenu(obj, ("{U}Sur " + this.eju.calculerIntituleElement(obj, false, true) + " il y a "), "", false, false, false, PrepositionSpatiale.sur);
              resultat.sortie += sousRes.sortie;
            }
          }
          // si l'aperçu est vide, ajouter l'objets à la liste des objets sans aperçu.
        } else {
          objetsSansApercu.push(obj);
          nbObjetsSansApercus += 1;
        }
      });

      // B. AFFICHER LES ÉLÉMENTS POSITIONNÉS SUR DES SUPPORTS DÉCORATIFS
      supportsDecoratifs.forEach(support => {
        // ne pas afficher les objets cachés du support (on ne l’examine pas directement)
        const sousRes = this.executerDecrireContenu(support, ("{U}Sur " + this.eju.calculerIntituleElement(support, false, true) + " il y a "), "", false, false, false, PrepositionSpatiale.sur);
        resultat.sortie += sousRes.sortie;
      });

      // C.1 AFFICHER ÉLÉMENTS SANS APERÇU
      if (nbObjetsSansApercus > 0) {
        resultat.sortie += texteSiQuelqueChose;
        let curObjIndex = 0;
        objetsSansApercu.forEach(obj => {
          ++curObjIndex;
          resultat.sortie += this.eju.calculerIntituleElement(obj, false, false);
          if (curObjIndex < (nbObjetsSansApercus - 1)) {
            resultat.sortie += ", ";
          } else if (curObjIndex == (nbObjetsSansApercus - 1)) {
            resultat.sortie += " et ";
          } else {
            resultat.sortie += ".";
          }
        });

        // C.2 AFFICHER LES ÉLÉMENTS POSITIONNÉS SUR DES SUPPORTS
        let supportsSansApercu = objetsSansApercu.filter(x => ClasseUtils.heriteDe(x.classe, EClasseRacine.support));
        supportsSansApercu.forEach(support => {
          // ne pas afficher les objets cachés du support (on ne l’examine pas directement)
          const sousRes = this.executerDecrireContenu(support, ("{U}Sur " + this.eju.calculerIntituleElement(support, false, true) + " il y a "), ("{U}Il n’y a rien sur " + this.eju.calculerIntituleElement(support, false, true) + "."), false, false, false, PrepositionSpatiale.sur);
          resultat.sortie += sousRes.sortie;
        });

      }

      // D. AFFICHER LES PORTES SI C'EST UN LIEU
      if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {

        const curLieu: Lieu = ceci as Lieu;
        curLieu.voisins.forEach(voisin => {
          if (voisin.type == EClasseRacine.porte) {
            // vérifier si la porte est visible
            const curPorte = this.eju.getObjet(voisin.id);
            if (this.jeu.etats.estVisible(curPorte, this.eju)) {
              // if (this.jeu.etats.possedeEtatIdElement(curPorte, this.jeu.etats.visibleID)) {
              // décrire la porte
              if (curPorte.apercu) {
                if (curPorte.apercu != '-')
                  // si aperçu, afficher l'aperçu.
                  resultat.sortie += "{U}" + this.calculerDescription(curPorte.apercu, curPorte.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(curPorte, this.jeu.etats.intactID), null, null, null, null);
              } else {
                // par défaut, afficher le nom de la porte et ouvert/fermé.
                resultat.sortie += "{U}" + ElementsJeuUtils.calculerIntituleGenerique(curPorte, true) + " est ";
                if (this.jeu.etats.possedeEtatIdElement(curPorte, this.jeu.etats.ouvertID)) {
                  resultat.sortie += this.jeu.etats.obtenirIntituleEtatPourElementJeu(curPorte, this.jeu.etats.ouvertID)
                } else {
                  resultat.sortie += this.jeu.etats.obtenirIntituleEtatPourElementJeu(curPorte, this.jeu.etats.fermeID)
                }
                resultat.sortie += ".";
              }
              //resultat.sortie += this.afficherStatut(curPorte);
            }
          }
        });
      }

      // si on n’a encore rien affiché, afficher le texte spécifique
      if (!resultat.sortie) {
        resultat.sortie = texteSiRien;
        // enlever le 1er {N} du résultat
        // } else if (resultat.sortie.startsWith("{N}")) {
        // resultat.sortie = resultat.sortie.slice(3);
      }
    }
    return resultat;
  }

  /** Afficher le statut d'une porte ou d'un contenant (verrouilé, ouvrable, ouvert, fermé) */
  afficherObstacle(direction: Lieu | ELocalisation, texteSiAucunObstacle = "(aucun obstacle)") {
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
    return retVal;
  }

  /**
   * Afficher les sorties du lieu spécifié.
   */
  afficherSorties(lieu: Lieu): string {
    let retVal: string;

    if (lieu) {
      if (this.jeu.parametres.activerAffichageSorties) {
        // retrouver les voisins visibles (càd PAS séparés par une porte à la fois invisible et fermée)
        const lieuxVoisinsVisibles = this.eju.getLieuxVoisinsVisibles(lieu);

        if (lieuxVoisinsVisibles.length > 0) {
          retVal = "Sorties :";
          // afficher les voisins : directions + lieux
          if (this.jeu.parametres.activerAffichageDirectionSorties) {
            lieuxVoisinsVisibles.forEach(voisin => {
              retVal += ("{n}{i}- " + this.afficherLieuVoisinEtLocalisation(voisin.localisation, lieu.id, voisin.id));
            });
            // afficher les voisins: lieux
          } else {
            lieuxVoisinsVisibles.forEach(voisin => {
              retVal += ("{n}{i}- " + this.afficherLieuVoisin(voisin.localisation, lieu.id, voisin.id));
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

  private afficherLieuVoisinEtLocalisation(localisation: ELocalisation, curLieuIndex: number, voisinIndex: number) {
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
        retVal = "nord" + obstacle + (lieuDejaVisite ? (" − " + titreLieu) : ' − ?');
        break;
      case ELocalisation.sud:
        retVal = "sud" + obstacle + (lieuDejaVisite ? (" − " + titreLieu) : ' − ?');
        break;
      case ELocalisation.est:
        retVal = "est" + obstacle + (lieuDejaVisite ? (" − " + titreLieu) : ' − ?');
        break;
      case ELocalisation.ouest:
        retVal = "ouest" + obstacle + (lieuDejaVisite ? (" − " + titreLieu) : ' − ?');
        break;
      case ELocalisation.bas:
        retVal = "descendre" + obstacle + " − " + titreLieu;
        break;
      case ELocalisation.haut:
        retVal = "monter" + obstacle + " − " + titreLieu;
        break;
      case ELocalisation.exterieur:
        retVal = "sortir" + obstacle + (lieuDejaVisite ? (" − " + titreLieu) : ' − ?');
        break;
      case ELocalisation.interieur:
        retVal = "entrer" + obstacle + " − " + titreLieu;
        break;

      default:
        retVal = localisation.toString();
    }

    return retVal;
  }





}