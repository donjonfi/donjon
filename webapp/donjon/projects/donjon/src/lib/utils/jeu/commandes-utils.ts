import { ExprReg } from "../compilation/expr-reg";
import { RechercheUtils } from "../commun/recherche-utils";
import { Sauvegarde } from "../../models/jouer/sauvegarde";

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
   * Retourner la liste des commandes à laquelle on a retiré autant de tours de jeux  que demandé.
   */
  public static enleverToursDeJeux(nombreDeToursAEnlever: number, sauvegarde: Sauvegarde): Sauvegarde {

    // Lectures d'horloge par étape (alignées par index sur etapesSauvegarde) : on les pop/préserve
    // en parallèle, sinon le tableau se désynchronise au premier annuler d'un tour qui lit l'heure.
    const horloges = sauvegarde.horlogesSauvegarde;
    const aHorloges = Array.isArray(horloges);

    let pileDeclenchements: { etape: string, horloge: number[] | null }[] = [];

    for (let nbToursEnleves = 0; nbToursEnleves < nombreDeToursAEnlever; nbToursEnleves++) {
      const derniereCommande = sauvegarde.etapesSauvegarde.pop();
      const derniereHorloge = aHorloges ? (horloges!.pop() ?? null) : null;

      // s'il s'agit d'une réponse à une question, une graine ou un déclenchement, ce n'est pas une commande
      // donc il faudra encore enlever la commande précédente pour enlever tout le tour
      let [type, valeur] = derniereCommande.split(":");
      switch (type) {
        case ExprReg.caractereReponse:
        case ExprReg.caractereGraine:
          // réponse ou hasard: on doit annuler une étape de plus
          nbToursEnleves--;
          break;
        case ExprReg.caractereDeclenchement:
          // déclenchement: on doit annuler une étape de plus et on doit garder le déclenchement
          pileDeclenchements.push({ etape: derniereCommande, horloge: derniereHorloge });
          nbToursEnleves--;
          break;

        case ExprReg.caractereCommande:
          // cas normal
          break;

        default:
          throw new Error("enleverToursDeJeux: Caractère pas pris en charge !");
      }

      // si on est arrivé au début, on arrête.
      if (sauvegarde.etapesSauvegarde.length == 0) {
        break;
      }
    }

    // restaurer les déclenchements
    while (pileDeclenchements.length) {
      const d = pileDeclenchements.pop();
      sauvegarde.etapesSauvegarde.push(d.etape);
      if (aHorloges) horloges!.push(d.horloge);
    }

    return sauvegarde;
  }

  // /** Enlever le caractère qui identifie les réponses dans la liste des commandes. */
  // public static enleverCaractereReponse(commandes: string[]) {
  //   let commandesNettoyees = []
  //   commandes.forEach(commande => {
  //     commandesNettoyees.push(commande.replace(ExprReg.xCaractereReponse, ''));
  //   });
  //   return commandesNettoyees;
  // }

}

