import 'brace';
import 'brace/ext/searchbox';
import 'brace/mode/text';
import '../../mode-donjon.js';
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

import { Action, Aide, CompilateurV8, EMessageAnalyse, ElementGenerique, Generateur, Jeu, LecteurComponent, MessageAnalyse, Monde, Regle, StringUtils } from '@donjon/core';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { AceConfigInterface } from 'ngx-ace-wrapper';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { lastValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-editeur',
  templateUrl: './editeur.component.html',
  styleUrls: ['./editeur.component.scss']
})
export class EditeurComponent implements OnInit, OnDestroy {

  // @ViewChild('codeEditor', { static: true }) codeEditorElmRef: ElementRef;

  private codeEditorElmRef: ElementRef;
  @ViewChild('codeEditor', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.codeEditorElmRef = content;
    }
  }

  @ViewChild('lecteur', { static: true }) lecteurRef: ElementRef;

  EMessageAnalyse = EMessageAnalyse;

  tab: 'scenario' | 'analyse' | 'jeu' | 'apercu' | 'visualisation' | 'actions' = 'scenario';

  nbLignesCode = 30;
  tailleTexte = 18;

  /** Afficher les préférences ou non */
  afficherPreferences = false;
  /** Afficher les sections ou non */
  afficherSections = false;

  /** Faut-il automatiquement corriger « sinon si » en « sinonsi » ? */
  corrigerSinonSi = true;
  /** Faut-il essayer de corriger « . » et « ; » manquants ? */
  corrigerPoint = true;

  /** Faut-il afficher les numéros de ligne ? */
  afficherNumerosLigne = true;

  /** Faut-il désactiver la mise en forme dans l'éditeur de texte (pour lecteur d'écran) ? */
  sansMiseEnForme = false;

  /** Faut-il activer le mode verbeux du compilateur Donjon FI ? */
  compilateurVerbeux = false;

  public config: AceConfigInterface = {
    // mode: 'text',
    mode: 'donjon',
    minLines: 80,
    theme: 'monokai',
    readOnly: false,
    tabSize: 2,
    fontSize: this.tailleTexte,
    showGutter: true,
    showLineNumbers: this.afficherNumerosLigne,
    showPrintMargin: false,
    showFoldWidgets: false,
    hScrollBarAlwaysVisible: false,
    wrap: true,
    //copyWithEmptySelection: true

  };

  theme = "monokai";

  mode: "aucun" | "jeu" | "apercu" = "aucun";

  monde: Monde = null;
  regles: Regle[] = null;
  actions: Action[] = null;
  compteurs: ElementGenerique[] = null;
  listes: ElementGenerique[] = null;
  aides: Aide[] = null;
  erreurs: string[] = null;
  messages: MessageAnalyse[] = null;
  jeu: Jeu = null;

  selPartieIndex: number = null;
  actPartieIndex: number = null;
  selChapitreIndex: number = null;
  actChapitreIndex: number = null;
  selSceneIndex: number = null;
  actSceneIndex: number = null;
  sectionMode: "tout" | "partie" | "chapitre" | "scène" = null;

  /** Code source complet. */
  codeSource = "";
  /** Section visible du code source. */
  sectionCodeSourceVisible = "";
  // delaySectionCodeSourceVisible = null;
  nbToWaitSCSV = 0;
  partieSourceDejaChargee = false;

  /** Liste des intitulés des différentes parties du code source. */
  allPartiesIntitule: string[] = [];
  /** Liste des différentes parties du code source */
  allPartiesCodeSource: string[] = [];
  /*** Liste du 1er numéro de ligne pour chaque partie */
  allPartiesPremierNumeroLigne: number[] = [];

  /** Liste des intitulés des différents chapitres de la partie. */
  allChapitresIntitule: string[] = [];
  /** Liste des différents chapitres de la partie */
  allChapitresCodeSource: string[] = [];
  /*** Liste du 1er numéro de ligne pour chaque chapitre */
  allChapitresPremierNumeroLigne: number[] = [];

  /** Liste des intitulés des différentes scenes du chapitre. */
  allScenesIntitule: string[] = [];
  /** Liste des différentes scenes du chapitre */
  allScenesCodeSource: string[] = [];
  /*** Liste du 1er numéro de ligne pour chaque scène */
  allScenesPremierNumeroLigne: number[] = [];

  chargementFichierEnCours = false;
  /** Fichier d'exemple par défaut. */
  nomExemple = "coince";


  /** L’application est-elle incluse dans Electron ou dans un navigateur classique ? */
  electronActif = false;

  private problemeChargementFichierActions: boolean | undefined;

  @ViewChild('editeurTabs', { static: false }) editeurTabs: TabsetComponent;
  focusOutEnCours = false;
  compilationEnCours = false;
  compilationTerminee = false;
  chargementCommandesEnCours = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private location: Location,
  ) {

  }

  // =============================================
  // INITIALISATION DE L’ÉDITEUR
  // =============================================

  ngOnInit(): void {
    // https://www.npmjs.com/package/ngx-ace-wrapper
    // => this.codeEditorElmRef["directiveRef"] : directiveRef;
    // => this.codeEditorElmRef["directiveRef"].ace() : Returns the Ace instance reference for full API access.


    // VÉRIFIER SI ON UTILISE ELECTRON
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf(' electron/') > -1) {
      this.electronActif = true;
    } else {
      this.electronActif = false;
    }

    // RÉCUPÉRER LES PRÉFÉRENCES DE L’UTILISATEUR

    // - correction sinonSi
    let retVal = localStorage.getItem('CorrigerSinonSi');
    if (retVal) {
      if (retVal == '0') {
        this.corrigerSinonSi = false;
      } else {
        this.corrigerSinonSi = true;
      }
    }

    // - correction points
    retVal = localStorage.getItem('CorrigerPoint');
    if (retVal) {
      if (retVal == '0') {
        this.corrigerPoint = false;
      } else {
        this.corrigerPoint = true;
      }
    }

    // - active le mode verbeux du compilateur Donjon FI
    retVal = localStorage.getItem('CompilateurVerbeux');
    if (retVal) {
      if (retVal == '1') {
        this.compilateurVerbeux = true;
      } else {
        this.compilateurVerbeux = false;
      }
    }

    // - désactive la mise en forme (désactive ace) pour lecteur écran
    retVal = localStorage.getItem('SansMiseEnForme');
    if (retVal) {
      if (retVal == '1') {
        this.sansMiseEnForme = true;
      } else {
        this.sansMiseEnForme = false;
      }
    }

    // - taille texte
    retVal = localStorage.getItem('EditeurTailleTexte');
    if (retVal) {
      this.tailleTexte = +retVal;
    }
    // - thème
    retVal = localStorage.getItem('EditeurTheme');
    if (retVal) {
      this.theme = retVal;
    }
    // - numéros de ligne
    retVal = localStorage.getItem('AfficherNumerosLigne');
    if (retVal) {
      if (retVal == '1') {
        this.afficherNumerosLigne = true;
      } else {
        this.afficherNumerosLigne = false;
      }
    }
    this.majTailleAce();

    // =========================================
    // vérifier si un fichier est renseigné
    // =========================================
    const sub = this.route.params.subscribe(params => {
      const fichier = params['fichier'];
      // raccourci mode noir et blanc
      if (fichier && fichier == 'nb') {
        this.sansMiseEnForme = true;
        this.onChangerSansMiseEnForme();
      }
      // si on a renseigné un fichier
      if (fichier && fichier != 'nb') {
        this.nomExemple = fichier;
        this.onChargerFichierCloud();
        // =====================================
        // si on n'a pas renseigné de fichier
        // =====================================
      } else {
        // récupérer le code source de la session
        const codeSource = sessionStorage.getItem("CodeSource");
        if (codeSource) {
          this.initCodeSource(codeSource);
          // récupérer la sélection partie/chapitre/scène
          const selPartieIndexStr = sessionStorage.getItem("SelPartieIndex");
          this.selPartieIndex = selPartieIndexStr ? +selPartieIndexStr : null;
          if (this.selPartieIndex !== null) {
            console.log(">>> selPartieIndex=", this.selPartieIndex);
            this.onChangerSelPartie(false, true);
          }
          const selChapitreIndexStr = sessionStorage.getItem("SelChapitreIndex");
          this.selChapitreIndex = selChapitreIndexStr ? +selChapitreIndexStr : null;
          if (this.selChapitreIndex !== null) {
            console.log(">>> selChapitreIndex=", this.selChapitreIndex);
            this.onChangerSelChapitre(false, true);
          }
          const selSceneIndexStr = sessionStorage.getItem("SelSceneIndex");
          this.selSceneIndex = selSceneIndexStr ? +selSceneIndexStr : null;
          if (this.selSceneIndex !== null) {
            console.log(">>> this.selSceneIndex=", this.selSceneIndex);
            this.onChangerSelScene(false);
          }

        } else {
          this.onChargerFichierCloud(true);
        }
      }
    });
  }

  // =============================================
  // DESTRUCTION DE L’ÉDITEUR
  // =============================================

  ngOnDestroy(): void {
    this.sauvegarderSession();
  }

  // =============================================
  //  COMPILATION (ANALYSE)
  // =============================================

  /** Compiler (Analyser) le code source (scénario) */
  onCompiler(): void {

    this.compilationEnCours = true;
    this.compilationTerminee = false;

    let verbeux = this.compilateurVerbeux;

    this.showTab('analyse');
    // sauver le code et mettre à jour les sections
    this.onMajSections();

    if (this.codeSource && this.codeSource.trim() !== '') {

      // corriger automatiquement les « sinon si » en « sinonsi »
      if (this.corrigerSinonSi) {
        this.codeSource = this.codeSource.replace(/sinon si/ig, 'sinonsi');
        if (this.sectionMode == 'tout') {
          this.sectionCodeSourceVisible = this.codeSource;
        } else {
          this.sectionCodeSourceVisible = this.sectionCodeSourceVisible.replace(/sinon si/ig, 'sinonsi');
        }
      }

      // essayer de corriger les « . » et « ; » manquants
      if (this.corrigerPoint) {
        // TODO: essayer de corriger les points manqants.
      }

      // // tester les erreurs
      // this.codeEditorElmRef["directiveRef"].ace().getSession().setAnnotations([{
      //   row: 1,
      //   column: 0,
      //   text: "Error Message",
      //   type: "warning" //This would give a red x on the gutter
      // }]);

      this.codeEditorElmRef["directiveRef"].ace().resize();


      // vérifier si on a déjà le fichier commandes
      const sourceCommandes = this.chargerCommandes(false).then(commandes => {

        // interpréter le code
        const resComp = CompilateurV8.analyserScenarioEtActions(this.codeSource, commandes, verbeux)
        this.monde = resComp.monde;
        this.regles = resComp.regles;
        this.compteurs = resComp.compteurs;
        this.listes = resComp.listes;
        this.actions = resComp.actions.sort((a: Action, b: Action) => (
          (a.infinitif === b.infinitif ? (a.ceci === b.ceci ? (a.cela === b.cela ? 0 : (a.cela ? 1 : -1)) : (a.ceci ? 1 : -1)) : (a.infinitif > b.infinitif ? 1 : -1))
        ));
        this.aides = resComp.aides;
        this.erreurs = resComp.erreurs;
        this.messages = resComp.messages;
        // générer le jeu
        this.jeu = Generateur.genererJeu(resComp);

        this.compilationEnCours = false;
        this.compilationTerminee = true;

        // si aucune erreur, passer au mode jouer
        if (this.erreurs.length == 0 && this.messages.length == 0) {
          this.showTab('jeu');
        }


      });


    } else {
      this.monde = null;
      this.regles = null;
      this.actions = null;
      this.aides = null;
      this.compteurs = null;
      this.listes = null;
      this.erreurs = [];
      this.compilationEnCours = false;
      this.compilationTerminee = true;
    }
  }

  referenceCode(ligne: number) {
    this.showTab('scenario');
    this.codeEditorElmRef["directiveRef"].ace().scrollToLine(ligne, true, true, function () { });
    this.codeEditorElmRef["directiveRef"].ace().gotoLine(ligne, 0, true);
    this.codeEditorElmRef["directiveRef"].ace().focus();
  }

  /**
   * Générer une nouvelle partie à partir du même scénario que précédemment.
   */
  onNouvellePartie() {
    this.onCompiler();
  }

  // =============================================
  //  SAUVEGARDE SCÉNARIO (code source)
  // =============================================

  /** Sauvgarder le code source dans le navigateur de l’utilisateur. */
  sauvegarderSession(): void {
    this.rassemblerSource();
    sessionStorage.setItem('CodeSource', this.codeSource);
    sessionStorage.setItem('SelPartieIndex', this.selPartieIndex?.toString() ?? "");
    sessionStorage.setItem('SelChapitreIndex', this.selChapitreIndex?.toString() ?? "");
    sessionStorage.setItem('SelSceneIndex', this.selSceneIndex?.toString() ?? "");
  }

  onSauvegarderSous(): void {
    if (this.electronActif) {
      this.doSauvegarderSousElectron();
    } else {
      this.doSauvegarderSousWeb();
    }
  }

  /** Sauvegarder le code dans un fichier sur l’ordinateur de l’utilisateur (Navigateur). */
  private doSauvegarderSousWeb(): void {

    // sauver le code dans le cache
    this.sauvegarderSession();

    // sauver le code dans un fichier de l'utilisateur

    // Note: Ie and Edge don't support the new File constructor,
    // so it's better to construct blobs and use saveAs(blob, filename)
    const file = new File([this.codeSource], "donjon.djn", { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(file);
  }

  /** Sauvegarder le code dans un fichier sur l’ordinateur de l’utilisateur (Electron). */
  private doSauvegarderSousElectron(): void {

    // sauvegarde Electron fonctionne pas encore pour le moment on
    // garde la sauvegarde web.
    this.doSauvegarderSousWeb();

    // // sauver le code dans le cache
    // this.sauvegarderSession();

    // // sauver le code dans un fichier de l'utilisateur

    // var dialog = remote.dialog;

    // var browserWindow = remote.getCurrentWindow();
    // var options = {
    //     title: "Save new file as...",
    //     // defaultPath : "/path/to/new_file.jsx",
    //     filters: [
    //         {name: 'Donjon FI', extensions: ['djn']}
    //     ]
    // }

    // let saveDialog = dialog.showSaveDialog(browserWindow, options);
    // saveDialog.then(function(saveTo) {
    //     console.log(saveTo.filePath);
    // })

  }

  // =============================================
  //  CHARGER SCÉNARIO (code source)
  // =============================================

  onChargerFichierCloud(nouveau: boolean = false): void {
    let nomFichierExemple: string;
    if (nouveau) {
      nomFichierExemple = "exemple.djn";
    } else {
      nomFichierExemple = StringUtils.nomDeFichierSecuriseExtensionForcee(this.nomExemple, "djn");
    }
    if (nomFichierExemple) {
      this.viderSectionsCodeSource("partie");
      this.sectionCodeSourceVisible = "";
      this.chargementFichierEnCours = true;
      this.http.get('assets/modeles/' + nomFichierExemple, { responseType: 'text' })
        .subscribe({
          next: (texte) => {
            // changer l’url pour ne plus inclure le nom du fichier
            this.location.replaceState("/");
            // charger le code source
            this.initCodeSource(texte);
          },
          error: (erreur) => {
            console.error("Fichier modèle pas trouvé:", erreur);
          }
        });
    }
  }

  onCodeFocusOut() {
    setTimeout(() => {
      if (!this.compilationEnCours) {
        this.focusOutEnCours = true;
        this.onMajSections();
        this.focusOutEnCours = false;
      }
    }, 10);
  }

  onChargerFichierLocal(et: EventTarget): void {

    const hie = et as HTMLInputElement;

    if (hie?.files?.length) {
      // fichier choisi par l’utilisateur
      const file = hie.files[0];
      if (file) {

        console.warn("chargement de ", file.name);

        // A. CHARGEMENT SCÉNARIO
        if (file.name.endsWith(".djn") || file.name.endsWith(".txt")) {
          this.viderSectionsCodeSource("partie");
          this.sectionCodeSourceVisible = "";
          this.chargementFichierEnCours = true;
          const fileReader = new FileReader();
          // quand lu, l’attribuer au code source
          fileReader.onloadend = (progressEvent) => {
            this.initCodeSource(fileReader.result as string);
          };
          // lire le fichier
          fileReader.readAsText(file);

          // B. CHARGEMENT FICHIER SOLUTION
        } else if (file.name.endsWith(".sol")) {
          const fileReader = new FileReader();
          // quand lu, définir les auto commandes
          fileReader.onloadend = (progressEvent) => {
            ((this.lecteurRef as any) as LecteurComponent).setAutoCommandes(fileReader.result as string);
          };
          // lire le fichier
          fileReader.readAsText(file);
        }

      }
    }
  }

  /** Initialiser le code source */
  private initCodeSource(codeSource: string): void {
    // remplacer la balise @IFID@ par un nouvel identifiant unique
    codeSource = codeSource.replace('@IFID@', this.genererIFID());
    this.codeSource = codeSource;
    this.sectionCodeSourceVisible = codeSource;
    this.sectionMode = "tout";
    this.onMajSections();
    this.chargementFichierEnCours = false;
    this.onChangerSelPartie(false, true);

    // afficher onglet scénario
    this.tab = 'scenario';

    // refraichir ACE editor
    this.majTailleAce();
  }

  // =============================================
  //  GESTION DES SECTIONS
  // =============================================

  /** Mettre à jour les listes de sections (parties, chapitres, scènes) */
  onMajSections() {

    // console.log("onMajSections IN >>> ", "\nactPartieIndex=", this.actPartieIndex, "actChapitreIndex=", this.actChapitreIndex, "actSceneIndex=", this.actSceneIndex);

    // sauver partie en cours et rassembler les sections
    this.sauvegarderSession();

    const backPartie = this.actPartieIndex;
    const backChapitre = this.actChapitreIndex;
    const backScene = this.actSceneIndex;

    let premiereLigne = 1;

    // A) DÉCOUPE EN PARTIES
    this.decouperEnSections(this.codeSource, "partie", premiereLigne);
    // choisir la partie précédemment sélectionnée (peut être null)
    this.selPartieIndex = backPartie;
    this.onChangerSelPartie(false, false);

    // B) DÉCOUPE EN CHAPITRES
    // si on a pu récupérer la partie précédente ou s’il n’y a pas de partie
    if (this.actPartieIndex !== null || !this.allPartiesIntitule?.length) {

      // définir premier numéro de ligne
      // -- partie sélectionnée => 1ère ligne de la partie sélectionnée
      if (this.actPartieIndex !== null) {
        premiereLigne = this.allPartiesPremierNumeroLigne[this.actPartieIndex]
        // -- aucune partie => 1
      } else {
        premiereLigne = 1;
      }

      // afficher les chapitres
      this.decouperEnSections(this.sectionCodeSourceVisible, "chapitre", premiereLigne);
      // choisir le chapitre précédent
      this.selChapitreIndex = backChapitre;
      if (this.selChapitreIndex !== null) {
        this.onChangerSelChapitre(false, false);
      }
      // C) DÉCOUPE EN SCÈNES
      // si on a pu récupérer le chapitre précédent ou s’il n’y a pas de chapitre
      if (this.actChapitreIndex !== null || !this.allChapitresIntitule?.length) {

        // définir premier numéro de ligne
        // -- chapitre sélectionné => 1ère ligne du chapitre sélectionné
        if (this.actChapitreIndex !== null) {
          premiereLigne = this.allChapitresPremierNumeroLigne[this.actChapitreIndex]
          // -- pas de chapitre sélectinné mais partie sélectionnée => 1ère ligne de la partie sélectionnée
        } else if (this.actPartieIndex !== null) {
          premiereLigne = this.allPartiesPremierNumeroLigne[this.actPartieIndex]
          // -- ni chaptire ni partie sélectionné => 1
        } else {
          premiereLigne = 1;
        }

        // afficher les scènes
        this.decouperEnSections(this.sectionCodeSourceVisible, "scène", premiereLigne);
        // choisir scène précédente
        this.selSceneIndex = backScene;
        if (this.selSceneIndex !== null) {
          this.onChangerSelScene(false);
        }
      }
    }

    // console.log("onMajSections OUT>>> ", "\nactPartieIndex=", this.actPartieIndex, "actChapitreIndex=", this.actChapitreIndex, "actSceneIndex=", this.actSceneIndex);


  }

  /** Vider le code source. */
  private viderSectionsCodeSource(typeSection: 'partie' | 'chapitre' | 'scène'): void {

    // vider scènes
    this.allScenesIntitule = null;
    this.allScenesCodeSource = null;
    this.actSceneIndex = null;
    this.selSceneIndex = null;

    if (typeSection === "partie" || typeSection === "chapitre") {
      // vider chapitres
      this.allChapitresIntitule = null;
      this.allChapitresCodeSource = null;
      this.actChapitreIndex = null;
      this.selChapitreIndex = null;

      if (typeSection === "partie") {
        // vider parties
        this.allPartiesIntitule = null;
        this.allPartiesCodeSource = null;
        this.actPartieIndex = null;
        this.selPartieIndex = null;
      }
    }
  }

  /** Sélection de la partie à afficher à changée */
  onChangerSelPartie(rassemblerAvant = true, decouperPlusBas = true): void {
    // ne rien faire si un chargement de fichier est en cours
    if (!this.chargementFichierEnCours) {
      // sauvegarder la section visible actuellement pour ne rien perdre
      if (rassemblerAvant) {
        this.rassemblerSource();
      }

      // supprimer le découpage en chapitres
      this.viderSectionsCodeSource("chapitre");

      // TOUTES LES PARTIES
      if (this.selPartieIndex === null || this.selPartieIndex >= this.allPartiesCodeSource.length) {
        this.sectionMode = "tout";
        this.sectionCodeSourceVisible = this.codeSource;
        this.actPartieIndex = null;
        // si aucune partie trouvée, essayer de découper en chapitres
        if (!this.allPartiesIntitule?.length) {
          if (decouperPlusBas) {
            this.decouperEnSections(this.sectionCodeSourceVisible, "chapitre", 1);
            // si aucun chapitre trouvé, essyaer de découper en scènes
            if (!this.allChapitresIntitule?.length) {
              this.decouperEnSections(this.sectionCodeSourceVisible, "scène", 1);
            }
          }
        }
        this.setPremierNumeroLigne(1);
        // PARTIE SPÉCIFIQUE
      } else {
        this.sectionMode = "partie";
        this.sectionCodeSourceVisible = this.allPartiesCodeSource[this.selPartieIndex];
        this.actPartieIndex = this.selPartieIndex;
        if (decouperPlusBas) {
          // découper la partie visible actuellement en chapitres
          this.decouperEnSections(this.sectionCodeSourceVisible, "chapitre", this.allPartiesPremierNumeroLigne[this.actPartieIndex]);
          // si aucun chapitre trouvé, essyaer de découper en scènes
          if (!this.allChapitresIntitule?.length) {
            this.decouperEnSections(this.sectionCodeSourceVisible, "scène", this.allPartiesPremierNumeroLigne[this.actPartieIndex]);
          }
        }
        this.setPremierNumeroLigne(this.allPartiesPremierNumeroLigne[this.actPartieIndex]);
      }
    }
  }

  /** Sélection du chapitre à afficher a changée */
  onChangerSelChapitre(rassemblerAvant = true, decouperPlusBas = true): void {
    // ne rien faire si un chargement de fichier est en cours
    if (!this.chargementFichierEnCours) {

      // sauvegarder la section visible actuellement pour ne rien perdre
      if (rassemblerAvant) {
        this.rassemblerSource();
      }

      // supprimer le découpage en scènes
      this.viderSectionsCodeSource("scène");

      // TOUS LES CHAPITRES
      if (this.selChapitreIndex === null || this.selChapitreIndex >= this.allChapitresCodeSource.length) {
        // afficher la partie sélectionnée
        this.actChapitreIndex = null;
        this.onChangerSelPartie(false, true);
        // CHAPITRE SPÉCIFIQUE
      } else {
        // afficher le chapitre sélectionné
        this.sectionMode = "chapitre";
        this.sectionCodeSourceVisible = this.allChapitresCodeSource[this.selChapitreIndex];
        this.actChapitreIndex = this.selChapitreIndex;
        if (decouperPlusBas) {
          // découper le chapitre visible actuellement en scènes
          this.decouperEnSections(this.sectionCodeSourceVisible, "scène", this.allChapitresPremierNumeroLigne[this.actChapitreIndex]);
        }
        this.setPremierNumeroLigne(this.allChapitresPremierNumeroLigne[this.actChapitreIndex]);
      }
    }
  }

  /** Sélection de la scène à afficher a changée. */
  onChangerSelScene(rassemblerAvant = true): void {
    // ne rien faire si un chargement de fichier est en cours
    if (!this.chargementFichierEnCours) {

      // sauvegarder la section visible actuellement pour ne rien perdre
      if (rassemblerAvant) {
        this.rassemblerSource();
      }

      // si on veut afficher toutes les scènes
      if (this.selSceneIndex === null || this.selSceneIndex >= this.allScenesCodeSource.length) {
        // afficher le chapitre sélectionné
        this.actSceneIndex = null;
        this.onChangerSelChapitre(false, true);
        // si on veut afficher une scène en particulier
      } else {
        // afficher la scène sélectionnée
        this.sectionMode = "scène";
        this.sectionCodeSourceVisible = this.allScenesCodeSource[this.selSceneIndex];
        this.actSceneIndex = this.selSceneIndex;
        this.setPremierNumeroLigne(this.allScenesPremierNumeroLigne[this.actSceneIndex]);
      }
    }
  }

  /** Rassembler le code source pour ne rien perdre */
  rassemblerSource(): void {

    switch (this.sectionMode) {
      case "tout":
        this.codeSource = this.sectionCodeSourceVisible;
        break;

      case "partie":
        this.rassemblerLesParties(false);
        break;

      case "chapitre":
        this.rassemblerLesChapitres(false);
        break;

      case "scène":
        this.rassemblerLesScenes();
        break;

      default:
        break;
    }
    // console.warn("> rassemblerSource:", "\n>> allPartiesCodeSource", this.allPartiesCodeSource, "\n>> allChapitresCodeSource", this.allChapitresCodeSource, "\n>> allScenesCodeSource", this.allScenesCodeSource);


  }

  /** Rassembler les parties ensemble */
  private rassemblerLesParties(ignorerCodeVisible: boolean): void {
    // console.log(">>>>>>> rassembler Parties");

    if (!ignorerCodeVisible) {
      // si la section en cours d’édition contient ne termine pas par "\n\n", l’ajouter.
      if (!this.sectionCodeSourceVisible.endsWith('\n')) {
        this.sectionCodeSourceVisible += "\n";
        if (!this.sectionCodeSourceVisible.endsWith('\n\n')) {
          this.sectionCodeSourceVisible += "\n";
        }
      }
      // mettre à jour la PARTIE en cours d’édition dans la liste des parties
      this.allPartiesCodeSource[this.actPartieIndex] = this.sectionCodeSourceVisible;
    }

    // joindre les parties dans le code source
    this.codeSource = this.allPartiesCodeSource.join("");
  }

  /** Rassembler les chapitres ensemble */
  private rassemblerLesChapitres(ignorerCodeVisible: boolean): void {
    // console.log(">>>>>>> rassembler Chapitres");
    let chapitresRassembles: string = null;
    if (!ignorerCodeVisible) {
      // si la section en cours d’édition contient ne termine pas par "\n\n", l’ajouter.
      if (!this.sectionCodeSourceVisible.endsWith('\n')) {
        this.sectionCodeSourceVisible += "\n";
        if (!this.sectionCodeSourceVisible.endsWith('\n\n')) {
          this.sectionCodeSourceVisible += "\n";
        }
      }
      // mettre à jour le CHAPITRE en cours d’édition dans la liste des chapitres
      this.allChapitresCodeSource[this.actChapitreIndex] = this.sectionCodeSourceVisible;
      chapitresRassembles = this.allChapitresCodeSource.join("");
      this.sectionCodeSourceVisible = chapitresRassembles;
    } else {
      chapitresRassembles = this.allChapitresCodeSource.join("");
    }
    // s’il y a une partie sélectionnée
    if (this.actPartieIndex !== null) {
      // rassembler les chapitres dans la partie sélectionnée
      this.allPartiesCodeSource[this.actPartieIndex] = chapitresRassembles;
      // rassembler les parties
      this.rassemblerLesParties(true);
      // si aucune sélection parent
    } else {
      // ressembler les chapitres dans le code source
      this.codeSource = chapitresRassembles;
    }
  }

  /** Rassembler les scènes ensemble */
  private rassemblerLesScenes(): void {
    // console.log(">>>>>>> rassembler Scènes");

    // si la section en cours d’édition contient ne termine pas par "\n\n", l’ajouter.
    if (!this.sectionCodeSourceVisible.endsWith('\n')) {
      this.sectionCodeSourceVisible += "\n";
      if (!this.sectionCodeSourceVisible.endsWith('\n\n')) {
        this.sectionCodeSourceVisible += "\n";
      }
    }
    // mettre à jour la SCÈNE en cours d’édition dans la liste des scènes
    this.allScenesCodeSource[this.actSceneIndex] = this.sectionCodeSourceVisible;
    const scenesRassemblees = this.allScenesCodeSource.join("");
    this.sectionCodeSourceVisible = scenesRassemblees;
    // s’il y a un chapitre sélectionné
    if (this.actChapitreIndex !== null) {
      // rassembler les scènes dans le chapitre sélectionné
      this.allChapitresCodeSource[this.actChapitreIndex] = scenesRassemblees;
      // rassembler les chapitres
      this.rassemblerLesChapitres(true);
      // sinon s’il y a une partie sélectionnée
    } else if (this.actPartieIndex !== null) {
      // rassembler les scènes dans la partie sélectionnée
      this.allPartiesCodeSource[this.actPartieIndex] = scenesRassemblees;
      // rassembler les parties
      this.rassemblerLesParties(true);
      // si aucune sélection parent
    } else {
      // ressembler les scènes dans le code source
      this.codeSource = scenesRassemblees;
    }
  }

  /** Découper le code source en sections (parties, chapitres ou scènes) */
  private decouperEnSections(codeSource: string, typeSection: 'partie' | 'chapitre' | 'scène', premierNumeroLigne: number): void {
    this.viderSectionsCodeSource(typeSection);

    // découper pour avoir les intitulés des parties de code et leur contenu en alternance
    let regexpSplitSections: RegExp = null;
    let regexpMatchSections: RegExp = null;
    let regexpReplaceSections: RegExp = null;
    let prefixe: string = null;
    switch (typeSection) {
      case 'partie':
        regexpSplitSections = /^(?: *)(partie(?: +)"(?:.+?)"(?: *))(?:\.?)( *)$/mi;
        regexpMatchSections = /^( *)partie( .+)/i;
        regexpReplaceSections = /(?:^partie( ?))|\"/gi;
        prefixe = 'PARTIE "';
        break;

      case 'chapitre':
        regexpSplitSections = /^(?: *)(chapitre(?: +)"(?:.+?)"(?: *))(?:\.?)( *)$/mi;
        regexpMatchSections = /^( *)chapitre( .+)/i;
        regexpReplaceSections = /(?:^chapitre( ?))|\"/gi;
        prefixe = 'CHAPITRE "';
        break;

      case 'scène':
        regexpSplitSections = /^(?: *)(scène(?: +)"(?:.+?)"(?: *))(?:\.?)( *)$/mi;
        regexpMatchSections = /^( *)scène( .+)/i;
        regexpReplaceSections = /(?:^scène( ?))|\"/gi;
        prefixe = 'SCÈNE "';
        break;

      default:
        break;
    }

    const decoupageEnSections = codeSource.split(regexpSplitSections);
    let dernEstSection = false;
    let dernSection: string;
    let dernierNumeroLigne: number = premierNumeroLigne;
    let allSectionsCodeSource: string[] = [];
    let allSectionsIntitule: string[] = null;
    let allSectionsPremierNumeroLigne: number[] = [];

    // si on a trouvé au moins une section, remplir la liste des sections
    if (decoupageEnSections.length > 1) {
      allSectionsIntitule = [];
      // parcourir les parties de code et leur intitulé
      decoupageEnSections.forEach(element => {
        if (element) {
          if (element.match(regexpMatchSections)) {
            // si c’était déjà une définition de section juste avant (càd sans code source), ajouter du code source à la partie
            if (dernEstSection) {
              // ajouter le code source de la partie précédé de l’instruction « partie »
              allSectionsCodeSource.push(prefixe + dernSection + '".' + (element.startsWith('\n') ? "" : "\n") + element);
              // dernierNumeroLigne += 1; // +1 numéro de ligne pour le code ajouté (?)
            }
            // ajouter le titre de la nouvelle partie
            dernSection = element.replace(regexpReplaceSections, "");
            allSectionsIntitule.push(dernSection);
            dernEstSection = true;
            // dernierNumeroLigne += 1; // + 1 numéro de ligne pour le titre de la section
          } else {
            // si pas précédé d’une partie, ajouter un intitulé pour la partie
            if (!dernEstSection) {
              dernSection = "(sans nom)";
              allSectionsIntitule.push(dernSection);
              // ajouter le code source de la partie PAS précédé de l’instruction « partie »
              allSectionsCodeSource.push(element);
            } else {
              // ajouter le code source de la partie précédé de l’instruction « partie »
              allSectionsCodeSource.push(prefixe + dernSection + '".' + ((element.startsWith('\n') || element.startsWith('\r')) ? "" : "\n") + element);
            }

            allSectionsPremierNumeroLigne.push(dernierNumeroLigne);
            const nombreLignesSection = element.split(/\r\n|\r|\n/).length
            dernierNumeroLigne += nombreLignesSection - 1;

            dernEstSection = false;
          }
        }
      });
      // si on termine sur une déclaration de section, lui ajouter du code source pour qu’elle ne soit pas vide.
      if (dernEstSection) {
        allSectionsCodeSource.push(prefixe + dernSection + '".' + ("\n"));
      }
    } else {
      allSectionsCodeSource.push(decoupageEnSections[0]);
    }

    switch (typeSection) {
      case 'partie':
        this.allPartiesCodeSource = allSectionsCodeSource;
        this.allPartiesIntitule = allSectionsIntitule;
        this.allPartiesPremierNumeroLigne = allSectionsPremierNumeroLigne;
        break;

      case 'chapitre':
        this.allChapitresCodeSource = allSectionsCodeSource;
        this.allChapitresIntitule = allSectionsIntitule;
        this.allChapitresPremierNumeroLigne = allSectionsPremierNumeroLigne;
        break;

      case 'scène':
        this.allScenesCodeSource = allSectionsCodeSource;
        this.allScenesIntitule = allSectionsIntitule;
        this.allScenesPremierNumeroLigne = allSectionsPremierNumeroLigne;
        break;

      default:
        break;
    }

    // console.warn("> decouperEnSections (" + typeSection + "):", "\n>> allPartiesCodeSource", this.allPartiesCodeSource, "\n>> allChapitresCodeSource", this.allChapitresCodeSource, "\n>> allScenesCodeSource", this.allScenesCodeSource);


  }

  showTab(tab: 'scenario' | 'analyse' | 'jeu' | 'apercu' | 'visualisation' | 'actions' = 'scenario'): void {
    this.tab = tab;

    /** focus sur le champ commandes si on est sur le tab jeu */
    if (this.tab == 'jeu') {
      setTimeout(() => {
        ((this.lecteurRef as any) as LecteurComponent).focusCommande();
      }, 100);
    }
  }

  // =============================================
  //  GESTION DES ACTIONS
  // =============================================

  onRafraichirCommandes(): void {
    this.chargerCommandes(true);
  }

  public async chargerCommandes(forcerMaj: boolean): Promise<string | null> {

    let sourceActions: string | null = sessionStorage.getItem("actions");

    if (!sourceActions || forcerMaj) {
      this.problemeChargementFichierActions = undefined;
      try {
        this.chargementCommandesEnCours = true;
        sourceActions = await lastValueFrom(this.http.get('assets/modeles/actions.djn', { responseType: 'text' }));
        sessionStorage.setItem("commandes", sourceActions);
        this.problemeChargementFichierActions = false;
      } catch (error) {
        this.problemeChargementFichierActions = true;
        console.error("Fichier « assets/modeles/actions.djn » pas trouvé. Commandes de base pas importées.");
      } finally {
        this.chargementCommandesEnCours = false;
      }
    }

    return sourceActions;

  }

  get statutActions(): string {
    let retVal: string;
    const commandes = sessionStorage.getItem("commandes");
    if (commandes) {
      retVal = "✔️ fichier chargé en mémoire.";
    } else {
      retVal = "❌ fichier pas encore téléchargé.";
    }

    return retVal;
  }

  get versionActions(): string {
    let retVal: string;
    const commandes = sessionStorage.getItem("commandes");
    if (commandes) {
      const resultat = commandes.match(/-- Version: (\S+)/i);
      if (resultat) {
        retVal = resultat[1];
      } else {
        retVal = "Inconnue";
      }
    } else {
      retVal = "-"
    }

    return retVal;
  }

  get derniereTentativeFichierCommande(): string {
    let retVal: string;

    switch (this.problemeChargementFichierActions) {
      case undefined:
        retVal = "?";
        break;

      case true:
        retVal = "❌ échec";
        break;

      case false:
        retVal = "✔️ succès";
        break;
    }

    return retVal;
  }

  // =============================================
  //  GESTION DES PRÉFÉRENCES
  // =============================================

  onChangerAfficherPreferences(): void {
    this.afficherPreferences = !this.afficherPreferences;
    this.majTailleAce();
  }

  /** Changer correction auto de « sinon si » en « sinonsi ». */
  onChangerCorrectionSinonSi(): void {
    localStorage.setItem('CorrigerSinonSi', (this.corrigerSinonSi ? '1' : '0'));
  }

  /** Changer correction des « . » et « ; » manquants. */
  onChangerCorrectionPoint(): void {
    localStorage.setItem('CorrigerPoint', (this.corrigerPoint ? '1' : '0'));
  }

  onChangerAfficherNumerosLigne(): void {
    localStorage.setItem('AfficherNumerosLigne', (this.afficherNumerosLigne ? '1' : '0'));
    this.majTailleAce();
  }

  /** Désactiver la mise en forme de l'éditeur de scénario (pour lecteur d'écran) */
  onChangerSansMiseEnForme(): void {
    localStorage.setItem('SansMiseEnForme', (this.sansMiseEnForme ? '1' : '0'));
  }

  /** Activer le mode verbeux du compilateur Donjon FI (pour le débogage de Donjon FI) */
  onChangerCompilateurVerbeux(): void {
    localStorage.setItem('CompilateurVerbeux', (this.compilateurVerbeux ? '1' : '0'));
  }

  /** Changer le thème de mise en surbrillance du code source. */
  onChangerTheme(): void {
    localStorage.setItem('EditeurTheme', this.theme);
  }

  /** Changer la taille de la police de caractères. */
  onChangerTailleFont(): void {
    localStorage.setItem('EditeurTailleTexte', this.tailleTexte.toString());
    this.majTailleAce();
  }

  /** Changer la taille du composant affichant le code source. */
  majTailleAce(): void {
    if (!this.sansMiseEnForme) {
      setTimeout(() => {
        if (this.codeEditorElmRef) {
          this.codeEditorElmRef["directiveRef"].ace().resize();
          // this.codeEditorElmRef["directiveRef"].ace().setOption("maxLines", this.nbLignesCode);
          this.codeEditorElmRef["directiveRef"].ace().setOption("fontSize", this.tailleTexte);
          this.codeEditorElmRef["directiveRef"].ace().setOption("showLineNumbers", true); // this.afficherNumerosLigne);
          this.codeEditorElmRef["directiveRef"].ace().setOption("showGutter", true); // this.afficherNumerosLigne);
          this.codeEditorElmRef["directiveRef"].ace().setOption("showFoldWidgets", false);
          this.codeEditorElmRef["directiveRef"].ace().renderer.updateFull();
        }
      }, (this.codeEditorElmRef && this.codeEditorElmRef["directiveRef"]?.ace()) ? 10 : 200);
    }
  }

  /** changer le premier numéro de ligne de l’éditeur */
  setPremierNumeroLigne(debut: number): void {
    if (!this.sansMiseEnForme) {
      setTimeout(() => {
        if (this.codeEditorElmRef) {
          this.codeEditorElmRef["directiveRef"].ace().setOption("firstLineNumber", debut);
        }
      }, (this.codeEditorElmRef && this.codeEditorElmRef["directiveRef"]?.ace()) ? 0 : 200);
    }
  }


  // =============================================
  //  IFID
  // =============================================

  genererIFID(): string {
    let uuid = 'd0f1' + uuidv4().slice(4);
    return 'L’identifiant du jeu est "' + uuid + '".';
  }

}