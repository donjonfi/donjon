import { Component, Input, OnInit } from '@angular/core';

import { ConditionMulti } from '@donjon/core';

@Component({
  selector: 'app-apercu-condition',
  templateUrl: './apercu-condition.component.html',
  styleUrls: ['./apercu-condition.component.scss']
})
export class ApercuConditionComponent implements OnInit {

  constructor() { }

  @Input() condition: ConditionMulti;

  ngOnInit(): void {
  }

}
