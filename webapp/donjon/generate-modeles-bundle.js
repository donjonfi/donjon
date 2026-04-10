/**
 * Génère projects/donjon-creer/src/app/standalone/modeles-standalone.ts
 * à partir de assets/modeles/actions.djn et nouveau.djn.
 * À relancer si l'un de ces fichiers est modifié.
 * Usage : node generate-modeles-bundle.js
 */

const fs = require('fs');
const path = require('path');

const modelesSrc = path.join(__dirname, 'projects/donjon-creer/src/assets/modeles');
const outFile = path.join(__dirname, 'projects/donjon-creer/src/app/standalone/modeles-standalone.ts');

function lireFichier(nom) {
  const contenu = fs.readFileSync(path.join(modelesSrc, nom), 'utf8');
  return contenu.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

const actionsDjn = lireFichier('actions.djn');
const nouveauDjn = lireFichier('nouveau.djn');

const out = `// FICHIER GÉNÉRÉ — ne pas modifier manuellement.
// Relancer generate-modeles-bundle.js pour mettre à jour.

export const ACTIONS_DJN = \`${actionsDjn}\`;

export const NOUVEAU_DJN = \`${nouveauDjn}\`;
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, out, 'utf8');
console.log('Bundle généré :', path.relative(__dirname, outFile));
