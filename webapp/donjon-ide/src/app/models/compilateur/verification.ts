import { Condition } from './condition';
import { ElementsPhrase } from '../commun/elements-phrase';

export class Verification {

  constructor(

    public conditions: Condition[],
    public resultats: ElementsPhrase[]
  ) { }

}
