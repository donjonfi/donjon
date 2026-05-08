import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Rend cliquables les noms de fichiers dans les directives `inclure "X.djn"`.
 * Le chemin est résolu relativement au fichier courant.
 */
export class DonjonDocumentLinkProvider implements vscode.DocumentLinkProvider {

  private static readonly REGEX = /^(\s*inclure\s+")([^"]+)"/i;

  provideDocumentLinks(document: vscode.TextDocument): vscode.ProviderResult<vscode.DocumentLink[]> {
    const links: vscode.DocumentLink[] = [];
    const docDir = path.dirname(document.uri.fsPath);

    for (let i = 0; i < document.lineCount; i++) {
      const ligne = document.lineAt(i).text;
      const match = DonjonDocumentLinkProvider.REGEX.exec(ligne);
      if (!match) { continue; }

      const fichier = match[2];
      const start = match[1].length;
      const end = start + fichier.length;
      const range = new vscode.Range(i, start, i, end);

      const cheminAbs = path.isAbsolute(fichier) ? fichier : path.resolve(docDir, fichier);
      const link = new vscode.DocumentLink(range, vscode.Uri.file(cheminAbs));
      link.tooltip = `Ouvrir ${fichier}`;
      links.push(link);
    }

    return links;
  }
}
