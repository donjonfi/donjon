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

import * as FileSaver from 'file-saver-es';

import { Action, Aide, CompilateurV8, EMessageAnalyse, ElementGenerique, FichierEnregistrement, Generateur, Jeu, LecteurComponent, MessageAnalyse, Monde, Regle, RoutineSimple, Sauvegarde, StringUtils, versionNum } from 'donjon';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { AceConfigInterface } from 'ngx-ace-wrapper';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { lastValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { STANDALONE_MODE } from '../../environments/environment';
import { ACTIONS_DJN, NOUVEAU_DJN } from '../standalone/modeles-standalone';
import { JOUER_ONE_HTML } from '../standalone/jouer-one-template';
import { ErreurInclure, LineMapEntry, resoudreInclures, traduireLigne } from './inclure-resolveur';

@Component({
  selector: 'app-editeur',
  templateUrl: './editeur.component.html',
  styleUrls: ['./editeur.component.scss'],
  standalone: false
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

  tab: 'scenario' | 'analyse' | 'jeu' | 'apercu' | 'visualisation' | 'carte' | 'actions' = 'scenario';

  /** Sous-onglet actif sous l'onglet « visualisation » (carte / visualisation / aperçu). */
  visualisationTab: 'carte' | 'visualisation' | 'apercu' = 'carte';

  nbLignesCode = 30;
  tailleTexte = 18;

  /** Afficher les préférences ou non */
  afficherPreferences = false;

  /** Afficher convertisseur V1 => V2 ou non */
  afficherConvertisseur = false;

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

  solutionChargee: Sauvegarde | undefined;

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
  routinesSimples: RoutineSimple[] = null;
  actions: Action[] = null;
  compteurs: ElementGenerique[] = null;
  listes: ElementGenerique[] = null;
  aides: Aide[] = null;
  erreurs: string[] = null;
  messages: MessageAnalyse[] = null;
  jeu: Jeu = null;

  /** Fichiers .djn supplémentaires utilisés pour résoudre les `inclure "X.djn"`. */
  fichiersIncluables = new Map<string, string>();
  /** Mapping ligne du blob compilé → ligne d'origine + fichier (rempli si inclure utilisé). */
  lineMapInclure: LineMapEntry[] = [];
  /** Erreurs de résolution `inclure` (cycles, fichiers manquants…). */
  erreursInclure: ErreurInclure[] = [];

  /** Code source complet. */
  codeSource = "";

  chargementFichierEnCours = false;
  /** Fichier d'exemple par défaut. */
  nomExemple = "coince";

  /** L’application est-elle incluse dans Electron ou dans un navigateur classique ? */
  electronActif = false;

  @ViewChild('editeurTabs', { static: false }) editeurTabs: TabsetComponent;
  focusOutEnCours = false;
  compilationEnCours = false;
  compilationTerminee = false;

  /** Empreinte du code source de la dernière compilation — pour détecter qu'on a un nouveau scénario. */
  private _lastCompiledCodeSource: string | null = null;
  /** Enregistrement .rec à charger automatiquement dès que la compilation produit un jeu. */
  private _pendingEnregistrement: FichierEnregistrement | null = null;

  private problemeChargementFichierActions: boolean | undefined;
  chargementActionsEnCours = false;

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
  onCompiler(restauration: Sauvegarde | undefined): void {

    this.compilationEnCours = true;
    this.compilationTerminee = false;

    let verbeux = this.compilateurVerbeux;

    this.showTab('analyse');
    // sauver le code source courant
    this.sauvegarderSession();

    if (this.codeSource && this.codeSource.trim() !== '') {

      // corriger automatiquement les « sinon si » en « sinonsi »
      if (this.corrigerSinonSi) {
        this.codeSource = this.codeSource.replace(/sinon si/ig, 'sinonsi');
      }

      // remplacer les ";" en fin de ligne par des "."
      // ajouter un point lorsque la ligne se termine par "
      if (this.corrigerPoint) {
        this.codeSource = this.codeSource.replace(/(;)$/gm, '.');
        this.codeSource = this.codeSource.replace(/(")$/gm, '".');
      }

      // // tester les erreurs
      // this.codeEditorElmRef["directiveRef"].ace().getSession().setAnnotations([{
      //   row: 1,
      //   column: 0,
      //   text: "Error Message",
      //   type: "warning" //This would give a red x on the gutter
      // }]);

      this.codeEditorElmRef["directiveRef"].ace().resize();


      // vérifier si on a déjà le fichier actions.djn
      this.chargerActions(false).then(actions => {

        // résoudre les `inclure "X.djn"` si des fichiers inclus sont chargés
        let codeAcompiler = this.codeSource;
        this.lineMapInclure = [];
        this.erreursInclure = [];
        if (this.fichiersIncluables.size > 0) {
          const resolution = resoudreInclures(this.codeSource, this.fichiersIncluables);
          codeAcompiler = resolution.contenu;
          this.lineMapInclure = resolution.lineMap;
          this.erreursInclure = resolution.erreurs;
        }

        // interpréter le code
        const resultatCompilation = CompilateurV8.analyserScenarioEtActions(codeAcompiler, actions, verbeux)
        this.monde = resultatCompilation.monde;
        this.regles = resultatCompilation.regles;
        this.routinesSimples = resultatCompilation.routinesSimples;
        this.compteurs = resultatCompilation.compteurs;
        this.listes = resultatCompilation.listes;
        this.actions = resultatCompilation.actions.sort((a: Action, b: Action) => (
          (a.infinitif === b.infinitif ? (a.ceci === b.ceci ? (a.cela === b.cela ? 0 : (a.cela ? 1 : -1)) : (a.ceci ? 1 : -1)) : (a.infinitif > b.infinitif ? 1 : -1))
        ));
        this.aides = resultatCompilation.aides;
        this.erreurs = resultatCompilation.erreurs;
        // ajouter les erreurs de résolution `inclure` aux erreurs affichées
        if (this.erreursInclure.length > 0) {
          for (const e of this.erreursInclure) {
            this.erreurs.push(`[inclure] ${e.fichierSource}:${e.ligne} — ${e.message}`);
          }
        }
        this.messages = resultatCompilation.messages;
        // générer le jeu
        const jeuGenere = Generateur.genererJeu(resultatCompilation);
        // fonctionnalité annuler (priorité 1)
        if (restauration) {
          jeuGenere.sauvegarde = restauration;
          // fonctionnalité triche (priorité 2)
        } else if (this.solutionChargee) {
          jeuGenere.sauvegarde = this.solutionChargee;
        }
        this.jeu = jeuGenere;
        this._lastCompiledCodeSource = this.codeSource;

        this.compilationEnCours = false;
        this.compilationTerminee = true;

        // si aucune erreur, passer au mode jouer
        if (this.erreurs.length == 0 && this.messages.length == 0) {
          this.showTab('jeu');
        }

        // Reprise éventuelle d'un enregistrement (.rec) posé en attente lorsque le scénario n'était pas encore compilé.
        if (this._pendingEnregistrement && this.jeu) {
          const fichierEnregistrement = this._pendingEnregistrement;
          this._pendingEnregistrement = null;
          this.showTab('jeu');
          setTimeout(() => ((this.lecteurRef as any) as LecteurComponent).setEnregistrement(fichierEnregistrement), 0);
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
      // Pas de scénario à compiler → un enregistrement en attente n'a aucune chance d'être joué.
      if (this._pendingEnregistrement) {
        console.warn("L'enregistrement en attente est ignoré : il n'y a pas de scénario à compiler.");
        this._pendingEnregistrement = null;
      }
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
  onNouvellePartieOuAnnulerTour(solution: Sauvegarde | undefined) {
    this.onCompiler(solution);
  }

  // =============================================
  //  SAUVEGARDE SCÉNARIO (code source)
  // =============================================

  /** Sauvgarder le code source dans le navigateur de l’utilisateur. */
  sauvegarderSession(): void {
    sessionStorage.setItem('CodeSource', this.codeSource);
  }

  onSauvegarderSous(): void {
    if (this.electronActif) {
      this.doSauvegarderSousElectron();
    } else {
      this.doSauvegarderSousWeb();
    }
  }

  /** Télécharger un HTML autonome contenant donjon-jouer + le scénario courant. */
  onTelechargerJeu(): void {
    const scenarioBase64 = btoa(unescape(encodeURIComponent(this.codeSource)));
    const actions = sessionStorage.getItem('actions') ?? '';
    const actionsBase64 = btoa(unescape(encodeURIComponent(actions)));
    const injection = `<script>window.__djnScenario__=decodeURIComponent(escape(atob('${scenarioBase64}')));window.__djnActions__=decodeURIComponent(escape(atob('${actionsBase64}')));<\/script>`;
    const html = JOUER_ONE_HTML.replace('</body>', injection + '\n</body>');
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const titre = this.jeu?.titre ? StringUtils.normaliserMot(this.jeu.titre) : 'mon-jeu';
    FileSaver.saveAs(blob, titre + '.html');
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
    if (STANDALONE_MODE) {
      this.initCodeSource(NOUVEAU_DJN);
      this.chargementFichierEnCours = false;
      return;
    }
    let nomFichierExemple: string;
    if (nouveau) {
      nomFichierExemple = "nouveau.djn";
    } else {
      nomFichierExemple = StringUtils.nomDeFichierSecuriseExtensionForcee(this.nomExemple, "djn");
    }
    if (nomFichierExemple) {
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
        this.sauvegarderSession();
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

        console.warn("chargement du fichier", file.name);

        // A. CHARGEMENT SCÉNARIO
        if (file.name.endsWith(".djn") || file.name.endsWith(".txt")) {
          this.chargementFichierEnCours = true;
          const fileReader = new FileReader();
          // quand lu, l’attribuer au code source
          fileReader.onloadend = (progressEvent) => {
            this.initCodeSource(fileReader.result as string);
          };
          // lire le fichier
          fileReader.readAsText(file);

          // B. CHARGEMENT FICHIER SOLUTION (il s’agit d’un fichier sauvegarde sans le scénario)
        } else if (file.name.endsWith(".sol")) {
          const fileReader = new FileReader();
          // quand lu, définir les auto commandes
          fileReader.onloadend = (progressEvent) => {

            const contenuFichier = fileReader.result as string;

            // A. sauvegarde => scénario + commandes + graine
            if (contenuFichier.match(/^\s*{\s*"type"\s*:\s*"sauvegarde"/)) {
              var sauvegarde = JSON.parse(contenuFichier) as Sauvegarde;
              // informer si sauvegarde faite avec version plus récente de Donjon FI.
              if (sauvegarde.version > versionNum) {
                this.jeu.tamponErreurs.push("Cette solution a été effectuée avec une version plus récente de Donjon FI.");
              }
              if (this.jeu) {
                ((this.lecteurRef as any) as LecteurComponent).setSolution(sauvegarde);
              }
              this.solutionChargee = sauvegarde;
            } else {
              this.jeu.tamponErreurs.push("Ce fichier n’est pas une sauvegarde Donjon FI");
            }
          };

          // lire le fichier
          fileReader.readAsText(file);

          // C. CHARGEMENT ENREGISTREMENT (.rec) — sauvegarde + sorties attendues
        } else if (file.name.endsWith(".rec")) {
          const fileReader = new FileReader();
          fileReader.onloadend = () => {
            const contenuFichier = fileReader.result as string;
            if (!contenuFichier.match(/^\s*{\s*"type"\s*:\s*"enregistrement"/)) {
              this.jeu?.tamponErreurs?.push("Ce fichier n’est pas un enregistrement Donjon FI (.rec)");
              return;
            }
            const fichierEnregistrement = JSON.parse(contenuFichier) as FichierEnregistrement;
            if (fichierEnregistrement.version > versionNum) {
              this.jeu?.tamponErreurs?.push("Cet enregistrement a été créé avec une version plus récente de Donjon FI.");
            }

            // Compiler si jamais compilé OU si le code source a changé depuis la dernière compilation.
            // onCompiler est asynchrone : on dépose l'enregistrement en attente et la fin de onCompiler le consomme.
            const scenarioAJour = !!this.jeu && this._lastCompiledCodeSource === this.codeSource;
            if (!scenarioAJour) {
              this._pendingEnregistrement = fichierEnregistrement;
              this.onCompiler(undefined);
              return;
            }

            // Scénario déjà à jour : bascule directement sur l'onglet jeu et lance le magnéto.
            this.showTab('jeu');
            setTimeout(() => ((this.lecteurRef as any) as LecteurComponent).setEnregistrement(fichierEnregistrement), 0);
          };
          fileReader.readAsText(file);
        }

      }
    }
  }

  /** Charger un ou plusieurs fichiers `.djn` à utiliser comme cibles d'`inclure "X.djn"`. */
  onChargerFichiersInclus(et: EventTarget): void {
    const hie = et as HTMLInputElement;
    if (!hie?.files?.length) { return; }
    for (let i = 0; i < hie.files.length; i++) {
      const file = hie.files[i];
      if (!file.name.endsWith('.djn') && !file.name.endsWith('.txt')) { continue; }
      const fileReader = new FileReader();
      const nom = file.name;
      fileReader.onloadend = () => {
        this.fichiersIncluables.set(nom, fileReader.result as string);
      };
      fileReader.readAsText(file);
    }
  }

  /** Retirer un fichier inclus précédemment chargé. */
  onRetirerFichierInclus(nomFichier: string): void {
    this.fichiersIncluables.delete(nomFichier);
  }

  /** Vider la liste des fichiers inclus. */
  onEffacerFichiersInclus(): void {
    this.fichiersIncluables.clear();
  }

  /** Liste triée des noms de fichiers inclus chargés (utilisée par le template). */
  get fichiersInclusListe(): string[] {
    return Array.from(this.fichiersIncluables.keys()).sort();
  }

  /**
   * Traduit la ligne d'un message via le `lineMap` d'inclure.
   * Retourne `null` si aucun fichier inclus n'a été utilisé ou si le message
   * n'a pas d'entrée dans le map (ligne hors scope, ou message d'actions).
   */
  traduireMessage(message: MessageAnalyse): { nomFichier: string; ligneOrigine: number } | null {
    if (this.lineMapInclure.length === 0) { return null; }
    if (message.fichierAction) { return null; }
    return traduireLigne(this.lineMapInclure, message.numeroLigne);
  }

  /** `true` si l'origine du message est le scénario racine (visible dans ACE). */
  estLigneRacine(origine: { nomFichier: string }): boolean {
    return origine.nomFichier === 'scenario.djn';
  }

  /** Initialiser le code source */
  private initCodeSource(codeSource: string): void {
    // remplacer la balise @IFID@ par un nouvel identifiant unique
    codeSource = codeSource.replace('@IFID@', this.genererIFID());
    this.codeSource = codeSource;
    this.chargementFichierEnCours = false;

    // afficher onglet scénario
    this.tab = 'scenario';

    // refraichir ACE editor
    this.majTailleAce();
  }

  showTab(tab: 'scenario' | 'analyse' | 'jeu' | 'apercu' | 'visualisation' | 'carte' | 'actions' = 'scenario'): void {
    // Les anciens onglets `carte` et `apercu` sont des sous-onglets de `visualisation`.
    if (tab === 'carte' || tab === 'apercu') {
      this.visualisationTab = tab;
      tab = 'visualisation';
    }
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

  /** Charger un fichier personnalisé avec des actions de base plutôt que l’original. */
  onChargerFichierActionsLocal(et: EventTarget): void {
    const hie = et as HTMLInputElement;
    if (hie?.files?.length) {
      // fichier choisi par l’utilisateur
      const file = hie.files[0];
      if (file) {
        this.problemeChargementFichierActions = undefined;
        try {
          this.chargementActionsEnCours = true;
          console.warn("chargement de ", file.name);
          const fileReader = new FileReader();
          // quand lu, sauver son contenu
          fileReader.onloadend = (progressEvent) => {
            this.problemeChargementFichierActions = false;
            sessionStorage.setItem('actions', fileReader.result as string);
            sessionStorage.setItem('actionsPersonnalisees', '1');
          };
          // lire le fichier
          fileReader.readAsText(file);
        } catch {
          this.problemeChargementFichierActions = true;
          console.error("Fichier actions personnalisé pas trouvé. Actions de base pas importées.");
        } finally {
          this.chargementActionsEnCours = false;
        }
      }
    }
  }

  onRafraichirActions(): void {
    this.chargerActions(true);
  }

  /** Charger le fichier contenant les actions de base. */
  public async chargerActions(forcerMaj: boolean): Promise<string | null> {
    let sourceActions: string | null = sessionStorage.getItem("actions");
    if (!sourceActions || forcerMaj) {
      if (STANDALONE_MODE) {
        sourceActions = ACTIONS_DJN;
        sessionStorage.setItem('actions', sourceActions);
        sessionStorage.setItem('actionsPersonnalisees', '0');
        this.problemeChargementFichierActions = false;
        this.chargementActionsEnCours = false;
        return sourceActions;
      }
      this.problemeChargementFichierActions = undefined;
      try {
        this.chargementActionsEnCours = true;
        sourceActions = await lastValueFrom(this.http.get('assets/modeles/actions.djn', { responseType: 'text' }));
        sessionStorage.setItem('actions', sourceActions);
        sessionStorage.setItem('actionsPersonnalisees', '0');
        this.problemeChargementFichierActions = false;
      } catch (error) {
        this.problemeChargementFichierActions = true;
        console.error("Fichier « assets/modeles/actions.djn » pas trouvé. Actions de base pas importées.");
      } finally {
        this.chargementActionsEnCours = false;
      }
    }
    return sourceActions;
  }

  get statutActions(): string {
    let retVal: string;
    const actions = sessionStorage.getItem('actions');
    if (actions) {
      retVal = "✔️ fichier chargé en mémoire.";
    } else {
      retVal = "❌ fichier pas encore téléchargé.";
    }

    return retVal;
  }

  get versionActions(): string {
    let retVal: string;
    const actions = sessionStorage.getItem('actions');
    const actionsPersonnalisees = sessionStorage.getItem('actionsPersonnalisees');
    if (actions) {
      const resultat = actions.match(/-- Version: (\S+)/i);
      if (resultat) {
        retVal = resultat[1];
      } else {
        retVal = "Inconnue";
      }
      if (actionsPersonnalisees === '1') {
        retVal += " (fichier personnalisé)";
      } else {
        retVal += " (fichier original)";
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
    if (this.afficherConvertisseur) {
      // depuis l'écran V1→V2 : on ferme le convertisseur et on revient aux préférences
      this.afficherConvertisseur = false;
      this.afficherPreferences = true;
    } else {
      this.afficherPreferences = !this.afficherPreferences;
    }
    this.majTailleAce();
  }

  onChangerAfficherConvertisseur(): void {
    if (this.afficherConvertisseur) {
      // depuis l'écran V1→V2 : on ferme tout (convertisseur, préférences, et donc le bouton V1→V2)
      this.afficherConvertisseur = false;
      this.afficherPreferences = false;
    } else {
      this.afficherConvertisseur = true;
    }
    this.majTailleAce();
  }

  onConversionEtape1() {
    // règles
    this.codeSource = this.codeSource.replace(/^((?: |\t)*)((?:avant |après )(?:(?:(?:[^"])|(?:"[^"]*"))(?:\n)*)*?(?:\.$))/igm, '$1règle $2\n$1fin règle');
    // actions rapides
    this.codeSource = this.codeSource.replace(/^((?: |\t)*)(?:Le joueur peut )((?:(?:(?:[^"])|(?:"[^"]*"))(?:\n)*)*?(?:\.$))/igm, '$1action $2\n$1fin action');
    // points virgules
    this.codeSource = this.codeSource.replace(/(;)$/gm, '.');
  }

  onConversionEtape2() {
    // sa réaction concernant abc est …
    this.codeSource = this.codeSource.replace(/^((?: |\t)*)Sa réaction concernant (.+) est\s*"/igm, '$1  concernant $2:\n$1    dire "');
    this.codeSource = this.codeSource.replace(/^((?: |\t)*)Sa réaction concernant (.+) est *:(?:\n)*((?: |\t)*)"/igm, '$1  concernant $2:\n$1    dire "');
    this.codeSource = this.codeSource.replace(/^((?: |\t)*)Sa réaction concernant (.+) est *:/igm, '$1  concernant $2:');
    // sa réaction est …
    this.codeSource = this.codeSource.replace(/^((?: |\t)*)Sa réaction est\s*"/igm, '$1  basique:\n$1    dire "');
    this.codeSource = this.codeSource.replace(/^((?: |\t)*)Sa réaction est *:(?:\n)*((?: |\t)*)"/igm, '$1  basique:\n$1    dire "');
    this.codeSource = this.codeSource.replace(/^((?: |\t)*)Sa réaction est *:/igm, '$1  basique:');
  }

  /** Changer correction auto de « sinon si » en « sinonsi ». */
  onChangerCorrectionSinonSi(): void {
    localStorage.setItem('CorrigerSinonSi', (this.corrigerSinonSi ? '1' : '0'));
  }

  /** Changer correction des « ; » en « . » en fin de ligne. */
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
          this.codeEditorElmRef["directiveRef"].ace().setOption("showLineNumbers", this.afficherNumerosLigne);
          this.codeEditorElmRef["directiveRef"].ace().setOption("showGutter", this.afficherNumerosLigne);
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
    return `L’identifiant du jeu est "${uuid}".`;
  }

}
