import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { Instruction } from '../../../models/compilateur/instruction';

@Component({
    selector: 'app-apercu-instruction',
    templateUrl: './apercu-instruction.component.html',
    styleUrls: ['./apercu-instruction.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ApercuInstructionComponent implements OnInit {

  constructor() { }

  @Input() ins: Instruction;

  ngOnInit(): void {
  }

}
