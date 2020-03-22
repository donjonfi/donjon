import 'brace';
import 'brace/mode/text';
// import 'brace/mode/javascript';
// import 'brace/theme/github';
import 'brace/theme/chrome';

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { AceConfigInterface } from 'ngx-ace-wrapper';
import { Compilateur } from '../utils/compilateur';
import { HttpClient } from '@angular/common/http';
import { Jeu } from '../models/jeu';

@Component({
  selector: 'app-editeur',
  templateUrl: './editeur.component.html',
  styleUrls: ['./editeur.component.scss']
})
export class EditeurComponent implements OnInit {

  @ViewChild('codeEditor', { static: true }) codeEditorElmRef: ElementRef;

  public config: AceConfigInterface = {
    mode: 'text',
    minLines: 80,
    theme: 'chrome',
    readOnly: false,
    tabSize: 2,
    fontSize: 18,
    showGutter: true,
    showLineNumbers: true,
    showPrintMargin: false,
    hScrollBarAlwaysVisible: false,

  };

  mode: "aucun" | "jeu" | "apercu" = "aucun";

  jeu: Jeu = null;
  codeSource = "";

  constructor(
    private http: HttpClient
  ) {

    this.http.get('assets/exemples/exemple1.dnj', { responseType: 'text' })
      .subscribe(texte => this.codeSource = texte);
  }

  onParseCode() {
    // interpréter le code
    this.jeu = Compilateur.parseCode(this.codeSource);
    // voir le résultat
    this.mode = "apercu";
  }

  onJouer() {
    // interpréter le code
    this.jeu = Compilateur.parseCode(this.codeSource);
    // commencer le jeu
    this.mode = "jeu";
  }

  ngOnInit(): void {

  }

}
