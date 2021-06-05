import { Action } from "../compilateur/action";

export class ResultatChercherCandidats {

    constructor(
      public verbeConnu: boolean,
      public candidatsEnLice: Action[],
      public candidatsRefuses: Action[]
    ) { }
}