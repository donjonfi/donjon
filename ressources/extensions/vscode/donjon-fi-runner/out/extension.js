"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const DIAGNOSTICS = vscode.languages.createDiagnosticCollection('donjon');
let panel;
let currentDocUri;
function activate(context) {
    context.subscriptions.push(DIAGNOSTICS);
    context.subscriptions.push(vscode.commands.registerCommand('donjon.runGame', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Ouvrez un fichier .djn pour tester votre jeu Donjon FI.');
            return;
        }
        const scenario = editor.document.getText();
        currentDocUri = editor.document.uri;
        if (!panel) {
            panel = vscode.window.createWebviewPanel('donjonPlayer', 'Donjon FI — Lecteur', vscode.ViewColumn.Beside, {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            panel.onDidDispose(() => {
                panel = undefined;
                currentDocUri = undefined;
            });
            panel.webview.onDidReceiveMessage(msg => {
                if (msg.type === 'compilationResult' && currentDocUri) {
                    const diagnostics = (msg.messages ?? []).map((m) => {
                        const line = Math.max(0, (m.ligne ?? 1) - 1); // VS Code est 0-based
                        const range = new vscode.Range(line, 0, line, Number.MAX_SAFE_INTEGER);
                        const severity = m.severite === 3 ? vscode.DiagnosticSeverity.Error
                            : m.severite === 2 ? vscode.DiagnosticSeverity.Warning
                                : vscode.DiagnosticSeverity.Information;
                        const diag = new vscode.Diagnostic(range, m.titre ?? '', severity);
                        diag.code = m.code;
                        diag.source = 'Donjon FI';
                        return diag;
                    });
                    DIAGNOSTICS.set(currentDocUri, diagnostics);
                }
            });
        }
        panel.webview.html = buildHtml(context, scenario);
        panel.reveal(vscode.ViewColumn.Beside, true);
    }));
    // Vider les diagnostics quand le fichier est fermé
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => {
        if (doc.languageId === 'donjon') {
            DIAGNOSTICS.delete(doc.uri);
        }
    }));
    // Recharger le jeu à la sauvegarde du fichier
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(doc => {
        if (doc.languageId === 'donjon' && panel) {
            currentDocUri = doc.uri;
            panel.webview.html = buildHtml(context, doc.getText());
        }
    }));
}
function deactivate() {
    DIAGNOSTICS.dispose();
}
function buildHtml(context, scenario) {
    const playerPath = path.join(context.extensionPath, 'media', 'player.html');
    if (!fs.existsSync(playerPath)) {
        return missingPlayerHtml();
    }
    let html = fs.readFileSync(playerPath, 'utf8');
    // Injection avant le bootstrap Angular :
    // - __djnScenario__ : le contenu du fichier .djn actif
    // - __vscodeApi__   : l'API VS Code WebView pour postMessage vers l'extension
    const injection = `<script>
    window.__djnScenario__ = ${JSON.stringify(scenario)};
    window.__vscodeApi__ = acquireVsCodeApi();
  </script>`;
    return html.replace('</head>', injection + '\n</head>');
}
function missingPlayerHtml() {
    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Donjon FI</title></head>
<body style="font-family:sans-serif;padding:2rem;color:#c00;">
  <h2>Player non trouvé</h2>
  <p>Le fichier <code>media/player.html</code> est absent de l'extension.</p>
  <p>Rebuilder le player standalone :</p>
  <pre>cd webapp/donjon
ng build donjon-jouer --configuration=bundle
npx gulp
cp single-dist/index.html ressources/extensions/vscode/donjon-fi-runner/media/player.html</pre>
</body>
</html>`;
}
//# sourceMappingURL=extension.js.map