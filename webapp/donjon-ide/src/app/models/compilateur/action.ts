import { ElementJeu } from '../jeu/element-jeu';
import { ElementsPhrase } from '../commun/elements-phrase';
import { GroupeNominal } from '../commun/groupe-nominal';
import { Instruction } from './instruction';
import { Lieu } from '../jeu/lieu';
import { Objet } from '../jeu/objet';
import { Verification } from './verification';

export class Action {

  constructor(
    public infinitif: string,
    public ceci: boolean,
    public cela: boolean,
    public cibleCeci: GroupeNominal = null,
    public cibleCela: GroupeNominal = null,
    public verificationsBrutes: string = null,
    public verifications: Verification[] = [],
    public instructionsBrutes: string = null,
    public instructions: Instruction[] = [],
    public instructionsFinalesBrutes: string = null,
    public instructionsFinales: Instruction[] = []
  ) { }

}

export class ActionCeciCela {

  constructor(
    public action: Action,
    public ceci: ElementJeu,
    public cela: ElementJeu
  ) { }
}
