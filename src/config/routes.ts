/**
 * Every page on the site. Tests and the sitemap read this list, so a new page must be added here.
 * `index: false` keeps a page out of sitemap.xml (and it carries noindex).
 */
export const ROUTES = [
  { path: '/', index: true },
  { path: '/compliance/', index: true },
  { path: '/food-safety/', index: true },
  { path: '/starting-a-business/', index: true },
  { path: '/already-running/', index: true },
  { path: '/audit-readiness/', index: true },
  { path: '/industries/', index: true },
  { path: '/industries/restaurants-and-food/', index: true },
  { path: '/industries/manufacturing/', index: true },
  { path: '/industries/shops-and-establishments/', index: true },
  { path: '/how-it-works/', index: true },
  { path: '/pricing/', index: true },
  { path: '/about/', index: true },
  { path: '/contact/', index: true },
  { path: '/contact/thank-you/', index: false },
  { path: '/privacy/', index: true },
  { path: '/terms/', index: true },
  { path: '/refund-and-cancellation/', index: true },
  { path: '/disclaimer/', index: true },
  { path: '/grievance/', index: true },
] as const;

export type RoutePath = (typeof ROUTES)[number]['path'];
