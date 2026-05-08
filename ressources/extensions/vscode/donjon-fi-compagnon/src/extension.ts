import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { CompilationMessage, MsgInit, WebviewToHost } from './protocol';
import { ErreurResolution, LineMapEntry, resoudreSources, traduireLigne } from './concat-resolver';

const DIAGNOSTICS = vscode.languages.createDiagnosticCollection('donjon');

let panel: vscode.WebviewPanel | undefined;
let currentDocUri: vscode.Uri | undefined;
let currentRootDir: string | undefined;
let currentLineMap: LineMapEntry[] = [];
let currentFichiersInclus: string[] = [];
let currentErreursResolution: ErreurResolution[] = [];

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(DIAGNOSTICS);

  const ouvrirCompagnon = () => openCompagnon(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('donjon.openCompagnon', ouvrirCompagnon),
    vscode.commands.registerCommand('donjon.runGame', ouvrirCompagnon),
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(doc => {
      if (doc.languageId === 'donjon') {
        DIAGNOSTICS.delete(doc.uri);
      }
    }),
  );
}

export function deactivate() {
  DIAGNOSTICS.dispose();
}

function openCompagnon(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('Ouvrez un fichier .djn pour utiliser le compagnon Donjon FI.');
    return;
  }

  currentDocUri = editor.document.uri;
  const djnDir = vscode.Uri.file(path.dirname(editor.document.uri.fsPath));
  currentRootDir = djnDir.fsPath;

  if (!panel) {
    const colonneCible = colonneCompagnon(editor);
    panel = vscode.window.createWebviewPanel(
      'donjonCompagnon',
      'Donjon FI — Compagnon',
      { viewColumn: colonneCible, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: localResourceRoots(context, djnDir),
      },
    );

    panel.onDidDispose(() => {
      panel = undefined;
      currentDocUri = undefined;
      currentRootDir = undefined;
      currentLineMap = [];
      currentFichiersInclus = [];
      currentErreursResolution = [];
    });

    panel.webview.onDidReceiveMessage((msg: WebviewToHost) => {
      if (!panel) { return; }
      if (msg.type === 'COMPILATION_RESULT' || msg.type === 'compilationResult') {
        publierDiagnostics(msg.messages ?? []);
      } else if (msg.type === 'OPEN_FILE') {
        ouvrirFichier(msg.path, msg.line);
      } else if (msg.type === 'RUN_GAME') {
        rafraichir(context);
      }
    });
  } else {
    panel.webview.options = { enableScripts: true, localResourceRoots: localResourceRoots(context, djnDir) };
  }

  panel.webview.html = construireHtml(context, panel.webview, editor.document, djnDir);
  panel.reveal(panel.viewColumn ?? vscode.ViewColumn.Active, true);

  // Publier d'éventuelles erreurs de résolution `inclure` immédiatement.
  publierErreursResolution();
}

function rafraichir(context: vscode.ExtensionContext) {
  if (!panel || !currentDocUri) { return; }
  const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === currentDocUri!.toString());
  if (!doc) { return; }
  const djnDir = vscode.Uri.file(path.dirname(doc.uri.fsPath));
  panel.webview.options = { enableScripts: true, localResourceRoots: localResourceRoots(context, djnDir) };
  panel.webview.html = construireHtml(context, panel.webview, doc, djnDir);
  publierErreursResolution();
}

/**
 * Colonne d'ouverture du compagnon en fonction du paramètre `donjon.compagnonViewColumn`.
 * - `active` (défaut) : même groupe que le .djn → nouvel onglet
 * - `beside` : groupe à droite → vue côte-à-côte
 */
function colonneCompagnon(editor: vscode.TextEditor): vscode.ViewColumn {
  const reglage = vscode.workspace.getConfiguration('donjon').get<string>('compagnonViewColumn', 'active');
  if (reglage === 'beside') { return vscode.ViewColumn.Beside; }
  return editor.viewColumn ?? vscode.ViewColumn.Active;
}

function localResourceRoots(context: vscode.ExtensionContext, djnDir: vscode.Uri): vscode.Uri[] {
  const roots = [vscode.Uri.file(path.join(context.extensionPath, 'media')), djnDir];
  const assetsDir = vscode.Uri.joinPath(djnDir, 'assets');
  if (fs.existsSync(assetsDir.fsPath)) {
    roots.push(assetsDir);
  }
  return roots;
}

