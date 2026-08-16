import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Verification suite for the PRODUCTION build. Start the server first:
//   npx astro build && NODE_ENV=production HOST=127.0.0.1 PORT=4321 node dist/server/entry.mjs
// then:  BASE=http://127.0.0.1:4321 node scripts/verify.mjs
// It creates a throwaway project, exercises it, and deletes it again.
const B = process.env.BASE ?? 'http://127.0.0.1:4321';
const UPLOADS = path.resolve(process.env.UPLOADS_DIR ?? './uploads');
const results = [];
const ok = (n, pass, detail) => results.push({ n, pass, detail });

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);
const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64), Buffer.from([0xff, 0xd9])]);

let cookie = '';
const H = (extra = {}) => ({ Origin: B, ...(cookie ? { Cookie: cookie } : {}), ...extra });
const jsonH = (extra = {}) => H({ 'Content-Type': 'application/json', ...extra });

const form = (type, buf, name, mime) => {
  const fd = new FormData();
  fd.append('type', type);
  fd.append('file', new Blob([buf], { type: mime }), name);
  return fd;
};

// --- auth ---------------------------------------------------------------
let r = await fetch(`${B}/api/admin/login`, {
  method: 'POST', headers: jsonH(), body: JSON.stringify({ username: 'a', password: 'x' }),
});
ok(11, r.status === 401, `short username -> ${r.status}`);

r = await fetch(`${B}/api/admin/login`, {
  method: 'POST', headers: jsonH(), body: JSON.stringify({ username: 'admin', password: 'wrong' }),
});
ok('11b', r.status === 401, `wrong password -> ${r.status}`);

r = await fetch(`${B}/api/admin/login`, {
  method: 'POST', headers: jsonH(), body: JSON.stringify({ username: 'admin', password: process.env.ADMIN_PASSWORD ?? 'admin123' }),
});
const setCookie = r.headers.get('set-cookie') ?? '';
cookie = setCookie.split(';')[0];
ok(12, r.status === 200 && /HttpOnly/i.test(setCookie) && /SameSite=Strict/i.test(setCookie),
  `login -> ${r.status}, ${setCookie.split(';').slice(1).join(';').trim()}`);

