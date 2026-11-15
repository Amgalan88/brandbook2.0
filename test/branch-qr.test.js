import test from 'node:test';
import assert from 'node:assert/strict';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { BRANCHES, QR_CAPTION, QR_DARK, QR_ECL, QR_PLACEHOLDER, SITE_ERROR, normalizeSlug, normalizeWebsite, qrModel, qrSvg, slugFromName, websiteCaption, websiteQrText } from '../lib/branch-qr.js';

function rasterize(svg, scale = 8) {
  const vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  assert.ok(vb, 'svg viewBox');
  const size = Number(vb[1]);
  const pad = scale * 2;
  const w = size * scale + pad * 2;
  const data = new Uint8ClampedArray(w * w * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
  }
  const path = svg.match(/<path fill="#002D72" d="([^"]+)"/);
  assert.ok(path, 'navy module path');
  const re = /M(\d+) (\d+)h1v1h-1z/g;
  let m;
  let count = 0;
  while ((m = re.exec(path[1]))) {
    count++;
    const x0 = pad + Number(m[1]) * scale;
    const y0 = pad + Number(m[2]) * scale;
    for (let py = y0; py < y0 + scale; py++) {
      for (let px = x0; px < x0 + scale; px++) {
        const i = (py * w + px) * 4;
        data[i] = 0; data[i + 1] = 45; data[i + 2] = 114; data[i + 3] = 255;
      }
    }
  }
  assert.ok(count > 20, 'modules drawn');
  return { data, width: w, height: w };
}

function decode(svg) {
  const img = rasterize(svg);
  const code = jsQR(img.data, img.width, img.height);
  assert.ok(code, 'jsQR decoded the SVG');
  return code.data;
}

test('known branch names stay stable for the card label', () => {
  for (const b of BRANCHES) {
    assert.equal(slugFromName(b.name), b.slug);
    assert.equal(slugFromName(b.name + ' салбар'), b.slug);
  }
  assert.equal(slugFromName('ДАРХАН САЛБАР'), 'darhan');
  assert.equal(slugFromName('Нисэх'), 'niseh');
  assert.equal(new Set(BRANCHES.map((b) => b.slug)).size, BRANCHES.length);
  assert.equal(slugFromName('Баянхонгор'), 'bayanhongor');
  assert.equal(normalizeSlug('erdenet-', true), 'erdenet-');
  assert.equal(normalizeSlug('erdenet-'), 'erdenet');
});

test('jsQR decodes exactly the typed website URL', () => {
  const withScheme = normalizeWebsite('https://erdenet.aicargo.mn');
  const bare = normalizeWebsite('erdenet.aicargo.mn');
  const padded = normalizeWebsite('  erdenet.aicargo.mn/salbar  ');
  assert.equal(withScheme.ok, true);
  assert.equal(withScheme.url, 'https://erdenet.aicargo.mn');
  assert.equal(bare.url, 'https://erdenet.aicargo.mn');
  assert.equal(padded.url, 'https://erdenet.aicargo.mn/salbar');
  assert.equal(normalizeWebsite('HTTP://Erdenet.aicargo.mn/Foo').url, 'http://Erdenet.aicargo.mn/Foo');
  assert.equal(normalizeWebsite('http://erdenet.aicargo.mn').url, 'http://erdenet.aicargo.mn');
  for (const raw of ['https://erdenet.aicargo.mn', 'erdenet.aicargo.mn', '  HTTPS://erdenet.aicargo.mn  ']) {
    const url = websiteQrText(raw);
    const svg = qrSvg(url);
    assert.match(svg, new RegExp(`fill="${QR_DARK}"`));
    assert.match(svg, /fill="#FFFFFF"/);
    assert.equal(decode(svg), url);
  }
  assert.equal(decode(qrSvg(websiteQrText('https://erdenet.aicargo.mn'))), 'https://erdenet.aicargo.mn');
  assert.equal(decode(qrSvg(websiteQrText('erdenet.aicargo.mn'))), 'https://erdenet.aicargo.mn');
  assert.equal(websiteCaption('https://erdenet.aicargo.mn'), 'erdenet.aicargo.mn');
  assert.equal(websiteCaption('https://erdenet.aicargo.mn/'), 'erdenet.aicargo.mn');
  const long = websiteCaption('https://erdenet.aicargo.mn/salbar/holboo-barih/contact-form');
  assert.ok(long.length <= 36);
  assert.match(long, /^erdenet\.aicargo\.mn/);
  assert.equal(long.includes('http'), false);
  assert.match(long, /…/);
  assert.equal(QR_CAPTION, 'Уншуулаад сайт руу орно');
  assert.equal(QR_PLACEHOLDER, 'Холбоос оруулна уу');
});

test('invalid website input is rejected', () => {
  for (const raw of ['', '   ', 'not a url', 'ftp://erdenet.aicargo.mn', 'javascript:alert(1)', 'https://', 'hello world', 'https://erdenet']) {
    const site = normalizeWebsite(raw);
    assert.equal(site.ok, false);
    assert.equal(site.url, '');
    assert.throws(() => websiteQrText(raw), (err) => err instanceof Error && err.message === (site.empty ? QR_PLACEHOLDER : SITE_ERROR));
  }
  assert.equal(normalizeWebsite('').empty, true);
  assert.equal(normalizeWebsite('   ').empty, true);
  assert.equal(normalizeWebsite('ftp://erdenet.aicargo.mn').empty, false);
  assert.equal(normalizeWebsite('notaurl').error, SITE_ERROR);
});

test('error correction is M, matching the qrcode library', () => {
  const url = 'https://erdenet.aicargo.mn';
  const model = qrModel(url);
  const lib = QRCode.create(url, { errorCorrectionLevel: 'M' });
  assert.equal(model.ecl, QR_ECL);
  assert.equal(model.n, lib.modules.size);
  assert.equal(model.level, 'M');
  assert.equal(decode(qrSvg(url)), url);
  assert.equal(decode(qrSvg('https://niseh.aicargo.mn/yarmag')), 'https://niseh.aicargo.mn/yarmag');
});
