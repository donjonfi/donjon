"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const formatter_1 = require("./formatter");
const OPT = { tabSize: 2, insertSpaces: true };
function fmt(text, options = OPT) {
    return (0, formatter_1.formatText)(text, options);
}
(0, node_test_1.describe)('formatter — règle de base ":" / "fin"', () => {
    (0, node_test_1.it)('indente la ligne après une instruction terminée par ":"', () => {
        const input = ['action sauter:', 'dire "Vous sautez.".', 'fin action'].join('\n');
        const expected = ['action sauter:', '  dire "Vous sautez.".', 'fin action'].join('\n');
        strict_1.default.equal(fmt(input), expected);
    });
    (0, node_test_1.it)('désindente sur "fin <kind>"', () => {
        const input = ['routine remercier:', '  dire "Merci.".', 'fin routine', 'dire "après".'].join('\n');
        const expected = [
            'routine remercier:',
            '  dire "Merci.".',
            'fin routine',
            'dire "après".',
        ].join('\n');
        strict_1.default.equal(fmt(input), expected);
    });
    (0, node_test_1.it)('imbrique correctement si dans action', () => {
        const input = [
            'action pousser ceci:',
            'si ceci est lourd:',
            'refuser "Trop lourd.".',
            'fin si',
            'fin action',
        ].join('\n');
        const expected = [
            'action pousser ceci:',
            '  si ceci est lourd:',
            '    refuser "Trop lourd.".',
            '  fin si',
            'fin action',
        ].join('\n');
        strict_1.default.equal(fmt(input), expected);
    });
});
(0, node_test_1.describe)('formatter — sinon / sinonsi', () => {
    (0, node_test_1.it)('désindente sinon puis ré-indente le corps', () => {
        const input = ['si X:', 'dire "A".', 'sinon', 'dire "B".', 'fin si'].join('\n');
        const expected = ['si X:', '  dire "A".', 'sinon', '  dire "B".', 'fin si'].join('\n');
        strict_1.default.equal(fmt(input), expected);
    });
    (0, node_test_1.it)('chaîne sinonsi / sinon', () => {
        const input = [
            'si X:',
            'dire "A".',
            'sinonsi Y:',
            'dire "B".',
            'sinon',
            'dire "C".',
            'fin si',
        ].join('\n');
        const expected = [
            'si X:',
            '  dire "A".',
            'sinonsi Y:',
            '  dire "B".',
            'sinon',
            '  dire "C".',
            'fin si',
        ].join('\n');
        strict_1.default.equal(fmt(input), expected);
    });
});
(0, node_test_1.describe)('formatter — phases (sous-blocs sans fin)', () => {
    (0, node_test_1.it)('garde les phases au même niveau dans une action', () => {
        const input = [
            'action pousser ceci:',
            'phase prérequis:',
            'si ceci n\'est pas accessible, refuser "Pas accessible.".',
            'phase exécution:',
            'changer ceci est déplacé.',
            'phase épilogue:',
            'dire "Poussé.".',
            'fin action',
        ].join('\n');
        const expected = [
            'action pousser ceci:',
            '  phase prérequis:',
            '    si ceci n\'est pas accessible, refuser "Pas accessible.".',
            '  phase exécution:',
            '    changer ceci est déplacé.',
            '  phase épilogue:',
            '    dire "Poussé.".',
            'fin action',
        ].join('\n');
        strict_1.default.equal(fmt(input), expected);
    });
    (0, node_test_1.it)('gère définition avant phase', () => {
        const input = [
            'action examiner ceci:',
            'définition:',
            'ceci est un objet visible.',
            'phase exécution:',
            'dire "[description ceci]".',
            'fin action',
        ].join('\n');
        const expected = [
            'action examiner ceci:',
            '  définition:',
            '    ceci est un objet visible.',
            '  phase exécution:',
            '    dire "[description ceci]".',
            'fin action',
        ].join('\n');
        strict_1.default.equal(fmt(input), expected);
    });
});
(0, node_test_1.describe)('formatter — réactions', () => {
    (0, node_test_1.it)('garde concernant et basique au même niveau', () => {
        const input = [
            'réactions du berger:',
            'concernant la pomme:',
            'dire "Belle pomme.".',
            'concernant le pré:',
            'dire "Le pré est vert.".',
            'basique:',
            'dire "Hmm.".',
            'fin réactions',
        ].join('\n');
        const expected = [
            'réactions du berger:',
            '  concernant la pomme:',
            '    dire "Belle pomme.".',
            '  concernant le pré:',
            '    dire "Le pré est vert.".',
            '  basique:',
            '    dire "Hmm.".',
            'fin réactions',
        ].join('\n');
        strict_1.default.equal(fmt(input), expected);
    });
});
(0, node_test_1.describe)('formatter — commentaires et chaînes', () => {
    (0, node_test_1.it)("ignore les ':' à l'intérieur d'une chaîne", () => {
        const input = ['dire "format X:Y".', 'fin action'].join('\n');
        const formatted = fmt(input);
        strict_1.default.ok(formatted.startsWith('dire'));
    });
    (0, node_test_1.it)("ignore les ':' dans un commentaire de fin de ligne", () => {
        const input = ['action sauter: -- commentaire avec :', 'dire "ok".', 'fin action'].join('\n');
        const expected = [
            'action sauter: -- commentaire avec :',
            '  dire "ok".',
            'fin action',
        ].join('\n');
        strict_1.default.equal(fmt(input), expected);
    });
    (0, node_test_1.it)('préserve les lignes vides', () => {
        const input = ['action sauter:', '', '  dire "ok".', '', 'fin action'].join('\n');
        const expected = ['action sauter:', '', '  dire "ok".', '', 'fin action'].join('\n');
        strict_1.default.equal(fmt(input), expected);
    });
    (0, node_test_1.it)('normalise les lignes blanches (espaces seuls)', () => {
        const input = ['action sauter:', '   ', '  dire "ok".', 'fin action'].join('\n');
        const expected = ['action sauter:', '', '  dire "ok".', 'fin action'].join('\n');
        strict_1.default.equal(fmt(input), expected);
    });
});
(0, node_test_1.describe)('formatter — options', () => {
    (0, node_test_1.it)('respecte tabSize=4', () => {
        const input = ['action sauter:', 'dire "ok".', 'fin action'].join('\n');
        const expected = ['action sauter:', '    dire "ok".', 'fin action'].join('\n');
        strict_1.default.equal(fmt(input, { tabSize: 4, insertSpaces: true }), expected);
    });
    (0, node_test_1.it)('utilise des tabulations quand insertSpaces=false', () => {
        const input = ['action sauter:', 'dire "ok".', 'fin action'].join('\n');
        const expected = ['action sauter:', '\tdire "ok".', 'fin action'].join('\n');
        strict_1.default.equal(fmt(input, { tabSize: 2, insertSpaces: false }), expected);
    });
    (0, node_test_1.it)("préserve les fins de ligne \\r\\n", () => {
        const input = ['action sauter:', 'dire "ok".', 'fin action'].join('\r\n');
        const expected = ['action sauter:', '  dire "ok".', 'fin action'].join('\r\n');
        strict_1.default.equal(fmt(input), expected);
    });
});
(0, node_test_1.describe)('formatter — instructions inline (sans ":")', () => {
    (0, node_test_1.it)('n\'indente pas après une instruction inline si/refuser', () => {
        const input = [
            'règle avant prendre la pomme:',
            'si la pomme est pourrie, refuser "Pourrie.".',
            'continuer l\'action.',
            'fin règle',
        ].join('\n');
        const expected = [
            'règle avant prendre la pomme:',
            '  si la pomme est pourrie, refuser "Pourrie.".',
            '  continuer l\'action.',
            'fin règle',
        ].join('\n');
        strict_1.default.equal(fmt(input), expected);
    });
});
//# sourceMappingURL=formatter.test.js.map