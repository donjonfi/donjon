import { CategorieMessage, CodeMessage } from "../../models/compilateur/message-analyse";
import { ContexteAnalyseV8 } from "../../models/compilateur/contexte-analyse-v8";
import { Phrase } from "../../models/compilateur/phrase";
import { Routine } from "../../models/compilateur/routine";
import { ConditionDebutee, xFois } from "../../models/jouer/statut-conditions";
import { ExprReg } from "./expr-reg";
import { PileConditionsUtils, TypeMotCle } from "../jeu/pile-conditions-utils";

/**
 * Cadre simulé utilisé pour valider l’imbrication des conditions à la compilation.
 * Pas d’évaluation sémantique : on vérifie uniquement la structure des crochets
 * et la cohérence des mots-clés (ouverture / continuation / fermeture).
 */
interface CadreSimule {
  type: ConditionDebutee;
  /** Un `[sinon]` a déjà été rencontré pour ce cadre — interdit d’en mettre un autre, ni un `[sinonsi …]` après. */
  sinonVu: boolean;
}

/**
 * Validateur structurel des textes dynamiques (crochets de conditions).
 *
 * Détecte à la compilation : crochets non équilibrés, mots-clés de continuation
 * ou de fermeture sans cadre ouvert correspondant, `[sinon]` répété, cadres non
 * fermés en fin de texte. La sémantique (objet/propriété/expression du `[si …]`)
 * reste évaluée à l’exécution dans `instruction-dire.ts`.
 */
export class ValidateurTextesDynamiques {

  /**
   * Parcourir le tableau de phrases produit par `convertirCodeSourceEnPhrases`
   * et valider chaque chaîne dynamique présente dans une phrase.
   *
   * À ce stade, le compilateur a fait `split('"')` sur le scénario, ce qui découpe
   * une chaîne contenant des guillemets imbriqués (ex. `"[si X contient "Z"]…"`)
   * en plusieurs morceaux : un texte `Ƶ[si X contient ƶ`, un mot `Z`, un texte
   * `Ƶ]…ƶ`. On reconstitue donc la chaîne dynamique complète en concaténant les
   * morceaux textuels (encadrés par `Ƶ`/`ƶ`) avec les mots intercalés réinjectés
   * entre guillemets, ce qui restaure le texte tel qu’il a été écrit par l’auteur.
   * La validation se fait avant l’analyse syntaxique, ce qui permet de signaler
   * les erreurs de syntaxe des crochets indépendamment du contexte (description,
   * dire, propriété, réaction…).
   */
  public static validerPhrases(phrases: Phrase[], ctx: ContexteAnalyseV8): void {
    if (!phrases?.length) return;
    const debut = ExprReg.caractereDebutTexte;
    const fin = ExprReg.caractereFinTexte;
    for (const phrase of phrases) {
      if (!phrase.morceaux?.length) continue;
      let courant: string | null = null;
      for (let i = 0; i < phrase.morceaux.length; i++) {
        const m = phrase.morceaux[i];
        if (!m) continue;
        const estTexte = m.startsWith(debut) && m.endsWith(fin);
        if (estTexte) {
          const contenu = m.slice(debut.length, m.length - fin.length);
          courant = (courant === null) ? contenu : (courant + contenu);
          // Si le morceau suivant n’est pas un texte mais celui d’après en est un,
          // on est sur un guillemet imbriqué : réinjecter le mot entre `"` et continuer.
          const next = phrase.morceaux[i + 1];
          const nextEstTexte = !!next && next.startsWith(debut) && next.endsWith(fin);
          const next2 = phrase.morceaux[i + 2];
          const next2EstTexte = !!next2 && next2.startsWith(debut) && next2.endsWith(fin);
          // Garde : pour considérer le mot intercalé comme guillemet imbriqué dans la
          // même chaîne, il doit être un seul token (pas de blanc) — sinon il s’agit
          // de deux chaînes distinctes dans la même phrase (ex. `dire "X" puis "Y".`).
          const nextEstMotUnique = !!next && !nextEstTexte && next.length > 0 && !/\s/.test(next);
          if (nextEstMotUnique && next2EstTexte) {
            courant += '"' + next + '"';
            i++; // sauter le mot intercalé, le prochain tour traitera next2
          } else {
            ValidateurTextesDynamiques.validerTexte(courant, phrase, ctx);
            courant = null;
          }
        }
      }
      if (courant !== null) {
        ValidateurTextesDynamiques.validerTexte(courant, phrase, ctx);
      }
    }
  }

