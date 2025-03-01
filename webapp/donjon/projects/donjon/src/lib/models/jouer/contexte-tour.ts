import { Choix } from "../compilateur/choix";
import { ChoixEcran } from "./contexte-ecran";
import { ConditionSolo } from "../compilateur/condition-solo";
import { ContexteCommande } from "./contexte-commande";
import { ElementsPhrase } from "../commun/elements-phrase";
import { Instruction } from "../compilateur/instruction";
import { Intitule } from "../jeu/intitule";
import { Lieu } from "../jeu/lieu";
import { Liste } from "../jeu/liste";
import { Localisation } from "../jeu/localisation";
import { RechercheUtils } from "../../utils/commun/recherche-utils";
import { Resultat } from "./resultat";
import { TypeInterruption } from "../jeu/interruption";
import { Valeur } from "../jeu/valeur";

export class ContexteTour {

  // erreurs
  private _erreurs: string[] = [];

  // dernière instruction exécutée (pour debogage)
  public derniereInstruction: Instruction | undefined;

  public phase: PhaseTour;

  public commande: ContexteCommande;

  public resultatRegleApres: Resultat | undefined;

  /** Le type d’interruption (quand le bloc d’instruction est interrompu) */
  public typeInterruption: TypeInterruption | undefined;
  /** le reste des instructions pour quand on reprendra après l’interruption */
  public reste: Instruction[] | undefined;
  /** les choix possibles pour l’utilisateur (interruption choix) */
  public choix: Choix[] | undefined;
  /** le message à afficher à l’utilisateur (interruption attendre) */
  public messageAttendre: string | undefined;
  /** le nombre de secondes à attendre (interruption attendre) */
  public nbSecondesAttendre: number | undefined;
  /** le nombre de tours à annuler (interruption annuler tour) */
  public nbToursAnnuler: number | undefined;
  /** écran à afficher (interruption changer écran) */
  public ecran: ChoixEcran | undefined;

  /** déplacement du joueur pour ce tour : origine */
  public origine: Lieu;
  /** déplacement du joueur pour ce tour : destination */
  public destination: Lieu;
  /** déplacement du joueur pour ce tour : orientation */
  public orientation: Localisation;

  /** réponse du joueur au dernier choisir */
  public reponse: Valeur;

  /**
   * Valeurs du tour.
   */
  private valeurs = new Map<string, Valeur>();

  /**
   * Liste de valeurs du tour.
   */
  private listes = new Map<string, Liste>();

  public elementsMentionnes: number[] = [];

  constructor(
    /** Ceci */
    public ceci: Intitule | undefined,
    /** Cela */
    public cela: Intitule | undefined,
  ) {

    // C’est le début du tour
    this.phase = PhaseTour.debut;
  }

  // ceci/cela

  // çà

  // celle/celles/celui/ceux-ci/là

  // réponses (dernière, avant-dernière, préantépénultième)

  get erreurs(): readonly string[] {
    return this._erreurs;
  }

  ajouterErreurDerniereInstruction(erreur: string) {
    console.error(erreur, "\ninstruction: ", this.derniereInstruction);
    this._erreurs.push(erreur);
  }

  ajouterErreurInstruction(instruction: ElementsPhrase | undefined, erreur: string) {
    if (instruction) {
      console.error(erreur, "\ninstruction: ", instruction);
    } else {
      console.error(erreur);
    }
    this._erreurs.push(erreur);
  }

  ajouterErreurCondition(condition: ConditionSolo | undefined, erreur: string) {
    if (condition) {
      console.error(erreur, "\ncondition: ", condition);
    } else {
      console.error(erreur);
    }
    this._erreurs.push(erreur);
  }

  /**
   * Ajouter une valeur au tour de jeu.
   * @param intituleValeur 
   * @param valeur 
   */
  ajouterValeur(intituleValeur: string, valeur: Valeur): void {
    const intituleNettoye = RechercheUtils.nettoyerEtRetirerDeterminants(intituleValeur);
    this.valeurs.set(intituleNettoye, valeur);
  }

  /**
   * Retrouver une valeur du tour de jeu.
   * @param intituleValeur 
   * @returns 
   */
  trouverValeur(intituleValeur: string): Valeur | undefined {
    const intituleNettoye = RechercheUtils.nettoyerEtRetirerDeterminants(intituleValeur);
    return this.valeurs.get(intituleNettoye);
  }

}

/** Les différentes phases d’un tour (début, avant, vérifier, exécuter, terminer, après, fin) */
export enum PhaseTour {
  debut = 0,
  avant = 1,
  avant_interrompu = 2, // prochain: refuser sauf si on arrête dans la dernière partie de la règle avant
  prerequis = 3,
  execution = 4,
  apres = 5,
  apres_interrompu = 6, // prochain: fin sauf si on continue dans la dernière partie de la règle après
  apres_a_traiter_apres_terminer = 7,
  epilogue = 8,
  terminer_avant_traiter_apres = 9,
  continuer_apres = 10,
  continuer_apres_interrompu = 11,
  fin = 12,
}
