import { Classe } from '../../../models/commun/classe';
import { ClasseUtils } from '../../../utils/commun/classe-utils';
import { EClasseRacine } from '../../../models/commun/constantes';
import { ElementGenerique } from '../../../models/compilateur/element-generique';
import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-apercu-objet',
    templateUrl: './apercu-objet.component.html',
    styleUrls: ['./apercu-objet.component.scss'],
    standalone: false
})
export class ApercuObjetComponent implements OnInit {

  @Input() el: ElementGenerique;
  @Input() estLieu = false;

  replie = true;

  constructor() { }

  ngOnInit(): void {
  }

  getHierarchieClasse(classe: Classe): string {
    return ClasseUtils.getHierarchieClasse(classe);
  }

  /** Étiquettes de catégorie de l’objet (ressource, vivant, support, contenant) selon sa classe. */
  get etiquettes(): string[] {
    const classe = this.el?.classe;
    if (!classe) { return []; }
    const labels: string[] = [];
    if (ClasseUtils.heriteDe(classe, EClasseRacine.ressource)) { labels.push('ressource'); }
    if (ClasseUtils.heriteDe(classe, EClasseRacine.vivant)) { labels.push('vivant'); }
    if (ClasseUtils.heriteDe(classe, EClasseRacine.contenant)) { labels.push('contenant'); }
    if (ClasseUtils.heriteDe(classe, EClasseRacine.support)) { labels.push('support'); }
    return labels;
  }
}
