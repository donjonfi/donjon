import { Action, ElementGenerique, Monde, Regle, TypeRegle } from 'donjon';
import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-apercu-monde',
    templateUrl: './apercu-monde.component.html',
    styleUrls: ['./apercu-monde.component.scss'],
    standalone: false
})
export class ApercuMondeComponent implements OnInit {

  TypeRegle = TypeRegle;

  @Input() monde: Monde;
  @Input() regles: Regle[];
  @Input() compteurs: ElementGenerique[];
  @Input() listes: ElementGenerique[];
  @Input() actions: Action[];

  constructor() { }

  ngOnInit(): void {
  }

}
