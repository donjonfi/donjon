import { CategorieMessage, CodeMessage } from "../../../models/compilateur/message-analyse";
import { DeclarationEtat, TypeDeclarationEtat } from "../../../models/compilateur/declaration-etat";

import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { ExprReg } from "../expr-reg";
import { Phrase } from "../../../models/compilateur/phrase";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";

export class AnalyseurEtats {

  /**
   * Tester si la phrase déclare un état personnalisé.
   *
   * Cinq formes prises en charge :
   * - `troué est un état.` (état simple)
   * - `sec et mouillé forment une bascule.` (bascule)
   * - `solide, liquide et gazeux se contredisent.` (groupe ≥ 2)
   * - `vu implique mentionné.` / `secret implique caché, invisible et discret.`
   * - `déplacé exclut intact.` / `intact exclut déplacé et modifié.`
   */
  public static testerDeclarationEtat(phrase: Phrase, ctx: ContexteAnalyseV8): ResultatAnalysePhrase {

    const texte = phrase.morceaux[0];

    // ÉTAT SIMPLE — « nom est un état »
    let r = ExprReg.xEtatSimple.exec(texte);
    if (r) {
      const nom = AnalyseurEtats.normaliserNom(r[1]);
      ctx.declarationsEtats.push(new DeclarationEtat(TypeDeclarationEtat.simple, [nom]));
      phrase.traitee = true;
      return ResultatAnalysePhrase.declarationEtat;
    }

    // BASCULE — « a et b forment une bascule »
    r = ExprReg.xEtatBascule.exec(texte);
    if (r) {
      const a = AnalyseurEtats.normaliserNom(r[1]);
      const b = AnalyseurEtats.normaliserNom(r[2]);
      ctx.declarationsEtats.push(new DeclarationEtat(TypeDeclarationEtat.bascule, [a, b]));
      phrase.traitee = true;
      return ResultatAnalysePhrase.declarationEtat;
    }

    // GROUPE — « a, b et c se contredisent »
    r = ExprReg.xEtatGroupe.exec(texte);
    if (r) {
      const noms = AnalyseurEtats.decouperListeEtats(r[1]);
      if (noms.length < 2) {
        ctx.probleme(phrase, undefined,
          CategorieMessage.syntaxeDefinition, CodeMessage.definitionAction,
          "Groupe d'états mal formé",
          `Un groupe d'états (« ${r[1]} se contredisent ») doit comporter au moins deux états.`);
      } else {
        ctx.declarationsEtats.push(new DeclarationEtat(TypeDeclarationEtat.groupe, noms));
      }
      phrase.traitee = true;
      return ResultatAnalysePhrase.declarationEtat;
    }

    // IMPLICATION — « a implique b » ou « a implique b, c et d »
    r = ExprReg.xEtatImplique.exec(texte);
    if (r) {
      const sujet = AnalyseurEtats.normaliserNom(r[1]);
      const cibles = AnalyseurEtats.decouperListeEtats(r[2]);
      ctx.declarationsEtats.push(new DeclarationEtat(TypeDeclarationEtat.implication, null, sujet, cibles));
      phrase.traitee = true;
      return ResultatAnalysePhrase.declarationEtat;
    }

    // EXCLUSION — « a exclut b » ou « a exclut b, c et d »
    r = ExprReg.xEtatExclut.exec(texte);
    if (r) {
      const sujet = AnalyseurEtats.normaliserNom(r[1]);
      const cibles = AnalyseurEtats.decouperListeEtats(r[2]);
      ctx.declarationsEtats.push(new DeclarationEtat(TypeDeclarationEtat.exclusion, null, sujet, cibles));
      phrase.traitee = true;
      return ResultatAnalysePhrase.declarationEtat;
    }

    return ResultatAnalysePhrase.aucun;
  }

  /**
   * Pré-traiter la négation dans les définitions d'élément :
   * 1. Forme verbale : « X n'est pas A et B » → « X est non_A et non_B » (idem « ne sont pas »).
   * 2. Forme inline : « X est un Y non Z » → « X est un Y non_Z » (avec underscore).
   *
   * L'underscore est nécessaire car l'analyseur d'élément standard ne capture les attributs
   * que sur un seul jeton (`\S+`). « non Z » avec espace casserait la regex. Le générateur
   * reconnaît ensuite le préfixe `non_` via {@link Generateur.appliquerAttributsAvecNegation}.
   */
  public static preTraiterNegation(phrase: Phrase): void {
    if (!phrase || !phrase.morceaux || !phrase.morceaux[0]) return;
    let txt = phrase.morceaux[0];

    // 1. Forme verbale « n'est pas » / « ne sont pas »
    const m = ExprReg.xElementSimpleNegation.exec(txt);
    if (m) {
      const sujet = m[1];
      const attributsBruts = m[2];
      const verbePositif = /ne sont pas/.test(txt) ? 'sont' : 'est';
      const reecrit = attributsBruts.split(/(, | et )/).map(part => {
        if (part === ', ' || part === ' et ') return part;
        return 'non_' + part.trim();
      }).join('');
      txt = sujet + ' ' + verbePositif + ' ' + reecrit;
    }

    // 2. Forme inline « non X » dans une définition → fusionner en `non_X`.
    // Cela permet à l'analyseur d'élément de voir un jeton unique.
    txt = txt.replace(/(\s)non\s+(\S+)/gi, '$1non_$2');

    phrase.morceaux[0] = txt;
  }

  /** Normaliser un nom d'état : trim + minuscules. */
  private static normaliserNom(nom: string): string {
    return nom.trim().toLocaleLowerCase();
  }

  /**
   * Découper une liste d'états (« a, b et c » ou « a et b » ou « a »).
   * Retourne les noms normalisés (minuscules, trim).
   */
  private static decouperListeEtats(brut: string): string[] {
    if (!brut) return [];
    // Remplacer toute occurrence de « et » par une virgule pour normaliser
    const normalise = brut.replace(/\s+et\s+/gi, ", ");
    return normalise.split(/\s*,\s*/)
      .map(s => s.trim().toLocaleLowerCase())
      .filter(s => s.length > 0);
  }

}
