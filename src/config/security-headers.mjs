// Builds the CloudFront response headers policy. The CSP is derived from the contact
// endpoint so the form is never silently blocked by form-action or connect-src.

/** @param {string | null} endpoint */
export function buildCsp(endpoint) {
  const origin = endpoint ? new URL(endpoint).origin : null;
  const directives = [
    ['default-src', "'none'"],
    ['script-src', "'self'"],
    ['style-src', "'self'"],
    ['img-src', "'self' data:"],
    ['font-src', "'self'"],
    ['manifest-src', "'self'"],
    ['connect-src', origin ? `'self' ${origin}` : "'self'"],
    ['form-action', origin ? `'self' ${origin}` : "'none'"],
    ['base-uri', "'none'"],
    ['object-src', "'none'"],
    ['frame-ancestors', "'none'"],
  ];
  return directives.map(([k, v]) => `${k} ${v}`).join('; ');
}

/**
 * Input for `aws cloudfront create-response-headers-policy --response-headers-policy-config file://...`.
 * HSTS is sent without preload so it stays reversible until the team decides otherwise.
 */
export function buildCloudFrontPolicy(endpoint) {
  return {
    Name: 'nirvigna-website-security-headers',
    Comment: endpoint ? 'Generated at build time from PUBLIC_CONTACT_ENDPOINT' : 'Generated at build time; no contact endpoint',
    SecurityHeadersConfig: {
      ContentSecurityPolicy: { Override: true, ContentSecurityPolicy: buildCsp(endpoint) },
      StrictTransportSecurity: {
        Override: true,
        AccessControlMaxAgeSec: 31536000,
        IncludeSubdomains: true,
        Preload: false,
      },
      ContentTypeOptions: { Override: true },
      ReferrerPolicy: { Override: true, ReferrerPolicy: 'strict-origin-when-cross-origin' },
      FrameOptions: { Override: true, FrameOption: 'DENY' },
    },
  };
}

/** Converts a CloudFront policy back into a header map (used to serve a build exactly as configured). */
export function headerMapFromPolicy(policy) {
  const s = policy.SecurityHeadersConfig;
  const hsts = s.StrictTransportSecurity;
  return {
    'Content-Security-Policy': s.ContentSecurityPolicy.ContentSecurityPolicy,
    'Strict-Transport-Security': `max-age=${hsts.AccessControlMaxAgeSec}${hsts.IncludeSubdomains ? '; includeSubDomains' : ''}${hsts.Preload ? '; preload' : ''}`,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': s.ReferrerPolicy.ReferrerPolicy,
    'X-Frame-Options': s.FrameOptions.FrameOption,
  };
}
