# Nirvigna website plan

Static Astro site for https://nirvigna.co. Approval: Vamsi, until the company names a website owner.

## Hosting

**Interim hosting: GitHub Pages; target: AWS S3 + CloudFront once the Nirvigna AWS account is active.**

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main` (and on manual dispatch). It runs
no tests; the CI workflow is the gate, so only merge PRs whose CI is green. There is no github.io interim version: the site is
built for `https://nirvigna.co` only, and the deploy waits until the custom domain is in place.

Setup, done once by a repository admin before the first merge to `main`:

1. Make the repository public (Pages on the free plan needs a public repository).
2. Pages source = GitHub Actions, custom domain = `nirvigna.co`, for example
   `gh api -X POST repos/nirvigna-solutions/nirvigna-website/pages -f build_type=workflow` then
   `gh api -X PUT repos/nirvigna-solutions/nirvigna-website/pages -f cname=nirvigna.co`.
   With an Actions deploy, GitHub takes the domain from these settings and ignores the file; `public/CNAME` is kept as the
   record of the intended domain.
3. At GoDaddy: the four apex `A` records for GitHub Pages (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
   `185.199.111.153`), `www` `CNAME` to `nirvigna-solutions.github.io`, and the GitHub domain-verification `TXT` record
   (verify the domain for the organisation to prevent takeover). **Titan's MX, SPF and DKIM records stay exactly as they
   are**; check mail in both directions afterwards.
4. Once GitHub has issued the certificate, turn on "Enforce HTTPS".
5. Contact form: leave the repository variable `PUBLIC_CONTACT_ENDPOINT` unset until the backend exists (no form is rendered).
   Setting it and re-running the deploy adds the form, and the CSP meta tag follows automatically.

Rollback: unpublish the site (Settings → Pages, or `gh api -X DELETE repos/nirvigna-solutions/nirvigna-website/pages`) and, if
needed, remove the Pages `A`/`CNAME` records at GoDaddy. Never touch the Titan records.

GitHub Pages serves `/path/` as `/path/index.html` and answers unknown paths with `404.html` and status 404, so it needs none of
the CloudFront workarounds in the launch checklist.

## Sitemap and content intent

