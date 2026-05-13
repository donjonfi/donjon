import * as vscode from 'vscode';
import { Declaration, DeclarationKind, findDeclarations } from './declarationScanner';

export interface DeclarationLocation {
  decl: Declaration;
  uri: vscode.Uri;
}

interface FileEntry {
  uri: vscode.Uri;
  /** Version VS Code si le fichier est ouvert dans un éditeur, -1 si lu depuis le disque. */
  version: number;
  declarations: Declaration[];
}

const files = new Map<string, FileEntry>();
let globalDeclVersion = 0;
let scanned = false;
let scanning: Promise<void> | undefined;
let output: vscode.OutputChannel | undefined;

export function attachOutput(channel: vscode.OutputChannel): void {
  output = channel;
}

export function getGlobalDeclVersion(): number {
  return globalDeclVersion;
}

export function getDeclarationsForName(kind: DeclarationKind, name: string): DeclarationLocation[] {
  const out: DeclarationLocation[] = [];
  for (const entry of files.values()) {
    for (const decl of entry.declarations) {
      if (decl.kind === kind && decl.name === name) {
        out.push({ decl, uri: entry.uri });
      }
    }
  }
  return out;
}

export function getAllDeclarations(): Declaration[] {
  const out: Declaration[] = [];
  for (const entry of files.values()) {
    for (const decl of entry.declarations) {
      out.push(decl);
    }
  }
  return out;
}

export function getAllFileUris(): vscode.Uri[] {
  return [...files.values()].map((f) => f.uri);
}

/** Scan initial du workspace (idempotent ; safe à appeler plusieurs fois en parallèle). */
export async function ensureScanned(): Promise<void> {
  if (scanned) {
    return;
  }
  if (scanning) {
    return scanning;
  }
  scanning = (async () => {
    try {
      const uris = await vscode.workspace.findFiles('**/*.djn', '**/node_modules/**');
      for (const uri of uris) {
        await scanFromDisk(uri);
      }
      // Override pour tout document Donjon déjà ouvert (texte non sauvegardé prioritaire).
      for (const doc of vscode.workspace.textDocuments) {
        if (doc.languageId === 'donjon') {
          updateFromDocument(doc);
        }
      }
      scanned = true;
      output?.appendLine(
        `[${new Date().toISOString()}] Index workspace : ${files.size} fichier(s), ${countDecls()} déclaration(s).`
      );
    } finally {
      scanning = undefined;
    }
  })();
  return scanning;
}

async function scanFromDisk(uri: vscode.Uri): Promise<void> {
  // Si une version "ouverte" existe déjà, ne pas écraser avec le contenu disque.
  const existing = files.get(uri.toString());
  if (existing && existing.version >= 0) {
    return;
  }
  let text: string;
  try {
    const data = await vscode.workspace.fs.readFile(uri);
    text = Buffer.from(data).toString('utf8');
  } catch {
    files.delete(uri.toString());
    globalDeclVersion++;
    return;
  }
  setEntry(uri, -1, findDeclarations(text));
}

export function updateFromDocument(document: vscode.TextDocument): void {
  if (document.languageId !== 'donjon') {
    return;
  }
  const key = document.uri.toString();
  const existing = files.get(key);
  if (existing && existing.version === document.version) {
    return;
  }
  setEntry(document.uri, document.version, findDeclarations(document.getText()));
}

export function removeFile(uri: vscode.Uri): void {
  const key = uri.toString();
  if (!files.has(key)) {
    return;
  }
  files.delete(key);
  globalDeclVersion++;
}

function setEntry(uri: vscode.Uri, version: number, declarations: Declaration[]): void {
  const key = uri.toString();
  const prev = files.get(key);
  files.set(key, { uri, version, declarations });
  if (!prev || !sameDeclarations(prev.declarations, declarations)) {
    globalDeclVersion++;
  }
}

function sameDeclarations(a: Declaration[], b: Declaration[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.kind !== y.kind ||
      x.name !== y.name ||
      x.declarationStart !== y.declarationStart ||
      x.nameStart !== y.nameStart
    ) {
      return false;
    }
  }
  return true;
}

function countDecls(): number {
  let n = 0;
  for (const f of files.values()) {
    n += f.declarations.length;
  }
  return n;
}

export function activateWatcher(context: vscode.ExtensionContext): void {
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.djn');
  watcher.onDidCreate((uri) => {
    void scanFromDisk(uri);
  });
  watcher.onDidChange((uri) => {
    // Si le fichier est ouvert dans un éditeur, onDidChangeTextDocument couvre déjà les édits.
    // Le watcher fire uniquement sur sauvegarde, donc on rescanne le disque pour s'assurer
    // d'avoir la version persistée (cas d'une sauvegarde externe ou via `git checkout`).
    const opened = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() === uri.toString() && !d.isUntitled
    );
    if (!opened) {
      void scanFromDisk(uri);
    }
  });
  watcher.onDidDelete((uri) => removeFile(uri));
  context.subscriptions.push(watcher);

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.languageId === 'donjon') {
        updateFromDocument(e.document);
      }
    })
  );
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.languageId === 'donjon') {
        updateFromDocument(doc);
      }
    })
  );
}

export function disposeIndex(): void {
  files.clear();
  scanned = false;
  globalDeclVersion = 0;
}
