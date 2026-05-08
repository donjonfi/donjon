import { Action } from '../../../models/compilateur/action';
import { ElementGenerique } from '../../../models/compilateur/element-generique';
import { Monde } from '../../../models/compilateur/monde';
import { Regle } from '../../../interfaces/compilateur/regle';
import { TypeRegle } from '../../../models/compilateur/type-regle';
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
