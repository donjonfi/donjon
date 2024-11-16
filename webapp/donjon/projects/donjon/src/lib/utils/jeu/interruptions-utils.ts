import { Interruption, TypeContexte, TypeInterruption } from "../../models/jeu/interruption";
import { ContexteCommande } from "../../models/jouer/contexte-commande";

import { ContexteTour } from "../../models/jouer/contexte-tour";
import { QuestionCommande } from "../../models/jouer/questions-commande";
import { Resultat } from "../../models/jouer/resultat";

export class InterruptionsUtils {

  /** spécifier les informations de l’interruption qui a lieu suite au résultat */
  public static definirProprietesInterruptionResultatAuTour(tour: ContexteTour, resultat: Resultat) {
    tour.typeInterruption = resultat.typeInterruption;
    tour.reste = resultat.reste;
    switch (resultat.typeInterruption) {
      case TypeInterruption.attendreChoix:
      case TypeInterruption.attendreChoixLibre:
        tour.choix = resultat.choix;
        break;
      case TypeInterruption.attendreTouche:
        tour.messageAttendre = resultat.messageAttendre;
        break;
      case TypeInterruption.attendreSecondes:
        tour.messageAttendre = resultat.messageAttendre;
        tour.nbSecondesAttendre = resultat.nbSecondesAttendre;
        break;
      case TypeInterruption.annulerTour:
        tour.nbToursAnnuler = resultat.nbToursAnnuler;
        break;
      case TypeInterruption.changerEcran:
        tour.ecran = resultat.ecran;
        break;
    }
  }

  /** spécifier les informations de l’interruption qui a lieu suite au sous-resultat */
  public static definirProprietesInterruptionSousResultatAuResultat(resultat: Resultat, sousResultat: Resultat) {
    resultat.interrompreBlocInstruction = true;
    resultat.typeInterruption = sousResultat.typeInterruption;
    resultat.reste = sousResultat.reste;
    switch (sousResultat.typeInterruption) {
      case TypeInterruption.attendreChoix:
      case TypeInterruption.attendreChoixLibre:
        resultat.choix = sousResultat.choix;
        break;
      case TypeInterruption.attendreTouche:
        resultat.messageAttendre = sousResultat.messageAttendre;
        break;
      case TypeInterruption.attendreSecondes:
        resultat.messageAttendre = sousResultat.messageAttendre;
        resultat.nbSecondesAttendre = sousResultat.nbSecondesAttendre;
        break;
      case TypeInterruption.annulerTour:
        resultat.nbToursAnnuler = sousResultat.nbToursAnnuler;
        break;
      case TypeInterruption.changerEcran:
        resultat.ecran = sousResultat.ecran;
        break;
    }
  }

  public static creerInterruptionContexteTourOuRoutine(tour: ContexteTour, typeContexte: TypeContexte.tour | TypeContexte.routine): Interruption {
    const interruption = new Interruption(tour.typeInterruption, typeContexte);
    interruption.tour = tour;
    interruption.choix = tour.choix;
    interruption.messageAttendre = tour.messageAttendre;
    interruption.nbSecondesAttendre = tour.nbSecondesAttendre;
    interruption.nbToursAnnuler = tour.nbToursAnnuler;
    interruption.ecran = tour.ecran;
    return interruption;
  }

  public static creerInterruptionQuestionCommande(commande: ContexteCommande, derniereQuestion: QuestionCommande): Interruption {
    const interruption = new Interruption(TypeInterruption.questionCommande, TypeContexte.commande);
    interruption.questionsCommande = commande.questions;
    interruption.derniereQuestion = derniereQuestion;
    interruption.commande = commande;
    return interruption;
  }

}