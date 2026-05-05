import { xFois } from "../../models/jouer/statut-conditions";

/**
 * Catégorie d’un mot-clé de bloc conditionnel :
 *  - ouverture : démarre un nouveau cadre (si, Xe fois, au hasard, en boucle, initialement)
 *  - continuation : opère sur le cadre courant (sinon, sinonsi, ou, puis)
 *  - fermeture : ferme le cadre courant (fin, fin si, fin choix)
 *  - inconnu : autre balise (ex: propriété)
 */
export enum TypeMotCle {
  ouverture = 'ouverture',
  continuation = 'continuation',
  fermeture = 'fermeture',
  inconnu = 'inconnu',
}

export class PileConditionsUtils {

  /** Catégoriser un mot-clé de bloc condition. */
  public static categoriser(contenuBloc: string): TypeMotCle {
    const lc = contenuBloc.toLowerCase().trim();
    if (xFois.test(lc)) return TypeMotCle.ouverture;
    if (/^(au hasard|en boucle|initialement)$/.test(lc)) return TypeMotCle.ouverture;
    if (/^si\s/.test(lc)) return TypeMotCle.ouverture;
    if (/^(sinonsi|sinon si)\s/.test(lc)) return TypeMotCle.continuation;
    if (lc === 'sinon' || lc === 'ou' || lc === 'puis') return TypeMotCle.continuation;
    if (lc === 'fin' || lc === 'fin si' || lc === 'finsi' || lc === 'fin choix' || lc === 'finchoix') return TypeMotCle.fermeture;
    return TypeMotCle.inconnu;
  }

  /**
   * Parcourt les morceaux à partir du morceau d’ouverture pour compter les
   * choix du cadre courant ainsi que le plus grand `Xe fois` rencontré.
   * Les sous-blocs imbriqués sont ignorés via un compteur de profondeur.
   */
  public static compterChoixNiveauCourant(
    morceaux: string[],
    indexOuverture: number,
  ): { nbChoix: number; plusGrandFois: number } {
    let nbChoix = 1;
    let plusGrandFois = -1;
    let profondeur = 1; // on entre juste après le morceau d’ouverture

    // Les morceaux issus de split(/\[|\]/) alternent texte / contenuCrochet ;
    // on ne s’intéresse qu’aux contenus de crochets.
    for (let i = indexOuverture + 2; i < morceaux.length; i += 2) {
      const morceau = (morceaux[i] ?? '').toLowerCase().trim();
      const cat = PileConditionsUtils.categoriser(morceau);

      if (cat === TypeMotCle.ouverture) {
        if (profondeur === 1) {
          // un Xe fois au niveau courant compte comme un choix supplémentaire
          const m = morceau.match(xFois);
          if (m) {
            nbChoix++;
            const n = Number.parseInt(m[1], 10);
            if (n > plusGrandFois) plusGrandFois = n;
          }
        }
        profondeur++;
      } else if (cat === TypeMotCle.fermeture) {
        profondeur--;
        if (profondeur === 0) break;
      } else if (cat === TypeMotCle.continuation && profondeur === 1) {
        if (morceau === 'ou' || morceau === 'puis' || morceau === 'sinon' ||
            morceau.startsWith('sinonsi') || morceau.startsWith('sinon si')) {
          nbChoix++;
        }
      }
    }
    return { nbChoix, plusGrandFois };
  }
}
