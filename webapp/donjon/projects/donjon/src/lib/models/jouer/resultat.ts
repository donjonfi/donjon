import { Choix } from "../compilateur/choix";
import { Instruction } from "../compilateur/instruction";

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
  /** les choix possibles pour l’utilisateur */
  public choix: Choix[] | undefined;
  /** le reste des instructions pour quand on reprendra après l’interruption */
  public reste: Instruction[] | undefined;

}