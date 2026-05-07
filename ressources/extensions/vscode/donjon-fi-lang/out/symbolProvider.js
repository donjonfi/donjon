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
exports.DonjonDocumentSymbolProvider = void 0;
const vscode = __importStar(require("vscode"));
const analysis_1 = require("./analysis");
class DonjonDocumentSymbolProvider {
    provideDocumentSymbols(document) {
        const { declarations } = (0, analysis_1.getAnalysis)(document);
        return declarations.map((d) => {
            const range = new vscode.Range(document.positionAt(d.declarationStart), document.positionAt(d.declarationEnd));
            const selection = new vscode.Range(document.positionAt(d.nameStart), document.positionAt(d.nameEnd));
            const kind = mapSymbolKind(d);
            const detail = symbolDetail(d);
            return new vscode.DocumentSymbol(d.displayName, detail, kind, range, selection);
        });
    }
}
exports.DonjonDocumentSymbolProvider = DonjonDocumentSymbolProvider;
function mapSymbolKind(d) {
    if (d.kind === 'type') {
        return vscode.SymbolKind.Class;
    }
    if (d.kind === 'routine' || d.kind === 'action') {
        return vscode.SymbolKind.Function;
    }
    const p = d.parent;
    if (p.startsWith('lieu')) {
        return vscode.SymbolKind.Module;
    }
    if (p.startsWith('liste')) {
        return vscode.SymbolKind.Array;
    }
    if (p.startsWith('compteur') || p.startsWith('nombre')) {
        return vscode.SymbolKind.Number;
    }
    if (p.startsWith('intitulé') || p.startsWith('texte')) {
        return vscode.SymbolKind.String;
    }
    if (p.startsWith('ressource')) {
        return vscode.SymbolKind.Field;
    }
    return vscode.SymbolKind.Object;
}
function symbolDetail(d) {
    if (d.kind === 'type') {
        return `type · ${d.parent}`;
    }
    if (d.kind === 'routine') {
        return 'routine';
    }
    if (d.kind === 'action') {
        return 'action';
    }
    return d.parent;
}
//# sourceMappingURL=symbolProvider.js.map