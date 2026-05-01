import { ContexteTour } from "../../models/jouer/contexte-tour";
import { ElementsPhrase } from "../../models/commun/elements-phrase";
import { Evenement } from "../../models/jouer/evenement";
import { InstructionDire } from "./instruction-dire";
import { InstructionHandler } from "./instruction-handler";
import { Jeu } from "../../models/jeu/jeu";
import { Resultat } from "../../models/jouer/resultat";
import { StringUtils } from "../commun/string.utils";
import { TypeInterruption } from "../../models/jeu/interruption";

/**
 * Instructions de contrôle de flux : refuser, annuler, commencer,
 * interrompre, continuer, terminer.
 */
export class InstructionFlux implements InstructionHandler {

  constructor(
    private jeu: Jeu,
    private insDire: InstructionDire,
    private verbeux: boolean,
  ) { }

  executer(
    instruction: ElementsPhrase,
    nbExecutions: number,
    contexteTour: ContexteTour,
    evenement: Evenement | undefined,
    declenchements: number,
  ): Resultat {
    switch (instruction.infinitif.toLowerCase()) {
      case 'refuser':
        return this.executerRefuser(instruction, nbExecutions, contexteTour, evenement, declenchements);
      case 'annuler':
        return this.executerAnnuler(instruction, contexteTour);
      case 'commencer':
        return this.executerCommencer(instruction, contexteTour);
      case 'interrompre':
        return this.executerInterrompre(instruction, contexteTour);
      case 'continuer':
        return this.executerContinuer(instruction, contexteTour);
      case 'terminer':
        return this.executerTerminer(instruction);
      default:
        return new Resultat(false, '', 1);
    }
  }

  private executerRefuser(
    instruction: ElementsPhrase,
    nbExecutions: number,
    contexteTour: ContexteTour,
    evenement: Evenement | undefined,
    declenchements: number,
  ): Resultat {
    const resultat = new Resultat(true, '', 1);
    if (instruction.sujet?.nom?.toLowerCase() === 'action') {
      // refuser l’action — sans message (à combiner avec dire)
      resultat.refuse = true;
      resultat.succes = true;
    } else {
      // refuser "raison" — afficher le message et refuser
      resultat.sortie += this.insDire.calculerTexteDynamique(
        instruction.complement1.trim().slice(1, instruction.complement1.trim().length - 1).trim(),
        nbExecutions, undefined, contexteTour, evenement, declenchements);
      resultat.refuse = true;
    }
    return resultat;
  }

  private executerAnnuler(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    const resultat = new Resultat(true, '', 1);
    if (instruction.sujet.nomEpithete.startsWith("tour")) {
      resultat.interrompreBlocInstruction = true;
      resultat.typeInterruption = TypeInterruption.annulerTour;
      if (instruction.sujet.determinant) {
        resultat.nbToursAnnuler = StringUtils.getNombreEntierDepuisChiffresOuLettres(undefined, undefined, instruction.sujet.determinant);
      } else {
        resultat.nbToursAnnuler = 1;
      }
    } else if (instruction.sujet.nom == "routine") {
      const nomRoutine = instruction.sujet.epithete?.toLocaleLowerCase();
      if (nomRoutine) {
        if (this.verbeux) {
          console.log(`routine à annuler: ${nomRoutine}`);
        }
        const indexRoutine = this.jeu.programmationsTemps.findIndex(x => x.routine == nomRoutine);
        if (indexRoutine != -1) {
          this.jeu.programmationsTemps.splice(indexRoutine, 1);
          if (this.verbeux) {
            console.log(`routine annulée`);
          }
        }
      } else {
        contexteTour.ajouterErreurInstruction(instruction, "Annuler routine: veuillez spécifier le nom de la routine à annuler.");
      }
    } else {
      contexteTour.ajouterErreurInstruction(instruction, "Annuler: il est seulement possible d'annuler un certain nombre de tours ou la programmation d’une routine.");
      resultat.succes = false;
    }
    return resultat;
  }

  private executerCommencer(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    const resultat = new Resultat(true, '', 1);
    if (instruction.sujet.nomEpithete.toLocaleLowerCase() == "nouvelle partie") {
      resultat.sortie = "@nouvelle partie@";
    } else {
      contexteTour.ajouterErreurInstruction(instruction, "Commencer: il est seulement possible de commencer une nouvelle partie.");
      resultat.succes = false;
    }
    return resultat;
  }

  private executerInterrompre(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    const resultat = new Resultat(true, '', 1);
    if (instruction.sujet?.nom === 'partie' || instruction.sujet?.nom === 'jeu') {
      if (this.jeu.interrompu) {
        contexteTour.ajouterErreurInstruction(instruction, "La partie est déjà interrompue.");
      }
      this.jeu.interrompu = true;
      this.jeu.debutInterruption = Date.now();
      this.jeu.finInterruption = undefined;
      resultat.succes = true;
    } else {
      contexteTour.ajouterErreurInstruction(instruction, "Je sais seulement interrompre la partie.");
      resultat.succes = false;
    }
    return resultat;
  }

  private executerContinuer(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    const resultat = new Resultat(true, '', 1);
    // A) Continuer partie interrompue
    if (instruction.sujet?.nom === 'partie' || instruction.sujet?.nom === 'jeu') {
      if (!this.jeu.interrompu) {
        contexteTour.ajouterErreurInstruction(instruction, "La partie n’est pas interrompue.");
      }
      // on ne désactive pas le flag ici, cela sera traité par le lecteur.
      this.jeu.finInterruption = Date.now();
      resultat.succes = true;
      // B) continuer l’action (avant/après une règle après)
    } else if (instruction.sujet?.nom?.toLocaleLowerCase() === 'action') {
      if (instruction.sujet.epithete?.toLocaleLowerCase() === 'avant') {
        resultat.terminerAvantRegle = true;
      } else {
        resultat.terminerApresRegle = true;
      }
      resultat.succes = true;
    } else {
      contexteTour.ajouterErreurInstruction(instruction, "Je sais seulement continuer une action ou la partie interrompue.");
      resultat.succes = false;
    }
    return resultat;
  }

  private executerTerminer(instruction: ElementsPhrase): Resultat {
    const resultat = new Resultat(true, '', 1);
    if (instruction.sujet?.nom === 'jeu') {
      this.jeu.termine = true;
    } else if (instruction.sujet?.nom?.toLocaleLowerCase() === 'action') {
      if (instruction.sujet.epithete?.toLocaleLowerCase() === 'avant') {
        resultat.terminerAvantRegle = true;
      } else {
        resultat.terminerApresRegle = true;
      }
      resultat.succes = true;
    } else {
      console.error("executerInfinitif >> terminer >> sujet autre que  « action » ou « jeu » pas pris en charge. sujet=", instruction.sujet);
      resultat.succes = false;
    }
    return resultat;
  }
}
