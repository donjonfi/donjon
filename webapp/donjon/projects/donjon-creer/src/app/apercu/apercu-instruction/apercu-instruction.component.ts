import { Component, Input, OnInit } from '@angular/core';

import { Instruction } from '@donjon/core';

@Component({
  selector: 'app-apercu-instruction',
  templateUrl: './apercu-instruction.component.html',
  styleUrls: ['./apercu-instruction.component.scss']
})
export class ApercuInstructionComponent implements OnInit {

  constructor() { }

  @Input() ins: Instruction;

  ngOnInit(): void {
  }

}
