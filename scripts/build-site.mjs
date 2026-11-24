/**
 * Beyond 3D — Static Site Builder (`npm run build:site`)
 * Outputs a clean, offline-safe static bundle to `_site/` ready for GitHub Pages.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(rootDir, '_site');
const babylonSrc = path.join(rootDir, 'node_modules', 'babylonjs', 'babylon.js');

if (!fs.existsSync(babylonSrc)) {
  throw new Error('Missing node_modules/babylonjs/babylon.js — run `npm install` first.');
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, 'vendor'), { recursive: true });

// Copy full ESM source tree
fs.cpSync(path.join(rootDir, 'src'), path.join(outDir, 'src'), { recursive: true });
// Copy vendored Babylon.js bundle
fs.copyFileSync(babylonSrc, path.join(outDir, 'vendor', 'babylon.js'));

// Root redirect preserving query params (e.g. ?level=14)
const redirectHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>维度之外 · Beyond 3D</title>
  <script>
    window.location.replace('./src/ui/index.html' + window.location.search + window.location.hash);
  </script>
</head>
<body style="background:#120f0b;color:#f6f4ee;font-family:sans-serif;padding:2rem;">
  正在进入《维度之外 · Beyond 3D》… <a href="./src/ui/index.html" style="color:#f7c346;">点击这里继续</a>
</body>
</html>
`;
fs.writeFileSync(path.join(outDir, 'index.html'), redirectHtml, 'utf8');
fs.writeFileSync(path.join(outDir, '.nojekyll'), '', 'utf8');

console.log(`✓ Static site built cleanly at ${outDir}`);
