// Types de messages échangés entre l'extension VS Code et le webview Angular compagnon.

export interface CompilationMessage {
  ligne: number;
  titre: string;
  severite: number; // 1=conseil, 2=probleme, 3=erreur (EMessageAnalyse)
  code?: string;
  phrase?: string;
  nomFichier?: string; // Phase 4 : identifiant du fichier source d'origine
  corps?: string;
}

export interface MsgInit {
  type: 'INIT';
  rootScenarioPath: string;
  scenario: string;
  actions: string;
  actionsOrigin: 'adjacent' | 'setting' | 'default' | 'none';
  assetsBaseUri: string | null;
}

export interface MsgSourceChanged {
  type: 'SOURCE_CHANGED';
  path: string;
  scenario: string;
}

export type HostToWebview = MsgInit | MsgSourceChanged;

export interface MsgReady {
  type: 'READY';
}

export interface MsgCompilationResult {
  type: 'COMPILATION_RESULT' | 'compilationResult';
  messages: CompilationMessage[];
}

export interface MsgOpenFile {
  type: 'OPEN_FILE';
  path: string;
  line?: number;
}

export interface MsgRunGame {
  type: 'RUN_GAME';
}

export type WebviewToHost = MsgReady | MsgCompilationResult | MsgOpenFile | MsgRunGame;
