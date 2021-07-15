
export class ConditionUtils {

  /**
   * Vérifier si les couples de parenthèses de la conditions sont valides.
   */
  public static parenthesesValides(condition: string): boolean {
    let total = 0;
    if (condition) {
      for (let index = 0; index < condition.length; index++) {
        const char = condition[index];
        if (char == '(') {
          total += 1;
        } else if (char == ')') {
          total -= 1;
        }
        if (total < 0) {
          break;
        }
      }
    }
    return (total == 0);
  }

  

  

}