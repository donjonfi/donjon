import { Classe } from '../../../models/commun/classe';
import { ClasseUtils } from '../../../utils/commun/classe-utils';
import { ElementsJeuUtils } from '../../../utils/commun/elements-jeu-utils';
import { ListeEtats } from '../../../utils/jeu/liste-etats';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import { ObjetPresent } from '../models/objet-present';

@Component({
    selector: 'app-visu-detail-objet',
    templateUrl: './visu-detail-objet.component.html',
    styleUrls: ['./visu-detail-objet.component.scss'],
    standalone: false
})
export class VisuDetailObjetComponent implements OnInit, OnChanges {

  /** Les états du jeu */
  @Input() etats: ListeEtats;
  /** Utilitaires pour gérer les éléments du jeu */
  @Input() eju: ElementsJeuUtils;
  /** Objet à détailler */
  @Input() objetVisible: ObjetPresent;

  public listeEtats: string;

  public ClasseUtils: ClasseUtils;

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.eju && this.objetVisible) {
      this.updateDetails();
    }
  }


  updateDetails() {
    if (this.objetVisible) {
      this.listeEtats = this.etats.obtenirIntitulesEtatsElementJeu(this.objetVisible.objet);
      this.objetVisible.cache = this.etats.possedeEtatIdElement(this.objetVisible.objet, this.etats.cacheID, this.eju)
      this.objetVisible.accessible = this.etats.possedeEtatIdElement(this.objetVisible.objet, this.etats.accessibleID, this.eju)
      this.objetVisible.visible = this.etats.possedeEtatIdElement(this.objetVisible.objet, this.etats.visibleID, this.eju)
    }
  }

  get hierachieClasse(): string {
    return ClasseUtils.getHierarchieClasse(this.objetVisible.objet.classe);
  }

}
