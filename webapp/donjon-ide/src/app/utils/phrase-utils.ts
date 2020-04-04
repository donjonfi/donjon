import { ElementsPhrase } from '../models/commun/elements-phrase';

export class PhraseUtils {
    static decomposerPhrase(phrase: string) {
        let el: ElementsPhrase = null;
        const regex = /(le |la |les |l'|du |de la|des |un |une )(\S+) (\S+)( .+|)/i;
        const result = regex.exec(phrase);
        if (result) {
            el = new ElementsPhrase();
            el.determinant = result[1];
            el.sujet = result[2];
            el.verbe = result[3];
            el.complement = result[4];
        }
        return el;
    }
}
