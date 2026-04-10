/**
 * Génère projects/donjon-creer/src/app/standalone/jouer-one-template.ts
 * à partir de single-dist/donjon-jouer-bundle/index.html.
 * À relancer après chaque build de donjon-jouer-bundle + gulp.
 * Usage : node generate-jouer-one-template.js
 */

const fs = require('fs');
const path = require('path');

const srcHtml = path.join(__dirname, 'single-dist/donjon-jouer-bundle/index.html');
const outFile = path.join(__dirname, 'projects/donjon-creer/src/app/standalone/jouer-one-template.ts');

if (!fs.existsSync(srcHtml)) {
  console.error('Fichier source introuvable :', srcHtml);
  console.error('Lancer build-bundle.ps1 d\'abord.');
  process.exit(1);
}

const html = fs.readFileSync(srcHtml, 'utf8');
const escaped = html.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

const out = `// FICHIER GÉNÉRÉ — ne pas modifier manuellement.
// Relancer generate-jouer-one-template.js après un build de donjon-jouer-bundle.

export const JOUER_ONE_HTML = \`${escaped}\`;
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, out, 'utf8');
const sizeKb = Math.round(Buffer.byteLength(out, 'utf8') / 1024);
console.log(`Template généré : ${path.relative(__dirname, outFile)} (${sizeKb} KB)`);
