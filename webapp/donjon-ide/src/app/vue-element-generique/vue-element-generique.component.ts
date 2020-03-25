import { Component, Input, OnInit } from '@angular/core';

import { ElementGenerique } from '../models/compilateur/element-generique';

@Component({
  selector: 'app-vue-element-generique',
  templateUrl: './vue-element-generique.component.html',
  styleUrls: ['./vue-element-generique.component.scss']
})
export class VueElementGeneriqueComponent implements OnInit {

  @Input() el: ElementGenerique;
  
  constructor() { }

  ngOnInit(): void {
  }

}
