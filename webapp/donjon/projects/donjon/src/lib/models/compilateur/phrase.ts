export class Phrase {

  constructor(
    public morceaux: string[],
    public traitee: boolean,
    public sujet: Element,
    public ordre: number,
    public ligne: number,
    public finie: boolean
  ) { }


}
