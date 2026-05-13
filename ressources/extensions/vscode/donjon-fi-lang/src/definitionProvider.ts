import * as vscode from 'vscode';
import { getAnalysis, findOccurrenceAt } from './analysis';
import { ensureScanned, getDeclarationsForName } from './workspaceIndex';

export class DonjonDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Definition | undefined> {
    await ensureScanned();
    const analysis = getAnalysis(document);
    const offset = document.offsetAt(position);
    const occ = findOccurrenceAt(analysis, offset);
    if (!occ) {
      return undefined;
    }
    const matches = getDeclarationsForName(occ.kind, occ.name);
    if (matches.length === 0) {
      return undefined;
    }

    const locations: vscode.Location[] = [];
    for (const dl of matches) {
      const targetDoc = await openOrFind(dl.uri);
      const start = targetDoc.positionAt(dl.decl.nameStart);
      const end = targetDoc.positionAt(dl.decl.nameEnd);
      locations.push(new vscode.Location(dl.uri, new vscode.Range(start, end)));
    }
    return locations;
  }
}

async function openOrFind(uri: vscode.Uri): Promise<vscode.TextDocument> {
  const opened = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
  if (opened) {
    return opened;
  }
  return vscode.workspace.openTextDocument(uri);
}
