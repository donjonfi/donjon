import { ActionCeciCela } from '../../models/compilateur/action';
import { ActionsUtils } from './actions-utils';
import { ClasseUtils } from '../commun/classe-utils';
import { ConditionsUtils } from './conditions-utils';
import { Debogueur } from './debogueur';
import { Declencheur } from './declencheur';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { Evenement } from '../../models/jouer/evenement';
import { Instructions } from './instructions';
import { Jeu } from '../../models/jeu/jeu';
import { MotUtils } from '../commun/mot-utils';
import { Objet } from '../../models/jeu/objet';
import { PhraseUtils } from '../commun/phrase-utils';
import { Resultat } from '../../models/jouer/resultat';

export class Commandeur {

  /** Élements du jeu Utils */
  private eju: ElementsJeuUtils;
  /** Conditions Utils */
  private cond: ConditionsUtils;
  /** Actions Utils */
  private act: ActionsUtils;
  /** Débogueur */
  private deb: Debogueur;

  constructor(
    private jeu: Jeu,
    private ins: Instructions,
    private dec: Declencheur,
    private verbeux: boolean,
  ) {
    this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
    this.cond = new ConditionsUtils(this.jeu, this.verbeux);
    this.act = new ActionsUtils(this.jeu, this.verbeux);
    this.deb = new Debogueur(this.jeu, this.ins, this.verbeux);
  }

  /** Nettoyer la commmande pour ne pas afficher une erreur en cas de 
   *  faute de frappe…
   */
  public static nettoyerCommande(commande): string {
    const commandeNettoyee = commande
      // 1) remplacer espaces insécables par espace simple.
      ?.replace(/ /g, ' ')
      // 2) effacer les espaces multiples
      .replace(/\s\s+/g, ' ')
      // 3) enlever espaces avant et après la commande
      .trim();

    return commandeNettoyee;
  }

