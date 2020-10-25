import { Component, OnInit } from '@angular/core';

import { Input } from '@angular/core';
import { Reaction } from 'src/app/models/compilateur/reaction';

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
