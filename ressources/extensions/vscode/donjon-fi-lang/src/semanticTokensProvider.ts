import * as vscode from 'vscode';
import { getAnalysis } from './analysis';

const tokenTypes = ['variable', 'type'];
const tokenModifiers: string[] = [];
export const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

let output: vscode.OutputChannel | undefined;
let firstCall = true;

export function attachOutput(channel: vscode.OutputChannel): void {
  output = channel;
}

export class DonjonSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
  provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.SemanticTokens {
    const { declarations, occurrences } = getAnalysis(document);

    if (firstCall && output) {
      firstCall = false;
      output.appendLine(
        `[${new Date().toISOString()}] Premier scan : ${declarations.length} déclarations, ${occurrences.length} occurrences (${document.uri.fsPath}).`
      );
      for (const d of declarations) {
        output.appendLine(`  ${d.kind}\t${d.name}\t(${d.parent})`);
      }
    } else if (output) {
      output.appendLine(
        `[${new Date().toISOString()}] Scan : ${declarations.length} déclarations, ${occurrences.length} occurrences.`
      );
    }

    const builder = new vscode.SemanticTokensBuilder(legend);
    for (const { start, end, kind } of occurrences) {
      if (kind !== 'variable' && kind !== 'type') {
        continue;
      }
      const startPos = document.positionAt(start);
      const endPos = document.positionAt(end);
      if (startPos.line !== endPos.line) {
        continue;
      }
      builder.push(new vscode.Range(startPos, endPos), kind, []);
    }
    return builder.build();
  }
}
