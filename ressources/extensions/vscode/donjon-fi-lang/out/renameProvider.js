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
exports.DonjonRenameProvider = void 0;
const vscode = __importStar(require("vscode"));
const analysis_1 = require("./analysis");
const workspaceIndex_1 = require("./workspaceIndex");
class DonjonRenameProvider {
    async prepareRename(document, position) {
        await (0, workspaceIndex_1.ensureScanned)();
        const analysis = (0, analysis_1.getAnalysis)(document);
        const offset = document.offsetAt(position);
        const target = findRenameTarget(document, analysis, offset);
        if (!target) {
            throw new Error('Cet élément ne peut pas être renommé ici.');
        }
        return { range: target.range, placeholder: target.displayName };
    }
    async provideRenameEdits(document, position, newName) {
        await (0, workspaceIndex_1.ensureScanned)();
        const analysis = (0, analysis_1.getAnalysis)(document);
        const offset = document.offsetAt(position);
        const target = findRenameTarget(document, analysis, offset);
        if (!target) {
            throw new Error('Cet élément ne peut pas être renommé ici.');
        }
        validateNewName(target.kind, newName);
        const edit = new vscode.WorkspaceEdit();
        for (const uri of (0, workspaceIndex_1.getAllFileUris)()) {
            const doc = await openOrFind(uri);
            const fileAnalysis = (0, analysis_1.getAnalysis)(doc);
            // Var/type : occurrences contiennent déjà le span de la déclaration et toutes les références.
            // Routine : occurrences contiennent uniquement les `exécuter routine X` ; le nom dans `routine X:`
            //           est ajouté séparément via `analysis.declarations`.
            for (const occ of fileAnalysis.occurrences) {
                if (occ.kind === target.kind && occ.name === target.name) {
                    const range = new vscode.Range(doc.positionAt(occ.start), doc.positionAt(occ.end));
                    edit.replace(uri, range, newName);
                }
            }
            if (target.kind === 'routine') {
                for (const decl of fileAnalysis.declarations) {
                    if (decl.kind === 'routine' && decl.name === target.name) {
                        const range = new vscode.Range(doc.positionAt(decl.nameStart), doc.positionAt(decl.nameEnd));
                        edit.replace(uri, range, newName);
                    }
                }
            }
        }
        return edit;
    }
}
exports.DonjonRenameProvider = DonjonRenameProvider;
function findRenameTarget(document, analysis, offset) {
    const occ = (0, analysis_1.findOccurrenceAt)(analysis, offset);
    if (occ) {
        if (occ.kind === 'action') {
            return undefined;
        }
        const local = analysis.declarationsByName.get(`${occ.kind}:${occ.name}`);
        return {
            kind: occ.kind,
            name: occ.name,
            displayName: local?.displayName ?? occ.name,
            range: new vscode.Range(document.positionAt(occ.start), document.positionAt(occ.end)),
        };
    }
    // Le nom dans `routine X:` n'est pas dans les occurrences : on le détecte via les déclarations locales.
    for (const d of analysis.declarations) {
        if (offset >= d.nameStart && offset <= d.nameEnd) {
            if (d.kind === 'action') {
                return undefined;
            }
            return {
                kind: d.kind,
                name: d.name,
                displayName: d.displayName,
                range: new vscode.Range(document.positionAt(d.nameStart), document.positionAt(d.nameEnd)),
            };
        }
    }
    return undefined;
}
function validateNewName(kind, newName) {
    const trimmed = newName.trim();
    if (trimmed.length < 1) {
        throw new Error('Le nouveau nom ne peut pas être vide.');
    }
    if (trimmed !== newName) {
        throw new Error('Le nouveau nom ne peut pas commencer ou finir par un espace.');
    }
    if (kind === 'routine') {
        if (!/^[\p{L}_][\p{L}\p{M}\p{N}_-]*$/u.test(trimmed)) {
            throw new Error('Le nom d’une routine doit être un identifiant (lettres, chiffres, tirets ou soulignés ; pas d’espace).');
        }
    }
    else {
        if (!/^[\p{L}][\p{L}\p{M}\p{N}\-'’ ]*$/u.test(trimmed)) {
            throw new Error('Nom invalide : doit commencer par une lettre et ne contenir que des lettres, chiffres, tirets, apostrophes ou espaces.');
        }
    }
}
async function openOrFind(uri) {
    const opened = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
    if (opened) {
        return opened;
    }
    return vscode.workspace.openTextDocument(uri);
}
//# sourceMappingURL=renameProvider.js.map