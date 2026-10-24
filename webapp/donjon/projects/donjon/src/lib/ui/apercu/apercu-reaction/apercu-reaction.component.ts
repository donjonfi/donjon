import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { Reaction } from '../../../interfaces/compilateur/reaction';

@Component({
    selector: 'app-apercu-reaction',
    templateUrl: './apercu-reaction.component.html',
    styleUrls: ['./apercu-reaction.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ApercuReactionComponent implements OnInit {

  @Input() reaction: Reaction;

  replie = true;

  constructor() { }

  ngOnInit(): void {
  }

}
