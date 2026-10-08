/**
 * Single source of truth for company facts and product names.
 * Every page reads names and facts from here; never hard-code them elsewhere.
 * Do not add facts that the company has not supplied (see CLAUDE.md).
 */

export const SITE_URL = 'https://nirvigna.co';

export const COMPANY = {
  brand: 'Nirvigna',
  legalName: 'NIRVIGNA CLOUD COMPLIANCE PRIVATE LIMITED',
  cin: 'U62011TS2026PTC223955',
  incorporated: '2026-10-05',
  incorporatedDisplay: '5 October 2026',
  address: {
    street: 'Flat No. 201, B Block, Raheja Vistas, I.E. Nacharam, Uppal',
    city: 'Hyderabad',
    postalCode: '500076',
    region: 'Telangana',
    country: 'IN',
    countryName: 'India',
  },
  email: 'support@nirvigna.co',
  phoneDisplay: '+91 96407 17374',
  phoneE164: '+919640717374',
  domain: 'nirvigna.co',
} as const;

export const ADDRESS_ONE_LINE = `${COMPANY.address.street}, ${COMPANY.address.city} – ${COMPANY.address.postalCode}, ${COMPANY.address.region}`;

export const CONTACT_LINKS = {
  email: `mailto:${COMPANY.email}`,
  call: `tel:${COMPANY.phoneE164}`,
  whatsapp: `https://wa.me/${COMPANY.phoneE164.replace('+', '')}`,
} as const;

/** Product names: one config value each. */
export const PRODUCTS = {
  compliance: {
    name: 'Nirvigna Compliance',
    href: '/compliance/',
    status: 'earlyAccess',
  },
  foodSafety: {
    name: 'Nirvigna Food Safety',
    href: '/food-safety/',
    status: 'inDevelopment',
  },
} as const;

export const STATUS_LABELS = {
  earlyAccess: 'Early access',
  inDevelopment: 'In development — register interest',
} as const;

export type ProductStatus = keyof typeof STATUS_LABELS;

/**
 * Team members shown on the About page. The section stays hidden while this is empty.
 * Add entries only when the company supplies names and roles.
 */
export const TEAM: ReadonlyArray<{ name: string; role: string }> = [];

/** Placeholder until a Grievance Officer is appointed (docs/CONTENT_DECISIONS.md). */
export const GRIEVANCE_OFFICER_NAME = '[PLACEHOLDER — Grievance Officer to be appointed]';

export const DISCLAIMER_SHORT =
  'Information on this website is for general information only and is not legal advice. Regulated filings are done by a qualified CA/CS.';
