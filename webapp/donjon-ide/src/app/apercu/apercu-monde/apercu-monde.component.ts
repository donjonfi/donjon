import { Component, Input, OnInit } from '@angular/core';

import { Action } from '../../models/compilateur/action';
import { Monde } from '../../models/compilateur/monde';
import { Regle } from '../../models/compilateur/regle';
import { TypeRegle } from 'src/app/models/compilateur/type-regle';

@Component({
  selector: 'app-apercu-monde',
  templateUrl: './apercu-monde.component.html',
  styleUrls: ['./apercu-monde.component.scss']
})
export class ApercuMondeComponent implements OnInit {

  TypeRegle = TypeRegle;

  @Input() monde: Monde;
  @Input() regles: Regle[];
  @Input() actions: Action[];

  constructor() { }

  ngOnInit(): void {
  }

}
