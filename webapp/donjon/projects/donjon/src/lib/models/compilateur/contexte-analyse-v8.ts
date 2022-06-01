import { ContexteAnalyse } from "./contexte-analyse";
import { Region } from "./region";

export class ContexteAnalyseV8 extends ContexteAnalyse {

  /**
   * Régions composants le code source.
   * (définitions, règles, actions, réactions)
   */
  public regions: Region[] = [];

  /**
   * Récupérer la dernière région
   */
  get derniereRegion(): Region | undefined {
    return this.regions?.length ? this.regions[this.regions.length - 1] : undefined;
  }

}
