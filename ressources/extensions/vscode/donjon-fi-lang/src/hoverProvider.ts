import * as vscode from 'vscode';
import * as path from 'path';
import { getAnalysis, findOccurrenceAt } from './analysis';
import { ensureScanned, getDeclarationsForName, DeclarationLocation } from './workspaceIndex';

export class DonjonHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Hover | undefined> {
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

    // Préférer la déclaration locale au document courant si elle existe (cas le plus fréquent).
    const local = matches.find((m) => m.uri.toString() === document.uri.toString());
    const principal = local ?? matches[0];

    const md = new vscode.MarkdownString();
    md.isTrusted = false;
    appendHeader(md, principal);
    await appendDeclarationLine(md, principal, document);
    if (matches.length > 1) {
      const others = matches.length - 1;
      md.appendMarkdown(
        `\n\n*+${others} autre${others > 1 ? 's' : ''} déclaration${others > 1 ? 's' : ''} dans le workspace.*`
      );
    }

    const range = new vscode.Range(
      document.positionAt(occ.start),
      document.positionAt(occ.end)
    );
    return new vscode.Hover(md, range);
  }
}

function appendHeader(md: vscode.MarkdownString, dl: DeclarationLocation): void {
  const decl = dl.decl;
  if (decl.kind === 'type') {
    md.appendMarkdown(`**${decl.displayName}**\n\n*type · sous-type de \`${decl.parent}\`*`);
  } else if (decl.kind === 'routine') {
    md.appendMarkdown(`**${decl.displayName}**\n\n*routine*`);
  } else if (decl.kind === 'action') {
    md.appendMarkdown(`**${decl.displayName}**\n\n*action*`);
  } else {
    md.appendMarkdown(`**${decl.displayName}**\n\n*${decl.parent}*`);
  }
}

async function appendDeclarationLine(
  md: vscode.MarkdownString,
  dl: DeclarationLocation,
  currentDocument: vscode.TextDocument
): Promise<void> {
  const sameFile = dl.uri.toString() === currentDocument.uri.toString();
  const targetDoc = sameFile
    ? currentDocument
    : (vscode.workspace.textDocuments.find((d) => d.uri.toString() === dl.uri.toString())
        ?? await vscode.workspace.openTextDocument(dl.uri));
  const declLine = targetDoc.positionAt(dl.decl.declarationStart).line + 1;
  if (sameFile) {
    md.appendMarkdown(`\n\nDéclarée ligne ${declLine}.`);
  } else {
    const fileName = path.basename(dl.uri.fsPath);
    md.appendMarkdown(`\n\nDéclarée ligne ${declLine} dans \`${fileName}\`.`);
  }
}
