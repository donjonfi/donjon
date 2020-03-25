import { Jeu } from '../models/jeu/jeu';
import { Monde } from '../models/compilateur/monde';

export class Generateur {

    public static genererJeu(monde: Monde): Jeu {

        let jeu = new Jeu();

        jeu.titre = monde.titre;

        return jeu;

    }

}