import { ELocalisation, Localisation } from '../../../models/jeu/localisation';

import { ElementsJeuUtils } from '../../commun/elements-jeu-utils';
import { Jeu } from '../../../models/jeu/jeu';

/**
 * Cible pouvant être rendue cliquable dans la sortie du jeu (interface tactile).
 */
export interface CibleLien {
  /** Référence encodée dans le href du lien : `E<id objet>` ou `D-<localisation>`. */
  ref: string;
  /** Libellés reconnus dans le texte (du plus précis au moins précis). */
  libelles: string[];
}

/**
 * Enrichissement de la sortie du jeu avec des liens cliquables sur les objets
 * visibles et les sorties du lieu (interface tactile).
 */
export class LiensElementsUtils {

  /**
   * Construire la liste des cibles actuellement cliquables : objets visibles
   * (présents dans le lieu ou possédés) et sorties visibles du lieu.
   */
  public static construireCibles(jeu: Jeu, eju: ElementsJeuUtils): CibleLien[] {
    const cibles: CibleLien[] = [];

    // pas encore de joueur positionné (jeu pas encore généré/commencé)
    if (!jeu?.joueur?.position) {
      return cibles;
    }

    // mettre à jour la présence des objets afin de pouvoir tester leur visibilité
    eju.majPresenceDesObjets();

    // objets visibles (présents dans le lieu ou possédés par le joueur)
    jeu.objets.forEach(obj => {
      if (obj.id !== jeu.joueur.id && obj.intitule?.nom && jeu.etats.estVisible(obj, eju)) {
        const libelles: string[] = [];
        if (obj.intitule.epithete) {
          libelles.push(obj.intitule.nom + ' ' + obj.intitule.epithete);
        }
        libelles.push(obj.intitule.nom);
        cibles.push({ ref: 'E' + obj.id, libelles });
      }
    });

    // sorties visibles du lieu (directions)
    const curLieu = eju.curLieu;
    if (curLieu) {
      eju.getLieuxVoisinsVisibles(curLieu).forEach(voisin => {
        if (voisin.localisation !== ELocalisation.inconnu) {
          const localisation = Localisation.getLocalisation(voisin.localisation);
          cibles.push({ ref: 'D-' + voisin.localisation, libelles: [localisation.intitule.nom] });
        }
      });
    }

    return cibles;
  }

  /**
   * Entourer dans le HTML fourni les libellés des cibles d’un lien cliquable
   * `<a class="djn-lien-tactile" href="#<ref>">`.
   *
   * Seuls les segments de texte sont enrichis : l’intérieur des balises, des
   * liens `<a>` existants et des échos de commande (`<span class="t-commande">`)
   * est laissé intact. Les libellés les plus longs sont prioritaires
   * (« clé rouillée » avant « clé ») et chaque plage de texte n’est consommée
   * qu’une seule fois.
   */
  public static enrichirLiens(html: string, cibles: CibleLien[]): string {
    if (!html || !cibles.length || !html.length) {
      return html;
    }

    // libellés triés du plus long au plus court (priorité au plus précis)
    const entrees: { libelle: string, ref: string }[] = [];
    cibles.forEach(cible => {
      cible.libelles.forEach(libelle => {
        if (libelle?.trim().length) {
          entrees.push({ libelle: libelle.trim(), ref: cible.ref });
        }
      });
    });
    entrees.sort((a, b) => b.libelle.length - a.libelle.length);

    // découper le HTML en alternance texte / balise
    const morceaux = html.split(/(<[^>]*>)/);

    // balise dont l’intérieur ne doit pas être enrichi (lien existant ou écho de commande)
    let exclusionBalise: string | null = null;
    let exclusionProfondeur = 0;

    let retVal = '';
    for (let morceau of morceaux) {
      // balise HTML
      if (morceau.startsWith('<')) {
        const matchOuvrante = morceau.match(/^<([a-zA-Z][a-zA-Z0-9]*)/);
        const matchFermante = morceau.match(/^<\/([a-zA-Z][a-zA-Z0-9]*)/);
        if (exclusionBalise) {
          // suivre la profondeur pour retrouver la fermeture correspondante
          if (matchFermante && matchFermante[1].toLowerCase() === exclusionBalise) {
            exclusionProfondeur -= 1;
            if (exclusionProfondeur === 0) {
              exclusionBalise = null;
            }
          } else if (matchOuvrante && matchOuvrante[1].toLowerCase() === exclusionBalise && !morceau.endsWith('/>')) {
            exclusionProfondeur += 1;
          }
        } else if (matchOuvrante && !matchFermante) {
          const nomBalise = matchOuvrante[1].toLowerCase();
          if (nomBalise === 'a' || (nomBalise === 'span' && /class\s*=\s*"[^"]*\bt-commande\b/.test(morceau))) {
            exclusionBalise = nomBalise;
            exclusionProfondeur = 1;
          }
        }
        // segment de texte (hors zone exclue)
      } else if (!exclusionBalise && morceau.length) {
        morceau = LiensElementsUtils.remplacerLibelles(morceau, entrees);
      }
      retVal += morceau;
    }

    return retVal;
  }

  /** Entourer les libellés trouvés dans le texte d’un lien cliquable. */
  private static remplacerLibelles(texte: string, entrees: { libelle: string, ref: string }[]): string {
    const intervalles: { debut: number, fin: number, ref: string }[] = [];

    entrees.forEach(entree => {
      // frontières de mots compatibles avec les lettres accentuées (\b ne convient pas)
      // (le tiret est exclu pour ne pas matcher « nord » dans « nord-est »)
      const regExp = new RegExp(
        '(?<![\\p{L}\\p{N}-])' + LiensElementsUtils.echapperRegExp(entree.libelle) + '(?![\\p{L}\\p{N}-])',
        'giu');
      let match: RegExpExecArray | null;
      while ((match = regExp.exec(texte))) {
        const debut = match.index;
        const fin = debut + match[0].length;
        // ne pas chevaucher une plage déjà consommée par un libellé plus long
        if (!intervalles.some(x => debut < x.fin && fin > x.debut)) {
          intervalles.push({ debut, fin, ref: entree.ref });
        }
      }
    });

    if (!intervalles.length) {
      return texte;
    }

    intervalles.sort((a, b) => a.debut - b.debut);

    let retVal = '';
    let position = 0;
    intervalles.forEach(intervalle => {
      retVal += texte.slice(position, intervalle.debut)
        + '<a class="djn-lien-tactile" href="#' + intervalle.ref + '" role="button">'
        + texte.slice(intervalle.debut, intervalle.fin)
        + '</a>';
      position = intervalle.fin;
    });
    retVal += texte.slice(position);

    return retVal;
  }

  /** Échapper les caractères spéciaux d’une expression régulière. */
  private static echapperRegExp(texte: string): string {
    return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

}