  /** Exécuter la commande */
  public executerCommande(commande: string): string {
    let retVal = "";

    // COMPRENDRE LA COMMANDE
    // > décomposer la commande
    const els = PhraseUtils.decomposerCommande(commande);
    if (els) {

      const isCeciV1 = els.sujet ? true : false;
      const ceciIntituleV1 = els.sujet;

      const ceciQuantiteV1 = isCeciV1 ? (MotUtils.getQuantite(els.sujet.determinant, (MotUtils.estFormePlurielle(els.sujet.nom) ? -1 : 1))) : 0;;
      const resultatCeci = isCeciV1 ? this.eju.trouverCorrespondance(ceciIntituleV1, true, true) : null;

      const isCelaV1 = els.sujetComplement1 ? true : false;
      const celaIntituleV1 = els.sujetComplement1;
      const celaQuantiteV1 = isCelaV1 ? (MotUtils.getQuantite(els.sujetComplement1.determinant, (MotUtils.estFormePlurielle(els.sujetComplement1.nom) ? -1 : 1))) : 0;
      const resultatCela = isCelaV1 ? this.eju.trouverCorrespondance(celaIntituleV1, true, true) : null;

      // si on a déjà une erreur, ne pas continuer.
      if (retVal.length > 0) {
        return retVal;
      }

      //   A) commande spéciale : déboguer
      if (els.infinitif == "déboguer") {
        // triche (avec fichier auto-commandes)
        if (els.sujet?.nom == "triche") {
          if (els.sujet.epithete == "auto") {
            retVal = "@auto-triche@";
          } else {
            retVal = "@triche@";
          }
          // déboguer un élément du jeu
        } else {
          retVal = this.deb.deboguer(els);

        }
        // B) commande spéciale : sauver les commandes dans un fichier
      } else if (els.infinitif == "sauver" && els.sujet?.nom == "commandes") {
        retVal = "@sauver-commandes@";
        // C) commandes chargées dynamiquement
      } else {
          const actionsCeciCela = this.act.trouverActionPersonnalisee(els, resultatCeci, resultatCela);
          // =====================================================
          // A. VERBE PAS CONNU
          // B. VERBE CONNU MAIS CECI/CELA NE CORRESPONDENT PAS
          // =====================================================
          if (actionsCeciCela === null || actionsCeciCela.length === 0) {

            const explicationRefu = this.act.obtenirRaisonRefuCommande(els, resultatCeci, resultatCela);

            // correspondance CECI
            let tempCeci = null;
            if (resultatCeci) {
              if (resultatCeci.nbCor) {
                // élément
                if (resultatCeci.elements.length) {
                  tempCeci = resultatCeci.elements[0];
                  // compteur
                } else if (resultatCeci.compteurs.length) {
                  tempCeci = resultatCeci.compteurs[0];
                  // autre (direction)
                } else {
                  tempCeci = resultatCeci.localisation;
                }
                // non trouvé => intitulé
              } else {
                tempCeci = resultatCeci?.intitule ?? null;
              }
            }

            // correspondance CELA
            let tempCela = null;
            if (resultatCela) {
              if (resultatCela.nbCor) {
                // élément
                if (resultatCela.elements.length) {
                  tempCela = resultatCela.elements[0];
                  // compteur
                } else if (resultatCela.compteurs.length) {
                  tempCela = resultatCela.compteurs[0];
                  // autre (direction)
                } else {
                  tempCela = resultatCela.localisation;
                }
                // non trouvé => intitulé
              } else {
                tempCela = resultatCela.intitule;
              }
            }

            // Renvoyer l’explication du refu. 
            retVal = this.ins.dire.interpreterContenuDire(explicationRefu, 0, tempCeci, tempCela, null, null);

            // regarder si de l’aide existe pour cet infinitif
            const aide = this.jeu.aides.find(x => x.infinitif === els.infinitif);
            if (aide) {
              // Spécifier qu’une page d’aide existe pour la commande.
              retVal += "{u}{/Vous pouvez entrer « {-aide " + els.infinitif + "-} » pour afficher l’aide de la commande./}";
            }

            // =============================================================================
            // C. PLUSIEURS ACTIONS SE DÉMARQUENT (on ne sait pas les départager)
            // =============================================================================
          } else if (actionsCeciCela.length > 1) {

            retVal = "{+Erreur: plusieurs actions avec la même priorité trouvées (" + els.infinitif + ").+}";

            // =============================================================================
            // D. UNE ACTION SE DÉMARQUE (ont a trouvé l’action)
            // =============================================================================
          } else {

            // console.log("Une action se démarque !");

            const candidatVainqueur = actionsCeciCela[0];

            // il peut y avoir plusieurs correspondances avec le même score pour un objet.
            // Ex: il y a une pomme par terre et des pommes sur le pommier on on fait « prendre pomme ».
            // => Dans ce cas, on prend un élément au hasard pour que le jeu ne soit pas bloqué.
            let indexCeci = 0;
            let indexCela = 0;

            if (candidatVainqueur.ceci?.length > 1) {
              retVal += "{+{/Il y a plusieurs résultats équivalents pour « " + ceciIntituleV1.toString() + " ». Je choisis au hasard./}+}{n}";
              indexCeci = Math.floor(Math.random() * candidatVainqueur.ceci.length);
              console.log("indexCeci=", indexCeci);
            }
            if (candidatVainqueur.cela?.length > 1) {
              retVal += "{+{/Il y a plusieurs résultats équivalents pour « " + celaIntituleV1.toString() + " ». Je choisis au hasard./}+}{n}";
              indexCela = Math.floor(Math.random() * candidatVainqueur.cela.length);
              console.log("indexCela=", indexCela);
            }

            const actionCeciCela = new ActionCeciCela(candidatVainqueur.action, (candidatVainqueur.ceci ? candidatVainqueur.ceci[indexCeci] : null), (candidatVainqueur.cela ? candidatVainqueur.cela[indexCela] : null));

            const isCeciV2 = actionCeciCela.ceci ? true : false;
            let ceciQuantiteV2 = ceciQuantiteV1;
            // transformer « -1 » en la quantité de l’objet
            if (ceciQuantiteV2 === -1 && actionCeciCela.ceci && ClasseUtils.heriteDe(actionCeciCela.ceci.classe, EClasseRacine.objet)) {
              ceciQuantiteV2 = (actionCeciCela.ceci as Objet).quantite;
            }

            const ceciNomV2 = isCeciV2 ? actionCeciCela.ceci.nom : null;
            const ceciClasseV2 = (isCeciV2 ? actionCeciCela.ceci.classe : null)

            const isCelaV2 = actionCeciCela.cela ? true : false;
            let celaQuantiteV2 = celaQuantiteV1;
            // transformer « -1 » en la quantité de l’objet
            if (celaQuantiteV2 === -1 && actionCeciCela.cela && ClasseUtils.heriteDe(actionCeciCela.cela.classe, EClasseRacine.objet)) {
              celaQuantiteV2 = (actionCeciCela.cela as Objet).quantite;
            }
            const celaNomV2 = isCelaV2 ? actionCeciCela.cela.nom : null;
            const celaClasseV2 = (isCelaV2 ? actionCeciCela.cela.classe : null)

            // mettre à jour l'évènement avec les éléments trouvés
            const evenementV2 = new Evenement(
              // verbe
              actionCeciCela.action.infinitif,
              // ceci
              isCeciV2, els.preposition0, ceciQuantiteV2, ceciNomV2, ceciClasseV2,
              // cela
              isCelaV2, els.preposition1, celaQuantiteV2, celaNomV2, celaClasseV2
            );

            // console.error(">>>>>> evenement = ", evenement);F


            // ÉVÈNEMENT AVANT la commande (qu'elle soit refusée ou non)
            let resultatAvant = new Resultat(true, "", 0);
            // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score
            const declenchementsAvant = this.dec.avant(evenementV2);
            // éxécuter les règles déclenchées
            declenchementsAvant.forEach(declenchement => {
              const sousResultatAvant = this.ins.executerInstructions(declenchement.instructions, actionCeciCela.ceci, actionCeciCela.cela, evenementV2, declenchement.declenchements);
              retVal += sousResultatAvant.sortie;
              resultatAvant.succes = resultatAvant.succes && sousResultatAvant.succes;
              resultatAvant.nombre += sousResultatAvant.nombre;
              resultatAvant.stopperApresRegle = resultatAvant.stopperApresRegle || sousResultatAvant.stopperApresRegle;
            });

            // Continuer l’action (sauf si on a fait appel à l’instruction « STOPPER L’ACTION ».)
            if (resultatAvant.stopperApresRegle !== true) {
              // PHASE REFUSER (vérifier l'action)
              let refus = false;
              if (actionCeciCela.action.verifications) {
                // console.log("vérifications en cours pour la commande…");
                // parcourir les vérifications
                actionCeciCela.action.verifications.forEach(verif => {
                  if (verif.conditions.length == 1) {
                    if (!refus && this.cond.siEstVrai(null, verif.conditions[0], actionCeciCela.ceci, actionCeciCela.cela, evenementV2, null)) {
                      // console.warn("> commande vérifie cela:", verif);
                      const resultatRefuser = this.ins.executerInstructions(verif.resultats, actionCeciCela.ceci, actionCeciCela.cela, evenementV2, null);
                      retVal += resultatRefuser.sortie;
                      refus = true;
                    }
                  } else {
                    console.error("action.verification: 1 et 1 seule condition possible par vérification. Mais plusieurs vérifications possibles par action.");
                  }
                });
              }

              // exécuter l’action si pas refusée
              if (!refus) {
                // PHASE EXÉCUTER l’action
                const resultatExecuter = this.executerAction(actionCeciCela, evenementV2);
                retVal += resultatExecuter.sortie;
                // ÉVÈNEMENT APRÈS la commande
                let resultatApres = new Resultat(true, "", 0);
                // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score
                const declenchementsApres = this.dec.apres(evenementV2);
                if (declenchementsApres.length) {
                  // éxécuter les règles déclenchées
                  declenchementsApres.forEach(declenchement => {
                    const sousResultatApres = this.ins.executerInstructions(declenchement.instructions, actionCeciCela.ceci, actionCeciCela.cela, evenementV2, declenchement.declenchements);
                    resultatApres.sortie += sousResultatApres.sortie;
                    resultatApres.succes = resultatApres.succes && sousResultatApres.succes;
                    resultatApres.nombre += sousResultatApres.nombre;
                    resultatApres.terminerAvantRegle = resultatApres.terminerAvantRegle || sousResultatApres.terminerAvantRegle;
                    resultatApres.terminerApresRegle = resultatApres.terminerApresRegle || sousResultatApres.terminerApresRegle;
                  });

                  // terminer avant sortie règle « après » ?
                  if (resultatApres.terminerAvantRegle) {
                    // PHASE TERMINER l'action (avant sortie règle « après ») => « terminer l’action avant »
                    const resultatFinaliser = this.finaliserAction(actionCeciCela, evenementV2);
                    retVal += resultatFinaliser.sortie;
                    // éviter de terminer 2x l’action (en cas d’erreur de l’utilisateur)
                    if (resultatApres.terminerApresRegle) {
                      resultatApres.terminerApresRegle = false;
                    }
                  }

                  // sortie règle après
                  retVal += resultatApres.sortie;

                  // terminer après sortie règle « après » ?
                  if (resultatApres.terminerApresRegle) {
                    // PHASE TERMINER l'action (après sortie règle « après ») => « terminer l’action après » (ou « continuer l’action »)
                    const resultatFinaliser = this.finaliserAction(actionCeciCela, evenementV2);
                    retVal += resultatFinaliser.sortie;
                  }

                } else {
                  // PHASE TERMINER l'action (sans règle « après »)
                  const resultatFinaliser = this.finaliserAction(actionCeciCela, evenementV2);
                  retVal += resultatFinaliser.sortie;
                }

              }
            }

          }
      }

      // la commande n’a pas pu être décomposée
    } else {
      retVal = "Désolé, je n'ai pas compris la commande « " + commande + " ».\n";
      retVal += "Voici des exemples de commandes que je comprend :\n";
      retVal += "{t}- {-aller vers le nord-} ou l’abréviation {-n-}\n";
      retVal += "{t}- {-examiner le radiateur-} ou {-ex radiateur-}\n";
      retVal += "{t}- {-prendre la cerise-} ou {-p cerise-}\n";
      retVal += "{t}- {-parler avec le capitaine concernant le trésor perdu-}\n";
      retVal += "{t}- {-interroger magicienne concernant bague-}\n";
      retVal += "{t}- {-donner l’épée au forgeron-} ou {-do épée à forgeron-}\n";
      retVal += "{t}- {-effacer l’écran-} ou {-ef-}\n";
      retVal += "{t}- {-aide montrer-} ou {-? montrer-}\n";
    }
    return retVal;
  }

  private executerAction(action: ActionCeciCela, evenement: Evenement) {
    const resultat = this.ins.executerInstructions(action.action.instructions, action.ceci, action.cela, evenement, null);
    return resultat;
  }

  private finaliserAction(action: ActionCeciCela, evenement: Evenement) {
    const resultat = this.ins.executerInstructions(action.action.instructionsFinales, action.ceci, action.cela, evenement, null);
    return resultat;
  }


}
