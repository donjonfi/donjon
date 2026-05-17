import Rand, { PRNG } from 'rand-seed';

/** Instantané opaque de l'état du PRNG (graine + nombre de tirages déjà effectués). */
export interface AleatoireInstantane {
  graine: string;
  compteur: number;
}

export class AleatoireUtils {

  // https://github.com/michaeldzjap/rand-seed
  private static rand: Rand | undefined;
  private static graine: string | undefined;
  private static compteur = 0;

  public static init(seed: string) {
    this.graine = seed;
    this.rand = new Rand(seed, PRNG.mulberry32);
    this.compteur = 0;
  }

  /** Tirage interne qui incrémente le compteur. */
  private static tirer(): number {
    this.compteur++;
    return this.rand!.next();
  }

  /**
   * Obtenir un nombre aléatoire compris entre 0 et 1.
   * @returns un nombre décimal aléatoire compris entre 0 et 1 (inclus)
   */
  public static nombre(): number {
    if (!this.rand) {
      throw new Error("AleatoireUtils: le générateur n'a pas été initialisé.");
    }
    return AleatoireUtils.tirer();
  }

  /**
   * Obtenir un nombre entier aléatoire.
   * @returns un nombre aléatoire compris entre min et max (inclus)
   */
  public static nombreEntierPositif(min: number, max: number): number {
    if (!this.rand) {
      throw new Error("AleatoireUtils: le générateur n'a pas été initialisé.");
    }
    if(min > max){
      throw new Error("AleatoireUtils: nombreEntierPositif: min ne peut pas être plus grand que max.");
    }

    const ecart = max - min;
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(AleatoireUtils.tirer() * (ecart + 1)) + min;
  }

  /** Capture l'état courant (graine + nombre de tirages effectués). `undefined` si init n'a pas été appelé. */
  public static instantane(): AleatoireInstantane | undefined {
    if (this.graine === undefined) return undefined;
    return { graine: this.graine, compteur: this.compteur };
  }

  /** Restaure un état capturé par `instantane()`. Le PRNG produit alors la même suite à partir de ce point. */
  public static restaurer(snap: AleatoireInstantane): void {
    this.graine = snap.graine;
    this.rand = new Rand(snap.graine, PRNG.mulberry32);
    this.compteur = 0;
    while (this.compteur < snap.compteur) {
      this.rand.next();
      this.compteur++;
    }
  }

}
