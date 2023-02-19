import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { ElementsJeuUtils, ListeEtats, PrepositionSpatiale } from 'donjon';

import { ObjetPresent } from '../models/objet-present';

@Component({
  selector: 'app-visu-objet',
  templateUrl: './visu-objet.component.html',
  styleUrls: ['./visu-objet.component.scss']
})
export class VisuObjetComponent implements OnInit {

  /** Utilitaires pour gérer les éléments du jeu */
  @Input() eju: ElementsJeuUtils;
  /** Les états du jeu */
  @Input() etats: ListeEtats | undefined;
  /** Objet à visualiser */
  @Input() objetPresent: ObjetPresent | undefined;
  /** Objet sur lequel on a cliqué */
  @Output() objetChoisi = new EventEmitter<ObjetPresent>();

  public objetsDans: ObjetPresent[] = [];
  public objetsSur: ObjetPresent[] = [];
  public objetsSous: ObjetPresent[] = [];

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.eju && this.etats && this.objetPresent) {
      this.updateContenuObjet();
    }
  }

  updateContenuObjet() {
    // dans
    const objetsDans = this.eju.obtenirContenu(this.objetPresent.objet, PrepositionSpatiale.dans)
    this.objetsDans = [];
    objetsDans.forEach(curObjet => {
      const curObjetPresent = new ObjetPresent(curObjet, undefined, undefined, undefined);
      curObjetPresent.cache = this.etats.possedeEtatIdElement(curObjet, this.etats.cacheID, this.eju)
      curObjetPresent.accessible = this.etats.possedeEtatIdElement(curObjet, this.etats.accessibleID, this.eju)
      curObjetPresent.visible = this.etats.possedeEtatIdElement(curObjet, this.etats.visibleID, this.eju)
      this.objetsDans.push(curObjetPresent);
    });
    // sur
    const objetsSur = this.eju.obtenirContenu(this.objetPresent.objet, PrepositionSpatiale.sur)
    this.objetsSur = [];
    objetsSur.forEach(curObjet => {
      const curObjetPresent = new ObjetPresent(curObjet, undefined, undefined, undefined);
      curObjetPresent.cache = this.etats.possedeEtatIdElement(curObjet, this.etats.cacheID, this.eju)
      curObjetPresent.accessible = this.etats.possedeEtatIdElement(curObjet, this.etats.accessibleID, this.eju)
      curObjetPresent.visible = this.etats.possedeEtatIdElement(curObjet, this.etats.visibleID, this.eju)
      this.objetsSur.push(curObjetPresent);
    });
    // sous
    const objetsSous = this.eju.obtenirContenu(this.objetPresent.objet, PrepositionSpatiale.sous)
    this.objetsSous = [];
    objetsSous.forEach(curObjet => {
      const curObjetPresent = new ObjetPresent(curObjet, undefined, undefined, undefined);
      curObjetPresent.cache = this.etats.possedeEtatIdElement(curObjet, this.etats.cacheID, this.eju)
      curObjetPresent.accessible = this.etats.possedeEtatIdElement(curObjet, this.etats.accessibleID, this.eju)
      curObjetPresent.visible = this.etats.possedeEtatIdElement(curObjet, this.etats.visibleID, this.eju)
      this.objetsSous.push(curObjetPresent);
    });
  }

  onObjetChoisi(objet: ObjetPresent) {
    this.objetChoisi.emit(objet);
  }

}
