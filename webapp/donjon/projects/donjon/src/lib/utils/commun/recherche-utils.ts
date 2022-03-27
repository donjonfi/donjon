
export class RechercheUtils {

  /**
   * Mettre l’ensemble de l’expression en minuscules.
   */
  public static transformerMajuscules(expression: string) {
    if (expression) {
      return expression.toLocaleLowerCase();
    } else {
      return "";
    }
  }

  /**
   * Remplacer les lettres minuscules avec accents, cédilles et ligatures par leur
   * équivalent simplifié.
   * @argument expressionEnMinuscules expression déjà converties en minuscules :
   * les lettres majuscules ne seront pas transformées.
   */
  public static transformerCaracteresSpeciaux(expressionEnMinuscules: string): string {
    let retVal: string = "";
    if (expressionEnMinuscules) {
      retVal = expressionEnMinuscules
        // transformer caractères spéciaux
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae')
        .replace(/(é|è|ê|ë)/g, 'e')
        .replace(/ï/g, 'i')
        .replace(/(à|ä)/g, 'a')
        .replace(/ç/g, 'c');
    }
    return retVal;
  }

  /**
   * Remplacer les lettres avec accents, cédilles et ligatures par leur
   * équivalent simplifié. Les majuscules sont transformées en minuscules.
   */
  public static transformerCaracteresSpeciauxEtMajuscules(expression: string): string {
    return this.transformerCaracteresSpeciaux(this.transformerMajuscules(expression));
  }

  /** 
   * L’expression est nettoyée et transformée en mots clés :
   *   - on transforme les majuscules en minuscules
   *   - on transforme les caractères spéciaux (accents, cédilles, ligatures) en leur équivalent simplifié
   *   - on retire les mots trops communs (déterminants, prépositions, …)
   *   - on retourne les mots restants sous la forme d’une liste.
   * @argument expression expression déjà converties en minuscules :
   * les mots trop commun contenants des majuscules ne seront pas retirés.
   */
  public static nettoyerEtTransformerEnMotsCles(expression: string): string[] {
    let motsClesConserves: string[] = [];
    if (expression) {
      const expressionNettoyee = this.transformerCaracteresSpeciauxEtMajuscules(expression);
      motsClesConserves = this.transformerEnMotsCles(expressionNettoyee);
    }
    return motsClesConserves;
  }

