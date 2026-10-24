// Serveur statique minimal pour les tests e2e (sans dépendance).
// Usage : node e2e/serveur-statique.mjs <dossier> <port>
// Toute route inconnue renvoie index.html (routage Angular, ex. /coince_v3).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const [dossierArg, portArg] = process.argv.slice(2);
const racine = resolve(dossierArg);
const port = Number(portArg);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.djn': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

createServer(async (req, res) => {
  const chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const fichier = normalize(join(racine, chemin));
  if (!fichier.startsWith(racine)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const contenu = await readFile(fichier);
    res.writeHead(200, { 'Content-Type': TYPES[extname(fichier)] ?? 'application/octet-stream' }).end(contenu);
  } catch {
    // fichier absent : un asset manquant reste un 404, une route renvoie l'appli
    if (extname(chemin)) {
      res.writeHead(404).end();
    } else {
      res.writeHead(200, { 'Content-Type': TYPES['.html'] }).end(await readFile(join(racine, 'index.html')));
    }
  }
}).listen(port, '127.0.0.1', () => console.log(`${racine} servi sur http://127.0.0.1:${port}`));
