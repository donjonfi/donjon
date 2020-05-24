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
  private eju: ElementsJeuUtils;

  private dec: Declancheur;
  private cond: ConditionsUtils;

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
      this.cond = new ConditionsUtils(this.jeu, this.verbeux);

      this.sortieJoueur += (this.jeu.titre ? (this.jeu.titre + "\n==============================") : "");

      let evCommencerJeu = new Evenement('commencer', 'jeu');

      // éxécuter les instructions AVANT le jeu commence
      let resultatAvant = this.executerInstructions(this.dec.avant(evCommencerJeu));
      this.sortieJoueur += resultatAvant.sortie;

      // exécuter les instruction REMPLACER s’il y a lieu, sinon suivre le cours normal
      let resultatRemplacer = this.executerInstructions(this.dec.remplacer(evCommencerJeu));
      if (resultatRemplacer.nombre === 0) {
        // afficher où on est.
        this.sortieJoueur += "\n" + this.com.ouSuisJe();
      }

      // éxécuter les instructions APRÈS le jeu commence
      const resultatApres = this.executerInstructions(this.dec.apres(evCommencerJeu));
      this.sortieJoueur += resultatApres.sortie;

    } else {
      console.warn("pas de jeu :(");
    }
  }

  private executerInstructions(instructions: Instruction[]): Resultat {

    console.warn("BEGIN exInstructionS >>> instructionS=", instructions);


    let resultat = new Resultat(true, '', 0);
    if (instructions && instructions.length > 0) {
      instructions.forEach(ins => {
        const subResultat = this.executerInstruction(ins);
        resultat.nombre += subResultat.nombre;
        resultat.succes = (resultat.succes && subResultat.succes);
        resultat.sortie += subResultat.sortie;
      });
    }

    console.warn("END exInstructionS >>> instructionS=", instructions, "resultat=", resultat);

    return resultat;
  }

  private executerInstruction(instruction: Instruction): Resultat {

    let resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;
    if (this.verbeux) {
      console.log(">>> ex instruction:", instruction);
    }
    // instruction conditionnelle
    if (instruction.condition) {

      if (this.cond.siEstVrai(null, instruction.condition)) {
        sousResultat = this.executerInstructions(instruction.instructionsSiConditionVerifiee);
      } else {
        sousResultat = this.executerInstructions(instruction.instructionsSiConditionPasVerifiee);
      }
      // instruction simple
    } else {
      if (instruction.instruction.infinitif) {
        //if (instruction.sujet == null && instruction.verbe) {
        sousResultat = this.executerInfinitif(instruction.instruction);
        // } else if (instruction.sujet) {
        // this.executerSujetVerbe(instruction);
      } else {
        console.warn("executerInstruction : pas d'infinitif :", instruction);
      }
    }
    resultat.sortie += sousResultat.sortie;

    console.warn("exInstruction >>> instruction=", instruction, "resultat=", resultat);

    return resultat;
  }

  private executerInfinitif(instruction: ElementsPhrase): Resultat {
    let resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;

    switch (instruction.infinitif.toLowerCase()) {
      case 'dire':
        // enlever le premier et le dernier caractères (") et les espaces aux extrémités.
        const complement = instruction.complement.trim();
        resultat.sortie += "\n" + complement.slice(1, complement.length - 1).trim();
        // si la chaine se termine par un espace, ajouter un saut de ligne.
        if (complement.endsWith(' "')) {
          resultat.sortie += "\n";
        }
        break;
      case 'changer':
        sousResultat = this.executerChanger(instruction);
        resultat.succes = sousResultat.succes;
        break;

      case 'sauver':
        console.log("executerInfinitif >> sauver=", instruction.complement);
        if (instruction.complement) {
          this.jeu.sauvegardes.push(instruction.complement);
          resultat.succes = true;
        } else {
          resultat.succes = false;
        }
        break;

      default:
        console.warn("executerVerbe : pas compris instruction:", instruction);
        break;
    }

    return resultat;
  }

  private executerChanger(instruction: ElementsPhrase): Resultat {

    let resultat = new Resultat(false, '', 1);

    if (instruction.sujet) {
      switch (instruction.sujet.nom.toLowerCase()) {
        case 'joueur':
          resultat = this.executerJoueur(instruction);
          break;

        case 'inventaire':
          resultat = this.executerInventaire(instruction);
          break;

        default:
          let elementJeu = this.eju.trouverElementJeu(instruction.sujet, EmplacementElement.partout, true, true);
          if (elementJeu === -1) {
            console.error("executerChanger: plusieurs éléments de jeu trouvés pour " + instruction.sujet);
          } else if (elementJeu) {
            resultat = this.executerElementJeu(elementJeu, instruction);
          } else {
            console.error("executerChanger: pas trouvé l’élément " + instruction.sujet);
          }
          break;
      }
    } else {
      console.error("executerChanger : pas de sujet, instruction:", instruction);
    }

    return resultat;
  }

  private executerJoueur(instruction: ElementsPhrase): Resultat {
    let resultat = new Resultat(false, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'se trouve':
        resultat = this.com.outils.positionnerJoueur(instruction.complement);
        break;
      case 'possède':
        resultat = this.ajouterInventaire(instruction.sujetComplement);
        break;

      default:
        console.error("executerJoueur : pas compris verbe", instruction.verbe, instruction);
        break;
    }
    return resultat;
  }

  private executerInventaire(instruction: ElementsPhrase): Resultat {
    let resultat = new Resultat(false, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'contient':
        resultat = this.ajouterInventaire(instruction.sujetComplement);
        break;

      default:
        console.error("executerInventaire : pas compris verbe", instruction.verbe, instruction);
        break;
    }
    return resultat;
  }

  private executerElementJeu(element: ElementJeu, instruction: ElementsPhrase): Resultat {

    let resultat = new Resultat(true, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'est':
        // retirer un état
        if (instruction.negation.trim() === 'pas' || instruction.negation.trim() === 'plus') {
          console.log("executerElementJeu: retirer l’état ", instruction.complement);
          ElementsJeuUtils.retirerEtat(element, instruction.complement, null);
          // ajouter un état
        } else {
          console.log("executerElementJeu: ajouter l’état ", instruction.complement);
          ElementsJeuUtils.ajouterEtat(element, instruction.complement);
        }
        break;

      default:
        resultat.succes = false;
        console.warn("executerElementJeu: pas compris le verbe:", instruction.verbe, instruction);
        break;
    }
    return resultat;
  }

  ajouterInventaire(intitule: GroupeNominal): Resultat {

    let resultat = new Resultat(false, '', 1);

    if (intitule) {
      let objetTrouve = this.eju.trouverElementJeu(intitule, EmplacementElement.partout, true, false);
      if (objetTrouve === -1) {
        console.warn("ajouterInventaire > plusieurs objets trouvés:", intitule);
      } else if (objetTrouve) {
        const nouvelObjet = this.eju.prendreElementJeu(objetTrouve.id);
        let cible = nouvelObjet;
        // si l'inventaire contient déjà le même objet, augmenter la quantité
        let objInv = this.jeu.inventaire.objets.find(x => x.id == nouvelObjet.id);
        if (objInv) {
          objInv.quantite += 1;
          cible = objInv;
        } else {
          this.jeu.inventaire.objets.push(nouvelObjet);
        }
        resultat.succes = true;
      } else {
        console.warn("ajouterInventaire > objet pas trouvé:", intitule);
      }
    } else {
      console.error("ajouterInventaire >>> intitulé est null.");
    }
    return resultat;
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

        case "prendre":
          retVal = this.com.prendre(els);
          break;

        case "jeter":
          retVal = this.com.jeter(els);
          break;

        case "donner":
          // avant la commande
          const resultatAvant = this.executerInstructions(this.dec.avant(evenement));
          retVal += resultatAvant.sortie;
          retVal = this.com.donner(els);
          // après la commande
          const resultatApres = this.executerInstructions(this.dec.apres(evenement));

          
        console.warn("resultatApres >>>", resultatApres);
        

          retVal += resultatApres.sortie;
          break;

        case "regarder":
          retVal = this.com.regarder(els);
          break;

        case "déverrouiller":
          retVal = this.com.deverrouiller(els);
          break;

        case "utiliser":
          retVal = this.com.utiliser(els);
          break;

        case "attaquer":
          retVal = this.com.attaquer(els);
          break;

        case "ouvrir":
          retVal = this.com.ouvrir(els);
          break;

        case "fermer":
          retVal = this.com.fermer(els);
          break;

        case "examiner":
          // TODO: changer ça
          retVal = this.com.examiner(els);
          break;

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
    const resultat = this.executerInstructions(action.instructions);
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

    // console.warn("testerCommandePersonnalisee :", candidats.length, "candidat(s) p1 :", candidats);

    // TODO: prise en charge des sujets génériques (objet, humain, portes, ...)

    // infinitif + sujet (+complément), vérifier que celui de la commande correspond
    if (els.sujet) {
      candidats.forEach(candidat => {
        let candidatCorrespond = false;
        // vérifier sujet
        if (candidat.cibleCeci.nom == els.sujet.nom && candidat.cibleCeci.epithete == els.sujet.epithete) {
          // s'il y a un complément
          if (els.sujetComplement) {
            // vérifier complément
            if (candidat.cibleCela.nom == els.sujet.nom && candidat.cibleCela.epithete == els.sujetComplement.epithete) {
              candidatCorrespond = true;
            }
            // sujet validé, pas de complément
          } else {
            candidatCorrespond = true;
          }
        }
        if (candidatCorrespond) {
          if (resultat === -1) {
            resultat = candidat;
          } else {
            console.warn("trouverActionPersonnalisee >>> Plusieurs actions trouvées pour", els);
          }
        }
      });
      // infinitif simple
    } else {
      if (candidats.length > 0) {
        resultat = candidats[0];
        if (candidats.length > 1) {
          console.warn("trouverActionPersonnalisee >>> Plusieurs actions trouvées pour", els);
        }
      }
    }

    // console.warn("testerCommandePersonnalisee >>> resultat:", resultat);
    return resultat;
  }

}
