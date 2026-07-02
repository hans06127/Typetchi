import { readFileSync } from 'node:fs';

const keys = ['PET_STATE', 'WIDGET_STATE', 'SETTINGS', 'TYPING_STATS', 'DAILY_MISSIONS', 'SCHEMA_VERSION'];
const source = readFileSync('src/storage/storageKeys.ts', 'utf8');
const missing = keys.filter((key) => !source.includes(key));
if (missing.length) {
  console.error(`Typetchi storage check failed; missing keys: ${missing.join(', ')}`);
  process.exit(1);
}
const defaults = readFileSync('src/config/defaultState.ts', 'utf8');
for (const symbol of ['defaultPetState', 'defaultWidgetState', 'CURRENT_STORAGE_SCHEMA_VERSION']) {
  if (!defaults.includes(symbol)) {
    console.error(`Typetchi storage check failed; missing default symbol: ${symbol}`);
    process.exit(1);
  }
}
console.log('Typetchi storage check passed');
