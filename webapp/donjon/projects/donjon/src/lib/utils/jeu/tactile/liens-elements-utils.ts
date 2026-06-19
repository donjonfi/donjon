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
   * Libellés sous lesquels les sorties non cardinales sont affichées dans la
   * sortie du jeu (cf. instruction-dire : « monter : Grenier », …).
   */
  private static readonly LIBELLES_VERBES_SORTIES: { [localisation: string]: string[] } = {
    [ELocalisation.haut]: ['monter'],
    [ELocalisation.bas]: ['descendre'],
    [ELocalisation.interieur]: ['entrer'],
    [ELocalisation.exterieur]: ['sortir'],
  };

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
        const nom = obj.intitule.nom;
        if (obj.intitule.epithete) {
          libelles.push(nom + ' ' + obj.intitule.epithete);
        }
        libelles.push(nom);
        // nom composé (« porte du bureau ») : exposer aussi le nom de tête (« porte »).
        // Le moteur désambiguïse « porte » vers tous les objets concernés ; sans ce
        // libellé nu, « porte » dans un texte ne pointerait que vers la porte dont le
        // nom est simplement « porte » (épithète à part), pas vers les noms composés.
        const nomTete = nom.split(/\s+/)[0];
        if (nomTete && nomTete !== nom) {
          libelles.push(nomTete);
        }
        cibles.push({ ref: 'E' + obj.id, libelles });
      }
    });

    // mot « inventaire » : lien qui exécute la commande inventaire
    cibles.push({ ref: 'CMD-inventaire', libelles: ['inventaire'] });

    // sorties visibles du lieu (directions)
    const curLieu = eju.curLieu;
    if (curLieu) {
      eju.getLieuxVoisinsVisibles(curLieu).forEach(voisin => {
        if (voisin.localisation !== ELocalisation.inconnu) {
          const localisation = Localisation.getLocalisation(voisin.localisation);
          // sorties non cardinales : reconnaître aussi le verbe affiché (« monter », …)
          const libelles = [
            localisation.intitule.nom,
            ...(LiensElementsUtils.LIBELLES_VERBES_SORTIES[voisin.localisation] ?? []),
          ];
          cibles.push({ ref: 'D-' + voisin.localisation, libelles });
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
   * liens `<a>` existants et des échos de commande (`<span class="t-commande">`,
   * issus de `{-…-}`) est laissé intact — on ne veut pas de lien dans le texte
   * d’une commande tapée. Les libellés les plus longs sont prioritaires
   * (« clé rouillée » avant « clé ») et chaque plage de texte n’est consommée
   * qu’une seule fois.
   */
  public static enrichirLiens(html: string, cibles: CibleLien[]): string {
    if (!html || !html.length) {
      return html;
    }

    // Liens « annotés » par une mention dans le texte de l’auteur (`mot[@nom]`, `[#nom]`, `[&nom]`) :
    //  le moteur a résolu l’élément et laissé un marqueur `@@lien:<id>@@`. On rend le MOT QUI PRÉCÈDE
    //  cliquable. Fait AVANT l’enrichissement générique (le mot, déjà dans un <a>, ne sera pas re-traité).
    html = LiensElementsUtils.appliquerLiensMentions(html);

    if (!cibles.length) {
      return html;
    }

    // regrouper les refs par libellé : un même libellé (« porte ») peut désigner
    // plusieurs objets → on proposera un choix plutôt que d’en deviner un seul.
    const parLibelle = new Map<string, { libelle: string, refs: string[] }>();
    cibles.forEach(cible => {
      cible.libelles.forEach(libelle => {
        const valeur = libelle?.trim();
        if (!valeur?.length) {
          return;
        }
        const cle = valeur.toLowerCase();
        let entree = parLibelle.get(cle);
        if (!entree) {
          entree = { libelle: valeur, refs: [] };
          parLibelle.set(cle, entree);
        }
        if (!entree.refs.includes(cible.ref)) {
          entree.refs.push(cible.ref);
        }
      });
    });
    // libellés triés du plus long au plus court (priorité au plus précis)
    const entrees = Array.from(parLibelle.values());
    entrees.sort((a, b) => b.libelle.length - a.libelle.length);

    // découper le HTML en alternance texte / balise
    const morceaux = html.split(/(<[^>]*>)/);

    // balise dont l’intérieur ne doit pas être enrichi (lien existant)
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
          // lien existant, ou écho de commande (`<span class="t-commande">`) :
          // on n’enrichit pas l’intérieur (pas de lien dans une commande tapée)
          if (nomBalise === 'a'
            || (nomBalise === 'span' && /\bclass\s*=\s*["'][^"']*\bt-commande\b/.test(morceau))) {
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

  /**
   * Marqueur de lien tactile « annoté » laissé par le moteur (cf. instruction-dire-format) :
   * `mot@@lien:<id>@@`. Le groupe optionnel capture le mot qui précède immédiatement le marqueur
   * (lettres/chiffres accentués, apostrophe, trait d’union) — c’est lui qui devient cliquable.
   */
  private static readonly REGEX_MARQUEUR_LIEN = /([\p{L}\p{N}'’-]+)?@@lien:(\d+)@@/gu;

  /**
   * Transformer les marqueurs de mention `mot@@lien:<id>@@` en lien tactile sur le MOT qui précède
   * (« fruit@@lien:5@@ » → « <a href="#E5">fruit</a> »). Sans mot précédent (début de texte ou
   * juste après une balise, ex. `</span>@@lien:5@@`), le marqueur est simplement retiré.
   *
   * Public car appelé seul (sans enrichissement générique) quand le tactile est momentanément
   * désactivé : comme les autres liens, le `<a>` est créé mais rendu invisible/inerte par le CSS
   * tant que `.tactile-actif` est absent — la bascule clavier ⇄ tactile le révèle sans re-rendu.
   */
  public static appliquerLiensMentions(html: string): string {
    if (!html || !html.includes('@@lien:')) {
      return html;
    }
    return html.replace(LiensElementsUtils.REGEX_MARQUEUR_LIEN, (_m, mot, id) =>
      mot
        ? '<a class="djn-lien-tactile" href="#E' + id + '" role="button">' + mot + '</a>'
        : '');
  }

  /** Entourer les libellés trouvés dans le texte d’un lien cliquable. */
  private static remplacerLibelles(texte: string, entrees: { libelle: string, refs: string[] }[]): string {
    const intervalles: { debut: number, fin: number, refs: string[] }[] = [];

    entrees.forEach(entree => {
      const regExp = LiensElementsUtils.regExpLibelle(entree.libelle);
      let match: RegExpExecArray | null;
      while ((match = regExp.exec(texte))) {
        const debut = match.index;
        const fin = debut + match[0].length;
        // ne pas chevaucher une plage déjà consommée par un libellé plus long
        if (!intervalles.some(x => debut < x.fin && fin > x.debut)) {
          intervalles.push({ debut, fin, refs: entree.refs });
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
        + '<a class="djn-lien-tactile" href="#' + LiensElementsUtils.refLien(intervalle.refs) + '" role="button">'
        + texte.slice(intervalle.debut, intervalle.fin)
        + '</a>';
      position = intervalle.fin;
    });
    retVal += texte.slice(position);

    return retVal;
  }

  /**
   * Expression régulière de détection d’un libellé dans le texte. Frontières de
   * mots compatibles avec les lettres accentuées (`\b` ne convient pas) ; le
   * tiret est exclu pour ne pas matcher « nord » dans « nord-est ».
   *
   * Cas particulier « est » : homographe (direction « l’est » vs verbe « être »).
   * On ne le rend cliquable que s’il est précédé de « l’ » / « l' » (déterminant)
   * ou de « - » suivi d’une espace (puce de la liste des sorties) — sinon c’est
   * le verbe conjugué, qu’il ne faut pas transformer en lien.
   */
  private static regExpLibelle(libelle: string): RegExp {
    if (libelle.toLowerCase() === 'est') {
      return /(?<=l['’]|-\s)est(?![\p{L}\p{N}-])/giu;
    }
    return new RegExp(
      '(?<![\\p{L}\\p{N}-])' + LiensElementsUtils.echapperRegExp(libelle) + '(?![\\p{L}\\p{N}-])',
      'giu');
  }

  /**
   * Référence du lien pour une plage de texte : la ref unique si le libellé ne
   * désigne qu’une cible, sinon un lien de désambiguïsation `AMBIG-<id>-<id>…`
   * listant les objets candidats (on propose le choix plutôt que de deviner).
   */
  private static refLien(refs: string[]): string {
    if (refs.length === 1) {
      return refs[0];
    }
    const ids = refs.filter(ref => /^E\d+$/.test(ref)).map(ref => ref.slice(1));
    return ids.length > 1 ? 'AMBIG-' + ids.join('-') : refs[0];
  }

  /** Échapper les caractères spéciaux d’une expression régulière. */
  private static echapperRegExp(texte: string): string {
    return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

}
