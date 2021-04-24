import { ConditionDebutee, StatutCondition, xFois } from '../../models/jouer/statut-conditions';
import { EClasseRacine, EEtatsBase } from '../../models/commun/constantes';
import { ELocalisation, Localisation } from '../../models/jeu/localisation';
import { PositionObjet, PrepositionSpatiale } from '../../models/jeu/position-objet';

import { Classe } from '../../models/commun/classe';
import { ClasseUtils } from '../commun/classe-utils';
import { ConditionsUtils } from './conditions-utils';
import { Conjugaison } from './conjugaison';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Etat } from '../../models/commun/etat';
import { Genre } from '../../models/commun/genre.enum';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Instruction } from '../../models/compilateur/instruction';
import { Intitule } from '../../models/jeu/intitule';
import { Jeu } from '../../models/jeu/jeu';
import { Lieu } from '../../models/jeu/lieu';
import { Nombre } from '../../models/commun/nombre.enum';
import { Objet } from '../../models/jeu/objet';
import { PhraseUtils } from '../commun/phrase-utils';
import { Reaction } from '../../models/compilateur/reaction';
import { Resultat } from '../../models/jouer/resultat';

export class Instructions {

  private cond: ConditionsUtils;

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private verbeux: boolean,
  ) {
    this.cond = new ConditionsUtils(this.jeu, this.verbeux);
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

  /** Retrouver la cible sur base de son texte (ici, ceci, cela, inventaire, joueur) */
  private getCible(cibleString: string, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule): ElementJeu {
    let cible: ElementJeu = null;
    // retrouver la cible
    switch (cibleString) {
      case 'ici':
        cible = this.eju.curLieu;
        // afficherObjetsCaches = false;
        break;
      case 'ceci':
        cible = ceci as ElementJeu;
        break;
      case 'cela':
        cible = cela as ElementJeu;
        break;
      case 'inventaire':
      case 'joueur':
        cible = this.jeu.joueur;
        // phraseSiVide = "";
        // phraseSiQuelqueChose = "";
        break;
    }
    return cible;
  }

  private interpreterContenuDire(contenu: string, nbExecutions: number, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null) {
    // A) description|intitulé|intitule|accord|es|s|pronom|Pronom|l’|l'|le|lui
    const xBaliseDescription = /\[(description|intitulé|intitule|accord|es|s|pronom|Pronom|l’|l'|le|lui) (ici|ceci|cela)\]/gi;
    if (xBaliseDescription.test(contenu)) {
      // retrouver toutes les balises de contenu [objets {sur|dans|sous} ceci|cela|ici|inventaire]
      const allBalises = contenu.match(xBaliseDescription);
      // ne garder qu’une seule occurence de chaque afin de ne pas calculer plusieurs fois la même balise.
      const balisesUniques = allBalises.filter((valeur, index, tableau) => tableau.indexOf(valeur) === index)
      // parcourir chaque balise trouvée
      balisesUniques.forEach(curBalise => {
        // retrouver la préposition et la cible
        const decoupe = /\[(description|intitulé|intitule|accord|es|s|pronom|Pronom|l’|l'|le|lui) (ici|ceci|cela)\]/i.exec(curBalise);

        const proprieteString = decoupe[1];
        const cibleString = decoupe[2];
        const cible: ElementJeu = this.getCible(cibleString, ceci, cela);

        let resultat: string = '';

        switch (proprieteString) {
          // > description
          case 'description':
          case 'Description':
            resultat = this.calculerDescription(cible.description, ++cible.nbAffichageDescription, this.jeu.etats.possedeEtatIdElement(cible, this.jeu.etats.intactID), ceci, cela);
            break;

          case 'intitulé':
          case 'intitule':
            resultat = ElementsJeuUtils.calculerIntitule(cible, false);
            break;

          case 'Intitulé':
          case 'Intitule':
            resultat = ElementsJeuUtils.calculerIntitule(cible, true);
            break;

          // es ceci | accord ceci (féminin et pluriel)
          case 'accord':
          case 'es':
            resultat = (cible.genre === Genre.f ? "e" : "") + (cible.nombre === Nombre.p ? "s" : "");
            break;

          // s ceci (pluriel)
          case 's':
            resultat = (cible.nombre === Nombre.p ? "s" : "");
            break;

          // pronom
          case 'pronom':
          case 'il':
            if (ClasseUtils.heriteDe(cible.classe, EClasseRacine.element)) {
              resultat = (cible.genre === Genre.f ? "elle" : "il") + (cible.nombre === Nombre.p ? "s" : "");
            } else {
              console.error("interpreterContenuDire: pronom ceci: ceci n'est pas un élément.");
            }
            break;

          // pronom (majuscule)
          case 'Pronom':
          case 'Il':
            resultat = (cible.genre === Genre.f ? "Elle" : "Il") + (cible.nombre === Nombre.p ? "s" : "");
            break;

          // cod: l’ ou les
          case 'l’':
          case 'l\'':
            resultat = (cible.nombre === Nombre.p ? "les " : "l’");
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

          // inconnu
          default:
            console.error("interpreterContenuDire: propriete pas prise en charge:", proprieteString);
            break;
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
          apercuCeci = this.calculerDescription(eleCeci.apercu, ++eleCeci.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(eleCeci, this.jeu.etats.intactID), ceci, cela);
          contenu = contenu.replace(/\[(aperçu|apercu) ceci\]/g, apercuCeci);
        } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.direction)) {
          const dirCeci = ceci as Localisation;
          let voisinID = this.eju.getVoisinDirectionID(dirCeci, EClasseRacine.lieu);
          if (voisinID !== -1) {
            let voisin = this.eju.getLieu(voisinID);
            apercuCeci = this.calculerDescription(voisin.apercu, ++voisin.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(voisin, this.jeu.etats.intactID), ceci, cela);
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
          apercuCela = this.calculerDescription(eleCela.apercu, ++eleCela.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(eleCela, this.jeu.etats.intactID), ceci, cela);
          contenu = contenu.replace(/\[(aperçu|apercu) cela\]/g, apercuCela);
        } else if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.direction)) {
          const dirCela = cela as Localisation;
          let voisinID = this.eju.getVoisinDirectionID(dirCela, EClasseRacine.lieu);
          if (voisinID !== -1) {
            let voisin = this.eju.getLieu(voisinID);
            apercuCela = this.calculerDescription(voisin.apercu, ++voisin.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(voisin, this.jeu.etats.intactID), ceci, cela);
          } else {
            console.error("interpreterContenuDire: aperçu de cela: voisin pas trouvé dans cette direction.");
          }
        } else {
          console.error("interpreterContenuDire: aperçu de cela: cela n'est pas un élément jeu");
        }
      }
    }

    // Texte (d’un objet)
    if (contenu.includes("[texte")) {
      if (contenu.includes("[texte ceci]")) {
        if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
          const objCeci = ceci as Objet;
          const texteCeci = this.calculerDescription(objCeci.texte, ++objCeci.nbAffichageTexte, this.jeu.etats.possedeEtatIdElement(objCeci, this.jeu.etats.intactID), ceci, cela);
          contenu = contenu.replace(/\[texte ceci\]/g, texteCeci);
        } else {
          console.error("interpreterContenuDire: texte de ceci: ceci n'est pas un objet");
        }
      }
      if (contenu.includes("[texte cela]")) {
        if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
          const objCela = cela as Objet;
          const texteCela = this.calculerDescription(objCela.texte, ++objCela.nbAffichageTexte, this.jeu.etats.possedeEtatIdElement(objCela, this.jeu.etats.intactID), ceci, cela);
          contenu = contenu.replace(/\[texte cela\]/g, texteCela);
        } else {
          console.error("interpreterContenuDire: texte de cela: cela n'est pas un objet");
        }
      }
    }

    // ==========================================================
    // OBJETS (CONTENU) [liste|décrire objets sur|sous|dans ici|ceci|cela|inventaire]
    // ==========================================================
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
        let phraseSiQuelqueChose = "{n}Vous voyez ";
        let afficherObjetsCaches = true;

        const cible: ElementJeu = this.getCible(cibleString, ceci, cela);

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
              phraseSiVide = "{n}Il n’y a rien dessus.";
              break;

            case PrepositionSpatiale.sous:
              phraseSiVide = "{n}Il n’y a rien dessous.";

            case PrepositionSpatiale.dans:
            default:
              phraseSiVide = "{n}[Pronom " + cibleString + "] [v être ipr " + cibleString + "] vide[s " + cibleString + "].";
          }
        }

        let resultatCurBalise: string;

        if (isLister) {
          resultatCurBalise = this.executerListerContenu(cible, afficherObjetsCaches, preposition).sortie;
        } else {
          resultatCurBalise = this.executerDecrireContenu(cible, phraseSiQuelqueChose, phraseSiVide, afficherObjetsCaches, preposition).sortie;
        }

        // remplacer la balise par le résultat
        const xCurBalise = new RegExp("\\[" + ListerDecrireString + " objets " + (prepositionString ? (prepositionString + " ") : "") + cibleString + "\\]", "g");
        contenu = contenu.replace(xCurBalise, resultatCurBalise);

      });

    }

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
      const titreIci = this.eju.curLieu.titre;
      contenu = contenu.replace(/\[titre ici\]/g, titreIci);
    }

    // aide
    if (contenu.includes("[aide")) {
      if (contenu.includes("[aide ceci]")) {
        const aideCeci = this.ficheAide(ceci);
        contenu = contenu.replace(/\[aide ceci\]/g, aideCeci);
      }
      if (contenu.includes("[aide cela]")) {
        const aideCela = this.ficheAide(cela);
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
        let cible: ElementJeu;
        switch (cibleString) {
          case 'ici':
            cible = this.eju.curLieu;
            break;
          case 'ceci':
            cible = ceci as ElementJeu;
            break;
          case 'cela':
            cible = cela as ElementJeu;
        }
        let resultatCurBalise: string = null;
        if (cible) {
          switch (proprieteString) {
            case 'nom':
              resultatCurBalise = cible.nom;
              break;
            case 'titre':
              resultatCurBalise = cible.titre;
              break;
            case 'intitulé':
              resultatCurBalise = ElementsJeuUtils.calculerIntitule(this.eju.curLieu, false);
              break;
            case 'Intitulé':
              resultatCurBalise = ElementsJeuUtils.calculerIntitule(this.eju.curLieu, false);
              break;
            case 'texte':
              resultatCurBalise = cible.texte;
              break;
            default:
              const propriete = cible.proprietes.find(x => x.nom == proprieteString);
              if (propriete) {
                resultatCurBalise = propriete.valeur;
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
    // CONJUGAISON
    // ===================================================

    if (contenu.includes("[v ")) {
      // - être (s’)
      if (contenu.includes("[v être ")) {
        contenu = this.calculerToutesLesFormesEtSujetsConjugaison(contenu, "être", ceci, cela);
      }
      if (contenu.includes("[v s’être ")) {
        contenu = this.calculerToutesLesFormesEtSujetsConjugaison(contenu, "s’être", ceci, cela);
      }
      if (contenu.includes("[v s'être ")) {
        contenu = this.calculerToutesLesFormesEtSujetsConjugaison(contenu, "s'être", ceci, cela);
      }
      // - avoir
      if (contenu.includes("[v avoir ")) {
        contenu = this.calculerToutesLesFormesEtSujetsConjugaison(contenu, "avoir", ceci, cela);
      }
      // - vivre
      if (contenu.includes("[v vivre ")) {
        contenu = this.calculerToutesLesFormesEtSujetsConjugaison(contenu, "vivre", ceci, cela);
      }
      // - ouvrir (s’)
      if (contenu.includes("[v ouvrir ")) {
        contenu = this.calculerToutesLesFormesEtSujetsConjugaison(contenu, "ouvrir", ceci, cela);
      }
      if (contenu.includes("[v s’ouvrir ")) {
        contenu = this.calculerToutesLesFormesEtSujetsConjugaison(contenu, "s’ouvrir", ceci, cela);
      }
      if (contenu.includes("[v s'ouvrir ")) {
        contenu = this.calculerToutesLesFormesEtSujetsConjugaison(contenu, "s'ouvrir", ceci, cela);
      }
      // - fermer (se)
      if (contenu.includes("[v fermer ")) {
        contenu = this.calculerToutesLesFormesEtSujetsConjugaison(contenu, "fermer", ceci, cela);
      }
      if (contenu.includes("[v se fermer ")) {
        contenu = this.calculerToutesLesFormesEtSujetsConjugaison(contenu, "se fermer", ceci, cela);
      }
    }
    // ===================================================
    // CONDITIONS
    // ===================================================

    // interpréter les balises encore présentes
    if (contenu.includes("[")) {
      contenu = this.calculerDescription(contenu, nbExecutions, null, ceci, cela);
    }

    // ===================================================
    // RETOUR CONDITIONNEL
    // ===================================================

    if (contenu.includes("{N}")) {
      // retirer toutes les balises de style
      const testVide = contenu
        .replace(/\{\S\}/g, "") // {x}
        .replace(/\{\S/g, "")   // {x
        .replace(/\S\}/g, "")   // x}
        .trim();

      // contenu vide
      if (testVide == "") {
        // => pas de \n
        contenu = contenu.replace(/\{N\}/g, "");
        // contenu pas vide
      } else {
        // sera remplacé lors de la transformation en HTML si ne débute pas le bloc de texte.
        // contenu = contenu.replace(/\{N\}/g, "\n");
      }
    }

    return contenu;
  }


  /** Exécuter une liste d’instructions */
  public executerInstructions(instructions: Instruction[], ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    let resultat = new Resultat(true, '', 0);
    if (instructions && instructions.length > 0) {
      instructions.forEach(ins => {
        const sousResultat = this.executerInstruction(ins, ceci, cela);
        resultat.nombre += sousResultat.nombre;
        resultat.succes = (resultat.succes && sousResultat.succes);
        resultat.sortie += sousResultat.sortie;
        resultat.stopper = resultat.stopper || sousResultat.stopper;
        resultat.continuer = resultat.continuer || sousResultat.continuer;
      });
    }

    return resultat;
  }

  /**
   * Calculer une description en tenant compte des balises conditionnelles et des états actuels.
   */
  calculerDescription(description: string, nbAffichage: number, intact: boolean, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule) {
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
          afficherMorceauSuivant = this.estConditionDescriptionRemplie(curMorceau, statut, ceci, cela);
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

  calculerDescriptionContenu(element: ElementJeu, nbAffichage: number) {
  }

  private ficheAide(intitule: Intitule) {
    const ficheAide = this.jeu.aides.find(x => x.infinitif === intitule.nom);
    if (ficheAide) {
      return ficheAide.informations;
    } else {
      return "Désolé, je n’ai pas de page d’aide concernant la commande « " + intitule.nom + " »";
    }
  }

  /** Vérifier si une condition [] est remplie. */
  private estConditionDescriptionRemplie(condition: string, statut: StatutCondition, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule): boolean {

    let retVal = false;
    let conditionLC = condition.toLowerCase();
    const resultFois = conditionLC.match(xFois);

    // X-ÈME FOIS
    if (resultFois) {
      statut.conditionDebutee = ConditionDebutee.fois;
      const nbFois = Number.parseInt(resultFois[1], 10);
      statut.nbChoix = Instructions.calculerNbChoix(statut);
      retVal = (statut.nbAffichage === nbFois);
      // AU HASARD
    } else if (conditionLC === "au hasard") {
      statut.conditionDebutee = ConditionDebutee.hasard;
      statut.dernIndexChoix = 1;
      // compter le nombre de choix
      statut.nbChoix = Instructions.calculerNbChoix(statut);
      // choisir un choix au hasard
      const rand = Math.random();
      statut.choixAuHasard = Math.floor(rand * statut.nbChoix) + 1;
      retVal = (statut.choixAuHasard == 1);
      // EN BOUCLE
    } else if (conditionLC === "en boucle") {
      statut.conditionDebutee = ConditionDebutee.boucle;
      statut.dernIndexChoix = 1;
      // compter le nombre de choix
      statut.nbChoix = Instructions.calculerNbChoix(statut);
      retVal = (statut.nbAffichage % statut.nbChoix === 1);
      // INITIALEMENT
    } else if (conditionLC === "initialement") {
      statut.conditionDebutee = ConditionDebutee.initialement;
      retVal = statut.initial;
      // SI
    } else if (conditionLC.startsWith("si ")) {
      statut.conditionDebutee = ConditionDebutee.si;
      const condition = PhraseUtils.getCondition(conditionLC);
      statut.siVrai = this.cond.siEstVraiAvecLiens(null, condition, ceci, cela);
      retVal = statut.siVrai;
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
            const condition = PhraseUtils.getCondition(conditionLC);
            statut.siVrai = this.cond.siEstVraiAvecLiens(null, condition, ceci, cela);
            retVal = statut.siVrai;
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
            } else {
              console.warn("[sinon] sans 'si'.");
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

  // ===================================================
  // CONJUGAISON
  // ===================================================

  private calculerToutesLesFormesEtSujetsConjugaison(contenu: string, verbe: string, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null) {
    // liste des sujets
    const sujets: string[] = [];
    if (contenu.includes("ceci]")) {
      sujets.push("ceci");
    }
    if (contenu.includes("cela]")) {
      sujets.push("cela");
    }
    if (contenu.includes("ici]")) {
      sujets.push("ici");
    }
    // si au moins un sujet (sinon ça sert à rien de continuer)
    if (sujets.length != 0) {
      // sans négation
      sujets.forEach(sujet => {
        contenu = this.calculerToutesLesFormesConjugaison(contenu, verbe, sujet, null, ceci, cela);
      });
      // avec négation
      if (contenu.includes(" pas ")) {
        sujets.forEach(sujet => {
          contenu = this.calculerToutesLesFormesConjugaison(contenu, verbe, sujet, "pas", ceci, cela);
        });
      }
      if (contenu.includes(" plus ")) {
        sujets.forEach(sujet => {
          contenu = this.calculerToutesLesFormesConjugaison(contenu, verbe, sujet, "plus", ceci, cela);
        });
      }
      if (contenu.includes(" que ")) {
        sujets.forEach(sujet => {
          contenu = this.calculerToutesLesFormesConjugaison(contenu, verbe, sujet, "que", ceci, cela);
        });
      }
      if (contenu.includes(" ni ")) {
        sujets.forEach(sujet => {
          contenu = this.calculerToutesLesFormesConjugaison(contenu, verbe, sujet, "ni", ceci, cela);
        });
      }
    }
    return contenu;
  }

  private calculerToutesLesFormesConjugaison(contenu: string, verbe: string, sujet: string, negation: string, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null) {
    contenu = this.calculerConjugaison(contenu, verbe, "ipr", negation, sujet, ceci, cela);
    contenu = this.calculerConjugaison(contenu, verbe, "ipac", negation, sujet, ceci, cela);
    contenu = this.calculerConjugaison(contenu, verbe, "iimp", negation, sujet, ceci, cela);
    contenu = this.calculerConjugaison(contenu, verbe, "ipqp", negation, sujet, ceci, cela);
    contenu = this.calculerConjugaison(contenu, verbe, "ipas", negation, sujet, ceci, cela);
    contenu = this.calculerConjugaison(contenu, verbe, "ipaa", negation, sujet, ceci, cela);
    contenu = this.calculerConjugaison(contenu, verbe, "ifus", negation, sujet, ceci, cela);
    contenu = this.calculerConjugaison(contenu, verbe, "ifua", negation, sujet, ceci, cela);
    contenu = this.calculerConjugaison(contenu, verbe, "cpr", negation, sujet, ceci, cela);
    contenu = this.calculerConjugaison(contenu, verbe, "cpa", negation, sujet, ceci, cela);
    contenu = this.calculerConjugaison(contenu, verbe, "spr", negation, sujet, ceci, cela);
    contenu = this.calculerConjugaison(contenu, verbe, "spa", negation, sujet, ceci, cela);
    contenu = this.calculerConjugaison(contenu, verbe, "simp", negation, sujet, ceci, cela);
    contenu = this.calculerConjugaison(contenu, verbe, "spqp", negation, sujet, ceci, cela);

    return contenu;
  }

  private calculerConjugaison(contenu: string, verbe: string, modeTemps: string, negation: string, sujetStr: string, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule) {
    // vérifier si cette forme apparaît dans le contenu
    const expression = `v ${verbe} ${modeTemps}${(negation ? (" " + negation) : "")} ${sujetStr}`;
    if (contenu.includes("[" + expression + "]")) {
      // retrouver et contrôler le sujet
      let sujet: ElementJeu | Intitule = null;
      switch (sujetStr) {
        case 'ceci':
          sujet = ceci;
          break;
        case 'cela':
          sujet = cela;
          break;
        case 'ici':
          sujet = this.eju.curLieu;
          break;
        default:
          break;
      }
      if (!sujet || !ClasseUtils.heriteDe(sujet.classe, EClasseRacine.element)) {
        console.error("calculerConjugaison > «", sujetStr, "» n’est pas un élément du jeu", contenu);
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

      // remplacer dans le contenu par le résultat
      const regExp = new RegExp("\\[" + expression + "\\]", "g");
      contenu = contenu.replace(regExp, verbeConjugue);
    }
    return contenu;
  }

  /** Exécuter une instruction */
  public executerInstruction(instruction: Instruction, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    let resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;
    if (this.verbeux) {
      console.log(">>> ex instruction:", instruction, "ceci:", ceci, "cela:", cela);
    }
    // incrémenter le nombre de fois que l’instruction a déjà été exécutée
    instruction.nbExecutions += 1;

    // instruction conditionnelle
    if (instruction.condition) {
      const estVrai = this.cond.siEstVraiAvecLiens(null, instruction.condition, ceci, cela);
      if (this.verbeux) {
        console.log(">>>> estVrai=", estVrai);
      }
      if (estVrai) {
        sousResultat = this.executerInstructions(instruction.instructionsSiConditionVerifiee, ceci, cela);
      } else {
        sousResultat = this.executerInstructions(instruction.instructionsSiConditionPasVerifiee, ceci, cela);
      }
      // instruction simple
    } else {
      if (instruction.instruction.infinitif) {
        sousResultat = this.executerInfinitif(instruction.instruction, instruction.nbExecutions, ceci, cela);
      } else {
        console.warn("executerInstruction : pas d'infinitif :", instruction);
      }
    }
    resultat.sortie += sousResultat.sortie;
    resultat.stopper = resultat.stopper || sousResultat.stopper;
    resultat.continuer = resultat.continuer || sousResultat.continuer;

    // console.warn("exInstruction >>> instruction=", instruction, "resultat=", resultat);

    return resultat;
  }


  private executerInfinitif(instruction: ElementsPhrase, nbExecutions: number, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {
    let resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;

    if (this.verbeux) {
      console.log("EX INF − ", instruction.infinitif.toUpperCase(), " (ceci=", ceci, "cela=", cela, "instruction=", instruction, "nbExecutions=", nbExecutions, ")");
    }

    switch (instruction.infinitif.toLowerCase()) {
      case 'dire':
        // enlever le premier et le dernier caractères (") et les espaces aux extrémités.
        const complement = instruction.complement1.trim();
        let contenu = complement.slice(1, complement.length - 1).trim();
        contenu = this.interpreterContenuDire(contenu, nbExecutions, ceci, cela);
        resultat.sortie += contenu;
        // si la chaine se termine par un espace, ajouter un saut de ligne.
        if (complement.endsWith(' "')) {
          resultat.sortie += "\n";
        }
        break;
      case 'changer':
        sousResultat = this.executerChanger(instruction, ceci, cela);
        resultat.succes = sousResultat.succes;
        break;

      case 'déplacer':
        // déplacer sujet vers direction
        if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.direction)) {

          let loc: Localisation | ELocalisation = ceci as Localisation;

          // console.error("Exécuter infinitif: déplacer sujet vers direction. \nsujet=", instruction.sujet, "\nceci=", ceci, "\ncela=", cela, "\ninstruction=", instruction, ")");
          let voisinID = this.eju.getVoisinDirectionID((loc), EClasseRacine.lieu);

          if (voisinID == -1) {
            // cas particulier : si le joueur utilise entrer/sortir quand une seule sortie visible, aller dans la direction de cette sortie
            if (loc instanceof Localisation && (loc.id == ELocalisation.exterieur /*|| loc.id == ELocalisation.interieur*/)) {
              const lieuxVoisinsVisibles = this.eju.getLieuxVoisinsVisibles(this.eju.curLieu);
              if (lieuxVoisinsVisibles.length == 1) {
                voisinID = lieuxVoisinsVisibles[0].id;
                loc = lieuxVoisinsVisibles[0].localisation;
              }
            }
          }

          if (voisinID != -1) {
            const voisin = this.eju.getLieu(voisinID);
            sousResultat = this.executerDeplacer(instruction.sujet, instruction.preposition1, voisin.intitule, null, null);
            resultat.succes = sousResultat.succes;
          } else {
            resultat.succes = false;
          }
          // déplacer sujet vers un lieu
        } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {
          sousResultat = this.executerDeplacer(instruction.sujet, instruction.preposition1, new GroupeNominal(null, "ceci"), ceci as Lieu, null);
          resultat.succes = sousResultat.succes;
          // déplacer sujet vers un objet
        } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
          // console.error("Exécuter infinitif: déplacer sujet vers objet. \nsujet=", instruction.sujet, "\nceci=", ceci, "\ncela=", cela, "\ninstruction=", instruction, ")");
          sousResultat = this.executerDeplacer(instruction.sujet, instruction.preposition1, instruction.sujetComplement1, ceci as Objet, cela);
          resultat.succes = sousResultat.succes;
        } else {
          // console.error("Exécuter infinitif: On peut déplacer soit vers un objet, soit vers une direction. \ninstruction=", instruction, "\nsujet=", instruction.sujet, "\nceci=", ceci, "\ncela=", cela, ")");
          resultat.succes = false;
        }
        break;

      case 'effacer':
        if (instruction.sujet.nom == 'écran') {
          resultat.sortie = "@@effacer écran@@";
        } else {
          const cible = this.trouverObjetCible(instruction.sujet.nom, instruction.sujet, ceci, cela);
          if (ClasseUtils.heriteDe(cible.classe, EClasseRacine.objet)) {
            sousResultat = this.executerEffacer(cible as Objet);
            resultat.succes = sousResultat.succes;
          } else {
            console.error("Exécuter infinitif: Seuls les objets ou l’écran peuvent être effacés.");
            resultat.succes = false;
          }
        }
        break;

      case 'terminer':
        if (instruction.sujet && instruction.sujet.nom === 'jeu') {
          this.jeu.termine = true;
        }
        break;

      case 'sauver':
        console.log("executerInfinitif >> sauver=", instruction.complement1);
        if (instruction.complement1) {
          this.jeu.sauvegardes.push(instruction.complement1.trim().toLowerCase());
          resultat.succes = true;
        } else {
          resultat.succes = false;
        }
        break;

      case 'exécuter':
        console.log("executerInfinitif >> exécuter=", instruction);
        if (instruction.complement1 && instruction.complement1.startsWith('réaction ')) {
          console.log("executerInfinitif >> executerReaction", instruction, ceci, cela);
          sousResultat = this.executerReaction(instruction, ceci, cela);
          resultat.sortie = sousResultat.sortie;
          resultat.succes = sousResultat.succes;
        } else {
          console.error("executerInfinitif >> exécuter >> complément autre que  « réaction de … » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;

      case 'stopper':
        // Stopper l’action en cours (évènement AVANT spécial)
        if (instruction?.sujet.nom?.toLocaleLowerCase() === 'action') {
          resultat.stopper = true;
          resultat.succes = true;
        } else {
          console.error("executerInfinitif >> stopper >> sujet autre que  « action » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;

      case 'continuer':
        // Il faut continuer l’action en cours (évènement APRÈS spécial)
        if (instruction?.sujet.nom?.toLocaleLowerCase() === 'action') {
          resultat.continuer = true;
          resultat.succes = true;
        } else {
          console.error("executerInfinitif >> continuer >> sujet autre que  « action » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;

      case 'attendre':
        // Il faut continuer l’action en cours (évènement APRÈS spécial)
        if (instruction?.sujet.nom?.toLocaleLowerCase() === 'touche') {
          resultat.sortie = "@@attendre touche@@";
          resultat.succes = true;
        } else {
          console.error("executerInfinitif >> attenre >> sujet autre que  « touche » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;

      default:
        console.warn("executerVerbe : pas compris instruction:", instruction);
        break;
    }

    return resultat;
  }

  /**
   * 
   * Retrouver les objets contenus dans ceci.
   * En cas d’erreur null est retourné plutôt qu’on tableau d’objets.
   * @param ceci 
   * @param inclureObjetsCachesDeCeci 
   * @param preposition (dans, sur, sous)
   */
  private trouverContenu(ceci: ElementJeu, inclureObjetsCachesDeCeci: boolean, preposition: PrepositionSpatiale) {
    let objets: Objet[] = null;
    if (ceci) {
      // objet
      if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
        // retrouver les objets {contenus dans/posés sur} cet objet
        objets = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.objet && x.position.pre == preposition && x.position.cibleId === ceci.id
          && this.jeu.etats.estVisible(x, this.eju));
        // si on ne doit pas lister les objets cachés, les enlever
        if (!inclureObjetsCachesDeCeci) {
          objets = objets.filter(x => !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.cacheID));
        }
        // console.warn("objets contenus dans ceci:", objets, "ceci objet=", ceci);
        // lieu
      } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        // retrouver les objets présents dans le lieu
        objets = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.lieu && x.position.cibleId === ceci.id
          && this.jeu.etats.estVisible(x, this.eju));
        if (!inclureObjetsCachesDeCeci) {
          objets = objets.filter(x => !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.cacheID));
        }
        // console.warn("objets contenus dans ceci:", objets, "ceci lieu=", ceci);
      } else {
        console.error("executerAfficherContenu: classe racine pas pris en charge:", ceci.classe);
      }
    }
    return objets;
  }

  /**
   * Lister le contenu d'un objet ou d'un lieu.
   * Remarque: le contenu invisible n'est pas affiché.
   */
  public executerListerContenu(ceci: ElementJeu, afficherObjetsCachesDeCeci: boolean, prepositionSpatiale: PrepositionSpatiale, retrait: number = 1): Resultat {

    let resultat = new Resultat(false, '', 1);
    const objets = this.trouverContenu(ceci, afficherObjetsCachesDeCeci, prepositionSpatiale);

    // si la recherche n’a pas retourné d’erreur
    if (objets !== null) {
      resultat.succes = true;

      // AFFICHER LES ÉLÉMENTS DIRECTS
      const nbObjets = objets.length;
      if (nbObjets > 0) {
        let curObjIndex = 0;
        objets.forEach(obj => {
          ++curObjIndex;
          resultat.sortie += "\n " + Instructions.getRetrait(retrait) + (retrait <= 1 ? "- " : "> ") + ElementsJeuUtils.calculerIntitule(obj, false);
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
              let contenu = this.executerListerContenu(obj, false, prepositionSpatiale, retrait + 1).sortie;
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
          const sousRes = this.executerListerContenu(support, false, PrepositionSpatiale.sur);
          resultat.sortie += sousRes.sortie;
        });

      }

    }
    return resultat;
  }

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
  public executerDecrireContenu(ceci: ElementJeu, texteSiQuelqueChose: string, texteSiRien: string, afficherObjetsCachesDeCeci: boolean, prepositionSpatiale: PrepositionSpatiale): Resultat {

    let resultat = new Resultat(false, '', 1);
    const objets = this.trouverContenu(ceci, afficherObjetsCachesDeCeci, prepositionSpatiale);

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
        const apercuCalcule = this.calculerDescription(obj.apercu, obj.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.intactID), null, null);
        // si l'aperçu n'est pas vide, l'ajouter.
        if (apercuCalcule) {
          // (ignorer les objets dont l'aperçu vaut "-")
          if (apercuCalcule !== '-') {
            resultat.sortie += "{n}" + apercuCalcule;
            // B.2 SI C’EST UN SUPPPORT, AFFICHER SON CONTENU (VISIBLE et NON Caché)
            if (ClasseUtils.heriteDe(obj.classe, EClasseRacine.support)) {
              // ne pas afficher objets cachés du support, on ne l’examine pas directement
              const sousRes = this.executerDecrireContenu(obj, ("{n}Sur " + ElementsJeuUtils.calculerIntitule(obj, false) + " il y a "), "", false, PrepositionSpatiale.sur);
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
        const sousRes = this.executerDecrireContenu(support, ("{n}Sur " + ElementsJeuUtils.calculerIntitule(support, false) + " il y a "), "", false, PrepositionSpatiale.sur);
        resultat.sortie += sousRes.sortie;
      });

      // C.1 AFFICHER ÉLÉMENTS SANS APERÇU
      if (nbObjetsSansApercus > 0) {
        resultat.sortie += texteSiQuelqueChose;
        let curObjIndex = 0;
        objetsSansApercu.forEach(obj => {
          ++curObjIndex;
          resultat.sortie += ElementsJeuUtils.calculerIntitule(obj, false);
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
          const sousRes = this.executerDecrireContenu(support, ("{n}Sur " + ElementsJeuUtils.calculerIntitule(support, false) + " il y a "), ("{n}Il n’y a rien sur " + ElementsJeuUtils.calculerIntitule(support, false) + "."), false, PrepositionSpatiale.sur);
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
                  resultat.sortie += "{n}" + this.calculerDescription(curPorte.apercu, curPorte.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(curPorte, this.jeu.etats.intactID), null, null);
              } else {
                // par défaut, afficher le nom de la porte et ouvert/fermé.
                resultat.sortie += "{n}" + ElementsJeuUtils.calculerIntitule(curPorte, true) + " est ";
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
      }
    }
    return resultat;
  }

  /**
   * Renvoyer le contenu d'un objet ou d'un lieu.
   */
  public obtenirContenu(ceci: ElementJeu, preposition: PrepositionSpatiale): Objet[] {
    let els: Objet[] = null;
    if (ceci) {
      if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
        els = this.jeu.objets.filter(x => x.position
          && x.position.pre == preposition
          && x.position.cibleType === EClasseRacine.objet
          && x.position.cibleId === ceci.id);
      } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        els = this.jeu.objets.filter(x => x.position
          && x.position.cibleType === EClasseRacine.lieu
          && x.position.cibleId === ceci.id);
      } else {
        console.error("obtenirContenu: classe racine pas pris en charge:", ceci.classe);
      }
    }
    return els;
  }

  /** Déplacer (ceci, joueur) vers (cela, joueur, ici). */
  private executerDeplacer(sujet: GroupeNominal, preposition: string, complement: GroupeNominal, ceci: ElementJeu = null, cela: ElementJeu | Intitule = null): Resultat {

    if (this.verbeux) {
      console.log("executerDeplacer >>> sujet=", sujet, "preposition=", preposition, "complément=", complement, "ceci=", ceci, "cela=", cela);
    }
    let resultat = new Resultat(false, '', 1);

    if (preposition !== "vers" && preposition !== "dans" && preposition !== 'sur' && preposition != 'sous') {
      console.error("executerDeplacer >>> préposition pas reconnue:", preposition);
    }

    let objet: Objet = null;
    let destination: ElementJeu = null;
    let objets: Objet[] = null;

    // trouver l’élément à déplacer

    switch (sujet.nom) {
      case "ceci":
        objet = ceci as Objet;
        break;
      case "cela":
        objet = cela as Objet;
        break;
      case "joueur":
        objet = this.jeu.joueur;
        break;
      case "objets dans ceci":
        objets = this.obtenirContenu(ceci as Objet, PrepositionSpatiale.dans);
        break;
      case "objets sur ceci":
        objets = this.obtenirContenu(ceci as Objet, PrepositionSpatiale.sur);
        break;
      case "objets sous ceci":
        objets = this.obtenirContenu(ceci as Objet, PrepositionSpatiale.sous);
        break;
      case "objets dans cela":
        objets = this.obtenirContenu(cela as Objet, PrepositionSpatiale.dans);
        break;
      case "objets sur cela":
        objets = this.obtenirContenu(cela as Objet, PrepositionSpatiale.sur);
        break;
      case "objets sous cela":
        objets = this.obtenirContenu(cela as Objet, PrepositionSpatiale.sous);
        break;
      case "objets ici":
        objets = this.obtenirContenu(this.eju.curLieu, PrepositionSpatiale.dans);
        break;

      default:
        let correspondanceSujet = this.eju.trouverCorrespondance(sujet, false, false);
        // un élément trouvé
        if (correspondanceSujet.elements.length === 1) {
          objet = correspondanceSujet.objets[0];
          // aucun élément trouvé
        } else if (correspondanceSujet.elements.length === 0) {
          console.error("executerDeplacer >>> je n’ai pas trouvé l’objet:", sujet);
          // plusieurs éléments trouvés
        } else {
          console.error("executerDeplacer >>> j’ai trouvé plusieurs correspondances pour l’objet:", sujet);
        }
        break;
    }

    // trouver la destination
    switch (complement.nom) {

      case 'ceci':
        if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.element)) {
          destination = ceci as ElementJeu;
        } else {
          console.error("Déplacer vers ceci: ceci n'est pas un élément du jeu.");
        }
        break;

      case 'cela':
        if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.element)) {
          destination = cela as ElementJeu;
        } else {
          console.error("Déplacer vers cela: cela n'est pas un élément du jeu.");
        }
        break;

      case 'joueur':
        destination = this.jeu.joueur;
        break;

      case 'ici':
        destination = this.eju.curLieu;
        break;

      default:
        let correspondanceCompl = this.eju.trouverCorrespondance(complement, false, false);
        // un élément trouvé
        if (correspondanceCompl.elements.length === 1) {
          destination = correspondanceCompl.elements[0];
          // aucun élément trouvé
        } else if (correspondanceCompl.elements.length === 0) {
          console.error("executerDeplacer >>> je n’ai pas trouvé la destination:", complement);
          // plusieurs éléments trouvés
        } else {
          console.error("executerDeplacer >>> j’ai trouvé plusieurs correspondances pour la destination:", complement, correspondanceCompl);
        }
        break;
    }

    // si on a trouver le sujet et la distination, effectuer le déplacement.
    if (objet && destination) {
      resultat = this.exectuterDeplacerObjetVersDestination(objet, preposition, destination);
      // si on a trouvé le sujet (liste d’objets) et la destination, effectuer les déplacements. 
    } else if (objets && destination) {
      resultat.succes = true;
      // objets contenus trouvés
      objets.forEach(el => {
        resultat.succes = (resultat.succes && this.exectuterDeplacerObjetVersDestination(el, preposition, destination).succes);
      });
    }

    return resultat;
  }

  /**
   * Déplacer un élément du jeu.
   */
  private exectuterDeplacerObjetVersDestination(objet: Objet, preposition: string, destination: ElementJeu): Resultat {
    let resultat = new Resultat(false, '', 1);

    // interpréter "vers" comme "dans".
    if (preposition == 'vers') {
      // support => sur
      if (ClasseUtils.heriteDe(destination.classe, EClasseRacine.support)) {
        preposition = "sur";
        // contenant, joueur, lieu, ...
      } else {
        preposition = "dans";
      }
    }

    // TODO: vérifications
    objet.position = new PositionObjet(
      PrepositionSpatiale[preposition],
      ClasseUtils.heriteDe(destination.classe, EClasseRacine.lieu) ? EClasseRacine.lieu : EClasseRacine.objet,
      destination.id
    );

    // si l'objet à déplacer est le joueur, modifier la visibilité des objets
    if (objet.id === this.jeu.joueur.id) {

      // la présence des objets a changé
      this.eju.majPresenceDesObjets();

      // l’adjacence des lieux a changé
      this.eju.majAdjacenceLieux();

      // si l'objet à déplacer n'est pas le joueur
    } else {
      // si la destination est un lieu
      if (objet.position.cibleType === EClasseRacine.lieu) {
        // l'objet n'est plus possédé ni porté
        this.jeu.etats.retirerEtatElement(objet, EEtatsBase.possede, true);
        this.jeu.etats.retirerEtatElement(objet, EEtatsBase.porte, true);
        // l’objet n’est plus caché (car on n’est pas sensé examiner directement un lieu)
        this.jeu.etats.retirerEtatElement(objet, EEtatsBase.cache, true);
        // si la destination est le lieu actuel, l'objet est présent
        if (objet.position.cibleId === this.eju.curLieu.id) {
          this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.present, true);
          // si c'est un autre lieu, l’objet n'est plus présent.
        } else {
          this.jeu.etats.retirerEtatElement(objet, EEtatsBase.present, true);
        }
        // si la destination est un objet
      } else {
        // si la destination est le joueur, l'objet est présent, possédé et n’est plus caché.
        if (destination.id === this.jeu.joueur.id) {
          this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.present, true);
          this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.possede, true);
          this.jeu.etats.retirerEtatElement(objet, EEtatsBase.cache, true);

          // sinon, on va analyser le contenant qui est forcément un objet.
        } else {
          // forcément l'objet n'est pas possédé ni porté
          // TODO: un objet dans un contenant possédé est-il possédé ?
          this.jeu.etats.retirerEtatElement(objet, EEtatsBase.possede, true);
          // TODO: un objet dans un contenant porté est-il porté ?
          this.jeu.etats.retirerEtatElement(objet, EEtatsBase.porte, true);
          this.eju.majPresenceObjet(objet);
        }
      }

      // si l’objet déplacé est un contenant ou un support, il faut màj les objets contenus
      let contenu: Objet[] = [];
      if (ClasseUtils.heriteDe(objet.classe, EClasseRacine.support)) {
        contenu = this.obtenirContenu(objet, PrepositionSpatiale.sur);
      } else if (ClasseUtils.heriteDe(objet.classe, EClasseRacine.contenant)) {
        contenu = this.obtenirContenu(objet, PrepositionSpatiale.dans);
      }
      if (contenu?.length > 0) {
        contenu.forEach(curObj => {
          this.eju.majPresenceObjet(curObj);
        });
      }

    }

    // l’objet a été déplacé
    this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.deplace, true);
    // la destination a été modifiée
    this.jeu.etats.ajouterEtatElement(destination, EEtatsBase.modifie, true);

    resultat.succes = true;
    return resultat;
  }

  /**
   * Effacer un élément du jeu.
   */
  private executerEffacer(ceci: ElementJeu = null): Resultat {
    let resultat = new Resultat(false, '', 1);
    if (ceci) {
      // objet
      if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
        const indexObjet = this.jeu.objets.indexOf((ceci as Objet));
        if (indexObjet !== -1) {
          this.jeu.objets.splice(indexObjet, 1);
          resultat.succes = true;
        }
        // lieu
      } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        const indexLieu = this.jeu.objets.indexOf((ceci as Objet));
        if (indexLieu !== -1) {
          this.jeu.lieux.splice(indexLieu, 1);
          resultat.succes = true;
        }
      } else {
        console.error("executerEffacer: classe racine pas pris en charge:", ceci.classe);
      }
    }
    return resultat;
  }

  /** Changer quelque chose dans le jeu */
  private executerChanger(instruction: ElementsPhrase, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    let resultat = new Resultat(false, '', 1);

    if (instruction.sujet) {
      switch (instruction.sujet.nom.toLowerCase()) {
        case 'joueur':
          resultat = this.executerJoueur(instruction, ceci, cela);
          break;

        case 'historique':
          resultat = this.executerHistorique(instruction);
          break;

        // case 'inventaire':
        //   resultat = this.executerInventaire(instruction);
        //   break;

        case 'ceci':
          if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
            resultat = this.executerElementJeu(ceci as Objet, instruction);
          } else {
            console.error("executer changer ceci: ceci n'est pas un objet.");
          }
          break;

        case 'cela':
          if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
            resultat = this.executerElementJeu(cela as Objet, instruction);
          } else {
            console.error("executer changer cela: cela n'est pas un objet.");
          }
          break;

        default:
          let correspondance = this.eju.trouverCorrespondance(instruction.sujet, false, false);

          // PAS OBJET ET PAS LIEU
          if (correspondance.objets.length === 0 && correspondance.lieux.length === 0) {
            console.error("executerChanger: pas trouvé l’élément " + instruction.sujet);

            // OBJET(S) SEULEMENT
          } else if (correspondance.lieux.length === 0) {
            if (correspondance.objets.length === 1) {
              resultat = this.executerElementJeu(correspondance.objets[0], instruction);
            } else {
              console.error("executerChanger: plusieurs objets trouvés:", correspondance);
            }
            // LIEU(X) SEULEMENT
          } else if (correspondance.objets.length === 0) {
            if (correspondance.lieux.length === 1) {
              resultat = this.executerElementJeu(correspondance.objets[0], instruction);
            } else {
              console.error("executerChanger: plusieurs lieux trouvés:", correspondance);
            }
          } else {
            console.error("executerChanger: trouvé lieu(x) ET objet(s):", correspondance);
          }
          break;
      }
    } else {
      console.error("executerChanger : pas de sujet, instruction:", instruction);
    }

    return resultat;
  }

  /**
   * Exécuter une instruction de type "réaction".
   * @param instruction 
   * @param ceci 
   * @param cela 
   */
  private executerReaction(instruction: ElementsPhrase, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    let resultat = new Resultat(false, '', 1);

    if (instruction.complement1) {
      switch (instruction.complement1.toLocaleLowerCase()) {
        case 'réaction de ceci':
          if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(ceci as Objet, null);
          } else {
            console.error("Exécuter réaction de ceci: ceci n'est pas un objet");
          }
          break;
        case 'réaction de cela':
          if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(cela as Objet, null);
          } else {
            console.error("Exécuter réaction de cela: cela n'est pas un objet");
          }
          break;
        case 'réaction de ceci concernant cela':
        case 'réaction de ceci à cela':
          if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(ceci as Objet, cela);
          } else {
            console.error("Exécuter réaction de ceci à cela: ceci n'est pas un objet");
          }
          break;
        case 'réaction de cela concernant ceci':
        case 'réaction de cela à ceci':
          if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(cela as Objet, ceci);
          } else {
            console.error("Exécuter réaction de cela à ceci: cela n'est pas un objet");
          }
          break;

        default:
          console.error("executerReaction : sujet autre que « réaction de ceci », « réaction de cela », « réaction de ceci à cela » pas pris en charge, instruction:", instruction);
      }
    } else {
      console.error("executerReaction : pas de sujet, instruction:", instruction);
    }

    return resultat;
  }

  /**
   * Exécuter la réaction d'une personne à un sujet (ou non).
   */
  private suiteExecuterReaction(personne: ElementJeu, sujet: Intitule) {

    let resultat = new Resultat(false, '', 1);
    let reaction: Reaction = null;

    // vérifier que la personne est bien un objet
    if (!personne) {
      console.error("suiteExecuterReaction: la personne est null");
    }
    if (!ClasseUtils.heriteDe(personne.classe, EClasseRacine.personne)) {
      if (!ClasseUtils.heriteDe(personne.classe, EClasseRacine.objet)) {
        console.error("suiteExecuterReaction: la personne qui doit réagir n’est ni une personne, ni un objet:", personne);
      } else {
        console.warn("suiteExecuterReaction: la personne qui doit réagir n’est pas une personne:", personne);
      }
    }

    // réaction à un sujet
    if (sujet) {
      console.log("suiteExecuterReaction: sujet=", sujet, " personne=", personne);

      const nomMinuscules = sujet.intitule.nom.toLowerCase() ?? null;
      const epitheteMinuscules = sujet.intitule.epithete?.toLowerCase() ?? null;

      // rechercher s’il y a une des réaction qui comprend ce sujet
      reaction = (personne as Objet).reactions
        .find(x => x.sujets && x.sujets.some(y => y.nom == nomMinuscules && y.epithete == epitheteMinuscules));
      // si on n’a pas de résultat, rechercher le sujet « sujet inconnu »:
      if (!reaction) {
        reaction = (personne as Objet).reactions
          .find(x => x.sujets && x.sujets.some(y => y.nom == "sujet" && y.epithete == "inconnu"));
      }
    }
    // si pas de réaction à un sujet, prendre réaction par défaut (aucun sujet)
    if (!reaction) {
      console.log("suiteExecuterReaction: réaction à aucun sujet");
      reaction = (personne as Objet).reactions
        .find(x => x.sujets && x.sujets.some(y => y.nom == "aucun" && y.epithete == "sujet"));
    }
    // on a trouvé une réaction
    if (reaction) {
      // TODO: faut-il fournir ceci et cela ?
      resultat = this.executerInstructions(reaction.instructions, null, null);
      // on n’a pas trouvé de réaction
    } else {
      // si aucune réaction ce n’est pas normal: soit il faut une réaction par défaut, soit il ne faut pas passer par ici.
      console.error("suiteExecuterReaction : cette personne n’a pas de réaction par défaut:", personne);
    }

    return resultat;
  }

  /** Exécuter une instruction qui cible l'historique. */
  private executerHistorique(instruction: ElementsPhrase) {
    let resultat = new Resultat(false, '', 1);
    if (instruction.verbe.toLocaleLowerCase() === 'contient') {
      let valeur = instruction.complement1.trim().toLocaleLowerCase();
      // trouver valeur dans l’historique
      let foundIndex = this.jeu.sauvegardes.indexOf(valeur);

      // SUPPRIMER la valeur de l’historique
      if (instruction.negation) {
        // supprimer seulement si présente
        if (foundIndex !== -1) {
          this.jeu.sauvegardes.splice(foundIndex, 1);
          resultat.succes = true;
        }
        // AJOUTER une valeur à l’historique
      } else {
        // ajouter seulement si pas encore présente
        if (foundIndex === -1) {
          this.jeu.sauvegardes.push(valeur);
          resultat.succes = true;
        }
      }
    }
    return resultat;
  }

  /** Exécuter une instruction qui cible le joueur */
  private executerJoueur(instruction: ElementsPhrase, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule): Resultat {
    let resultat = new Resultat(false, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      // DÉPLACER LE JOUEUR
      case 'se trouve':
        resultat = this.executerDeplacer(instruction.sujet, instruction.preposition1, instruction.sujetComplement1, ceci as Objet, cela);
        break;

      // AJOUTER UN OBJET A L'INVENTAIRE
      case 'possède':
        // Objet classique
        if (instruction.sujetComplement1) {
          resultat = this.executerDeplacer(instruction.sujetComplement1, "dans", instruction.sujet, ceci as Objet, cela);
          // Instruction spécifique
        } else if (instruction.complement1) {
          let objets: Objet[] = null;
          // - objets dans ceci
          if (instruction.complement1.endsWith('objets dans ceci')) {
            if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
              objets = this.obtenirContenu(ceci as Objet, PrepositionSpatiale.dans);
            } else {
              console.error("Joueur possède objets dans ceci: ceci n'est as un objet.");
            }
            // - objets sur ceci
          } else if (instruction.complement1.endsWith('objets sur ceci')) {
            if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
              objets = this.obtenirContenu(ceci as Objet, PrepositionSpatiale.sur);
            } else {
              console.error("Joueur possède objets sur ceci: ceci n'est as un objet.");
            }
            // - objets sous ceci
          } else if (instruction.complement1.endsWith('objets sous ceci')) {
            if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
              objets = this.obtenirContenu(ceci as Objet, PrepositionSpatiale.sous);
            } else {
              console.error("Joueur possède objets sous ceci: ceci n'est as un objet.");
            }
            // - objets dans cela
          } else if (instruction.complement1.endsWith('objets dans cela')) {
            if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
              objets = this.obtenirContenu(cela as Objet, PrepositionSpatiale.dans);
            } else {
              console.error("Joueur possède objets dans cela: cela n'est as un objet.");
            }
            // - objets sur cela
          } else if (instruction.complement1.endsWith('objets sur cela')) {
            if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
              objets = this.obtenirContenu(cela as Objet, PrepositionSpatiale.sur);
            } else {
              console.error("Joueur possède objets sur cela: cela n'est as un objet.");
            }
            // - objets sous cela
          } else if (instruction.complement1.endsWith('objets sous cela')) {
            if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
              objets = this.obtenirContenu(cela as Objet, PrepositionSpatiale.sous);
            } else {
              console.error("Joueur possède objets sous cela: cela n'est as un objet.");
            }
            // - objets ici
          } else if (instruction.complement1.endsWith('objets ici')) {
            objets = this.obtenirContenu(this.eju.curLieu, PrepositionSpatiale.dans);
          }

          // objets contenus trouvés
          if (objets) {
            resultat.succes = true;
            objets.forEach(el => {
              resultat = (resultat.succes && this.exectuterDeplacerObjetVersDestination(el, 'dans', this.jeu.joueur));
            });
          }
        }
        break;

      // PORTER UN OBJET (s'habiller avec)
      case 'porte':
        let objet: Objet = this.trouverObjetCible(instruction.complement1, instruction.sujetComplement1, ceci, cela);
        if (objet) {
          // NE porte PAS
          if (instruction.negation) {
            // l'objet n’est plus porté
            this.jeu.etats.retirerEtatElement(objet, EEtatsBase.porte, true);
            // PORTE
          } else {
            // déplacer l'objet vers l'inventaire
            resultat = this.exectuterDeplacerObjetVersDestination(objet, "dans", this.jeu.joueur);
            // l'objet est porté
            this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.porte, true);
          }

        }
        break;

      case 'est':
      case 'sont':
        const nEstPas = instruction.negation && (instruction.negation.trim() === 'pas' || instruction.negation.trim() === 'plus');
        // n'est pas => retirer un état
        if (nEstPas) {
          if (this.verbeux) {
            console.log("executerJoueur: retirer l’état '", instruction.complement1, "' ele=", this.jeu.joueur);
          }
          this.jeu.etats.retirerEtatElement(this.jeu.joueur, instruction.complement1);
          // est => ajouter un état
        } else {
          if (this.verbeux) {
            console.log("executerJoueur: ajouter l’état '", instruction.complement1, "'");
          }
          // séparer les attributs, les séparateurs possibles sont «, », « et » et « ou ».
          const attributsSepares = PhraseUtils.separerListeIntitules(instruction.complement1);
          attributsSepares.forEach(attribut => {
            this.jeu.etats.ajouterEtatElement(this.jeu.joueur, attribut);
          });
        }
        break;

      default:
        console.error("executerJoueur : pas compris verbe", instruction.verbe, instruction);
        break;
    }
    return resultat;
  }

  private executerElementJeu(element: ElementJeu, instruction: ElementsPhrase): Resultat {

    let resultat = new Resultat(true, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'est':
      case 'sont':
        const nEstPas = instruction.negation && (instruction.negation.trim() === 'pas' || instruction.negation.trim() === 'plus');
        // n'est pas => retirer un état
        if (nEstPas) {
          if (this.verbeux) {
            console.log("executerElementJeu: retirer l’état '", instruction.complement1, "' ele=", element);
          }
          this.jeu.etats.retirerEtatElement(element, instruction.complement1);
          // est => ajouter un état
        } else {
          if (this.verbeux) {
            console.log("executerElementJeu: ajouter l’état '", instruction.complement1, "'");
          }
          // séparer les attributs, les séparateurs possibles sont «, », « et » et « ou ».
          const attributsSepares = PhraseUtils.separerListeIntitules(instruction.complement1);
          attributsSepares.forEach(attribut => {
            this.jeu.etats.ajouterEtatElement(element, attribut);
          });
        }

        break;

      case 'se trouve':
      case 'se trouvent':
        console.log("executerElementJeu: se trouve:", instruction);
        resultat = this.executerDeplacer(instruction.sujet, instruction.preposition1, instruction.sujetComplement1);
        break;

      default:
        resultat.succes = false;
        console.error("executerElementJeu: pas compris le verbe:", instruction.verbe, instruction);
        break;
    }
    return resultat;
  }

  /** Afficher le statut d'une porte ou d'un contenant (verrouilé, ouvrable, ouvert, fermé) */
  afficherStatut(obj: Objet) {
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
          retVal = ElementsJeuUtils.calculerIntitule(porte, true) + " est fermée.";
        }
      } else {
        if (ouvert) {
          // retVal = ElementsJeuUtils.calculerIntitule(porte, true) + " est ouvert.";
          retVal = texteSiAucunObstacle;
        } else {
          retVal = ElementsJeuUtils.calculerIntitule(porte, true) + " est fermé.";
        }
      }
    }
    return retVal;
  }

  afficherSorties(lieu: Lieu): string {
    let retVal: string;

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

  /**
   * Retrouver l’objet cible de la condition.
   * @param brute « ceci » et « cela » sont gérés.
   * @param intitule un objet à retrouver
   * @param ceci pour le cas où brute vaut « ceci ».
   * @param cela pour le cas où brute vaut « cela ».
   */
  private trouverObjetCible(brute: string, intitule: GroupeNominal, ceci: Intitule | ElementJeu, cela: Intitule | ElementJeu): Objet {
    let objetCible: Objet = null;
    // retrouver OBJET SPÉCIAL
    if (brute === 'ceci') {
      if (ceci && ClasseUtils.heriteDe(ceci?.classe, EClasseRacine.objet)) {
        objetCible = ceci as Objet;
      } else {
        console.error("Instructions > trouverObjetCible > ceci n’est pas un objet.");
      }
    } else if (brute === 'cela') {
      if (cela && ClasseUtils.heriteDe(cela?.classe, EClasseRacine.objet)) {
        objetCible = cela as Objet;
      } else {
        console.error("Instructions > trouverObjetCible > cela n’est pas un objet.");
      }
      // retrouver OBJET CLASSIQUE
    } else if (intitule) {
      const objetsTrouves = this.eju.trouverObjet(intitule, false);
      if (objetsTrouves.length == 1) {
        objetCible = objetsTrouves[0];
      } else {
        console.warn("Instructions > trouverObjetCible > plusieurs correspondances trouvées pour :", brute);
      }
    } else {
      console.error("Instructions > trouverObjetCible > objet spécial pas pris en change :", brute);
    }
    if (!objetCible) {
      console.warn("Instructions > trouverObjetCible > pas pu trouver :", brute);
    }
    return objetCible;
  }


}