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
import { StringUtils } from '../utils/string.utils';

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
  nomExemple = "exemple1";

  constructor(
    private http: HttpClient
  ) {

  }

  onParseCode() {
    // interpréter le code
    this.jeu = Compilateur.parseCode(this.codeSource);
    // voir le résultat
    this.mode = "apercu";
  }

  onChargerExemple() {
    const nomFichierExemple = StringUtils.nameToSafeFileName(this.nomExemple, ".djn");
    if (nomFichierExemple) {
      this.http.get('assets/exemples/' + nomFichierExemple, { responseType: 'text' })
        .subscribe(texte => this.codeSource = texte);
    }
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
