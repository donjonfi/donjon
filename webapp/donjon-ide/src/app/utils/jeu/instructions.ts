import { ConditionDebutee, StatutCondition, xFois } from '../../models/jouer/statut-conditions';
import { EClasseRacine, EEtatsBase } from 'src/app/models/commun/constantes';
import { PositionObjet, PrepositionSpatiale } from '../../models/jeu/position-objet';

import { ClasseUtils } from '../commun/classe-utils';
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

      if (statut.morceaux[index - 2] === "puis") {
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

  private interpreterContenuDire(contenu: string, nbExecutions: number, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null) {
    // description
    if (contenu.includes("[description")) {
      if (contenu.includes("[description ici]")) {
        const descIci = this.calculerDescription(this.eju.curLieu.description, ++this.eju.curLieu.nbAffichageDescription, null, ceci, cela);
        contenu = contenu.replace(/\[description ici\]/g, descIci);
      }
      if (contenu.includes("[description ceci]")) {
        if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
          const objCeci = ceci as Objet;
          const descCeci = this.calculerDescription(objCeci.description, ++objCeci.nbAffichageDescription, this.jeu.etats.possedeEtatIdElement(objCeci, this.jeu.etats.intactID), ceci, cela);
          contenu = contenu.replace(/\[description ceci\]/g, descCeci);
        } else {
          console.error("interpreterContenuDire: Description de ceci: ceci n'est pas un objet");
        }
      }
      if (contenu.includes("[description cela]")) {
        if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
          const objCela = cela as Objet;
          const descCela = this.calculerDescription((cela as Objet).description, ++(cela as Objet).nbAffichageDescription, this.jeu.etats.possedeEtatIdElement(objCela, this.jeu.etats.intactID), ceci, cela);
          contenu = contenu.replace(/\[description cela\]/g, descCela);
        } else {
          console.error("interpreterContenuDire: Description de cela: cela n'est pas un objet");
        }
      }
    }

    // Aperçu (d’un objet)
    if (contenu.includes("[aperçu")) {
      if (contenu.includes("[aperçu ceci]")) {
        if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
          const objCeci = ceci as Objet;
          const apercuCeci = this.calculerDescription(objCeci.apercu, ++objCeci.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(objCeci, this.jeu.etats.intactID), ceci, cela);
          contenu = contenu.replace(/\[aperçu ceci\]/g, apercuCeci);
        } else {
          console.error("interpreterContenuDire: aperçu de ceci: ceci n'est pas un objet");
        }
      }
      if (contenu.includes("[aperçu cela]")) {
        if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
          const objCela = cela as Objet;
          const apercuCela = this.calculerDescription((cela as Objet).apercu, ++(cela as Objet).nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(objCela, this.jeu.etats.intactID), ceci, cela);
          contenu = contenu.replace(/\[aperçu cela\]/g, apercuCela);
        } else {
          console.error("interpreterContenuDire: aperçu de cela: cela n'est pas un objet");
        }
      }
    }

    // contenu
    if (contenu.includes("[contenu")) {

      if (contenu.includes("[contenu ici]")) {
        // (ne pas afficher les objets cachés de ici)
        const contenuIci = this.executerDecrireContenu(this.eju.curLieu, "{n}Vous voyez ", "", false);
        contenu = contenu.replace(/\[contenu ici\]/g, contenuIci.sortie);
      }
      if (contenu.includes("[contenu ceci]")) {
        if (ceci && ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
          // (afficher les objets cachés de cela)
          const contenuCeci = this.executerDecrireContenu((ceci as Objet), "{n}Vous voyez ", "{n}C'est vide.", true);
          contenu = contenu.replace(/\[contenu ceci\]/g, contenuCeci.sortie);
        } else {
          console.error("interpreterContenuDire: contenu de ceci: ceci n'est pas un objet");
        }
      }
      if (contenu.includes("[contenu cela]")) {
        if (cela && ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
          // (afficher les objets cachés de cela)
          const contenuCela = this.executerDecrireContenu((cela as Objet), "{n}Vous voyez ", "{n}C'est vide.", true);
          contenu = contenu.replace(/\[contenu cela\]/g, contenuCela.sortie);
        } else {
          console.error("interpreterContenuDire: contenu de cela: cela n'est pas un objet");
        }
      }
    }

    // statut (porte, contenant)
    if (contenu.includes("[statut")) {
      if (contenu.includes("[statut ceci]")) {
        if (ceci && ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
          const statutCeci = this.afficherStatut(ceci as Objet);
          contenu = contenu.replace(/\[statut ceci\]/g, statutCeci);
        } else {
          console.error("interpreterContenuDire: statut de ceci: ceci n'est pas un objet");
        }
      }
      if (contenu.includes("[statut cela]")) {
        if (cela && ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
          const statutCela = this.afficherStatut(cela as Objet);
          contenu = contenu.replace(/\[statut cela\]/g, statutCela);
        } else {
          console.error("interpreterContenuDire: statut de cela: cela n'est pas un objet");
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

    // pronom
    if (contenu.includes("[pronom")) {
      if (contenu.includes("[pronom ceci]")) {
        if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
          const pronomCeci = ((ceci as Objet).genre === Genre.f ? "elle" : "il") + ((ceci as Objet).nombre === Nombre.p ? "s" : "");
          contenu = contenu.replace(/\[pronom ceci\]/g, pronomCeci);
        } else {
          console.error("interpreterContenuDire: pronom ceci: ceci n'est pas un objet");
        }
      }
      if (contenu.includes("[pronom cela]")) {
        if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
          const pronomCela = ((cela as Objet).genre === Genre.f ? "elle" : "il") + ((cela as Objet).nombre === Nombre.p ? "s" : "");
          contenu = contenu.replace(/\[pronom cela\]/g, pronomCela);
        } else {
          console.error("interpreterContenuDire: pronom cela: cela n'est pas un objet");
        }
      }
    }

    // accord
    if (contenu.includes("[accord")) {
      if (contenu.includes("[accord ici]")) {
        const accordIci = (this.eju.curLieu.genre === Genre.f ? "e" : "") + (this.eju.curLieu.nombre === Nombre.p ? "s" : "");
        contenu = contenu.replace(/\[accord ici\]/g, accordIci);
      }
      if (contenu.includes("[accord ceci]")) {
        if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
          const accordCeci = ((ceci as Objet).genre === Genre.f ? "e" : "") + ((ceci as Objet).nombre === Nombre.p ? "s" : "");
          contenu = contenu.replace(/\[accord ceci\]/g, accordCeci);
        } else {
          console.error("interpreterContenuDire: accord ceci: ceci n'est pas un objet");
        }
      }
      if (contenu.includes("[accord cela]")) {
        if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
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


  /** Exécuter une liste d’instructions */
  public executerInstructions(instructions: Instruction[], ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    let resultat = new Resultat(true, '', 0);
    if (instructions && instructions.length > 0) {
      instructions.forEach(ins => {
        const sousResultat = this.executerInstruction(ins, ceci, cela);
        resultat.nombre += sousResultat.nombre;
        resultat.succes = (resultat.succes && sousResultat.succes);
        resultat.sortie += sousResultat.sortie;
        resultat.stopper = resultat.stopper || sousResultat.stopper;
        resultat.continuer = resultat.continuer || sousResultat.continuer;
      });
    }

    return resultat;
  }

  /**
   * Calculer une description en tenant compte des balises conditionnelles et des états actuels.
   */
  calculerDescription(description: string, nbAffichage: number, intact: boolean, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule) {
    let retVal = "";
    if (description) {
      const morceaux = description.split(/\[|\]/);
      let statut = new StatutCondition(nbAffichage, intact, morceaux, 0);
      // jamais une condition au début car dans ce cas ça donne une première chaine vide.
      let suivantEstCondition = false; // description.trim().startsWith("[");
      let afficherMorceauSuivant = true;
      // console.log("$$$$$$$$$$$ morceaux=", morceaux, "suivantEstCondition=", suivantEstCondition);
      for (let index = 0; index < morceaux.length; index++) {
        statut.curMorceauIndex = index;
        const curMorceau = morceaux[index];
        if (suivantEstCondition) {
          afficherMorceauSuivant = this.estConditionDescriptionRemplie(curMorceau, statut, ceci, cela);
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

  /** Vérifier si une condition [] est remplie. */
  private estConditionDescriptionRemplie(condition: string, statut: StatutCondition, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule): boolean {

    let retVal = false;
    let conditionLC = condition.toLowerCase();
    const resultFois = conditionLC.match(xFois);

    // X-ÈME FOIS
    if (resultFois) {
      statut.conditionDebutee = ConditionDebutee.fois;
      const nbFois = Number.parseInt(resultFois[1], 10);
      statut.nbChoix = Instructions.calculerNbChoix(statut);
      retVal = (statut.nbAffichage === nbFois);
      // AU HASARD
    } else if (conditionLC === "au hasard") {
      statut.conditionDebutee = ConditionDebutee.hasard;
      statut.dernIndexChoix = 1;
      // compter le nombre de choix
      statut.nbChoix = Instructions.calculerNbChoix(statut);
      // choisir un choix au hasard
      const rand = Math.random();
      statut.choixAuHasard = Math.floor(rand * statut.nbChoix) + 1;
      retVal = (statut.choixAuHasard == 1);
      // EN BOUCLE
    } else if (conditionLC === "en boucle") {
      statut.conditionDebutee = ConditionDebutee.boucle;
      statut.dernIndexChoix = 1;
      // compter le nombre de choix
      statut.nbChoix = Instructions.calculerNbChoix(statut);
      retVal = (statut.nbAffichage % statut.nbChoix === 1);
      // INITIALEMENT
    } else if (conditionLC === "initialement") {
      statut.conditionDebutee = ConditionDebutee.initialement;
      retVal = statut.initial;
      // SI
    } else if (conditionLC.startsWith("si ")) {
      statut.conditionDebutee = ConditionDebutee.si;
      statut.siVrai = this.cond.siEstVraiSansLien(conditionLC, null, ceci, cela);
      retVal = statut.siVrai;
      // SUITES
    } else if (statut.conditionDebutee !== ConditionDebutee.aucune) {
      retVal = false;
      switch (conditionLC) {
        // OU
        case 'ou':
          if (statut.conditionDebutee === ConditionDebutee.hasard) {
            retVal = (statut.choixAuHasard === ++statut.dernIndexChoix);
          } else {
            console.warn("[ou] sans 'au hasard'.");
          }
          break;
        // PUIS
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
        // SINON
        case 'sinon':
          if (statut.conditionDebutee === ConditionDebutee.si) {
            retVal = !statut.siVrai;
          } else {
            console.warn("[sinon] sans 'si'.");
            retVal = false;
          }
          break;
        // FIN CHOIX
        case 'fin choix':
          if (statut.conditionDebutee === ConditionDebutee.boucle || statut.conditionDebutee === ConditionDebutee.fois || statut.conditionDebutee == ConditionDebutee.hasard || statut.conditionDebutee === ConditionDebutee.initialement) {
            retVal = true;
          } else {
            console.warn("[fin choix] sans 'fois', 'boucle', 'hasard' ou 'initialement'.");
          }
          break;
        // FIN SI
        case 'fin si':
          if (statut.conditionDebutee === ConditionDebutee.si) {
            retVal = true;
          } else {
            console.warn("[fin si] sans 'si'.");
          }
          break;

        default:
          console.warn("estConditionDescriptionRemplie > je ne sais pas quoi faire pour cette balise :", conditionLC);
          break;
      }
    }

    console.log("estConditionDescriptionRemplie", condition, statut, retVal);
    return retVal;
  }


  /** Exécuter une instruction */
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
      const estVrai = this.cond.siEstVraiAvecLiens(null, instruction.condition, ceci, cela);
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
        sousResultat = this.executerInfinitif(instruction.instruction, instruction.nbExecutions, ceci, cela);
      } else {
        console.warn("executerInstruction : pas d'infinitif :", instruction);
      }
    }
    resultat.sortie += sousResultat.sortie;
    resultat.stopper = resultat.stopper || sousResultat.stopper;
    resultat.continuer = resultat.continuer || sousResultat.continuer;

    // console.warn("exInstruction >>> instruction=", instruction, "resultat=", resultat);

    return resultat;
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
        if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
          sousResultat = this.executerDeplacer(instruction.sujet, instruction.preposition, instruction.sujetComplement1, ceci as Objet, cela);
          resultat.succes = sousResultat.succes;
        } else {
          console.error("Exécuter infinitif: On ne peut pas déplacer un intitulé.");
          resultat.succes = false;
        }
        break;

      case 'effacer':
        if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
          sousResultat = this.executerEffacer(ceci as Objet);
          resultat.succes = sousResultat.succes;
        } else {
          console.error("Exécuter infinitif: On ne peut pas effacer un intitulé.");
          resultat.succes = false;
        }
        break;

      case 'terminer':
        if (instruction.sujet && instruction.sujet.nom === 'jeu') {
          this.jeu.termine = true;
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
          console.error("executerInfinitif >> exécuter >> complément autre que  « réaction de … » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;

      case 'stopper':
        // Stopper l’action en cours (évènement AVANT spécial)
        if (instruction?.sujet.nom?.toLocaleLowerCase() === 'action') {
          resultat.stopper = true;
          resultat.succes = true;
        } else {
          console.error("executerInfinitif >> stopper >> sujet autre que  « action » pas pris en charge. sujet=", instruction.sujet);
          resultat.succes = false;
        }
        break;

      case 'continuer':
        // Il faut continuer l’action en cours (évènement APRÈS spécial)
        if (instruction?.sujetComplement1.nom?.toLocaleLowerCase() === 'action') {
          resultat.continuer = true;
          resultat.succes = true;
        } else {
          console.error("executerInfinitif >> continuer >> complément autre que  « action » pas pris en charge. sujet=", instruction.sujet);
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
   * Retrouver les objets contenus dans ceci.
   * En cas d’erreur null est retourné plutôt qu’on tableau d’objets.
   */
  private trouverContenu(ceci: ElementJeu, inclureObjetsCachesDeCeci: boolean) {
    let objets: Objet[] = null;
    if (ceci) {
      // objet
      if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
        // retrouver les objets {contenus dans/posés sur} cet objet
        objets = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.objet && x.position.cibleId === ceci.id
          // && ElementsJeuUtils.possedeCetEtat(x, "visible"));
          && this.jeu.etats.estVisible(x, this.eju));
        // si on ne doit pas lister les objets cachés, les enlever
        if (!inclureObjetsCachesDeCeci) {
          objets = objets.filter(x => !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.cacheID));
        }
        // console.warn("objets contenus dans ceci:", objets, "ceci objet=", ceci);
        // lieu
      } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        // retrouver les objets présents dans le lieu
        objets = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.lieu && x.position.cibleId === ceci.id
          && this.jeu.etats.estVisible(x, this.eju));
        if (!inclureObjetsCachesDeCeci) {
          objets = objets.filter(x => !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.cacheID));
        }
        // console.warn("objets contenus dans ceci:", objets, "ceci lieu=", ceci);
      } else {
        console.error("executerAfficherContenu: classe racine pas pris en charge:", ceci.classe);
      }
    }
    return objets;
  }

  /**
   * Lister le contenu d'un objet ou d'un lieu.
   * Remarque: le contenu invisible n'est pas affiché.
   */
  public executerListerContenu(ceci: ElementJeu, afficherObjetsCachesDeCeci: boolean): Resultat {

    let resultat = new Resultat(false, '', 1);
    const objets = this.trouverContenu(ceci, afficherObjetsCachesDeCeci);

    // si la recherche n’a pas retourné d’erreur
    if (objets !== null) {
      resultat.succes = true;

      // AFFICHER LES ÉLÉMENTS DIRECTS
      const nbObjets = objets.length;
      if (nbObjets > 0) {
        let curObjIndex = 0;
        objets.forEach(obj => {
          ++curObjIndex;
          resultat.sortie += "\n - " + ElementsJeuUtils.calculerIntitule(obj);

          // S’IL S’AGIT D’UN SUPPORT, AFFICHER LES ÉLÉMENTS POSITIONNÉS DESSUS
          if (ClasseUtils.heriteDe(obj.classe, EClasseRacine.support)) {

          }

        });

        // AFFICHER LES ÉLÉMENTS POSITIONNÉS SUR DES SUPPORTS
        let supportsSansApercu = objets.filter(x => ClasseUtils.heriteDe(x.classe, EClasseRacine.support));
        supportsSansApercu.forEach(support => {
          // ne pas afficher les objets cachés du support (on ne l’examine pas directement)
          const sousRes = this.executerListerContenu(support, false);
          resultat.sortie += sousRes.sortie;
        });

      }

    }
    return resultat;
  }

  /**
   * Décrire le contenu d'un objet ou d'un lieu.
   * Remarque: le contenu invisible n'est pas affiché.
   */
  public executerDecrireContenu(ceci: ElementJeu, texteSiQuelqueChose: string, texteSiRien: string, afficherObjetsCachesDeCeci: boolean): Resultat {

    let resultat = new Resultat(false, '', 1);
    const objets = this.trouverContenu(ceci, afficherObjetsCachesDeCeci);

    // si la recherche n’a pas retourné d’erreur
    if (objets !== null) {
      resultat.succes = true;

      // A.1 AFFICHER ÉLÉMENTS AVEC UN APERÇU

      // - objets avec aperçu (ne pas lister les objets décoratifs):
      let objetsAvecApercu = objets.filter(x => x.apercu !== null && !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID));
      const nbObjetsAvecApercus = objetsAvecApercu.length;

      objetsAvecApercu.forEach(obj => {
        resultat.sortie += "{n}" + this.calculerDescription(obj.apercu, obj.nbAffichageApercu, this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.intactID), null, null);
        // B.2 SI C’EST UN SUPPPORT, AFFICHER SON CONTENU (VISIBLE et NON Caché)
        if (ClasseUtils.heriteDe(obj.classe, EClasseRacine.support)) {
          // ne pas afficher objets cachés du support, on ne l’examine pas directement
          const sousRes = this.executerDecrireContenu(obj, ("{n}Sur " + ElementsJeuUtils.calculerIntitule(obj) + " il y a "), "", false);
          resultat.sortie += sousRes.sortie;
        }
      });

      // B. AFFICHER LES ÉLÉMENTS POSITIONNÉS SUR DES SUPPORTS DÉCORATIFS
      let supportsDecoratifs = objets.filter(x => this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID) && ClasseUtils.heriteDe(x.classe, EClasseRacine.support));

      supportsDecoratifs.forEach(support => {
        // ne pas afficher les objets cachés du support (on ne l’examine pas directement)
        const sousRes = this.executerDecrireContenu(support, ("{n}Sur " + ElementsJeuUtils.calculerIntitule(support) + " il y a "), "", false);
        resultat.sortie += sousRes.sortie;
      });

      // C.1 AFFICHER ÉLÉMENTS SANS APERÇU

      // - objets sans apercu (ne pas lister les éléments décoratifs)
      let objetsSansApercu = objets.filter(x => x.apercu === null && !this.jeu.etats.possedeEtatIdElement(x, this.jeu.etats.decoratifID));

      const nbObjetsSansApercus = objetsSansApercu.length;
      if (nbObjetsSansApercus > 0) {
        resultat.sortie += texteSiQuelqueChose;
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

        // C.2 AFFICHER LES ÉLÉMENTS POSITIONNÉS SUR DES SUPPORTS
        let supportsSansApercu = objetsSansApercu.filter(x => ClasseUtils.heriteDe(x.classe, EClasseRacine.support));
        supportsSansApercu.forEach(support => {
          // ne pas afficher les objets cachés du support (on ne l’examine pas directement)
          const sousRes = this.executerDecrireContenu(support, ("{n}Sur " + ElementsJeuUtils.calculerIntitule(support) + " il y a "), ("{n}Il n’y a rien sur " + ElementsJeuUtils.calculerIntitule(support)), false);
          resultat.sortie += sousRes.sortie;
        });

      }

      // si on n’a encore rien affiché, afficher le texte spécifique
      if (!resultat.sortie) {
        resultat.sortie = texteSiRien;
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
      if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
        els = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.objet && x.position.cibleId === ceci.id);
      } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {
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
        if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
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

  /**
   * Déplacer un élément du jeu.
   */
  private exectuterDeplacerObjetVersDestination(objet: Objet, preposition: string, destination: ElementJeu): Resultat {
    let resultat = new Resultat(false, '', 1);

    // TODO: vérifications
    objet.position = new PositionObjet(
      PrepositionSpatiale[preposition],
      ClasseUtils.heriteDe(destination.classe, EClasseRacine.lieu) ? EClasseRacine.lieu : EClasseRacine.objet,
      destination.id
    );

    // si l'objet à déplacer est le joueur, modifier la visibilité des objets
    if (objet.id === this.jeu.joueur.id) {
      // la présence des objets a changé
      this.eju.majPresenceDesObjets();

      // si l'objet à déplacer n'est pas le joueur
    } else {
      // si la destination est un lieu
      if (objet.position.cibleType === EClasseRacine.lieu) {
        // l'objet n'est plus possédé
        this.jeu.etats.retirerEtatElement(objet, EEtatsBase.possede);
        // si la destination est le lieu actuel, l'objet est présent
        if (objet.position.cibleId === this.eju.curLieu.id) {
          this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.present);
          // si c'est un autre lieu, l’objet n'est plus présent.
        } else {
          this.jeu.etats.retirerEtatElement(objet, EEtatsBase.present);
        }
        // si la destination est un objet
      } else {
        // si la destination est le joueur, l'objet est présent et possédé
        if (destination.id === this.jeu.joueur.id) {
          this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.present);
          this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.possede);
          // sinon, on va analyser le contenant qui est forcément un objet.
        } else {
          // forcément l'objet n'est pas possédé
          // TODO: un objet dans un contenant possédé est-il possédé ?
          this.jeu.etats.retirerEtatElement(objet, EEtatsBase.possede);
          this.eju.majPresenceObjet(objet);
        }
      }
    }

    // l’objet a été déplacé
    this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.deplace);
    // la destination a été modifiée
    this.jeu.etats.ajouterEtatElement(destination, EEtatsBase.modifie);

    resultat.succes = true;
    return resultat;
  }

  /**
   * Effacer un élément du jeu.
   */
  private executerEffacer(ceci: ElementJeu = null): Resultat {
    let resultat = new Resultat(false, '', 1);
    if (ceci) {
      // objet
      if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
        const indexObjet = this.jeu.objets.indexOf((ceci as Objet));
        if (indexObjet !== -1) {
          this.jeu.objets.splice(indexObjet, 1);
          resultat.succes = true;
        }
        // lieu
      } else if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.lieu)) {
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
          if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
            resultat = this.executerElementJeu(ceci as Objet, instruction);
          } else {
            console.error("executer changer ceci: ceci n'est pas un objet.");
          }
          break;

        case 'cela':
          if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
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

  /**
   * Exécuter une instruction de type "réaction".
   * @param instruction 
   * @param ceci 
   * @param cela 
   */
  private executerReaction(instruction: ElementsPhrase, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null): Resultat {

    let resultat = new Resultat(false, '', 1);

    if (instruction.complement1) {
      switch (instruction.complement1.toLocaleLowerCase()) {
        case 'réaction de ceci':
          if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(ceci as Objet, null);
          } else {
            console.error("Exécuter réaction de ceci: ceci n'est pas un objet");
          }
          break;
        case 'réaction de cela':
          if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(cela as Objet, null);
          } else {
            console.error("Exécuter réaction de cela: cela n'est pas un objet");
          }
          break;
        case 'réaction de ceci concernant cela':
        case 'réaction de ceci à cela':
          if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(ceci as Objet, cela);
          } else {
            console.error("Exécuter réaction de ceci à cela: ceci n'est pas un objet");
          }
          break;
        case 'réaction de cela concernant ceci':
        case 'réaction de cela à ceci':
          if (ClasseUtils.heriteDe(cela.classe, EClasseRacine.objet)) {
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
   * Exécuter la réaction d'une personne à un sujet (ou non).
   */
  private suiteExecuterReaction(personne: ElementJeu, sujet: Intitule) {

    let resultat = new Resultat(false, '', 1);
    let reaction: Reaction = null;

    // vérifier que la personne est bien un objet
    if (!personne) {
      console.error("suiteExecuterReaction: la personne est null");
    }
    if (!ClasseUtils.heriteDe(personne.classe, EClasseRacine.personne)) {
      if (!ClasseUtils.heriteDe(personne.classe, EClasseRacine.objet)) {
        console.error("suiteExecuterReaction: la personne qui doit réagir n’est ni une personne, ni un objet:", personne);
      } else {
        console.warn("suiteExecuterReaction: la personne qui doit réagir n’est pas une personne:", personne);
      }
    }

    // réaction à un sujet
    if (sujet) {
      console.log("suiteExecuterReaction: sujet=", sujet, " personne=", personne);
      // rechercher s’il y a une des réaction qui comprend ce sujet
      reaction = (personne as Objet).reactions
        .find(x => x.sujets && x.sujets.some(y => y.nom === sujet.intitule.nom && y.epithete === sujet.intitule.epithete));
      // si on n’a pas de résultat, rechercher le sujet « sujet inconnu »:
      if (!reaction) {
        reaction = (personne as Objet).reactions
          .find(x => x.sujets && x.sujets.some(y => y.nom === "sujet" && y.epithete === "inconnu"));
      }
    }
    // si pas de réaction à un sujet, prendre réaction par défaut (aucun sujet)
    if (!reaction) {
      console.log("suiteExecuterReaction: réaction à aucun sujet");
      reaction = (personne as Objet).reactions
        .find(x => x.sujets && x.sujets.some(y => y.nom === "aucun" && y.epithete === "sujet"));
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
            if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
              els = this.obtenirContenu(ceci as Objet);
            } else {
              console.error("Joueur possède contenu de ceci: ceci n'est as un objet.");
            }
          } else if (instruction.complement1.endsWith('contenu de cela')) {
            if (ClasseUtils.heriteDe(ceci.classe, EClasseRacine.objet)) {
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

  private executerElementJeu(element: ElementJeu, instruction: ElementsPhrase): Resultat {

    let resultat = new Resultat(true, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'est':
      case 'sont':
        const nEstPas = instruction.negation && (instruction.negation.trim() === 'pas' || instruction.negation.trim() === 'plus');
        // n'est pas => retirer un état
        if (nEstPas) {
          console.log("executerElementJeu: retirer l’état '", instruction.complement1, "' ele=", element);
          this.jeu.etats.retirerEtatElement(element, instruction.complement1);
          // est => ajouter un état
        } else {
          console.log("executerElementJeu: ajouter l’état '", instruction.complement1, "'");
          this.jeu.etats.ajouterEtatElement(element, instruction.complement1);
        }

        break;

      case 'se trouve':
      case 'se trouvent':
        console.log("executerElementJeu: se trouve:", instruction);
        resultat = this.executerDeplacer(instruction.sujet, instruction.preposition, instruction.sujetComplement1);
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

  afficherStatut(obj: Objet) {
    let retVal = "";
    if (ClasseUtils.heriteDe(obj.classe, EClasseRacine.contenant) || ClasseUtils.heriteDe(obj.classe, EClasseRacine.porte)) {

      const ouvrable = this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.ouvrableID);
      const ouvert = this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.ouvertID);
      const verrou = this.jeu.etats.possedeEtatIdElement(obj, this.jeu.etats.verrouilleID);;

      if (obj.genre == Genre.f) {
        if (ouvert) {
          retVal += "Elle est ouverte.";
        } else {
          retVal += "Elle est fermée " + (verrou ? "et verrouillée." : "mais pas verrouillée.");
        }
        if (ouvrable && !verrou) {
          retVal += " Vous pouvez " + (ouvert ? 'la fermer.' : 'l’ouvrir.');
        }
      } else {
        if (ouvert) {
          retVal += "Il est ouvert.";
        } else {
          retVal += "Il est fermé " + (verrou ? "et verrouillé." : "mais pas verrouillé.");
        }
        if (ouvrable && !verrou) {
          retVal += " Vous pouvez " + (ouvert ? 'le fermer.' : 'l’ouvrir.');
        }
      }

    }

    console.warn("afficherStatut=", retVal);

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

    // retirer de la liste les voisins séparé par une non visible
    if (lieuxVoisins.length > 0 && portesVoisines.length > 0) {
      portesVoisines.forEach(voisinPorte => {
        // retrouver la porte
        const porte = this.eju.getObjet(voisinPorte.id);
        // si la porte est invisible
        if (porte && !this.jeu.etats.estVisible(porte, this.eju)) {
          // retirer de la liste le lieu voisin lié
          const voisinLieuIndex = lieuxVoisins.findIndex(x => x.localisation === voisinPorte.localisation);
          lieuxVoisins.splice(voisinLieuIndex, 1);
        }
      });
    }

    if (lieuxVoisins.length > 0) {
      retVal = "Sorties :";
      lieuxVoisins.forEach(voisin => {
        // if (voisin.type == EClasseRacine.lieu) {
        retVal += ("\n - " + this.afficherLocalisation(voisin.localisation, lieu.id, voisin.id));
        // }
      });
    } else {
      retVal = "Il n’y a pas de sortie.";
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