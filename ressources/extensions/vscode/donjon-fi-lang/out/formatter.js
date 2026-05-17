"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLines = formatLines;
exports.formatText = formatText;
const SUB_KINDS = new Set(['phase', 'définition', 'concernant', 'basique']);
const RE_FIN = /^fin\s+(action|règles?|routine|si|réactions?)\b/i;
const RE_SINON_LIKE = /^(sinonsi|sinon|autre\s+choix)\b/i;
const RE_PHASE = /^phase\b/i;
const RE_DEFINITION = /^définitions?\s*:/i;
const RE_CONCERNANT = /^concernant\b/i;
const RE_BASIQUE = /^basique\s*:/i;
const RE_ACTION = /^action\b/i;
const RE_REGLE = /^règle\b/i;
const RE_ROUTINE = /^routine\b/i;
const RE_SI = /^si\b/i;
const RE_REACTIONS = /^réactions?\b/i;
function finKindOf(word) {
    const w = word.toLowerCase();
    if (w === 'action')
        return 'action';
    if (w === 'routine')
        return 'routine';
    if (w === 'règle' || w === 'règles')
        return 'règle';
    if (w === 'si')
        return 'si';
    if (w === 'réaction' || w === 'réactions')
        return 'réaction';
    return undefined;
}
function stripComment(line) {
    let inString = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inString = !inString;
        }
        else if (!inString && c === '-' && line[i + 1] === '-') {
            return line.slice(0, i);
        }
    }
    return line;
}
function blankStrings(line) {
    let result = '';
    let inString = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inString = !inString;
            result += c;
        }
        else if (inString) {
            result += ' ';
        }
        else {
            result += c;
        }
    }
    return result;
}
function cleanForCheck(line) {
    return blankStrings(stripComment(line)).trim();
}
function popUntilKind(stack, target) {
    for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i] === target) {
            stack.length = i;
            return;
        }
    }
}
function popSubBlocks(stack) {
    while (stack.length > 0 && SUB_KINDS.has(stack[stack.length - 1])) {
        stack.pop();
    }
}
function detectOpenerKind(cleaned) {
    if (RE_ACTION.test(cleaned))
        return 'action';
    if (RE_REGLE.test(cleaned))
        return 'règle';
    if (RE_ROUTINE.test(cleaned))
        return 'routine';
    if (RE_SI.test(cleaned))
        return 'si';
    if (RE_REACTIONS.test(cleaned))
        return 'réaction';
    return undefined;
}
function formatLines(lines, options) {
    const unit = options.insertSpaces ? ' '.repeat(Math.max(1, options.tabSize)) : '\t';
    const stack = [];
    const out = [];
    for (const raw of lines) {
        const trimmed = raw.replace(/^[ \t]+/, '');
        if (trimmed === '') {
            out.push('');
            continue;
        }
        const cleaned = cleanForCheck(trimmed);
        if (cleaned === '') {
            out.push(unit.repeat(stack.length) + trimmed);
            continue;
        }
        let lineIndent;
        const finMatch = cleaned.match(RE_FIN);
        if (finMatch) {
            const kind = finKindOf(finMatch[1]);
            if (kind)
                popUntilKind(stack, kind);
            lineIndent = stack.length;
        }
        else if (RE_SINON_LIKE.test(cleaned)) {
            lineIndent = Math.max(0, stack.length - 1);
        }
        else if (RE_PHASE.test(cleaned) ||
            RE_DEFINITION.test(cleaned) ||
            RE_CONCERNANT.test(cleaned) ||
            RE_BASIQUE.test(cleaned)) {
            popSubBlocks(stack);
            lineIndent = stack.length;
            let subKind;
            if (RE_PHASE.test(cleaned))
                subKind = 'phase';
            else if (RE_DEFINITION.test(cleaned))
                subKind = 'définition';
            else if (RE_CONCERNANT.test(cleaned))
                subKind = 'concernant';
            else
                subKind = 'basique';
            stack.push(subKind);
        }
        else {
            lineIndent = stack.length;
            if (cleaned.endsWith(':')) {
                const kind = detectOpenerKind(cleaned);
                if (kind)
                    stack.push(kind);
            }
        }
        out.push(unit.repeat(lineIndent) + trimmed);
    }
    return out;
}
function formatText(text, options) {
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    const lines = text.split(/\r?\n/);
    return formatLines(lines, options).join(eol);
}
//# sourceMappingURL=formatter.js.map