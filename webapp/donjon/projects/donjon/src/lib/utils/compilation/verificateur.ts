import { ERegion, Region } from "../../models/compilateur/region";

import { ContexteAnalyseV8 } from "../../models/compilateur/contexte-analyse-v8";
import { ETypeBlocPrincipal } from "../../models/compilateur/bloc-ouvert";
import { ExprReg } from "./expr-reg";
import { Phrase } from "../../models/compilateur/phrase";

export class Verificateur {

  /** Vérifier si le scénario contient des blocs correctement ouverts et fermés.   */
  public static verifierBlocs(phrases: Phrase[], ctx: ContexteAnalyseV8) {

    // avant de commencer un bloc on est dans la zone « définition ».
    let region = ERegion.definition;

    // parcours de l’ensemble des phrases
    phrases.forEach(phrase => {

      // test: nouveau bloc principal (règles, action, réaction)
      if (!Verificateur.estNouvelleRegion(phrase, ctx)) {
        if (!Verificateur.estFinRegion(phrase, ctx)) {

        }
      }

    });

  }

  /** Est-ce le début d’un nouveau bloc régpon (règle, action, …) */
  public static estNouvelleRegion(phrase: Phrase, ctx: ContexteAnalyseV8): boolean {
    const ouvertureBloc = ExprReg.xDebutRegion.exec(phrase.morceaux[0]);

    // ouverture d’un bloc principal (règle, action, réaction, …)
    if (ouvertureBloc) {
      const typeBloc = Region.ParseType(ouvertureBloc[1]);
      // si la dernière région n'est pas encore fermée
      if (ctx.derniereRegion?.ouvert) {
        // si on était dans une région définition, la clôturer
        if (ctx.derniereRegion.type === ERegion.definition) {
          this.fermerRegion(phrase.ligne - 1, ctx);
          // si on était déjà dans un bloc principal
        } else {
          //il n’a pas été correctement fermé
          this.forcerFermetureRegion(phrase.ligne - 1, ctx);
        }
      }
      // ajouter la nouvelle région
      ctx.regions.push(new Region(typeBloc, phrase.ligne));

      return true;
    } else {
      return false;
    }
  }

  /** Est-ce la fin de la d’un bloc région (fin règle, fin action, …) ? */
  public static estFinRegion(phrase: Phrase, ctx: ContexteAnalyseV8): boolean {

    console.log("estFinRegion: phrase=", phrase.morceaux[0]);


    const fermetureBloc = ExprReg.xFinRegion.exec(phrase.morceaux[0])
    // fermeture d’un bloc principal (règle, action, réaction, …)
    if (fermetureBloc) {
      const typeBloc = Region.ParseType(fermetureBloc[1]);
      // si on ferme le type de région actuellement ouverte
      if (ctx.derniereRegion?.type === typeBloc) {
        // fermer la région normalement
        this.fermerRegion(phrase.ligne - 1, ctx);
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
  public static fermerRegion(finBloc: number, ctx: ContexteAnalyseV8) {
    if (!ctx.regions?.length) {
      throw new Error("fermerBlocPrincipal: aucune région à fermer.");
    }
    // on cloture la dernière région correctement
    ctx.derniereRegion.fin = finBloc;
    ctx.derniereRegion.correctementFinie = true;
  }

  /** Forcer la fermeture d’un bloc principal qui n’a pas été fini.
 * @argument finBloc numéro dernière ligne du bloc (celle avant le début du bloc suivant).
 */
  public static forcerFermetureRegion(finBloc: number, ctx: ContexteAnalyseV8) {

    if (!ctx.regions?.length) {
      throw new Error("forcerFermetureBlocPrincipal: aucune région à fermer.");
    }

    // on cloture la dernière région tout en sachant qu’elle n’a pas été correctement
    // finie.
    ctx.derniereRegion.fin = finBloc;
    ctx.derniereRegion.correctementFinie = false;

    // switch (ctx.derniereRegion.type) {

    //   // tout va bien on n’était toujours dans la région « définition »
    //   case ERegion.definition:
    //     break;

    //   // région « action » déjà débutée
    //   case ERegion.action:
    //     ctx.ajouterErreur(ligneDebutBlocPrincipal, "L’action n’est pas finie.");
    //     ctx.ajouterErreur(phrase.ligne, "« Fin action » débutée en ligne " + ligneDebutBlocPrincipal + " manquant ?");
    //     // on termine le bloc précédent
    //     blocPrincipalDebute = ETypeBlocPrincipal.aucun;
    //     ligneDebutBlocPrincipal = 0;
    //     break;

    //   // règle déjà débutée
    //   case ERegion.regle:
    //     ctx.ajouterErreur(ligneDebutBlocPrincipal, "La règle n’est pas finie.");
    //     ctx.ajouterErreur(phrase.ligne, "« Fin règle » débutée en ligne " + ligneDebutBlocPrincipal + " manquant ?");
    //     // on termine le bloc précédent
    //     blocPrincipalDebute = ETypeBlocPrincipal.aucun;
    //     ligneDebutBlocPrincipal = 0;
    //     break;

    //   default:
    //     throw new Error("forcerFermetureBlocPrincipal: type de bloc principal pas encore pris en charge.");
    // }
  }

}