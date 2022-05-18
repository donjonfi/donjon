import { ContexteAnalyseV8 } from "../../models/compilateur/contexte-analyse-v8";
import { ETypeBlocPrincipal } from "../../models/compilateur/bloc-ouvert";
import { Phrase } from "../../models/compilateur/phrase";

export class Verificateur {

  public static verifierBlocs(phrases: Phrase[], ctx: ContexteAnalyseV8) {

    let blocPrincipalDebute = ETypeBlocPrincipal.aucun;
    let ligneDebutBlocPrincipal = 0;

    phrases.forEach(phrase => {

      // début d’un nouveau bloc principal (règle ou action)
      if (/^(r(è|e|é)gle|action) /i.test(phrase.phrase[0])) {

        switch (blocPrincipalDebute) {
          // tout va bien
          case ETypeBlocPrincipal.aucun:
            break;

          // action déjà débutée
          case ETypeBlocPrincipal.action:
            ctx.ajouterErreur(ligneDebutBlocPrincipal, "L’action n’est pas finie.");
            ctx.ajouterErreur(phrase.ligne, "« Fin action » débutée en ligne " + ligneDebutBlocPrincipal + " manquant ?");
            blocPrincipalDebute = ETypeBlocPrincipal.aucun;
            ligneDebutBlocPrincipal = 0;
            break;

          // règle déjà débutée
          case ETypeBlocPrincipal.regle:
            ctx.ajouterErreur(ligneDebutBlocPrincipal, "La règle n’est pas finie.");
            ctx.ajouterErreur(phrase.ligne, "« Fin règle » débutée en ligne " + ligneDebutBlocPrincipal + " manquant ?");
            blocPrincipalDebute = ETypeBlocPrincipal.aucun;
            ligneDebutBlocPrincipal = 0;
            break;

          default:
            throw new Error("verifierBlocs: type de bloc principal pas encore pris en charge.");
        }


      }

    });

  }

}