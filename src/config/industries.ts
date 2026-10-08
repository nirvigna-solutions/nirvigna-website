/**
 * Industry segments. "areas" are kinds of requirement a business in the segment often has to
 * look at; they are written generically on purpose. Which ones actually apply depends on the
 * business profile, so pages must never present this list as a verdict.
 */
export const INDUSTRIES = [
  {
    slug: 'restaurants-and-food',
    title: 'Restaurants & food',
    summary: 'Restaurants, cloud kitchens, caterers, bakeries, sweet shops and food processing units.',
    description:
      'How Nirvigna is designed to help restaurants, cloud kitchens, caterers and food units understand which licences apply to them, and why.',
    areas: [
      'Food safety registration or licence (FSSAI), depending on the kind and scale of the business',
      'Trade licence from the local body',
      'Shops and establishments registration',
      'Fire safety requirements, depending on premises and seating',
      'Labour and employment registrations, depending on the number of people employed',
      'Signage, music and liquor permissions, where relevant to what you do',
    ],
    showFoodSafety: true,
  },
  {
    slug: 'manufacturing',
    title: 'Manufacturing',
    summary: 'Small and medium manufacturing units, workshops and processing plants.',
    description:
      'How Nirvigna is designed to help manufacturing units understand which licences, registrations and consents apply to them, and why.',
    areas: [
      'Factory registration and licence, depending on power use and the number of workers',
      'Pollution control consents to establish and to operate',
      'Fire safety requirements for the premises',
      'Labour and employment registrations and returns',
      'Local body permissions for the premises',
      'Product-specific licences, where your products need them',
    ],
    showFoodSafety: false,
  },
  {
    slug: 'shops-and-establishments',
    title: 'Shops & establishments',
    summary: 'Retail shops, offices, clinics, salons, gyms, coaching centres and other commercial establishments.',
    description:
      'How Nirvigna is designed to help shops, offices and other commercial establishments understand which registrations apply to them, and why.',
    areas: [
      'Shops and establishments registration',
      'Trade licence from the local body',
      'Signage permissions',
      'Labour and employment registrations, depending on the number of people employed',
      'Sector-specific licences, for example for clinics or for selling regulated goods',
    ],
    showFoodSafety: false,
  },
] as const;

export type IndustrySlug = (typeof INDUSTRIES)[number]['slug'];
