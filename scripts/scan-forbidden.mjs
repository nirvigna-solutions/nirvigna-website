// Forbidden-words scan of the built site. Fails (exit 1) on any match.
// Scans every .html page's visible text plus human-readable attributes (including all data-*
// attributes, which hold the contact-form script's visitor-facing text) and JSON-LD, and every
// .xml/.txt file. CSS and JS bundles are not scanned: Tailwind CSS is full of "100%" and asset
// hashes can look like PAN numbers. Keep all visitor-facing text in HTML.
// Usage: node scripts/scan-forbidden.mjs <site-dir>
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'node-html-parser';

export const RULES = [
  { name: 'PAN as an uppercase word', re: /\bPAN\b/g },
  { name: 'TAN as an uppercase word', re: /\bTAN\b/g },
  { name: 'PAN number format', re: /[a-z]{5}[0-9]{4}[a-z]/gi },
  { name: 'TAN number format', re: /[a-z]{4}[0-9]{5}[a-z]/gi },
  { name: '"guaranteed"', re: /guaranteed/gi },
  { name: '"100%"', re: /100\s*(%|per\s*cent|percent)/gi },
  { name: '"certified"', re: /certified/gi },
  { name: '"verified"', re: /verified/gi },
  { name: '"government approved"', re: /government[\s-]*approved/gi },
  { name: '"partner(s)" (CLAUDE.md honesty rule)', re: /\bpartners?(hips?)?\b/gi },
];

const TEXT_ATTRIBUTES = new Set(['title', 'alt', 'aria-label', 'aria-description', 'placeholder', 'content', 'value', 'label']);

/** @param {string} text */
export function findViolations(text) {
  const found = [];
  for (const rule of RULES) {
    for (const m of text.matchAll(rule.re)) {
      const start = Math.max(0, m.index - 40);
      found.push({ rule: rule.name, match: m[0], context: text.slice(start, m.index + m[0].length + 40).replace(/\s+/g, ' ') });
    }
  }
  return found;
}

/** Visible text, readable attributes and JSON-LD of an HTML document, one chunk per line. */
export function extractScannableText(html) {
  const root = parse(html, { comment: false, blockTextElements: { script: true, style: true, noscript: true } });
  const chunks = [];
  for (const el of root.querySelectorAll('*')) {
    const tag = el.rawTagName?.toLowerCase();
    if (tag === 'style') continue;
    if (tag === 'script') {
      if ((el.getAttribute('type') ?? '').toLowerCase() === 'application/ld+json') chunks.push(el.text);
      continue;
    }
    for (const [name, value] of Object.entries(el.attributes)) {
      const n = name.toLowerCase();
      if (TEXT_ATTRIBUTES.has(n) || n.startsWith('data-')) chunks.push(value);
    }
    for (const child of el.childNodes) {
      if (child.nodeType === 3) chunks.push(child.text);
    }
  }
  return chunks.map((c) => c.trim()).filter(Boolean).join('\n');
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

export function scanSite(siteDir) {
  const results = [];
  let files = 0;
  for (const file of walk(siteDir)) {
    const ext = extname(file);
    if (!['.html', '.xml', '.txt'].includes(ext)) continue;
    files++;
    const raw = readFileSync(file, 'utf8');
    const text = ext === '.html' ? extractScannableText(raw) : raw;
    for (const v of findViolations(text)) results.push({ file: relative(siteDir, file), ...v });
  }
  return { files, results };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const siteDir = process.argv[2];
  if (!siteDir) {
    console.error('Usage: node scripts/scan-forbidden.mjs <site-dir>');
    process.exit(2);
  }
  const { files, results } = scanSite(siteDir);
  if (files === 0) {
    console.error(`No pages found in ${siteDir}; build first.`);
    process.exit(2);
  }
  if (results.length) {
    console.error(`Forbidden-words scan FAILED: ${results.length} match(es) in ${siteDir}`);
    for (const r of results) console.error(`  ${r.file}: ${r.rule}: "${r.match}" … ${r.context}`);
    process.exit(1);
  }
  console.log(`Forbidden-words scan passed: ${files} files in ${siteDir}, 0 matches.`);
}
