import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Commandes } from '../utils/commandes';
import { Declancheur } from '../utils/declancheur';
import { ElementsPhrase } from '../models/commun/elements-phrase';
import { EmplacementElement } from '../models/jeu/emplacement-element';
import { Jeu } from '../models/jeu/jeu';
import { ElementsJeuUtils } from '../utils/elements-jeu-utils';

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

      let evLeJeuCommence = new ElementsPhrase(null, 'le', 'jeu', 'commence', null);

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

  private executerInstructions(instructions: ElementsPhrase[]): boolean {
    if (instructions && instructions.length > 0) {
      instructions.forEach(ins => {
        this.executerInstruction(ins);
      });
      return true;
    } else {
      return false;
    }
  }

  private executerInstruction(instruction: ElementsPhrase) {
    if (this.verbeux) {
      console.log(">>> ex instruction:", instruction);
    }

    if (instruction.infinitif) {
      //if (instruction.sujet == null && instruction.verbe) {
      this.executerInfinitif(instruction);
      // } else if (instruction.sujet) {
      // this.executerSujetVerbe(instruction);
    } else {
      console.warn("executerInstruction : pas d'infinitif :", instruction);
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
    switch (instruction.sujet.toLowerCase()) {
      case 'joueur':
        this.executerJoueur(instruction);
        break;

      case 'inventaire':
        this.executerInventaire(instruction);
        break;

      default:
        console.warn("executerSujetVerbe : pas compris instruction:", instruction);
        break;
    }
  }

  private executerJoueur(instruction: ElementsPhrase) {
    switch (instruction.verbe.toLowerCase()) {
      case 'se trouve':
        this.com.outils.positionnerJoueur(instruction.complement);
        break;
      case 'possède':
        this.ajouterInventaire(instruction.complement);
        break;

      default:
        console.warn("executerJoueur : pas compris verbe", instruction.verbe, instruction);
        break;
    }
  }

  private executerInventaire(instruction: ElementsPhrase) {
    switch (instruction.verbe.toLowerCase()) {
      case 'contient':
        this.ajouterInventaire(instruction.complement);
        break;

      default:
        break;
    }
  }

  ajouterInventaire(intitule: string) {
    let mots = [""].concat(intitule.split(" "));
    let objetTrouve = this.eju.trouverElementJeu(mots, EmplacementElement.partout, false);
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
    switch (this.commande) {

      case 'a':
        this.commande = "aller ";
        this.focusCommande();
        break;

      case 'at':
        this.commande = "attaquer ";
        this.focusCommande();
        break;

      case 'n':
        this.commande = "aller au nord";
        this.focusCommande();
        break;

      case 's':
        this.commande = "aller au sud";
        this.focusCommande();
        break;

      case 'e':
        this.commande = "aller à l’est";
        this.focusCommande();
        break;

      case 'ex':
        this.commande = "examiner ";
        this.focusCommande();
        break;

      case 'ef':
        this.commande = "effacer";
        this.focusCommande();
        break;

      case 'o':
        this.commande = "aller à l’ouest";
        this.focusCommande();
        break;

      case 'r':
      case 're':
        this.commande = "regarder ";
        this.focusCommande();
        break;

      case 'ss':
        this.commande = "sorties";
        this.focusCommande();
        break;

      case 'ob':
        this.commande = "observer ";
        this.focusCommande();
        break;

      case 'i':
      case 'in':
        this.commande = "inventaire";
        this.focusCommande();
        break;

      case 'p':
      case 'pr':
        this.commande = "prendre ";
        this.focusCommande();
        break;

      case 'po':
      case 'x':
        this.commande = "position ";
        this.focusCommande();
        break;

      default:
        break;
    }
  }

  /**
   * Valider une commande.
   * @param event 
   */
  onKeyDownEnter(event) {
    this.curseurHistorique = -1;
    if (this.commande && this.commande.trim() !== "") {
      const result = this.doCommande(this.commande);
      this.resultat += "\n > " + this.commande;
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
    const mots = commande.trim().split(" ");

    let retVal = null;

    if (mots.length > 0) {
      const verbe = mots[0];

      switch (verbe.toLowerCase()) {

        case "?":
        case "aide":
        case "perdu":
          retVal = this.com.aide(mots);
          break;

        case "a": // aller
        case "al":
        case "aller":
        case "n": // nord
        case "no": // nord
        case "nord":
        case "s": // sud
        case "su": // sud
        case "sud":
        case "e": // est
        case "es": // est
        case "est":
        case "o": // ouest
        case "ou": // ouest
        case "ouest":
        case "en": // entrer
        case "entrer": // entrer
        case "so": // sortir
        case "sortir":
        case "mo": // monter
        case "monter":
        case "de": // descendre
        case "descendre":
          retVal = this.com.aller(mots);
          break;

        case "i": // inventaire
        case "in":
        case "inventaire":
          retVal = this.com.inventaire();
          break;

        case "p": // prendre
        case "pr":
        case "at": // attraper
        case "prendre":
        case "attraper":
          retVal = this.com.prendre(mots);
          break;

        case "r": // regarder
        case "re":
        case "ob": // observer
        case "regarder":
        case "observer":
          retVal = this.com.regarder(mots);
          break;

        case "deverrouiller": // déverrouiller
        case "déverrouiller":
          retVal = this.com.deverrouiller(mots);
          break;

        case "u": // attaquer
        case "ut":
        case "utiliser":
          retVal = this.com.utiliser(mots);
          break;

        case "at": // attaquer
        case "attaquer":
          retVal = this.com.attaquer(mots);
          break;

        case "ouvrir":
          retVal = this.com.ouvrir(mots);
          break;

        case "fermer":
          retVal = this.com.fermer(mots);
          break;

        case "ex": // examiner
        case "examiner":
          // TODO: changer ça
          retVal = this.com.examiner(mots);
          break;

        case "ss": // sorties
        case "sorties":
          retVal = this.com.sorties(mots);
          break;

        case "f": // fouiller
        case "fouiller":
          retVal = this.com.fouiller(mots);
          break;

        case "où":
        case "ou":
          retVal = this.com.ou(mots);
          break;
        case "x": // position
        case "po": // position
        case "position":
          retVal = this.com.ouSuisJe();
          break;

        case "effacer":
        case "ef": // effacer
          this.resultat = "";
          retVal = this.com.effacer();
          break;

        default:
          retVal = "Désolé je n’ai pas compris « " + verbe + " »";
          break;
      }
    }

    return retVal;
  }

}
