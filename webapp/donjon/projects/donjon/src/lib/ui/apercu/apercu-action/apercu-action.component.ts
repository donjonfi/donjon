import { Component, Input, OnInit } from '@angular/core';

import { Action } from '../../../models/compilateur/action';

@Component({
    selector: 'app-apercu-action',
    templateUrl: './apercu-action.component.html',
    styleUrls: ['./apercu-action.component.scss'],
    standalone: false
})
export class ApercuActionComponent implements OnInit {

  @Input() action: Action;

  replie = true;

  constructor() { }

  ngOnInit(): void {
  }
}