  /**
   * Valider un texte dynamique. Pousse les erreurs/conseils détectés dans `ctx`.
   *
   * @param texte Texte dynamique à valider (peut être null/vide).
   * @param phrase Phrase source pour rattacher les messages au numéro de ligne.
   * @param ctx Contexte d’analyse qui collecte les messages.
   * @param routine Routine éventuelle dans laquelle le texte se trouve.
   */
  public static validerTexte(
    texte: string | undefined | null,
    phrase: Phrase,
    ctx: ContexteAnalyseV8,
    routine: Routine | undefined = undefined,
  ): void {
    if (!texte) return;
    if (!texte.includes('[') && !texte.includes(']')) return;

    // 1. Vérifier l’équilibrage brut des crochets (en ignorant les `\[` et `\]`).
    if (!ValidateurTextesDynamiques.crochetsEquilibres(texte, phrase, ctx, routine)) {
      // Si les crochets sont déséquilibrés, on n’essaie pas la validation structurelle :
      // les morceaux issus du split seraient incohérents.
      return;
    }

    // 2. Reproduire la découpe runtime (split sur `[` et `]`) pour scanner les contenus de crochets.
    //    Les `\[` / `\]` ont été pris en compte dans crochetsEquilibres(). Ici on travaille
    //    sur la chaîne brute mais on ignore les paires échappées via une regex.
    const morceaux = ValidateurTextesDynamiques.splitMorceaux(texte);

    const pile: CadreSimule[] = [];

    // morceaux[0] = texte avant le premier `[`, puis alternance contenuCrochet / texte.
    for (let i = 1; i < morceaux.length; i += 2) {
      const contenu = morceaux[i] ?? '';
      const contenuLC = contenu.toLowerCase().trim();
      const cat = PileConditionsUtils.categoriser(contenu);

      if (cat === TypeMotCle.ouverture) {
        const typeOuv = ValidateurTextesDynamiques.typeOuverture(contenuLC);
        const sommet = pile.length ? pile[pile.length - 1] : null;
        // Cas particulier identique au runtime : un `[Xe fois]` qui suit un cadre
        // `fois` au sommet prolonge ce cadre au lieu d’en empiler un nouveau.
        if (typeOuv === ConditionDebutee.fois && sommet && sommet.type === ConditionDebutee.fois) {
          // pas d’empilement ; la branche est implicite
        } else {
          pile.push({ type: typeOuv, sinonVu: false });
        }

      } else if (cat === TypeMotCle.continuation) {
        const sommet = pile.length ? pile[pile.length - 1] : null;
        if (!sommet) {
          ctx.probleme(phrase, routine,
            CategorieMessage.syntaxeDynamique, CodeMessage.motCleHorsCadre,
            `[${contenu}] hors d’une condition ouverte`,
            `Le mot-clé {@[${contenu}]@} a été rencontré dans un texte dynamique alors qu’aucun bloc conditionnel n’est ouvert. Vérifiez la présence d’un {@[si …]@}, {@[au hasard]@}, {@[en boucle]@}, {@[Xe fois]@} ou {@[initialement]@} en amont.`);
        } else {
          ValidateurTextesDynamiques.validerContinuation(contenu, contenuLC, sommet, phrase, ctx, routine);
        }

      } else if (cat === TypeMotCle.fermeture) {
        if (pile.length === 0) {
          ctx.probleme(phrase, routine,
            CategorieMessage.syntaxeDynamique, CodeMessage.finBlocSansOuverture,
            `[${contenu}] sans bloc ouvert`,
            `Le mot-clé {@[${contenu}]@} a été rencontré dans un texte dynamique alors qu’aucun bloc conditionnel n’est ouvert.`);
        } else {
          pile.pop();
        }
      }
      // TypeMotCle.inconnu : peut être une balise propriété, un compteur, etc. On ne signale rien.
    }

    // 3. Cadres restés ouverts en fin de texte.
    if (pile.length > 0) {
      ctx.probleme(phrase, routine,
        CategorieMessage.syntaxeDynamique, CodeMessage.cadreNonFerme,
        `[fin] manquant dans un texte dynamique`,
        `${pile.length === 1 ? 'Un bloc conditionnel est resté ouvert' : pile.length + ' blocs conditionnels sont restés ouverts'} en fin de texte. Ajoutez le {@[fin]@} correspondant.`);
    }
  }

  /**
   * Vérifier l’équilibrage brut des crochets dans le texte.
   * Tient compte des séquences d’échappement `\[` et `\]`.
   * Reporte les déséquilibres dans `ctx` et retourne `false` si déséquilibre.
   */
  private static crochetsEquilibres(
    texte: string, phrase: Phrase, ctx: ContexteAnalyseV8, routine: Routine | undefined,
  ): boolean {
    let profondeur = 0;
    let okGlobal = true;
    for (let i = 0; i < texte.length; i++) {
      const c = texte[i];
      // ignorer les échappements
      if (c === '\\' && (texte[i + 1] === '[' || texte[i + 1] === ']')) {
        i++;
        continue;
      }
      if (c === '[') {
        profondeur++;
      } else if (c === ']') {
        if (profondeur === 0) {
          ctx.probleme(phrase, routine,
            CategorieMessage.syntaxeDynamique, CodeMessage.crochetFermantOrphelin,
            `Crochet fermant « ] » orphelin dans un texte dynamique`,
            `Un crochet fermant {@]@} n’a pas de crochet ouvrant correspondant. Si vous voulez écrire un crochet littéral, échappez-le : {@\\]@}.`);
          okGlobal = false;
        } else {
          profondeur--;
        }
      }
    }
    if (profondeur > 0) {
      ctx.probleme(phrase, routine,
        CategorieMessage.syntaxeDynamique, CodeMessage.crochetOuvrantNonFerme,
        `Crochet ouvrant « [ » non fermé dans un texte dynamique`,
        `${profondeur === 1 ? 'Un crochet ouvrant' : profondeur + ' crochets ouvrants'} {@[@} n’${profondeur === 1 ? 'a' : 'ont'} pas de {@]@} correspondant. Si vous voulez écrire un crochet littéral, échappez-le : {@\\[@}.`);
      okGlobal = false;
    }
    return okGlobal;
  }

