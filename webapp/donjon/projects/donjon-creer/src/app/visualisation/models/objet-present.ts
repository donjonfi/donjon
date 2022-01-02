import { Objet } from "@donjon/core";

export class ObjetPresent {
  constructor(
    /** Le objet correspondant à l'objet visible */
    public objet: Objet,
    /** L'objet est-il visible (depuis le lieu actuel) ? */
    public visible: boolean | undefined,
    /** L'objet est-il accessible (depuis le lieu actuel) ? */
    public accessible: boolean | undefined,
    /** L'objet est-il caché ? */
    public cache: boolean | undefined,
  ) { }
}