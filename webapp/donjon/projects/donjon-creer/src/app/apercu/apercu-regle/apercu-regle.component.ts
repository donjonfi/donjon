import { Component, Input, OnInit } from '@angular/core';
import { Regle, TypeEvenement } from '@donjon/core';

@Component({
  selector: 'app-apercu-regle',
  templateUrl: './apercu-regle.component.html',
  styleUrls: ['./apercu-regle.component.scss']
})
export class ApercuRegleComponent implements OnInit {

  @Input() regle: Regle;
  replie = true;

  TypeEvenement = TypeEvenement;

  constructor() { }

  ngOnInit(): void {
  }

}