  /**
   * Découper le texte en morceaux : index pairs = texte hors crochets,
   * index impairs = contenu des crochets. Tient compte des séquences d’échappement
   * `\[` et `\]` qui ne doivent pas être traitées comme des crochets de condition.
   */
  private static splitMorceaux(texte: string): string[] {
    const morceaux: string[] = [];
    let buf = '';
    let dansCrochets = false;
    for (let i = 0; i < texte.length; i++) {
      const c = texte[i];
      if (c === '\\' && (texte[i + 1] === '[' || texte[i + 1] === ']')) {
        // crochet échappé : on l’ajoute au buffer courant, sans changer d’état
        buf += texte[i + 1];
        i++;
        continue;
      }
      if (!dansCrochets && c === '[') {
        morceaux.push(buf);
        buf = '';
        dansCrochets = true;
      } else if (dansCrochets && c === ']') {
        morceaux.push(buf);
        buf = '';
        dansCrochets = false;
      } else {
        buf += c;
      }
    }
    morceaux.push(buf);
    return morceaux;
  }

  /** Type de cadre démarré par un mot-clé d’ouverture (déjà catégorisé). */
  private static typeOuverture(contenuLC: string): ConditionDebutee {
    if (xFois.test(contenuLC)) return ConditionDebutee.fois;
    if (contenuLC === 'au hasard') return ConditionDebutee.hasard;
    if (contenuLC === 'en boucle') return ConditionDebutee.boucle;
    if (contenuLC === 'initialement') return ConditionDebutee.initialement;
    return ConditionDebutee.si; // si …
  }

  /**
   * Valider un mot-clé de continuation par rapport au type du cadre courant.
   * Met à jour `sommet.sinonVu` si pertinent.
   */
  private static validerContinuation(
    contenu: string, contenuLC: string, sommet: CadreSimule,
    phrase: Phrase, ctx: ContexteAnalyseV8, routine: Routine | undefined,
  ): void {
    const estSinonSi = contenuLC.startsWith('sinonsi ') || contenuLC.startsWith('sinon si ');
    const estSinon = contenuLC === 'sinon';
    const estOu = contenuLC === 'ou';
    const estPuis = contenuLC === 'puis';

    if (estSinonSi || estSinon) {
      // sinon/sinonsi exigent un cadre `si` (sinon est aussi accepté pour `fois` au runtime).
      if (sommet.type !== ConditionDebutee.si && !(estSinon && sommet.type === ConditionDebutee.fois)) {
        ctx.probleme(phrase, routine,
          CategorieMessage.syntaxeDynamique, CodeMessage.motCleHorsCadre,
          `[${contenu}] sans « si » correspondant`,
          `Le mot-clé {@[${contenu}]@} doit suivre un {@[si …]@}${estSinon ? ' ou un {@[Xe fois]@}' : ''}, pas un cadre de type « ${sommet.type} ».`);
        return;
      }
      if (sommet.sinonVu) {
        ctx.probleme(phrase, routine,
          CategorieMessage.syntaxeDynamique, CodeMessage.sinonApresSinon,
          `[${contenu}] après un [sinon] du même cadre`,
          `Un {@[sinon]@} a déjà été rencontré pour ce bloc conditionnel ; un autre {@[sinon]@} ou {@[sinonsi …]@} ne peut plus être ajouté ensuite.`);
        return;
      }
      if (estSinon) sommet.sinonVu = true;
      return;
    }

    if (estOu) {
      if (sommet.type !== ConditionDebutee.hasard) {
        ctx.probleme(phrase, routine,
          CategorieMessage.syntaxeDynamique, CodeMessage.motCleHorsCadre,
          `[ou] hors « au hasard »`,
          `Le mot-clé {@[ou]@} ne peut être utilisé que dans un bloc {@[au hasard]@}.`);
      }
      return;
    }

    if (estPuis) {
      if (sommet.type !== ConditionDebutee.fois
        && sommet.type !== ConditionDebutee.boucle
        && sommet.type !== ConditionDebutee.initialement) {
        ctx.probleme(phrase, routine,
          CategorieMessage.syntaxeDynamique, CodeMessage.motCleHorsCadre,
          `[puis] hors « fois », « en boucle » ou « initialement »`,
          `Le mot-clé {@[puis]@} ne peut être utilisé que dans un bloc {@[Xe fois]@}, {@[en boucle]@} ou {@[initialement]@}.`);
      }
      return;
    }
  }

}
