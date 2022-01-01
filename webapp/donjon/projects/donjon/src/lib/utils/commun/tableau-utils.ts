export class TableauUtils {
  public static listerTableau(tableau: Array<unknown>): string {
    let retVal: string;

    if (tableau) {
      if (tableau.length) {
        retVal = "";
        for (let index = 0; index < tableau.length; index++) {
          retVal += tableau[index];
          if (index == tableau.length - 2) {
            retVal += " et ";
          } else if (index == tableau.length - 1) {
            retVal += "."
          } else {
            retVal += ", "
          }
        }
      } else {
        retVal = "(vide)";
      }
    } else {
      retVal = "(non défini)";
    }
    return retVal;
  }
}