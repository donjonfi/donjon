import { Component, Input, OnInit } from '@angular/core';
import { PositionObjet, PrepositionSpatiale } from '../../../models/jeu/position-objet';
import { ProprieteJeu, TypeProprieteJeu } from '../../../models/jeu/propriete-jeu';

@Component({
    selector: 'app-apercu-propriete-jeu',
    templateUrl: './apercu-propriete-jeu.component.html',
    styleUrls: ['./apercu-propriete-jeu.component.scss'],
    standalone: false
})
export class ApercuProprieteJeuComponent implements OnInit {

  constructor() { }

  public TypeProprieteJeu = TypeProprieteJeu;

  @Input() pro: ProprieteJeu;

  ngOnInit(): void {

  }

  getPrepositionSpatiale(prep: PrepositionSpatiale) {
    return PositionObjet.prepositionSpatialeToString(prep);
  }

  getDe(nom:string) {
    return ProprieteJeu.getDe(nom);
  }

}
