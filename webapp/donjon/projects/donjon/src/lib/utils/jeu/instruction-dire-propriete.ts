import { ClasseUtils } from "../commun/classe-utils";
import { Concept } from "../../models/compilateur/concept";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { EClasseRacine } from "../../models/commun/constantes";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { Genre } from "../../models/commun/genre.enum";
import { InstructionsUtils } from "./instructions-utils";
import { Jeu } from "../../models/jeu/jeu";
import { Nombre } from "../../models/commun/nombre.enum";
import { TypeValeur } from "../../models/compilateur/type-valeur";

type CalcTexteFn = (
  texteDynamique: string,
  nbAffichage: number,
  intact: boolean | undefined,
  ctxTour: ContexteTour | undefined,
  evenement: Evenement | undefined,
  declenchements: number | undefined
) => string;

export class InstructionDirePropriete {

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private calculerTexteDynamiqueFn: CalcTexteFn,
  ) { }

  calculerBalisePropriete(texteDynamique: string, ctxTour: ContexteTour | undefined, evenement: Evenement | undefined): string {
    const balisePropriete = "(quantité|quantite|intitulé|intitule|Intitulé|Intitule|Singulier|singulier|Pluriel|pluriel|accord|es|s|e|pronom|Pronom|il|Il|l\u2019|l'|le|lui|préposition|preposition) (ceci(?:\\?)?|cela(?:\\?)?|ici|origine|destination|orientation|réponse|quantitéCeci|quantitéCela)";
    const balises = InstructionsUtils.extraireBalises(texteDynamique, balisePropriete);
    if (balises) {
      for (const decoupe of balises) {
        const proprieteString = decoupe[1];
        let cibleString = decoupe[2];
        const cible = InstructionsUtils.trouverCibleSpeciale(cibleString, ctxTour, evenement, this.eju, this.jeu);
        let resultat = '';
        if (cible && ClasseUtils.heriteDe(cible.classe, EClasseRacine.element)) {
          const cibleElement: ElementJeu = cible as ElementJeu;
          switch (proprieteString) {
            case 'Quantité': case 'quantité': case 'Quantite': case 'quantite':
              resultat = cibleElement.quantite.toString(); break;
            case 'intitulé': case 'intitule':
              resultat = this.eju.calculerIntituleElement(cibleElement, false, true);
              ctxTour.elementsMentionnes.push(cibleElement.id); break;
            case 'Intitulé': case 'Intitule':
              resultat = this.eju.calculerIntituleElement(cibleElement, true, true);
              ctxTour.elementsMentionnes.push(cibleElement.id); break;
            case 'Singulier':
              resultat = this.eju.calculerIntituleElement(cibleElement, true, true, Nombre.s); break;
            case 'singulier':
              resultat = this.eju.calculerIntituleElement(cibleElement, false, true, Nombre.s); break;
            case 'Pluriel':
              resultat = this.eju.calculerIntituleElement(cibleElement, true, true, Nombre.p); break;
            case 'pluriel':
              resultat = this.eju.calculerIntituleElement(cibleElement, false, true, Nombre.p); break;
            case 'accord': case 'es':
              resultat = (cibleElement.genre === Genre.f ? "e" : "") + (cibleElement.nombre === Nombre.p || cibleElement.nombre === Nombre.tp ? "s" : ""); break;
            case 's':
              resultat = (cibleElement.nombre === Nombre.p || cibleElement.nombre === Nombre.tp ? "s" : ""); break;
            case 'e':
              resultat = (cibleElement.genre === Genre.f ? "e" : ""); break;
            case 'pronom': case 'il':
              resultat = (cibleElement.genre === Genre.f ? "elle" : "il") + (cibleElement.nombre === Nombre.p || cibleElement.nombre === Nombre.tp ? "s" : ""); break;
            case 'Pronom': case 'Il':
              resultat = (cibleElement.genre === Genre.f ? "Elle" : "Il") + (cibleElement.nombre === Nombre.p || cibleElement.nombre === Nombre.tp ? "s" : ""); break;
            case 'l\u2019':
            case "l'":
              resultat = (cibleElement.nombre === Nombre.p || cibleElement.nombre === Nombre.tp ? "les " : "l\u2019"); break;
            case 'le':
              if (cibleElement.nombre !== Nombre.p && cibleElement.nombre !== Nombre.tp) {
                resultat = cibleElement.genre !== Genre.f ? "le" : "la";
              } else { resultat = "les"; } break;
            case 'lui':
              if (cibleElement.nombre !== Nombre.p) {
                resultat = cibleElement.genre !== Genre.f ? "lui" : "elle";
              } else { resultat = cibleElement.genre !== Genre.f ? "eux" : "elles"; } break;
            case 'préposition': case 'preposition':
              if (cibleString == 'ceci' || cibleString == 'ceci?') { resultat = evenement?.prepositionCeci ?? ''; }
              else if (cibleString == 'cela' || cibleString == 'cela?') { resultat = evenement?.prepositionCela ?? ''; }
              else { resultat = "?!"; } break;
            default:
              console.error("calculerBalisePropriete: propriete non prise en charge (Element):", proprieteString); break;
          }
        } else if (cible && ClasseUtils.heriteDe(cible.classe, EClasseRacine.intitule)) {
          switch (proprieteString) {
            case 'intitulé': case 'intitule':
              resultat = ElementsJeuUtils.calculerIntituleGenerique(cible, false); break;
            case 'Intitulé': case 'Intitule':
              resultat = ElementsJeuUtils.calculerIntituleGenerique(cible, true); break;
            case 'préposition': case 'preposition':
              if (cibleString == 'ceci' || cibleString == 'ceci?') { resultat = evenement?.prepositionCeci ?? ''; }
              else if (cibleString == 'cela' || cibleString == 'cela?') { resultat = evenement?.prepositionCela ?? ''; }
              else { resultat = "?!"; } break;
            default:
              console.error("calculerBalisePropriete: propriete non prise en charge (Intitule):", proprieteString); break;
          }
        } else if (cibleString == 'ceci?' || cibleString == 'cela?') {
          resultat = "";
        } else {
          resultat = "?!?";
        }
        if (cibleString == 'ceci?' || cibleString == 'cela?') {
          cibleString = cibleString.replace("?", "\\?");
        }
        const xCurBalise = new RegExp("\\[" + proprieteString + " " + cibleString + "\\]", "g");
        texteDynamique = texteDynamique.replace(xCurBalise, resultat);
      }
    }
    return texteDynamique;
  }

  calculerBaliseP(texteDynamique: string, ctxTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined): string {
    if (texteDynamique.includes("[p ")) {
      const balises = InstructionsUtils.extraireBalises(texteDynamique, "p (\\S+) (ici|ceci|cela)");
      if (balises) {
        for (const decoupe of balises) {
          const proprieteString = decoupe[1];
          const cibleString = decoupe[2];
          const cible = InstructionsUtils.trouverCibleSpeciale(cibleString, ctxTour, evenement, this.eju, this.jeu);
          let resultatCurBalise: string = null;
          if (cible) {
            switch (proprieteString) {
              case 'nom':
                resultatCurBalise = cible.nom; break;
              case 'intitulé': case 'intitule':
                resultatCurBalise = cible instanceof ElementJeu
                  ? this.eju.calculerIntituleElement(cible, false, true)
                  : cible.intitule.toString();
                break;
              case 'Intitulé': case 'Intitule':
                if (cible instanceof ElementJeu) {
                  resultatCurBalise = this.eju.calculerIntituleElement(cible, true, true);
                } else {
                  resultatCurBalise = cible.intitule.toString();
                  if (resultatCurBalise.length > 0) {
                    resultatCurBalise = resultatCurBalise[0].toUpperCase() + resultatCurBalise.slice(1);
                  }
                }
                break;
              case 'quantité': case 'quantite':
                resultatCurBalise = cible instanceof ElementJeu
                  ? cible.quantite.toString()
                  : " (propriete quantite: pas un element du jeu) ";
                break;
              default:
                if (cible instanceof Concept) {
                  const propriete = cible.proprietes.find(x => x.nom == proprieteString);
                  if (propriete) {
                    resultatCurBalise = propriete.type == TypeValeur.mots
                      ? this.calculerTexteDynamiqueFn(propriete.valeur, ++propriete.nbAffichage, this.jeu.etats.possedeEtatIdElement(cible, this.jeu.etats.intactID), ctxTour, evenement, declenchements)
                      : propriete.valeur;
                  } else {
                    resultatCurBalise = " (propriete « " + proprieteString + " » de « " + cible.intitule + " » pas trouvee) ";
                  }
                } else {
                  ctxTour.ajouterErreurDerniereInstruction("Texte dynamique => propriete => doit concerner un concept.");
                  resultatCurBalise = " (propriete « " + proprieteString + " » de « " + cible.intitule + " » pas un concept) ";
                }
                break;
            }
          } else {
            resultatCurBalise = "(" + cibleString + " est null)";
          }
          const xCurBalise = new RegExp("\\[p " + proprieteString + " " + cibleString + "\\]", "g");
          texteDynamique = texteDynamique.replace(xCurBalise, resultatCurBalise);
        }
      }
    }
    return texteDynamique;
  }

}