// --- guards -------------------------------------------------------------
r = await fetch(`${B}/api/admin/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: B }, body: '{}' });
ok(10, r.status === 401 && (r.headers.get('content-type') ?? '').includes('application/json'), `no cookie -> ${r.status} ${r.headers.get('content-type')}`);

r = await fetch(`${B}/admin`, { redirect: 'manual' });
ok(9, r.status === 302 && r.headers.get('location') === '/admin/login', `/admin -> ${r.status} ${r.headers.get('location')}`);

// expired session
const secret = fs.readFileSync('.env', 'utf8').match(/SESSION_SECRET=(.+)/)[1].trim();
const payload = Buffer.from(JSON.stringify({ authenticated: true, exp: Math.floor(Date.now() / 1000) - 60 })).toString('base64url');
const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
r = await fetch(`${B}/api/admin/projects`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: B, Cookie: `admin_session=${payload}.${sig}` }, body: '{}',
});
ok(13, r.status === 401, `expired session -> ${r.status}`);

// --- create / read ------------------------------------------------------
const slug = `verify-${Date.now()}`;
r = await fetch(`${B}/api/admin/projects`, {
  method: 'POST', headers: jsonH(),
  body: JSON.stringify({ slug, title: 'Verify Project', summary: 'summary line', problem: 'the problem', techStack: ['Astro', 'Prisma'] }),
});
const created = await r.json();
const id = created.project?.id;
ok(6, r.status === 201 && !!id, `create -> ${r.status}`);

let html = await (await fetch(`${B}/projects`)).text();
ok('6b', html.includes('Verify Project'), 'appears on /projects without rebuild');

html = await (await fetch(`${B}/projects/${slug}`)).text();
ok(5, html.includes('the problem') && !html.includes('Solution</h'), 'empty case-study sections omitted');

// --- edit ---------------------------------------------------------------
r = await fetch(`${B}/api/admin/projects/${id}`, {
  method: 'PUT', headers: jsonH(), body: JSON.stringify({ slug, title: 'Verify Project Renamed', published: true }),
});
html = await (await fetch(`${B}/projects/${slug}`)).text();
ok(7, r.status === 200 && html.includes('Verify Project Renamed'), `edit -> ${r.status}, live update`);

// --- unpublish ----------------------------------------------------------
await fetch(`${B}/api/admin/projects/${id}`, {
  method: 'PUT', headers: jsonH(), body: JSON.stringify({ slug, title: 'Verify Project Renamed', published: false }),
});
r = await fetch(`${B}/projects/${slug}`, { redirect: 'manual' });
const list = await (await fetch(`${B}/projects`)).text();
ok(8, r.status === 404 && !list.includes('Verify Project Renamed'), `unpublished -> status ${r.status} (want 404), inList=${list.includes('Verify Project Renamed')} (want false)`);
await fetch(`${B}/api/admin/projects/${id}`, {
  method: 'PUT', headers: jsonH(), body: JSON.stringify({ slug, title: 'Verify Project Renamed', published: true }),
});

// --- uploads ------------------------------------------------------------
const dir = path.join(UPLOADS, 'projects', id);
r = await fetch(`${B}/api/admin/projects/${id}/upload`, { method: 'POST', headers: H(), body: form('hero', png, 'a.png', 'image/png') });
const heroFilesAfterFirst = fs.readdirSync(dir).filter((f) => f.startsWith('hero.'));
ok('19a', r.status === 200 && heroFilesAfterFirst.length === 1, `hero png -> ${r.status}, disk: ${heroFilesAfterFirst}`);

r = await fetch(`${B}/api/admin/projects/${id}/upload`, { method: 'POST', headers: H(), body: form('hero', jpg, 'b.jpg', 'image/jpeg') });
const heroFiles = fs.readdirSync(dir).filter((f) => f.startsWith('hero.'));
ok(19, r.status === 200 && heroFiles.length === 1 && heroFiles[0] === 'hero.jpg', `hero replaced -> ${r.status}, disk: ${heroFiles}`);

for (const [label, buf, name, mime] of [
  ['svg', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), 'x.svg', 'image/svg+xml'],
  ['gif', Buffer.from('GIF89a'), 'x.gif', 'image/gif'],
  ['txt', Buffer.from('hello'), 'x.txt', 'text/plain'],
]) {
  r = await fetch(`${B}/api/admin/projects/${id}/upload`, { method: 'POST', headers: H(), body: form('gallery', buf, name, mime) });
  ok(label === 'txt' ? 15 : 17, r.status === 400, `${label} -> ${r.status}`);
}

r = await fetch(`${B}/api/admin/projects/${id}/upload`, {
  method: 'POST', headers: H(), body: form('gallery', Buffer.alloc(6 * 1024 * 1024), 'big.png', 'image/png'),
});
ok(16, r.status === 400, `6MB -> ${r.status}`);

// gallery cap
let last = 0;
for (let i = 0; i < 31; i++) {
  const res = await fetch(`${B}/api/admin/projects/${id}/upload`, { method: 'POST', headers: H(), body: form('gallery', png, `g${i}.png`, 'image/png') });
  last = res.status;
  if (res.status !== 201) break;
}
ok(18, last === 400, `31st gallery image -> ${last}`);

// gallery delete removes file
const galleryRes = await fetch(`${B}/api/admin/projects/${id}/gallery`, { headers: H() }).catch(() => null);
const galleryDir = path.join(dir, 'gallery');
const before = fs.readdirSync(galleryDir).length;
const projPage = await (await fetch(`${B}/projects/${slug}`)).text();
const firstImg = projPage.match(/\/uploads\/projects\/[^"']+\/gallery\/([^"']+)/);
let imageId = null;
if (galleryRes?.ok) {
  const g = await galleryRes.json();
  imageId = Array.isArray(g) ? g[0]?.id : g.images?.[0]?.id ?? g.gallery?.[0]?.id;
}
if (!imageId) {
  const { PrismaClient } = await import('@prisma/client');
  const p = new PrismaClient();
  imageId = (await p.galleryImage.findFirst({ where: { projectId: id } }))?.id;
  await p.$disconnect();
}
r = await fetch(`${B}/api/admin/projects/${id}/gallery/${imageId}`, { method: 'DELETE', headers: H() });
const after = fs.readdirSync(galleryDir).length;
ok(20, r.status === 200 && after === before - 1, `delete image -> ${r.status}, files ${before} -> ${after}`);

// --- CSRF ---------------------------------------------------------------
r = await fetch(`${B}/api/admin/projects/${id}/upload`, {
  method: 'POST', headers: { Cookie: cookie, Origin: 'http://evil.example.com' }, body: form('gallery', png, 'e.png', 'image/png'),
});
ok('CSRF', r.status === 403, `cross-origin upload -> ${r.status}`);

// --- slug change keeps files -------------------------------------------
const newSlug = `${slug}-renamed`;
await fetch(`${B}/api/admin/projects/${id}`, {
  method: 'PUT', headers: jsonH(), body: JSON.stringify({ slug: newSlug, title: 'Verify Project Renamed', published: true }),
});
const renamed = await (await fetch(`${B}/projects/${newSlug}`)).text();
ok(22, renamed.includes(`/uploads/projects/${id}/hero.jpg`), 'slug change keeps hero path');

// --- delete project -----------------------------------------------------
r = await fetch(`${B}/api/admin/projects/${id}`, { method: 'DELETE', headers: H() });
ok(21, r.status === 200 && !fs.existsSync(dir), `delete -> ${r.status}, dir removed: ${!fs.existsSync(dir)}`);

// --- logout -------------------------------------------------------------
r = await fetch(`${B}/api/admin/logout`, { method: 'POST', headers: H() });
const cleared = r.headers.get('set-cookie') ?? '';
ok(14, r.status === 200 && /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(cleared), `logout -> ${r.status}`);

// --- report -------------------------------------------------------------
let failed = 0;
for (const { n, pass, detail } of results) {
  if (!pass) failed++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  #${String(n).padEnd(5)} ${detail}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
