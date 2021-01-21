
// Xe fois
export const xFois = /^([1-9][0-9]?)(?:e|eme|ème|ere|ère|re) fois$/i;

export enum ConditionDebutee {
  aucune = 'aucune',
  si = 'si',
  hasard = 'hasard',
  boucle = 'boucle',
  fois = 'fois',
  initialement = 'initialement',
}

export class StatutCondition {

  public conditionDebutee = ConditionDebutee.aucune;
  public choixAuHasard = -1;
  public dernIndexChoix = -1;
  public plusGrandChoix = -1;
  public nbChoix = -1;
  public siVrai = false;

  constructor(
    public nbAffichage: number,
    public initial: boolean,
    public morceaux: string[],
    public curMorceauIndex: number,

  ) { }

}
