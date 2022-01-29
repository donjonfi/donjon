export class ElementListeLecture {
  constructor(
    /** fichier à jouer. */
    public fichier: string,

    /** le fichier doit être joué en boucle. */
    public enBoucle: boolean,

    /** le nombre de répétitions après la première lecture. */
    public repetitions: number,

  ) { }
}