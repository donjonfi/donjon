import { Localisation, Objet } from "@donjon/core";

import { ObjetPresent } from "./objet-present";

export class ObstacleVoisin extends ObjetPresent {
  constructor(
    /** Direction du voisin */
    public direction: Localisation,
    /** Le lieu correspondant au voisin */
    objet: Objet,
    /** Le voisin est-il visible depuis le lieu actuel ? */
    visible: boolean,
    /** Le voisin est-il accessible depuis le lieu actuel ? */
    accessible: boolean,
    /** L'objet est-il caché ? */
    cache: boolean | undefined,
  ) {
    super(objet, visible, accessible, cache);
  }
}