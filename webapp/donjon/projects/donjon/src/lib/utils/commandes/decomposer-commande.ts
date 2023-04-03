import { Action } from "../../models/compilateur/action";
import { ActionsUtils } from "../jeu/actions-utils";
import { ExprReg } from "../compilation/expr-reg";

export class DecomposerCommande {

  public static trouverInfinitifEtComplementCommande(commandeNettoyee: string): InfinitifComplement {
    // si commence par me/se, il faudra prendre le 2e espace
    const commenceParSe = commandeNettoyee.match(/^(se|me)\b/i);
    const espaceApresVerbe = commandeNettoyee.indexOf(' ', (commenceParSe ? 3 : 0));
    const infinitif = (espaceApresVerbe != -1 ? commandeNettoyee.slice(0, espaceApresVerbe) : commandeNettoyee).toLocaleLowerCase();
    const complement = (espaceApresVerbe != -1 ? commandeNettoyee.slice(espaceApresVerbe + 1).trim() : undefined);

    // > Vérifier qu’il s’agit bien d’un infinitif
    if (infinitif.match(ExprReg.xVerbeInfinitif)) {
      return { infinitif, complements: complement }
    } else {
      return { infinitif: undefined, complements: undefined }
    }
  }

  public static trouverActionsCorrespondants(infinitif: string): Action[]{
    ActionsUtils()
  }

}

interface InfinitifComplement {
  infinitif: string | undefined,
  complements: string | undefined,
}