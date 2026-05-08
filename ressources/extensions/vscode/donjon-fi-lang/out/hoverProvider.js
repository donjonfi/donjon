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
exports.DonjonHoverProvider = void 0;
const vscode = __importStar(require("vscode"));
const analysis_1 = require("./analysis");
class DonjonHoverProvider {
    provideHover(document, position) {
        const analysis = (0, analysis_1.getAnalysis)(document);
        if (analysis.declarations.length === 0) {
            return undefined;
        }
        const offset = document.offsetAt(position);
        const occ = (0, analysis_1.findOccurrenceAt)(analysis, offset);
        if (!occ) {
            return undefined;
        }
        const decl = (0, analysis_1.declarationForOccurrence)(analysis, occ);
        if (!decl) {
            return undefined;
        }
        const md = new vscode.MarkdownString();
        md.isTrusted = false;
        if (decl.kind === 'type') {
            md.appendMarkdown(`**${decl.displayName}**\n\n*type · sous-type de \`${decl.parent}\`*`);
        }
        else if (decl.kind === 'routine') {
            md.appendMarkdown(`**${decl.displayName}**\n\n*routine*`);
        }
        else if (decl.kind === 'action') {
            md.appendMarkdown(`**${decl.displayName}**\n\n*action*`);
        }
        else {
            md.appendMarkdown(`**${decl.displayName}**\n\n*${decl.parent}*`);
        }
        const declLine = document.positionAt(decl.declarationStart).line + 1;
        md.appendMarkdown(`\n\nDéclarée ligne ${declLine}.`);
        const range = new vscode.Range(document.positionAt(occ.start), document.positionAt(occ.end));
        return new vscode.Hover(md, range);
    }
}
exports.DonjonHoverProvider = DonjonHoverProvider;
//# sourceMappingURL=hoverProvider.js.map