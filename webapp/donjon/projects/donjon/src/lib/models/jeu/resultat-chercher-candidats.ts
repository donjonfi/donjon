import { Action } from "../compilateur/action";

export class ResultatChercherCandidats {

    constructor(
      public verbeConnu: boolean,
      public verbesSimilaires: string[],
      public candidatsEnLice: Action[],
      public candidatsRefuses: Action[]
    ) { }
}