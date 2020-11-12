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
import { Compilateur } from '../utils/compilation/compilateur';
import { Generateur } from '../utils/compilation/generateur';
import { HttpClient } from '@angular/common/http';
import { Jeu } from '../models/jeu/jeu';
import { Monde } from '../models/compilateur/monde';
import { Regle } from '../models/compilateur/regle';
import { StringUtils } from '../utils/commun/string.utils';
import { TabsetComponent } from 'ngx-bootstrap/tabs';

@Component({
  selector: 'app-editeur',
  templateUrl: './editeur.component.html',
  styleUrls: ['./editeur.component.scss']
})
export class EditeurComponent implements OnInit {

  @ViewChild('codeEditor', { static: true }) codeEditorElmRef: ElementRef;

  nbLignesCode = 20;
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
  curPartieIndex: number = null;
  precPartieIndex: number = null;
  curChapitreIndex: number = null;
  precChapitreIndex: number = null;
  curSceneIndex: number = null;
  /** Code source complet. */
  codeSource = "";
  /** Section visible du code source. */
  sectionCodeSourceVisible = "";
  partieSourceDejaChargee = false;

  /** Liste des intitulés des différentes parties du code source. */
  allPartiesIntitule: string[] = [];
  /** Liste des différentes parties du code source */
  allPartiesCodeSource: string[] = [];
  /** Liste des intitulés des différents chapitres de la partie. */
  allChapitresIntitule: string[] = [];
  /** Liste des différents chapitres de la partie */
  allChapitresCodeSource: string[] = [];
  /** Liste des intitulés des différentes scenes du chapitre. */
  allScenesIntitule: string[] = [];
  /** Liste des différentes scenes du chapitre */
  allScenesCodeSource: string[] = [];

  chargementFichierEnCours = false;
  /** Fichier d'exemple par défaut. */
  nomExemple = "coince";
  /** Afficher les préférences ou non */
  afficherPreferences = false;

  @ViewChild('editeurTabs', { static: false }) editeurTabs: TabsetComponent;
  compilationEnCours = false;
  compilationTerminee = false;

  fichierCharge = null;

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


  onChangerPartie() {
    if (!this.chargementFichierEnCours) {
      if (this.partieSourceDejaChargee) {
        // rassembler le code source pour ne rien perdre
        this.rassemblerSource();
      }
      // changer la partie à afficher
      if (this.curPartieIndex !== null && (this.curPartieIndex < this.allPartiesCodeSource.length)) {
        this.sectionCodeSourceVisible = this.allPartiesCodeSource[this.curPartieIndex];
        // this.decouperEnSections("chapitre");
      } else {
        this.sectionCodeSourceVisible = this.codeSource;
      }
      this.partieSourceDejaChargee = true;
      this.precPartieIndex = this.curPartieIndex;
    }
  }

  onChangerChapitre() {
    if (!this.chargementFichierEnCours) {
      if (this.partieSourceDejaChargee) {
        // rassembler le code source pour ne rien perdre
        this.rassemblerSource();
      }
      // changer la partie à afficher
      if (this.curPartieIndex !== null && (this.curPartieIndex < this.allPartiesCodeSource.length)) {
        this.sectionCodeSourceVisible = this.allPartiesCodeSource[this.curPartieIndex];
      } else {
        this.sectionCodeSourceVisible = this.codeSource;
      }
      this.partieSourceDejaChargee = true;
      this.precPartieIndex = this.curPartieIndex;
    }
  }

  onChangerScene() {
    if (!this.chargementFichierEnCours) {
      if (this.partieSourceDejaChargee) {
        // rassembler le code source pour ne rien perdre
        this.rassemblerSource();
      }
      // changer la partie à afficher
      if (this.curPartieIndex !== null && (this.curPartieIndex < this.allPartiesCodeSource.length)) {
        this.sectionCodeSourceVisible = this.allPartiesCodeSource[this.curPartieIndex];
      } else {
        this.sectionCodeSourceVisible = this.codeSource;
      }
      this.partieSourceDejaChargee = true;
      this.precPartieIndex = this.curPartieIndex;
    }
  }

