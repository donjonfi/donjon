import { ResolvedStaticSymbol } from '@angular/compiler';

export class Abreviations {

  static direction(deuxiemeMot: string) {
    let retVal = deuxiemeMot;
    if (deuxiemeMot) {
      switch (deuxiemeMot) {

        case 'e':
          retVal = "à l’est";
          break;

        case 'n':
          retVal = "au nord";
          break;

        case 'n-e':
          retVal = "au nord-est";
          break;

        case 'n-o':
          retVal = "au nord-ouest";
          break;

        case 'o':
          retVal = "à l’ouest";
          break;

        case 's':
          retVal = "au sud";
          break;

        case 's-e':
          retVal = "au sud-est";
          break;

        case 's-o':
          retVal = "au sud-ouest";
          break;

        default:
          break;
      }
    }
    return retVal;
  }

  static obtenirCommandeComplete(commande: string) {
    // séparer le premier m’ ou s’ de la suite de la commande
    let commandeModifiee = commande;
    if (commandeModifiee.startsWith("m’") || commandeModifiee.startsWith("m'")) {
      commandeModifiee = "m’ " + commandeModifiee.slice(2);
    } else if (commandeModifiee.startsWith("s’") || commandeModifiee.startsWith("s'")) {
      commandeModifiee = "m’ " + commandeModifiee.slice(2);
    }

    let mots = commandeModifiee.split(' ');
    if (mots.length > 0) {
      let premierMotComplet = Abreviations.premierMotCommande(mots[0], true);
      let deuxiemeMotComplet = null;

      // si commande en plusieurs mots
      if (mots.length > 1) {
        // retrouver la direction abrégée
        if (premierMotComplet.trim() === 'aller') {
          deuxiemeMotComplet = Abreviations.direction(mots[1]);
        }

        // c’est un « me » par exemple « me regarder » 
        // => on va le transformer en « regarder le joueur ».
        if (premierMotComplet === 'moi') {
          premierMotComplet = mots[1];
          deuxiemeMotComplet = 'le joueur';
        }
      }

      if (premierMotComplet !== mots[0] || (deuxiemeMotComplet && deuxiemeMotComplet !== mots[1])) {
        mots[0] = premierMotComplet;
        if (deuxiemeMotComplet) {
          mots[1] = deuxiemeMotComplet;
        }
        commande = mots.join(' ').replace(/  /, ' ');
      }
    }

    return commande;
  }

  /**
   * Transforme l’abréviation (1, 2 ou 3 lettres) en un mot complet.
   * @param premierMot abréviation en 1, 2 ou 3 lettres ou bien mot complet.
   */
  static premierMotCommande(premierMot: string, avecEspaceFinal: boolean) {
    let retVal = premierMot;

    if (premierMot && premierMot.length > 0 && premierMot.length <= 10) {
      switch (premierMot) {

        // ======================
        //           A
        // ======================

        case 'a':
        case 'al':
        case 'all':
          retVal = "aller ";
          break;

        case 'at':
        case 'att':
          retVal = "attaquer ";
          break;

        // ======================
        //           C
        // ======================

        case 'ch':
        case 'cha':
          retVal = "chausser ";
          break;

        // ======================
        //           D
        // ======================

        case 'de':
          retVal = "descendre";
          break;

        case 'deb':
          retVal = "deboguer ";
          break;

        case 'dem':
          retVal = "demander ";
          break;

        case 'dep':
        case 'dép':
          retVal = "déplacer ";
          break;

        case 'dev':
        case 'dév':
          retVal = "déverrouiller";
          break;

        case 'd':
        case 'do':
        case 'don':
          retVal = "donner ";
          break;

        // ======================
        //           E
        // ======================

        case 'e':
        case 'est':
          retVal = "aller à l’est";
          break;

        case 'ef':
        case 'eff':
          retVal = "effacer";
          break;

        case 'en':
          retVal = 'entrer';
          break;

        case 'enf':
          retVal = 'enfiler ';
          break;

        case 'ex':
        case 'exa':
          retVal = "examiner ";
          break;

        // ======================
        //           F
        // ======================

        case 'f':
        case 'fo':
        case 'fou':
          retVal = "fouiller ";
          break;

        case 'fe':
        case 'fer':
          retVal = "fermer ";
          break;

        // ======================
        //           I
        // ======================


        case 'i':
        case 'in':
        case 'inv':
          retVal = "inventaire";
          break;

        case 'int':
          retVal = "interroger ";
          break;

        // ======================
        //           J
        // ======================

        case 'j':
        case 'je':
        case 'jet':
          retVal = "jeter ";
          break;

        // ======================
        //           M
        // ======================

        case 'mo':
          retVal = "monter";
          break;

        case 'mon':
          retVal = "montrer ";
          break;

        case 'm\'':
        case 'm’':
        case 'me':
          retVal = "moi";
          break;

        case 'met':
          retVal = "mettre ";
          break;

        // ======================
        //           N
        // ======================

        case 'n':
        case 'nord':
          retVal = "aller au nord";
          break;

        case 'n-e':
        case 'nord-est':
          retVal = "aller au nord-est";
          break;

        case 'n-o':
        case 'nord-ouest':
          retVal = "aller au nord-ouest";
          break;
        // ======================
        //           O
        // ======================

        case 'o':
        case 'ouest':
          retVal = "aller à l’ouest";
          break;

        case 'ou':
        case 'ouv':
          retVal = "ouvrir ";
          break;

        case 'où':
          retVal = "où suis-je ?";
          break;
        // ======================
        //           P
        // ======================

        case 'p':
        case 'pr':
        case 'pre':
          retVal = "prendre ";
          break;

        // case 'pa':
        case 'par':
          retVal = "parler ";
          break;

        case 'pos':
          retVal = "poser ";
          break;

        case 'pou':
          retVal = "pousser ";
          break;

        // ======================
        //           Q
        // ======================
        case 'que':
          retVal = "questionner";
          break;

        // ======================
        //           R
        // ======================

        case 'r':
        case 're':
        case 'reg':
          retVal = "regarder ";
          break;

        // ======================
        //           S
        // ======================

        case 's':
        case 'sud':
          retVal = "aller au sud";
          break;

        case 's-e':
        case 'sud-est':
          retVal = "aller au sud-est";
          break;

        case 's-o':
        case 'sud-ouest':
          retVal = "aller au sud-ouest";
          break;

        case 'so':
          retVal = 'sortir';
          break;

        case 'sor':
          retVal = "sorties";
          break;

        // ======================
        //           T
        // ======================

        case 'te':
        case 'ten':
          retVal = "tenir ";
          break;

        // ======================
        //           U
        // ======================

        case 'u':
        case 'ut':
        case 'uti':
          retVal = "utiliser ";
          break;

        // ======================
        //           ?
        // ======================

        case '?':
          retVal = "aide";
          break;

        default:
          break;
      }
    }

    if (!avecEspaceFinal) {
      retVal = retVal.trim();
    }

    return retVal;
  }

}
