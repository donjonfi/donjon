import * as vscode from 'vscode';
import { findOccurrenceAt, getAnalysis } from './analysis';
import { DeclarationKind } from './declarationScanner';
import { ensureScanned, getAllFileUris } from './workspaceIndex';

interface RenameTarget {
  kind: DeclarationKind;
  name: string;
  displayName: string;
  range: vscode.Range;
}

export class DonjonRenameProvider implements vscode.RenameProvider {
  async prepareRename(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<{ range: vscode.Range; placeholder: string }> {
    await ensureScanned();
    const analysis = getAnalysis(document);
    const offset = document.offsetAt(position);
    const target = findRenameTarget(document, analysis, offset);
    if (!target) {
      throw new Error('Cet élément ne peut pas être renommé ici.');
    }
    return { range: target.range, placeholder: target.displayName };
  }

  async provideRenameEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string
  ): Promise<vscode.WorkspaceEdit | undefined> {
    await ensureScanned();
    const analysis = getAnalysis(document);
    const offset = document.offsetAt(position);
    const target = findRenameTarget(document, analysis, offset);
    if (!target) {
      throw new Error('Cet élément ne peut pas être renommé ici.');
    }
    validateNewName(target.kind, newName);

    const edit = new vscode.WorkspaceEdit();
    for (const uri of getAllFileUris()) {
      const doc = await openOrFind(uri);
      const fileAnalysis = getAnalysis(doc);

      // Var/type : occurrences contiennent déjà le span de la déclaration et toutes les références.
      // Routine : occurrences contiennent uniquement les `exécuter routine X` ; le nom dans `routine X:`
      //           est ajouté séparément via `analysis.declarations`.
      for (const occ of fileAnalysis.occurrences) {
        if (occ.kind === target.kind && occ.name === target.name) {
          const range = new vscode.Range(doc.positionAt(occ.start), doc.positionAt(occ.end));
          edit.replace(uri, range, newName);
        }
      }
      if (target.kind === 'routine') {
        for (const decl of fileAnalysis.declarations) {
          if (decl.kind === 'routine' && decl.name === target.name) {
            const range = new vscode.Range(
              doc.positionAt(decl.nameStart),
              doc.positionAt(decl.nameEnd)
            );
            edit.replace(uri, range, newName);
          }
        }
      }
    }
    return edit;
  }
}

function findRenameTarget(
  document: vscode.TextDocument,
  analysis: ReturnType<typeof getAnalysis>,
  offset: number
): RenameTarget | undefined {
  const occ = findOccurrenceAt(analysis, offset);
  if (occ) {
    if (occ.kind === 'action') {
      return undefined;
    }
    const local = analysis.declarationsByName.get(`${occ.kind}:${occ.name}`);
    return {
      kind: occ.kind,
      name: occ.name,
      displayName: local?.displayName ?? occ.name,
      range: new vscode.Range(document.positionAt(occ.start), document.positionAt(occ.end)),
    };
  }
  // Le nom dans `routine X:` n'est pas dans les occurrences : on le détecte via les déclarations locales.
  for (const d of analysis.declarations) {
    if (offset >= d.nameStart && offset <= d.nameEnd) {
      if (d.kind === 'action') {
        return undefined;
      }
      return {
        kind: d.kind,
        name: d.name,
        displayName: d.displayName,
        range: new vscode.Range(document.positionAt(d.nameStart), document.positionAt(d.nameEnd)),
      };
    }
  }
  return undefined;
}

function validateNewName(kind: DeclarationKind, newName: string): void {
  const trimmed = newName.trim();
  if (trimmed.length < 1) {
    throw new Error('Le nouveau nom ne peut pas être vide.');
  }
  if (trimmed !== newName) {
    throw new Error('Le nouveau nom ne peut pas commencer ou finir par un espace.');
  }
  if (kind === 'routine') {
    if (!/^[\p{L}_][\p{L}\p{M}\p{N}_-]*$/u.test(trimmed)) {
      throw new Error(
        'Le nom d’une routine doit être un identifiant (lettres, chiffres, tirets ou soulignés ; pas d’espace).'
      );
    }
  } else {
    if (!/^[\p{L}][\p{L}\p{M}\p{N}\-'’ ]*$/u.test(trimmed)) {
      throw new Error(
        'Nom invalide : doit commencer par une lettre et ne contenir que des lettres, chiffres, tirets, apostrophes ou espaces.'
      );
    }
  }
}

async function openOrFind(uri: vscode.Uri): Promise<vscode.TextDocument> {
  const opened = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
  if (opened) {
    return opened;
  }
  return vscode.workspace.openTextDocument(uri);
}
