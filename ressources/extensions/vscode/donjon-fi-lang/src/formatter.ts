export interface FormatOptions {
  tabSize: number;
  insertSpaces: boolean;
}

type BlockKind =
  | 'action'
  | 'règle'
  | 'routine'
  | 'si'
  | 'réaction'
  | 'phase'
  | 'définition'
  | 'concernant'
  | 'basique';

const SUB_KINDS: ReadonlySet<BlockKind> = new Set(['phase', 'définition', 'concernant', 'basique']);

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

function finKindOf(word: string): BlockKind | undefined {
  const w = word.toLowerCase();
  if (w === 'action') return 'action';
  if (w === 'routine') return 'routine';
  if (w === 'règle' || w === 'règles') return 'règle';
  if (w === 'si') return 'si';
  if (w === 'réaction' || w === 'réactions') return 'réaction';
  return undefined;
}

function stripComment(line: string): string {
  let inString = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inString = !inString;
    } else if (!inString && c === '-' && line[i + 1] === '-') {
      return line.slice(0, i);
    }
  }
  return line;
}

function blankStrings(line: string): string {
  let result = '';
  let inString = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inString = !inString;
      result += c;
    } else if (inString) {
      result += ' ';
    } else {
      result += c;
    }
  }
  return result;
}

function cleanForCheck(line: string): string {
  return blankStrings(stripComment(line)).trim();
}

function popUntilKind(stack: BlockKind[], target: BlockKind): void {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i] === target) {
      stack.length = i;
      return;
    }
  }
}

function popSubBlocks(stack: BlockKind[]): void {
  while (stack.length > 0 && SUB_KINDS.has(stack[stack.length - 1])) {
    stack.pop();
  }
}

function detectOpenerKind(cleaned: string): BlockKind | undefined {
  if (RE_ACTION.test(cleaned)) return 'action';
  if (RE_REGLE.test(cleaned)) return 'règle';
  if (RE_ROUTINE.test(cleaned)) return 'routine';
  if (RE_SI.test(cleaned)) return 'si';
  if (RE_REACTIONS.test(cleaned)) return 'réaction';
  return undefined;
}

export function formatLines(lines: readonly string[], options: FormatOptions): string[] {
  const unit = options.insertSpaces ? ' '.repeat(Math.max(1, options.tabSize)) : '\t';
  const stack: BlockKind[] = [];
  const out: string[] = [];

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

    let lineIndent: number;
    const finMatch = cleaned.match(RE_FIN);

    if (finMatch) {
      const kind = finKindOf(finMatch[1]);
      if (kind) popUntilKind(stack, kind);
      lineIndent = stack.length;
    } else if (RE_SINON_LIKE.test(cleaned)) {
      lineIndent = Math.max(0, stack.length - 1);
    } else if (
      RE_PHASE.test(cleaned) ||
      RE_DEFINITION.test(cleaned) ||
      RE_CONCERNANT.test(cleaned) ||
      RE_BASIQUE.test(cleaned)
    ) {
      popSubBlocks(stack);
      lineIndent = stack.length;
      let subKind: BlockKind;
      if (RE_PHASE.test(cleaned)) subKind = 'phase';
      else if (RE_DEFINITION.test(cleaned)) subKind = 'définition';
      else if (RE_CONCERNANT.test(cleaned)) subKind = 'concernant';
      else subKind = 'basique';
      stack.push(subKind);
    } else {
      lineIndent = stack.length;
      if (cleaned.endsWith(':')) {
        const kind = detectOpenerKind(cleaned);
        if (kind) stack.push(kind);
      }
    }

    out.push(unit.repeat(lineIndent) + trimmed);
  }

  return out;
}

export function formatText(text: string, options: FormatOptions): string {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  return formatLines(lines, options).join(eol);
}
