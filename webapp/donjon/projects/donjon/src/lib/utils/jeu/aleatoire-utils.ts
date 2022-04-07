import Rand, { PRNG } from 'rand-seed';

export class AleatoireUtils {

  // https://github.com/michaeldzjap/rand-seed
  private static rand: Rand | undefined;

  public static init(seed: string) {
    this.rand = new Rand(seed, PRNG.mulberry32);
  }

  public static nombre(): number {
    if(!this.rand){
      throw new Error("AleatoireUtils: le générateur n'a pas été initialisé.");
    }
    return this.rand.next();
  }

}