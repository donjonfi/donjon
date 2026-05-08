#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// __dirname = <repo>/scripts/  →  repoRoot = <repo>/
const repoRoot = path.resolve(__dirname, '..');
const src = path.join(repoRoot, 'webapp', 'donjon', 'dist', 'donjon-compagnon-bundle', 'browser');
const dst = path.join(repoRoot, 'ressources', 'extensions', 'vscode', 'donjon-fi-compagnon', 'media', 'compagnon-app');

if (!fs.existsSync(src)) {
  console.error(`[sync-compagnon] Source introuvable : ${src}`);
  console.error('[sync-compagnon] Lancez d\'abord : ng build donjon-compagnon --configuration bundle');
  process.exit(1);
}

fs.rmSync(dst, { recursive: true, force: true });
fs.mkdirSync(dst, { recursive: true });
fs.cpSync(src, dst, { recursive: true });

console.log(`[sync-compagnon] ${src}`);
console.log(`[sync-compagnon]   -> ${dst}`);
