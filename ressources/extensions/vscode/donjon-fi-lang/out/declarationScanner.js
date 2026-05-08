"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDeclarations = findDeclarations;
exports.findOccurrences = findOccurrences;
// Articles définis (instance) : « Le », « La », « Les » avec espace OU « L' » sans espace
const DEFINITE_ARTICLE = "(?:(?:Le|La|Les)\\s+|L['’])";
// Articles indéfinis (type/classe) : « Un », « Une », « Des », « Deux »
const INDEFINITE_ARTICLE = "(?:Un|Une|Des|Deux)\\s+";
// Nom : commence par une lettre, peut contenir lettres, marques, tirets, apostrophes, espaces
const NAME = "[\\p{L}][\\p{L}\\p{M}\\-'’ ]*?";
// Suffixe de genre optionnel : « (f) », « (m) », « (n) », « (p) »
const GENDER_SUFFIX = "(?:\\s*\\([fmnp]+\\))?";
// Article suivant le verbe « est/sont »
const TYPE_ARTICLE = "(?:un|une|des|le|la|les)";
// Nom du type parent (après est/sont + article) : un seul mot pour rester simple
const PARENT_NAME = "[\\p{L}][\\p{L}\\p{M}\\-]*";
// Identifiant simple (routine name) : lettres/chiffres/tirets, démarre par une lettre
const IDENT = "[\\p{L}_][\\p{L}\\p{M}\\p{N}_-]*";
const INSTANCE_DECLARATION = new RegExp(`^\\s*${DEFINITE_ARTICLE}(${NAME})${GENDER_SUFFIX}\\s+(?:est|sont)\\s+${TYPE_ARTICLE}\\s+(${PARENT_NAME})`, 'gmiud');
const TYPE_DECLARATION = new RegExp(`^\\s*${INDEFINITE_ARTICLE}(${NAME})${GENDER_SUFFIX}\\s+(?:est|sont)\\s+${TYPE_ARTICLE}\\s+(${PARENT_NAME})`, 'gmiud');
const ROUTINE_DECLARATION = new RegExp(`^\\s*routine\\s+(${IDENT})\\s*:`, 'gmiud');
// Action : « action <signature> : » où la signature est l'ensemble verbe + ceci/cela + prépositions.
// On capture toute la signature jusqu'au « : » pour préserver l'arité.
const ACTION_DECLARATION = /^\s*action\s+([^\n:]+?)\s*:/gmiud;
const ROUTINE_REFERENCE = new RegExp(`\\bexécuter\\s+(?:la\\s+)?routine\\s+(${IDENT})\\b`, 'giud');
// Référence à une action : « exécuter [l'][action] <signature> » jusqu'au prochain « . », « , » ou « ; ».
const ACTION_REFERENCE = /\bexécuter\s+(?:l['’]\s*)?action\s+([^.,;\n]+?)(?=\s*[.,;\n])/giud;
function findDeclarations(text) {
    const cleaned = blankCommentsAndStrings(text);
    const declarations = [];
    collectVarType(cleaned, INSTANCE_DECLARATION, declarations, 'variable');
    collectVarType(cleaned, TYPE_DECLARATION, declarations, 'type');
    collectRoutines(cleaned, declarations);
    collectActions(cleaned, declarations);
    return declarations;
}
function collectVarType(text, pattern, out, kind) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m;
    while ((m = re.exec(text)) !== null) {
        const indices = m.indices;
        if (!indices || !indices[1] || !indices[2]) {
            continue;
        }
        const displayName = m[1].trim();
        const name = displayName.toLowerCase();
        if (name.length < 2) {
            continue;
        }
        const [rawNameStart] = indices[1];
        out.push({
            name,
            displayName,
            kind,
            parent: m[2].trim().toLowerCase(),
            declarationStart: m.index,
            declarationEnd: m.index + m[0].length,
            nameStart: rawNameStart,
            nameEnd: rawNameStart + displayName.length,
        });
    }
}
function collectRoutines(text, out) {
    const re = new RegExp(ROUTINE_DECLARATION.source, ROUTINE_DECLARATION.flags);
    let m;
    while ((m = re.exec(text)) !== null) {
        const indices = m.indices;
        if (!indices || !indices[1]) {
            continue;
        }
        const displayName = m[1].trim();
        const name = displayName.toLowerCase();
        if (name.length < 1) {
            continue;
        }
        const [nameStart, nameEnd] = indices[1];
        out.push({
            name,
            displayName,
            kind: 'routine',
            parent: 'routine',
            declarationStart: m.index,
            declarationEnd: m.index + m[0].length,
            nameStart,
            nameEnd,
        });
    }
}
function collectActions(text, out) {
    const re = new RegExp(ACTION_DECLARATION.source, ACTION_DECLARATION.flags);
    let m;
    while ((m = re.exec(text)) !== null) {
        const indices = m.indices;
        if (!indices || !indices[1]) {
            continue;
        }
        const displayName = m[1].trim();
        const name = normalizeSignature(displayName);
        if (name.length < 1) {
            continue;
        }
        const [rawStart] = indices[1];
        out.push({
            name,
            displayName,
            kind: 'action',
            parent: 'action',
            declarationStart: m.index,
            declarationEnd: m.index + m[0].length,
            nameStart: rawStart,
            nameEnd: rawStart + displayName.length,
        });
    }
}
function normalizeSignature(s) {
    return s.trim().toLowerCase().replace(/\s+/g, ' ');
}
function findOccurrences(text, declarations) {
    if (declarations.length === 0) {
        return [];
    }
    const cleaned = blankCommentsAndStrings(text);
    const occurrences = [];
    collectVarTypeOccurrences(cleaned, declarations, occurrences);
    collectRoutineOccurrences(cleaned, declarations, occurrences);
    collectActionOccurrences(cleaned, declarations, occurrences);
    occurrences.sort((a, b) => a.start - b.start);
    return dedupeOverlaps(occurrences);
}
function collectVarTypeOccurrences(cleaned, declarations, out) {
    const names = new Map();
    // Types d'abord, puis instances : si un nom est déclaré des deux façons, l'instance gagne.
    for (const d of declarations) {
        if (d.kind === 'type' && !names.has(d.name)) {
            names.set(d.name, 'type');
        }
    }
    for (const d of declarations) {
        if (d.kind === 'variable') {
            names.set(d.name, 'variable');
        }
    }
    if (names.size === 0) {
        return;
    }
    const sorted = [...names.entries()].sort((a, b) => b[0].length - a[0].length);
    for (const [name, kind] of sorted) {
        const escaped = escapeRegex(name);
        const re = new RegExp(`(?<![\\p{L}\\p{M}])${escaped}(?![\\p{L}\\p{M}])`, 'giu');
        let m;
        while ((m = re.exec(cleaned)) !== null) {
            out.push({ start: m.index, end: m.index + m[0].length, kind, name });
        }
    }
}
function collectRoutineOccurrences(cleaned, declarations, out) {
    const known = new Set();
    for (const d of declarations) {
        if (d.kind === 'routine') {
            known.add(d.name);
        }
    }
    if (known.size === 0) {
        return;
    }
    const re = new RegExp(ROUTINE_REFERENCE.source, ROUTINE_REFERENCE.flags);
    let m;
    while ((m = re.exec(cleaned)) !== null) {
        const indices = m.indices;
        if (!indices || !indices[1]) {
            continue;
        }
        const name = m[1].toLowerCase();
        if (!known.has(name)) {
            continue;
        }
        const [s, e] = indices[1];
        out.push({ start: s, end: e, kind: 'routine', name });
    }
}
function collectActionOccurrences(cleaned, declarations, out) {
    const known = new Set();
    const verbs = new Map();
    for (const d of declarations) {
        if (d.kind === 'action') {
            known.add(d.name);
            const verb = d.name.split(/\s+/)[0];
            const list = verbs.get(verb) ?? [];
            list.push(d.name);
            verbs.set(verb, list);
        }
    }
    if (known.size === 0) {
        return;
    }
    const re = new RegExp(ACTION_REFERENCE.source, ACTION_REFERENCE.flags);
    let m;
    while ((m = re.exec(cleaned)) !== null) {
        const indices = m.indices;
        if (!indices || !indices[1]) {
            continue;
        }
        const sig = normalizeSignature(m[1]);
        let matched;
        if (known.has(sig)) {
            matched = sig;
        }
        else {
            // Fallback : verbe seul (au cas où l'auteur écrit du texte non normalisé)
            const verb = sig.split(/\s+/)[0];
            if (verbs.has(verb)) {
                matched = verb;
            }
        }
        if (!matched) {
            continue;
        }
        const [s, e] = indices[1];
        out.push({ start: s, end: e, kind: 'action', name: matched });
    }
}
function dedupeOverlaps(ranges) {
    const result = [];
    let lastEnd = -1;
    for (const r of ranges) {
        if (r.start >= lastEnd) {
            result.push(r);
            lastEnd = r.end;
        }
    }
    return result;
}
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function blankCommentsAndStrings(text) {
    // Commentaires : « -- » jusqu'à la fin de ligne
    let out = text.replace(/--[^\n]*/g, (m) => ' '.repeat(m.length));
    // Chaînes : « "..." » mono- ou multi-ligne. On préserve les sauts de ligne
    // pour ne pas décaler les offsets utilisés par le provider.
    out = out.replace(/"[^"]*"/g, (m) => m.replace(/[^\n]/g, ' '));
    return out;
}
//# sourceMappingURL=declarationScanner.js.map