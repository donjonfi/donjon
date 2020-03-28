export class Phrase {

  constructor(
    public phrase: string[],
    public commentaire: boolean,
    public traitee: boolean,
    public sujet: Element,
    public ordre: number,
    public ligne: number,
    public finie: boolean
  ) { }


}
