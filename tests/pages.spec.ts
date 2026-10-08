import { test, expect } from '@playwright/test';
import { COMPANY } from '../src/config/site';
import { SITE } from './urls';
import { PAGES, LEGAL_PATHS, expectLegalFooter, layoutProblems, trackErrors } from './helpers';

for (const path of PAGES) {
  test(`page ${path}: loads, fits the viewport, has header contacts and legal footer`, async ({ page }) => {
    const errors = trackErrors(page);
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);

    expect(await layoutProblems(page)).toEqual([]);

    const header = page.locator('header');
    await expect(header.locator(`a[href="mailto:${COMPANY.email}"]`)).toHaveCount(1);
    await expect(header.locator(`a[href="tel:${COMPANY.phoneE164}"]`)).toHaveCount(1);
    await expect(header.locator('a[href^="https://wa.me/"]')).toHaveCount(1);

    await expectLegalFooter(page);

    // Opening the mobile menu must not overflow either.
    const menu = page.locator('header details summary');
    if (await menu.isVisible()) {
      await menu.click();
      expect(await layoutProblems(page)).toEqual([]);
    }

    expect(errors, 'console errors or CSP violations').toEqual([]);
  });
}

for (const path of LEGAL_PATHS) {
  test(`legal page ${path} carries the DRAFT banner`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByTestId('draft-banner')).toHaveText('DRAFT — requires legal review before launch');
  });
}

test('unknown path serves the 404 page with status 404', async ({ page }) => {
  const errors = trackErrors(page);
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByTestId('not-found')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  expect(await layoutProblems(page)).toEqual([]);
  await expectLegalFooter(page);
  // Chromium logs the 404 response itself as a console error; nothing else is allowed.
  expect(errors.filter((e) => !e.includes('404'))).toEqual([]);
});

test('pages make no requests to other origins and set no cookies or storage', async ({ page, context }) => {
  test.setTimeout(120_000);
  const foreign: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.origin !== SITE) foreign.push(req.url());
  });
  for (const path of PAGES) {
    await page.goto(path);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie])).toEqual([0, 0, '']);
  }
  expect(foreign).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});
