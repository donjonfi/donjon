import { Component, Input, OnInit } from '@angular/core';

import { Action } from 'src/app/models/compilateur/action';

@Component({
  selector: 'app-apercu-action',
  templateUrl: './apercu-action.component.html',
  styleUrls: ['./apercu-action.component.scss']
})
export class ApercuActionComponent implements OnInit {

  @Input() action: Action;

  constructor() { }

  ngOnInit(): void {
  }

}
