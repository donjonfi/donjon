import { Action, ActionCeciCela } from '../models/compilateur/action';
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Abreviations } from '../utils/jeu/abreviations';
import { BalisesHtml } from '../utils/jeu/balises-html';
import { CibleAction } from '../models/compilateur/cible-action';
import { ClasseUtils } from '../utils/commun/classe-utils';
import { ClassesRacines } from '../models/commun/classes-racines';
import { Commandes } from '../utils/jeu/commandes';
import { ConditionsUtils } from '../utils/jeu/conditions-utils';
import { Correspondance } from '../utils/jeu/correspondance';
import { Declencheur } from '../utils/jeu/declencheur';
import { EClasseRacine } from '../models/commun/constantes';
import { ElementJeu } from '../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../utils/commun/elements-jeu-utils';
import { ElementsPhrase } from '../models/commun/elements-phrase';
import { Evenement } from '../models/jouer/evenement';
import { GroupeNominal } from '../models/commun/groupe-nominal';
import { Instructions } from '../utils/jeu/instructions';
import { Intitule } from '../models/jeu/intitule';
import { Jeu } from '../models/jeu/jeu';
import { Objet } from '../models/jeu/objet';
import { PhraseUtils } from '../utils/commun/phrase-utils';
import { ResultatVerifierCandidat } from '../models/jeu/resultat-verifier-candidat';

@Component({
  selector: 'djn-lecteur',
  templateUrl: './lecteur.component.html',
  styleUrls: ['./lecteur.component.scss']
})
export class LecteurComponent implements OnInit, OnChanges {

  static verbeux = true;

  @Input() jeu: Jeu;
  @Input() verbeux = false;
  @Input() debogueur = false;

  readonly TAILLE_DERNIERES_COMMANDES: number = 10;

  sortieJoueur: string = null;
  commande = "";
  historiqueCommandes = new Array<string>();
  curseurHistorique = -1;

  private com: Commandes;
  private ins: Instructions;
  private eju: ElementsJeuUtils;
  private cond: ConditionsUtils;

  private dec: Declencheur;

  @ViewChild('txCommande') commandeInputRef: ElementRef;
  @ViewChild('taResultat') resultatInputRef: ElementRef;

  resteDeLaSortie: string[] = [];
  commandeEnCours: boolean = false;

