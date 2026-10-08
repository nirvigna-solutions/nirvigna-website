import type { APIRoute } from 'astro';
import { ROUTES } from '../config/routes';
import { SITE_URL } from '../config/site';

export const GET: APIRoute = () => {
  const urls = ROUTES.filter((r) => r.index)
    .map((r) => `  <url><loc>${new URL(r.path, SITE_URL).href}</loc></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
