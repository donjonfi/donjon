import { Component, Input, OnInit } from '@angular/core';

import { ElementGenerique } from '@donjon/core';

@Component({
  selector: 'app-apercu-element-generique',
  templateUrl: './apercu-element-generique.component.html',
  styleUrls: ['./apercu-element-generique.component.scss']
})
export class ApercuElementGeneriqueComponent implements OnInit {

  @Input() el: ElementGenerique;
  @Input() estLieu = false;

  replie = true;

  constructor() { }

  ngOnInit(): void {
  }

}
