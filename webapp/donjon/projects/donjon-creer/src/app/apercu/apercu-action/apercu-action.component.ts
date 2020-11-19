import { Component, Input, OnInit } from '@angular/core';

import { Action } from '@donjon/core';

@Component({
  selector: 'app-apercu-action',
  templateUrl: './apercu-action.component.html',
  styleUrls: ['./apercu-action.component.scss']
})
export class ApercuActionComponent implements OnInit {

  @Input() action: Action;

  replie = true;

  constructor() { }

  ngOnInit(): void {
  }
}