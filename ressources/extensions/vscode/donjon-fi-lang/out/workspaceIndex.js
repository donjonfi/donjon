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
exports.attachOutput = attachOutput;
exports.getGlobalDeclVersion = getGlobalDeclVersion;
exports.getDeclarationsForName = getDeclarationsForName;
exports.getAllDeclarations = getAllDeclarations;
exports.getAllFileUris = getAllFileUris;
exports.ensureScanned = ensureScanned;
exports.updateFromDocument = updateFromDocument;
exports.removeFile = removeFile;
exports.activateWatcher = activateWatcher;
exports.disposeIndex = disposeIndex;
const vscode = __importStar(require("vscode"));
const declarationScanner_1 = require("./declarationScanner");
const files = new Map();
let globalDeclVersion = 0;
let scanned = false;
let scanning;
let output;
function attachOutput(channel) {
    output = channel;
}
function getGlobalDeclVersion() {
    return globalDeclVersion;
}
function getDeclarationsForName(kind, name) {
    const out = [];
    for (const entry of files.values()) {
        for (const decl of entry.declarations) {
            if (decl.kind === kind && decl.name === name) {
                out.push({ decl, uri: entry.uri });
            }
        }
    }
    return out;
}
function getAllDeclarations() {
    const out = [];
    for (const entry of files.values()) {
        for (const decl of entry.declarations) {
            out.push(decl);
        }
    }
    return out;
}
function getAllFileUris() {
    return [...files.values()].map((f) => f.uri);
}
/** Scan initial du workspace (idempotent ; safe à appeler plusieurs fois en parallèle). */
async function ensureScanned() {
    if (scanned) {
        return;
    }
    if (scanning) {
        return scanning;
    }
    scanning = (async () => {
        try {
            const uris = await vscode.workspace.findFiles('**/*.djn', '**/node_modules/**');
            for (const uri of uris) {
                await scanFromDisk(uri);
            }
            // Override pour tout document Donjon déjà ouvert (texte non sauvegardé prioritaire).
            for (const doc of vscode.workspace.textDocuments) {
                if (doc.languageId === 'donjon') {
                    updateFromDocument(doc);
                }
            }
            scanned = true;
            output?.appendLine(`[${new Date().toISOString()}] Index workspace : ${files.size} fichier(s), ${countDecls()} déclaration(s).`);
        }
        finally {
            scanning = undefined;
        }
    })();
    return scanning;
}
async function scanFromDisk(uri) {
    // Si une version "ouverte" existe déjà, ne pas écraser avec le contenu disque.
    const existing = files.get(uri.toString());
    if (existing && existing.version >= 0) {
        return;
    }
    let text;
    try {
        const data = await vscode.workspace.fs.readFile(uri);
        text = Buffer.from(data).toString('utf8');
    }
    catch {
        files.delete(uri.toString());
        globalDeclVersion++;
        return;
    }
    setEntry(uri, -1, (0, declarationScanner_1.findDeclarations)(text));
}
function updateFromDocument(document) {
    if (document.languageId !== 'donjon') {
        return;
    }
    const key = document.uri.toString();
    const existing = files.get(key);
    if (existing && existing.version === document.version) {
        return;
    }
    setEntry(document.uri, document.version, (0, declarationScanner_1.findDeclarations)(document.getText()));
}
function removeFile(uri) {
    const key = uri.toString();
    if (!files.has(key)) {
        return;
    }
    files.delete(key);
    globalDeclVersion++;
}
function setEntry(uri, version, declarations) {
    const key = uri.toString();
    const prev = files.get(key);
    files.set(key, { uri, version, declarations });
    if (!prev || !sameDeclarations(prev.declarations, declarations)) {
        globalDeclVersion++;
    }
}
function sameDeclarations(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        const x = a[i];
        const y = b[i];
        if (x.kind !== y.kind ||
            x.name !== y.name ||
            x.declarationStart !== y.declarationStart ||
            x.nameStart !== y.nameStart) {
            return false;
        }
    }
    return true;
}
function countDecls() {
    let n = 0;
    for (const f of files.values()) {
        n += f.declarations.length;
    }
    return n;
}
function activateWatcher(context) {
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.djn');
    watcher.onDidCreate((uri) => {
        void scanFromDisk(uri);
    });
    watcher.onDidChange((uri) => {
        // Si le fichier est ouvert dans un éditeur, onDidChangeTextDocument couvre déjà les édits.
        // Le watcher fire uniquement sur sauvegarde, donc on rescanne le disque pour s'assurer
        // d'avoir la version persistée (cas d'une sauvegarde externe ou via `git checkout`).
        const opened = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString() && !d.isUntitled);
        if (!opened) {
            void scanFromDisk(uri);
        }
    });
    watcher.onDidDelete((uri) => removeFile(uri));
    context.subscriptions.push(watcher);
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.languageId === 'donjon') {
            updateFromDocument(e.document);
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((doc) => {
        if (doc.languageId === 'donjon') {
            updateFromDocument(doc);
        }
    }));
}
function disposeIndex() {
    files.clear();
    scanned = false;
    globalDeclVersion = 0;
}
//# sourceMappingURL=workspaceIndex.js.map