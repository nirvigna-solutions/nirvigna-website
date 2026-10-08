// Test double for the contact form backend, implementing the contract in docs/WEBSITE_PLAN.md:
//   POST (urlencoded) -> 303 to the thank-you page, or 200 {"ok":true} when Accept: application/json.
// Test-only extras: GET /__submissions lists what was received.
// Usage: node scripts/stub-endpoint.mjs [port] [site-origin]
import { createServer } from 'node:http';

const port = Number(process.argv[2] ?? 4322);
const siteOrigin = process.argv[3] ?? 'http://localhost:4321';
const submissions = [];

const cors = { 'Access-Control-Allow-Origin': siteOrigin, Vary: 'Origin' };

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/__submissions') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(submissions));
  }

  if (req.method === 'POST' && url.pathname === '/submit') {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      submissions.push({
        contentType: req.headers['content-type'] ?? '',
        accept: req.headers.accept ?? '',
        origin: req.headers.origin ?? '',
        fields: [...new URLSearchParams(raw).entries()],
      });
      if ((req.headers.accept ?? '').includes('application/json')) {
        res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
        return res.end('{"ok":true}');
      }
      res.writeHead(303, { ...cors, Location: `${siteOrigin}/contact/thank-you/` });
      res.end();
    });
    return;
  }

  res.writeHead(404, cors);
  res.end();
}).listen(port, () => console.log(`Stub contact endpoint on http://127.0.0.1:${port}/submit`));
