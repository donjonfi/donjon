import { Component, Input, OnInit } from '@angular/core';

import { Reaction } from '@donjon/core';

@Component({
  selector: 'app-apercu-reaction',
  templateUrl: './apercu-reaction.component.html',
  styleUrls: ['./apercu-reaction.component.scss']
})
export class ApercuReactionComponent implements OnInit {

  @Input() reaction: Reaction;

  replie = true;

  constructor() { }

  ngOnInit(): void {
  }

}
