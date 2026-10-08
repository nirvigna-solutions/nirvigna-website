# nirvigna-website

Source for the Nirvigna company website (https://nirvigna.co). Astro + TypeScript + Tailwind, fully static. Interim hosting is GitHub Pages (deployed on push to `main`); the target is AWS S3 + CloudFront.

- Rules for contributors (and Claude): [CLAUDE.md](CLAUDE.md)
- Sitemap, form backend contract and launch checklist: [docs/WEBSITE_PLAN.md](docs/WEBSITE_PLAN.md)
- Placeholders: [docs/CONTENT_DECISIONS.md](docs/CONTENT_DECISIONS.md)

```sh
npm ci
npm run dev                                   # http://localhost:4321
PUBLIC_CONTACT_ENDPOINT=https://… npm run build   # -> build/site and build/cloudfront-response-headers-policy.json
```

See CLAUDE.md for the full test commands.
