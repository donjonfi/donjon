import { Concept } from "../../models/compilateur/concept";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { EEtatsBase } from "../../models/commun/constantes";
import { ElementsJeuUtils, TypeSujet } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { InstructionsUtils } from "./instructions-utils";
import { Jeu } from "../../models/jeu/jeu";
import { Lieu } from "../../models/jeu/lieu";
import { PhraseUtils } from "../commun/phrase-utils";

type ConjuguerFn = (
  verbe: string,
  modeTemps: string,
  negation: string,
  sujetStr: string,
  ici: Lieu,
  contexteTour: ContexteTour | undefined,
  evenement: Evenement | undefined
) => string;

export class InstructionDireFormat {

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private calculerConjugaisonFn: ConjuguerFn,
  ) { }

  calculerBaliseVerbe(texteDynamique: string, ctxTour: ContexteTour | undefined, evenement: Evenement | undefined): string {
    const baliseVerbe = "v ((?:se |s')?\\S+(?:ir|er|re)) (ipr|ipac|iimp|ipqp|ipas|ipaa|ifus|ifua|cpr|cpa|spr|spa|simp|spqp) (?:(pas|plus|que|ni) )?(ceci|cela|ici|quantitéCeci|quantitéCela)";
    return InstructionsUtils.processBalises(texteDynamique, baliseVerbe, decoupe => {
      return this.calculerConjugaisonFn(decoupe[1], decoupe[2], decoupe[3], decoupe[4], this.eju.curLieu, ctxTour, evenement);
    });
  }

  calculerBaliseImage(texteDynamique: string): string {
    return InstructionsUtils.processBalises(texteDynamique, "image ([\\w.-]*\\w)", decoupe => '@@image:' + decoupe[1] + '@@');
  }

  calculerBaliseHashtag(texteDynamique: string, ctxTour: ContexteTour | undefined): string {
    const baliseHashtag = "(#|@|&)\\s?((?:le |la |l'|les )?(?!(?:\\d|(?:un|une|de|du|des|le|la|les|l)\\b)|\"|d'|d\u2019)(?:\\S+?|(?:\\S+? (?:(?:(?:à|dans|et|sous|sur|vers) (?:la |le |les |l'))|de (?:la |l')?|du |des |d'|à |au(?:x)? |en |qui |sans )\\S+?))(?:(?: )(?!\\(?:|(?:(?:ne|et|ou|soit|mais|un|de|du|des|dans|sur|avec|concernant|se)\\b)|(?:d'|n'|s'|à))(?:\\S+?))?)";
    const balises = InstructionsUtils.extraireBalises(texteDynamique, baliseHashtag);
    if (balises) {
      for (const decoupe of balises) {
        const curBalise = decoupe[0];
        const type = decoupe[1];
        const elementJeu = decoupe[2];
        const correspondance = this.eju.trouverCorrespondance(PhraseUtils.getGroupeNominalDefini(elementJeu, false), TypeSujet.SujetEstNom, false, false);
        if (correspondance.nbCor == 1) {
          const conceptCible = correspondance.unique as Concept;
          if (type == '#') {
            this.jeu.etats.ajouterEtatElement(conceptCible, EEtatsBase.mentionne, this.eju);
            ctxTour.elementsMentionnes.push(conceptCible.id);
            this.jeu.derniersElementIds = [conceptCible.id];
          } else if (type == '@') {
            this.jeu.etats.ajouterEtatElement(conceptCible, EEtatsBase.vu, this.eju);
            ctxTour.elementsMentionnes.push(conceptCible.id);
            this.jeu.derniersElementIds = [conceptCible.id];
          } else if (type == '&') {
            this.jeu.etats.ajouterEtatElement(conceptCible, EEtatsBase.familier, this.eju);
          } else {
            throw new Error(`Type balise pas prise en charge type=${type}`);
          }
        } else {
          if (correspondance.nbCor == 0) {
            ctxTour.ajouterErreurDerniereInstruction(`Mention « ${curBalise} »: aucune correspondance.`);
          } else {
            ctxTour.ajouterErreurDerniereInstruction(`Mention « ${curBalise} »: plusieurs correspondances.`);
          }
        }
        texteDynamique = texteDynamique.replace(new RegExp("\\[" + type + "\\s?" + elementJeu + "\\]", "g"), "");
      }
    }
    return texteDynamique;
  }

  calculerBaliseInfinitifAction(texteDynamique: string, evenement: Evenement | undefined): string {
    if (texteDynamique.includes("[infinitif action]")) {
      texteDynamique = texteDynamique.replace(/\[infinitif action\]/g, evenement?.infinitif ?? '?!');
    }
    return texteDynamique;
  }

}
