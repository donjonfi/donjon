
import { ContexteAnalyseV8 } from "./contexte-analyse-v8";
import { ContexteCompilation } from "./contexte-compilation";
export class ContexteCompilationV8 extends ContexteCompilation {

  public override analyse: ContexteAnalyseV8;

  constructor(verbeux: boolean) {
    super(verbeux);
    this.analyse = new ContexteAnalyseV8(verbeux);
  }

}