import { existsSync, readFileSync } from 'node:fs';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const packageVersion = readJson('package.json').version;
const checks = [
  ['package.json', packageVersion],
  ['manifest.json', readJson('manifest.json').version],
];

if (existsSync('dist/manifest.json')) {
  checks.push(['dist/manifest.json', readJson('dist/manifest.json').version]);
}

const mismatches = checks.filter(([, version]) => version !== packageVersion);

if (mismatches.length > 0) {
  console.error('Typetchi version check failed:');
  for (const [path, version] of checks) {
    console.error(`- ${path}: ${version ?? '(missing)'}`);
  }
  process.exit(1);
}

console.log(`Typetchi version check passed: ${packageVersion}`);
