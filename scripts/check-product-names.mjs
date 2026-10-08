// Enforces the one-config-value rule: product names appear literally only in src/config/site.ts.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const NAMES = ['Nirvigna Compliance', 'Nirvigna Food Safety'];
const ALLOWED = join('src', 'config', 'site.ts');

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const offenders = [];
for (const file of walk('src')) {
  if (relative('.', file) === ALLOWED) continue;
  const text = readFileSync(file, 'utf8');
  for (const name of NAMES) if (text.includes(name)) offenders.push(`${file}: "${name}"`);
}

if (offenders.length) {
  console.error('Product names must come from PRODUCTS in src/config/site.ts:');
  for (const o of offenders) console.error(`  ${o}`);
  process.exit(1);
}
console.log('Product-name check passed.');
