/**
 * Garantit la présence des fichiers standalone générés (gitignorés) pour que
 * `ng build`/`ng serve donjon-creer` compile même sur une branche fraîche où
 * `build-all` (hors repo) n'a jamais tourné.
 *
 * - modeles-standalone.ts : (re)généré pour de vrai depuis actions.djn + nouveau.djn
 *   (toujours présents dans le repo).
 * - jouer-one-template.ts : généré pour de vrai si le bundle single-dist existe,
 *   sinon un PLACEHOLDER est écrit (uniquement s'il manque). Le vrai contenu est
 *   produit par generate-jouer-one-template.js dans build-all, après le build du
 *   bundle. Le placeholder suffit pour compiler : JOUER_ONE_HTML n'est consommé
 *   qu'en STANDALONE_MODE (export single-file), pas en dev/CI classique.
 *
 * Idempotent. Usage : node ensure-standalone.js
 */

const fs = require('fs');
const path = require('path');

const modelesSrc = path.join(__dirname, 'projects/donjon-creer/src/assets/modeles');
const standaloneDir = path.join(__dirname, 'projects/donjon-creer/src/app/standalone');
const modelesOut = path.join(standaloneDir, 'modeles-standalone.ts');
const templateOut = path.join(standaloneDir, 'jouer-one-template.ts');
const bundleHtml = path.join(__dirname, 'single-dist/donjon-jouer-bundle/index.html');

function echapper(contenu) {
  return contenu.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

fs.mkdirSync(standaloneDir, { recursive: true });

// 1. modeles-standalone.ts — sources toujours disponibles, on régénère.
const actionsDjn = echapper(fs.readFileSync(path.join(modelesSrc, 'actions.djn'), 'utf8'));
const nouveauDjn = echapper(fs.readFileSync(path.join(modelesSrc, 'nouveau.djn'), 'utf8'));
fs.writeFileSync(modelesOut, `// FICHIER GÉNÉRÉ — ne pas modifier manuellement.
// Régénéré par ensure-standalone.js / generate-modeles-bundle.js.

export const ACTIONS_DJN = \`${actionsDjn}\`;

export const NOUVEAU_DJN = \`${nouveauDjn}\`;
`, 'utf8');
console.log('modeles-standalone.ts : OK (généré depuis les .djn).');

// 2. jouer-one-template.ts — vrai contenu si le bundle existe, sinon placeholder.
if (fs.existsSync(bundleHtml)) {
  const html = echapper(fs.readFileSync(bundleHtml, 'utf8'));
  fs.writeFileSync(templateOut, `// FICHIER GÉNÉRÉ — ne pas modifier manuellement.
// Relancer generate-jouer-one-template.js après un build de donjon-jouer-bundle.

export const JOUER_ONE_HTML = \`${html}\`;
`, 'utf8');
  console.log('jouer-one-template.ts : OK (généré depuis le bundle single-dist).');
} else if (!fs.existsSync(templateOut)) {
  fs.writeFileSync(templateOut, `// FICHIER PLACEHOLDER GÉNÉRÉ — le bundle donjon-jouer n'a pas encore été buildé.
// Le vrai template est produit par generate-jouer-one-template.js (via build-all),
// après le build du bundle. Ce placeholder permet juste de compiler donjon-creer ;
// l'export single-file (STANDALONE_MODE) ne fonctionnera qu'après un vrai build.

export const JOUER_ONE_HTML = \`<!doctype html><html><head><meta charset="utf-8"><title>Donjon FI</title></head><body><p>Lecteur standalone non buildé — lancer build-all.</p></body></html>\`;
`, 'utf8');
  console.log('jouer-one-template.ts : placeholder écrit (bundle single-dist absent).');
} else {
  console.log('jouer-one-template.ts : déjà présent, conservé.');
}
