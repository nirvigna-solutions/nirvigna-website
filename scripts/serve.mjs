// Minimal static server for tests and Lighthouse. It mimics the intended CloudFront setup:
// applies the generated security-headers policy, serves /path/ as /path/index.html,
// redirects /path to /path/, and answers unknown paths with 404.html and status 404.
// Usage: node scripts/serve.mjs <site-dir> <port>
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { headerMapFromPolicy } from '../src/config/security-headers.mjs';

const [, , siteArg = 'build/site', portArg = '4321'] = process.argv;
const root = resolve(siteArg);
const port = Number(portArg);
const policyPath = join(dirname(root), 'cloudfront-response-headers-policy.json');
if (!existsSync(policyPath)) {
  console.error(`Missing ${policyPath}; run a build first.`);
  process.exit(1);
}
const securityHeaders = headerMapFromPolicy(JSON.parse(readFileSync(policyPath, 'utf8')));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

function send(res, status, filePath, extra = {}) {
  const body = filePath ? readFileSync(filePath) : '';
  res.writeHead(status, {
    ...securityHeaders,
    'Content-Type': filePath ? (TYPES[extname(filePath)] ?? 'application/octet-stream') : 'text/plain',
    'Cache-Control': 'no-cache',
    ...extra,
  });
  res.end(body);
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return send(res, 400, null);
  }
  const target = normalize(join(root, pathname));
  if (target !== root && !target.startsWith(root + sep)) return send(res, 400, null);

  if (pathname.endsWith('/') && isFile(join(target, 'index.html'))) return send(res, 200, join(target, 'index.html'));
  if (isFile(target)) return send(res, 200, target);
  if (!pathname.endsWith('/') && isFile(join(target, 'index.html'))) {
    return send(res, 301, null, { Location: `${pathname}/${url.search}` });
  }
  return send(res, 404, join(root, '404.html'));
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
