import { test, expect, type Page } from '@playwright/test';
import { SITE, SITE_NOFORM, STUB } from './urls';
import { COMPANY } from '../src/config/site';
import { trackErrors } from './helpers';

/** The backend contract: six fields, consent, and the always-empty honeypot. Nothing else. */
const EXPECTED_FIELDS = ['business_name', 'company_website', 'consent', 'email', 'message', 'name', 'phone', 'segment'];

type Submission = { contentType: string; accept: string; origin: string; fields: [string, string][] };

async function fillForm(page: Page, marker: string) {
  await page.getByLabel('Your name').fill('Test Person');
  await page.getByLabel('Business name').fill('Test Foods');
  await page.getByLabel('Phone').fill('+91 90000 00000');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Your business type').selectOption('food');
  await page.getByLabel('How can we help?').fill(marker);
  await page.getByLabel(/I agree that Nirvigna may use these details/).check();
}

async function submissionFor(marker: string): Promise<Submission> {
  let found: Submission | undefined;
  await expect
    .poll(async () => {
      const all: Submission[] = await (await fetch(`${STUB}/__submissions`)).json();
      found = all.find((s) => s.fields.some(([k, v]) => k === 'message' && v === marker));
      return !!found;
    })
    .toBe(true);
  return found!;
}

function expectContractFields(sub: Submission, marker: string) {
  expect(sub.contentType).toContain('application/x-www-form-urlencoded');
  expect(sub.fields.map(([k]) => k).sort()).toEqual(EXPECTED_FIELDS);
  expect(Object.fromEntries(sub.fields)).toEqual({
    name: 'Test Person',
    business_name: 'Test Foods',
    phone: '+91 90000 00000',
    email: 'test@example.com',
    segment: 'food',
    message: marker,
    consent: 'yes',
    company_website: '',
  });
}

test('without JavaScript: plain HTML POST carries exactly the contract fields and lands on the thank-you page', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: testInfo.project.use.viewport });
  const page = await context.newPage();
  const errors = trackErrors(page);
  await page.goto(`${SITE}/contact/`);
  const marker = `nojs-${testInfo.project.name}-${Date.now()}`;
  await fillForm(page, marker);
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page).toHaveURL(`${SITE}/contact/thank-you/`);
  await expect(page.locator('h1')).toHaveText('Thank you. We have received your message.');

  const sub = await submissionFor(marker);
  expectContractFields(sub, marker);
  expect(sub.accept).not.toContain('application/json');
  expect(errors).toEqual([]);
  await context.close();
});

test('with JavaScript: inline confirmation from data attributes, same fields, nothing stored in the browser', async ({ page }, testInfo) => {
  const errors = trackErrors(page);
  await page.goto('/contact/');
  const form = page.locator('form[data-contact-form]');
  const title = await form.getAttribute('data-msg-success-title');
  const body = await form.getAttribute('data-msg-success-body');
  expect(title).toBeTruthy();
  expect(body).toBeTruthy();

  const marker = `js-${testInfo.project.name}-${Date.now()}`;
  await fillForm(page, marker);
  await page.getByRole('button', { name: 'Send message' }).click();

  const status = page.getByRole('status');
  await expect(status).toContainText(title!);
  await expect(status).toContainText(body!);
  await expect(page).toHaveURL(`${SITE}/contact/`);

  const sub = await submissionFor(marker);
  expectContractFields(sub, marker);
  expect(sub.accept).toContain('application/json');
  expect(sub.origin).toBe(SITE);

  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie])).toEqual([0, 0, '']);
  expect(errors).toEqual([]);
});

test('the form requires consent before it submits', async ({ page }, testInfo) => {
  await page.goto('/contact/');
  const marker = `noconsent-${testInfo.project.name}-${Date.now()}`;
  await fillForm(page, marker);
  await page.getByLabel(/I agree that Nirvigna may use these details/).uncheck();
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page).toHaveURL(`${SITE}/contact/`);
  expect(await page.locator('#cf-consent').evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  const all: Submission[] = await (await fetch(`${STUB}/__submissions`)).json();
  expect(all.some((s) => s.fields.some(([, v]) => v === marker))).toBe(false);
});

test('no form is rendered when PUBLIC_CONTACT_ENDPOINT is unset; direct contact links remain', async ({ page }) => {
  const errors = trackErrors(page);
  const response = await page.goto(`${SITE_NOFORM}/contact/`);
  expect(response?.status()).toBe(200);
  await expect(page.locator('form')).toHaveCount(0);
  const links = page.getByTestId('contact-links');
  await expect(links.locator(`a[href="mailto:${COMPANY.email}"]`)).toHaveCount(1);
  await expect(links.locator(`a[href="tel:${COMPANY.phoneE164}"]`)).toHaveCount(1);
  await expect(links.locator(`a[href="https://wa.me/${COMPANY.phoneE164.slice(1)}"]`)).toHaveCount(1);
  expect(response?.headers()['content-security-policy']).toContain("form-action 'none'");
  expect(errors).toEqual([]);
});
