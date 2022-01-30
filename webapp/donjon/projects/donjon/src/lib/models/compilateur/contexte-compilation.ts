import { ContexteAnalyse } from "./contexte-analyse";
import { ElementGenerique } from "./element-generique";
import { Monde } from "./monde";
import { ResultatCompilation } from "./resultat-compilation";

export class ContexteCompilation {

  public analyse: ContexteAnalyse;
  public monde: Monde;
  public compteurs: ElementGenerique[];
  public listes: ElementGenerique[];

  public resultat: ResultatCompilation;

  constructor(public verbeux: boolean) {
    this.analyse = new ContexteAnalyse(verbeux);
  }

}
