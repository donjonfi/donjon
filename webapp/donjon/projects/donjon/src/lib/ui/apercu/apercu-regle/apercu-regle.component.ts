import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Regle } from '../../../interfaces/compilateur/regle';
import { TypeEvenement } from '../../../models/jouer/type-evenement';

@Component({
    selector: 'app-apercu-regle',
    templateUrl: './apercu-regle.component.html',
    styleUrls: ['./apercu-regle.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ApercuRegleComponent implements OnInit {

  @Input() regle: Regle;
  replie = true;

  TypeEvenement = TypeEvenement;

  constructor() { }

  ngOnInit(): void {
  }

}
