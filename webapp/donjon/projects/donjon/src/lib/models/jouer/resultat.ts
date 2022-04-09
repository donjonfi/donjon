import { Choix } from "../compilateur/choix";
import { Instruction } from "../compilateur/instruction";
import { TypeInterruption } from "../jeu/interruption";

export class Resultat {

  constructor(
    public succes: boolean,
    public sortie: string,
    public nombre: number
  ) { };

  /** il faut arrêter l’exécution de l’action (après la règle) */
  public arreterApresRegle: boolean = false;
  /** il faut terminer l’action (avant la sortie de la règle) */
  public terminerAvantRegle: boolean = false;
  /** il faut terminer l’action (après la sortie de la règle) */
  public terminerApresRegle: boolean = false;
  /** il faut terminer l’action (avant la sortie de la règle générique) */
  public terminerAvantRegleGenerique: boolean = false;
  /** il faut terminer l’action (après la sortie de la règle générique) */
  public terminerApresRegleGenerique: boolean = false;

  /** le bloc d’instruction est interrompu (le temps que l’utilisateur fasse un choix ou appuie sur une touche) */
  public interrompreBlocInstruction: boolean = false;
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

}