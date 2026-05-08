import * as vscode from 'vscode';
import {
  Declaration,
  Occurrence,
  findDeclarations,
  findOccurrences,
} from './declarationScanner';

export interface DocumentAnalysis {
  version: number;
  declarations: Declaration[];
  declarationsByName: Map<string, Declaration>;
  occurrences: Occurrence[];
}

const cache = new Map<string, DocumentAnalysis>();

export function getAnalysis(document: vscode.TextDocument): DocumentAnalysis {
  const key = document.uri.toString();
  const cached = cache.get(key);
  if (cached && cached.version === document.version) {
    return cached;
  }

  const text = document.getText();
  const declarations = findDeclarations(text);
  const declarationsByName = new Map<string, Declaration>();
  for (const d of declarations) {
    // Une instance écrase un type homonyme (cas le plus spécifique).
    const existing = declarationsByName.get(declarationKey(d));
    if (!existing || (existing.kind === 'type' && d.kind === 'variable')) {
      declarationsByName.set(declarationKey(d), d);
    }
  }
  const occurrences = findOccurrences(text, declarations);

  const result: DocumentAnalysis = {
    version: document.version,
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
