import 'brace';
import 'brace/ext/searchbox';
import 'brace/mode/text';
import '../../mode-donjon.js';
// import 'brace/mode/javascript';
import 'brace/theme/chrome';
import 'brace/theme/crimson_editor';
import 'brace/theme/dracula';
import 'brace/theme/vibrant_ink';
import 'brace/theme/solarized_light';
import 'brace/theme/tomorrow';
import 'brace/theme/katzenmilch';
import 'brace/theme/ambiance';
import 'brace/theme/monokai';
import 'brace/theme/solarized_dark';

import * as FileSaver from 'file-saver';

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { AceConfigInterface } from 'ngx-ace-wrapper';
import { Action } from '../models/compilateur/action';
import { Compilateur } from '../utils/compilateur';
import { Generateur } from '../utils/generateur';
import { HttpClient } from '@angular/common/http';
import { Jeu } from '../models/jeu/jeu';
import { Monde } from '../models/compilateur/monde';
import { Regle } from '../models/compilateur/regle';
import { StringUtils } from '../utils/string.utils';

@Component({
  selector: 'app-editeur',
  templateUrl: './editeur.component.html',
  styleUrls: ['./editeur.component.scss']
})
export class EditeurComponent implements OnInit {

  @ViewChild('codeEditor', { static: true }) codeEditorElmRef: ElementRef;

  nbLignesCode = 10;
  tailleTexte = 18;
  hauteurLigneCode = 18;

  public config: AceConfigInterface = {
    // mode: 'text',
    mode: 'donjon',
    minLines: 80,
    theme: 'monokai',
    readOnly: false,
    tabSize: 2,
    fontSize: this.tailleTexte,
    showGutter: true,
    showLineNumbers: true,
    showPrintMargin: false,
    hScrollBarAlwaysVisible: false,
    wrap: true,
  };

  theme = "monokai";

  mode: "aucun" | "jeu" | "apercu" = "aucun";

  monde: Monde = null;
  regles: Regle[] = null;
  actions: Action[] = null;
  erreurs: string[] = null;
  jeu: Jeu = null;
  codeSource = "";
  nomExemple = "exemple2";

  constructor(
    private http: HttpClient,
  ) {

  }

  ngOnInit(): void {
    // https://www.npmjs.com/package/ngx-ace-wrapper
    // => this.codeEditorElmRef["directiveRef"] : directiveRef;
    // => this.codeEditorElmRef["directiveRef"].ace() : Returns the Ace instance reference for full API access.



    // RÉCUPÉRER LES PRÉFÉRENCES DE L’UTILISATEUR
    // - nombre de lignes de code visibles
    let retVal = localStorage.getItem('EditeurNbLignesCodes');
    if (retVal) {
      this.nbLignesCode = +retVal;
    }
    // - taille texte
    retVal = localStorage.getItem('EditeurTailleTexte');
    if (retVal) {
      this.tailleTexte = +retVal;
    }
    this.majTailleAce();
    // - thème
    retVal = localStorage.getItem('EditeurTheme');
    if (retVal) {
      this.theme = retVal;
    }


    // récupérer le code source de la session
    this.codeSource = sessionStorage.getItem("CodeSource");

  }
  onChangerTheme() {
    localStorage.setItem('EditeurTheme', this.theme);
  }

  onChangerNbLignesCode() {
    localStorage.setItem('EditeurNbLignesCodes', this.nbLignesCode.toString());
    this.majTailleAce();
  }

  onChangerTailleFont() {
    localStorage.setItem('EditeurTailleTexte', this.tailleTexte.toString());
    this.majTailleAce();
  }

  majTailleAce() {
    setTimeout(() => {
      this.codeEditorElmRef["directiveRef"].ace().resize();
      this.codeEditorElmRef["directiveRef"].ace().setOption("maxLines", this.nbLignesCode);
      this.codeEditorElmRef["directiveRef"].ace().setOption("fontSize", this.tailleTexte);
      this.codeEditorElmRef["directiveRef"].ace().renderer.updateFull();
      // en fonction du navigateur cette valeur est variable !
      this.hauteurLigneCode = this.codeEditorElmRef["directiveRef"].ace().renderer.lineHeight;
    }, this.codeEditorElmRef["directiveRef"].ace() ? 0 : 200);
  }

  onChargerExemple() {
    const nomFichierExemple = StringUtils.nameToSafeFileName(this.nomExemple, ".djn");
    if (nomFichierExemple) {
      this.http.get('assets/exemples/' + nomFichierExemple, { responseType: 'text' })
        .subscribe(texte => this.codeSource = texte);
      this.monde = null;
      this.erreurs = null;
      this.regles = null;
    }
  }

  onOuvrirFichier(evenement) {
    // fichier choisi par l’utilisateur
    const file = evenement.target.files[0];
    if (file) {
      let fileReader = new FileReader();
      // quand lu, l’attribuer au code source
      fileReader.onload = (progressEvent) => {
        this.codeSource = fileReader.result as string;
        console.log(">>> fichier chargé.");

      };
      // lire le fichier
      fileReader.readAsText(file);
      this.monde = null;
      this.erreurs = null;
      this.regles = null;
    }
  }

  sauvegarderSession() {
    sessionStorage.setItem('CodeSource', this.codeSource);
  }

  onSauvegarderSous() {
    // Note: Ie and Edge don't support the new File constructor,
    // so it's better to construct blobs and use saveAs(blob, filename)
    const file = new File([this.codeSource], "donjon.djn", { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(file);
  }

  onApercu() {
    this.sauvegarderSession();
    if (this.codeSource.trim() != '') {
      // interpréter le code
      let resultat = Compilateur.parseCode(this.codeSource);
      this.monde = resultat.monde;
      this.regles = resultat.regles;
      this.actions = resultat.actions;
      this.erreurs = resultat.erreurs;
      // voir le résultat
      this.mode = "apercu";
    } else {
      this.erreurs = [];
    }
  }

  onJouer() {
    this.sauvegarderSession();
    if (this.codeSource.trim() != '') {
      // interpréter le code
      let resultat = Compilateur.parseCode(this.codeSource);
      this.monde = resultat.monde;
      this.regles = resultat.regles;
      this.actions = resultat.actions;
      this.erreurs = resultat.erreurs;
      // générer le jeu
      this.jeu = Generateur.genererJeu(this.monde, this.regles, this.actions);
      // commencer le jeu
      this.mode = "jeu";
    } else {
      this.erreurs = [];
    }

  }



}
