// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveContactEndpoint } from './src/config/contact-endpoint.mjs';
import { buildCloudFrontPolicy } from './src/config/security-headers.mjs';

// process.env wins over .env files, so CI and the build-variant script can override it.
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');
const contactEndpoint = resolveContactEndpoint(process.env.PUBLIC_CONTACT_ENDPOINT ?? env.PUBLIC_CONTACT_ENDPOINT);
const outDir = process.env.ASTRO_OUT_DIR ?? 'build/site';

/** Writes cloudfront-response-headers-policy.json next to the output directory after every build. */
function securityHeaders() {
  return {
    name: 'nirvigna-security-headers',
    hooks: {
      /** @param {{ dir: URL, logger: import('astro').AstroIntegrationLogger }} options */
      'astro:build:done': ({ dir, logger }) => {
        const target = join(dirname(fileURLToPath(dir)), 'cloudfront-response-headers-policy.json');
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, JSON.stringify(buildCloudFrontPolicy(contactEndpoint), null, 2) + '\n');
        logger.info(`Wrote ${target}`);
        if (!contactEndpoint) {
          logger.warn('PUBLIC_CONTACT_ENDPOINT is not set: the contact form is NOT rendered in this build.');
        }
      },
    },
  };
}

export default defineConfig({
  site: 'https://nirvigna.co',
  outDir,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  i18n: { locales: ['en'], defaultLocale: 'en' },
  devToolbar: { enabled: false },
  integrations: [securityHeaders()],
  vite: {
    plugins: [tailwindcss()],
    define: { __CONTACT_ENDPOINT__: JSON.stringify(contactEndpoint) },
    // Never inline scripts or assets: the CSP allows only 'self' files.
    build: { assetsInlineLimit: 0 },
  },
});
