import * as vscode from 'vscode';
import { getAnalysis, findOccurrenceAt, declarationForOccurrence } from './analysis';

export class DonjonHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Hover | undefined {
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

    const md = new vscode.MarkdownString();
    md.isTrusted = false;
    if (decl.kind === 'type') {
      md.appendMarkdown(`**${decl.displayName}**\n\n*type · sous-type de \`${decl.parent}\`*`);
    } else if (decl.kind === 'routine') {
      md.appendMarkdown(`**${decl.displayName}**\n\n*routine*`);
    } else if (decl.kind === 'action') {
      md.appendMarkdown(`**${decl.displayName}**\n\n*action*`);
    } else {
      md.appendMarkdown(`**${decl.displayName}**\n\n*${decl.parent}*`);
    }
    const declLine = document.positionAt(decl.declarationStart).line + 1;
    md.appendMarkdown(`\n\nDéclarée ligne ${declLine}.`);

    const range = new vscode.Range(
      document.positionAt(occ.start),
      document.positionAt(occ.end)
    );
    return new vscode.Hover(md, range);
  }
}
