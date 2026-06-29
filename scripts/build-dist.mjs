import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('dist/content', { recursive: true });
mkdirSync('dist/background', { recursive: true });
copyFileSync('manifest.json', 'dist/manifest.json');

writeFileSync('dist/background/service-worker.js', `chrome.runtime.onInstalled.addListener(() => {\n  console.info('Typetchi installed and ready to grow with your words.');\n});\n`);
copyFileSync('scripts/content-dist.js', 'dist/content/index.js');
