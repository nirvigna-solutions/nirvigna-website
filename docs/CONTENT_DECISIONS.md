# Content decisions and placeholders

Every placeholder on the site, one line each. Remove a line when the real content is supplied and approved.

## Placeholders

- **Logo** — `src/components/Logo.astro` uses a plain placeholder mark plus the word "Nirvigna"; replace with the approved logo.
- **Favicon** — `public/favicon.svg` is derived from the placeholder mark; replace with the approved logo.
- **Open Graph image** — none; pages use `twitter:card=summary` with no image until a brand image is approved.
- **Grievance Officer name** — `GRIEVANCE_OFFICER_NAME` in `src/config/site.ts`, shown on /grievance/.
- **Grievance response timeline** — /grievance/, to be set in legal review.
- **CDN log retention period** — /privacy/ §2.4.
- **List of processors** (email, form service, hosting) — /privacy/ §3.
- **Storage location of form submissions and email** — /privacy/ §4 (intended: India, subject to DPDP review).
- **Retention period for enquiries** — /privacy/ §5.
- **Jurisdiction clause** — /terms/ §9.
- **Standard refund and cancellation terms for paid services** — /refund-and-cancellation/ §2.
- **"The three answers" examples** — /how-it-works/ shows bracketed stand-ins (`[Example licence]`, `[Act name], section [x]`), labelled illustrative.
- **Team** — `TEAM` in `src/config/site.ts` is empty, so the About page team section is hidden until names are supplied.
- **Legal pages** — all five carry "DRAFT — requires legal review before launch".

## Decisions

- **No prices, customers, testimonials, logos of others, awards, statistics or partnerships** anywhere — none have been supplied.
- **Industry "areas we look at" lists** (`src/config/industries.ts`) are written generically and name no Act or section, to avoid stating law that may have changed (for example labour law consolidation); a qualified person should review them before launch.
- **Privacy notice names Amazon CloudFront** as the intended CDN, matching the launch plan; update if hosting changes.
- **WhatsApp** links are disclosed as going to Meta on the Contact page and in the privacy notice.
- **Status wording** comes from `STATUS_LABELS`: "Early access" and "In development — register interest".
- **Thank-you page** is `noindex` and left out of the sitemap; the 404 page is `noindex`.
