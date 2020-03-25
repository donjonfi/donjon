import { Component, Input, OnInit } from '@angular/core';

import { Monde } from '../models/compilateur/monde';

@Component({
  selector: 'app-apercu-monde',
  templateUrl: './apercu-monde.component.html',
  styleUrls: ['./apercu-monde.component.scss']
})
export class ApercuMondeComponent implements OnInit {

  @Input() monde: Monde;

  constructor() { }

  ngOnInit(): void {
  }

}
