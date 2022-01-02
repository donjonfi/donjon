import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ElementsJeuUtils, Lieu, ListeEtats, Localisation, PrepositionSpatiale } from '@donjon/core';

import { LieuVoisin } from '../models/lieu-voisin';
import { ObjetPresent } from '../models/objet-present';

@Component({
  selector: 'app-visu-lieu',
  templateUrl: './visu-lieu.component.html',
  styleUrls: ['./visu-lieu.component.scss']
})
export class VisuLieuComponent implements OnInit, OnChanges {

  /** Utilitaires les éléments du jeu */
  @Input() eju: ElementsJeuUtils | undefined;
  /** Les états du jeu */
  @Input() etats: ListeEtats | undefined;
  /** Lieu actuellement affiché */
  @Input() curLieu: Lieu | undefined;
  /** Lieu sur lequel on a cliqué */
  @Output() lieuChoisi = new EventEmitter<Lieu>();
  /** Objet sur lequel on a cliqué */
  @Output() objetChoisi = new EventEmitter<ObjetPresent>();

  /** Objets présents dans le lieu affiché */
  public objetsPresents: ObjetPresent[] = [];
  public voisinsPresents: LieuVoisin[] = [];
  constructor() { }

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    // if (changes['curLieu'] && this.eju) {
    //   this.updateLieu();
    // }
    // if (changes['jeu'] && this.eju) {
    //   this.updateLieu();
    // }
    if (this.eju && this.etats && this.curLieu) {
      this.updateLieu();
    }
  }

  private updateLieu() {
    this.updateObjetsPresents();
    this.updateVoisins();
  }

  /** Mettre à jour la liste des objets présent dans le lieu affiché. */
  private updateObjetsPresents() {
    this.objetsPresents = [];
    if (this.curLieu) {
      const objetsDans = this.eju.trouverContenu(this.curLieu, true, true, true, PrepositionSpatiale.dans);
      objetsDans.forEach(curObjet => {
        const curObjetPresent = new ObjetPresent(curObjet, undefined, undefined, undefined);
        curObjetPresent.cache = this.etats.possedeEtatIdElement(curObjet, this.etats.cacheID, this.eju)
        curObjetPresent.accessible = this.etats.possedeEtatIdElement(curObjet, this.etats.accessibleID, this.eju)
        curObjetPresent.visible = this.etats.possedeEtatIdElement(curObjet, this.etats.visibleID, this.eju)
        this.objetsPresents.push(curObjetPresent);
      });
    }
  }

  private updateVoisins() {
    // récupérer l’ensemble des voisins
    const voisins = this.eju.getLieuxVoisins(this.curLieu);
    const voisinsVisibles = this.eju.getLieuxVoisinsVisibles(this.curLieu);

    this.voisinsPresents = [];

    voisins.forEach(voisin => {
      const lieu = this.eju.getLieu(voisin.id);
      const visible = voisinsVisibles.some(x => x.id == voisin.id);
      const accessible = true;
      const direction = Localisation.getLocalisation(voisin.localisation);
      const curLieuVoisin = new LieuVoisin(direction, lieu, visible, accessible);
      this.voisinsPresents.push(curLieuVoisin);
    });
  }

  onVoisinClick(lieu: Lieu) {
    this.lieuChoisi.emit(lieu);
  }

  onObjetChoisi(objet: ObjetPresent) {
    this.objetChoisi.emit(objet);
  }


}
