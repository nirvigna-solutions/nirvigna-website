/**
 * Locale setup. English is the only locale today. To add Telugu:
 *  1. add 'te' to LOCALES and to `i18n.locales` in astro.config.mjs,
 *  2. add src/i18n/te.ts mirroring en.ts (the type below enforces every key),
 *  3. add pages under src/pages/te/ that pass locale="te" to BaseLayout.
 * See docs/WEBSITE_PLAN.md ("Adding Telugu").
 */
import { en } from './en';

export const LOCALES = ['en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export type UiStrings = typeof en;

const dictionaries: Record<Locale, UiStrings> = { en };

/** Open Graph locale and BCP 47 tag per locale. */
export const LOCALE_META: Record<Locale, { htmlLang: string; ogLocale: string }> = {
  en: { htmlLang: 'en-IN', ogLocale: 'en_IN' },
};

export function t(locale: Locale = DEFAULT_LOCALE): UiStrings {
  return dictionaries[locale];
}
