import 'brace';
import 'brace/mode/text';
// import 'brace/mode/javascript';
// import 'brace/theme/github';
import 'brace/theme/chrome';

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { AceConfigInterface } from 'ngx-ace-wrapper';
import { Compilateur } from '../utils/compilateur';
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

  codeSource = `"Le nain qui voulait un trésor".


- 1 - Le jardin.
Le joueur est dans le jardin.
Le jardin est une salle. "Vous êtes dans un beau jardin en fleurs. Le soleil brille.".
Les fleurs (f) sont des décors du jardin.
Une clé rouge est dans le jardin. "Il s'agit d'une veille clé rouillée et un peu tordue."
La clé verte est dans le jardin.
C'est une clé.
La clé rouge est en fer, légère et rouillée.
L'abri de jardin est une salle.
Il est à l'intérieur du jardin.
Il est sombre, humide et froid.
Les fourmis sont des animaux du jardin. "Il y en a beaucoup mais elle n'ont pas l'air agressives."
La porte rouge est une porte au sud de l'abri de jardin.
La porte rouge est fermée et n'est pas ouvrable.
La clé rouge ouvre la porte rouge.
Le seau est un contenant.
Le seau est dans l'abri de jardin.
La haie est une porte au nord du jardin. Elle est fermée et ouvrable.

- 2 - La forêt et la caverne.
La forêt est une salle au nord du jardin. "Vous êtes dans une forêt sombre.".
Les arbres sont des décors de la forêt.
Il y a des chauves-souris dans les arbres.
Elles sont douces et gentilles.
Ce sont des animaux.
Les fleurs (f) sont des décors de la forêt.
Le lac est un décor de la forêt.
Il contient de l'eau.
La caverne ténébreuse est une salle sombre à l'intérieur de la forêt.
Le dragon est un animal dans la caverne.
Le trésor est dans la caverne. "Vous êtes attiré par l'éclat de ces nombreuses richesses."
`;

  jeu: Jeu = null;

  constructor() {

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
