import { Classe } from '../../../models/commun/classe';
import { ClasseUtils } from '../../commun/classe-utils';
import { ElementJeu } from '../../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../../commun/elements-jeu-utils';
import { GroupeNominal } from '../../../models/commun/groupe-nominal';
import { Jeu } from '../../../models/jeu/jeu';
import { RegleActionsTactiles, TypeListeActionsTactiles } from '../../../models/jeu/regle-actions-tactiles';

/**
 * Résolution des actions principales/secondaires proposées par l’interface
 * tactile pour un élément du jeu, sur base des règles déclarées (défauts du
 * fichier actions.djn + déclarations de l’auteur + instructions exécutées en
 * cours de partie).
 *
 * Héritage : la règle la plus précise gagne — élément précis, puis classe de
 * l’élément, puis classes parentes. Au niveau le plus précis disposant d’un
 * « remplacer », la dernière règle déclarée fournit la liste de base (l’auteur,
 * analysé après actions.djn, écrase donc les défauts) ; les règles « ajouter »
 * des niveaux plus précis ou égaux s’y accumulent.
 *
 * La résolution est recalculée à chaque appel (pas de cache) : une instruction
 * modifiant la liste d’une classe en cours de partie se reflète aussitôt sur
 * tous les éléments qui en héritent.
 */
export class ActionsTactilesUtils {

  /**
   * Infinitifs des actions de la liste spécifiée pour l’élément spécifié,
   * dans l’ordre de déclaration (base puis ajouts), sans doublon.
   */
  public static resoudre(element: ElementJeu, typeListe: TypeListeActionsTactiles, jeu: Jeu, eju?: ElementsJeuUtils): string[] {
    return ActionsTactilesUtils.resoudreInterne(element, element.classe, typeListe, jeu, eju);
  }

  /**
   * Infinitifs des actions de la liste spécifiée pour une classe (sans élément
   * précis) — utilisé pour les directions (« les actions principales pour les
   * directions sont … »), qui ne sont pas des éléments du jeu.
   */
  public static resoudrePourClasse(classe: Classe, typeListe: TypeListeActionsTactiles, jeu: Jeu): string[] {
    return ActionsTactilesUtils.resoudreInterne(null, classe, typeListe, jeu, undefined);
  }

  private static resoudreInterne(element: ElementJeu | null, classeDepart: Classe, typeListe: TypeListeActionsTactiles, jeu: Jeu, eju: ElementsJeuUtils | undefined): string[] {
    // chaîne d’héritage : classe de l’élément puis classes parentes
    const chaineClasses: Classe[] = [];
    for (let classe = classeDepart; classe; classe = classe.parent) {
      chaineClasses.push(classe);
    }

    // règles applicables à l’élément, annotées de leur niveau de précision
    // (-1 : élément précis, sinon index dans la chaîne d’héritage)
    const applicables: { regle: RegleActionsTactiles, niveau: number, ordre: number }[] = [];
    (jeu.actionsTactiles ?? []).forEach((regle, ordre) => {
      if (regle.typeListe !== typeListe) {
        return;
      }
      const niveau = ActionsTactilesUtils.niveauCible(element, chaineClasses, regle.cible, jeu, eju);
      if (niveau !== null) {
        applicables.push({ regle, niveau, ordre });
      }
    });

    // base : au niveau le plus précis ayant un « remplacer », la dernière règle déclarée
    const remplacements = applicables.filter(x => x.regle.mode === 'remplacer');
    let niveauBase = Number.MAX_SAFE_INTEGER;
    let ordreBase = -1;
    let base: string[] = [];
    if (remplacements.length) {
      niveauBase = Math.min(...remplacements.map(x => x.niveau));
      const regleBase = remplacements.filter(x => x.niveau === niveauBase).pop();
      base = regleBase.regle.infinitifs;
      ordreBase = regleBase.ordre;
    }

    // ajouts : règles « ajouter » des niveaux plus précis que la base — au même
    // niveau, seuls les ajouts déclarés après le « remplacer » s'appliquent (il
    // remet la liste à zéro pour son niveau) ; appliqués du moins précis au
    // plus précis (ordre de déclaration à niveau égal)
    const ajouts = applicables
      .filter(x => x.regle.mode === 'ajouter'
        && (x.niveau < niveauBase || (x.niveau === niveauBase && x.ordre > ordreBase)))
      .sort((a, b) => (b.niveau - a.niveau) || (a.ordre - b.ordre));

    const infinitifs: string[] = [];
    [base, ...ajouts.map(x => x.regle.infinitifs)].forEach(liste => {
      liste.forEach(infinitif => {
        if (!infinitifs.includes(infinitif)) {
          infinitifs.push(infinitif);
        }
      });
    });
    return infinitifs;
  }

  /**
   * Actions principales et secondaires de l’élément : un infinitif déjà
   * principal est retiré des secondaires.
   */
  public static resoudreToutes(element: ElementJeu, jeu: Jeu, eju?: ElementsJeuUtils): { principales: string[], secondaires: string[] } {
    const principales = ActionsTactilesUtils.resoudre(element, 'principales', jeu, eju);
    const secondaires = ActionsTactilesUtils.resoudre(element, 'secondaires', jeu, eju)
      .filter(infinitif => !principales.includes(infinitif));
    return { principales, secondaires };
  }

  /** Actions principales et secondaires d’une classe (sans élément précis). */
  public static resoudreToutesPourClasse(classe: Classe, jeu: Jeu): { principales: string[], secondaires: string[] } {
    const principales = ActionsTactilesUtils.resoudrePourClasse(classe, 'principales', jeu);
    const secondaires = ActionsTactilesUtils.resoudrePourClasse(classe, 'secondaires', jeu)
      .filter(infinitif => !principales.includes(infinitif));
    return { principales, secondaires };
  }

  /**
   * Niveau de précision auquel la cible d’une règle s’applique à l’élément :
   * -1 si elle désigne l’élément lui-même, index de la classe correspondante
   * dans la chaîne d’héritage (− 0,5 si la cible précise un état — « les
   * objets ouvrables » est plus précis que « les objets »), sinon null
   * (règle non applicable).
   */
  private static niveauCible(element: ElementJeu | null, chaineClasses: Classe[], cible: GroupeNominal, jeu: Jeu, eju: ElementsJeuUtils | undefined): number | null {
    if (!cible?.nom) {
      return null;
    }
    // A. élément précis (même nom et même épithète)
    if (element?.intitule?.nom?.toLowerCase() === cible.nom.toLowerCase()
      && (element.intitule.epithete?.toLowerCase() ?? null) === (cible.epithete?.toLowerCase() ?? null)) {
      return -1;
    }
    // B. classe d’éléments (« les objets », « les personnes », … — pluriel accepté),
    //    éventuellement restreinte à un état (« les objets ouvrables »)
    const nomClasse = ClasseUtils.getIntituleNormalise(cible.nom);
    const index = chaineClasses.findIndex(classe => classe.nom === nomClasse || classe.intitule === cible.nom);
    if (index === -1) {
      return null;
    }
    if (cible.epithete) {
      // la règle ne s’applique que si l’élément possède l’état (accords gérés par trouverEtat)
      if (!element || !eju || !jeu.etats.possedeEtatElement(element, cible.epithete, eju)) {
        return null;
      }
      return index - 0.5;
    }
    return index;
  }

}
