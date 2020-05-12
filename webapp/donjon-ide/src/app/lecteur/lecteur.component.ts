import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Abreviations } from '../utils/abreviations';
import { Commandes } from '../utils/commandes';
import { Declancheur } from '../utils/declancheur';
import { ElementsJeuUtils } from '../utils/elements-jeu-utils';
import { ElementsPhrase } from '../models/commun/elements-phrase';
import { EmplacementElement } from '../models/jeu/emplacement-element';
import { GroupeNominal } from '../models/commun/groupe-nominal';
import { Instruction } from '../models/compilateur/instruction';
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

  resultat: string = null;
  commande = "";
  historiqueCommandes = new Array<string>();
  curseurHistorique = -1;

  private com: Commandes;
  private eju: ElementsJeuUtils;

  private dec: Declancheur;

  @ViewChild('txCommande') commandeInputRef: ElementRef;
  @ViewChild('taResultat') resultatInputRef: ElementRef;


  constructor() { }



  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.jeu) {
      console.warn("jeu: ", this.jeu);
      this.resultat = "";
      this.com = new Commandes(this.jeu, this.verbeux);
      this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
      this.dec = new Declancheur(this.jeu.auditeurs, this.verbeux);

      this.resultat += (this.jeu.titre ? (this.jeu.titre + "\n==============================") : "");

      let evLeJeuCommence = new ElementsPhrase(new GroupeNominal('le', 'jeu'), 'commence', null, null);

      // éxécuter les instructions AVANT le jeu commence
      this.executerInstructions(this.dec.avant(evLeJeuCommence));

      // exécuter les instruction REMPLACER s’il y a lieu, sinon suivre le cours normal
      if (!this.executerInstructions(this.dec.remplacer(evLeJeuCommence))) {
        // afficher où on est.
        this.resultat += "\n" + this.com.ouSuisJe();
      }

      // éxécuter les instructions APRÈS le jeu commence
      this.executerInstructions(this.dec.apres(evLeJeuCommence));

    } else {
      console.warn("pas de jeu :(");
    }
  }



  private executerInstructions(instructions: Instruction[]): boolean {
    if (instructions && instructions.length > 0) {
      instructions.forEach(ins => {
        this.executerInstruction(ins);
      });
      return true;
    } else {
      return false;
    }
  }

  private executerInstruction(instruction: Instruction) {
    if (this.verbeux) {
      console.log(">>> ex instruction:", instruction);
    }
    // instruction conditionnelle
    if (instruction.condition) {
      // TODO: instruction conditionnelle
      console.warn("Instructions conditionnelles pas encore gérées...");
      // instruction simple
    } else {
      if (instruction.instruction.infinitif) {
        //if (instruction.sujet == null && instruction.verbe) {
        this.executerInfinitif(instruction.instruction);
        // } else if (instruction.sujet) {
        // this.executerSujetVerbe(instruction);
      } else {
        console.warn("executerInstruction : pas d'infinitif :", instruction);
      }
    }
  }

  private executerInfinitif(instruction: ElementsPhrase) {
    switch (instruction.infinitif.toLowerCase()) {
      case 'dire':
        // enlever le premier et le dernier caractères (") et les espaces aux extrémités.
        this.resultat += "\n" + instruction.complement.trim().slice(1, instruction.complement.length - 1).trim();
        break;

      case 'changer':
        this.executerChanger(instruction);
        break;

      default:
        console.warn("executerVerbe : pas compris instruction:", instruction);
        break;
    }
  }

  private executerChanger(instruction: ElementsPhrase) {
    if (instruction.sujet) {
      switch (instruction.sujet.nom.toLowerCase()) {
        case 'joueur':
          this.executerJoueur(instruction);
          break;

        case 'inventaire':
          this.executerInventaire(instruction);
          break;

        default:
          console.warn("executerChanger : pas compris instruction:", instruction);
          break;
      }
    } else {
      console.error("executerChanger : pas de sujet, instruction:", instruction);
    }
  }

  private executerJoueur(instruction: ElementsPhrase) {
    switch (instruction.verbe.toLowerCase()) {
      case 'se trouve':
        this.com.outils.positionnerJoueur(instruction.complement);
        break;
      case 'possède':
        this.ajouterInventaire(instruction.sujetComplement);
        break;

      default:
        console.warn("executerJoueur : pas compris verbe", instruction.verbe, instruction);
        break;
    }
  }

  private executerInventaire(instruction: ElementsPhrase) {
    switch (instruction.verbe.toLowerCase()) {
      case 'contient':
        this.ajouterInventaire(instruction.sujetComplement);
        break;

      default:
        break;
    }
  }

  ajouterInventaire(intitule: GroupeNominal) {
    if (intitule) {
      let objetTrouve = this.eju.trouverElementJeu(intitule, EmplacementElement.partout, true, false);
      if (objetTrouve) {
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
      } else {
        console.warn("ajouterInventaire > objet pas trouvé:", intitule);
      }
    } else {
      console.error("ajouterInventaire >>> intitulé est null.");

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

      const result = this.doCommande(commandeComplete.trim());
      this.resultat += "\n > " + this.commande + (this.commande !== commandeComplete ? (' (' + commandeComplete + ")") : '');
      this.resultat += "\n" + result;
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
        case "attraper":
          retVal = this.com.prendre(els);
          break;

        case "observer":
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
        case "ef": // effacer
          this.resultat = "";
          retVal = this.com.effacer();
          break;

        default:
          retVal = "Désolé, je n’ai pas compris le verbe « " + els.infinitif + " ».";
          break;
      }
    } else {
      retVal = "Désolé, je n'ai pas compris « " + commande + " ».";
    }
    return retVal;
  }

}
