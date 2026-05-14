import * as vscode from 'vscode';
import { DonjonSemanticTokensProvider, legend, attachOutput as attachSemOutput } from './semanticTokensProvider';
import { DonjonDocumentSymbolProvider } from './symbolProvider';
import { DonjonDefinitionProvider } from './definitionProvider';
import { DonjonHoverProvider } from './hoverProvider';
import { DonjonDocumentLinkProvider } from './documentLinkProvider';
import { DonjonRenameProvider } from './renameProvider';
import { DonjonDocumentFormattingProvider } from './formattingProvider';
import { clearAnalysisCache } from './analysis';
import {
  activateWatcher,
  ensureScanned,
  attachOutput as attachIdxOutput,
  disposeIndex,
} from './workspaceIndex';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Donjon');
  output.appendLine(`[${new Date().toISOString()}] Extension Donjon FI activée.`);
  attachSemOutput(output);
  attachIdxOutput(output);

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
    vscode.languages.registerDocumentLinkProvider(selector, new DonjonDocumentLinkProvider())
  );
  context.subscriptions.push(
    vscode.languages.registerRenameProvider(selector, new DonjonRenameProvider())
  );
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      selector,
      new DonjonDocumentFormattingProvider()
    )
  );

  activateWatcher(context);
  void ensureScanned();

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => clearAnalysisCache(doc.uri))
  );
}

export function deactivate(): void {
  clearAnalysisCache();
  disposeIndex();
}
