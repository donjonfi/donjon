import * as vscode from 'vscode';
import { formatLines } from './formatter';

export class DonjonDocumentFormattingProvider implements vscode.DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions
  ): vscode.TextEdit[] {
    const lines: string[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      lines.push(document.lineAt(i).text);
    }

    const formatted = formatLines(lines, {
      tabSize: options.tabSize,
      insertSpaces: options.insertSpaces,
    });

    const edits: vscode.TextEdit[] = [];
    for (let i = 0; i < lines.length; i++) {
      const original = lines[i];
      const next = formatted[i];
      if (original === next) continue;
      edits.push(vscode.TextEdit.replace(document.lineAt(i).range, next));
    }
    return edits;
  }
}
