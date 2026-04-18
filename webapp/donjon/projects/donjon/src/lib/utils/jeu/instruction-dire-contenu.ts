import { ClasseUtils } from "../commun/classe-utils";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { EClasseRacine } from "../../models/commun/constantes";
import { ELocalisation, Localisation } from "../../models/jeu/localisation";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { Genre } from "../../models/commun/genre.enum";
import { InstructionsUtils } from "./instructions-utils";
import { Jeu } from "../../models/jeu/jeu";
import { Lieu } from "../../models/jeu/lieu";
import { Liste } from "../../models/jeu/liste";
import { Nombre } from "../../models/commun/nombre.enum";
import { PhraseUtils } from "../commun/phrase-utils";
import { PositionObjet, PrepositionSpatiale } from "../../models/jeu/position-objet";
import { Resultat } from "../../models/jouer/resultat";

type AfficherObstacleFn = (direction: Lieu | ELocalisation, texteSiAucunObstacle?: string) => string;
type AfficherSortiesFn = (lieu: Lieu) => string;
type ExecuterListerFn = (ceci: ElementJeu, afficherCaches: boolean, nonVisibles: boolean, discrets: boolean, secrets: boolean, dansSurSous: boolean, inclureJoueur: boolean, preposition: PrepositionSpatiale, idsDejaMentionnes: number[]) => Resultat;
type ExecuterDecrireFn = (ceci: ElementJeu, texteSiQuelqueChose: string, texteSiRien: string, afficherCaches: boolean, nonVisibles: boolean, discrets: boolean, secrets: boolean, dansSurSous: boolean, inclureJoueur: boolean, preposition: PrepositionSpatiale, idsDejaMentionnes: number[]) => Resultat;
type ExecuterEnumererFn = (ceci: ElementJeu, afficherCaches: boolean, preposition: PrepositionSpatiale, idsDejaMentionnes: number[]) => Resultat;

const CIBLES_SPECIALES = ['ici', 'ceci', 'cela', 'inventaire', 'origine', 'destination'];

