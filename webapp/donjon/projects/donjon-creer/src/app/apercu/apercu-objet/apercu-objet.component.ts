import { Classe, ClasseUtils, ElementGenerique } from '@donjon/core';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-apercu-objet',
  templateUrl: './apercu-objet.component.html',
  styleUrls: ['./apercu-objet.component.scss']
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
}
