import { Classe, ClassesRacines, EClasseRacine } from '../../models/commun/classe';
import { ConditionDebutee, StatutCondition, xFois } from '../../models/jouer/statut-conditions';
import { PositionObjet, PrepositionSpatiale } from '../../models/jeu/position-objet';

import { ConditionsUtils } from './conditions-utils';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Genre } from '../../models/commun/genre.enum';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Instruction } from '../../models/compilateur/instruction';
import { Intitule } from 'src/app/models/jeu/intitule';
import { Jeu } from '../../models/jeu/jeu';
import { Lieu } from 'src/app/models/jeu/lieu';
import { Localisation } from 'src/app/models/jeu/localisation';
import { Nombre } from '../../models/commun/nombre.enum';
import { Objet } from '../../models/jeu/objet';
import { Reaction } from 'src/app/models/compilateur/reaction';
import { Resultat } from '../../models/jouer/resultat';

export class Instructions {

  private cond: ConditionsUtils;

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private verbeux: boolean,
  ) {
    this.cond = new ConditionsUtils(this.jeu, this.verbeux);
  }


  private static calculerNbChoix(statut: StatutCondition) {
    let nbChoix = 0;
    let index = statut.curMorceauIndex;
    do {
      index += 2;
      nbChoix += 1;
    } while (statut.morceaux[index] !== 'fin choix' && (index < (statut.morceaux.length - 3)));

    // si on est dans une balise fois et si il y a un "puis"
    // => récupérer le dernier élément fois pour avoir le plus élevé
    if (statut.conditionDebutee == ConditionDebutee.fois) {

      if (statut.morceaux[index - 2] == "puis") {
        const result = statut.morceaux[index - 4].match(xFois);
        if (result) {
          statut.plusGrandChoix = Number.parseInt(result[1], 10);
        } else {
          console.warn("'puis' ne suit pas un 'Xe fois'");
        }
      }
    }

    return nbChoix;
  }


  public executerInstructions(instructions: Instruction[], ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    let resultat = new Resultat(true, '', 0);
    if (instructions && instructions.length > 0) {
      instructions.forEach(ins => {
        const subResultat = this.executerInstruction(ins, ceci, cela);
        resultat.nombre += subResultat.nombre;
        resultat.succes = (resultat.succes && subResultat.succes);
        resultat.sortie += subResultat.sortie;
      });
    }

    return resultat;
  }

  public executerInstruction(instruction: Instruction, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    let resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;
    if (this.verbeux) {
      console.log(">>> ex instruction:", instruction);
    }
    // incrémenter le nombre de fois que l’instruction a déjà été exécutée
    instruction.nbExecutions += 1;

    // instruction conditionnelle
    if (instruction.condition) {

      const estVrai = this.cond.siEstVrai(null, instruction.condition, ceci, cela);
      if (this.verbeux) {
        console.log(">>>> estVrai=", estVrai);

      }
      if (estVrai) {
        sousResultat = this.executerInstructions(instruction.instructionsSiConditionVerifiee, ceci, cela);
      } else {

        sousResultat = this.executerInstructions(instruction.instructionsSiConditionPasVerifiee, ceci, cela);
      }
      // instruction simple
    } else {
      if (instruction.instruction.infinitif) {
        //if (instruction.sujet == null && instruction.verbe) {
        sousResultat = this.executerInfinitif(instruction.instruction, instruction.nbExecutions, ceci, cela);
        // } else if (instruction.sujet) {
        // this.executerSujetVerbe(instruction);
      } else {
        console.warn("executerInstruction : pas d'infinitif :", instruction);
      }
    }
    resultat.sortie += sousResultat.sortie;

    // console.warn("exInstruction >>> instruction=", instruction, "resultat=", resultat);

    return resultat;
  }

  private interpreterContenuDire(contenu: string, nbExecutions: number, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null) {

    // console.log("interpreterContenuDire >>> contenu=", contenu, " nbExecutions=", nbExecutions, "ceci=", ceci, "cela=", cela);

    // description
    if (contenu.includes("[description")) {
      if (contenu.includes("[description ici]")) {
        const descIci = this.calculerDescription(this.eju.curLieu.description, ++this.eju.curLieu.nbAffichageDescription, null, ceci, cela);
        contenu = contenu.replace(/\[description ici\]/g, descIci);
      }
      if (contenu.includes("[description ceci]")) {
        if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
          const descCeci = this.calculerDescription((ceci as Objet).description, ++(ceci as Objet).nbAffichageDescription, (ceci as Objet).initial, ceci, cela);
          contenu = contenu.replace(/\[description ceci\]/g, descCeci);
        } else {
          console.error("interpreterContenuDire: Description de ceci: ceci n'est pas un objet");
        }
      }
      if (contenu.includes("[description cela]")) {
        if (Classe.heriteDe(cela.classe, EClasseRacine.objet)) {
          const descCela = this.calculerDescription((cela as Objet).description, ++(cela as Objet).nbAffichageDescription, (cela as Objet).initial, ceci, cela);
          contenu = contenu.replace(/\[description cela\]/g, descCela);
        } else {
          console.error("interpreterContenuDire: Description de cela: cela n'est pas un objet");
        }
      }
    }

    // examen
    if (contenu.includes("[examen")) {
      if (contenu.includes("[examen ici]")) {
        const examenIci = this.calculerDescription(this.eju.curLieu.examen, ++this.eju.curLieu.nbAffichageExamen, null, ceci, cela);
        contenu = contenu.replace(/\[examen ici\]/g, examenIci);
      }
      if (contenu.includes("[examen ceci]")) {
        if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
          const examenCeci = this.calculerDescription((ceci as Objet).examen, ++(ceci as Objet).nbAffichageExamen, (ceci as Objet).initial, ceci, cela);
          contenu = contenu.replace(/\[examen ceci\]/g, examenCeci);
        } else {
          console.error("interpreterContenuDire: examen de ceci: ceci n'est pas un objet");
        }
      }
      if (contenu.includes("[examen cela]")) {
        if (Classe.heriteDe(cela.classe, EClasseRacine.objet)) {
          const examenCela = this.calculerDescription((cela as Objet).examen, ++(cela as Objet).nbAffichageExamen, (cela as Objet).initial, ceci, cela);
          contenu = contenu.replace(/\[examen cela\]/g, examenCela);
        } else {
          console.error("interpreterContenuDire: examen de cela: cela n'est pas un objet");
        }
      }
    }

    // contenu
    if (contenu.includes("[contenu")) {

      if (contenu.includes("[contenu ici]")) {
        const contenuIci = this.executerAfficherContenu(this.eju.curLieu, "{n}Vous voyez ", "");
        contenu = contenu.replace(/\[contenu ici\]/g, contenuIci.sortie);
      }
      if (contenu.includes("[contenu ceci]")) {
        if (ceci && Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
          const contenuCeci = this.executerAfficherContenu((ceci as Objet), "{n}Vous trouvez ", "{n}Vous ne trouvez pas d'objet.");
          contenu = contenu.replace(/\[contenu ceci\]/g, contenuCeci.sortie);
        } else {
          console.error("interpreterContenuDire: contenu de ceci: ceci n'est pas un objet");
        }
      }
      if (contenu.includes("[contenu cela]")) {
        if (cela && Classe.heriteDe(cela.classe, EClasseRacine.objet)) {
          const contenuCela = this.executerAfficherContenu((cela as Objet), "{n}Vous trouvez ", "{n}Vous ne trouvez pas d'objet.");
          contenu = contenu.replace(/\[contenu cela\]/g, contenuCela.sortie);
        } else {
          console.error("interpreterContenuDire: contenu de cela: cela n'est pas un objet");
        }
      }
    }

    // sorties
    if (contenu.includes("[sorties ici]")) {
      const sortiesIci = this.afficherSorties(this.eju.curLieu);
      contenu = contenu.replace(/\[sorties ici\]/g, sortiesIci);
    }

    // titre
    if (contenu.includes("[titre ici]")) {
      const titreIci = this.eju.curLieu.titre;
      contenu = contenu.replace(/\[titre ici\]/g, titreIci);
    }

    // intitulé
    if (contenu.includes("[intitulé")) {
      if (contenu.includes("[intitulé ici]")) {
        const intIci = ElementsJeuUtils.calculerIntitule(this.eju.curLieu);
        contenu = contenu.replace(/\[intitulé ici\]/g, intIci);
      }
      if (contenu.includes("[intitulé ceci]")) {
        const intCeci = ElementsJeuUtils.calculerIntitule(ceci);
        contenu = contenu.replace(/\[intitulé ceci\]/g, intCeci);
      }
      if (contenu.includes("[intitulé cela]")) {
        const intCela = ElementsJeuUtils.calculerIntitule(cela);
        contenu = contenu.replace(/\[intitulé cela\]/g, intCela);
      }
    }


    // accord
    if (contenu.includes("[accord")) {
      if (contenu.includes("[accord ici]")) {
        const accordIci = (this.eju.curLieu.genre === Genre.f ? "e" : "") + (this.eju.curLieu.nombre === Nombre.p ? "s" : "");
        contenu = contenu.replace(/\[accord ici\]/g, accordIci);
      }
      if (contenu.includes("[accord ceci]")) {
        if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
          const accordCeci = ((ceci as Objet).genre === Genre.f ? "e" : "") + ((ceci as Objet).nombre === Nombre.p ? "s" : "");
          contenu = contenu.replace(/\[accord ceci\]/g, accordCeci);
        } else {
          console.error("interpreterContenuDire: accord ceci: ceci n'est pas un objet");
        }
      }
      if (contenu.includes("[accord cela]")) {
        if (Classe.heriteDe(cela.classe, EClasseRacine.objet)) {
          const accordCela = ((cela as Objet).genre === Genre.f ? "e" : "") + ((cela as Objet).nombre === Nombre.p ? "s" : "");
          contenu = contenu.replace(/\[accord cela\]/g, accordCela);
        } else {
          console.error("interpreterContenuDire: accord cela: cela n'est pas un objet");
        }
      }
    }

    // interpréter les balises encore présentes
    if (contenu.includes("[")) {
      contenu = this.calculerDescription(contenu, nbExecutions, null, ceci, cela);
    }

    return contenu;

  }

  private executerInfinitif(instruction: ElementsPhrase, nbExecutions: number, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {
    let resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;

    console.log("EX INF − ", instruction.infinitif.toUpperCase(), " (ceci=", ceci, "cela=", cela, "instruction=", instruction, "nbExecutions=", nbExecutions, ")");

    switch (instruction.infinitif.toLowerCase()) {
      case 'dire':
        // enlever le premier et le dernier caractères (") et les espaces aux extrémités.
        const complement = instruction.complement1.trim();
        let contenu = complement.slice(1, complement.length - 1).trim();
        contenu = this.interpreterContenuDire(contenu, nbExecutions, ceci, cela);
        resultat.sortie += contenu;
        // si la chaine se termine par un espace, ajouter un saut de ligne.
        if (complement.endsWith(' "')) {
          resultat.sortie += "\n";
        }
        break;
      case 'changer':
        sousResultat = this.executerChanger(instruction, ceci, cela);
        resultat.succes = sousResultat.succes;
        break;

      case 'déplacer':
        if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
          sousResultat = this.executerDeplacer(instruction.sujet, instruction.preposition, instruction.sujetComplement1, ceci as Objet, cela);
          resultat.succes = sousResultat.succes;
        } else {
          console.error("Exécuter infinitif: On ne peut pas déplacer un intitulé.");
          resultat.succes = false;
        }
        break;

      case 'effacer':
        if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
          sousResultat = this.executerEffacer(ceci as Objet);
          resultat.succes = sousResultat.succes;
        } else {
          console.error("Exécuter infinitif: On ne peut pas effacer un intitulé.");
          resultat.succes = false;
        }
        break;

      case 'sauver':
        console.log("executerInfinitif >> sauver=", instruction.complement1);
        if (instruction.complement1) {
          this.jeu.sauvegardes.push(instruction.complement1);
          resultat.succes = true;
        } else {
          resultat.succes = false;
        }
        break;

      case 'exécuter':
        console.log("executerInfinitif >> exécuter=", instruction);
        if (instruction.complement1 && instruction.complement1.startsWith('réaction ')) {
          console.log("executerInfinitif >> executerReaction", instruction, ceci, cela);
          sousResultat = this.executerReaction(instruction, ceci, cela);
          resultat.sortie = sousResultat.sortie;
          resultat.succes = sousResultat.succes;
        } else {
          console.error("executerInfinitif >> complément autre que  « réaction de … » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;

      default:
        console.warn("executerVerbe : pas compris instruction:", instruction);
        break;
    }

    return resultat;
  }



  /**
   * Afficher le contenu d'un objet ou d'un lieu.
   * Remarque: le contenu invisible n'est pas affiché.
   */
  public executerAfficherContenu(ceci: ElementJeu, texteSiQuelqueChose: string, texteSiRien: string): Resultat {
    let resultat = new Resultat(false, '', 1);
    if (ceci) {
      let objets: Objet[] = null;
      // objet
      if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
        // retrouver les objets {contenus dans/posés sur} cet objet
        objets = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.objet && x.position.cibleId === ceci.id && ElementsJeuUtils.possedeCetEtat(x, "visible"));
        resultat.succes = true;
        // lieu
      } else if (Classe.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        // retrouver les objets présents dans le lieu
        objets = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.lieu && x.position.cibleId === ceci.id && ElementsJeuUtils.possedeCetEtat(x, "visible"));
        console.warn("objets contenus dans le lieu:", objets);
        resultat.succes = true;
      } else {
        console.error("executerAfficherContenu: classe racine pas pris en charge:", ceci.classe);
      }

      if (resultat.succes) {

        // afficher d'abord les aperçus

        // - objets sans apercu
        let objetsSansApercu = objets.filter(x => x.apercu === null);
        const nbObjetsSansApercus = objetsSansApercu.length;
        if (nbObjetsSansApercus > 0) {
          resultat.sortie = texteSiQuelqueChose;
          let curObjIndex = 0;
          objetsSansApercu.forEach(obj => {
            ++curObjIndex;
            resultat.sortie += ElementsJeuUtils.calculerIntitule(obj);
            if (curObjIndex < (nbObjetsSansApercus - 1)) {
              resultat.sortie += ", ";
            } else if (curObjIndex == (nbObjetsSansApercus - 1)) {
              resultat.sortie += " et ";
            } else {
              resultat.sortie += ".";
            }
          });
        } else {
          resultat.sortie = texteSiRien;
        }

        // - objets avec aperçu :
        let objetsAvecApercu = objets.filter(x => x.apercu !== null);

      }

    }
    return resultat;
  }

  /**
   * Renvoyer le contenu d'un objet ou d'un lieu.
   */
  public obtenirContenu(ceci: ElementJeu): Objet[] {
    let els: Objet[] = null;
    if (ceci) {
      if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
        els = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.objet && x.position.cibleId === ceci.id);
      } else if (Classe.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        els = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.lieu && x.position.cibleId === ceci.id);
      } else {
        console.error("obtenirContenu: classe racine pas pris en charge:", ceci.classe);
      }
    }
    return els;
  }

  /** Déplacer (ceci, joueur) vers (cela, joueur, ici). */
  private executerDeplacer(sujet: GroupeNominal, preposition: string, complement: GroupeNominal, ceci: Objet = null, cela: ElementJeu | Intitule = null): Resultat {

    console.log("executerDeplacer >>> sujet=", sujet, "preposition=", preposition, "complément=", complement, "ceci=", ceci, "cela=", cela);

    let resultat = new Resultat(false, '', 1);

    if (preposition !== "vers" && preposition !== "dans" && preposition !== 'sur') {
      console.error("executerDeplacer >>> préposition pas reconnue:", preposition);
    }

    let objet: Objet;
    let destination: ElementJeu;

    // trouver l’élément à déplacer

    switch (sujet.nom) {
      case "ceci":
        objet = ceci;
        break;
      case "joueur":
        objet = this.jeu.joueur;
        break;
      default:
        let correspondanceSujet = this.eju.trouverCorrespondance(sujet);
        // un élément trouvé
        if (correspondanceSujet.elements.length === 1) {
          objet = correspondanceSujet.objets[0];
          // aucun élément trouvé
        } else if (correspondanceSujet.elements.length === 0) {
          console.error("executerDeplacer >>> je n’ai pas trouvé l’objet:", sujet);
          // plusieurs éléments trouvés
        } else {
          console.error("executerDeplacer >>> j’ai trouvé plusieurs correspondances pour l’objet:", sujet);
        }
        break;
    }

    switch (complement.nom) {
      case 'cela':
        if (Classe.heriteDe(cela.classe, EClasseRacine.objet)) {
          destination = cela as Objet;
        } else {
          console.error("Déplacer vers cela: cela n'est pas un objet.");
        }
        break;

      case 'joueur':
        destination = this.jeu.joueur;
        break;

      case 'ici':
        destination = this.eju.curLieu;
        break;

      default:
        let correspondanceCompl = this.eju.trouverCorrespondance(complement);
        // un élément trouvé
        if (correspondanceCompl.elements.length === 1) {
          destination = correspondanceCompl.elements[0];
          // aucun élément trouvé
        } else if (correspondanceCompl.elements.length === 0) {
          console.error("executerDeplacer >>> je n’ai pas trouvé la destination:", complement);
          // plusieurs éléments trouvés
        } else {
          console.error("executerDeplacer >>> j’ai trouvé plusieurs correspondances pour la destination:", complement);
        }
        break;
    }

    // si on a trouver le sujet et la distination, effectuer le déplacement.
    if (objet && destination) {
      resultat = this.exectuterDeplacerObjetVersDestination(objet, preposition, destination);
    }

    return resultat;
  }

  private exectuterDeplacerObjetVersDestination(objet: Objet, preposition: string, destination: ElementJeu): Resultat {
    let resultat = new Resultat(false, '', 1);

    // TODO: vérifications
    objet.position = new PositionObjet(
      PrepositionSpatiale[preposition],
      Classe.heriteDe(destination.classe, EClasseRacine.lieu) ? EClasseRacine.lieu : EClasseRacine.objet,
      destination.id
    );

    // si l'objet à déplacer est le joueur, modifier la visibilité des objets
    if (objet.id === this.jeu.joueur.id) {
      // la visibilité des objets a changé
      this.eju.majVisibiliteDesObjets();

      // si l'objet à déplacer n'est pas le joueur
    } else {
      // si la destination est un lieu
      if (objet.position.cibleType === EClasseRacine.lieu) {
        // l'objet n'est pas possédé
        objet.possede = false;
        // si la destination est le lieu actuel, l'objet est visible
        if (objet.position.cibleId === this.eju.curLieu.id) {
          objet.visible = true;
          // si c'est un autre lieu, il n'est pas visible.
        } else {
          objet.visible = false;
        }
        // si la destination est un objet
      } else {
        // si la destination est le joueur, l'objet est visible et possédé
        if (destination.id === this.jeu.joueur.id) {
          objet.visible = true;
          objet.possede = true;
          // sinon, on va analyser le contenant qui est forcément un objet.
        } else {
          // forcément l'objet n'est pas possédé
          objet.possede = false;
          this.eju.majVisibiliteObjet(objet);
        }
      }
    }
    resultat.succes = true;
    return resultat;
  }

  private executerEffacer(ceci: ElementJeu = null): Resultat {
    let resultat = new Resultat(false, '', 1);
    if (ceci) {
      // objet
      if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
        const indexObjet = this.jeu.objets.indexOf((ceci as Objet));
        if (indexObjet !== -1) {
          this.jeu.objets.splice(indexObjet, 1);
          resultat.succes = true;
        }
        // lieu
      } else if (Classe.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        const indexLieu = this.jeu.objets.indexOf((ceci as Objet));
        if (indexLieu !== -1) {
          this.jeu.lieux.splice(indexLieu, 1);
          resultat.succes = true;
        }
      } else {
        console.error("executerEffacer: classe racine pas pris en charge:", ceci.classe);
      }
    }
    return resultat;
  }

  /** Changer quelque chose dans le jeu */
  private executerChanger(instruction: ElementsPhrase, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    let resultat = new Resultat(false, '', 1);

    if (instruction.sujet) {
      switch (instruction.sujet.nom.toLowerCase()) {
        case 'joueur':
          resultat = this.executerJoueur(instruction, ceci, cela);
          break;

        case 'historique':
          resultat = this.executerHistorique(instruction);
          break;

        // case 'inventaire':
        //   resultat = this.executerInventaire(instruction);
        //   break;

        case 'ceci':
          if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
            resultat = this.executerElementJeu(ceci as Objet, instruction);
          } else {
            console.error("executer changer ceci: ceci n'est pas un objet.");
          }
          break;

        case 'cela':
          if (Classe.heriteDe(cela.classe, EClasseRacine.objet)) {
            resultat = this.executerElementJeu(cela as Objet, instruction);
          } else {
            console.error("executer changer cela: cela n'est pas un objet.");
          }
          break;

        default:
          let correspondance = this.eju.trouverCorrespondance(instruction.sujet);

          // PAS OBJET ET PAS LIEU
          if (correspondance.objets.length === 0 && correspondance.lieux.length === 0) {
            console.error("executerChanger: pas trouvé l’élément " + instruction.sujet);

            // OBJET(S) SEULEMENT
          } else if (correspondance.lieux.length === 0) {
            if (correspondance.objets.length === 1) {
              resultat = this.executerElementJeu(correspondance.objets[0], instruction);
            } else {
              console.error("executerChanger: plusieurs objets trouvés:", correspondance);
            }
            // LIEU(X) SEULEMENT
          } else if (correspondance.objets.length === 0) {
            if (correspondance.lieux.length === 1) {
              resultat = this.executerElementJeu(correspondance.objets[0], instruction);
            } else {
              console.error("executerChanger: plusieurs lieux trouvés:", correspondance);
            }
          } else {
            console.error("executerChanger: trouvé lieu(x) ET objet(s):", correspondance);
          }
          break;
      }
    } else {
      console.error("executerChanger : pas de sujet, instruction:", instruction);
    }

    return resultat;
  }

  private executerReaction(instruction: ElementsPhrase, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    let resultat = new Resultat(false, '', 1);

    if (instruction.complement1) {
      switch (instruction.complement1.toLocaleLowerCase()) {
        case 'réaction de ceci':
          if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(ceci as Objet, null);
          } else {
            console.error("Exécuter réaction de ceci: ceci n'est pas un objet");
          }
          break;
        case 'réaction de cela':
          if (Classe.heriteDe(cela.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(cela as Objet, null);
          } else {
            console.error("Exécuter réaction de cela: cela n'est pas un objet");
          }
          break;
        case 'réaction de ceci concernant cela':
        case 'réaction de ceci à cela':
          if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(ceci as Objet, cela);
          } else {
            console.error("Exécuter réaction de ceci à cela: ceci n'est pas un objet");
          }
          break;
        case 'réaction de cela concernant ceci':
        case 'réaction de cela à ceci':
          if (Classe.heriteDe(cela.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(cela as Objet, ceci);
          } else {
            console.error("Exécuter réaction de cela à ceci: cela n'est pas un objet");
          }
          break;

        default:
          console.error("executerReaction : sujet autre que « réaction de ceci », « réaction de cela », « réaction de ceci à cela » pas pris en charge, instruction:", instruction);
      }
    } else {
      console.error("executerReaction : pas de sujet, instruction:", instruction);
    }

    return resultat;
  }

  /**
   * 
   */
  private suiteExecuterReaction(personne: ElementJeu, sujet: Intitule) {

    let resultat = new Resultat(false, '', 1);
    let reaction: Reaction = null;

    // vérifier que la personne est bien un objet
    if (!personne) {
      console.error("suiteExecuterReaction: la personne est null");
    }
    if (!Classe.heriteDe(personne.classe, EClasseRacine.personne)) {
      if (!Classe.heriteDe(personne.classe, EClasseRacine.objet)) {
        console.error("suiteExecuterReaction: la personne qui doit réagir n’est ni une personne, ni un objet:", personne);
      } else {
        console.warn("suiteExecuterReaction: la personne qui doit réagir n’est pas une personne:", personne);
      }
    }

    // réaction à un sujet
    if (sujet) {
      console.log("suiteExecuterReaction: sujet=", sujet, " personne=", personne);
      reaction = (personne as Objet).reactions.find(x => x.sujet && x.sujet.nom === sujet.intitule.nom && x.sujet.epithete == sujet.intitule.epithete);
    }
    // si pas de réaction à un sujet, prendre réaction par défaut (sujet null)
    if (!reaction) {
      console.log("suiteExecuterReaction: sujet par défaut");
      reaction = (personne as Objet).reactions.find(x => x.sujet == null);
    }
    // on a trouvé une réaction
    if (reaction) {
      // TODO: faut-il fournir ceci et cela ?
      resultat = this.executerInstructions(reaction.instructions, null, null);
      // on n’a pas trouvé de réaction
    } else {
      // si aucune réaction ce n’est pas normal: soit il faut une réaction par défaut, soit il ne faut pas passer par ici.
      console.error("suiteExecuterReaction : cette personne n’a pas de réaction par défaut:", personne);
    }

    return resultat;
  }

  /** Exécuter une instruction qui cible l'historique. */
  private executerHistorique(instruction: ElementsPhrase) {
    let resultat = new Resultat(false, '', 1);
    if (instruction.verbe.toLocaleLowerCase() === 'contient') {
      let valeur = instruction.complement1.trim();
      // trouver valeur dans l’historique
      let foundIndex = this.jeu.sauvegardes.indexOf(valeur);

      // SUPPRIMER la valeur de l’historique
      if (instruction.negation) {
        // supprimer seulement si présente
        if (foundIndex !== -1) {
          this.jeu.sauvegardes.splice(foundIndex, 1);
          resultat.succes = true;
        }
        // AJOUTER une valeur à l’historique
      } else {
        // ajouter seulement si pas encore présente
        if (foundIndex === -1) {
          this.jeu.sauvegardes.push(valeur);
          resultat.succes = true;
        }
      }
    }
    return resultat;
  }

  /** Exécuter une instruction qui cible le joueur */
  private executerJoueur(instruction: ElementsPhrase, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule): Resultat {
    let resultat = new Resultat(false, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'se trouve':
        resultat = this.executerDeplacer(instruction.sujet, instruction.preposition, instruction.sujetComplement1);
        break;
      case 'possède':
        // console.error("POSSÈDE : ", instruction);
        if (instruction.sujetComplement1) {
          resultat = this.executerDeplacer(instruction.sujetComplement1, "vers", instruction.sujet);
        } else if (instruction.complement1) {
          let els: Objet[] = null;
          if (instruction.complement1.endsWith('contenu de ceci')) {
            if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
              els = this.obtenirContenu(ceci as Objet);
            } else {
              console.error("Joueur possède contenu de ceci: ceci n'est as un objet.");
            }
          } else if (instruction.complement1.endsWith('contenu de cela')) {
            if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
              els = this.obtenirContenu(cela as Objet);
            } else {
              console.error("Joueur possède contenu de cela: cela n'est as un objet.");
            }
          }
          if (els) {
            els.forEach(el => {
              resultat = this.exectuterDeplacerObjetVersDestination(el, 'vers', this.jeu.joueur);
            });
          }
        }
        break;

      default:
        console.error("executerJoueur : pas compris verbe", instruction.verbe, instruction);
        break;
    }
    return resultat;
  }

  // positionnerJoueur(position: string): Resultat {

  //   let resultat = new Resultat(true, '', 1);

  //   position = position.trim().replace(/^au |dans (le |la |l'|l’)|à l’intérieur (du|de l’|de l'|de la |des )|sur (le |la |l’|l'|les)/i, '');
  //   // chercher le lieu
  //   let lieuxTrouves = this.jeu.lieux.filter(x => StringUtils.normaliserMot(x.nom).startsWith(position));
  //   // si on n’a pas trouvé
  //   if (lieuxTrouves.length == 0) {
  //     console.error("positionnerJoueur : pas pu trouver le lieu correspondant à la position", position);
  //     resultat.succes = false;
  //     // si on a trouvé un lieu
  //   } else if (lieuxTrouves.length === 1) {
  //     this.jeu.position = lieuxTrouves[0].id;
  //     // si on a trouvé plusieurs lieux différents
  //   } else if (lieuxTrouves.length > 1) {
  //     // TODO: ajouter des mots en plus
  //     console.error("positionnerJoueur : plusieurs lieux trouvés pour la position", position);
  //     resultat.succes = false;
  //   }

  //   return resultat;
  // }

  // private executerInventaire(instruction: ElementsPhrase): Resultat {
  //   let resultat = new Resultat(false, '', 1);

  //   switch (instruction.verbe.toLowerCase()) {
  //     case 'contient':
  //       resultat = this.ajouterInventaire(instruction.sujetComplement);
  //       break;

  //     default:
  //       console.error("executerInventaire : pas compris verbe", instruction.verbe, instruction);
  //       break;
  //   }
  //   return resultat;
  // }

  private executerElementJeu(element: ElementJeu, instruction: ElementsPhrase): Resultat {

    let resultat = new Resultat(true, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'est':
        const nEstPas = instruction.negation && (instruction.negation.trim() === 'pas' || instruction.negation.trim() === 'plus');
        // états spéciaux
        if (instruction.complement1.startsWith("visible")) {
          (element as Objet).visible = !nEstPas;
        } else if (instruction.complement1.startsWith("invisible")) {
          (element as Objet).visible = nEstPas; // (inverse de visible)
        } else if (instruction.complement1.startsWith("possédé")) {
          (element as Objet).possede = !nEstPas;
        } else if (instruction.complement1.startsWith("porté")) {
          (element as Objet).porte = !nEstPas;
        } else if (instruction.complement1.startsWith("mangeable")) {
          (element as Objet).mangeable = !nEstPas;
        } else if (instruction.complement1.startsWith("buvable")) {
          (element as Objet).buvable = !nEstPas;
          // autres états
        } else {
          // n'est pas => retirer un état
          if (nEstPas) {
            console.log("executerElementJeu: retirer l’état '", instruction.complement1, "' ele=", element);
            ElementsJeuUtils.retirerEtat(element, instruction.complement1, null);
            // est => ajouter un état
          } else {
            console.log("executerElementJeu: ajouter l’état '", instruction.complement1, "'");
            ElementsJeuUtils.ajouterEtat(element, instruction.complement1);
          }
        }
        break;

      default:
        resultat.succes = false;
        console.error("executerElementJeu: pas compris le verbe:", instruction.verbe, instruction);
        break;
    }
    return resultat;
  }

  // ajouterInventaire(intitule: GroupeNominal): Resultat {

  //   let resultat = new Resultat(false, '', 1);

  //   if (intitule) {
  //     let objetTrouve = this.eju.trouverElementJeu(intitule, EmplacementElement.partout, true, false);
  //     if (objetTrouve === -1) {
  //       console.warn("ajouterInventaire > plusieurs objets trouvés:", intitule);
  //     } else if (objetTrouve) {
  //       const nouvelObjet = this.eju.prendreElementJeu(objetTrouve.id);
  //       let cible = nouvelObjet;
  //       // si l'inventaire contient déjà le même objet, augmenter la quantité
  //       let objInv = this.jeu.inventaire.objets.find(x => x.id == nouvelObjet.id);
  //       if (objInv) {
  //         objInv.quantite += 1;
  //         cible = objInv;
  //       } else {
  //         this.jeu.inventaire.objets.push(nouvelObjet);
  //       }
  //       resultat.succes = true;
  //     } else {
  //       console.warn("ajouterInventaire > objet pas trouvé:", intitule);
  //     }
  //   } else {
  //     console.error("ajouterInventaire >>> intitulé est null.");
  //   }
  //   return resultat;
  // }

  calculerDescription(description: string, nbAffichage: number, initial: boolean, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule) {
    let retVal = "";
    if (description) {
      const morceaux = description.split(/\[|\]/);
      let statut = new StatutCondition(nbAffichage, initial, morceaux, 0);
      // jamais une condition au début car dans ce cas ça donne une première chaine vide.
      let suivantEstCondition = false; // description.trim().startsWith("[");
      let afficherMorceauSuivant = true;
      // console.log("$$$$$$$$$$$ morceaux=", morceaux, "suivantEstCondition=", suivantEstCondition);
      for (let index = 0; index < morceaux.length; index++) {
        statut.curMorceauIndex = index;
        const curMorceau = morceaux[index];
        if (suivantEstCondition) {
          afficherMorceauSuivant = this.estConditionRemplie(curMorceau, statut, ceci, cela);
          suivantEstCondition = false;
        } else {
          if (afficherMorceauSuivant) {
            retVal += curMorceau;
          }
          suivantEstCondition = true;
        }
      }
    } else {
      retVal = "";
    }
    return retVal;
  }

  calculerDescriptionContenu(element: ElementJeu, nbAffichage: number) {

  }

  estConditionRemplie(condition: string, statut: StatutCondition, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule): boolean {

    let retVal = false;
    let conditionLC = condition.toLowerCase();
    const resultFois = conditionLC.match(xFois);

    if (resultFois) {
      statut.conditionDebutee = ConditionDebutee.fois;
      const nbFois = Number.parseInt(resultFois[1], 10);
      statut.nbChoix = Instructions.calculerNbChoix(statut);
      retVal = (statut.nbAffichage === nbFois);
      // Au hasard
      // TODO: au hasard
    } else if (conditionLC === "au hasard") {
      statut.conditionDebutee = ConditionDebutee.hasard;
      statut.dernIndexChoix = 1;
      // compter le nombre de choix
      statut.nbChoix = Instructions.calculerNbChoix(statut);
      // choisir un choix au hasard
      const rand = Math.random();
      statut.choixAuHasard = Math.floor(rand * statut.nbChoix) + 1;
      retVal = (statut.choixAuHasard == 1);
    } else if (conditionLC === "en boucle") {
      statut.conditionDebutee = ConditionDebutee.boucle;
      statut.dernIndexChoix = 1;
      // compter le nombre de choix
      statut.nbChoix = Instructions.calculerNbChoix(statut);
      retVal = (statut.nbAffichage % statut.nbChoix === 1);
    } else if (conditionLC === "initialement") {
      statut.conditionDebutee = ConditionDebutee.initialement;
      retVal = statut.initial;
    } else if (conditionLC.startsWith("si ")) {
      statut.conditionDebutee = ConditionDebutee.si;
      // TODO: vérifier le si
      statut.siVrai = this.cond.siEstVrai(conditionLC, null, ceci, cela);
      retVal = statut.siVrai;
    } else if (statut.conditionDebutee != ConditionDebutee.aucune) {
      retVal = false;
      switch (conditionLC) {

        case 'ou':
          if (statut.conditionDebutee == ConditionDebutee.hasard) {
            retVal = (statut.choixAuHasard === ++statut.dernIndexChoix);
          } else {
            console.warn("[ou] sans 'au hasard'.");
          }
          break;

        case 'puis':
          if (statut.conditionDebutee === ConditionDebutee.fois) {
            // toutes les fois suivant le dernier Xe fois
            retVal = (statut.nbAffichage > statut.plusGrandChoix);
          } else if (statut.conditionDebutee === ConditionDebutee.boucle) {
            // boucler
            statut.dernIndexChoix += 1;
            retVal = (statut.nbAffichage % statut.nbChoix === (statut.dernIndexChoix == statut.nbChoix ? 0 : statut.dernIndexChoix));
          } else if (statut.conditionDebutee === ConditionDebutee.initialement) {
            // quand on est plus dans initialement
            retVal = !statut.initial;
          } else {
            console.warn("[puis] sans 'fois', 'boucle' ou 'initialement'.");
          }
          break;

        case 'sinon':
          if (statut.conditionDebutee == ConditionDebutee.si) {
            retVal = !statut.siVrai;
          } else {
            console.warn("[sinon] sans 'si'.");
            retVal = false;
          }
          break;

        case 'fin choix':
          if (statut.conditionDebutee == ConditionDebutee.boucle || statut.conditionDebutee == ConditionDebutee.fois || statut.conditionDebutee == ConditionDebutee.hasard || statut.conditionDebutee == ConditionDebutee.initialement) {
            retVal = true;
          } else {
            console.warn("[fin choix] sans 'fois', 'boucle', 'hasard' ou 'initialement'.");
          }
          break;

        case 'fin si':
          if (statut.conditionDebutee == ConditionDebutee.si) {
            retVal = true;
          } else {
            console.warn("[fin si] sans 'si'.");
          }
          break;

        default:
          console.warn("je ne sais pas quoi faire pour:", conditionLC);
          break;
      }
    }

    console.log("estConditionRemplie", condition, statut, retVal);
    return retVal;
  }

  afficherSorties(lieu: Lieu) {
    let retVal: string;

    // ne pas afficher les sorties séparrées par une porte cachée

    // retrouver les voisins
    // - lieux
    let lieuxVoisins = lieu.voisins.filter(x => x.type === EClasseRacine.lieu);
    // - portes
    let portesVoisines = lieu.voisins.filter(x => x.type === EClasseRacine.porte);

    // retirer de la liste les voisins séparrés par une porte invisible
    if (lieuxVoisins.length > 0 && portesVoisines.length > 0) {
      portesVoisines.forEach(voisinPorte => {
        // retrouver la porte
        const porte = this.eju.getObjet(voisinPorte.id);
        // si la porte est invisible
        if (porte && !porte.visible) {
          // retirer de la liste le voisin lié
          const voisinIndex = portesVoisines.findIndex(x => x.localisation == voisinPorte.localisation);
          lieuxVoisins.splice(voisinIndex, 1);
        }
      });
    }

    if (lieuxVoisins.length > 0) {
      retVal = "\nSorties :";
      lieuxVoisins.forEach(voisin => {
        // if (voisin.type == EClasseRacine.lieu) {
        retVal += ("\n - " + this.afficherLocalisation(voisin.localisation, lieu.id, voisin.id));
        // }
      });
    } else {
      retVal = "\nIl n’y a pas de sortie.";
    }
    return retVal;
  }

  afficherLocalisation(localisation: Localisation, curLieuIndex: number, voisinIndex: number) {
    let retVal: string = null;
    let lieu = this.eju.getLieu(voisinIndex);
    let titreLieu = lieu.titre;
    switch (localisation) {
      case Localisation.nord:
        retVal = "nord (n)" + (lieu.visite ? (" − " + titreLieu) : '');
        break;
      case Localisation.sud:
        retVal = "sud (s) " + (lieu.visite ? (" − " + titreLieu) : '');
        break;
      case Localisation.est:
        retVal = "est (e)" + (lieu.visite ? (" − " + titreLieu) : '');
        break;
      case Localisation.ouest:
        retVal = "ouest (o)" + (lieu.visite ? (" − " + titreLieu) : '');
        break;
      case Localisation.bas:
        retVal = "descendre (de) − " + titreLieu;
        break;
      case Localisation.haut:
        retVal = "monter (mo) − " + titreLieu;
        break;
      case Localisation.exterieur:
        retVal = "sortir (so) − " + titreLieu;
        break;
      case Localisation.interieur:
        retVal = "entrer (en) − " + titreLieu;
        break;

      default:
        retVal = localisation.toString();
    }
    return retVal;
  }


}