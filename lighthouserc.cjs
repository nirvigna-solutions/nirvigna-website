// Lighthouse CI: every indexable page, served with the generated security headers.
// Reports are written to the filesystem (lhci-reports/) and kept as GitHub Actions artifacts.
const { readFileSync } = require('node:fs');

const routes = [...readFileSync('src/config/routes.ts', 'utf8').matchAll(/\{ path: '([^']+)', index: true \}/g)].map((m) => m[1]);
if (routes.length === 0) throw new Error('lighthouserc: no routes parsed from src/config/routes.ts');

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/serve.mjs build-test/site 4331',
      startServerReadyPattern: 'Serving',
      url: routes.map((p) => `http://localhost:4331${p}`),
      numberOfRuns: 3, // median of three, to damp CPU noise on shared runners
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: { target: 'filesystem', outputDir: 'lhci-reports' },
  },
};
