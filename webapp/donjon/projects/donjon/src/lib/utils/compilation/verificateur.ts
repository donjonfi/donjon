import { BlocPrincipal, EBlocPrincipal } from "../../models/compilateur/bloc-principal";

import { ContexteAnalyseV8 } from "../../models/compilateur/contexte-analyse-v8";
import { ExprReg } from "./expr-reg";
import { Phrase } from "../../models/compilateur/phrase";

export class Verificateur {

  /** Vérifier si le scénario contient des blocs correctement ouverts et fermés.   */
  public static verifierBlocs(phrases: Phrase[], ctx: ContexteAnalyseV8) {

    // parcours de l’ensemble des phrases
    phrases.forEach(phrase => {

      // test: nouveau bloc principal (règles, action, réaction)
      if (Verificateur.estNouveauBlocPrincipal(phrase, ctx)) {

        // test: fin bloc principal
      } else if (Verificateur.estFinBlocPrincipal(phrase, ctx)) {
      // } else if (Verificateur.estNouveauBlocSecondaire(phrase, ctx)) {
      // } else if (Verificateur.estFinBlocSecondaire(phrase, ctx)) {
      } else {

      }

    });

    // vérifier si le dernier bloc est resté ouvert
    if (ctx.dernierBlocPrincipal?.ouvert) {
      this.forcerFermetureBlocPrincipal(phrases[phrases.length - 1].ligne, ctx);
    }

  }

  /** Est-ce le début d’un nouveau bloc régpon (règle, action, …) */
  public static estNouveauBlocPrincipal(phrase: Phrase, ctx: ContexteAnalyseV8): boolean {
    const ouvertureBloc = ExprReg.xDebutBlocPrincipal.exec(phrase.morceaux[0]);

    // ouverture d’un bloc principal (règle, action, réaction, …)
    if (ouvertureBloc) {
      const typeBloc = BlocPrincipal.ParseType(ouvertureBloc[1]);
      // si le dernier bloc principal n'est pas encore fermé
      if (ctx.dernierBlocPrincipal?.ouvert) {
        // le bloc principal n’a pas été correctement fermé
        this.forcerFermetureBlocPrincipal(phrase.ligne - 1, ctx);
      }
      // ajouter le nouveau bloc principal
      ctx.blocsPrincipaux.push(new BlocPrincipal(typeBloc, phrase.ligne));
      return true;
    } else {
      return false;
    }
  }

  /** Est-ce le début d’un nouveau bloc régpon (règle, action, …) */
  public static estNouveauBlocSecondaire(phrase: Phrase, ctx: ContexteAnalyseV8): boolean {
    const ouvertureBloc = ExprReg.xDebutBlocPrincipal.exec(phrase.morceaux[0]);

    // ouverture d’un bloc principal (règle, action, réaction, …)
    if (ouvertureBloc) {
      const typeBloc = BlocPrincipal.ParseType(ouvertureBloc[1]);
      // si le dernier bloc principal n'est pas encore fermé
      if (ctx.dernierBlocPrincipal?.ouvert) {
        // le bloc principal n’a pas été correctement fermé
        this.forcerFermetureBlocPrincipal(phrase.ligne - 1, ctx);
      }
      // ajouter le nouveau bloc principal
      ctx.blocsPrincipaux.push(new BlocPrincipal(typeBloc, phrase.ligne));
      return true;
    } else {
      return false;
    }
  }

  /** Est-ce la fin de la d’un bloc principal (fin règle, fin action, …) ? */
  public static estFinBlocPrincipal(phrase: Phrase, ctx: ContexteAnalyseV8): boolean {
    const fermetureBloc = ExprReg.xFinBlocPrincipal.exec(phrase.morceaux[0])
    // fermeture d’un bloc principal (règle, action, réaction, …)
    if (fermetureBloc) {
      const typeBloc = BlocPrincipal.ParseType(fermetureBloc[1]);
      // si on ferme le type de bloc princial actuellement ouvert
      if (ctx.dernierBlocPrincipal?.type === typeBloc) {
        // fermer le bloc principal normalement
        this.fermerBlocPrincipal(phrase.ligne, ctx);
        // sinon le fin de bloc n'est pas prévu
      } else {
        ctx.ajouterErreur(phrase.ligne, "Le fin " + typeBloc + 'n’est pas attendue ici.');
      }
      return true;
    } else {
      return false;
    }
  }

  /** Forcer la fermeture d’un bloc principal qui n’a pas été fini.
   * @argument finBloc numéro dernière ligne du bloc (celle avant le début du bloc suivant).
   */
  public static fermerBlocPrincipal(finBloc: number, ctx: ContexteAnalyseV8) {
    if (!ctx.blocsPrincipaux?.length) {
      throw new Error("fermerBlocPrincipal: aucun bloc principal à fermer.");
    }
    // on cloture le dernier bloc principal correctement
    ctx.dernierBlocPrincipal.fin = finBloc;
    ctx.dernierBlocPrincipal.ouvert = false;
    ctx.dernierBlocPrincipal.correctementFini = true;
  }

  /** Forcer la fermeture d’un bloc principal qui n’a pas été fini.
 * @argument finBloc numéro dernière ligne du bloc (celle avant le début du bloc suivant).
 */
  public static forcerFermetureBlocPrincipal(finBloc: number, ctx: ContexteAnalyseV8) {

    if (!ctx.blocsPrincipaux?.length) {
      throw new Error("forcerFermetureBlocPrincipal: aucun bloc principal à fermer.");
    }

    // on cloture le dernier bloc principal tout en sachant qu’il n’a pas été correctement fini.
    ctx.dernierBlocPrincipal.fin = finBloc;
    ctx.dernierBlocPrincipal.ouvert = false;
    ctx.dernierBlocPrincipal.correctementFini = false;

    switch (ctx.dernierBlocPrincipal.type) {

      // bloc « action » déjà débuté
      case EBlocPrincipal.action:
        // ctx.ajouterErreur(ctx.derniereRegion.debut, "L’action n’est pas finie.");
        ctx.ajouterErreur(finBloc, "« Fin action » débutée en ligne " + ctx.dernierBlocPrincipal.debut + " manquant ?");
        break;

      // bloc règle déjà débuté
      case EBlocPrincipal.regle:
        // ctx.ajouterErreur(ctx.derniereRegion.debut, "La règle n’est pas finie.");
        ctx.ajouterErreur(finBloc, "« Fin règle » débutée en ligne " + ctx.dernierBlocPrincipal.debut + " manquant ?");
        break;

      default:
        throw new Error("forcerFermetureBlocPrincipal: type de bloc principal pas encore pris en charge.");
    }
  }

}