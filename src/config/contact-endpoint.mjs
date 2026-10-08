// Resolves and validates PUBLIC_CONTACT_ENDPOINT. Used by astro.config.mjs so the form
// action and the generated CSP always come from the same value.

/** @param {string | undefined} raw @returns {string | null} */
export function resolveContactEndpoint(raw) {
  const value = (raw ?? '').trim();
  if (!value) return null;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`PUBLIC_CONTACT_ENDPOINT is not a valid URL: ${value}`);
  }
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) {
    throw new Error(`PUBLIC_CONTACT_ENDPOINT must use https (http allowed only for localhost): ${value}`);
  }
  return url.href;
}
