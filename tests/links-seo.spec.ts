import { test, expect } from '@playwright/test';
import { ROUTES } from '../src/config/routes';
import { COMPANY, SITE_URL } from '../src/config/site';
import { PAGES } from './helpers';

// Width-independent checks: run once.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'w1440', 'width-independent');
  // These tests walk every page.
  testInfo.setTimeout(120_000);
});

test('every internal link and asset resolves with 200 and no redirect', async ({ page, request }) => {
  const targets = new Set<string>();
  for (const path of PAGES) {
    await page.goto(path);
    const refs = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('a[href], link[href], script[src], img[src]')].map(
        (el) => el.getAttribute('href') ?? el.getAttribute('src') ?? '',
      ),
    );
    for (const ref of refs) {
      if (ref.startsWith('#')) {
        expect(await page.locator(ref).count(), `${path} anchor ${ref}`).toBe(1);
        continue;
      }
      const url = new URL(ref, page.url());
      if (url.origin === new URL(page.url()).origin) targets.add(url.pathname);
      else if (url.origin === SITE_URL) targets.add(url.pathname); // canonical / og:url
    }
  }
  expect(targets.size).toBeGreaterThan(PAGES.length);
  for (const target of targets) {
    const res = await request.get(target, { maxRedirects: 0 });
    expect(res.status(), target).toBe(200);
  }
});

test('titles and descriptions are unique; canonical and Open Graph point at nirvigna.co', async ({ page }) => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const path of PAGES) {
    await page.goto(path);
    const title = await page.title();
    const description = (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';
    expect(title.length, path).toBeGreaterThan(5);
    expect(description.length, path).toBeGreaterThan(40);
    expect(titles.has(title), `duplicate title ${title}`).toBe(false);
    expect(descriptions.has(description), `duplicate description on ${path}`).toBe(false);
    titles.add(title);
    descriptions.add(description);
    const canonical = `${SITE_URL}${path}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description);
  }
});

test('JSON-LD parses on every page and has legal name, address, email and phone', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks, path).toHaveLength(1);
    const data = JSON.parse(blocks[0]);
    expect(data['@type']).toBe('Organization');
    expect(data.legalName).toBe(COMPANY.legalName);
    expect(data.email).toBe(COMPANY.email);
    expect(data.telephone).toBe(COMPANY.phoneE164);
    expect(data.address).toMatchObject({
      '@type': 'PostalAddress',
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.city,
      addressRegion: COMPANY.address.region,
      postalCode: COMPANY.address.postalCode,
      addressCountry: COMPANY.address.country,
    });
  }
});

test('sitemap.xml lists exactly the indexable pages; robots.txt points to it', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  const expected = ROUTES.filter((r) => r.index).map((r) => `${SITE_URL}${r.path}`).sort();
  expect(locs).toEqual(expected);

  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
});

test('security headers are served, and pages contain no inline executable scripts or styles', async ({ page, request }) => {
  const res = await request.get('/');
  const headers = res.headers();
  expect(headers['content-security-policy']).toContain("script-src 'self'");
  expect(headers['content-security-policy']).toContain("form-action 'self' http://127.0.0.1:4322");
  expect(headers['strict-transport-security']).toContain('max-age=');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

  for (const path of PAGES) {
    await page.goto(path);
    const inline = await page.evaluate(() => ({
      scripts: [...document.querySelectorAll('script:not([src])')].filter((s) => s.getAttribute('type') !== 'application/ld+json').length,
      styleTags: document.querySelectorAll('style').length,
      styleAttrs: document.querySelectorAll('[style]').length,
    }));
    expect(inline, path).toEqual({ scripts: 0, styleTags: 0, styleAttrs: 0 });
  }
});

test('every page carries the CSP meta tag (header policy minus frame-ancestors) before any stylesheet or script', async ({ page, request }) => {
  const headerCsp = (await request.get('/')).headers()['content-security-policy'];
  const expected = headerCsp
    .split('; ')
    .filter((d) => !d.startsWith('frame-ancestors'))
    .join('; ');
  for (const path of PAGES) {
    await page.goto(path);
    const meta = page.locator('head meta[http-equiv="Content-Security-Policy"]');
    await expect(meta, path).toHaveCount(1);
    await expect(meta, path).toHaveAttribute('content', expected);
    const firstResourceIndex = await page.evaluate(() => {
      const head = [...document.head.children];
      const meta = head.findIndex((el) => el.getAttribute('http-equiv') === 'Content-Security-Policy');
      const firstResource = head.findIndex((el) => el.matches('link[rel="stylesheet"], script[src], link[rel="preload"]'));
      return { meta, firstResource };
    });
    expect(firstResourceIndex.meta, path).toBeLessThan(firstResourceIndex.firstResource);
  }
});

test('the build publishes CNAME for the custom domain', async ({ request }) => {
  const res = await request.get('/CNAME');
  expect(res.status()).toBe(200);
  expect((await res.text()).trim()).toBe('nirvigna.co');
});
