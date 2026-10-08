# CLAUDE.md — nirvigna-website

This repository is the home of the Nirvigna company website (https://nirvigna.co): Astro + TypeScript + Tailwind, fully static.
Never touch the Nirvigna-App repository from work in this repository.

## Approval

**Vamsi approves website changes until the company names a website owner.** Open a PR; do not merge without that approval.

## Company facts — use exactly, never invent others

All facts live in `src/config/site.ts`. Do not add a fact the company has not supplied.

- Brand: Nirvigna
- Legal name: NIRVIGNA CLOUD COMPLIANCE PRIVATE LIMITED
- CIN: U62011TS2026PTC223955 (incorporated 5 Oct 2026)
- Registered office: Flat No. 201, B Block, Raheja Vistas, I.E. Nacharam, Uppal, Hyderabad – 500076, Telangana
- Email: support@nirvigna.co · Phone: +91 96407 17374 · Domain: nirvigna.co

## One-config-value rule

Each product name is ONE value in `PRODUCTS` in `src/config/site.ts`. Pages read it from there; never type a product name
anywhere else under `src/`. `npm run check:names` enforces this. The same applies to company facts and status labels.

## Honesty rules

- No invented numbers, customers, testimonials, logos, awards, partnerships, prices or team names.
- Missing content is a clearly marked placeholder (`<Placeholder>` component) and gets one line in `docs/CONTENT_DECISIONS.md`.
- No government emblem, MCA, FSSAI or any authority logo.
- The compliance product is described as "how it works" under an **Early access** badge. No present-tense claims that rules
  are signed off or that audits are happening. Food Safety is "In development — register interest".
- Site-wide disclaimer: information only, not legal advice; regulated filings are done by **a qualified CA/CS**. Never say
  "partners".
- Forbidden on every page, including legal pages (the build fails on them — `npm run scan`): PAN and TAN as whole uppercase
  words and anything matching their number formats; "guaranteed", "100%", "certified", "verified", "government approved" in
  any case; "partner(s)/partnership(s)".
- Visitor-facing text must be in the HTML (data attributes if a script needs it), never only in JS bundles, so the scan sees it.

## Privacy and security

- No cookies, trackers, analytics or third-party scripts. Fonts are self-hosted. Nothing is stored in the browser.
- No inline scripts or styles: the CSP allows `'self'` only. The CSP is generated at build time from `PUBLIC_CONTACT_ENDPOINT`
  (as a `<meta>` tag for GitHub Pages and as the CloudFront headers policy); changing the endpoint requires a rebuild.
- Every push to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`). Merge only with green CI and Vamsi's approval.
- This repository is public: never commit secrets, personal contact details or internal notes.
- The contact form posts directly to the backend; its contract is in `docs/WEBSITE_PLAN.md`. Changing the fields means changing
  that contract and the Playwright test that checks it.

## Commands

```sh
npm ci
npm run dev               # local dev server
npm run check             # astro check (types)
npm run check:names       # one-config-value rule
npm run test:unit         # forbidden-words scanner unit tests
npm run build:variants    # build-test/ (stub endpoint) and build-noform/ (endpoint unset)
npm run scan              # forbidden-words scan of both builds
npm run test:e2e          # Playwright at 360/768/1024/1440
npm run lhci              # Lighthouse CI, all categories >= 0.95
```

New pages must be added to `src/config/routes.ts` (tests, sitemap and Lighthouse read it).
