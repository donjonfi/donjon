import { Component, Input, OnInit } from '@angular/core';

import { GroupeNominal } from 'src/app/models/commun/groupe-nominal';

@Component({
  selector: 'app-apercu-sujet',
  templateUrl: './apercu-sujet.component.html',
  styleUrls: ['./apercu-sujet.component.scss']
})
export class ApercuSujetComponent implements OnInit {

  @Input() sujet: GroupeNominal;
  
  constructor() { }

  ngOnInit(): void {
  }

}
