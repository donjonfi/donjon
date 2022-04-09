import { RechercheUtils } from "../commun/recherche-utils";

export class CommandesUtils {
  /** Nettoyer la commmande pour ne pas afficher une erreur en cas de 
   *  faute de frappe… (espaces au début et à la fin, espaces multiples, espaces insécables)
   */
  public static nettoyerCommande(commande): string {
    const commandeNettoyee = commande
      // 1) remplacer espaces insécables par espaces simples.
      ?.replace(/ /g, ' ')
      // 2) effacer les espaces multiples
      .replace(/\s\s+/g, ' ')
      // 3) enlever espaces avant et après la commande
      .trim();

    return commandeNettoyee;
  }

  public static commandesSimilaires(commandeA: string, commandeB: string): boolean {
    const commandeANettoyee = RechercheUtils.nettoyerEtRetirerDeterminants(commandeA);
    const commandeBNettoyee = RechercheUtils.nettoyerEtRetirerDeterminants(commandeB);
    return commandeANettoyee == commandeBNettoyee;
  }

  /**
   * Retourner la liste des commandes à laquelle on a retirer le nombre de tours de jeux demandé.
   */
   public static enleverToursDeJeux(nombreDeToursAEnlever: number, commandes: string[]) {
    return commandes.slice(nombreDeToursAEnlever);
  }

}