| Path | Page | Intent |
|---|---|---|
| `/` | Home | What Nirvigna Compliance does (licences that apply, why, which Act and section), the two tracks, products, industries. Early access badge. |
| `/compliance/` | Nirvigna Compliance | How it works: profile → applicable licences with reasons → register → document packs and renewals; "we can't tell yet"; segments; Telangana first; what early access means. |
| `/food-safety/` | Nirvigna Food Safety | In development — register interest. Planned: ingredient checks at procurement, batch and expiry tracking, hygiene review, pre-audits. |
| `/starting-a-business/` | Starting a business | Track for new businesses: what the plan needs, in order, with documents. Early access. |
| `/already-running/` | Already running | Track for trading businesses: baseline, find gaps, regularise, stay current. Early access. |
| `/audit-readiness/` | Audit readiness | Service: review of register and documents before an inspection; explicitly not an audit and no promised outcomes. Early access. |
| `/industries/` | Industries | Index of the three segments. |
| `/industries/restaurants-and-food/` | Restaurants & food | Generic areas a food business looks at; links to tracks and Food Safety. |
| `/industries/manufacturing/` | Manufacturing | Generic areas a manufacturing unit looks at; links to tracks. |
| `/industries/shops-and-establishments/` | Shops & establishments | Generic areas a shop or office looks at; links to tracks. |
| `/how-it-works/` | How it works | Five-step walkthrough and the three answers (applies / does not apply / we can't tell yet) with illustrative stand-ins. |
| `/pricing/` | Pricing | "Talk to us"; no prices. |
| `/about/` | About | Mission, company details. Team section hidden until names are supplied. |
| `/contact/` | Contact / Book a demo | Form (only when the endpoint is set), email, click-to-call, WhatsApp. |
| `/contact/thank-you/` | Thank you | Where the backend's 303 lands. `noindex`, not in sitemap. |
| `/privacy/` | Privacy Policy | DPDP Act 2023 notice; discloses future CDN access logs and that WhatsApp links go to Meta. DRAFT. |
| `/terms/` | Terms of Use | DRAFT. |
| `/refund-and-cancellation/` | Refund & Cancellation | No payments on the site; paid services get written terms. DRAFT. |
| `/disclaimer/` | Disclaimer | Information only; regulated filings by a qualified CA/CS; not a government body. DRAFT. |
| `/grievance/` | Grievance contact | Grievance Officer (placeholder name), contact details, Data Protection Board. DRAFT. |
| any unknown path | 404 | `noindex`, served with status 404. |

Every page has the header contact links (email, call, WhatsApp) and the legal footer (legal name, CIN, registered office,
email, phone, © year, legal links, disclaimer). Placeholders are listed in `docs/CONTENT_DECISIONS.md`.

## Contact form backend contract

The site posts the form straight to the URL in `PUBLIC_CONTACT_ENDPOINT` (set at build time). If the variable is unset, no form
is rendered and the build prints a warning. The site stores nothing.

**Request** — `POST <PUBLIC_CONTACT_ENDPOINT>`, `Content-Type: application/x-www-form-urlencoded`, from origin `https://nirvigna.co`.
Exactly these fields, and no others:

| Field | Required | Notes |
|---|---|---|
| `name` | yes | max 120 chars |
| `business_name` | no | max 160 chars |
| `phone` | yes | max 20 chars |
| `email` | no | max 160 chars |
| `segment` | yes | one of `food`, `manufacturing`, `shops`, `other` |
| `message` | yes | max 2000 chars |
| `consent` | yes | value `yes`; the visitor ticked the box linking to /privacy/ |
| `company_website` | — | **honeypot**: always sent, always empty from a real visitor. If it is non-empty, drop the submission silently and respond as if it succeeded. |

The browser's `required`/`maxlength` checks are a convenience; the backend must validate everything itself.

**Response, without JavaScript (the baseline)** — the request has no `Accept: application/json`. Respond
`303 See Other` with `Location: https://nirvigna.co/contact/thank-you/`. The redirect must go to that exact origin: Chrome
applies the CSP `form-action` directive to redirects, and only `'self'` and the endpoint origin are allowed.

**Response, with JavaScript (enhancement)** — `src/scripts/contact-form.ts` sends the same body with `fetch`, mode `cors`, and
`Accept: application/json`. Respond `200` with `{"ok":true}`. Every response (including the 303) must carry
`Access-Control-Allow-Origin: https://nirvigna.co`. No preflight is needed (a simple CORS request). The script shows an inline
confirmation whose text comes from `data-*` attributes on the form. If the request fails or cannot be read (network error,
missing CORS header, non-2xx), the script falls back to a normal HTML POST, so the enquiry still arrives; in the rare case where
the first request reached the backend but its response was unreadable, the backend may see a duplicate and should tolerate it.

**Data handling** — store submissions in India; retention, processors and access to be settled in the DPDP review (see the
launch checklist). Send nothing back to the browser beyond the responses above.

**CSP coupling** — `connect-src` and `form-action` are generated from the endpoint origin at build time
(`src/config/security-headers.mjs`). Changing the endpoint requires a rebuild and a new headers policy.

A test double implementing this contract is `scripts/stub-endpoint.mjs`; `tests/contact-form.spec.ts` asserts the exact
fields for both paths.

## Security headers

Each build writes `<out>/../cloudfront-response-headers-policy.json`, the input for
`aws cloudfront create-response-headers-policy --response-headers-policy-config file://...`: CSP, HSTS (one year,
includeSubDomains, no preload), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Frame-Options: DENY`. CI keeps it as an artifact. Tests serve the site with exactly these headers.

**On GitHub Pages (interim)** no custom response headers can be sent. Every page therefore carries
`<meta http-equiv="Content-Security-Policy">`, built by the same function from the same endpoint value
(`buildMetaCsp` in `src/config/security-headers.mjs`), placed before any stylesheet or script. It omits `frame-ancestors`,
which browsers ignore in a meta tag. **HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and
`frame-ancestors` wait for the AWS/CloudFront move**, where the generated headers policy applies them all. Until then the site
can be framed by other sites, and HSTS is not sent (GitHub Pages does redirect HTTP to HTTPS once "Enforce HTTPS" is on).

## Adding Telugu

Interface strings are in `src/i18n/en.ts`, typed through `src/i18n/config.ts`. To add Telugu: add `te` to `LOCALES` and to
`i18n.locales` in `astro.config.mjs`; create `src/i18n/te.ts` with the same keys; add pages under `src/pages/te/` passing
`locale="te"` to `BaseLayout`; add a self-hosted Telugu font (for example Noto Sans Telugu via Fontsource); add the routes to
`src/config/routes.ts`; add `hreflang` alternates.

## CI

One workflow (`.github/workflows/ci.yml`), one job: type check, product-name check, scanner unit tests, both builds,
forbidden-words scan, Playwright at 360/768/1024/1440, Lighthouse CI (Performance, Accessibility, Best Practices, SEO each
≥ 0.95, median of three runs, `upload.target: filesystem`). Lighthouse reports, the Playwright report and the headers policy
are kept as Actions artifacts. CI never deploys; deployment is the separate one-job workflow described under Hosting.

## Launch checklist for the AWS move (in order)

1. **AWS account and IAM** — dedicated account (or OU), MFA on root, least-privilege deploy role.
2. **Private S3 bucket with Origin Access Control, and CloudFront** using the generated response headers policy.
   - Add a CloudFront Function (viewer request) that rewrites `/path/` to `/path/index.html`; with a private bucket and OAC,
     S3 does not serve directory indexes and every page except `/` would fail.
   - Map 403 and 404 from the origin to `/404.html` with response code 404.
   - Build with the production `PUBLIC_CONTACT_ENDPOINT` and create the headers policy from that same build.
3. **ACM certificate in us-east-1, and DNS.** Domain and email are on GoDaddy with Titan email. When DNS moves, copy Titan's
   **MX, SPF and DKIM records exactly**, or support@nirvigna.co stops receiving mail. Check mail in both directions after the move.
4. **DMARC** — publish a DMARC record (start with `p=none` and reporting, tighten later).
5. **Form backend, with DPDP review** — implement the contract above; data stored in India; settle retention, processors and
   access; test the 303 path with JavaScript disabled and the CORS path with it enabled.
6. **Legal review** — finalise the five legal pages and fill their placeholders, then remove the DRAFT banners.
7. **Real Grievance Officer and logo** — set `GRIEVANCE_OFFICER_NAME`, replace `Logo.astro` and `favicon.svg`.
8. **Vamsi's go-ahead.**
