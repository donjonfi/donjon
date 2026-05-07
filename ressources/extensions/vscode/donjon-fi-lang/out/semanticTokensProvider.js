"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonjonSemanticTokensProvider = exports.legend = void 0;
exports.attachOutput = attachOutput;
const vscode = __importStar(require("vscode"));
const analysis_1 = require("./analysis");
const tokenTypes = ['variable', 'type'];
const tokenModifiers = [];
exports.legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);
let output;
let firstCall = true;
function attachOutput(channel) {
    output = channel;
}
class DonjonSemanticTokensProvider {
    provideDocumentSemanticTokens(document) {
        const { declarations, occurrences } = (0, analysis_1.getAnalysis)(document);
        if (firstCall && output) {
            firstCall = false;
            output.appendLine(`[${new Date().toISOString()}] Premier scan : ${declarations.length} déclarations, ${occurrences.length} occurrences (${document.uri.fsPath}).`);
            for (const d of declarations) {
                output.appendLine(`  ${d.kind}\t${d.name}\t(${d.parent})`);
            }
        }
        else if (output) {
            output.appendLine(`[${new Date().toISOString()}] Scan : ${declarations.length} déclarations, ${occurrences.length} occurrences.`);
        }
        const builder = new vscode.SemanticTokensBuilder(exports.legend);
        for (const { start, end, kind } of occurrences) {
            if (kind !== 'variable' && kind !== 'type') {
                continue;
            }
            const startPos = document.positionAt(start);
            const endPos = document.positionAt(end);
            if (startPos.line !== endPos.line) {
                continue;
            }
            builder.push(new vscode.Range(startPos, endPos), kind, []);
        }
        return builder.build();
    }
}
exports.DonjonSemanticTokensProvider = DonjonSemanticTokensProvider;
//# sourceMappingURL=semanticTokensProvider.js.map