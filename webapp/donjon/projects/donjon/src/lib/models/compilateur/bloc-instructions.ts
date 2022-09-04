export class BlocInstructions {

  public static typeChoisirToString(type: TypeChoisir): string {
    switch (type) {
      case TypeChoisir.dynamique:
        return 'dynamique';
      case TypeChoisir.statique:
        return 'statique';
      case TypeChoisir.libre:
        return 'libre';
      default:
        return 'inconnu';
    }
  }
}

export enum EtiquetteSi {
  /** si */
  si = 1,
  sinon = 2,
  sinonsi = 3,
}

export enum TypeChoisir {
  statique = 1,
  dynamique = 2,
  libre = 3,
}
