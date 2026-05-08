import { Lieu } from '../../../models/jeu/lieu';
import { Localisation } from '../../../models/jeu/localisation';

export class LieuVoisin {
  constructor(
    /** Direction du voisin */
    public direction: Localisation,
    /** Le lieu correspondant au voisin */
    public lieu: Lieu,
    /** Le voisin est-il visible depuis le lieu actuel ? */
    public visible: boolean,
    /** Le voisin est-il accessible depuis le lieu actuel ? */
    public accessible: boolean,
  ) { }
}