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
    const balisePropriete = "(quantité|quantite|intitulé|intitule|Intitulé|Intitule|Singulier|singulier|Pluriel|pluriel|accord|es|s|e|pronom|Pronom|il|Il|l'|l\u2019|le|lui|préposition|preposition) (ceci(?:\\?)?|cela(?:\\?)?|ici|origine|destination|orientation|réponse|quantitéCeci|quantitéCela)";
    return InstructionsUtils.processBalises(texteDynamique, balisePropriete, decoupe => {
      const proprieteString = decoupe[1];
      const cibleString = decoupe[2];
      const cible = InstructionsUtils.trouverCibleSpeciale(cibleString, ctxTour, evenement, this.eju, this.jeu);
      let resultat = '';
        const propNorm = InstructionsUtils.normaliserAccents(proprieteString);
        if (cible && ClasseUtils.heriteDe(cible.classe, EClasseRacine.element)) {
          const cibleElement: ElementJeu = cible as ElementJeu;
          switch (propNorm) {
            case 'Quantite': case 'quantite':
              resultat = cibleElement.quantite.toString(); break;
            case 'intitule':
              resultat = this.eju.calculerIntituleElement(cibleElement, false, true);
              ctxTour.elementsMentionnes.push(cibleElement.id); break;
            case 'Intitule':
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
            case 'preposition':
              if (cibleString == 'ceci' || cibleString == 'ceci?') { resultat = evenement?.prepositionCeci ?? ''; }
              else if (cibleString == 'cela' || cibleString == 'cela?') { resultat = evenement?.prepositionCela ?? ''; }
              else { resultat = "?!"; } break;
            default:
              console.error("calculerBalisePropriete: propriete non prise en charge (Element):", proprieteString); break;
          }
        } else if (cible && ClasseUtils.heriteDe(cible.classe, EClasseRacine.intitule)) {
          switch (propNorm) {
            case 'intitule':
              resultat = ElementsJeuUtils.calculerIntituleGenerique(cible, false); break;
            case 'Intitule':
              resultat = ElementsJeuUtils.calculerIntituleGenerique(cible, true); break;
            case 'preposition':
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
      return resultat;
    });
  }

  calculerBaliseP(texteDynamique: string, ctxTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined): string {
    if (!texteDynamique.includes("[p ")) return texteDynamique;
    return InstructionsUtils.processBalises(texteDynamique, "p (\\S+) (ici|ceci|cela)", decoupe => {
      const proprieteString = decoupe[1];
      const cibleString = decoupe[2];
      const cible = InstructionsUtils.trouverCibleSpeciale(cibleString, ctxTour, evenement, this.eju, this.jeu);
      if (!cible) return "(" + cibleString + " est null)";
      switch (InstructionsUtils.normaliserAccents(proprieteString)) {
        case 'nom':
          return cible.nom;
        case 'intitule':
          return cible instanceof ElementJeu
            ? this.eju.calculerIntituleElement(cible, false, true)
            : cible.intitule.toString();
        case 'Intitule':
          if (cible instanceof ElementJeu) {
            return this.eju.calculerIntituleElement(cible, true, true);
          } else {
            const s = cible.intitule.toString();
            return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
          }
        case 'quantite':
          return cible instanceof ElementJeu
            ? cible.quantite.toString()
            : " (propriete quantite: pas un element du jeu) ";
        default:
          if (cible instanceof Concept) {
            const propriete = cible.proprietes.find(x => x.nom == proprieteString);
            if (propriete) {
              return propriete.type == TypeValeur.mots
                ? this.calculerTexteDynamiqueFn(propriete.valeur, ++propriete.nbAffichage, this.jeu.etats.possedeEtatIdElement(cible, this.jeu.etats.intactID), ctxTour, evenement, declenchements)
                : propriete.valeur;
            }
            return " (propriete « " + proprieteString + " » de « " + cible.intitule + " » pas trouvee) ";
          }
          ctxTour.ajouterErreurDerniereInstruction("Texte dynamique => propriete => doit concerner un concept.");
          return " (propriete « " + proprieteString + " » de « " + cible.intitule + " » pas un concept) ";
      }
    });
  }

}
