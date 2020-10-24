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
    let mots = commande.split(' ');
    if (mots.length > 0) {
      let premierMotComplet = Abreviations.premierMotCommande(mots[0], true);
      let deuxiemeMotComplet = null;

      if (mots.length > 1) {
        if (premierMotComplet.trim() === 'aller') {
          deuxiemeMotComplet = Abreviations.direction(mots[1]);
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
        //           D
        // ======================

        case 'de':
          retVal = "descendre";
          break;

        case 'dem':
          retVal = "demander ";
          break;

        case 'dev':
        case 'dév':
          retVal = "déverrouiller";
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
        //           M
        // ======================

        case 'mo':
          retVal = "monter";
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

        case 'ob':
        case 'obs':
          retVal = "observer ";
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

        case 'pa':
        case 'par':
          retVal = "parler ";
          break;

        case 'po':
        case 'pos':
          retVal = "position";
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
