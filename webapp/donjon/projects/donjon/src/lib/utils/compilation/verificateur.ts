import { ERoutine, Routine } from "../../models/compilateur/routine";

import { ContexteAnalyseV8 } from "../../models/compilateur/contexte-analyse-v8";
import { ExprReg } from "./expr-reg";
import { Phrase } from "../../models/compilateur/phrase";

export class Verificateur {

  /** Vérifier si le scénario contient des routines correctement ouvertes et fermées.   */
  public static verifierRoutines(phrases: Phrase[], ctx: ContexteAnalyseV8) {

    // parcours de l’ensemble des phrases
    phrases.forEach(phrase => {

      // test: nouvelle routine (routine, règle, action, réaction, ...)
      if (Verificateur.estNouvelleRoutine(phrase, ctx)) {

        // test: fin routine
      } else if (Verificateur.estFinRoutine(phrase, ctx)) {
        // } else if (Verificateur.estNouveauBlocSecondaire(phrase, ctx)) {
        // } else if (Verificateur.estFinBlocSecondaire(phrase, ctx)) {
      } else {

      }

    });

    // vérifier si le dernier bloc est resté ouvert
    if (ctx.derniereRoutine?.ouvert) {
      this.forcerFermetureRoutine(phrases[phrases.length - 1].ligne, ctx);
    }

  }

  /** Est-ce le début d’un nouveau bloc régpon (règle, action, …) */
  public static estNouvelleRoutine(phrase: Phrase, ctx: ContexteAnalyseV8): boolean {
    const ouvertureRoutine = ExprReg.xDebutRoutine.exec(phrase.morceaux[0]);

    // ouverture d’une routine (règle, action, réaction, …)
    if (ouvertureRoutine) {
      const typeBloc = Routine.ParseType(ouvertureRoutine[1]);
      // si la dernière routine n'est pas encore fermée
      if (ctx.derniereRoutine?.ouvert) {
        // la routine n’a pas été correctement fermée
        this.forcerFermetureRoutine(phrase.ligne - 1, ctx);
      }
      // ajouter la nouvelle routine
      ctx.routines.push(new Routine(typeBloc, phrase.ligne));
      return true;
    } else {
      return false;
    }
  }

  /** Est-ce le début d’un nouveau bloc régpon (règle, action, …) */
  public static estNouveauBlocSecondaire(phrase: Phrase, ctx: ContexteAnalyseV8): boolean {
    const ouvertureBloc = ExprReg.xDebutRoutine.exec(phrase.morceaux[0]);

    // ouverture d'une nouvelle routine (règle, action, réaction, …)
    if (ouvertureBloc) {
      const typeBloc = Routine.ParseType(ouvertureBloc[1]);
      // si la dernière routine n'est pas encore fermée
      if (ctx.derniereRoutine?.ouvert) {
        // la dernière routine n’a pas été correctement fermée
        this.forcerFermetureRoutine(phrase.ligne - 1, ctx);
      }
      // ajouter la nouvelle routine
      ctx.routines.push(new Routine(typeBloc, phrase.ligne));
      return true;
    } else {
      return false;
    }
  }

  /** Est-ce la fin de la d’une routine (fin règle, fin action, …) ? */
  public static estFinRoutine(phrase: Phrase, ctx: ContexteAnalyseV8): boolean {
    const fermetureRoutine = ExprReg.xFinRoutine.exec(phrase.morceaux[0])
    // fermeture d’une routine (règle, action, réaction, …)
    if (fermetureRoutine) {
      const typeBloc = Routine.ParseType(fermetureRoutine[1]);
      // si on ferme le type routine actuellement ouverte
      if (ctx.derniereRoutine?.type === typeBloc) {
        // fermer la routine normalement
        this.fermerRoutine(phrase.ligne, ctx);
        // sinon le fin routine n'est pas prévu
      } else {
        ctx.ajouterErreur(phrase.ligne, "Le fin " + typeBloc + 'n’est pas attendu ici.');
      }
      return true;
    } else {
      return false;
    }
  }

  /** Forcer la fermeture d’une routine qui n’a pas été finie.
   * @argument finBloc numéro dernière ligne du bloc (celle avant le début du bloc suivant).
   */
  public static fermerRoutine(finBloc: number, ctx: ContexteAnalyseV8) {
    if (!ctx.routines?.length) {
      throw new Error("fermerRoutine: aucune routine à fermer.");
    }
    // on cloture la dernière routine correctement
    ctx.derniereRoutine.fin = finBloc;
    ctx.derniereRoutine.ouvert = false;
    ctx.derniereRoutine.correctementFini = true;
  }

  /** Forcer la fermeture d’une routine qui n’a pas été finie.
 * @argument finBloc numéro dernière ligne du bloc (celle avant le début du bloc suivant).
 */
  public static forcerFermetureRoutine(finBloc: number, ctx: ContexteAnalyseV8) {

    if (!ctx.routines?.length) {
      throw new Error("forcerFermetureRoutine: aucune routine à fermer.");
    }

    // on cloture la dernière routine tout en sachant qu’elle n’a pas été correctement finie.
    ctx.derniereRoutine.fin = finBloc;
    ctx.derniereRoutine.ouvert = false;
    ctx.derniereRoutine.correctementFini = false;

    switch (ctx.derniereRoutine.type) {

      // routine déjà débutée
      case ERoutine.simple:
        ctx.ajouterErreur(finBloc, "« fin routine » manquant pour la routine débutée en ligne " + ctx.derniereRoutine.debut + " ?");
        break;

      // routine « action » déjà débutée
      case ERoutine.action:
        ctx.ajouterErreur(finBloc, "« fin action » manquant pour la routine débutée en ligne " + ctx.derniereRoutine.debut + " ?");
        break;

      // routine « règle » déjà débutée
      case ERoutine.regle:
        ctx.ajouterErreur(finBloc, "« fin règle » manquant pour la routine débutée en ligne " + ctx.derniereRoutine.debut + " ?");
        break;

      // routine « réaction » déjà débutée
      case ERoutine.reaction:
        ctx.ajouterErreur(finBloc, "« fin réaction » manquant pour la routine débutée en ligne " + ctx.derniereRoutine.debut + " ?");
        break;

      default:
        throw new Error("forcerFermetureRoutine: type de routine pas encore pris en charge.");
    }
  }

}