function construireHtml(context: vscode.ExtensionContext, webview: vscode.Webview, doc: vscode.TextDocument, djnDir: vscode.Uri): string {
  const appDir = path.join(context.extensionPath, 'media', 'compagnon-app');
  const indexPath = path.join(appDir, 'index.html');

  if (!fs.existsSync(indexPath)) {
    return htmlBundleManquant();
  }

  let html = fs.readFileSync(indexPath, 'utf8');

  // Réécriture des chemins relatifs vers asWebviewUri.
  // Angular génère <script src="main-XXXX.js"> et <link href="styles-XXXX.css">.
  html = html.replace(
    /(src|href)="(?!https?:|data:|\/)([^"]+)"/g,
    (_match, attr, file) => {
      const localUri = vscode.Uri.file(path.join(appDir, file));
      return `${attr}="${webview.asWebviewUri(localUri)}"`;
    },
  );

  // Résolution des `inclure` à partir du .djn racine.
  // Le moteur compilera le blob unique, l'extension garde le line-map pour traduire les Diagnostics.
  const resolution = resoudreSources(doc.uri.fsPath);
  currentLineMap = resolution.lineMap;
  currentFichiersInclus = resolution.fichiersInclus;
  currentErreursResolution = resolution.erreurs;

  const scenario = resolution.contenu;
  const { contenu: actions, origine } = chargerActions(context, djnDir);
  const assetsBaseUri = baseUriAssets(webview, djnDir);

  const init: MsgInit = {
    type: 'INIT',
    rootScenarioPath: doc.uri.fsPath,
    scenario,
    actions,
    actionsOrigin: origine,
    assetsBaseUri,
  };

  const injection = `<style>
    html, body { direction: ltr !important; margin: 0 !important; padding: 0 !important; height: 100% !important; background: #fff !important; color: #000 !important; }
    app-root { display: flex !important; flex-direction: column !important; height: 100vh !important; width: 100% !important; background: #fff !important; }
  </style>
  <script>
    window.__djnScenario__ = ${JSON.stringify(scenario)};
    window.__djnActions__ = ${JSON.stringify(actions)};
    window.__djnInit__ = ${JSON.stringify(init)};
    window.__djnLineMap__ = ${JSON.stringify(currentLineMap)};
    window.__vscodeApi__ = acquireVsCodeApi();
  </script>`;

  return html.replace('</head>', injection + '\n</head>');
}

function chargerActions(context: vscode.ExtensionContext, djnDir: vscode.Uri): { contenu: string; origine: 'adjacent' | 'setting' | 'default' | 'none' } {
  // 1. actions.djn à côté du .djn édité
  const adjacent = path.join(djnDir.fsPath, 'actions.djn');
  if (fs.existsSync(adjacent)) {
    return { contenu: fs.readFileSync(adjacent, 'utf8'), origine: 'adjacent' };
  }

  // 2. actions.djn pointé par le paramètre `donjon.actionsFile`
  const setting = vscode.workspace.getConfiguration('donjon').get<string>('actionsFile');
  if (setting && setting.trim() !== '') {
    const resolu = path.isAbsolute(setting)
      ? setting
      : path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '', setting);
    if (fs.existsSync(resolu)) {
      return { contenu: fs.readFileSync(resolu, 'utf8'), origine: 'setting' };
    } else {
      vscode.window.showWarningMessage(`Donjon FI : actionsFile « ${setting} » introuvable.`);
    }
  }

  // 3. actions.djn par défaut, livré avec l'extension (synchronisé depuis ressources/scenarios/actions.djn au build)
  const defaut = path.join(context.extensionPath, 'media', 'actions.djn');
  if (fs.existsSync(defaut)) {
    return { contenu: fs.readFileSync(defaut, 'utf8'), origine: 'default' };
  }

  return { contenu: '', origine: 'none' };
}

function baseUriAssets(webview: vscode.Webview, djnDir: vscode.Uri): string | null {
  const assetsDir = vscode.Uri.joinPath(djnDir, 'assets');
  if (!fs.existsSync(assetsDir.fsPath)) { return null; }
  return webview.asWebviewUri(assetsDir).toString();
}

