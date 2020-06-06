import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Abreviations } from '../utils/abreviations';
import { Action } from '../models/compilateur/action';
import { Commandes } from '../utils/commandes';
import { ConditionsUtils } from '../utils/conditions-utils';
import { Declancheur } from '../utils/declancheur';
import { ElementJeu } from '../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../utils/elements-jeu-utils';
import { ElementsPhrase } from '../models/commun/elements-phrase';
import { EmplacementElement } from '../models/jeu/emplacement-element';
import { Evenement } from '../models/jouer/evenement';
import { GroupeNominal } from '../models/commun/groupe-nominal';
import { Instruction } from '../models/compilateur/instruction';
import { Instructions } from '../utils/instructions';
import { Jeu } from '../models/jeu/jeu';
import { PhraseUtils } from '../utils/phrase-utils';
import { Resultat } from '../models/jouer/resultat';

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

  private dec: Declancheur;

  @ViewChild('txCommande') commandeInputRef: ElementRef;
  @ViewChild('taResultat') resultatInputRef: ElementRef;

  constructor() { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.jeu) {
      console.warn("jeu: ", this.jeu);
      this.sortieJoueur = "";
      this.com = new Commandes(this.jeu, this.verbeux);
      this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
      this.dec = new Declancheur(this.jeu.auditeurs, this.verbeux);
      this.ins = new Instructions(this.jeu, this.eju, this.verbeux);

      this.sortieJoueur += (this.jeu.titre ? (this.jeu.titre + "\n==============================") : "");

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

    let retVal = null;

    if (els) {

      const ceci = els.sujet ? els.sujet.nom : null;
      const cela = els.sujetComplement ? els.sujetComplement.nom : null;
      let evenement = new Evenement(els.infinitif, ceci, null, cela);

      const resultatCeci = this.eju.trouverCorrespondance(els.sujet);
      const resultatCela = this.eju.trouverCorrespondance(els.sujetComplement);

      console.log(" >>>>>>>>> resultatCeci:", resultatCeci);
      console.log(" >>>>>>>>> resultatCela:", resultatCela);

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
          const action = this.trouverActionPersonnalisee(els);
          if (action === -1) {
            retVal = "Je comprend « " + els.infinitif + " » mais il y a un souci avec la suite de la commande.";
            console.warn("commande: ", els);
          } else if (action) {
            retVal = this.executerAction(action, els);
          } else {
            retVal = "Désolé, je n’ai pas compris le verbe « " + els.infinitif + " ».";
          }
          break;
      }
    } else {
      retVal = "Désolé, je n'ai pas compris « " + commande + " ».";
    }
    return retVal;
  }


  private executerAction(action: Action, els: ElementsPhrase) {
    const resultat = this.ins.executerInstructions(action.instructions);
    return resultat.sortie;
  }

  private trouverActionPersonnalisee(els: ElementsPhrase): Action | -1 {

    let candidats: Action[] = [];
    let resultat: Action | -1 = null;

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
        // vérifier sujet (CECI)
        if (candidat.cibleCeci && this.verifierCandidatCeciCela(els.sujet, candidat.cibleCeci)) {

          if (els.complement) {

            if (candidat.cibleCela && this.verifierCandidatCeciCela(els.sujetComplement, candidat.cibleCela)) {

            }

          }

        } else {
          // candidat ne correspond pas.
        }

        if (candidatCorrespond) {
          if (resultat === -1) {
            resultat = candidat;
          } else {
            console.warn("trouverActionPersonnalisee >>> Plusieurs actions trouvées pour", els);
          }
        }

      })
      // infinitif simple
    } else {

    }

    if (candidats.length > 0) {
      resultat = candidats[0];
      if (candidats.length > 1) {
        console.warn("trouverActionPersonnalisee >>> Plusieurs actions trouvées pour", els);
      }
    }
  
    // console.warn("testerCommandePersonnalisee >>> resultat:", resultat);
    return resultat;
  }

  private verifierCandidatCeciCela(sujet: GroupeNominal, candidatCeciCela: GroupeNominal): boolean {
  let correspond = false;

  // il s’agit d’un sujet précis
  if (candidatCeciCela.determinant.match(/^(du|((de )?(le|la|l’|l'|les)))?( )?$/)) {
    console.log("cibleCeci > sujet précis");
    // vérifier s’il s’agit du sujet précis
    if (candidatCeciCela.nom === sujet.nom && candidatCeciCela.epithete === sujet.epithete) {
      correspond = true;
    }
    // il s’agit d’un type
  } else if (candidatCeciCela.determinant.match(/^(un|une|des)( )?$/)) {
    // TODO: vérifier s’il s’agit du type
    console.log("candidatCeciCela > sujet type");
    correspond = true;
  } else {
    console.error("candidatCeciCela > déterminant pas reconnu");
  }

  return correspond;
}

}
