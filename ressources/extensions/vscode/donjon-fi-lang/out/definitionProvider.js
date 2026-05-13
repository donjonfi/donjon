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
exports.DonjonDefinitionProvider = void 0;
const vscode = __importStar(require("vscode"));
const analysis_1 = require("./analysis");
const workspaceIndex_1 = require("./workspaceIndex");
class DonjonDefinitionProvider {
    async provideDefinition(document, position) {
        await (0, workspaceIndex_1.ensureScanned)();
        const analysis = (0, analysis_1.getAnalysis)(document);
        const offset = document.offsetAt(position);
        const occ = (0, analysis_1.findOccurrenceAt)(analysis, offset);
        if (!occ) {
            return undefined;
        }
        const matches = (0, workspaceIndex_1.getDeclarationsForName)(occ.kind, occ.name);
        if (matches.length === 0) {
            return undefined;
        }
        const locations = [];
        for (const dl of matches) {
            const targetDoc = await openOrFind(dl.uri);
            const start = targetDoc.positionAt(dl.decl.nameStart);
            const end = targetDoc.positionAt(dl.decl.nameEnd);
            locations.push(new vscode.Location(dl.uri, new vscode.Range(start, end)));
        }
        return locations;
    }
}
exports.DonjonDefinitionProvider = DonjonDefinitionProvider;
async function openOrFind(uri) {
    const opened = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
    if (opened) {
        return opened;
    }
    return vscode.workspace.openTextDocument(uri);
}
//# sourceMappingURL=definitionProvider.js.map