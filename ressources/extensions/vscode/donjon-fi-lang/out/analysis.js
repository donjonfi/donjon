"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalysis = getAnalysis;
exports.findOccurrenceAt = findOccurrenceAt;
exports.declarationForOccurrence = declarationForOccurrence;
exports.clearAnalysisCache = clearAnalysisCache;
const declarationScanner_1 = require("./declarationScanner");
const cache = new Map();
function getAnalysis(document) {
    const key = document.uri.toString();
    const cached = cache.get(key);
    if (cached && cached.version === document.version) {
        return cached;
    }
    const text = document.getText();
    const declarations = (0, declarationScanner_1.findDeclarations)(text);
    const declarationsByName = new Map();
    for (const d of declarations) {
        // Une instance écrase un type homonyme (cas le plus spécifique).
        const existing = declarationsByName.get(declarationKey(d));
        if (!existing || (existing.kind === 'type' && d.kind === 'variable')) {
            declarationsByName.set(declarationKey(d), d);
        }
    }
    const occurrences = (0, declarationScanner_1.findOccurrences)(text, declarations);
    const result = {
        version: document.version,
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