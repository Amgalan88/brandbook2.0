import test from 'node:test';
import assert from 'node:assert/strict';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { BRANCHES, QR_CAPTION, QR_DARK, QR_ECL, normalizeSlug, qrModel, qrSvg, shortUrl, slugFromName } from '../lib/branch-qr.js';

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

test('known branch names map to stable slugs', () => {
  for (const b of BRANCHES) {
    assert.equal(slugFromName(b.name), b.slug);
    assert.equal(slugFromName(b.name + ' салбар'), b.slug);
    assert.equal(shortUrl(b.slug), `https://www.ereeneesmglcargo.mn/q/${b.slug}`);
  }
  assert.equal(slugFromName('ДАРХАН САЛБАР'), 'darkhan');
});

test('slug field accepts a typed override and rejects junk', () => {
  assert.equal(shortUrl(' Erdenet '), 'https://www.ereeneesmglcargo.mn/q/erdenet');
  assert.equal(shortUrl('Яармаг'), '');
  assert.equal(slugFromName('Баянхонгор'), 'bayankhongor');
  assert.equal(normalizeSlug('erdenet-', true), 'erdenet-');
  assert.equal(normalizeSlug('erdenet-'), 'erdenet');
  assert.equal(shortUrl('erdenet-2'), 'https://www.ereeneesmglcargo.mn/q/erdenet-2');
});

test('SVG QR encodes the exact short URL', () => {
  const url = 'https://www.ereeneesmglcargo.mn/q/erdenet';
  const svg = qrSvg(url);
  assert.match(svg, new RegExp(`fill="${QR_DARK}"`));
  assert.match(svg, /fill="#FFFFFF"/);
  assert.equal(decode(svg), url);
  assert.equal(QR_CAPTION, 'Уншуулаад сайт руу орно');
});

test('error correction is M, matching the qrcode library', () => {
  const url = 'https://www.ereeneesmglcargo.mn/q/darkhan';
  const model = qrModel(url);
  const lib = QRCode.create(url, { errorCorrectionLevel: 'M' });
  assert.equal(model.ecl, QR_ECL);
  assert.equal(model.n, lib.modules.size);
  assert.equal(model.level, 'M');
  assert.equal(decode(qrSvg(url)), url);
  assert.equal(decode(qrSvg('https://www.ereeneesmglcargo.mn/q/yarmag-1')), 'https://www.ereeneesmglcargo.mn/q/yarmag-1');
});
