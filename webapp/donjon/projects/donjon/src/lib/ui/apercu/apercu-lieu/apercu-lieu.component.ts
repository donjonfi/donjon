import { Classe } from '../../../models/commun/classe';
import { ClasseUtils } from '../../../utils/commun/classe-utils';
import { ElementGenerique } from '../../../models/compilateur/element-generique';
import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-apercu-lieu',
    templateUrl: './apercu-lieu.component.html',
    styleUrls: ['./apercu-lieu.component.scss'],
    standalone: false
})
export class ApercuLieuComponent implements OnInit {

  @Input() el: ElementGenerique;
  @Input() estLieu = false;

  replie = true;

  constructor() { }

  ngOnInit(): void {
  }

  getHierarchieClasse(classe: Classe): string {
    return ClasseUtils.getHierarchieClasse(classe);
  }

}
