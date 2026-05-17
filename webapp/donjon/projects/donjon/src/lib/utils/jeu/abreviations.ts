import { Abreviation } from "../../models/compilateur/abreviation";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { Genre } from "../../models/commun/genre.enum";
import { Lieu } from "../../models/jeu/lieu";
import { Nombre } from "../../models/commun/nombre.enum";
import { Objet } from "../../models/jeu/objet";

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

  static obtenirCommandeComplete(commande: string, abreviations: Abreviation[], lieux?: Lieu[], objets?: Objet[]) {

    let commandeModifiee = commande.trim().toLocaleLowerCase("fr");

    // séparer le premier m’ ou s’ de la suite de la commande
    if (commandeModifiee.startsWith("m’") || commandeModifiee.startsWith("m'")) {
      commandeModifiee = "m’ " + commandeModifiee.slice(2);
    } else if (commandeModifiee.startsWith("s’") || commandeModifiee.startsWith("s'")) {
      commandeModifiee = "m’ " + commandeModifiee.slice(2);
    }

    let mots = commandeModifiee.split(' ');

    // "l'[abrev/verbe]" collé (ex: "l'x truc", "l're", "l'ouvrir avec la clé") → "[verbe] ce dernier [reste]"
    const matchLApostrophe = /^l(?:'|\u2019)(\S+)(.*)$/i.exec(commandeModifiee);
    if (matchLApostrophe) {
      const expanded = Abreviations.premierMotCommande(matchLApostrophe[1], false, abreviations, 2);
      if (/(?:er|ir|re)$/i.test(expanded)) {
        return expanded + ' ce dernier' + matchLApostrophe[2];
      }
    }

    // "le/la/les/l' [abrev/verbe] [reste]" avec espace → "[verbe] [pronom accordé] [reste]" (seulement si infinitif)
    if (mots.length >= 2 && (mots[0] === 'le' || mots[0] === 'la' || mots[0] === 'les' || mots[0] === "l'" || mots[0] === "l'")) {
      const verbe = Abreviations.premierMotCommande(mots[1], false, abreviations, 2);
      if (/(?:er|ir|re)$/i.test(verbe)) {
        const reste = mots.slice(2).join(' ');
        let pronom: string;
        if (mots[0] === 'la') pronom = 'cette dernière';
        else if (mots[0] === 'les') pronom = 'ces derniers';
        else pronom = 'ce dernier';
        return verbe + ' ' + pronom + (reste ? ' ' + reste : '');
      }
    }

    // "lui/leur [verbe-infinitif] [reste]" en tête
    // sans argument : "[verbe] avec [pronom]"  — ex: "lui parler" → "parler avec ce dernier"
    // avec argument : "[verbe] [objet] à [pronom]"  — ex: "lui montrer le coffre" → "montrer le coffre à ce dernier"
    if (mots.length >= 2 && (mots[0] === 'lui' || mots[0] === 'leur')) {
      if (/(?:er|ir|re)$/i.test(mots[1])) {
        const reste = mots.slice(2).join(' ');
        const pronom = mots[0] === 'leur' ? 'ces derniers' : 'ce dernier';
        if (reste) {
          return mots[1] + ' ' + reste + ' à ' + pronom;
        } else {
          return mots[1] + ' avec ' + pronom;
        }
      }
    }

    // "si <condition>" ou "vf [si] <condition>" → 'déboguer dire "[si <condition>]vrai[sinon]faux[fin]"'
    // Raccourci de débogage pour évaluer une condition depuis le lecteur.
    if ((mots[0] === 'si' || mots[0] === 'vf') && mots.length >= 2) {
      let motsCondition = mots.slice(1).filter(m => m);
      if (mots[0] === 'vf' && motsCondition[0] === 'si') {
        motsCondition = motsCondition.slice(1);
      }
      const condition = motsCondition.join(' ');
      if (condition) {
        return 'déboguer dire "[si ' + condition + ']vrai[sinon]faux[fin]"';
      }
    }

    // "cd <lieu>" (alias: "lc") → "déboguer changer le joueur se trouve dans <lieu>"
    // Si pas de déterminant et que le lieu est trouvé dans la liste, on l'accorde
    // selon son genre/nombre (et son élision). Sinon, « le » par défaut.
    if ((mots[0] === 'cd' || mots[0] === 'lc') && mots.length >= 2) {
      const reste = mots.slice(1).filter(m => m).join(' ');
      if (reste) {
        return 'déboguer changer le joueur se trouve dans ' + Abreviations.elementAvecDeterminant(reste, lieux);
      }
    }

    // "mv <objet> vers <lieu>" (alias: "dp", séparateur: "vers" ou "to") → "déboguer changer <objet> se trouve dans <lieu>"
    // Le déterminant est inféré depuis la liste des objets/lieux du jeu, sinon « le » par défaut.
    if ((mots[0] === 'mv' || mots[0] === 'dp') && mots.length >= 4) {
      const idxSep = mots.findIndex((m, i) => i >= 2 && (m === 'vers' || m === 'to'));
      if (idxSep >= 2 && idxSep < mots.length - 1) {
        const objetReste = mots.slice(1, idxSep).filter(m => m).join(' ');
        const lieuReste = mots.slice(idxSep + 1).filter(m => m).join(' ');
        if (objetReste && lieuReste) {
          const objetStr = Abreviations.elementAvecDeterminant(objetReste, objets);
          const lieuStr = Abreviations.elementAvecDeterminant(lieuReste, lieux);
          return 'déboguer changer ' + objetStr + ' se trouve dans ' + lieuStr;
        }
      }
    }

    if (mots.length > 0) {
      let premierMotComplet = Abreviations.premierMotCommande(mots[0], true, abreviations, mots.length);
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
          premierMotComplet = Abreviations.premierMotCommande(mots[1], true, abreviations, mots.length);
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
  static premierMotCommande(premierMot: string, avecEspaceFinal: boolean, abreviations: Abreviation[], nombreDeMots: number) {
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

          case 'again':
            if (nombreDeMots == 1) {
              retVal = 'répéter la dernière commande';
            }
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

          case 'av':
          case 'ava':
          case 'avancer':
            if (nombreDeMots == 1) {
              retVal = "aller dedans";
            }
            break;

          case 'triche':
            retVal = "déboguer triche ";
            break;

          // ======================
          //           B
          // ======================

          case 'b':
          case 'bas':
            if (nombreDeMots == 1) {
              retVal = "aller en bas";
            }
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
            if (nombreDeMots == 1) {
              retVal = "aller en bas";
            }
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
            if (nombreDeMots == 1) {
              retVal = "aller à l’est";
            }
            break;

          // case 'ea': // (en: eat)
          //   retVal = "manger "
          //   break;

          case 'ef':
          case 'eff':
            retVal = "effacer";
            break;

          case 'enc':
          case 'encore':
            if (nombreDeMots == 1) {
              retVal = 'répéter la dernière commande';
            }
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

          case 'g': //(en: again, fr: répète)
            if (nombreDeMots == 1) {
              retVal = 'répéter la dernière commande';
            }
            break;

          // case 'go': // (en: go)
          //   retVal = "aller ";
          //   break;

          // ======================
          //           H
          // ======================

          case 'h':
          case 'haut':
            if (nombreDeMots == 1) {
              retVal = "aller en haut";
            }
            break;

          // ======================
          //           I
          // ======================

          case 'i': // (en: inventory)
          case 'inv':
          case 'inventaire':
            if (nombreDeMots == 1) {
              retVal = "afficher inventaire";
            }
            break;

          case 'in': // (en: in)
            if (nombreDeMots == 1) {
              retVal = 'aller dedans';
            }
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
            if (nombreDeMots == 1) {
              retVal = "aller en haut";
            }
            break;

          case 'mon':
            retVal = "montrer ";
            break;





          // ======================
          //           N
          // ======================

          case 'n':
          case 'nord':
            if (nombreDeMots == 1) {
              retVal = "aller au nord";
            }
            break;

          case 'n-e':
          case 'ne': // (en: north east)
          case 'nord-est':
            if (nombreDeMots == 1) {
              retVal = "aller au nord-est";
            }
            break;

          case 'n-o':
          case 'no':
          case 'nw': // (en: north west)
          case 'nord-ouest':
            if (nombreDeMots == 1) {
              retVal = "aller au nord-ouest";
            }
            break;

          case 'nombre':
            retVal = "afficher nombre ";
            break;
          // ======================
          //           O
          // ======================

          case 'o':
          case 'ouest':
            if (nombreDeMots == 1) {
              retVal = "aller à l’ouest";
            }
            break;

          // case 'op': // (en: open)
          //   retVal = "ouvrir ";
          //   break;

          case 'ou':
          case 'ouv':
            retVal = "ouvrir ";
            break;

          case 'out': // (en: out)
            if (nombreDeMots == 1) {
              retVal = 'aller dehors';
            }
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
            if (nombreDeMots == 1) {
              retVal = "faire une pause";
            }
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

          case 'ré':
          case 'rép':
          case 'répète':
            if (nombreDeMots == 1) {
              retVal = 'répéter la dernière commande';
            }
            break;

          // ======================
          //           S
          // ======================

          case 's':
          case 'sud':
            if (nombreDeMots == 1) {
              retVal = "aller au sud";
            }
            break;

          case 's-e':
          case 'se': // (en: south east)
          case 'sud-est':
            if (nombreDeMots == 1) {
              retVal = "aller au sud-est";
            }
            break;

          case 's-o':
          case 's-w': // (south west)
          case 'sw':// (south west)
          case 'sud-ouest':
            if (nombreDeMots == 1) {
              retVal = "aller au sud-ouest";
            }
            break;

          case 'so':
          case 'sortir':
            if (nombreDeMots == 1) {
              retVal = 'aller dehors';
            }
            break;

          case 'sor':
          case 'sortie':
          case 'sorties':
            if (nombreDeMots == 1) {
              retVal = "afficher sorties";
            }
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
            if (nombreDeMots == 1) {
              retVal = "aller en haut";
            }
            break;

          case 'ut':
          case 'uti':
            retVal = "utiliser ";
            break;

          // ======================
          //           W
          // ======================
          case 'w': // (en: west)
            if (nombreDeMots == 1) {
              retVal = "aller à l’ouest";
            }
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
            if (nombreDeMots == 1) {
              retVal = "attendre";
            }
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

  /**
   * Normaliser une chaîne pour la comparer : minuscules, sans accents, sans ponctuation,
   * espaces réduits. Utilisé pour matcher la commande user contre les noms de lieux.
   */
  private static normaliser(s: string): string {
    return (s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/['’`]/g, ' ')
      .replace(/[^a-z0-9 ]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Chercher un élément du jeu dont le nom+épithète correspond à la chaîne fournie. */
  private static trouverElementParNom<T extends ElementJeu>(nom: string, elements: T[] | undefined): T | undefined {
    if (!elements || elements.length === 0) { return undefined; }
    const cible = Abreviations.normaliser(nom);
    if (!cible) { return undefined; }
    return elements.find(e => Abreviations.normaliser(e.intitule?.nomEpithete ?? e.nom) === cible);
  }

  /**
   * Reconstituer le déterminant d'un élément en respectant son genre/nombre et l'élision
   * éventuelle. Si le DSL a fourni un déterminant explicite sur l'intitulé, il est repris.
   */
  private static determinantPourElement(el: ElementJeu): string {
    const detExplicite = el.intitule?.determinant?.trim();
    if (detExplicite) {
      // si l'élision est déjà présente ("l'", "l’"), pas d'espace ; sinon, espace
      return /['’]$/.test(detExplicite) ? detExplicite : detExplicite + ' ';
    }
    // pluriel (y compris "toujours pluriel")
    if (el.nombre === Nombre.p || el.nombre === Nombre.tp) { return 'les '; }
    // élision singulière devant voyelle ou h muet
    const premierChar = (el.intitule?.nomEpithete ?? '').trim().charAt(0).toLowerCase();
    const voyellesEtH = 'aâàäeéèêëiîïoôöuûüyhœæ';
    if (premierChar && voyellesEtH.includes(premierChar)) { return "l'"; }
    return el.genre === Genre.f ? 'la ' : 'le ';
  }

  /**
   * Pour une chaîne « <reste> » désignant un élément (lieu ou objet) :
   * - si <reste> commence déjà par un déterminant, le retourne tel quel ;
   * - sinon cherche l'élément dans la liste fournie et préfixe son déterminant accordé ;
   * - en dernier recours, préfixe « le ».
   */
  private static elementAvecDeterminant<T extends ElementJeu>(reste: string, elements: T[] | undefined): string {
    const motsReste = reste.split(' ');
    const determinants = ['le', 'la', 'les', 'un', 'une', 'des'];
    const aDeterminant = determinants.includes(motsReste[0]) || /^l['’]/.test(motsReste[0]);
    if (aDeterminant) { return reste; }
    const trouve = Abreviations.trouverElementParNom(reste, elements);
    if (trouve) {
      return Abreviations.determinantPourElement(trouve) + trouve.intitule.nomEpithete;
    }
    return 'le ' + reste;
  }

}
