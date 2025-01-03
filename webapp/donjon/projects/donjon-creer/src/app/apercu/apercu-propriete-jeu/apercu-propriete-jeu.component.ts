import { Component, Input, OnInit } from '@angular/core';
import { PositionObjet, PrepositionSpatiale } from 'projects/donjon/src/public-api';
import { ProprieteJeu, TypeProprieteJeu } from 'donjon';

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
