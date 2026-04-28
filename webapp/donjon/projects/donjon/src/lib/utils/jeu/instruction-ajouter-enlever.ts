import { ContexteTour } from "../../models/jouer/contexte-tour";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils, TypeSujet } from "../commun/elements-jeu-utils";
import { ElementsPhrase } from "../../models/commun/elements-phrase";
import { ExprReg } from "../compilation/expr-reg";
import { GroupeNominal } from "../../models/commun/groupe-nominal";
import { PhraseUtils } from "../commun/phrase-utils";
import { Resultat } from "../../models/jouer/resultat";

export class InstructionAjouterEnlever {

  constructor(
    private eju: ElementsJeuUtils,
  ) { }

  /** Ajouter aux synonymes d’un élément : ajouter "a" et "b" aux synonymes de xxx
   *  OU ajouter plusieurs éléments à une liste : ajouter à <liste> : x, y et z
   */
  public executerAjouter(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    const resultat = new Resultat(false, '', 1);

    if (!instruction.complement1) {
      resultat.sortie = '{n}{+[ajouter : complément manquant.]+}';
      return resultat;
    }

    // A) ajouter "x" aux synonymes de <élément>
    const xAuxSynonymesDE = /^(.*)\baux synonymes de\b\s+(.+)$/i;
    const matchSyntaxe = xAuxSynonymesDE.exec(instruction.complement1);
    if (!matchSyntaxe) {
      // B) ajouter à <liste> : x, y et z (variantes : à / à la / à l' / à les / au / aux)
      const xAListe = /^(?:à(?:\s+(le|la|l'|les))?|(au)|(aux))\s+(.+?)\s*:\s*(.+)$/i;
      const matchListe = xAListe.exec(instruction.complement1);
      if (matchListe) {
        let article: string | null;
        if (matchListe[2]) {
          article = 'le';       // "au" → "le"
        } else if (matchListe[3]) {
          article = 'les';      // "aux" → "les"
        } else if (matchListe[1]) {
          article = matchListe[1]; // "à le/la/l'/les" → article seul
        } else {
          article = null;       // "à" sans article
        }
        let listePart: string;
        if (article) {
          const sep = article.endsWith("'") ? '' : ' ';
          listePart = article + sep + matchListe[4].trim();
        } else {
          listePart = matchListe[4].trim();
        }
        const itemsPart = matchListe[5].trim();
        return this.ajouterAListe(itemsPart, listePart, resultat, contexteTour);
      }
      resultat.sortie = `{n}{+[ajouter : syntaxe non reconnue. Attendu : ajouter "x" aux synonymes de xxx  OU  ajouter à <liste> : x, y et z (variantes : à / à la / au / aux).]+}`;
      return resultat;
    }

    const itemsPart = matchSyntaxe[1];
    const elementPart = matchSyntaxe[2].trim().toLowerCase();

    // résoudre l'élément cible
    let elementCible: ElementJeu | null = null;
    if (elementPart === 'ceci') {
      elementCible = contexteTour.ceci as ElementJeu;
    } else if (elementPart === 'cela') {
      elementCible = contexteTour.cela as ElementJeu;
    } else if (elementPart === 'ici') {
      elementCible = this.eju.curLieu;
    } else {
      const gnElement = PhraseUtils.getGroupeNominalDefiniOuIndefini(elementPart, false);
      if (gnElement) {
        const corresp = this.eju.trouverCorrespondance(gnElement, TypeSujet.SujetEstNom, false, false);
        if (corresp.objets.length === 1) {
          elementCible = corresp.objets[0];
        } else if (corresp.lieux.length === 1) {
          elementCible = corresp.lieux[0];
        }
      }
    }

    if (!elementCible) {
      resultat.sortie = `{n}{+[ajouter aux synonymes : élément « ${matchSyntaxe[2].trim()} » introuvable.]+}`;
      return resultat;
    }

    // ajouter chaque valeur entre guillemets comme synonyme (sans doublon)
    const xItem = /"([^"]+)"/g;
    let match: RegExpExecArray | null;
    while ((match = xItem.exec(itemsPart)) !== null) {
      const valeur = match[1].trim();
      if (valeur && !elementCible.synonymes.some(s => s.nomEpithete === valeur)) {
        elementCible.synonymes.push(new GroupeNominal(null, valeur, null));
      }
    }

    resultat.succes = true;
    return resultat;
  }

  private ajouterAListe(itemsPart: string, listePart: string, resultat: Resultat, contexteTour: ContexteTour): Resultat {
    const gnListe = PhraseUtils.getGroupeNominalDefiniOuIndefini(listePart, false);
    if (!gnListe) {
      resultat.sortie = `{n}{+[ajouter à liste : intitulé de liste non reconnu : « ${listePart} ».]+}`;
      return resultat;
    }
    const cor = this.eju.trouverCorrespondance(gnListe, TypeSujet.SujetEstNom, false, false);
    if (cor.listes.length !== 1) {
      resultat.sortie = `{n}{+[ajouter à liste : liste « ${listePart} » introuvable.]+}`;
      return resultat;
    }
    const liste = cor.listes[0];
    const items = PhraseUtils.separerListeIntitulesEt(itemsPart, true);
    for (const item of items) {
      const itemTrimmed = item.trim();
      if (!itemTrimmed) continue;
      if (itemTrimmed.match(ExprReg.xNombre)) {
        liste.ajouterNombre(Number.parseFloat(itemTrimmed));
      } else {
        const gnItem = PhraseUtils.getGroupeNominalDefiniOuIndefini(itemTrimmed, false);
        if (gnItem) {
          const corItem = this.eju.trouverCorrespondance(gnItem, TypeSujet.SujetEstNom, false, false);
          if (corItem.nbCor === 1) {
            liste.ajouterIntitule(corItem.unique);
          } else {
            liste.ajouterTexte(itemTrimmed);
          }
        } else {
          liste.ajouterTexte(itemTrimmed);
        }
      }
    }
    resultat.succes = true;
    return resultat;
  }

  /** Enlever (ou retirer) plusieurs éléments d’une liste : enlever de <liste> : x, y et z
   *  Variantes acceptées pour la préposition : de / de la / de l' / de les / du / des / depuis
   */
  public executerEnlever(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    const resultat = new Resultat(false, '', 1);

    if (!instruction.complement1) {
      resultat.sortie = `{n}{+[${instruction.infinitif} : complément manquant.]+}`;
      return resultat;
    }

    const xDeListe = /^(?:de(?:\s+(le|la|l'|les))?|(du)|(des)|(depuis))\s+(.+?)\s*:\s*(.+)$/i;
    const matchListe = xDeListe.exec(instruction.complement1);
    if (matchListe) {
      let article: string | null;
      if (matchListe[2]) {
        article = 'le';       // "du" → "le"
      } else if (matchListe[3]) {
        article = 'les';      // "des" → "les"
      } else if (matchListe[4]) {
        article = null;       // "depuis" sans article
      } else if (matchListe[1]) {
        article = matchListe[1]; // "de le/la/l'/les" → article seul
      } else {
        article = null;       // "de" sans article
      }
      let listePart: string;
      if (article) {
        const sep = article.endsWith("'") ? '' : ' ';
        listePart = article + sep + matchListe[5].trim();
      } else {
        listePart = matchListe[5].trim();
      }
      const itemsPart = matchListe[6].trim();
      return this.enleverDeListe(itemsPart, listePart, resultat, contexteTour);
    }
    resultat.sortie = `{n}{+[${instruction.infinitif} : syntaxe non reconnue. Attendu : ${instruction.infinitif} de <liste> : x, y et z (variantes : de / de la / du / des / depuis).]+}`;
    return resultat;
  }

  private enleverDeListe(itemsPart: string, listePart: string, resultat: Resultat, contexteTour: ContexteTour): Resultat {
    const gnListe = PhraseUtils.getGroupeNominalDefiniOuIndefini(listePart, false);
    if (!gnListe) {
      resultat.sortie = `{n}{+[enlever de liste : intitulé de liste non reconnu : « ${listePart} ».]+}`;
      return resultat;
    }
    const cor = this.eju.trouverCorrespondance(gnListe, TypeSujet.SujetEstNom, false, false);
    if (cor.listes.length !== 1) {
      resultat.sortie = `{n}{+[enlever de liste : liste « ${listePart} » introuvable.]+}`;
      return resultat;
    }
    const liste = cor.listes[0];
    const items = PhraseUtils.separerListeIntitulesEt(itemsPart, true);
    for (const item of items) {
      const itemTrimmed = item.trim();
      if (!itemTrimmed) continue;
      if (itemTrimmed.match(ExprReg.xNombre)) {
        liste.retirerNombre(Number.parseFloat(itemTrimmed));
      } else {
        const gnItem = PhraseUtils.getGroupeNominalDefiniOuIndefini(itemTrimmed, false);
        if (gnItem) {
          const corItem = this.eju.trouverCorrespondance(gnItem, TypeSujet.SujetEstNom, false, false);
          if (corItem.nbCor === 1) {
            liste.retirerIntitule(corItem.unique);
          } else {
            liste.retirerTexte(itemTrimmed);
          }
        } else {
          liste.retirerTexte(itemTrimmed);
        }
      }
    }
    resultat.succes = true;
    return resultat;
  }

}
