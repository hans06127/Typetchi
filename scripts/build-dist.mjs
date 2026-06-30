import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));

mkdirSync('dist/content', { recursive: true });
mkdirSync('dist/background', { recursive: true });
mkdirSync('dist/popup', { recursive: true });
writeFileSync('dist/manifest.json', `${JSON.stringify({ ...manifest, version: packageJson.version }, null, 2)}\n`);

writeFileSync('dist/background/service-worker.js', `chrome.runtime.onInstalled.addListener(() => {\n  console.info('Typetchi installed and ready to grow with your words.');\n});\n`);
copyFileSync('scripts/content-dist.js', 'dist/content/index.js');
copyFileSync('popup/index.html', 'dist/popup/index.html');
copyFileSync('popup/popup.css', 'dist/popup/popup.css');
copyFileSync('popup/popup.js', 'dist/popup/popup.js');
