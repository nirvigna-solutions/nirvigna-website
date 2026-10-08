import { defineConfig, devices } from '@playwright/test';
import { SITE, SITE_NOFORM, STUB } from './tests/urls';

/**
 * Runs against static builds made by `npm run build:variants`:
 *   :4321  build-test/site    (form rendered, endpoint = stub on :4322)
 *   :4323  build-noform/site  (PUBLIC_CONTACT_ENDPOINT unset)
 * Both are served with the generated CloudFront security headers, so CSP is enforced in every test.
 */
const widths = [360, 768, 1024, 1440];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: SITE, trace: 'retain-on-failure' },
  projects: widths.map((width) => ({
    name: `w${width}`,
    use: { ...devices['Desktop Chrome'], viewport: { width, height: 900 }, deviceScaleFactor: 1 },
  })),
  webServer: [
    { command: 'node scripts/serve.mjs build-test/site 4321', url: `${SITE}/`, reuseExistingServer: !process.env.CI },
    { command: 'node scripts/serve.mjs build-noform/site 4323', url: `${SITE_NOFORM}/`, reuseExistingServer: !process.env.CI },
    { command: `node scripts/stub-endpoint.mjs 4322 ${SITE}`, url: `${STUB}/__submissions`, reuseExistingServer: !process.env.CI },
  ],
});
