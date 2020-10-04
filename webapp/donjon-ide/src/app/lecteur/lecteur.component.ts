import { Action, ActionCeciCela } from '../models/compilateur/action';
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Abreviations } from '../utils/abreviations';
import { Classe } from '../models/commun/classe';
import { Commandes } from '../utils/commandes';
import { ConditionsUtils } from '../utils/conditions-utils';
import { Correspondance } from '../utils/correspondance';
import { Declancheur } from '../utils/declancheur';
import { ElementJeu } from '../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../utils/elements-jeu-utils';
import { ElementsPhrase } from '../models/commun/elements-phrase';
import { Evenement } from '../models/jouer/evenement';
import { GroupeNominal } from '../models/commun/groupe-nominal';
import { Instructions } from '../utils/instructions';
import { Jeu } from '../models/jeu/jeu';
import { PhraseUtils } from '../utils/phrase-utils';

@Component({
  selector: 'app-lecteur',
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

  private dec: Declancheur;

  @ViewChild('txCommande') commandeInputRef: ElementRef;
  @ViewChild('taResultat') resultatInputRef: ElementRef;

  constructor() { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.jeu) {
      console.warn("jeu: ", this.jeu);
      this.sortieJoueur = "";
      this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
      this.dec = new Declancheur(this.jeu.auditeurs, this.verbeux);
      this.ins = new Instructions(this.jeu, this.eju, this.verbeux);
      this.com = new Commandes(this.jeu, this.ins, this.verbeux);
      this.cond = new ConditionsUtils(this.jeu, this.verbeux);
      this.sortieJoueur += (this.jeu.titre ? (this.jeu.titre + "\n==============================\n") : "");

      // définir visibilité des objets initiale
      this.eju.majVisibiliteDesObjets();

      let evCommencerJeu = new Evenement('commencer', 'jeu');

      // éxécuter les instructions AVANT le jeu commence
      let resultatAvant = this.ins.executerInstructions(this.dec.avant(evCommencerJeu));
      this.sortieJoueur += resultatAvant.sortie;

      // exécuter les instruction REMPLACER s’il y a lieu, sinon suivre le cours normal
      let resultatRemplacer = this.ins.executerInstructions(this.dec.remplacer(evCommencerJeu));
      if (resultatRemplacer.nombre === 0) {
        // afficher où on est.
        this.sortieJoueur += "\n" + this.com.ouSuisJe();
      }

      // éxécuter les instructions APRÈS le jeu commence
      const resultatApres = this.ins.executerInstructions(this.dec.apres(evCommencerJeu));
      this.sortieJoueur += resultatApres.sortie;

    } else {
      console.warn("pas de jeu :(");
    }
  }



  /**
   * Historique: aller en arrière.
   * @param event
   */
  onKeyDownArrowUp(event) {
    if (this.curseurHistorique < (this.historiqueCommandes.length - 1)) {
      this.curseurHistorique += 1;
      const index = this.historiqueCommandes.length - this.curseurHistorique - 1;
      this.commande = this.historiqueCommandes[index];
      this.focusCommande();
    }
  }

  /**
   * Historique: revenir en avant
   */
  onKeyDownArrowDown(event) {
    if (this.curseurHistorique > 0) {
      this.curseurHistorique -= 1;
      const index = this.historiqueCommandes.length - this.curseurHistorique - 1;
      this.commande = this.historiqueCommandes[index];
      this.focusCommande();
    } else {
      this.commande = "";
    }
  }

  private focusCommande() {
    setTimeout(() => {
      this.commandeInputRef.nativeElement.focus();
      this.commandeInputRef.nativeElement.selectionStart = this.commandeInputRef.nativeElement.selectionEnd = this.commande.length;
    }, 100);
  }



  onKeyDownTab(event) {
    const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande);
    if (commandeComplete != this.commande) {
      this.commande = commandeComplete;
      this.focusCommande();
    }
  }

  /**
   * Valider une commande.
   * @param event 
   */
  onKeyDownEnter(event) {
    this.curseurHistorique = -1;

    if (this.commande && this.commande.trim() !== "") {

      // compléter la commande
      const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande);

      this.sortieJoueur += "\n > " + this.commande + (this.commande !== commandeComplete ? (' (' + commandeComplete + ")") : '');
      const result = this.doCommande(commandeComplete.trim());
      if (result) {
        this.sortieJoueur += "\n" + result;
      }
      this.commande = "";
      setTimeout(() => {
        this.resultatInputRef.nativeElement.scrollTop = this.resultatInputRef.nativeElement.scrollHeight;
        this.commandeInputRef.nativeElement.focus();
      }, 100);

    }
  }

  doCommande(commande: string): string {

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
      const celaIntitule = els.sujetComplement;
      const ceciNom = ceciIntitule ? ceciIntitule.nom : null;
      const celaNom = celaIntitule ? celaIntitule.nom : null;
      let evenement = new Evenement(els.infinitif, ceciNom, null, celaNom);
      const resultatCeci = ceciIntitule ? this.eju.trouverCorrespondance(ceciIntitule) : null;
      const resultatCela = celaIntitule ? this.eju.trouverCorrespondance(celaIntitule) : null;

      // vérifier si on a trouvé les éléments de la commande.
      if (ceciIntitule && resultatCeci.nbCor === 0) {
        retVal += "Je ne trouve pas ceci : « " + this.com.outils.afficherIntitule(ceciIntitule) + " ».\n";
      }
      if (celaIntitule && resultatCela.nbCor === 0) {
        retVal += "Je ne trouve pas cela : « " + this.com.outils.afficherIntitule(celaIntitule) + " ».\n";
      }

      // vérifier si les objets de la commande sont visibles
      if (resultatCeci && resultatCeci.nbCor === 1 && resultatCeci.objets.length === 1) {
        if (!resultatCeci.objets[0].visible) {
          retVal += "Je ne vois pas ceci : « " + this.com.outils.afficherIntitule(resultatCeci.objets[0].intitule) + " ».\n";
        }
      }
      if (resultatCela && resultatCela.nbCor === 1 && resultatCela.objets.length === 1) {
        if (!resultatCela.objets[0].visible) {
          retVal += "Je ne vois pas cela : « " + this.com.outils.afficherIntitule(resultatCela.objets[0].intitule) + " ».\n";
        }
      }

      // si on a déjà une erreur, ne pas continuer.
      if (retVal.length > 0) {
        return retVal;
      }

      switch (els.infinitif) {

        case "aide":
          retVal = this.com.aide(els);
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

        // case "prendre":
        //   retVal = this.com.prendre(els);
        //   break;

        // case "jeter":
        //   retVal = this.com.jeter(els);
        //   break;

        // case "donner":
        //   // avant la commande
        //   const resultatAvant = this.ins.executerInstructions(this.dec.avant(evenement));
        //   retVal += resultatAvant.sortie;
        //   retVal = this.com.donner(els);
        //   // après la commande
        //   const resultatApres = this.ins.executerInstructions(this.dec.apres(evenement));

        //   console.warn("resultatApres >>>", resultatApres);

        //   retVal += resultatApres.sortie;
        //   break;

        // case "regarder":
        //   retVal = this.com.regarder(els);
        //   break;

        // case "déverrouiller":
        //   retVal = this.com.deverrouiller(els);
        //   break;

        // case "utiliser":
        //   retVal = this.com.utiliser(els);
        //   break;

        case "attaquer":
          retVal = this.com.attaquer(els);
          break;

        // case "ouvrir":
        //   retVal = this.com.ouvrir(els);
        //   break;

        // case "fermer":
        //   retVal = this.com.fermer(els);
        //   break;

        // case "examiner":
        //   // TODO: changer ça
        //   retVal = this.com.examiner(els);
        //   break;

        case "sorties":
          retVal = this.com.sorties();
          break;

        case "fouiller":
          retVal = this.com.fouiller(els);
          break;

        case "position":
          retVal = this.com.ouSuisJe();
          break;

        case "effacer":
          this.sortieJoueur = "";
          retVal = this.com.effacer();
          break;

        default:
          const actionCeciCela = this.trouverActionPersonnalisee(els, resultatCeci, resultatCela);
          if (actionCeciCela === -1) {
            retVal = "Je comprends « " + els.infinitif + " » mais il y a un souci avec la suite de la commande.";
            console.warn("commande: ", els);
          } else if (actionCeciCela) {

            // vérifier cette action action
            let refus = false;
            if (actionCeciCela.action.verifications) {
              console.log("vérifications en cours pour la commande…");

              // parcourir les vérifications
              actionCeciCela.action.verifications.forEach(verif => {
                if (!refus && this.cond.conditionsRemplies(verif.conditions, actionCeciCela.ceci, actionCeciCela.cela)) {
                  console.warn("> commande vérifie cela:", verif);
                  let resultat = this.ins.executerInstructions(verif.resultats, actionCeciCela.ceci, actionCeciCela.cela);
                  retVal = resultat.sortie;
                  refus = true;
                }
              });
            }

            // exécuter l’action si pas refusée
            if (!refus) {
              // exécuter l’action
              retVal = this.executerAction(actionCeciCela);

              // finaliser l’action
              retVal += this.finaliserAction(actionCeciCela);
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
    let matchCeci: ElementJeu | -1 = null;
    let matchCela: ElementJeu | -1 = null;
    let resultat: ActionCeciCela | -1 = null;

    // trouver les commande qui corresponde (sans vérifier le sujet (+complément) exacte)
    this.jeu.actions.forEach(action => {
      // vérifier infinitif
      if (els.infinitif === action.infinitif) {
        resultat = -1; // le verbe est connu.
        // vérifier sujet
        if ((els.sujet && action.ceci) || (!els.sujet && !action.ceci)) {
          // vérifier complément
          if ((els.sujetComplement && action.cela) || (!els.sujetComplement && !action.cela)) {
            candidats.push(action);
          }
        }
      }
    });

    console.warn("testerCommandePersonnalisee :", candidats.length, "candidat(s) p1 :", candidats);

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
              if (els.complement) {
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
    // console.warn("testerCommandePersonnalisee >>> resultat:", resultat);
    return resultat;
  }

  private verifierCandidatCeciCela(ceciCela: Correspondance, candidatCeciCela: GroupeNominal): ElementJeu | -1 {
    let retVal: ElementJeu | -1 = null;

    // il s’agit d’un sujet précis
    if (candidatCeciCela.determinant.match(/^(du|((de )?(le|la|l’|l'|les)))?( )?$/)) {
      console.log("cibleCeci > sujet précis");
      // vérifier s’il s’agit du sujet précis

      ceciCela.elements.forEach(ele => {
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
    } else if (candidatCeciCela.determinant.match(/^(un|une|des)( )?$/)) {
      // TODO: vérifier s’il s’agit du type
      ceciCela.elements.forEach(ele => {
        if (Classe.heriteDe(ele.classe, candidatCeciCela.nom)) {
          if (retVal === null) {
            retVal = ele;
          } else {
            // déjà un match, on en a plusieurs.
            retVal = -1;
          }
        }
      });
    }
    return retVal;
  }

}
