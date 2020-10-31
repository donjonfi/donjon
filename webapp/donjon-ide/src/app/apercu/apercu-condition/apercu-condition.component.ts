import { Component, Input, OnInit } from '@angular/core';

import { Condition } from 'src/app/models/compilateur/condition';

@Component({
  selector: 'app-apercu-condition',
  templateUrl: './apercu-condition.component.html',
  styleUrls: ['./apercu-condition.component.scss']
})
export class ApercuConditionComponent implements OnInit {

  constructor() { }

  @Input() condition: Condition;

  ngOnInit(): void {
  }

}
