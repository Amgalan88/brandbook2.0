import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const router = fs.readFileSync(new URL('../js/router.js', import.meta.url), 'utf8');
const middleware = fs.readFileSync(new URL('../middleware.js', import.meta.url), 'utf8');

test('print templates place a local QR of at least 20 mm', () => {
  assert.equal(html.includes('qrcode-generator'), false);
  assert.equal(html.includes('chart.googleapis.com'), false);
  assert.equal(html.includes('api.qrserver.com'), false);
  assert.match(html, /js\/branch-qr\.js/);
  assert.match(html, /const qrSize = 220/); // card, 10 px/mm → 22 mm
  assert.match(html, /const qSize = 104/); // brochure contact, 4 px/mm → 26 mm
  assert.match(html, /const cSize = 96/); // brochure cover, 4 px/mm → 24 mm
  assert.match(html, /const inSize = 88/); // brochure inside, 4 px/mm → 22 mm
  for (const px of [220, 104, 96, 88]) {
    const mm = px >= 200 ? px / 10 : px / 4;
    assert.ok(mm >= 20, `${px}px is ${mm}mm`);
  }
  assert.match(html, /pdf\.roundedRect/);
  assert.match(html, /#002D72|0, 45, 114/);
});

test('guide and studio are separate routes and old hashes are mapped', () => {
  assert.match(html, /id="view-guide"/);
  assert.match(html, /id="view-studio"/);
  assert.match(html, /id="view-home"/);
  assert.match(html, /data-nav="guide"/);
  assert.match(html, /data-nav="studio"/);
  assert.match(html, /Энэ загварыг бөглөх →/);
  assert.match(html, /Ажлын талбар/);
  assert.match(router, /\/studio/);
  assert.match(router, /\/guide/);
  assert.match(router, /gen: 'tpl'/);
  const vercel = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const sources = vercel.rewrites.map((r) => r.source);
  assert.ok(sources.includes('/guide'));
  assert.ok(sources.includes('/studio'));
});

test('print QR uses the typed website URL and not a short link', () => {
  assert.match(html, /Вэб сайтын холбоос/);
  assert.match(html, /https:\/\/erdenet\.aicargo\.mn/);
  assert.match(html, /Холбоос оруулна уу/);
  assert.match(html, /normalizeWebsite/);
  assert.match(html, /mgl2:site/);
  assert.match(html, /if \(t0\.qr\)/);
  assert.equal(html.includes('shortUrl'), false);
  assert.equal(html.includes('/q/<slug>'), false);
  assert.equal(html.includes('www.ereeneesmglcargo.mn/q/'), false);
  assert.match(html, /qr: true/);
  const qrTemplates = ['card_back', 'bro_out', 'bro_in'];
  for (const key of qrTemplates) assert.match(html, new RegExp(`T\\.${key} = \\{[\\s\\S]*?qr: true`));
});

test('access middleware and feedback API are unchanged entry points', () => {
  assert.match(middleware, /export default async function middleware/);
  assert.match(middleware, /\/__unlock/);
  assert.match(html, /\/api\/feedback/);
  assert.match(fs.readFileSync(new URL('../api/feedback.js', import.meta.url), 'utf8'), /@vercel\/blob/);
});
