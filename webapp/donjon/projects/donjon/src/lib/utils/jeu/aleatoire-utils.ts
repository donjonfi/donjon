import Rand, { PRNG } from 'rand-seed';

export class AleatoireUtils {

  // https://github.com/michaeldzjap/rand-seed
  private static rand: Rand | undefined;

  public static init(seed: string) {
    this.rand = new Rand(seed, PRNG.mulberry32);
  }

  /**
   * Obtenir un nombre aléatoire compris entre 0 et 1.
   * @returns un nombre décimal aléatoire compris entre 0 et 1 (inclus)
   */
  public static nombre(): number {
    if (!this.rand) {
      throw new Error("AleatoireUtils: le générateur n'a pas été initialisé.");
    }
    return this.rand.next();
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
    return Math.floor(this.rand.next() * (ecart + 1)) + min;
  }

}