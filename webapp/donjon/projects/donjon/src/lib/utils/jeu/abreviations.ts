import { Abreviation } from "../../models/compilateur/abreviation";

export class Abreviations {

  static direction(deuxiemeMot: string) {
    let retVal = deuxiemeMot;
    if (deuxiemeMot) {
      switch (deuxiemeMot) {
        case 'n':
          retVal = "au nord";
          break;
        case 'n-e':
        case 'ne':
          retVal = "au nord-est";
          break;
        case 'e':
          retVal = "à l’est";
          break;
        case 's-e':
          retVal = "au sud-est";
          break;
        case 's':
          retVal = "au sud";
          break;
        case 's-o': // (so: sortir!)
        case 's-w':
        case 'sw':
          retVal = "au sud-ouest";
          break;
        case 'o':
        case 'w':
          retVal = "à l’ouest";
          break;
        case 'n-o':
        case 'n-w':
        case 'nw':
        case 'no':
          retVal = "au nord-ouest";
          break;

        default:
          break;
      }
    }
    return retVal;
  }

  static obtenirCommandeComplete(commande: string, abreviations: Abreviation[]) {

    let commandeModifiee = commande.trim().toLocaleLowerCase("fr");

    // séparer le premier m’ ou s’ de la suite de la commande
    if (commandeModifiee.startsWith("m’") || commandeModifiee.startsWith("m'")) {
      commandeModifiee = "m’ " + commandeModifiee.slice(2);
    } else if (commandeModifiee.startsWith("s’") || commandeModifiee.startsWith("s'")) {
      commandeModifiee = "m’ " + commandeModifiee.slice(2);
    }

    let mots = commandeModifiee.split(' ');
    if (mots.length > 0) {
      let premierMotComplet = Abreviations.premierMotCommande(mots[0], true, abreviations);
      let deuxiemeMotComplet: string = null;

      // si commande en plusieurs mots
      if (mots.length > 1) {
        // retrouver la direction abrégée
        if (premierMotComplet.trim() === 'aller') {
          deuxiemeMotComplet = Abreviations.direction(mots[1]);
          // éviter « aller dedans dans » => « aller dans »
        } else if (premierMotComplet.trim() === 'aller dedans') {
          if (mots[1].startsWith('dans')) {
            premierMotComplet = 'aller';
          } else if (mots[1].trim()) {
            premierMotComplet = 'aller dans';
          }
        } else if (premierMotComplet.trim() === 'aller dehors') {
          if (mots[1].trim()) {
            premierMotComplet = 'aller hors';
          }
        }

        // c’est un « me » par exemple « me regarder » 
        // => on va le transformer en « regarder le joueur ».
        if (premierMotComplet === 'moi') {
          premierMotComplet = Abreviations.premierMotCommande(mots[1], true, abreviations);
          deuxiemeMotComplet = 'le joueur';
        }

        // si le 2e mot est "me" l’interpréter comme "moi" en anglais.
        if (mots[1].trim() == 'me') {
          deuxiemeMotComplet = 'le joueur';
        }

        // commande aide : ajouter « pour » avant le sujet
        if (premierMotComplet.trim() === 'afficher l’aide' && (mots[1]) && (mots[1] != 'pour')) {
          premierMotComplet += " pour ";
        } else if (mots[0] === 'afficher' && (mots[1] === 'aide' || mots[1] === 'l’aide' || mots[1] === 'l\'aide') && mots[2] && mots[2] != 'pour') {
          deuxiemeMotComplet = "l’aide pour "
        }

      }

      if (premierMotComplet !== mots[0] || (deuxiemeMotComplet && deuxiemeMotComplet !== mots[1])) {
        mots[0] = premierMotComplet;
        if (deuxiemeMotComplet) {
          mots[1] = deuxiemeMotComplet;
        }
        commande = mots.join(' ').replace(/  /g, ' ');
      }

      if (commande == "nouvelle partie") {
        commande = "recommencer";
      }

    }

    return commande;
  }