  constructor() { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.jeu) {
      console.warn("jeu: ", this.jeu);
      this.sortieJoueur = "";
      this.resteDeLaSortie = [];
      this.commandeEnCours = false;
      this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
      this.dec = new Declencheur(this.jeu.auditeurs, this.verbeux);
      this.ins = new Instructions(this.jeu, this.eju, this.verbeux);
      this.com = new Commandes(this.jeu, this.ins, this.verbeux);
      this.cond = new ConditionsUtils(this.jeu, this.verbeux);
      // afficher le titre et la version du jeu
      this.sortieJoueur += ("<h5>" + (this.jeu.titre ? BalisesHtml.retirerBalisesHtml(this.jeu.titre) : "(jeu sans titre)"));
      // afficher la version du jeu
      if (this.jeu.version) {
        this.sortieJoueur += ("<small> " + BalisesHtml.retirerBalisesHtml(this.jeu.version) + "</small>");
      }
      this.sortieJoueur += "</h5><p>Un jeu de ";

      // afficher l’auteur du jeu
      if (this.jeu.auteur) {
        this.sortieJoueur += (BalisesHtml.retirerBalisesHtml(this.jeu.auteur));
      } else if (this.jeu.auteurs) {
        this.sortieJoueur += (BalisesHtml.retirerBalisesHtml(this.jeu.auteurs));
      } else {
        this.sortieJoueur += ("(anonyme)");
      }

      // afficher la licence du jeu
      if (this.jeu.licenceTitre) {
        if (this.jeu.licenceLien) {
          this.sortieJoueur += ('<br>Licence : <a href="' + BalisesHtml.retirerBalisesHtml(this.jeu.licenceLien) + '" target="_blank">' + BalisesHtml.retirerBalisesHtml(this.jeu.licenceTitre) + "</a>");
        } else {
          this.sortieJoueur += ("<br>Licence :" + BalisesHtml.retirerBalisesHtml(this.jeu.licenceTitre));
        }
      }
      this.sortieJoueur += "</p>";

      // nouvelle partie
      if (!this.jeu.commence) {

        this.sortieJoueur += "<p>";

        // évènement COMMENCER JEU
        let evCommencerJeu = new Evenement('commencer', true, 'jeu', ClassesRacines.Special);

        // éxécuter les instructions AVANT le jeu commence
        let resultatAvant = this.ins.executerInstructions(this.dec.avant(evCommencerJeu));
        if (resultatAvant.sortie) {
          this.ajouterSortieJoueur(BalisesHtml.doHtml(resultatAvant.sortie));
        }

        // définir visibilité des objets initiale
        this.eju.majPresenceDesObjets();

        // définir adjacence des lieux initiale
        this.eju.majAdjacenceLieux();

        // continuer l’exécution de l’action si elle n’a pas été arrêtée
        if (!resultatAvant.stopper) {
          // exécuter les instruction REMPLACER s’il y a lieu, sinon suivre le cours normal
          let resultatRemplacer = this.ins.executerInstructions(this.dec.remplacer(evCommencerJeu));
          if (resultatRemplacer.nombre === 0) {
            // afficher où on est.
            this.ajouterSortieJoueur("<p>" + BalisesHtml.doHtml(this.com.ouSuisJe()) + "</p>");
            this.jeu.commence = true;
          }

          // éxécuter les instructions APRÈS le jeu commence
          const resultatApres = this.ins.executerInstructions(this.dec.apres(evCommencerJeu));
          if (resultatApres.sortie) {
            this.ajouterSortieJoueur(BalisesHtml.doHtml(resultatApres.sortie));
          }
        }
        //terminer le paragraphe sauf si on attends une touche pour continuer
        if (!this.resteDeLaSortie?.length && !this.sortieJoueur.endsWith("</p>")) {
          this.sortieJoueur += "</p>";
        }
        // REPRISE D’UNE PARTIE
      } else {
        this.sortieJoueur += ("<p>" + BalisesHtml.doHtml("{/{+(reprise de la partie)+}/}") + "</p>");
        // afficher où on est.
        this.ajouterSortieJoueur("<p>" + BalisesHtml.doHtml(this.com.ouSuisJe()) + "</p>");
      }

      this.focusCommande();

    } else {
      console.log("Lecteur: Pas de jeu chargé.");
    }
  }

  /**
   * Ajouter du contenu à la sortie pour le joueur.
   * Cette méthode tient compte des pauses (attendre touche).
   */
  private ajouterSortieJoueur(contenu: string) {
    if (contenu) {
      // découper en fonction des pauses
      const sectionsContenu = contenu.split("@@attendre touche@@");
      // s'il y a du texte en attente, ajouter au texte en attente
      if (this.resteDeLaSortie?.length) {
        this.resteDeLaSortie[this.resteDeLaSortie.length - 1] += ("</p><p>" + sectionsContenu[0]);
        this.resteDeLaSortie = this.resteDeLaSortie.concat(sectionsContenu.slice(1));
        // s'il n'y a pas de texte en attente, afficher la première partie
      } else {
        // retrouver le dernier effacement d’écran éventuel
        const texteSection = sectionsContenu[0];
        const indexDernierEffacement = texteSection.lastIndexOf("@@effacer écran@@");
        // s’il ne faut pas effacer l’écran
        if (indexDernierEffacement == -1) {
          // ajouter à la suite
          this.sortieJoueur += texteSection;
          // sinon
        } else {
          // remplacer la sortie du joueur
          this.sortieJoueur = "<p>" + texteSection.slice(indexDernierEffacement + "@@effacer écran@@".length);
        }
        // attendre pour afficher la suite éventuelle
        if (sectionsContenu.length > 1) {
          this.sortieJoueur += '<p class="text-primary font-italic">Appuyez sur une touche…</p>'
          this.resteDeLaSortie = this.resteDeLaSortie.concat(sectionsContenu.slice(1));
        }
      }
    }
  }

  private afficherSuiteSortie() {
    // prochaine section à afficher
    let texteSection = this.resteDeLaSortie.shift();
    // retrouver le dernier effacement d’écran éventuel
    const indexDernierEffacement = texteSection.lastIndexOf("@@effacer écran@@");
    // s’il ne faut pas effacer l’écran
    if (indexDernierEffacement == -1) {
      // enlever premier retour à la ligne
      if (texteSection.startsWith("<br>")) {
        texteSection = texteSection.slice("<br>".length);
      }
      // ajouter à la suite
      this.sortieJoueur += ("<p>" + texteSection + "</p>");
      // sinon
    } else {
      // remplacer la sortie du joueur
      this.sortieJoueur = "<p>" + texteSection.slice(indexDernierEffacement + "@@effacer écran@@".length) + "</p>";
    }

    // s’il reste d’autres sections, attendre
    if (this.resteDeLaSortie.length) {
      this.sortieJoueur += '<p class="text-primary font-italic">Appuyez sur une touche…</p>'
    }
    // scroll
    setTimeout(() => {
      this.resultatInputRef.nativeElement.scrollTop = this.resultatInputRef.nativeElement.scrollHeight;
      this.commandeInputRef.nativeElement.focus();
    }, 100);
  }

  /**
   * Appuis sur une touche par le joueur.
   */
  onKeyDown(event: Event) {
    // éviter de déclancher appuis touche avant la fin de la commande en cours
    if (!this.commandeEnCours) {
      // regarder s’il reste du texte à afficher
      if (this.resteDeLaSortie?.length) {
        this.afficherSuiteSortie();
        this.commande = "";
        event.preventDefault();
      }
    }
  }

  /**
   * Historique: aller en arrière (flèche haut)
   * @param event
   */
  onKeyDownArrowUp(event) {
    if (!this.resteDeLaSortie?.length) {
      if (this.curseurHistorique < (this.historiqueCommandes.length - 1)) {
        this.curseurHistorique += 1;
        const index = (this.historiqueCommandes.length - this.curseurHistorique - 1);
        this.commande = this.historiqueCommandes[index];
        this.focusCommande();
      }
    }
  }

  /**
   * Historique: revenir en avant (Flèche bas)
   */
  onKeyDownArrowDown(event) {
    if (!this.resteDeLaSortie?.length) {
      if (this.curseurHistorique >= 0) {
        this.curseurHistorique -= 1;
        const index = (this.historiqueCommandes.length - this.curseurHistorique - 1);
        this.commande = this.historiqueCommandes[index];
        this.focusCommande();
      } else {
        this.commande = "";
      }
    }
  }

  public focusCommande() {
    setTimeout(() => {
      this.commandeInputRef.nativeElement.focus();
      this.commandeInputRef.nativeElement.selectionStart = this.commandeInputRef.nativeElement.selectionEnd = this.commande?.length ?? 0;
    }, 100);
  }

  /** Tabulation: continuer le mot */
  onKeyDownTab(event) {
    if (!this.resteDeLaSortie?.length) {
      const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande);
      if (commandeComplete !== this.commande) {
        this.commande = commandeComplete;
        this.focusCommande();
      }
    }
  }

  onClickValidate(event: Event) {
    if (this.resteDeLaSortie?.length) {
      event.preventDefault(); // éviter que l’évènement soit encore émis ailleurs
      this.afficherSuiteSortie();
    } else {
      this.onKeyDownEnter(event);
    }
  }

  /**
   * Enter: Valider une commande.
   * @param event 
   */
  onKeyDownEnter(event: Event) {
    if (!this.resteDeLaSortie?.length) {
      this.curseurHistorique = -1;
      if (this.commande && this.commande.trim() !== "") {
        event.stopPropagation; // éviter que l’évènement soit encore émis ailleurs
        this.commandeEnCours = true; // éviter qu’il déclanche attendre touche trop tôt et continue le texte qui va être ajouté ci dessous durant cet appuis-ci
        // compléter la commande
        const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande);
        this.sortieJoueur += '<p><span class="text-primary">' + BalisesHtml.doHtml(' > ' + this.commande + (this.commande !== commandeComplete ? (' (' + commandeComplete + ')') : '')) + '</span><br>';
        const result = this.doCommande(commandeComplete.trim());
        if (result) {
          // console.log("resultat commande:", result);
          this.ajouterSortieJoueur(BalisesHtml.doHtml(result));
        }
        this.sortieJoueur += "</p>";
        this.commande = "";
        setTimeout(() => {
          this.resultatInputRef.nativeElement.scrollTop = this.resultatInputRef.nativeElement.scrollHeight;
          this.commandeInputRef.nativeElement.focus();
          this.commandeEnCours = false;
        }, 100);
      }
    }
  }

  doCommande(commande: string): string {

    if (this.jeu.termine) {
      return "Le jeu est terminé.{n}Pour débuter une nouvelle partie veuillez actualiser la page web.";
    }

    // effacer les espaces multiples et faire un trim sur la commande
    // pour ne pas afficher une erreur en cas de faute de frappe…
    const commandeNettoyee = commande?.replace(/\s\s+/g, ' ').trim();

    // GESTION HISTORIQUE
    // ajouter à l’historique (à condition que différent du précédent)
    if (this.historiqueCommandes.length === 0 || (this.historiqueCommandes[this.historiqueCommandes.length - 1] !== commandeNettoyee)) {
      this.historiqueCommandes.push(commandeNettoyee);
      if (this.historiqueCommandes.length > this.TAILLE_DERNIERES_COMMANDES) {
        this.historiqueCommandes.shift();
      }
    }

    // COMPRENDRE LA COMMANDE
    const els = PhraseUtils.decomposerCommande(commandeNettoyee);

    let retVal = "";

    if (els) {

      const isCeciV1 = els.sujet ? true : false;
      const ceciIntituleV1 = els.sujet;
      const ceciNomV1 = isCeciV1 ? (ceciIntituleV1.nom + (ceciIntituleV1.epithete ? (" " + ceciIntituleV1.epithete) : "")) : null;
      const ceciClasseV1 = null;
      const resultatCeci = isCeciV1 ? this.eju.trouverCorrespondance(ceciIntituleV1, true, true) : null;

      const isCelaV1 = els.sujetComplement1 ? true : false;
      const celaIntituleV1 = els.sujetComplement1;
      const celaNomV1 = isCelaV1 ? (celaIntituleV1.nom + (celaIntituleV1.epithete ? (" " + celaIntituleV1.epithete) : "")) : null;
      const celaClasseV1 = null;
      const resultatCela = isCelaV1 ? this.eju.trouverCorrespondance(celaIntituleV1, true, true) : null;

      let evenement = new Evenement(
        els.infinitif,
        isCeciV1, ceciNomV1, ceciClasseV1,
        els.preposition1,
        isCelaV1, celaNomV1, celaClasseV1
      );

      // si on a déjà une erreur, ne pas continuer.
      if (retVal.length > 0) {
        return retVal;
      }

      switch (els.infinitif) {

        // commande « en dur »
        case "déboguer":
          retVal = this.com.deboguer(els);
          break;

        // autres commandes
        default:
          const actionsCeciCela = this.trouverActionPersonnalisee(els, resultatCeci, resultatCela);

          // =====================================================
          //  A. VERBE PAS CONNU
          // =====================================================
          if (actionsCeciCela === null) {

            retVal = "Désolé, je n’ai pas compris le verbe « " + els.infinitif + " ».";

            // =====================================================
            // B. VERBE CONNU MAIS CECI/CELA NE CORRESPONDENT PAS
            // =====================================================
          } else if (actionsCeciCela.length === 0) {

            retVal = "Je comprends « " + els.infinitif + " » mais il y a un souci avec les arguments ou la formulation de la commande.";
            // vérifier si on a trouvé les éléments de la commande.
            if (ceciIntituleV1) {
              // ON N'A PAS TROUVÉ L'OBJET
              if (resultatCeci.nbCor === 0) {
                retVal += "\n{+(Je ne trouve pas ceci : « " + this.com.outils.afficherIntitule(ceciIntituleV1) + " ».)+}";
              } else {
                // ON NE VOIT PAS L'OBJET
                // vérifier si les objets de la commande sont visibles
                if (resultatCeci && resultatCeci.nbCor === 1 && resultatCeci.objets.length === 1) {
                  if (!this.jeu.etats.estVisible(resultatCeci.objets[0], this.eju)) {
                    retVal += "\n{+(Actuellement, je ne vois pas ceci : « " + this.com.outils.afficherIntitule(resultatCeci.objets[0].intitule) + " ».)+}";
                  }
                }
              }
            }
            if (celaIntituleV1) {
              // ON N'A PAS TROUVÉ L'OBJET
              if (resultatCela.nbCor === 0) {
                retVal += "\n{+(Je ne trouve pas cela : « " + this.com.outils.afficherIntitule(celaIntituleV1) + " ».)+}";
              } else {
                // ON NE VOIT PAS L'OBJET
                if (resultatCela && resultatCela.nbCor === 1 && resultatCela.objets.length === 1) {
                  if (!this.jeu.etats.estVisible(resultatCela.objets[0], this.eju)) {
                    retVal += "\n{+(Actuellement, je ne vois pas cela : « " + this.com.outils.afficherIntitule(resultatCela.objets[0].intitule) + " ».)+}";
                  }
                }
              }
            }

            // regarder si de l’aide existe pour cet infinitif
            const aide = this.jeu.aides.find(x => x.infinitif === els.infinitif);
            if (aide) {
              retVal += "\n{/Vous pouvez entrer « {-aide " + els.infinitif + "-} » pour afficher les informations concernant cette commande./}";
            } else {
              retVal += "\n{/(Il n’y a pas de page d’aide concernant cette commande.)/}";
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

            const actionCeciCela = actionsCeciCela[0];

            const isCeciV2 = actionCeciCela.ceci ? true : false;
            const ceciNomV2 = isCeciV2 ? actionCeciCela.ceci.nom : null;
            const ceciClasseV2 = (isCeciV2 ? actionCeciCela.ceci.classe : null)

            const isCelaV2 = actionCeciCela.cela ? true : false;
            const celaNomV2 = isCelaV2 ? actionCeciCela.cela.nom : null;
            const celaClasseV2 = (isCelaV2 ? actionCeciCela.cela.classe : null)

            // mettre à jour l'évènement avec les éléments trouvés
            evenement = new Evenement(
              actionCeciCela.action.infinitif,
              isCeciV2, ceciNomV2, ceciClasseV2,
              els.preposition1,
              isCelaV2, celaNomV2, celaClasseV2
            );

            // ÉVÈNEMENT AVANT la commande (qu'elle soit refusée ou non)
            const resultatAvant = this.ins.executerInstructions(this.dec.avant(evenement), actionCeciCela.ceci, actionCeciCela.cela);
            retVal = resultatAvant.sortie;
            // Continuer l’action (sauf si on a fait appel à l’instruction « STOPPER L’ACTION ».)
            if (resultatAvant.stopper !== true) {
              // PHASE REFUSER (vérifier l'action)
              let refus = false;
              if (actionCeciCela.action.verifications) {
                // console.log("vérifications en cours pour la commande…");
                // parcourir les vérifications
                actionCeciCela.action.verifications.forEach(verif => {
                  if (verif.conditions.length == 1) {
                    if (!refus && this.cond.siEstVraiAvecLiens(null, verif.conditions[0], actionCeciCela.ceci, actionCeciCela.cela)) {
                      // console.warn("> commande vérifie cela:", verif);
                      const resultatRefuser = this.ins.executerInstructions(verif.resultats, actionCeciCela.ceci, actionCeciCela.cela);
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
                const resultatExecuter = this.executerAction(actionCeciCela);
                retVal += resultatExecuter.sortie;
                // ÉVÈNEMENT APRÈS la commande
                const resultatApres = this.ins.executerInstructions(this.dec.apres(evenement), actionCeciCela.ceci, actionCeciCela.cela);
                retVal += resultatApres.sortie;
                // PHASE TERMINER l'action (seulement s'il n'y avait pas de " après " ou bien si on a forcé avec « CONTINUER L’ACTION ».)
                if (resultatApres.nombre === 0 || resultatApres.continuer === true) {
                  // terminer l’action
                  const resultatFinaliser = this.finaliserAction(actionCeciCela);
                  retVal += resultatFinaliser.sortie;
                }
              }
            }

          }

          break;
      }
    } else {
      retVal = "Désolé, je n'ai pas compris la commande « " + commandeNettoyee + " ».";
    }
    return retVal;
  }

  private executerAction(action: ActionCeciCela) {
    const resultat = this.ins.executerInstructions(action.action.instructions, action.ceci, action.cela);
    return resultat;
  }

  private finaliserAction(action: ActionCeciCela) {
    const resultat = this.ins.executerInstructions(action.action.instructionsFinales, action.ceci, action.cela);
    return resultat;
  }

  private trouverActionPersonnalisee(els: ElementsPhrase, ceci: Correspondance, cela: Correspondance): ActionCeciCela[] {

    // console.log("trouverActionPersonnalisee els=", els, "ceci=", ceci, "cela=", cela);

    let candidats: Action[] = [];
    let matchCeci: ResultatVerifierCandidat = null;
    let matchCela: ResultatVerifierCandidat = null;
    let resultat: ActionCeciCela[] = null;
    let verbeConnu: boolean = false;

    // trouver les commande qui corresponde (sans vérifier le sujet (+complément) exacte)
    this.jeu.actions.forEach(action => {
      // vérifier infinitif
      let infinitifOk = (els.infinitif === action.infinitif);
      // vérifier également les synonymes
      if (!infinitifOk && action.synonymes) {
        action.synonymes.forEach(synonyme => {
          if (!infinitifOk && els.infinitif === synonyme) {
            infinitifOk = true;
          }
        });
      }

      if (infinitifOk) {
        verbeConnu = true;
        // vérifier sujet
        if ((els.sujet && action.ceci) || (!els.sujet && !action.ceci)) {
          // vérifier complément
          if ((els.sujetComplement1 && action.cela) || (!els.sujetComplement1 && !action.cela)) {
            candidats.push(action);
          }
        }
      }

    });

    if (this.verbeux) {
      console.warn("testerCommandePersonnalisee :", candidats.length, "candidat(s) p1 :", candidats);
    }

    if (verbeConnu) {
      resultat = []; // verbe connu

      // infinitif + sujet (+complément), vérifier que celui de la commande correspond
      if (els.sujet) {

        let meilleurScore = 0;

        candidats.forEach(candidat => {
          let candidatCorrespond = false;
          matchCeci = null;
          matchCela = null;

          // 1) vérifier sujet (CECI)
          if (candidat.cibleCeci) {
            matchCeci = this.verifierCandidatCeciCela(ceci, candidat.cibleCeci);
            // A. aucun candidat valide trouvé
            if (matchCeci.elementsTrouves.length === 0) {
              console.log(">>> Pas de candidat valide trouvé pour ceci avec le candidat:", candidat, "ceci:", ceci);
              // B. plusieurs candidats se démarquent
            } else if (matchCeci.elementsTrouves.length !== 1) {
              console.warn(">>> Plusieurs candidats se démarquent pour ceci avec le candidat:", candidat, "ceci:", ceci);
              // C. exactement un candidat se démarque
            } else {
              // 2) vérifier complément (CELA)
              if (els.complement1) {
                if (candidat.cibleCela) {
                  matchCela = this.verifierCandidatCeciCela(cela, candidat.cibleCela);
                  // A. aucun candidat valide trouvé
                  if (matchCela.elementsTrouves.length === 0) {
                    console.log(">>> Pas de candidat valide trouvé pour cela avec le candidat:", candidat, "cela:", cela);
                    // B. plusieurs candidats se démarquent
                  } else if (matchCela.elementsTrouves.length !== 1) {
                    console.warn(">>> Plusieurs candidats se démarquent pour cela avec le candidat:", candidat, "cela:", cela);
                    // C. exactement un candidat se démarque
                  } else {
                    candidatCorrespond = true;
                  }
                }
                // pas de cela
              } else {
                candidatCorrespond = true;
              }
            }
          }

          if (candidatCorrespond) {

            const score = matchCeci.meilleurScore + (matchCela?.meilleurScore ?? 0);

            // meilleur score jusqu’à présent => remplace le précédent résultat
            if (score > meilleurScore) {
              meilleurScore = score;
              resultat = [new ActionCeciCela(candidat, (matchCeci ? matchCeci[0] : null), (matchCela ? matchCela[0] : null))];
              // plusieurs scores équivalents => on ajoute au résultat existant
            } else if (score === meilleurScore) {
              resultat.push(new ActionCeciCela(candidat, (matchCeci ? matchCeci[0] : null), (matchCela ? matchCela[0] : null)));
            }
          }
        });

        // infinitif simple
      } else {
        // à priori on ne devrait avoir qu’un seul résultat vue que verbe simple…
        candidats.forEach(candidat => {
          resultat.push(new ActionCeciCela(candidat, null, null));
        });
      }
    }
    return resultat;
  }

  /**
   * Vérifier si on trouve l’élément rechercher parmis les correspondances.
   * @param ceciCela  correspondances
   * @param candidatCeciCela  élément recherché
   * @returns élément éventuellement trouvé ou -1 si plusieurs éléments possibles.
   */
  private verifierCandidatCeciCela(ceciCela: Correspondance, candidatCeciCela: CibleAction): ResultatVerifierCandidat {
    let retVal: Array<ElementJeu | Intitule> = [];

    // on donne un score aux correspondances : cela permet de départager plusieurs corresspondances.
    let meilleurScore = 0;

    // il s’agit d’un sujet précis
    if (candidatCeciCela.determinant.match(/^(du|((de )?(le|la|l’|l'|les)))?( )?$/)) {

      // Vérifier s’il s’agit du sujet précis
      // PRIORITÉ 1 >> élément (objet ou lieu)
      if (ceciCela.elements.length) {
        console.log("verifierCandidatCeciCela > sujet précis > élements (" + candidatCeciCela.nom + (candidatCeciCela.epithete ?? '') + ")");
        // vérifier s’il s’agit du sujet précis
        ceciCela.elements.forEach(ele => {
          console.log("check for ele=", ele, "candidatCeciCela=", candidatCeciCela);
          console.log("check for ele.intitule.nom=", ele.intitule.nom, "candidatCeciCela.nom=", candidatCeciCela.nom);
          console.log("check for ele.intitule.epithete=", ele.intitule.epithete, "candidatCeciCela.epithete=", candidatCeciCela.epithete);
          if (ele.intitule.nom === candidatCeciCela.nom && ele.intitule.epithete === candidatCeciCela.epithete) {
            let curScore = 1000;
            // si priorité respectée, score augmente
            if (candidatCeciCela.priorite) {
              if (this.jeu.etats.possedeEtatElement(ele, candidatCeciCela.priorite, this.eju)) {
                curScore += 500; // prioritaire
              }
            }
            // meilleur score jusqu’à présent => remplace le précédent résultat
            if (curScore > meilleurScore) {
              meilleurScore = curScore;
              retVal = [ele];
              // 2 scores équivalents => on ajoute au résultat existant
            } else if (curScore === meilleurScore) {
              retVal.push(ele);
            }
          }
        });
        // PRIORITÉ 2 >> compteur
      } else if (ceciCela.compteurs.length) {
        console.log("verifierCandidatCeciCela > sujet précis > compteurs (" + candidatCeciCela.nom + (candidatCeciCela.epithete ?? '') + ")");
        // vérifier s’il s’agit du sujet précis
        ceciCela.compteurs.forEach(cpt => {
          console.log("check for cpt=", cpt, "candidatCeciCela=", candidatCeciCela);
          console.log("check for cpt.intitule.nom=", cpt.intitule.nom, "candidatCeciCela.nom=", candidatCeciCela.nom);
          console.log("check for cpt.intitule.epithete=", cpt.intitule.epithete, "candidatCeciCela.epithete=", candidatCeciCela.epithete);

          if (cpt.intitule.nom === candidatCeciCela.nom && cpt.intitule.epithete === candidatCeciCela.epithete) {
            let curScore = 500;
            if (curScore > meilleurScore) {
              meilleurScore = curScore;
              retVal = [cpt];
            } else {
              // déjà un match, on en a plusieurs
              // (ici ils ont toujours la même valeur)
              retVal.push(cpt);
            }
          }
        });
        // PRIORITÉ 3 >> intitulé
      } else if (ceciCela.intitule) {
        console.log("verifierCandidatCeciCela > sujet précis > intitulé (" + candidatCeciCela.nom + (candidatCeciCela.epithete ?? '') + ")");

        const intitule = ceciCela.intitule;

        // vérifier s’il s’agit du sujet précis
        console.log("check for intitule=", intitule, "candidatCeciCela=", candidatCeciCela);
        console.log("check for intitule.intitule.nom=", intitule.intitule.nom, "candidatCeciCela.nom=", candidatCeciCela.nom);
        console.log("check for intitule.intitule.epithete=", intitule.intitule.epithete, "candidatCeciCela.epithete=", candidatCeciCela.epithete);

        if (intitule.intitule.nom === candidatCeciCela.nom && intitule.intitule.epithete === candidatCeciCela.epithete) {
          let curScore = 250;
          if (curScore > meilleurScore) {
            meilleurScore = curScore;
            retVal = [intitule];
          } else {
            // déjà un match, on en a plusieurs
            // (ici ils ont toujours la même valeur)
            retVal.push(intitule);
          }
        }
      }

      // todo: vérifier début de nom si aucune correspondance exacte

      // il s’agit d’un type
    } else if (candidatCeciCela.determinant.match(/^(un|une|des|deux)( )?$/)) {
      ceciCela.elements.forEach(ele => {
        // vérifier si l’ojet est du bon type
        if (ClasseUtils.heriteDe(ele.classe, ClasseUtils.getIntituleNormalise(candidatCeciCela.nom))) {

          // s’il n’y a pas d’état requis ou si l’état est respecté
          if (!candidatCeciCela.epithete || this.jeu.etats.possedeEtatElement(ele, candidatCeciCela.epithete, this.eju)) {
            let curScore = 125;
            // si priorité respectée, score augmente
            if (candidatCeciCela.priorite) {
              if (this.jeu.etats.possedeEtatElement(ele, candidatCeciCela.priorite, this.eju)) {
                curScore += 75; // prioritaire
              }
            }
            // meilleur score jusqu’à présent => remplace le précédent résultat
            if (curScore > meilleurScore) {
              meilleurScore = curScore;
              retVal = [ele];
              // plusieurs scores équivalents => on ajoute au résultat existant
            } else if (curScore === meilleurScore) {
              retVal.push(ele);
            }
          }
        }
      });

      // si ce n'est pas un élément du jeu,
      //  - vérifier direction
      if (meilleurScore === 0 && ceciCela.localisation && (ClasseUtils.getIntituleNormalise(candidatCeciCela.nom) === EClasseRacine.direction || ClasseUtils.getIntituleNormalise(candidatCeciCela.nom) === EClasseRacine.intitule)) {
        meilleurScore = 75;
        retVal = [ceciCela.localisation];
      }
      //  - vérifier intitué
      if (meilleurScore === 0 && ClasseUtils.getIntituleNormalise(candidatCeciCela.nom) === EClasseRacine.intitule) {
        meilleurScore = 50;
        retVal = [ceciCela.intitule];
      }

    }
    console.warn("VerifierCandidat >>> \nbestScore=", meilleurScore, "\ncandidatCeciCela=", candidatCeciCela, "\nceciCela=", ceciCela);
    return new ResultatVerifierCandidat(retVal, meilleurScore);
  }

}
