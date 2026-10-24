import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { ConditionMulti } from '../../../models/compilateur/condition-multi';

@Component({
    selector: 'app-apercu-condition',
    templateUrl: './apercu-condition.component.html',
    styleUrls: ['./apercu-condition.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ApercuConditionComponent implements OnInit {

  constructor() { }

  @Input() condition: ConditionMulti;

  ngOnInit(): void {
  }

}
