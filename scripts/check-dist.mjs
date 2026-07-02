import { existsSync, readFileSync } from 'node:fs';

const required = ['dist/manifest.json', 'dist/content/index.js', 'dist/popup/index.html', 'dist/popup/popup.js', 'dist/popup/popup.css'];
const missing = required.filter((path) => !existsSync(path));
if (missing.length) {
  console.error(`Typetchi dist check failed; missing: ${missing.join(', ')}`);
  process.exit(1);
}
const runtime = readFileSync('dist/content/index.js', 'utf8');
const packageVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;
if (!runtime.includes(`Typetchi runtime v${packageVersion}`)) {
  console.error(`Typetchi dist check failed; runtime marker for v${packageVersion} is missing`);
  process.exit(1);
}
console.log(`Typetchi dist check passed: runtime v${packageVersion}`);
