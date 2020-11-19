import { Classe } from '../commun/classe';

export class Evenement {
  constructor(
    public infinitif: string,
    public ceci: string = null,
    public classeCeci: Classe = null,
    public preposition: string = "",
    public cela: string = null,
    public classeCela: Classe = null,
  ) { }

}