export class InstructionDireContenu {

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private afficherObstacleFn: AfficherObstacleFn,
    private afficherSortiesFn: AfficherSortiesFn,
    private executerListerContenuFn: ExecuterListerFn,
    private executerDecrireContenuFn: ExecuterDecrireFn,
    private executerEnumererContenuFn: ExecuterEnumererFn,
  ) { }

  calculerBaliseObstacle(texteDynamique: string, ctxTour: ContexteTour | undefined): string {
    if (texteDynamique.includes("[obstacle ")) {
      if (texteDynamique.includes("[obstacle vers ceci]")) {
        if (ctxTour?.ceci) {
          if (ClasseUtils.heriteDe(ctxTour.ceci.classe, EClasseRacine.direction)) {
            texteDynamique = texteDynamique.replace(/\[obstacle vers ceci\]/g, this.afficherObstacleFn((ctxTour.ceci as Localisation).id));
          } else if (ClasseUtils.heriteDe(ctxTour.ceci.classe, EClasseRacine.lieu)) {
            texteDynamique = texteDynamique.replace(/\[obstacle vers ceci\]/g, this.afficherObstacleFn(ctxTour.ceci as Lieu));
          } else {
            console.error("calculerBaliseObstacle: ceci n'est ni une direction ni un lieu.");
          }
        } else {
          console.error("calculerBaliseObstacle: obstacle vers ceci: ceci est null.");
        }
      }
      if (texteDynamique.includes("[obstacle vers cela]")) {
        if (ctxTour?.cela) {
          if (ClasseUtils.heriteDe(ctxTour.cela.classe, EClasseRacine.direction)) {
            texteDynamique = texteDynamique.replace(/\[obstacle vers cela\]/g, this.afficherObstacleFn((ctxTour.cela as Localisation).id));
          } else if (ClasseUtils.heriteDe(ctxTour.cela.classe, EClasseRacine.lieu)) {
            texteDynamique = texteDynamique.replace(/\[obstacle vers cela\]/g, this.afficherObstacleFn(ctxTour.cela as Lieu));
          } else {
            console.error("calculerBaliseObstacle: cela n'est ni une direction ni un lieu.");
          }
        } else {
          console.error("calculerBaliseObstacle: obstacle vers cela: cela est null.");
        }
      }
    }
    return texteDynamique;
  }

  calculerBaliseListerDecrireContenu(texteDynamique: string, ctxTour: ContexteTour | undefined, evenement: Evenement | undefined): string {
    // La cible peut être un mot-clé (ici|ceci|…) ou un élément nommé avec article (le coffre, la table…).
    // Le .+? non-greedy est borné par \] et arrêté avant "sauf cachés" grâce à l'alternance optionnelle.
    const baliseListerDecrireContenu = "(décrire|lister|énumérer) objets (?:(sur|sous|dans|) )?(ici|origine|destination|ceci|cela|inventaire|(?:le |la |l(?:'|')|les ).+?)(?: (sauf cachés))?";
    return InstructionsUtils.processBalises(texteDynamique, baliseListerDecrireContenu, decoupe => {
      const ListerDecrireString = decoupe[1];
      const verbeLowerCase = ListerDecrireString.toLowerCase();
      const isLister = verbeLowerCase == "lister";
      const isEnumerer = verbeLowerCase == "énumérer";
      const prepositionString = decoupe[2];
      const cibleString = decoupe[3];
      const exclureCaches = decoupe[4] && decoupe[4] == "sauf cachés";
      let phraseSiVide = "";
      let phraseSiQuelqueChose = "";
      const afficherObjetsCaches = !exclureCaches;
      const estCibleSpeciale = CIBLES_SPECIALES.includes(cibleString.toLowerCase());

      let cible = InstructionsUtils.trouverCibleSpeciale(cibleString, ctxTour, evenement, this.eju, this.jeu);
      if (!cible) {
        const cibleGN = PhraseUtils.getGroupeNominalDefini(cibleString, false);
        if (cibleGN) {
          const found = InstructionsUtils.trouverElementCible(cibleGN, ctxTour, this.eju, this.jeu, false);
          if (found instanceof ElementJeu) { cible = found; }
        }
      }

      let preposition = PrepositionSpatiale.dans;
      if (prepositionString) {
        preposition = PositionObjet.getPrepositionSpatiale(prepositionString);
      }
      if (cible == this.eju.curLieu) {
        phraseSiQuelqueChose = "{U}Vous apercevez ";
      } else if (cible == this.jeu.joueur) {
        phraseSiQuelqueChose = "";
        phraseSiVide = "Votre inventaire est vide.";
      } else {
        switch (preposition) {
          case PrepositionSpatiale.sur:
            phraseSiQuelqueChose = " Dessus, il y a ";
            phraseSiVide = "Il n’y a rien de particulier dessus.";
            break;
          case PrepositionSpatiale.sous:
            phraseSiQuelqueChose = " Dessous, il y a ";
            phraseSiVide = "Il n’y a rien de particulier dessous.";
            break;
          case PrepositionSpatiale.dans:
          default:
            phraseSiQuelqueChose = " Dedans, il y a ";
            if (estCibleSpeciale) {
              phraseSiVide = "[Pronom " + cibleString + "] [v être ipr " + cibleString + "] vide[s " + cibleString + "].";
            } else if (cible instanceof ElementJeu) {
              const pronom = (cible.genre === Genre.f ? "Elle" : "Il")
                + (cible.nombre === Nombre.p || cible.nombre === Nombre.tp ? "s" : "");
              phraseSiVide = pronom + " est vide.";
            } else {
              phraseSiVide = "(élément non trouvé)";
            }
        }
      }
      if (!(cible instanceof ElementJeu)) return "{+(cible pas trouvée)+}";
      if (isEnumerer) {
        return this.executerEnumererContenuFn(cible, afficherObjetsCaches, preposition, ctxTour.elementsMentionnes).sortie;
      } else if (isLister) {
        return this.executerListerContenuFn(cible, afficherObjetsCaches, false, false, false, false, false, preposition, ctxTour.elementsMentionnes).sortie;
      } else {
        return this.executerDecrireContenuFn(cible, phraseSiQuelqueChose, phraseSiVide, afficherObjetsCaches, false, false, false, false, false, preposition, ctxTour.elementsMentionnes).sortie;
      }
    });
  }

  calculerBaliseListerDecrireListe(texteDynamique: string, ctxTour: ContexteTour | undefined, evenement: Evenement | undefined): string {
    const baliseListerDecrireListe = "(lister|décrire|énumérer) ((?:le |la |l(?:'|')|les )?(?!\\d|un|une|des|le|la|les|l\\b)(?:\\S+?|(?:\\S+? (?:à |en |au(?:x)? |de (?:la |l'|l')?|du |des |d'|d')\\S+?))(?:(?: )(?!\\(|(?:ne|n'|n'|d'|d'|et|ou|soit|mais|un|de|du|dans|sur|avec|se|s'|s')\\b)(?:\\S+))?)";
    return InstructionsUtils.processBalises(texteDynamique, baliseListerDecrireListe, decoupe => {
      const verbeString = decoupe[1];
      const cibleString = decoupe[2];
      const cibleGN = PhraseUtils.getGroupeNominalDefini(cibleString, false);
      const cible: Liste = InstructionsUtils.trouverListe(cibleGN, this.eju, this.jeu, true);
      if (cible && ClasseUtils.heriteDe(cible.classe, EClasseRacine.liste)) {
        switch (verbeString) {
          case 'lister': case 'Lister': return cible.lister();
          case 'décrire': case 'Décrire': return cible.decrire();
          case 'énumérer': case 'Énumérer': return cible.enumerer();
          default:
            console.error("calculerBaliseListerDecrireListe: verbe pas pris en charge :", verbeString);
            return '';
        }
      }
      return (cibleString == 'ceci?' || cibleString == 'cela?') ? "" : "?!?";
    });
  }

  calculerBaliseSortiesTitre(texteDynamique: string): string {
    if (texteDynamique.includes("[sorties ici]")) {
      texteDynamique = texteDynamique.replace(/\[sorties ici\]/g, this.afficherSortiesFn(this.eju.curLieu));
    }
    if (texteDynamique.includes("[titre ici]")) {
      texteDynamique = texteDynamique.replace(/\[titre ici\]/g, this.eju.curLieu?.titre ?? "(Je ne sais pas où je suis)");
    }
    return texteDynamique;
  }

}
