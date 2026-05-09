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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const semanticTokensProvider_1 = require("./semanticTokensProvider");
const symbolProvider_1 = require("./symbolProvider");
const definitionProvider_1 = require("./definitionProvider");
const hoverProvider_1 = require("./hoverProvider");
const documentLinkProvider_1 = require("./documentLinkProvider");
const renameProvider_1 = require("./renameProvider");
const analysis_1 = require("./analysis");
const workspaceIndex_1 = require("./workspaceIndex");
function activate(context) {
    const output = vscode.window.createOutputChannel('Donjon');
    output.appendLine(`[${new Date().toISOString()}] Extension Donjon FI activée.`);
    (0, semanticTokensProvider_1.attachOutput)(output);
    (0, workspaceIndex_1.attachOutput)(output);
    const selector = { language: 'donjon' };
    context.subscriptions.push(output);
    context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider(selector, new semanticTokensProvider_1.DonjonSemanticTokensProvider(), semanticTokensProvider_1.legend));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(selector, new symbolProvider_1.DonjonDocumentSymbolProvider()));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(selector, new definitionProvider_1.DonjonDefinitionProvider()));
    context.subscriptions.push(vscode.languages.registerHoverProvider(selector, new hoverProvider_1.DonjonHoverProvider()));
    context.subscriptions.push(vscode.languages.registerDocumentLinkProvider(selector, new documentLinkProvider_1.DonjonDocumentLinkProvider()));
    context.subscriptions.push(vscode.languages.registerRenameProvider(selector, new renameProvider_1.DonjonRenameProvider()));
    (0, workspaceIndex_1.activateWatcher)(context);
    void (0, workspaceIndex_1.ensureScanned)();
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument((doc) => (0, analysis_1.clearAnalysisCache)(doc.uri)));
}
function deactivate() {
    (0, analysis_1.clearAnalysisCache)();
    (0, workspaceIndex_1.disposeIndex)();
}
//# sourceMappingURL=extension.js.map