import { Component, Input, OnInit } from '@angular/core';

import { GroupeNominal } from '@donjon/core';

@Component({
  selector: 'app-apercu-sujet',
  templateUrl: './apercu-sujet.component.html',
  styleUrls: ['./apercu-sujet.component.scss']
})
export class ApercuSujetComponent implements OnInit {

  @Input() sujet: GroupeNominal;
  @Input() titre = 'Sujet';

  constructor() { }

  ngOnInit(): void {
  }

}