  /**
   * Transforme l’abréviation (1, 2 ou 3 lettres) en un mot complet.
   * @param premierMot abréviation en 1, 2 ou 3 lettres ou bien mot complet.
   */
  static premierMotCommande(premierMot: string, avecEspaceFinal: boolean, abreviations: Abreviation[]) {
    let retVal = premierMot;

    if (premierMot && premierMot.length > 0 && premierMot.length <= 10) {

      let dejaTrouve = false;
      // parcourir en premier lieux les abréviations du scénario
      abreviations.forEach(abreviation => {
        if (premierMot == abreviation.abreviation) {
          retVal = abreviation.commande;
          dejaTrouve = true;
        }
      });

      if (!dejaTrouve) {

        switch (premierMot) {

          // ======================
          //           ?
          // ======================

          case '?':
            retVal = "afficher l’aide";
            break;

          // ======================
          //           A
          // ======================

          case 'aide':
            retVal = "afficher l’aide";
            break;

          case 'af':
            retVal = "afficher ";
            break;

          case 'a':
          case 'al':
          case 'all':
            retVal = "aller ";
            break;

          case 'at':
          case 'att':
            retVal = "attaquer ";
            break;

          case 'triche':
            retVal = "déboguer triche ";
            break;

          // ======================
          //           B
          // ======================

          case 'b':
          case 'bas':
            retVal = "aller en bas";
            break;

          case 'bo':
          case 'boi':
            retVal = "boire "
            break;

          // ======================
          //           C
          // ======================

          case 'ch':
          case 'cha':
            retVal = "chausser ";
            break;

          case 'clear':
          case 'cls':
            retVal = "effacer";
            break;

          // case 'cl': // (en: close)
          //   retVal = "fermer ";
          //   break;

          // ======================
          //           D
          // ======================

          case 'd': // (en: down)
          case 'de':
          case 'descendre':
            retVal = "aller en bas";
            break;

          case 'deb':
          case 'deboguer':
          case 'déb':
            retVal = "déboguer ";
            break;

          case 'dem':
            retVal = "demander ";
            break;

          case 'dep':
          case 'deplacer':
          case 'dép':
            retVal = "déplacer ";
            break;

          case 'dev':
          case 'deverrouiller':
          case 'dév':
            retVal = "déverrouiller";
            break;

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

          // case 'ea': // (en: eat)
          //   retVal = "manger "
          //   break;

          case 'ef':
          case 'eff':
            retVal = "effacer";
            break;

          case 'en':
          case 'entrer':
            retVal = 'aller dedans';
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
          //           G
          // ======================

          // g (en: again, fr: répète)

          // case 'go': // (en: go)
          //   retVal = "aller ";
          //   break;

          // ======================
          //           H
          // ======================

          case 'h':
          case 'haut':
            retVal = "aller en haut";
            break;

          // ======================
          //           I
          // ======================

          case 'i': // (en: inventory)
          case 'inv':
          case 'inventaire':
            retVal = "afficher inventaire";
            break;

          case 'in': // (en: in)
            retVal = 'aller dedans';
            break;

          case 'int':
            retVal = "interroger ";
            break;

          // ======================
          //           J
          // ======================

          // todo: éviter d’utiliser 'je' car peut-être est-ce le pronom ?
          case 'j':
          case 'je':
          case 'jet':
            retVal = "jeter ";
            break;

          // ======================
          //           L
          // ======================

          case 'l': // (en: look)
          case 'ls':
            retVal = "regarder ";
            break;

          case 'la':
          case 'lâ':
          case 'lac':
          case 'lâc':
          case 'lacher':
            retVal = "lâcher ";
            break;

          // ======================
          //           M
          // ======================

          case 'ma':
          case 'man':
            retVal = "manger "
            break;

          case 'm\'':
          case 'm’':
          case 'me':
            retVal = "moi";
            break;

          case 'met':
            retVal = "mettre ";
            break;

          case 'mo':
          case 'monter':
            retVal = "aller en haut";
            break;

          case 'mon':
            retVal = "montrer ";
            break;





          // ======================
          //           N
          // ======================

          case 'n':
          case 'nord':
            retVal = "aller au nord";
            break;

          case 'n-e':
          case 'ne': // (en: north east)
          case 'nord-est':
            retVal = "aller au nord-est";
            break;

          case 'n-o':
          case 'no':
          case 'nw': // (en: north west)
          case 'nord-ouest':
            retVal = "aller au nord-ouest";
            break;

          case 'nombre':
            retVal = "afficher nombre ";
            break;
          // ======================
          //           O
          // ======================

          case 'o':
          case 'ouest':
            retVal = "aller à l’ouest";
            break;

          // case 'op': // (en: open)
          //   retVal = "ouvrir ";
          //   break;

          case 'ou':
          case 'ouv':
            retVal = "ouvrir ";
            break;

          case 'out': // (en: out)
            retVal = 'aller dehors';
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

          case 'pau':
          case 'pause':
            retVal = "faire une pause";
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
          case 'se': // (en: south east)
          case 'sud-est':
            retVal = "aller au sud-est";
            break;

          case 's-o':
          case 's-w': // (south west)
          case 'sw':// (south west)
          case 'sud-ouest':
            retVal = "aller au sud-ouest";
            break;

          case 'so':
          case 'sortir':
            retVal = 'aller dehors';
            break;

          case 'sor':
          case 'sortie':
          case 'sorties':
            retVal = "afficher sorties";
            break;

          // ======================
          //           T
          // ======================

          case 't': // (en: take)
            retVal = "prendre "
            break;

          case 'te':
          case 'ten':
            retVal = "tenir ";
            break;

          // ======================
          //           U
          // ======================
          case 'u': // (en: up)
            retVal = "aller en haut";
            break;

          case 'ut':
          case 'uti':
            retVal = "utiliser ";
            break;

          // ======================
          //           W
          // ======================
          case 'w': // (en: west)
            retVal = "aller à l’ouest";
            break;

          // ======================
          //           X
          // ======================

          case 'x': // (en: examine)
            retVal = "examiner ";
            break;

          // ======================
          //           Y
          // ======================

          // ======================
          //           Z
          // ======================
          case 'z': // (en: wait)
            retVal = "attendre";
            break;

          // ======================
          default:
            break;
        }


      }
    }


    if (!avecEspaceFinal) {
      retVal = retVal.trim();
    }

    return retVal;
  }

}
