import { ContexteTour } from "../../models/jouer/contexte-tour";
import { Resultat } from "../../models/jouer/resultat";
import { TypeInterruption } from "../../models/jeu/interruption";

export class InterruptionsUtils {

  /** spécifier les informations de l’interruption qui a lieu suite au résultat */
  public static definirInterruptionTour(tour: ContexteTour, resultat: Resultat) {
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
    }
  }

  /** spécifier les informations de l’interruption qui a lieu suite au sous-resultat */
  public static definirInterruptionSousResultat(resultat: Resultat, sousResultat: Resultat) {
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
    }
  }

}