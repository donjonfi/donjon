import * as vscode from 'vscode';
import {
  Declaration,
  Occurrence,
  findDeclarations,
  findOccurrences,
} from './declarationScanner';
import { getAllDeclarations, getGlobalDeclVersion } from './workspaceIndex';

export interface DocumentAnalysis {
  /** Version VS Code du document. */
  version: number;
  /** Snapshot du compteur global de l'index workspace au moment du scan. */
  globalVersion: number;
  /** Déclarations du fichier courant uniquement (pour outline / hover-detail local). */
  declarations: Declaration[];
  /** Map des décls **locales** par clé `kind:name` (variable écrase type homonyme). */
  declarationsByName: Map<string, Declaration>;
  /** Occurrences calculées contre l'ensemble GLOBAL des déclarations (workspace). */
  occurrences: Occurrence[];
}

const cache = new Map<string, DocumentAnalysis>();

export function getAnalysis(document: vscode.TextDocument): DocumentAnalysis {
  const key = document.uri.toString();
  const globalVersion = getGlobalDeclVersion();
  const cached = cache.get(key);
  if (cached && cached.version === document.version && cached.globalVersion === globalVersion) {
    return cached;
  }

  const text = document.getText();
  const declarations = findDeclarations(text);
  const declarationsByName = new Map<string, Declaration>();
  for (const d of declarations) {
    const k = declarationKey(d);
    const existing = declarationsByName.get(k);
    if (!existing || (existing.kind === 'type' && d.kind === 'variable')) {
      declarationsByName.set(k, d);
    }
  }

  // Occurrences calculées contre les déclarations GLOBALES (toutes celles du workspace),
  // afin que les références à un objet défini dans un autre fichier soient détectées.
  const occurrences = findOccurrences(text, getAllDeclarations());

  const result: DocumentAnalysis = {
    version: document.version,
    globalVersion,
    declarations,
    declarationsByName,
    occurrences,
  };
  cache.set(key, result);
  return result;
}

export function findOccurrenceAt(
  analysis: DocumentAnalysis,
  offset: number
): Occurrence | undefined {
  for (const o of analysis.occurrences) {
    if (offset >= o.start && offset <= o.end) {
      return o;
    }
    if (o.start > offset) {
      break;
    }
  }
  return undefined;
}

export function declarationForOccurrence(
  analysis: DocumentAnalysis,
  occ: Occurrence
): Declaration | undefined {
  return analysis.declarationsByName.get(`${occ.kind}:${occ.name}`);
}

function declarationKey(d: Declaration): string {
  return `${d.kind}:${d.name}`;
}

export function clearAnalysisCache(uri?: vscode.Uri): void {
  if (uri) {
    cache.delete(uri.toString());
  } else {
    cache.clear();
  }
}
