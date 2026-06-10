/**
 * Horloge déterministe pour le replay.
 *
 * L'heure réelle (`new Date()`) est non déterministe : sans capture, une partie qui lit l'heure
 * (balises `[horloge]`/`[date]`… ou conditions `heure/minute/seconde`) ne se rejoue pas à
 * l'identique (restauration .sol, triche, magnéto). Comme la graine aléatoire (`AleatoireUtils`),
 * **chaque lecture est stockée** afin qu'au rejeu on retrouve l'heure de la sauvegarde plutôt que
 * l'heure réelle.
 *
 * Stockage **par étape** (cf. `EtapeEnregistrement.horloge` / `Sauvegarde.horlogesSauvegarde`) :
 * chaque étape porte la liste des lectures faites pendant son exécution. Avant de (re)jouer une
 * étape on charge ses lectures via `chargerRejeuEtape`, et `maintenant()` les consomme dans l'ordre.
 * Ce découpage par étape rend chaque étape autonome : avancer/reculer au magnéto relit simplement
 * les lectures de l'étape, sans curseur global à restaurer.
 */
export class HorlogeUtils {

  /**
   * Lectures (epoch ms) effectuées pendant l'étape **en cours d'exécution**, dans l'ordre.
   * Sert à reconstruire la sauvegarde (sortie). Prélevé/vidé à la finalisation de chaque étape.
   */
  private static lecturesEtapeCourante: number[] = [];

  /** Lectures stockées de l'étape **en cours de rejeu** (entrée). undefined hors rejeu. */
  private static lecturesRejeuEtape: number[] | undefined = undefined;
  private static curseur = 0;

  /** Vrai si une lecture a eu lieu sans valeur stockée disponible (nouvelle lecture pendant le rejeu). */
  private static _lectureManquante = false;

  /**
   * Toutes les valeurs (epoch ms) renvoyées depuis le dernier chargerRejeuEtape, **conservées**
   * même après preleverLecturesEtape. Sert au magnéto à proposer les valeurs (réelles ou stockées)
   * d'une étape lors d'une saisie d'heure (lecture manquante / édition).
   */
  private static serieEtape: number[] = [];

  /** Réinitialise tout (nouveau jeu). */
  public static reinitialiser(): void {
    this.lecturesEtapeCourante = [];
    this.lecturesRejeuEtape = undefined;
    this.curseur = 0;
    this._lectureManquante = false;
    this.serieEtape = [];
  }

  /**
   * Retourne l'heure courante. En mode rejeu, consomme la prochaine lecture stockée ; sinon
   * (live, ou rejeu épuisé) utilise l'heure réelle et marque une lecture manquante. La valeur
   * retournée est toujours ajoutée à `lecturesEtapeCourante` (pour reconstruire la sauvegarde).
   */
  public static maintenant(): Date {
    let ts: number;
    if (this.lecturesRejeuEtape !== undefined && this.curseur < this.lecturesRejeuEtape.length) {
      ts = this.lecturesRejeuEtape[this.curseur++];
    } else {
      ts = Date.now();
      if (this.lecturesRejeuEtape !== undefined) {
        // En rejeu mais plus de valeur stockée : lecture nouvelle (instruction insérée, etc.).
        this._lectureManquante = true;
      }
    }
    this.lecturesEtapeCourante.push(ts);
    this.serieEtape.push(ts);
    return new Date(ts);
  }

  /**
   * Prépare le rejeu d'une étape : charge ses lectures stockées (entrée) et remet le curseur,
   * le drapeau de lecture manquante et les buffers à zéro.
   */
  public static chargerRejeuEtape(lectures: number[] | null | undefined): void {
    this.lecturesRejeuEtape = lectures ? lectures.slice() : [];
    this.curseur = 0;
    this._lectureManquante = false;
    this.lecturesEtapeCourante = [];
    this.serieEtape = [];
  }

  /** Toutes les valeurs (epoch ms) lues pendant l'étape en cours (stockées + comblées en réel). */
  public static lecturesUtiliseesEtape(): number[] {
    return this.serieEtape.slice();
  }

  /** Termine le rejeu : retour au mode live (les lectures utilisent l'heure réelle). */
  public static terminerRejeu(): void {
    this.lecturesRejeuEtape = undefined;
    this.curseur = 0;
    this._lectureManquante = false;
  }

  /**
   * Retourne les lectures accumulées depuis le dernier prélèvement et vide le buffer.
   * Appelé à la finalisation d'une étape pour les attacher à celle-ci.
   */
  public static preleverLecturesEtape(): number[] {
    const lectures = this.lecturesEtapeCourante;
    this.lecturesEtapeCourante = [];
    return lectures;
  }

  /** Une lecture a-t-elle eu lieu pendant le rejeu sans valeur stockée disponible ? */
  public static get aLectureManquante(): boolean {
    return this._lectureManquante;
  }
}
