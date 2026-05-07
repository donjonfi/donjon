import * as vscode from 'vscode';
import { DonjonSemanticTokensProvider, legend, attachOutput } from './semanticTokensProvider';
import { DonjonDocumentSymbolProvider } from './symbolProvider';
import { DonjonDefinitionProvider } from './definitionProvider';
import { DonjonHoverProvider } from './hoverProvider';
import { clearAnalysisCache } from './analysis';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Donjon');
  output.appendLine(`[${new Date().toISOString()}] Extension Donjon FI activée.`);
  attachOutput(output);

  const selector: vscode.DocumentSelector = { language: 'donjon' };

  context.subscriptions.push(output);
  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      selector,
      new DonjonSemanticTokensProvider(),
      legend
    )
  );
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(selector, new DonjonDocumentSymbolProvider())
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, new DonjonDefinitionProvider())
  );
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, new DonjonHoverProvider())
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => clearAnalysisCache(doc.uri))
  );
}

export function deactivate(): void {
  clearAnalysisCache();
}