function publierDiagnostics(messages: CompilationMessage[]) {
  if (!currentDocUri || !currentRootDir) { return; }

  const parFichier = new Map<string, vscode.Diagnostic[]>();

  for (const m of messages) {
    // Si le moteur fournit nomFichier (Phase 4 niveau moteur), on l'utilise tel quel.
    // Sinon, on traduit la ligne du blob via le line-map.
    let nomFichier = m.nomFichier;
    let ligne = m.ligne ?? 1;

    if (!nomFichier) {
      const trad = traduireLigne(currentLineMap, ligne);
      if (trad) {
        nomFichier = trad.nomFichier;
        ligne = trad.ligneOrigine;
      }
    }

    const ligne0 = Math.max(0, ligne - 1);
    const range = new vscode.Range(ligne0, 0, ligne0, Number.MAX_SAFE_INTEGER);
    const severity =
      m.severite === 3 ? vscode.DiagnosticSeverity.Error
        : m.severite === 2 ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Information;
    const diag = new vscode.Diagnostic(range, m.titre ?? '', severity);
    diag.code = m.code;
    diag.source = 'Donjon FI';

    const cle = nomFichier ?? '';
    if (!parFichier.has(cle)) { parFichier.set(cle, []); }
    parFichier.get(cle)!.push(diag);
  }

  // On garde les erreurs de résolution `concaténer` (publiées séparément).
  DIAGNOSTICS.clear();
  republierErreursResolution(parFichier);

  for (const [cle, diags] of parFichier) {
    const uri = uriPourFichier(cle);
    DIAGNOSTICS.set(uri, [...(DIAGNOSTICS.get(uri) ?? []), ...diags]);
  }
}

function uriPourFichier(nomFichier: string): vscode.Uri {
  if (!nomFichier || !currentRootDir) {
    return currentDocUri!;
  }
  return vscode.Uri.file(path.join(currentRootDir, nomFichier));
}

/** Convertit les erreurs de résolution `inclure` en Diagnostics. */
function publierErreursResolution() {
  if (!currentDocUri) { return; }
  // Vide les diagnostics et republie uniquement les erreurs de résolution
  // (les erreurs de compilation seront ajoutées plus tard par le webview).
  DIAGNOSTICS.clear();
  const parFichier = new Map<string, vscode.Diagnostic[]>();
  republierErreursResolution(parFichier);
  for (const [cle, diags] of parFichier) {
    DIAGNOSTICS.set(uriPourFichier(cle), diags);
  }
}

function republierErreursResolution(parFichier: Map<string, vscode.Diagnostic[]>) {
  for (const e of currentErreursResolution) {
    const ligne0 = Math.max(0, e.ligne - 1);
    const range = new vscode.Range(ligne0, 0, ligne0, Number.MAX_SAFE_INTEGER);
    const diag = new vscode.Diagnostic(range, e.message, vscode.DiagnosticSeverity.Error);
    diag.code = `concat-${e.type}`;
    diag.source = 'Donjon FI';
    const nomCourt = currentRootDir
      ? path.relative(currentRootDir, e.fichierSource).replace(/\\/g, '/')
      : '';
    if (!parFichier.has(nomCourt)) { parFichier.set(nomCourt, []); }
    parFichier.get(nomCourt)!.push(diag);
  }
}

async function ouvrirFichier(chemin: string, ligne?: number) {
  try {
    // Si chemin relatif, le résoudre par rapport au .djn racine.
    const cheminAbs = path.isAbsolute(chemin) || !currentRootDir
      ? chemin
      : path.join(currentRootDir, chemin);
    const uri = vscode.Uri.file(cheminAbs);
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc, { preview: false });
    if (ligne !== undefined) {
      const pos = new vscode.Position(Math.max(0, ligne - 1), 0);
      editor.selection = new vscode.Selection(pos, pos);
      editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
    }
  } catch (e) {
    vscode.window.showErrorMessage(`Impossible d'ouvrir « ${chemin} » : ${e}`);
  }
}

function htmlBundleManquant(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Donjon FI Compagnon</title></head>
<body style="font-family:sans-serif;padding:2rem;color:#c00;">
  <h2>Bundle compagnon non trouvé</h2>
  <p>Le dossier <code>media/compagnon-app/</code> est absent de l'extension.</p>
  <p>Pour le générer :</p>
  <pre>cd webapp/donjon
npm run build:compagnon</pre>
</body>
</html>`;
}
