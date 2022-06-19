import { BlocPrincipal } from "./bloc-principal";
import { ContexteAnalyse } from "./contexte-analyse";

export class ContexteAnalyseV8 extends ContexteAnalyse {

  /**
   * Blocs principaux présents dans le code source.
   * (règles, actions, réactions)
   */
  public blocsPrincipaux: BlocPrincipal[] = [];

  /**
   * Obtenir le dernier bloc principal
   */
  get dernierBlocPrincipal(): BlocPrincipal | undefined {
    return this.blocsPrincipaux?.length ? this.blocsPrincipaux[this.blocsPrincipaux.length - 1] : undefined;
  }

  /**
   * Obtenir le dernier bloc principal encore ouvert ou undefined si le dernier bloc est fermé.
   */
  get blocPrincipalOuvert(): BlocPrincipal | undefined {
    let retVal: BlocPrincipal | undefined;
    if (this.blocsPrincipaux?.length && this.blocsPrincipaux[this.blocsPrincipaux.length - 1].ouvert) {
      retVal = this.blocsPrincipaux[this.blocsPrincipaux.length - 1];
    }
    return retVal;
  }

  /**
   * Obtenir le bloc principal qui inclut la ligne spécifiée ou undefined sa la ligne ne fait pas partie d’un bloc principal.
   */
  getBlocPrincipalLigne(ligne: number): BlocPrincipal | undefined {
    let retVal: BlocPrincipal | undefined;
    if (this.blocsPrincipaux?.length) {
      retVal = this.blocsPrincipaux.find(x => x.debut <= ligne && x.fin >= ligne);
    }
    return retVal;
  }

}
