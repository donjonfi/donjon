import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { GroupeNominal } from '../../../models/commun/groupe-nominal';

@Component({
    selector: 'app-apercu-sujet',
    templateUrl: './apercu-sujet.component.html',
    styleUrls: ['./apercu-sujet.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ApercuSujetComponent implements OnInit {

  @Input() sujet: GroupeNominal;
  @Input() titre = 'Sujet';

  constructor() { }

  ngOnInit(): void {
  }

}
