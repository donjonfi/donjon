import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import * as FileSaver from 'file-saver-es';

import { Action, ElementGenerique, EMessageAnalyse, Jeu, MessageAnalyse, Monde, Regle, ResultatCompilation, StringUtils } from 'donjon';

import { CompilationService } from './services/compilation.service';
import { LineMapEntry, VsCodeBridgeService } from './services/vscode-bridge.service';
import { JOUER_ONE_HTML } from '../../../donjon-creer/src/app/standalone/jouer-one-template';

type CompagnonTab = 'analyse' | 'jeu' | 'visualisation' | 'apercu' | 'aide';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  public activeTab: CompagnonTab = 'analyse';

  public scenarioBrut = '';
  public actionsBrut = '';
  public lineMap: LineMapEntry[] = [];

  public resultat: ResultatCompilation | null = null;
  public jeu: Jeu | null = null;
  public messages: MessageAnalyse[] = [];
  public erreur: string | null = null;

  private sub: Subscription | undefined;

  constructor(
    private compilation: CompilationService,
    private bridge: VsCodeBridgeService,
  ) { }

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
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  setTab(tab: CompagnonTab): void {
    this.activeTab = tab;
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
