
export class Classe {

  constructor(
    public nom: string,
    public intitule: string,
    public parent: Classe,
    public niveau: number,
    public etats: string[]
  ) { }

}


