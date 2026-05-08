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
exports.DonjonDocumentLinkProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
/**
 * Rend cliquables les noms de fichiers dans les directives `inclure "X.djn"`.
 * Le chemin est résolu relativement au fichier courant.
 */
class DonjonDocumentLinkProvider {
    static REGEX = /^(\s*inclure\s+")([^"]+)"/i;
    provideDocumentLinks(document) {
        const links = [];
        const docDir = path.dirname(document.uri.fsPath);
        for (let i = 0; i < document.lineCount; i++) {
            const ligne = document.lineAt(i).text;
            const match = DonjonDocumentLinkProvider.REGEX.exec(ligne);
            if (!match) {
                continue;
            }
            const fichier = match[2];
            const start = match[1].length;
            const end = start + fichier.length;
            const range = new vscode.Range(i, start, i, end);
            const cheminAbs = path.isAbsolute(fichier) ? fichier : path.resolve(docDir, fichier);
            const link = new vscode.DocumentLink(range, vscode.Uri.file(cheminAbs));
            link.tooltip = `Ouvrir ${fichier}`;
            links.push(link);
        }
        return links;
    }
}
exports.DonjonDocumentLinkProvider = DonjonDocumentLinkProvider;
//# sourceMappingURL=documentLinkProvider.js.map