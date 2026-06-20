/**
 * inline-single-file.js — distribution « tout-en-un » Donjon FI.
 *
 * Inline le CSS et le JS locaux du index.html produit par Angular pour obtenir
 * un fichier HTML autonome (les images/sons restent référencés). Remplace
 * l'ancienne chaîne gulp + gulp-inline (dépendances non maintenues) — zéro
 * dépendance, modules Node intégrés (fs/path) uniquement.
 *
 * Usage :
 *   node inline-single-file.js <input-html> <out-dir>
 *
 * - Lit <input-html> (ex. dist/donjon-one/browser/index.html).
 * - Inline chaque <link rel="stylesheet" href="LOCAL"> en <style>…</style>.
 * - Inline chaque <script src="LOCAL" …></script> en <script …>…</script>
 *   (tous les attributs conservés sauf src).
 * - Écrit le résultat dans <out-dir>/index.html.
 *
 * Ne touche pas : les balises commentées (<!-- … -->), les <link> non-stylesheet
 * (modulepreload, icon…), les <script> inline (sans src), et toute ressource dont
 * l'URL est absolue (http(s):// ou //). Les chemins sont résolus relativement au
 * dossier du HTML d'entrée.
 */

const fs = require('fs');
const path = require('path');

function usage(msg) {
  if (msg) console.error('Erreur : ' + msg);
  console.error('Usage : node inline-single-file.js <input-html> <out-dir>');
  process.exit(1);
}

const [, , inputHtml, outDir] = process.argv;
if (!inputHtml || !outDir) usage('arguments manquants');
if (!fs.existsSync(inputHtml)) usage('fichier introuvable : ' + inputHtml);

const baseDir = path.dirname(inputHtml);

/** Une URL est locale si elle n'est ni protocole-relative (//…) ni absolue (proto://host). */
function isLocal(href) {
  if (!href) return false;
  if (href.slice(0, 2) === '//') return false;
  try {
    const u = new URL(href);
    if (u.host) return false; // http://…, https://… => distant
  } catch (e) {
    // new URL leve sans base pour un chemin relatif => c'est local
  }
  return true;
}

/** Lit le contenu local reference, ou null si introuvable. */
function readLocalAsset(ref) {
  const file = path.join(baseDir, ref.replace(/[?#].*$/, ''));
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

/** Extrait la valeur d'un attribut depuis une chaine d'attributs (sans guillemets). */
function getAttr(attrs, name) {
  const re = new RegExp(name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i');
  const m = attrs.match(re);
  if (!m) return null;
  return m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
}

let html = fs.readFileSync(inputHtml, 'utf8');

// Met les commentaires HTML de cote pour ne pas inliner une balise commentee
// (ex. un <link rel="stylesheet"> mis en commentaire dans index.html).
const SENTINEL = String.fromCharCode(0); // octet NUL, absent d'un HTML valide
const comments = [];
html = html.replace(/<!--[\s\S]*?-->/g, (c) => {
  comments.push(c);
  return SENTINEL + 'C' + (comments.length - 1) + SENTINEL;
});

// --- CSS : <link rel="stylesheet" href="LOCAL"> -> <style>...</style> ---
html = html.replace(/<link\b[^>]*>/gi, (tag) => {
  const rel = getAttr(tag, 'rel');
  if (!rel || rel.toLowerCase() !== 'stylesheet') return tag;
  const href = getAttr(tag, 'href');
  if (!isLocal(href)) return tag;
  const css = readLocalAsset(href);
  if (css === null) return tag;
  const media = getAttr(tag, 'media');
  const mediaAttr = media ? ' media="' + media + '"' : '';
  return '<style' + mediaAttr + '>\n' + css + '\n</style>';
});

// --- JS : <script src="LOCAL" ...></script> -> <script ...>...</script> (sans src) ---
html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (tag, attrs) => {
  const src = getAttr(attrs, 'src');
  if (!src) return tag;            // script inline -> inchange
  if (!isLocal(src)) return tag;   // src distant -> inchange
  const js = readLocalAsset(src);
  if (js === null) return tag;
  // retire l'attribut src, conserve tous les autres (type="module"...) tels quels
  const rest = attrs.replace(/\s*src\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, '');
  return '<script' + rest + '>\n' + js + '\n</script>';
});

// Restaure les commentaires HTML.
html = html.replace(new RegExp(SENTINEL + 'C(\\d+)' + SENTINEL, 'g'), (m, i) => comments[+i]);

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'index.html');
fs.writeFileSync(outFile, html);
console.log('Inline : ' + inputHtml + ' -> ' + outFile);
