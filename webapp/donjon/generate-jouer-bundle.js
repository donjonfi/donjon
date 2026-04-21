/**
 * Génère projects/donjon-jouer/src/app/standalone/jouer-standalone.ts
 * à partir de assets/modeles/actions.djn.
 * À relancer si actions.djn est modifié.
 * Usage : node generate-jouer-bundle.js
 */

const fs = require('fs');
const path = require('path');

const modelesSrc = path.join(__dirname, 'projects/donjon-jouer/src/assets/modeles');
const outFile = path.join(__dirname, 'projects/donjon-jouer/src/app/standalone/jouer-standalone.ts');

function echapper(contenu) {
  return contenu.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

const actionsDjn = echapper(fs.readFileSync(path.join(modelesSrc, 'actions_mini.djn'), 'utf8'));

const out = `// FICHIER GÉNÉRÉ — ne pas modifier manuellement.
// Relancer generate-jouer-bundle.js pour mettre à jour.

export const ACTIONS_DJN = \`${actionsDjn}\`;
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, out, 'utf8');
console.log('Bundle généré :', path.relative(__dirname, outFile));
