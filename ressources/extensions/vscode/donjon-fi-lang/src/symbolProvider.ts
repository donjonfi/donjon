import * as vscode from 'vscode';
import { getAnalysis } from './analysis';
import { Declaration } from './declarationScanner';

export class DonjonDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    const { declarations } = getAnalysis(document);
    return declarations.map((d) => {
      const range = new vscode.Range(
        document.positionAt(d.declarationStart),
        document.positionAt(d.declarationEnd)
      );
      const selection = new vscode.Range(
        document.positionAt(d.nameStart),
        document.positionAt(d.nameEnd)
      );
      const kind = mapSymbolKind(d);
      const detail = symbolDetail(d);
      return new vscode.DocumentSymbol(d.displayName, detail, kind, range, selection);
    });
  }
}

function mapSymbolKind(d: Declaration): vscode.SymbolKind {
  if (d.kind === 'type') {
    return vscode.SymbolKind.Class;
  }
  if (d.kind === 'routine' || d.kind === 'action') {
    return vscode.SymbolKind.Function;
  }
  const p = d.parent;
  if (p.startsWith('lieu')) {
    return vscode.SymbolKind.Module;
  }
  if (p.startsWith('liste')) {
    return vscode.SymbolKind.Array;
  }
  if (p.startsWith('compteur') || p.startsWith('nombre')) {
    return vscode.SymbolKind.Number;
  }
  if (p.startsWith('intitulé') || p.startsWith('texte')) {
    return vscode.SymbolKind.String;
  }
  if (p.startsWith('ressource')) {
    return vscode.SymbolKind.Field;
  }
  return vscode.SymbolKind.Object;
}

function symbolDetail(d: Declaration): string {
  if (d.kind === 'type') {
    return `type · ${d.parent}`;
  }
  if (d.kind === 'routine') {
    return 'routine';
  }
  if (d.kind === 'action') {
    return 'action';
  }
  return d.parent;
}
