export class BlocOuvert {

  constructor(
    public type: ETypeBloc,
    public index: number,
  ) { }

}

/**
 * Type de bloc (si, choix)
 */
export enum ETypeBloc {
  /** Bloc « si » */
  si = 1,
  /** Bloc « choisir » */
  choisir = 2,
  /** Bloc « choix » */
  choix = 3,
}

/**
 * Type de bloc (si, choix)
 */
 export enum ETypeBlocPrincipal {
  aucun = 0,
  /** Bloc « action » */
  action = 1,
  /** Bloc « règle » */
  regle = 2,
}