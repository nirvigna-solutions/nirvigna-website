// Builds the two variants the test suite needs:
//   build-test/site    with a local stub contact endpoint (form rendered)
//   build-noform/site  with PUBLIC_CONTACT_ENDPOINT unset (no form)
import { spawnSync } from 'node:child_process';

export const STUB_ENDPOINT = 'http://127.0.0.1:4322/submit';

const variants = [
  { outDir: 'build-test/site', endpoint: STUB_ENDPOINT },
  { outDir: 'build-noform/site', endpoint: '' },
];

for (const v of variants) {
  console.log(`\n=== astro build -> ${v.outDir} (endpoint: ${v.endpoint || 'unset'}) ===`);
  const result = spawnSync('npx', ['astro', 'build'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ASTRO_OUT_DIR: v.outDir, PUBLIC_CONTACT_ENDPOINT: v.endpoint },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
