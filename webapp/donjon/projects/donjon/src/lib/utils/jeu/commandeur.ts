import { ActionCeciCela } from '../../models/compilateur/action';
import { ActionsUtils } from './actions-utils';
import { CandidatCommande } from '../../models/jouer/candidat-commande';
import { ClasseUtils } from '../commun/classe-utils';
import { ConditionsUtils } from './conditions-utils';
import { ContexteCommande } from '../../models/jouer/contexte-commande';
import { ContexteTour } from '../../models/jouer/contexte-tour';
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
import { TypeEvenement } from '../../models/jouer/type-evenement';

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
      // 1) remplacer espaces insécables par espaces simples.
      ?.replace(/ /g, ' ')
      // 2) effacer les espaces multiples
      .replace(/\s\s+/g, ' ')
      // 3) enlever espaces avant et après la commande
      .trim();

    return commandeNettoyee;
  }

  /** 
   * Décomposer une commande du joueur.
   * La fonction renvoit éventuellement plusieurs candidats.
   * Les candidats sont triés par score décroissants.
   * Le score est basé sur le nombre d’arguments et la correspondance 
   * entre les arguments et les éléments existants dans le jeu.
   */
  public decomposerCommande(commande): ContexteCommande {
    // 0. COMMANDE BRUTE
    let ctx = new ContexteCommande();
    ctx.brute = commande;
    // 1. COMMANDE DÉCOMPOSÉE EN ÉLÉMENTS DE PHRASE
    ctx.candidats = PhraseUtils.obtenirLesCommandesPossibles(ctx.brute);

    ctx.candidats.forEach(candidat => {

      // 2. MANIPULATIONS COMMANDE PARLER/DEMANDER/DONNER/MONTRER/…
      // pour la commande parler on s’arrange pour toujours avoir le même ordre pour
      // les arguments (interlocuteur et sujet) de plus certaines formulations sans
      // ambiguïté augmentent le score.
      this.manipulationVerbesParlerDemanderDonnerMontrer(candidat);

      // 3. ANALYSE DE CONSTITUANTS DE LA COMMANDE
      // 1er argument
      candidat.isCeciV1 = candidat.els.sujet ? true : false;
      candidat.ceciIntituleV1 = candidat.els.sujet;
      candidat.ceciQuantiteV1 = candidat.isCeciV1 ? (MotUtils.getQuantite(candidat.els.sujet.determinant, (MotUtils.estFormePlurielle(candidat.els.sujet.nom) ? -1 : 1))) : 0;;
      candidat.correspondCeci = candidat.isCeciV1 ? this.eju.trouverCorrespondance(candidat.ceciIntituleV1, true, true) : null;
      // 2e argument
      candidat.isCelaV1 = candidat.els.sujetComplement1 ? true : false;
      candidat.celaIntituleV1 = candidat.els.sujetComplement1;
      candidat.celaQuantiteV1 = candidat.isCelaV1 ? (MotUtils.getQuantite(candidat.els.sujetComplement1.determinant, (MotUtils.estFormePlurielle(candidat.els.sujetComplement1.nom) ? -1 : 1))) : 0;
      candidat.correspondCela = candidat.isCelaV1 ? this.eju.trouverCorrespondance(candidat.celaIntituleV1, true, true) : null;

      // 4. ÉTABLISSEMENT DU SCORE DU CANDIDAT
      // 4.1 - SCORE CORRESPONDANCE DES ARGUMENTS
      // a) 2 arguments
      if (candidat.isCeciV1 && candidat.isCelaV1) {
        if (candidat.correspondCeci.nbCor > 0) {
          if (candidat.correspondCela.nbCor > 0) {
            // les 2 arguments ont une correspondance (100% correspondance)
            candidat.score += 100;
          } else {
            // 1 des 2 arguments a une correspondance (50% correspondance)
            candidat.score += 25;
          }
        } else if (candidat.correspondCela.nbCor > 0) {
          // 1 des 2 arguments a une correspondance (50% correspondance)
          candidat.score += 25;
        }
        // b) 1 argument
      } else if (candidat.isCeciV1) {
        if (candidat.correspondCeci.nbCor > 0) {
          // l’argument a une correspondance (100% correspondance)
          candidat.score += 100;
        }
      } else if (candidat.isCelaV1) {
        if (candidat.correspondCela.nbCor > 0) {
          // l’argument a une correspondance (100% correspondance)
          candidat.score += 100;
        }
        // c) aucun argument (100% correspondance)
      } else {
        candidat.score += 100;
      }

      // 4.2 - SCORE NOMBRE D’ARGUMENTS
      // vérifier si le nombre d’arguments trouvés correspond à une action existante
      if (this.act.verifierSiInfinitifExisteAvecCeciCela(candidat.els.infinitif, candidat.isCeciV1, candidat.isCelaV1)) {
        candidat.score += 100;
      }


    });

    // 5. TRIER LES RÉSULTATS (par score décroissant)
    ctx.candidats.sort((a, b) => (
      a.score > b.score ? -1 : 1
    ));

    return ctx;
  }

  /**
   * Toujours fournir les arguments de la commande parler/interroger/discuter/montrer/… 
   * dans le même order.
   */
  private manipulationVerbesParlerDemanderDonnerMontrer(candidat: CandidatCommande) {


    switch (candidat.els.infinitif) {
      // 1) PARLER/DISCUTER => PARLER AVEC INTERLOCUTEUR (CONCERNANT SUJET) => 
      case 'parler':
      case 'discuter':
        console.error('####### parler avant - pre0:', candidat.els.preposition0, 'suj:', candidat.els.sujet, 'pre1:', candidat.els.preposition1, 'c1', candidat.els.sujetComplement1);

        // A. PARLER *DE* SUJET *AVEC* INTERLOCUTEUR
        // préposition après parler
        if (candidat.els.preposition0) {
          // du/de/des/à propos/concernant
          if (candidat.els.preposition0.match(/(du|de(?: la| l(?:’|'))?|des|d(?:’|')(?:un|une)?|à propos|concernant)/)) {
            console.error('####### cas A')
            // préposition 1
            if (candidat.els.preposition1) {
              console.error("####### Prep1:", candidat.els.preposition1);
              // avec/à/au/aux
              if (candidat.els.preposition1.match(/(avec|à|au(?:x)?)/)) {

                // on inverse l’ordre de la formulation (sujet/interrlocuteur)
                const sujet = candidat.els.sujet;
                const interlocuteur = candidat.els.sujetComplement1;
                candidat.els.preposition0 = 'avec';
                candidat.els.preposition1 = 'concernant';
                candidat.els.sujet = interlocuteur;
                candidat.els.sujetComplement1 = sujet;

                if (candidat.els.preposition1 == 'avec') {
                  // formulation priviliégiée car évite les ambiguïtés avec les noms composés
                  candidat.score += 200;
                } else {
                  // peut être ambigu donc peu de points en plus
                  candidat.score += 25;
                }
              } else {
                // formulation étrange => probablement une mauvaise interprétation
              }

              // pas de seconde préposition
            } else {
              candidat.els.preposition0 = 'concernant'; // on uniformise

            }
            // B. PARLER *AVEC* INTERLOCUTEUR [*CONCERNANT* SUJET]
            // avec/à/au
          } else if (candidat.els.preposition0.match(/(avec|à|au(?:x)?)/)) {
            console.error('####### cas B')
            candidat.els.preposition0 = 'avec'; // on uniformise
            if (candidat.els.preposition1) {
              // B.a parler avec interlocuteur concernant/à propos de sujet
              if (candidat.els.preposition1.match(/(à propos(?:| d’| d')?|concernant)/)) {
                // l’ordre est déjà bon, formulation priviliégiée car évite les ambiguïtés avec les noms composés
                candidat.score += 200;
                candidat.els.preposition1 = 'concernant'; // on uniformise
                // B.a parler avec interlocuteur de sujet
              } else {
                candidat.els.preposition1 = 'concernant'; // on uniformise
                // (l’ordre est déjà bon, peut être ambigu donc pas de points en plus )
              }
            } else {
              // (parler avec interloculteur)
            }
            // deuxième préposition par reconnue
          } else {

          }
          // pas de préposition après parler
        } else {
          console.error("####### Pas de prep");
          // la 2e préposition est sans ambiguïté
          if (candidat.els.preposition1?.match(/(à propos|concernant)/)) {
            // l’ordre est déjà bon, formulation priviliégiée car évite les ambiguités avec les noms composés
            candidat.score += 200;
            candidat.els.preposition0 = 'avec'; // on uniformise
            candidat.els.preposition1 = 'concernant'; // on uniformise

            // il n’y a pas de 2e préposition claire pour nous éclairer…
          } else {

          }
        }

        console.error('####### parler après - pre0:', candidat.els.preposition0, 'suj:', candidat.els.sujet, 'pre1:', candidat.els.preposition1, 'c1', candidat.els.sujetComplement1);
        break;

      // 2) INTERROGER/QUESTIONNER => INTERROGER INTERLOCUTEUR *CONCERNANT* SUJET
      case 'interroger':
      case 'questionner':
        console.error('####### interroger avant - pre0:', candidat.els.preposition0, 'suj:', candidat.els.sujet, 'pre1:', candidat.els.preposition1, 'c1', candidat.els.sujetComplement1);
        // aucune préposition après l’infinitif
        if (!candidat.els.preposition0) {
          if (candidat.els.preposition1.match(/(à propos|concernant)/)) {
            // l’ordre est déjà bon, formulation priviliégiée car évite les ambiguïtés avec les noms composés
            candidat.score += 200;
            candidat.els.preposition1 = 'concernant'; // on uniformise
          } else if (candidat.els.preposition1.match('sur')) {
            // l’ordre est déjà bon, peut être ambigu donc peu de points en plus
            candidat.score += 25;
            candidat.els.preposition1 = 'concernant'; // on uniformise
          }
          // préposition après infinitif
        } else {
          // formulation pas prévue
        }
        console.error('####### interroger après - pre0:', candidat.els.preposition0, 'suj:', candidat.els.sujet, 'pre1:', candidat.els.preposition1, 'c1', candidat.els.sujetComplement1);
        break;

      // 3) DEMANDER/DONNER/MONTRER => DEMANDER SUJET À INTERLOCUTEUR
      case 'demander':
      case 'donner':
      case 'montrer':
        console.error('####### demander avant - pre0:', candidat.els.preposition0, 'suj:', candidat.els.sujet, 'pre1:', candidat.els.preposition1, 'c1', candidat.els.sujetComplement1);
        // A. DEMANDER SUJET *À* INTERLOCUTEUR
        if (!candidat.els.preposition0 || candidat.els.preposition0.match(/de|d'|d’|du|des/)) {
          // préposition
          if (candidat.els.preposition1) {
            // prépositon (à/au/aux)
            if (candidat.els.preposition1.match('à|au|aux')) {
              // l’ordre est déjà bon, peut être ambigu donc peu de points en plus
              candidat.score += 25;
            }
            // pas de préposition
          } else {
            // probablement une mauvaise interprétation ou un complément manquant
          }

          // à infinitif (sujet) à interlocuteur / à interlocuteur sujet
        } else if (candidat.els.preposition0.match(/à/)) {
          // B. DEMANDER *À* INFINITIF (SUJET) *À* INTERLOCUTEUR
          // suivi d’un infinitif: c’est le sujet => ex: à manger
          if (candidat.els.sujet.nom.match(/^\S+(?:ir|er|re)\b/)) {
            // préposition (à/au/aux)
            if (candidat.els.preposition1) {
              if (candidat.els.preposition1.match('à|au|aux')) {
                // l’ordre est déjà bon, peut être ambigu donc peu de points en plus
                candidat.score += 25;
                // on va rassembler le premier « à » avec l’infinitif => ex: à manger
                candidat.els.preposition0 = undefined;
                candidat.els.sujet.nom = 'à ' + candidat.els.sujet.nom;
              }
              // pas de préposition
            } else {
              // => probablement une mauvaise découpe ou bien il manque un complément
            }
            // C. *À* INTERLOCUTEUR SUJET
            // sinon c’est l’interlocuteur => ex: à Louis de l'argent
          } else {
            // il y a une 2e préposition (ça va être le sujet)
            if (candidat.els.preposition1) {
              // demander à sujet à infinitif (ex: demander à Louis à boire)
              if (candidat.els.preposition1.match(/à/) && candidat.els.sujetComplement1.nom.match(/^\S+(?:ir|er|re)\b/)) {
                candidat.els.preposition1 = undefined;
                candidat.els.sujetComplement1.nom = 'à ' + candidat.els.sujetComplement1.nom
                // changer l'ordre, peut être ambigu donc peu de points en plus
                const interlocuteur = candidat.els.sujet;
                const sujet = candidat.els.sujetComplement1;
                candidat.els.preposition0 = undefined;
                candidat.els.preposition1 = 'à';
                candidat.els.sujet = sujet;
                candidat.els.sujetComplement1 = interlocuteur;
                candidat.score += 25;
              } else if (candidat.els.preposition1.match(/de|d'|d’|du|des/)) {
                // changer l'ordre, peut être ambigu donc peu de points en plus
                const interlocuteur = candidat.els.sujet;
                const sujet = candidat.els.sujetComplement1;
                candidat.els.preposition0 = undefined;
                candidat.els.preposition1 = 'à';
                candidat.els.sujet = sujet;
                candidat.els.sujetComplement1 = interlocuteur;
                candidat.score += 50;
              } else {
                // formulation pas pris en charge
              }
              // il n'y a pas de 2e préposition
              // ex: demander à Louis
            } else {

            }
          }
        }
        console.error('####### demander après - pre0:', candidat.els.preposition0, 'suj:', candidat.els.sujet, 'pre1:', candidat.els.preposition1, 'c1', candidat.els.sujetComplement1);
        break;

      default:
        break;
    }


    // TODO: on pourrait ajouter des points pour les sujets de discutions prévus dans le jeu


  }


  /** Exécuter la commande */
  public executerCommande(commande: string): string {
    let retVal = "";

    // COMPRENDRE LA COMMANDE
    // > décomposer la commande
    let ctx = this.decomposerCommande(commande);
    // si on a réussi à décomposer la commande
    if (ctx.candidats.length > 0) {

      // un seul candidat, c’est forcément lui
      if (ctx.candidats.length == 1) {
        this.essayerLaCommande(0, ctx);
      } else if (ctx.candidats.length == 2) {

        // les 2 candidats ont le même score
        if (ctx.candidats[0].score == ctx.candidats[1].score) {
          this.jeu.tamponErreurs.push("commandeur: 2 candidats ont le même score pour la découpe de la commande. Par la suite je demanderai lequel choisir.");
          this.essayerLaCommande(0, ctx);
          // si le premier candidat n’a pas été validé, essayer le 2e
          if (!ctx.commandeValidee) {
            this.essayerLaCommande(1, ctx);
          }
          // le premier candidat a un score plus élevé
        } else {
          this.essayerLaCommande(0, ctx);
          // si le premier candidat n’a pas été validé, essayer le 2e
          if (!ctx.commandeValidee) {
            this.essayerLaCommande(1, ctx);
          }
        }
        // s’il y a plus de 2 candidats, c’est un cas qui n’est pas pris en charge (ça ne devrait pas arriver)
      } else {
        this.jeu.tamponErreurs.push("Commandeur: executerCommande: J’ai plus de 2 candidats, ça n’est pas prévu !");
      }

      // la commande n’a pas pu être décomposée
    } else {
      ctx.sortie = "Désolé, je n'ai pas compris la commande « " + commande + " ».\n";
      ctx.sortie += "Voici des exemples de commandes que je comprend :\n";
      ctx.sortie += "{t}- {-aller vers le nord-} ou l’abréviation {-n-}\n";
      ctx.sortie += "{t}- {-examiner le radiateur-} ou {-ex radiateur-}\n";
      ctx.sortie += "{t}- {-prendre la cerise-} ou {-p cerise-}\n";
      ctx.sortie += "{t}- {-parler avec le capitaine concernant le trésor perdu-}\n";
      ctx.sortie += "{t}- {-interroger magicienne concernant bague-}\n";
      ctx.sortie += "{t}- {-donner l’épée au forgeron-} ou {-do épée à forgeron-}\n";
      ctx.sortie += "{t}- {-effacer l’écran-} ou {-ef-}\n";
      ctx.sortie += "{t}- {-aide montrer-} ou {-? montrer-}\n";
    }
    return ctx.sortie;
  }

  /**
   * Essayer de trouver une action correspondant à la commande.
   * Si une action est trouvée, elle est exécutée.
   * @param indexCandidat index du candidat à tester.
   * @param ctx contexte de la commande avec les candidats et la sortie.
   */
  private essayerLaCommande(indexCandidat: number, ctx: ContexteCommande): void {
    //   A) commande spéciale : déboguer
    if (ctx.candidats[indexCandidat].els.infinitif == "déboguer") {
      // triche (avec fichier auto-commandes)
      if (ctx.candidats[indexCandidat].els.sujet?.nom == "triche") {
        if (ctx.candidats[indexCandidat].els.sujet.epithete == "auto") {
          ctx.sortie = "@auto-triche@";
          ctx.commandeValidee = true; // la commande a été validée et exécutée
        } else {
          ctx.sortie = "@triche@";
          ctx.commandeValidee = true; // la commande a été validée et exécutée
        }
        // déboguer un élément du jeu
      } else {
        ctx.sortie = this.deb.deboguer(ctx.candidats[indexCandidat].els);
        ctx.commandeValidee = true; // la commande a été validée et exécutée
      }
      // B) commande spéciale : sauver les commandes dans un fichier.
    } else if (ctx.candidats[indexCandidat].els.infinitif == "sauver" && ctx.candidats[indexCandidat].els.sujet?.nom == "commandes") {
      ctx.sortie = "@sauver-commandes@";
      ctx.commandeValidee = true; // la commande a été validée et exécutée
      // C) commande spéciale : émettre un son pour que le joueur puisse vérifier ses baffles.
    } else if (ctx.candidats[indexCandidat].els.infinitif == "tester" && ctx.candidats[indexCandidat].els.sujet?.nom == "audio") {
      ctx.sortie = this.ins.testerSon().sortie;
      ctx.commandeValidee = true; // la commande a été validée et exécutée
      // D) commandes chargées dynamiquement
    } else {
      const actionsCeciCela = this.act.trouverActionPersonnalisee(ctx.candidats[indexCandidat].els, ctx.candidats[indexCandidat].correspondCeci, ctx.candidats[indexCandidat].correspondCela);
      // =====================================================
      // A. VERBE PAS CONNU
      // B. VERBE CONNU MAIS CECI/CELA NE CORRESPONDENT PAS
      // =====================================================
      if (actionsCeciCela === null || actionsCeciCela.length === 0) {

        // ce candidat de commande n’a pas été validé

        const explicationRefu = this.act.obtenirRaisonRefuCommande(ctx.candidats[indexCandidat].els, ctx.candidats[indexCandidat].correspondCeci, ctx.candidats[indexCandidat].correspondCela);

        // correspondance CECI
        let tempCeci = null;
        if (ctx.candidats[indexCandidat].correspondCeci) {
          if (ctx.candidats[indexCandidat].correspondCeci.nbCor) {
            // élément
            if (ctx.candidats[indexCandidat].correspondCeci.elements.length) {
              tempCeci = ctx.candidats[indexCandidat].correspondCeci.elements[0];
              // compteur
            } else if (ctx.candidats[indexCandidat].correspondCeci.compteurs.length) {
              tempCeci = ctx.candidats[indexCandidat].correspondCeci.compteurs[0];
              // autre (direction)
            } else {
              tempCeci = ctx.candidats[indexCandidat].correspondCeci.localisation;
            }
            // non trouvé => intitulé
          } else {
            tempCeci = ctx.candidats[indexCandidat].correspondCeci?.intitule ?? null;
          }
        }

        // correspondance CELA
        let tempCela = null;
        if (ctx.candidats[indexCandidat].correspondCela) {
          if (ctx.candidats[indexCandidat].correspondCela.nbCor) {
            // élément
            if (ctx.candidats[indexCandidat].correspondCela.elements.length) {
              tempCela = ctx.candidats[indexCandidat].correspondCela.elements[0];
              // compteur
            } else if (ctx.candidats[indexCandidat].correspondCela.compteurs.length) {
              tempCela = ctx.candidats[indexCandidat].correspondCela.compteurs[0];
              // autre (direction)
            } else {
              tempCela = ctx.candidats[indexCandidat].correspondCela.localisation;
            }
            // non trouvé => intitulé
          } else {
            tempCela = ctx.candidats[indexCandidat].correspondCela.intitule;
          }
        }

        // Renvoyer l’explication du refu.
        const contexteTourRefu = new ContexteTour(tempCeci, tempCela);
        ctx.sortie = this.ins.dire.calculerTexteDynamique(explicationRefu, 0, undefined, contexteTourRefu, undefined, undefined);

        // regarder si de l’aide existe pour cet infinitif
        const aide = this.jeu.aides.find(x => x.infinitif === ctx.candidats[indexCandidat].els.infinitif);
        if (aide) {
          // Spécifier qu’une page d’aide existe pour la commande.
          ctx.sortie += "{u}{/Vous pouvez entrer « {-aide " + ctx.candidats[indexCandidat].els.infinitif + "-} » pour afficher l’aide de la commande./}";
        }

        // =============================================================================
        // C. PLUSIEURS ACTIONS SE DÉMARQUENT (on ne sait pas les départager)
        // =============================================================================
      } else if (actionsCeciCela.length > 1) {

        // ce candidat de commande ne peut pas être exécuté.
        ctx.sortie = "{+Erreur: plusieurs actions avec la même priorité trouvées (" + ctx.candidats[indexCandidat].els.infinitif + ").+}";

        // =============================================================================
        // D. UNE ACTION SE DÉMARQUE (ont a trouvé l’action)
        // =============================================================================
      } else {

        // la commande a été validée et sera exécutée
        ctx.commandeValidee = true;

        // console.log("Une action se démarque !");

        const candidatVainqueur = actionsCeciCela[0];

        // il peut y avoir plusieurs correspondances avec le même score pour un objet.
        // Ex: il y a une pomme par terre et des pommes sur le pommier on on fait « prendre pomme ».
        // => Dans ce cas, on prend un élément au hasard pour que le jeu ne soit pas bloqué.
        let indexCeci = 0;
        let indexCela = 0;

        if (candidatVainqueur.ceci?.length > 1) {
          ctx.sortie += "{+{/Il y a plusieurs résultats équivalents pour « " + ctx.candidats[indexCandidat].ceciIntituleV1.toString() + " ». Je choisis au hasard./}+}{n}";
          indexCeci = Math.floor(Math.random() * candidatVainqueur.ceci.length);
          console.log("indexCeci=", indexCeci);
        }
        if (candidatVainqueur.cela?.length > 1) {
          ctx.sortie += "{+{/Il y a plusieurs résultats équivalents pour « " + ctx.candidats[indexCandidat].celaIntituleV1.toString() + " ». Je choisis au hasard./}+}{n}";
          indexCela = Math.floor(Math.random() * candidatVainqueur.cela.length);
          console.log("indexCela=", indexCela);
        }

        const actionCeciCela = new ActionCeciCela(candidatVainqueur.action, (candidatVainqueur.ceci ? candidatVainqueur.ceci[indexCeci] : null), (candidatVainqueur.cela ? candidatVainqueur.cela[indexCela] : null));

        const isCeciV2 = actionCeciCela.ceci ? true : false;
        let ceciQuantiteV2 = ctx.candidats[indexCandidat].ceciQuantiteV1;
        // transformer « -1 » en la quantité de l’objet
        if (ceciQuantiteV2 === -1 && actionCeciCela.ceci && ClasseUtils.heriteDe(actionCeciCela.ceci.classe, EClasseRacine.objet)) {
          ceciQuantiteV2 = (actionCeciCela.ceci as Objet).quantite;
        }

        const ceciNomV2 = isCeciV2 ? actionCeciCela.ceci.nom : null;
        const ceciClasseV2 = (isCeciV2 ? actionCeciCela.ceci.classe : null)

        const isCelaV2 = actionCeciCela.cela ? true : false;
        let celaQuantiteV2 = ctx.candidats[indexCandidat].celaQuantiteV1;
        // transformer « -1 » en la quantité de l’objet
        if (celaQuantiteV2 === -1 && actionCeciCela.cela && ClasseUtils.heriteDe(actionCeciCela.cela.classe, EClasseRacine.objet)) {
          celaQuantiteV2 = (actionCeciCela.cela as Objet).quantite;
        }
        const celaNomV2 = isCelaV2 ? actionCeciCela.cela.nom : null;
        const celaClasseV2 = (isCelaV2 ? actionCeciCela.cela.classe : null)

        // mettre à jour l'évènement avec les éléments trouvés
        const evenementV2 = new Evenement(
          TypeEvenement.action,
          // verbe
          actionCeciCela.action.infinitif,
          // ceci
          isCeciV2, ctx.candidats[indexCandidat].els.preposition0, ceciQuantiteV2, ceciNomV2, ceciClasseV2,
          // cela
          isCelaV2, ctx.candidats[indexCandidat].els.preposition1, celaQuantiteV2, celaNomV2, celaClasseV2
        );

        // console.error(">>>>>> evenement = ", evenement);F


        // créer le contexte du tour
        const contexteTour = new ContexteTour(actionCeciCela.ceci, actionCeciCela.cela);

        // ÉVÈNEMENT AVANT la commande (qu'elle soit refusée ou non)
        let resultatAvant = new Resultat(true, "", 0);
        // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score ou si règle générique
        const declenchementsAvant = this.dec.avant(evenementV2);

        // éxécuter les règles déclenchées
        for (let index = 0; index < declenchementsAvant.length; index++) {
          const declenchement = declenchementsAvant[index];
          const sousResultatAvant = this.ins.executerInstructions(declenchement.instructions, contexteTour, evenementV2, declenchement.declenchements);
          ctx.sortie += sousResultatAvant.sortie;
          resultatAvant.succes = resultatAvant.succes && sousResultatAvant.succes;
          resultatAvant.nombre += sousResultatAvant.nombre;
          resultatAvant.stopperApresRegle = resultatAvant.stopperApresRegle || sousResultatAvant.stopperApresRegle;
          if (resultatAvant.stopperApresRegle) {
            break;
          }
        }

        // Continuer l’action (sauf si on a fait appel à l’instruction « STOPPER L’ACTION ».)
        if (resultatAvant.stopperApresRegle !== true) {
          // PHASE REFUSER (vérifier l'action)
          let refus = false;
          if (actionCeciCela.action.verifications) {
            // console.log("vérifications en cours pour la commande…");
            // parcourir les vérifications
            actionCeciCela.action.verifications.forEach(verif => {
              if (verif.conditions.length == 1) {
                if (!refus && this.cond.siEstVrai(null, verif.conditions[0], contexteTour, evenementV2, null)) {
                  // console.warn("> commande vérifie cela:", verif);
                  const resultatRefuser = this.ins.executerInstructions(verif.resultats, contexteTour, evenementV2, null);
                  ctx.sortie += resultatRefuser.sortie;
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
            const resultatExecuter = this.executerAction(actionCeciCela, contexteTour, evenementV2);
            ctx.sortie += resultatExecuter.sortie;
            // ÉVÈNEMENT APRÈS la commande
            let resultatApres = new Resultat(true, "", 0);
            // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score
            const declenchementsApres = this.dec.apres(evenementV2);
            if (declenchementsApres.length) {
              // éxécuter les règles déclenchées
              for (let index = 0; index < declenchementsApres.length; index++) {
                const declenchement = declenchementsApres[index];
                const sousResultatApres = this.ins.executerInstructions(declenchement.instructions, contexteTour, evenementV2, declenchement.declenchements);
                resultatApres.sortie += sousResultatApres.sortie;
                resultatApres.succes = resultatApres.succes && sousResultatApres.succes;
                resultatApres.nombre += sousResultatApres.nombre;
                resultatApres.terminerAvantRegle = resultatApres.terminerAvantRegle || (sousResultatApres.terminerAvantRegle && !declenchement.estRegleActionQuelconque);
                resultatApres.terminerAvantRegleGenerique = resultatApres.terminerAvantRegleGenerique || (sousResultatApres.terminerAvantRegle && declenchement.estRegleActionQuelconque);
                resultatApres.terminerApresRegle = resultatApres.terminerApresRegle || (sousResultatApres.terminerApresRegle && !declenchement.estRegleActionQuelconque);
                resultatApres.terminerApresRegleGenerique = resultatApres.terminerApresRegleGenerique || (sousResultatApres.terminerApresRegle && declenchement.estRegleActionQuelconque);
              }

              // terminer avant sortie règle « après » ?
              // rem: si aucune sortie pour la règle après, on termine d’office.
              // rem: si règle générique demande de continuer, on le fait que si elle est toute seule sinon on tient compte des autres règles
              if (resultatApres.terminerAvantRegle || !resultatApres.sortie || (resultatApres.terminerAvantRegleGenerique && declenchementsApres.length == 1)) {
                // PHASE TERMINER l'action (avant sortie règle « après ») => « terminer l’action avant »
                const resultatFinaliser = this.finaliserAction(actionCeciCela, contexteTour, evenementV2);
                ctx.sortie += resultatFinaliser.sortie;
                // éviter de terminer 2x l’action (en cas d’erreur de l’utilisateur)
                if (resultatApres.terminerApresRegle || resultatApres.terminerApresRegleGenerique) {
                  resultatApres.terminerApresRegle = false;
                  resultatApres.terminerApresRegleGenerique = false;
                }
              }

              // sortie règle après
              ctx.sortie += resultatApres.sortie;

              // terminer après sortie règle « après » ?
              // rem: si règle générique demande de continuer, on le fait que si elle est toute seule sinon on tient compte des autres règles
              if (resultatApres.terminerApresRegle || (resultatApres.terminerApresRegleGenerique && declenchementsApres.length == 1)) {
                // PHASE TERMINER l'action (après sortie règle « après ») => « terminer l’action après » (ou « continuer l’action »)
                const resultatFinaliser = this.finaliserAction(actionCeciCela, contexteTour, evenementV2);
                ctx.sortie += resultatFinaliser.sortie;
              }

            } else {
              // PHASE TERMINER l'action (sans règle « après »)
              const resultatFinaliser = this.finaliserAction(actionCeciCela, contexteTour, evenementV2);
              ctx.sortie += resultatFinaliser.sortie;
            }

          }
        }

      }
    }
  }

  private executerAction(action: ActionCeciCela, contexteTour: ContexteTour, evenement: Evenement) {
    const resultat = this.ins.executerInstructions(action.action.instructions, contexteTour, evenement, undefined);
    return resultat;
  }

  private finaliserAction(action: ActionCeciCela, contexteTour: ContexteTour, evenement: Evenement) {
    const resultat = this.ins.executerInstructions(action.action.instructionsFinales, contexteTour, evenement, undefined);
    return resultat;
  }


}
