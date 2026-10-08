import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractScannableText, findViolations } from './scan-forbidden.mjs';

const rulesHit = (text) => findViolations(text).map((v) => v.rule);

test('flags PAN and TAN only as whole uppercase words', () => {
  assert.equal(rulesHit('Enter your PAN here').length, 1);
  assert.equal(rulesHit('TAN details').length, 1);
  assert.deepEqual(rulesHit('Pan the camera, a tan colour, PANEL, company, Tanzania'), []);
});

test('flags PAN and TAN number formats, in any case', () => {
  assert.ok(rulesHit('ABCDE1234F').includes('PAN number format'));
  assert.ok(rulesHit('abcde1234f').includes('PAN number format'));
  assert.ok(rulesHit('HYDA12345B').includes('TAN number format'));
});

test('does not flag the company CIN', () => {
  assert.deepEqual(rulesHit('CIN: U62011TS2026PTC223955'), []);
});

test('flags banned claims in any case', () => {
  for (const s of ['Guaranteed results', 'GUARANTEED', '100% compliant', '100 per cent', 'Certified', 'VERIFIED', 'unverified', 'Government Approved', 'government-approved']) {
    assert.ok(rulesHit(s).length > 0, s);
  }
});

test('flags partners', () => {
  assert.ok(rulesHit('our filing partners').length > 0);
  assert.ok(rulesHit('Partnerships').length > 0);
});

test('extracts text, readable attributes, data-* attributes and JSON-LD; skips CSS and JS', () => {
  const html = `<!doctype html><html><head>
    <meta name="description" content="meta-text">
    <style>.a{width:100%}</style>
    <script type="module">const x = "js-text";</script>
    <script type="application/ld+json">{"name":"ld-text"}</script>
  </head><body><p>Hello<b>world</b></p><img alt="alt-text">
    <form data-msg-success-title="data-text"></form></body></html>`;
  const text = extractScannableText(html);
  for (const s of ['meta-text', 'ld-text', 'Hello', 'world', 'alt-text', 'data-text']) assert.ok(text.includes(s), s);
  assert.ok(!text.includes('100%'));
  assert.ok(!text.includes('js-text'));
});

test('adjacent elements do not merge into one word', () => {
  const text = extractScannableText('<ul><li>Foo</li><li>PAN</li></ul>');
  assert.equal(rulesHit(text).length, 1);
});

test('catches forbidden words placed in data attributes', () => {
  const text = extractScannableText('<form data-msg-success-body="Your enquiry is verified"></form>');
  assert.ok(rulesHit(text).includes('"verified"'));
});
