import { ELocalisation, Localisation } from '../../models/jeu/localisation';

import { ClasseUtils } from '../commun/classe-utils';
import { CompteursUtils } from "./compteurs-utils";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { EClasseRacine } from "../../models/commun/constantes";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { ElementsPhrase } from "../../models/commun/elements-phrase";
import { Evenement } from "../../models/jouer/evenement";
import { InstructionHandler } from "./instruction-handler";
import { InstructionJouerArreter } from "./instruction-jouer-arreter";
import { InstructionsUtils } from "./instructions-utils";
import { Jeu } from "../../models/jeu/jeu";
import { Lieu } from "../../models/jeu/lieu";
import { Resultat } from "../../models/jouer/resultat";
import { TexteUtils } from "../commun/texte-utils";
import { TypeInterruption } from "../../models/jeu/interruption";

/**
 * Instructions techniques diverses : attendre, tester, déterminer.
 * Héberge également la méthode determinerDeplacementVers, utilisée
 * depuis Commandeur lors de la gestion des tours.
 */
export class InstructionSysteme implements InstructionHandler {

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private insJouerArreter: InstructionJouerArreter,
  ) { }

  executer(
    instruction: ElementsPhrase,
    nbExecutions: number,
    contexteTour: ContexteTour,
    evenement: Evenement | undefined,
    declenchements: number,
  ): Resultat {
    switch (instruction.infinitif.toLowerCase()) {
      case 'attendre':
        return this.executerAttendre(instruction, contexteTour);
      case 'tester':
        return this.executerTester(instruction, contexteTour);
      case 'déterminer':
      case 'determiner':
        return this.executerDeterminer(instruction, contexteTour);
      default:
        return new Resultat(false, '', 1);
    }
  }

  private executerAttendre(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    const resultat = new Resultat(true, '', 1);
    // ATTENDRE UNE TOUCHE
    if (instruction.sujet?.nom.toLocaleLowerCase() == 'touche') {
      resultat.interrompreBlocInstruction = true;
      resultat.typeInterruption = TypeInterruption.attendreTouche;
      resultat.messageAttendre = TexteUtils.enleverGuillemets(instruction.complement1, true);
      resultat.succes = true;
      // ATTENDRE NOMBRE DE SECONDES
    } else if (instruction.sujet?.nom.toLocaleLowerCase() == 'seconde' || instruction.sujet?.nom.toLocaleLowerCase() == 'secondes') {
      resultat.interrompreBlocInstruction = true;
      resultat.typeInterruption = TypeInterruption.attendreSecondes;
      resultat.nbSecondesAttendre = CompteursUtils.intituleNombreVersNombre(instruction.sujet.determinant);
      if (resultat.nbSecondesAttendre > 10) {
        contexteTour.ajouterErreurInstruction(instruction, "Attendre: 10 secondes maximum.");
        resultat.nbSecondesAttendre = 10;
      }
      resultat.succes = true;
    } else {
      console.error("executerInfinitif >> attendre >> sujet autre que « une touche » ou « nombre secondes » pas pris en charge. sujet=", instruction.sujet);
      resultat.succes = false;
    }
    return resultat;
  }

  private executerTester(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    if (instruction.sujet.motsCles.length == 1 && instruction.sujet.motsCles[0] == 'audio') {
      return this.insJouerArreter.testSon();
    }
    const resultat = new Resultat(true, '', 1);
    contexteTour.ajouterErreurInstruction(instruction, "exécuter instruction: tester: je sais uniquement tester l’audio.");
    return resultat;
  }

  private executerDeterminer(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    const resultat = new Resultat(true, '', 1);
    if (instruction.sujet?.nom?.toLocaleLowerCase() === 'déplacement du joueur') {
      const destination = instruction.sujetComplement1.toString();
      this.determinerDeplacementVers(destination, contexteTour);
    } else {
      contexteTour.ajouterErreurInstruction(instruction, "exécuter instruction: déterminer: je ne sais pas déterminer ça:" + instruction.sujet.toString());
    }
    return resultat;
  }

  /**
   * Déterminer la destination/orientation d’un déplacement du joueur,
   * et adapter ceci/cela en conséquence.
   * Appelée depuis Commandeur lors de la gestion des tours.
   */
  public determinerDeplacementVers(destination: string, ctxTour: ContexteTour): void {
    ctxTour.origine = this.eju.curLieu;

    let cibleDestination = InstructionsUtils.trouverCibleSpeciale(destination, ctxTour, ctxTour.commande.evenement, this.eju, this.jeu);

    if (cibleDestination) {
      // si on a fourni un lieu => trouver l’orientation correspondante
      if (ClasseUtils.heriteDe(cibleDestination.classe, EClasseRacine.lieu)) {
        ctxTour.destination = cibleDestination as Lieu;
        // trouver orientation
        let voisin = ctxTour.destination.voisins.find(x => x.type == EClasseRacine.lieu && x.id == ctxTour.destination.id);
        if (voisin) {
          ctxTour.orientation = Localisation.getLocalisation(voisin.localisation);
        }
        // si on a fourni une orientation => trouver le lieu correspondant
      } else if (ClasseUtils.heriteDe(cibleDestination.classe, EClasseRacine.direction)) {
        ctxTour.orientation = cibleDestination as Localisation;
        // trouver le lieu
        let voisinId = this.eju.getVoisinDirectionID(ctxTour.orientation, EClasseRacine.lieu);
        // cas particulier : si le joueur utilise sortir quand une seule sortie visible, aller dans la direction de cette sortie
        if (ctxTour.orientation.id == ELocalisation.exterieur) {
          const lieuxVoisinsVisibles = this.eju.getLieuxVoisinsVisibles(this.eju.curLieu);
          if (lieuxVoisinsVisibles.length == 1) {
            voisinId = lieuxVoisinsVisibles[0].id;
            ctxTour.orientation = Localisation.getLocalisation(lieuxVoisinsVisibles[0].localisation);
          }
        }
        if (voisinId != -1) {
          ctxTour.destination = this.eju.getLieu(voisinId);
        }
      } else {
        ctxTour.ajouterErreurInstruction(undefined, "Cible destination joueur pas prise en charge:" + destination);
      }

      // mémoriser l’orientation dans l’évènement pour que les règles ciblant une direction
      // (« après aller vers le nord ») se déclenchent même après le remplacement ci-dessous.
      ctxTour.commande.evenement.orientationDeplacement = ctxTour.orientation?.nom ?? null;

      // si l’option n’est pas désactivée, remplacer ceci/cela par le lieu destination
      // afin d’avoir toujours le lieu comme paramètre plutôt que parfois le lieu et parfois la direction.
      if (this.jeu.parametres.activerRemplacementDestinationDeplacements) {
        if (ctxTour.commande.actionChoisie.action.destinationDeplacement == 'ceci') {
          if (ctxTour.destination) {
            ctxTour.commande.evenement.ceci = ctxTour.destination.nom;
            ctxTour.commande.evenement.classeCeci = ctxTour.destination.classe;
          }
        } else if (ctxTour.commande.actionChoisie.action.destinationDeplacement == 'cela') {
          if (ctxTour.destination) {
            ctxTour.commande.evenement.cela = ctxTour.destination.nom;
            ctxTour.commande.evenement.classeCela = ctxTour.destination.classe;
          }
        }
      }

    }
  }
}
