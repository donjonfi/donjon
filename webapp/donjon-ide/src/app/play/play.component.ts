import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Jeu } from '../models/jeu';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit, OnChanges {

  @Input() jeu: Jeu;

  readonly TAILLE_DERNIERES_COMMANDES: number = 10;

  resultat: string = null;
  commande = "";
  historiqueCommandes = new Array<string>();
  curseurHistorique = -1;

  @ViewChild('txCommande') commandeInputRef: ElementRef;
  @ViewChild('taResultat') resultatInputRef: ElementRef;


  constructor() { }

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.jeu) {
      console.warn("jeu: ", this.jeu);
      this.resultat = "" + (this.jeu.titre ? (this.jeu.titre + "\n==============================\n") : "");
    } else {
      console.warn("pas de jeu :(");
    }
  }

  onKeyDownArrowUp(event) {
    if (this.curseurHistorique < (this.historiqueCommandes.length - 1)) {
      this.curseurHistorique += 1;
      const index = this.historiqueCommandes.length - this.curseurHistorique - 1;
      console.log("index:", index);
      this.commande = this.historiqueCommandes[index];
      console.log("this.commande:", this.commande);
      setTimeout(() => {
        console.log("setTimeout");
        this.commandeInputRef.nativeElement.selectionStart = this.commandeInputRef.nativeElement.selectionEnd = this.commande.length;
      }, 100);
    }
  }

  onKeyDownArrowDown(event) {
    if (this.curseurHistorique > 0) {
      this.curseurHistorique -= 1;
      const index = this.historiqueCommandes.length - this.curseurHistorique - 1;
      console.log("index:", index);
      this.commande = this.historiqueCommandes[index];
      console.log("this.commande:", this.commande);
      setTimeout(() => {
        this.commandeInputRef.nativeElement.selectionStart = this.commandeInputRef.nativeElement.selectionEnd = this.commande.length;
      }, 100);
    } else {
      this.commande = "";
    }
  }

  onKeyDownEnter(event) {
    console.log("C’est noté !");
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

    this.historiqueCommandes.push(commande);
    if (this.historiqueCommandes.length > this.TAILLE_DERNIERES_COMMANDES) {
      this.historiqueCommandes.shift();
    }

    console.log("commande:", commande);


    const mots = commande.trim().split(" ");

    let retVal = null;

    if (mots.length > 0) {
      const verbe = mots[0];

      switch (verbe.toLowerCase()) {
        case "inventaire":
          retVal = this.showInventaire();
          break;

        case "regarder":
        case "observer":
          retVal = this.doRegarder(mots);
          break;

        default:
          retVal = "Désolé je n’ai pas compris « " + verbe + " »";
          break;
      }
    }

    return retVal;
  }

  doRegarder(mots: string[]) {
    return "Je ne vois rien pour l’instant.";
  }

  showInventaire() {
    return "Votre inventaire est vide.";
  }


}
