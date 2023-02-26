import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'clavier-tactile',
  templateUrl: './clavier-tactile.component.html',
  styleUrls: ['./clavier-tactile.component.css']
})
export class ClavierTactileComponent implements OnInit {

  sousMenu: 'aucun'|'examiner'|'prendre'|'aller'|'utiliser' = 'aucun';

  constructor() { }

  ngOnInit(): void {
  }

}
