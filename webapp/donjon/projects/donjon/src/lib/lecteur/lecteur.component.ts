import { Action, ActionCeciCela } from '../models/compilateur/action';
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Abreviations } from '../utils/jeu/abreviations';
import { BalisesHtml } from '../utils/jeu/balises-html';
import { ClasseUtils } from '../utils/commun/classe-utils';
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

@Component({
  selector: 'djn-lecteur',
  templateUrl: './lecteur.component.html',
  styleUrls: ['./lecteur.component.scss']
})
export class LecteurComponent implements OnInit, OnChanges {

  static verbeux = true;

  @Input() jeu: Jeu;
  @Input() verbeux = false;

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

  constructor() { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.jeu) {
      console.warn("jeu: ", this.jeu);
      this.sortieJoueur = "";
      this.resteDeLaSortie = [];
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
        let evCommencerJeu = new Evenement('commencer', 'jeu');

        // éxécuter les instructions AVANT le jeu commence
        let resultatAvant = this.ins.executerInstructions(this.dec.avant(evCommencerJeu));
        if (resultatAvant.sortie) {
          this.ajouterSortieJoueur(BalisesHtml.doHtml(resultatAvant.sortie));
        }
        // continuer l’exécution de l’action si elle n’a pas été arrêtée
        if (resultatAvant.stopper !== true) {

          // définir visibilité des objets initiale
          this.eju.majPresenceDesObjets();


          // exécuter les instruction REMPLACER s’il y a lieu, sinon suivre le cours normal
          let resultatRemplacer = this.ins.executerInstructions(this.dec.remplacer(evCommencerJeu));
          if (resultatRemplacer.nombre === 0) {
            // afficher où on est.
            this.ajouterSortieJoueur("<p>" + BalisesHtml.doHtml(this.com.ouSuisJe()) + "</p>");
            this.jeu.commence = true;
          }

          // éxécuter les instructions APRÈS le jeu commence
          const resultatApres = this.ins.executerInstructions(this.dec.apres(evCommencerJeu));
          this.ajouterSortieJoueur(BalisesHtml.doHtml(resultatApres.sortie));
        }
        //terminer le paragraphe sauf si on attends une touche pour continuer
        if (!this.resteDeLaSortie?.length) {
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
      console.warn("pas de jeu :(");
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
        this.sortieJoueur += sectionsContenu[0];
        if (sectionsContenu.length > 1) {
          this.sortieJoueur += '<p class="text-primary font-italic">Appuyez sur une touche…</p>'
          this.resteDeLaSortie = this.resteDeLaSortie.concat(sectionsContenu.slice(1));
        }
      }
    }
  }

  /**
   * Appuis sur une touche par le joueur.
   */
  onKeyDown(event: Event) {
    if (this.resteDeLaSortie?.length) {
      this.afficherSuiteSortie();
      this.commande = "";
      event.preventDefault();
    }
  }

  private afficherSuiteSortie() {
    this.sortieJoueur += ("<p>" + this.resteDeLaSortie.shift() + "</p>");
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
      this.afficherSuiteSortie();
      event.preventDefault();
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
        // compléter la commande
        const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande);
        this.sortieJoueur += '<p><span class="text-primary">' + BalisesHtml.doHtml(' > ' + this.commande + (this.commande !== commandeComplete ? (' (' + commandeComplete + ')') : '')) + '</span><br>';
        const result = this.doCommande(commandeComplete.trim());
        if (result) {
          this.ajouterSortieJoueur(BalisesHtml.doHtml(result));
        }
        this.sortieJoueur += "</p>";
        this.commande = "";
        setTimeout(() => {
          this.resultatInputRef.nativeElement.scrollTop = this.resultatInputRef.nativeElement.scrollHeight;
          this.commandeInputRef.nativeElement.focus();
        }, 100);
      }
    }
  }

  doCommande(commande: string): string {

    if (this.jeu.termine) {
      return "Le jeu est terminé.{n}Pour débuter une nouvelle partie veuillez actualiser la page web.";
    }

    // GESTION HISTORIQUE
    // ajouter à l’historique (à condition que différent du précédent)
    if (this.historiqueCommandes.length === 0 || (this.historiqueCommandes[this.historiqueCommandes.length - 1] !== commande)) {
      this.historiqueCommandes.push(commande);
      if (this.historiqueCommandes.length > this.TAILLE_DERNIERES_COMMANDES) {
        this.historiqueCommandes.shift();
      }
    }

    // COMPRENDRE LA COMMANDE
    const els = PhraseUtils.decomposerCommande(commande);

    let retVal = "";

    if (els) {

      const ceciIntitule = els.sujet;
      const celaIntitule = els.sujetComplement1;
      const ceciNom = ceciIntitule ? ceciIntitule.nom : null;
      const celaNom = celaIntitule ? celaIntitule.nom : null;
      const resultatCeci = ceciIntitule ? this.eju.trouverCorrespondance(ceciIntitule, true) : null;
      const resultatCela = celaIntitule ? this.eju.trouverCorrespondance(celaIntitule, true) : null;

      let evenement = new Evenement(els.infinitif, ceciNom, null, els.preposition, celaNom);

      // si on a déjà une erreur, ne pas continuer.
      if (retVal.length > 0) {
        return retVal;
      }

      switch (els.infinitif) {

        case "aide":
          retVal = this.com.aide(els);
          break;

        case "deboguer":
          retVal = this.com.deboguer(els);
          break;

        case "aller":
        case "entrer": // entrer
        case "sortir":
        case "monter":
        case "descendre":
          retVal = this.com.aller(els);
          break;

        case "inventaire":
          retVal = this.com.inventaire();
          break;

        case "sorties":
          retVal = this.com.sorties();
          break;

        case "position":
          retVal = this.com.ouSuisJe();
          break;

        case "effacer":
          this.sortieJoueur = "";
          retVal = this.com.effacer();
          break;

        // case "déverrouiller":
        //   retVal = this.com.deverrouiller(els);
        //   break;

        // case "utiliser":
        //   retVal = this.com.utiliser(els);
        //   break;

        // case "fouiller":
        //   retVal = this.com.fouiller(els);
        //   break;

        default:
          const actionCeciCela = this.trouverActionPersonnalisee(els, resultatCeci, resultatCela);

          if (actionCeciCela === -1) {
            retVal = "Je comprends « " + els.infinitif + " » mais il y a un souci avec la suite de la commande.";
            // vérifier si on a trouvé les éléments de la commande.
            if (ceciIntitule) {
              // ON N'A PAS TROUVÉ L'OBJET
              if (resultatCeci.nbCor === 0) {
                retVal += "\n{+(Je ne trouve pas ceci : « " + this.com.outils.afficherIntitule(ceciIntitule) + " ».)+}";
              } else {
                // ON NE VOIT PAS L'OBJET
                // vérifier si les objets de la commande sont visibles
                if (resultatCeci && resultatCeci.nbCor === 1 && resultatCeci.objets.length === 1) {
                  if (!this.jeu.etats.estVisible(resultatCeci.objets[0], this.eju)) {
                    retVal += "\n{+(Actuellement, je ne vois pas ceci : « " + this.com.outils.afficherIntitule(resultatCeci.objets[0].intitule) + " ».)+}";
                  }
                }
              }
            } else if (celaIntitule) {
              // ON N'A PAS TROUVÉ L'OBJET
              if (resultatCela.nbCor === 0) {
                retVal += "\n{+(Je ne trouve pas cela : « " + this.com.outils.afficherIntitule(celaIntitule) + " ».)+}";
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

            console.warn("commande: ", els);
          } else if (actionCeciCela) {

            // mettre à jour l'évènement avec les éléments trouvés
            evenement = new Evenement(
              actionCeciCela.action.infinitif,
              // (actionCeciCela.ceci ? (actionCeciCela.ceci.intitule.nom + (actionCeciCela.ceci.intitule.epithete ? (" " + actionCeciCela.ceci.intitule.epithete) : "")) : null),
              (actionCeciCela.ceci ? actionCeciCela.ceci.nom : null),
              (actionCeciCela.ceci ? actionCeciCela.ceci.classe : null),
              els.preposition,
              // (actionCeciCela.cela ? (actionCeciCela.cela.intitule.nom + (actionCeciCela.cela.intitule.epithete ? (" " + actionCeciCela.cela.intitule.epithete) : "")) : null),
              (actionCeciCela.cela ? actionCeciCela.cela.nom : null),
              (actionCeciCela.cela ? actionCeciCela.cela.classe : null)
            );

            // ÉVÈNEMENT AVANT la commande (qu'elle soit refusée ou non)
            const resultatAvant = this.ins.executerInstructions(this.dec.avant(evenement));
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
                retVal += this.executerAction(actionCeciCela);
                // ÉVÈNEMENT APRÈS la commande
                const resultatApres = this.ins.executerInstructions(this.dec.apres(evenement));
                retVal += resultatApres.sortie;
                // PHASE TERMINER l'action (seulement s'il n'y avait pas de " après " ou bien si on a forcé avec « CONTINUER L’ACTION ».)
                if (resultatApres.nombre === 0 || resultatApres.continuer === true) {
                  // terminer l’action
                  retVal += this.finaliserAction(actionCeciCela);
                }
              }
            }
          } else {
            retVal = "Désolé, je n’ai pas compris le verbe « " + els.infinitif + " ».";
          }
          break;
      }
    } else {
      retVal = "Désolé, je n'ai pas compris la commande « " + commande + " ».";
    }
    return retVal;
  }

  private executerAction(action: ActionCeciCela) {
    const resultat = this.ins.executerInstructions(action.action.instructions, action.ceci, action.cela);
    return resultat.sortie;
  }

  private finaliserAction(action: ActionCeciCela) {
    const resultat = this.ins.executerInstructions(action.action.instructionsFinales, action.ceci, action.cela);
    return resultat.sortie;
  }

  private trouverActionPersonnalisee(els: ElementsPhrase, ceci: Correspondance, cela: Correspondance): ActionCeciCela | -1 {

    let candidats: Action[] = [];
    let matchCeci: ElementJeu | Intitule | -1 = null;
    let matchCela: ElementJeu | Intitule | -1 = null;
    let resultat: ActionCeciCela | -1 = null;

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
        resultat = -1; // le verbe est connu.
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
    // TODO: prise en charge des sujets génériques (objet, personne, portes, ...)

    // infinitif + sujet (+complément), vérifier que celui de la commande correspond
    if (els.sujet) {

      candidats.forEach(candidat => {
        let candidatCorrespond = false;
        matchCeci = null;
        matchCela = null;

        // vérifier sujet (CECI)
        if (candidat.cibleCeci) {
          matchCeci = this.verifierCandidatCeciCela(ceci, candidat.cibleCeci);
          if (matchCeci !== null) {
            if (matchCeci === -1) {
              // plusieurs éléments trouvés => il faut être plus précis.
              console.error("trouverActionPersonnalisee >>> plusieurs candidats trouvés pour Ceci:", ceci);
            } else {
              if (els.complement1) {
                if (candidat.cibleCela) {
                  matchCela = this.verifierCandidatCeciCela(cela, candidat.cibleCela);
                  if (matchCela !== null) {
                    if (matchCela === -1) {
                      // plusieurs éléments trouvés => il faut être plus précis.
                      console.error("trouverActionPersonnalisee >>> plusieurs candidats trouvés pour Cela:", cela);
                    } else {
                      candidatCorrespond = true;
                    }
                  }
                }
              } else {
                candidatCorrespond = true;
              }
            }
          }
        } else {
          // candidat ne correspond pas.
        }

        if (candidatCorrespond && matchCeci !== -1 && matchCela !== -1) {
          if (resultat === -1) {
            resultat = new ActionCeciCela(candidat, matchCeci, matchCela);
          } else {
            // TODO: regarder le niveau de la classe des différents candidats et prendre celui le plus élevé.
            console.warn("trouverActionPersonnalisee >>> Plusieurs actions trouvées pour", els);
          }
        }

      });
      // infinitif simple
    } else {
      if (candidats.length == 1) {
        resultat = new ActionCeciCela(candidats[0], null, null);
      } else {
        // TODO: regarder le niveau de la classe des différents candidats et prendre celui le plus élevé.
        console.warn("trouverActionPersonnalisee >>> Plusieurs actions trouvées pour", els);
      }
    }
    return resultat;
  }

  private verifierCandidatCeciCela(ceciCela: Correspondance, candidatCeciCela: GroupeNominal) {
    let retVal: ElementJeu | Intitule | -1 = null;

    // il s’agit d’un sujet précis
    if (candidatCeciCela.determinant.match(/^(du|((de )?(le|la|l’|l'|les)))?( )?$/)) {
      console.log("cibleCeci > sujet précis");
      // vérifier s’il s’agit du sujet précis

      ceciCela.elements.forEach(ele => {
        console.log("check for ele=", ele, "candidatCeciCela=", candidatCeciCela);
        console.log("check for ele.intitule.nom=", ele.intitule.nom, "candidatCeciCela.nom=", candidatCeciCela.nom);
        console.log("check for ele.intitule.epithete=", ele.intitule.epithete, "candidatCeciCela.epithete=", candidatCeciCela.epithete);

        if (ele.intitule.nom === candidatCeciCela.nom && ele.intitule.epithete === candidatCeciCela.epithete) {
          if (retVal === null) {
            retVal = ele;
          } else {
            // déjà un match, on en a plusieurs.
            retVal = -1;
          }
        }
      });

      // todo: vérifier début de nom si aucune correspondance exacte

      // il s’agit d’un type
    } else if (candidatCeciCela.determinant.match(/^(un|une|des|deux)( )?$/)) {
      if (ClasseUtils.getClasseIntitule(candidatCeciCela.nom) === EClasseRacine.intitule) {
        retVal = ceciCela.intitule;
      } else {
        // TODO: vérifier s’il s’agit du type
        ceciCela.elements.forEach(ele => {
          if (ClasseUtils.heriteDe(ele.classe, ClasseUtils.getClasseIntitule(candidatCeciCela.nom))) {
            if (retVal === null) {
              // s'il doit s'agir d'un objet visible, vérifier
              // si on est ici et qu'il doit pouvoir être visible, c'est forcément un descendant d'un objet.
              if (candidatCeciCela.epithete) {
                // if (candidatCeciCela.epithete.startsWith('visible') && (ele as Objet).visible) {
                if (this.jeu.etats.possedeEtatElement((ele as Objet), candidatCeciCela.epithete, this.eju)) {
                  retVal = ele;
                }
              } else {
                retVal = ele;
              }
            } else {
              // déjà un match, on en a plusieurs.
              retVal = -1;
            }
          }
        });
      }


    }
    return retVal;
  }

}
