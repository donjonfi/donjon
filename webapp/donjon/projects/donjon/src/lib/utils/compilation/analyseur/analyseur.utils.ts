import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { Phrase } from "../../../models/compilateur/phrase";
import { ExprReg } from "../expr-reg";

export class AnalyseurUtils {

    /**
     * Ajouter la description éventuelle au dernier élément générique trouvé.
     * @param phrase 
     * @param ctx 
     */
    public static ajouterDescriptionDernierElement(phrase: Phrase, ctx: ContexteAnalyse) {
        // si phrase en plusieurs morceaux, ajouter commentaire qui suit.
        if (phrase.phrase.length > 1) {
            // ajouter la description en enlevant les caractères spéciaux
            ctx.dernierElementGenerique.description = phrase.phrase[1]
                .replace(ExprReg.xCaractereDebutCommentaire, '')
                .replace(ExprReg.xCaractereFinCommentaire, '')
                .replace(ExprReg.xCaractereRetourLigne, '\n')
                .replace(ExprReg.xCaracterePointVirgule, ';')
                .replace(ExprReg.xCaractereVirgule, ',');
        }
    }

    /** Ajouter une nouvelle erreur. */
    public static ajouterErreur(ctx: ContexteAnalyse, ligne: number, erreur: string) {
        if (ligne) {
            ctx.erreurs.push(("0000" + ligne).slice(-5) + erreur);
        } else {
            ctx.erreurs.push(erreur);
        }
    }

}