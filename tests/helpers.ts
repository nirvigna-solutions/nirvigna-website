import { expect, type Page } from '@playwright/test';
import { ROUTES } from '../src/config/routes';
import { COMPANY } from '../src/config/site';

export const PAGES = ROUTES.map((r) => r.path);
export const LEGAL_PATHS = ['/privacy/', '/terms/', '/refund-and-cancellation/', '/disclaimer/', '/grievance/'];

/** Collects console errors, page errors and CSP violations for the lifetime of the page. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Horizontal page overflow, elements extending past the viewport, and clipped content. */
export async function layoutProblems(page: Page): Promise<string[]> {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const problems: string[] = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw) {
      problems.push(`page scrollWidth ${document.documentElement.scrollWidth} > viewport ${vw}`);
    }
    const describe = (el: Element) =>
      `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${[...el.classList].slice(0, 3).join('.')} "${(el.textContent ?? '').trim().slice(0, 40)}"`;
    const intentionallyHidden = (el: Element) => !!el.closest('.sr-only, .hp-field, [hidden], details:not([open]) > nav');
    for (const el of document.body.querySelectorAll('*')) {
      if (intentionallyHidden(el)) continue;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right > vw + 1 || rect.left < -1) problems.push(`outside viewport: ${describe(el)} [${Math.round(rect.left)}..${Math.round(rect.right)}]`);
      if (['hidden', 'clip'].includes(style.overflowX) && el.scrollWidth > el.clientWidth + 1) {
        problems.push(`clipped content: ${describe(el)} (${el.scrollWidth} > ${el.clientWidth})`);
      }
    }
    return problems;
  });
}

/** The legal footer: legal name, CIN, registered office, email, phone, © year and legal links. */
export async function expectLegalFooter(page: Page) {
  const footer = page.getByTestId('site-footer');
  await expect(footer).toBeVisible();
  await expect(footer.getByTestId('footer-legal-name')).toHaveText(COMPANY.legalName);
  await expect(footer.getByTestId('footer-cin')).toContainText(COMPANY.cin);
  await expect(footer.getByTestId('footer-address')).toContainText(COMPANY.address.street);
  await expect(footer.getByTestId('footer-address')).toContainText(COMPANY.address.postalCode);
  await expect(footer.getByTestId('footer-email')).toHaveAttribute('href', `mailto:${COMPANY.email}`);
  await expect(footer.getByTestId('footer-phone')).toHaveAttribute('href', `tel:${COMPANY.phoneE164}`);
  await expect(footer.getByTestId('footer-copyright')).toContainText(`© ${new Date().getFullYear()} ${COMPANY.legalName}`);
  await expect(footer.getByTestId('disclaimer')).toContainText('qualified CA/CS');
  const legalNav = footer.getByRole('navigation', { name: 'Legal' });
  for (const path of LEGAL_PATHS) {
    await expect(legalNav.locator(`a[href="${path}"]`)).toHaveCount(1);
  }
}
