import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { ElementsJeuUtils, Jeu, Lieu, Objet } from '@donjon/core';

import { ObjetPresent } from '../models/objet-present';

@Component({
  selector: 'app-visualisation',
  templateUrl: './visualisation.component.html',
  styleUrls: ['./visualisation.component.scss']
})
export class VisualisationComponent implements OnInit {

  /** Le jeu complet */
  @Input() jeu: Jeu;

  public curLieu: Lieu | undefined;
  public curObjet: ObjetPresent | undefined;
  public eju: ElementsJeuUtils | undefined;


  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if (changes['jeu']) {
    //   if (!this.curLieu) {
    //     this.curLieu = this.eju.curLieu;
    //   }
    // }
    if (this.jeu) {
      this.eju = new ElementsJeuUtils(this.jeu, false);
      this.curLieu = this.eju.curLieu;
    }
  }

  onLieuChoisi(lieu: Lieu) {
    this.curLieu = lieu;
  }

  onObjetChoisi(objet: ObjetPresent) {
    this.curObjet = objet;
  }

}