  rassemblerSource() {
    // si on n'affichait qu'une seule partie
    if (this.precPartieIndex !== null) {
      // mettre à jour la partie en cours d’édition dans la liste des parties
      this.allPartiesCodeSource[this.precPartieIndex] = this.sectionCodeSourceVisible;
      // mettre à jour le code source en rassemblant la liste des parties
      this.codeSource = this.allPartiesCodeSource.join("");
      // si on affichait tout
    } else if (this.sectionCodeSourceVisible !== null) {
      this.codeSource = this.sectionCodeSourceVisible;
    }
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
      this.viderCodeSource();
      this.chargementFichierEnCours = true;
      this.http.get('assets/exemples/' + nomFichierExemple, { responseType: 'text' })
        .subscribe(texte => {
          this.initCodeSource(texte);
        });
    }
  }

  onOuvrirFichier(evenement) {
    if (this.fichierCharge) {
      // fichier choisi par l’utilisateur
      const file = evenement.target.files[0];
      if (file) {
        this.viderCodeSource();
        this.chargementFichierEnCours = true;
        let fileReader = new FileReader();
        // quand lu, l’attribuer au code source
        fileReader.onloadend = (progressEvent) => {
          this.initCodeSource(fileReader.result as string);
        };
        // lire le fichier
        fileReader.readAsText(file);
      }
    }
  }

  /** Vider le code source. */
  private viderCodeSource() {

    this.curPartieIndex = null;
    this.precPartieIndex = null;
    this.curChapitreIndex = null;
    this.curSceneIndex = null;
    this.sectionCodeSourceVisible = null;

    // this.codeSource = "";
    // this.sectionCodeSourceVisible = "";
    // this.monde = null;
    // this.erreurs = null;
    // this.regles = null;
    // this.compilationTerminee = false;
    // this.fichierCharge = null;
  }

  /** Initialiser le code source */
  private initCodeSource(codeSource: string) {
    this.codeSource = codeSource;
    this.decouperEnSections("partie");
    // this.decouperEnParties();
    this.chargementFichierEnCours = false;
    this.partieSourceDejaChargee = false;
    this.curPartieIndex = null;
    this.onChangerPartie();
  }

  /** Découper le code source en parties */
  private decouperEnParties() {
    this.viderCodeSource();
    // this.curPartieIndex = null;
    // this.precPartieIndex = null;
    // this.curChapitreIndex = null;
    // this.curSceneIndex = null;
    // this.sectionCodeSourceVisible = null;

    // découper pour avoir les intitulés des parties de code et leur contenu (1 sur 2)
    const decoupageEnParties = this.codeSource.split(/^(?: *)(Partie(?: +)"(?:.+?)"(?: *))(?:\.?)( *)$/mi);
    let dernEstPartie = false;
    let dernPartie: string;

    this.allPartiesCodeSource = [];
    this.allPartiesIntitule = [];

    // parcourir les parties de code et leur intitulé
    decoupageEnParties.forEach(element => {
      if (element) {
        if (element.match(/^( *)partie( .+)/i)) {
          // si c’était déjà une partie juste avant (càd sans code source), ajouter du code source à la partie
          if (dernEstPartie) {
            // ajouter le code source de la partie précédé de l’instruction « partie »
            this.allPartiesCodeSource.push('Partie "' + dernPartie + '".' + (element.startsWith('\n') ? "" : "\n") + element);
          }
          // ajouter le titre de la nouvelle partie
          dernPartie = element.replace(/(?:^partie( ?))|\"/gi, "");
          this.allPartiesIntitule.push(dernPartie);
          dernEstPartie = true;
        } else {
          // si pas précédé d’une partie, ajouter un intitulé pour la partie
          if (!dernEstPartie) {
            dernPartie = "(sans nom)";
            this.allPartiesIntitule.push(dernPartie);
          }
          // ajouter le code source de la partie précédé de l’instruction « partie »
          this.allPartiesCodeSource.push('Partie "' + dernPartie + '".' + (element.startsWith('\n') ? "" : "\n") + element);
          dernEstPartie = false;
        }
      }
    });
  }

  /** Découper le code source en chapitres */
  private decouperEnSections(typeSection: 'partie' | 'chapitre' | 'scène') {
    this.viderCodeSource();

    // découper pour avoir les intitulés des parties de code et leur contenu (1 sur 2)

    let regexpSplitSections: RegExp = null;
    let regexpMatchSections: RegExp = null;
    let regexpReplaceSections: RegExp = null;

    switch (typeSection) {
      case 'partie':
        regexpSplitSections = /^(?: *)(Chapitre(?: +)"(?:.+?)"(?: *))(?:\.?)( *)$/mi;
        regexpMatchSections = /^( *)partie( .+)/i;
        regexpReplaceSections = /(?:^partie( ?))|\"/gi;
        break;

      case 'chapitre':
        regexpSplitSections = /^(?: *)(chapitre(?: +)"(?:.+?)"(?: *))(?:\.?)( *)$/mi;
        regexpMatchSections = /^( *)chapitre( .+)/i;
        regexpReplaceSections = /(?:^chapitre( ?))|\"/gi;
        break;

      case 'scène':
        regexpSplitSections = /^(?: *)(chapitre(?: +)"(?:.+?)"(?: *))(?:\.?)( *)$/mi;
        regexpMatchSections = /^( *)chapitre( .+)/i;
        regexpReplaceSections = /(?:^chapitre( ?))|\"/gi;
        break;

      default:
        break;
    }

    const decoupageEnSections = this.codeSource.split(regexpSplitSections);
    let dernEstSection = false;
    let dernSection: string;

    let allSectionsCodeSource: string[] = [];
    let allSectionsIntitule: string[] = [];

    // parcourir les parties de code et leur intitulé
    decoupageEnSections.forEach(element => {
      if (element) {
        if (element.match(regexpMatchSections)) {
          // si c’était déjà une partie juste avant (càd sans code source), ajouter du code source à la partie
          if (dernEstSection) {
            // ajouter le code source de la partie précédé de l’instruction « partie »
            allSectionsCodeSource.push('Partie "' + dernSection + '".' + (element.startsWith('\n') ? "" : "\n") + element);
          }
          // ajouter le titre de la nouvelle partie
          dernSection = element.replace(regexpReplaceSections, "");
          allSectionsIntitule.push(dernSection);
          dernEstSection = true;
        } else {
          // si pas précédé d’une partie, ajouter un intitulé pour la partie
          if (!dernEstSection) {
            dernSection = "(sans nom)";
            allSectionsIntitule.push(dernSection);
          }
          // ajouter le code source de la partie précédé de l’instruction « partie »
          allSectionsCodeSource.push('Partie "' + dernSection + '".' + (element.startsWith('\n') ? "" : "\n") + element);
          dernEstSection = false;
        }
      }
    });

    switch (typeSection) {
      case 'partie':
        this.allPartiesCodeSource = allSectionsCodeSource;
        this.allPartiesIntitule = allSectionsIntitule;
        break;

      case 'chapitre':
        this.allChapitresCodeSource = allSectionsCodeSource;
        this.allChapitresIntitule = allSectionsIntitule;
        break;

      case 'scène':
        this.allScenesCodeSource = allSectionsCodeSource;
        this.allScenesIntitule = allSectionsIntitule;
        break;

      default:
        break;
    }

  }

  sauvegarderSession() {
    this.rassemblerSource();
    sessionStorage.setItem('CodeSource', this.codeSource);
  }

  onSauvegarderSous() {
    this.rassemblerSource();
    // Note: Ie and Edge don't support the new File constructor,
    // so it's better to construct blobs and use saveAs(blob, filename)
    const file = new File([this.codeSource], "donjon.djn", { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(file);
  }

  showTab(tab: string) {
    switch (tab) {
      case 'editeur':
        this.editeurTabs.tabs[0].active = true;
        break;
      case 'compilation':
        this.editeurTabs.tabs[1].active = true;
        break;
      case 'jouer':
        this.editeurTabs.tabs[2].active = true;
        break;
      case 'apercu':
        this.editeurTabs.tabs[3].active = true;
        break;
      default:
        break;
    }
  }

  onCompiler() {
    this.compilationEnCours = true;
    this.compilationTerminee = false;

    setTimeout(() => {
      this.showTab('compilation');
    }, 100);

    this.sauvegarderSession();

    if (this.codeSource && this.codeSource.trim() != '') {

      // interpréter le code
      let resultat = Compilateur.parseCode(this.codeSource, false);
      this.monde = resultat.monde;
      this.regles = resultat.regles;
      this.actions = resultat.actions.sort((a, b) => (
        (a.infinitif === b.infinitif ? (a.ceci === b.ceci ? (a.cela === b.cela ? 0 : (a.cela ? 1 : -1)) : (a.ceci ? 1 : -1)) : (a.infinitif > b.infinitif ? 1 : -1))
      ));
      this.erreurs = resultat.erreurs;
      // générer le jeu
      this.jeu = Generateur.genererJeu(this.monde, this.regles, this.actions);
    } else {
      this.monde = null;
      this.regles = null;
      this.actions = null;
      this.erreurs = [];
    }
    this.compilationEnCours = false;
    this.compilationTerminee = true;

  }



}
