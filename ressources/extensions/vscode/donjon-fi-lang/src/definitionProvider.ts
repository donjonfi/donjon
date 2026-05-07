import * as vscode from 'vscode';
import { getAnalysis, findOccurrenceAt, declarationForOccurrence } from './analysis';

export class DonjonDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Definition | undefined {
    const analysis = getAnalysis(document);
    if (analysis.declarations.length === 0) {
      return undefined;
    }
    const offset = document.offsetAt(position);
    const occ = findOccurrenceAt(analysis, offset);
    if (!occ) {
      return undefined;
    }
    const decl = declarationForOccurrence(analysis, occ);
    if (!decl) {
      return undefined;
    }
    const target = new vscode.Range(
      document.positionAt(decl.nameStart),
      document.positionAt(decl.nameEnd)
    );
    return new vscode.Location(document.uri, target);
  }
}