  /** 
   * L’expression est transformée en mots clés : on retire les 
   * mots trops communs (déterminants, prépositions, …) et on retourne
   * les mots restants sous la forme d’une liste.
   * @argument expressionEnMinuscules expression déjà converties en minuscules :
   * les mots trop commun contenants des majuscules ne seront pas retirés.
   */
  public static transformerEnMotsCles(expressionEnMinuscules: string): string[] {
    let motsClesConserves: string[] = [];
    if (expressionEnMinuscules) {
      const motsCles = expressionEnMinuscules.split(/ |'|’|-/);
      motsCles.forEach(motCle => {
        if (!this.motsTropCommuns.test(motCle)) {
          motsClesConserves.push(motCle);
        }
      });
    }
    return motsClesConserves;
  }

  public static readonly motsTropCommuns = /^(le|la|les|l|un|une|du|de|des|d|n|s|a|à|au|aux|et|ou|où|mais|avec|dans|sur|sous|vers)$/

  /**
   * Retourne un nombre décimal compris entre 0.0 et 1.0 correspondant au pourcentage de correspondance
   * des mots clés.
   * 
   * Score:
   *  - 1.0 : correspondance exacte
   *  - 0.75 : correspondance proche
   *  - 0.5 : correspondance exacte partielle
   *  - 0.375: correspondance proche partielle
   */
  public static correspondanceMotsCles(recherche: string[], candidat: string[]): number {
    let score = 0.0;
    // même nombre de mots clés
    if (recherche.length <= candidat.length) {

      let nbEgal = 0;
      let nbRessemblant = 0;
      let nbDifferent = 0;

      // on teste chaque mot dans le même ordre.
      // (si les mots sont inversés, on considère qu’ils sont différents.)

      for (let indexMotCle = 0; indexMotCle < recherche.length; indexMotCle++) {
        switch (RechercheUtils.ressemblanceMots(recherche[indexMotCle], candidat[indexMotCle])) {
          case ERessemblance.egaux:
            nbEgal++;
            break;

          case ERessemblance.ressemblants:
            nbRessemblant++;
            break

          case ERessemblance.differents:
            nbDifferent++;
            break;
        }
      }

      // s’il y a au moins un mot qui ne ressemble pas > on ne prend pas
      if (nbDifferent > 0) {
        score = 0.0;
        // sinon calculer la moyenne
      } else {
        score = ((nbEgal * 1.0) / candidat.length) + ((nbRessemblant * 0.75) / candidat.length);
      }

      // si la recherche est plus courte que le mot, on divise le résultat par 2
      if (recherche.length > candidat.length) {
        score *= 0.5;
      }

      // recherche plus longue que candidat => on prend pas
    } else {
      score = 0.0;
    }

    // TODO: enlever by pass quand moins de mots dans la recherche
    if (score < 0.75) {
      score = 0.0;
    }

    return score;
  }

  /**
   * Retourne la ressemblance entre les 2 mots parmi "égaux", "ressemblants" ou "différents"
   * Le calcul s’arrête à 2 différences : ils sont alors considérés comme 2 mots différents.
   * Si les mots font moins de 5 caractères la distance vaudra soit "égaux" soit "différents".
   */
  public static ressemblanceMots(motA: string, motB: string): ERessemblance {
    const tailleMinimum = 5;

    if (motA.length < tailleMinimum || motB.length < tailleMinimum) {
      return motA == motB ? ERessemblance.egaux : ERessemblance.differents;
    }

    // mot A plus long de 1 caractère
    if (motA.length - motB.length == 1) {
      return this.ressemblanceMotsLettreEnPlus(motA, motB);
      // mot B plus long de 1 caractère
    } else if (motB.length - motA.length == 1) {
      return this.ressemblanceMotsLettreEnPlus(motB, motA);
      // mots de même taile
    } else if (motA.length == motB.length) {
      return this.ressemblanceMotsMemeTaille(motA, motB);
      // taille différente de plus de 1 caractère
    } else {
      return ERessemblance.differents;
    }
  }

  /**
   * Est-ce qu’en ajoutant la lettre manquante dans le mot le plus court, les mots
   * sont alors identiques et donc ils se ressemblent ou bien est-ce que les mots
   * sont différents.
   */
  private static ressemblanceMotsLettreEnPlus(motLong: string, motCourt: string): ERessemblance {
    for (let indexMot = 0; indexMot < motCourt.length; indexMot++) {
      // si la lettre est différente
      if (motCourt[indexMot] != motLong[indexMot]) {
        // avancer à la lettre suivante dans le mot long et vérifier si la suite est identique (=> 1 LETTRE MANQUANTE)
        if (this.estFinIdentique(motLong, indexMot + 1, motCourt, indexMot)) {
          return ERessemblance.ressemblants;
        } else {
          return ERessemblance.differents;
        }
      }
    }
    // c’est la dernière lettre qui change
    return ERessemblance.ressemblants;
  }

  /**
   * Est-ce que les 2 mots de même taille sont identiques, ressemblants (c’est à dire maximum
   * 1 différence entre les 2 mots) ou bien différents.
   */
  private static ressemblanceMotsMemeTaille(motA: string, motB: string) {
    for (let indexMot = 0; indexMot < motA.length; indexMot++) {
      // tester s’il y a 1 DIFFÉRENCE
      if (motA[indexMot] != motB[indexMot]) {
        // tester si la suite du mot est identique (=> 1 LETTRE DIFFÉRENTE)
        // ex: empathie − ampathie
        if (this.estFinIdentique(motB, indexMot + 1, motA, indexMot + 1)) {
          return ERessemblance.ressemblants;
          // sinon tester si la lettre a été intervertie avec la suivante (=> 2 LETTRES INTERVERTIES ENTRE-ELLES)
          // ex: journée − jouréne
        } else if (
          (indexMot < (motA.length - 1)) &&
          (motA[indexMot] == motB[indexMot + 1] && motA[indexMot + 1] == motB[indexMot])
        ) {
          if (this.estFinIdentique(motA, indexMot + 2, motB, indexMot + 2)) {
            return ERessemblance.ressemblants;
          } else {
            return ERessemblance.differents;
          }
          // sinon > PLUSIEURS DIFFÉRENCES
        } else {
          return ERessemblance.differents;
        }
      }
    }
    return ERessemblance.egaux;
  }

  /**
   * Est-ce que la suite des mots est identique ?
   * Prérequis: la fin des 2 mots doit avoir la même taille.
   */
  private static estFinIdentique(motA: string, indexMotA: number, motB: string, indexMotB: number): boolean {
    for (; indexMotB < motB.length; indexMotB++, indexMotA++) {
      // si lettre différente
      if (motB[indexMotB] != motA[indexMotA]) {
        return false;
      }
    }
    return true;
  }
}



export enum ERessemblance {
  egaux = 0,
  ressemblants = 1,
  differents = 2
}
