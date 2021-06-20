import { Component, Input, OnInit } from '@angular/core';
import { PositionObjet, PrepositionSpatiale } from 'projects/donjon/src/public-api';
import { ProprieteJeu, TypeProprieteJeu } from '@donjon/core';

@Component({
  selector: 'app-apercu-propriete-jeu',
  templateUrl: './apercu-propriete-jeu.component.html',
  styleUrls: ['./apercu-propriete-jeu.component.scss']
})
export class ApercuProprieteJeuComponent implements OnInit {

  constructor() { }

  public TypeProprieteJeu = TypeProprieteJeu;

  @Input() pro: ProprieteJeu;

  ngOnInit(): void {

  }

  getPrepositionSpatiale(prep: PrepositionSpatiale) {
    return PositionObjet.prepositionSpacialeToString(prep);
  }

  getDe(nom:string) {
    let retVal = "de ";
    if (nom?.match(/^(a|e|i|o|u|y)/i)) {
      retVal = "d’";
    }
    return retVal;
  }

}
