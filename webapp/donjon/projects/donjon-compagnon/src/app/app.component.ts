import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import * as FileSaver from 'file-saver-es';

import { Action, ElementGenerique, EMessageAnalyse, FichierEnregistrement, Jeu, LecteurComponent, MessageAnalyse, Monde, Regle, ResultatCompilation, StringUtils, version as DONJON_VERSION, versionNum } from 'donjon';

import { CompilationService } from './services/compilation.service';
import { LineMapEntry, VsCodeBridgeService } from './services/vscode-bridge.service';
import { JOUER_ONE_HTML } from '../../../donjon-creer/src/app/standalone/jouer-one-template';

type CompagnonTab = 'analyse' | 'jeu' | 'visualisation' | 'wiki' | 'aide';
type VisualisationTab = 'carte' | 'visualisation' | 'apercu';

const WIKI_URL = 'https://donjon.fi/doc/v3/start';

/** Clé sessionStorage utilisée pour faire survivre un enregistrement (.rec) en attente à un reload du webview (RUN_GAME). */
const PENDING_REC_KEY = '__djnPendingRec__';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  public activeTab: CompagnonTab = 'analyse';
  public visualisationTab: VisualisationTab = 'carte';

  public scenarioBrut = '';
  public actionsBrut = '';
  public lineMap: LineMapEntry[] = [];

  public resultat: ResultatCompilation | null = null;
  public jeu: Jeu | null = null;
  public messages: MessageAnalyse[] = [];
  public erreur: string | null = null;

  public readonly wikiUrl: SafeResourceUrl;
  public wikiNavCount = 0;

  public readonly donjonVersion = DONJON_VERSION;
  public readonly extensionVersion = window.__djnExtensionVersion__ ?? '';

  @ViewChild('wikiFrame') private wikiFrame?: ElementRef<HTMLIFrameElement>;
  @ViewChild('lecteurRef') private lecteurRef?: LecteurComponent;

  private sub: Subscription | undefined;

  /** Empreinte du scénario/actions de la dernière compilation — pour détecter qu'on a chargé du neuf. */
  private lastCompiledScenario: string | null = null;
  private lastCompiledActions: string | null = null;

  constructor(
    private compilation: CompilationService,
    private bridge: VsCodeBridgeService,
    sanitizer: DomSanitizer,
  ) {
    this.wikiUrl = sanitizer.bypassSecurityTrustResourceUrl(WIKI_URL);
  }

  ngOnInit(): void {
    this.sub = this.compilation.state$.subscribe(state => {
      this.resultat = state.resultat;
      this.jeu = state.jeu;
      this.messages = state.messages;
      this.erreur = state.erreur;
    });

    const scenarioInjecte = window.__djnScenario__;
    const actionsInjectees = window.__djnActions__;
    this.lineMap = window.__djnLineMap__ ?? [];

    if (scenarioInjecte) {
      this.scenarioBrut = scenarioInjecte;
      this.actionsBrut = actionsInjectees ?? '';
      this.lancerCompilation();
    }

    this.bridge.postMessage({ type: 'READY' });

    // Reprise éventuelle d'un enregistrement posé en attente avant un refresh RUN_GAME du webview.
    const pendingRec = sessionStorage.getItem(PENDING_REC_KEY);
    if (pendingRec) {
      sessionStorage.removeItem(PENDING_REC_KEY);
      if (this.jeu) {
        try {
          const fichierEnregistrement = JSON.parse(pendingRec) as FichierEnregistrement;
          this.activeTab = 'jeu';
          setTimeout(() => this.lecteurRef?.setEnregistrement(fichierEnregistrement), 0);
        } catch (e) {
          console.warn("Reprise de l'enregistrement en attente impossible :", e);
        }
      } else {
        console.warn("L'enregistrement en attente est ignoré : la compilation a échoué.");
      }
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  setTab(tab: CompagnonTab): void {
    this.activeTab = tab;
  }

  /** Charge un enregistrement .rec et lance la vérification dans le lecteur intégré. */
  onChargerEnregistrement(et: EventTarget | null): void {
    const hie = et as HTMLInputElement;
    if (!hie?.files?.length) return;
    const file = hie.files[0];
    if (!file.name.endsWith('.rec')) return;
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      const contenuFichier = fileReader.result as string;
      if (!contenuFichier.match(/^\s*{\s*"type"\s*:\s*"enregistrement"/)) {
        console.warn("Le fichier n'est pas un enregistrement Donjon FI (.rec)");
        return;
      }
      const fichierEnregistrement = JSON.parse(contenuFichier) as FichierEnregistrement;
      if (fichierEnregistrement.version > versionNum) {
        console.warn("Cet enregistrement a été créé avec une version plus récente de Donjon FI.");
      }

      // Mode VS Code : on demande au host de relire le scénario depuis le disque
      // (équivalent du clic sur la baguette « Analyser »). Le webview est rebuild,
      // donc on stocke l'enregistrement pour le récupérer dans le nouveau ngOnInit.
      if (this.bridge.isInVsCode) {
        sessionStorage.setItem(PENDING_REC_KEY, JSON.stringify(fichierEnregistrement));
        this.runGame();
        return;
      }

      // Mode standalone (dev, hors VS Code) : pas d'accès au disque, compiler ce qu'on a.
      const scenarioAJour = !!this.jeu
        && this.lastCompiledScenario === this.scenarioBrut
        && this.lastCompiledActions === this.actionsBrut;
      if (!scenarioAJour) {
        this.lancerCompilation();
      }
      if (!this.jeu) {
        console.warn("Le scénario doit être compilé sans erreur avant de charger un enregistrement.");
        return;
      }

      // Le lecteur est rendu via *ngIf="activeTab === 'jeu'" : basculer puis attendre
      // que la vue soit rendue pour que lecteurRef soit disponible.
      this.activeTab = 'jeu';
      setTimeout(() => this.lecteurRef?.setEnregistrement(fichierEnregistrement), 0);
    };
    fileReader.readAsText(file);
    // permettre de recharger le même fichier
    hie.value = '';
  }

  onWikiLoad(): void {
    this.wikiNavCount++;
  }

  /** Précédent dans l'historique joint du tab — navigue d'un cran l'iframe wiki. */
  wikiBack(): void {
    if (this.wikiNavCount <= 1) { return; }
    window.history.back();
  }

  /** Retour à l'accueil du wiki — `location` est accessible en écriture cross-origin. */
  wikiHome(): void {
    const win = this.wikiFrame?.nativeElement.contentWindow;
    if (win) { win.location.replace(WIKI_URL); }
  }

  runGame(): void {
    this.bridge.postMessage({ type: 'RUN_GAME' });
  }

  openFile(nomFichier: string, ligne: number): void {
    this.bridge.postMessage({ type: 'OPEN_FILE', path: nomFichier, line: ligne });
  }

  /** Télécharger un HTML autonome contenant donjon-jouer + scénario (résolu) + actions. */
  onTelechargerJeu(): void {
    const scenarioBase64 = btoa(unescape(encodeURIComponent(this.scenarioBrut)));
    const actionsBase64 = btoa(unescape(encodeURIComponent(this.actionsBrut)));
    const injection = `<script>window.__djnScenario__=decodeURIComponent(escape(atob('${scenarioBase64}')));window.__djnActions__=decodeURIComponent(escape(atob('${actionsBase64}')));<\/script>`;
    const html = JOUER_ONE_HTML.replace('</body>', injection + '\n</body>');
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const titre = this.jeu?.titre ? StringUtils.normaliserMot(this.jeu.titre) : 'mon-jeu';
    FileSaver.saveAs(blob, titre + '.html');
  }

  lancerCompilation(): void {
    this.compilation.compiler(this.scenarioBrut, this.actionsBrut);
    this.lastCompiledScenario = this.scenarioBrut;
    this.lastCompiledActions = this.actionsBrut;

    this.activeTab = this.nbErreurs > 0 ? 'analyse' : 'jeu';

    if (this.messages.length > 0) {
      this.bridge.postMessage({
        type: 'COMPILATION_RESULT',
        messages: this.messages.map(m => ({
          ligne: m.numeroLigne,
          titre: m.titre,
          severite: m.type,
          code: m.code,
          phrase: m.phrase?.toString(),
        })),
      });
    }
  }

  get monde(): Monde | null {
    return this.resultat?.monde ?? null;
  }

  get regles(): Regle[] {
    return this.resultat?.regles ?? [];
  }

  get actions(): Action[] {
    return this.resultat?.actions ?? [];
  }

  get compteurs(): ElementGenerique[] {
    return this.resultat?.compteurs ?? [];
  }

  get listes(): ElementGenerique[] {
    return this.resultat?.listes ?? [];
  }

  EMessageAnalyse = EMessageAnalyse;

  get nbErreurs(): number {
    return this.messages.filter(m => m.type === EMessageAnalyse.erreur).length;
  }

  /** Traduit une ligne du blob compilé vers (fichier source, ligne d'origine). */
  traduireLigne(ligneFinale: number): { nomFichier: string; ligneOrigine: number } | null {
    const idx = ligneFinale - 1;
    if (idx < 0 || idx >= this.lineMap.length) { return null; }
    const e = this.lineMap[idx];
    return { nomFichier: e.nomFichier, ligneOrigine: e.ligneOrigine };
  }

  get nbAvertissements(): number {
    return this.messages.filter(m => m.type === EMessageAnalyse.probleme).length;
  }
}
