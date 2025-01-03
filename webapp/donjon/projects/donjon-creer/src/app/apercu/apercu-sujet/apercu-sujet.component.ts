import { Component, Input, OnInit } from '@angular/core';

import { GroupeNominal } from 'donjon';

@Component({
    selector: 'app-apercu-sujet',
    templateUrl: './apercu-sujet.component.html',
    styleUrls: ['./apercu-sujet.component.scss'],
    standalone: false
})
export class ApercuSujetComponent implements OnInit {

  @Input() sujet: GroupeNominal;
  @Input() titre = 'Sujet';

  constructor() { }

  ngOnInit(): void {
  }

}
