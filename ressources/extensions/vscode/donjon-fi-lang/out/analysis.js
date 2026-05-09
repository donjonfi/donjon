"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalysis = getAnalysis;
exports.findOccurrenceAt = findOccurrenceAt;
exports.declarationForOccurrence = declarationForOccurrence;
exports.clearAnalysisCache = clearAnalysisCache;
const declarationScanner_1 = require("./declarationScanner");
const workspaceIndex_1 = require("./workspaceIndex");
const cache = new Map();
function getAnalysis(document) {
    const key = document.uri.toString();
    const globalVersion = (0, workspaceIndex_1.getGlobalDeclVersion)();
    const cached = cache.get(key);
    if (cached && cached.version === document.version && cached.globalVersion === globalVersion) {
        return cached;
    }
    const text = document.getText();
    const declarations = (0, declarationScanner_1.findDeclarations)(text);
    const declarationsByName = new Map();
    for (const d of declarations) {
        const k = declarationKey(d);
        const existing = declarationsByName.get(k);
        if (!existing || (existing.kind === 'type' && d.kind === 'variable')) {
            declarationsByName.set(k, d);
        }
    }
    // Occurrences calculées contre les déclarations GLOBALES (toutes celles du workspace),
    // afin que les références à un objet défini dans un autre fichier soient détectées.
    const occurrences = (0, declarationScanner_1.findOccurrences)(text, (0, workspaceIndex_1.getAllDeclarations)());
    const result = {
        version: document.version,
        globalVersion,
        declarations,
        declarationsByName,
        occurrences,
    };
    cache.set(key, result);
    return result;
}
function findOccurrenceAt(analysis, offset) {
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
function declarationForOccurrence(analysis, occ) {
    return analysis.declarationsByName.get(`${occ.kind}:${occ.name}`);
}
function declarationKey(d) {
    return `${d.kind}:${d.name}`;
}
function clearAnalysisCache(uri) {
    if (uri) {
        cache.delete(uri.toString());
    }
    else {
        cache.clear();
    }
}
//# sourceMappingURL=analysis.js.map