// Local QR for branch short links. No network call at render time.
// The short link 302-redirects to the branch site (built in another repo).
import QRCode from 'qrcode';

export const SHORT_ORIGIN = 'https://www.ereeneesmglcargo.mn/q/';
export const QR_DARK = '#002D72';
export const QR_LIGHT = '#FFFFFF';
export const QR_CAPTION = 'Уншуулаад сайт руу орно';
export const QR_ECL = 'M';
export const QUIET_MODULES = 4;

/** Names already used on cards, plus the branches the short-link service knows. */
export const BRANCHES = [
  { name: 'Дархан', slug: 'darkhan' },
  { name: 'Эрдэнэт', slug: 'erdenet' },
  { name: 'Нисэх', slug: 'nisekh' },
  { name: 'Яармаг-1', slug: 'yarmag-1' },
  { name: 'Яармаг-2', slug: 'yarmag-2' },
  { name: 'Улаанбаатар', slug: 'ulaanbaatar' },
  { name: 'Эрээн', slug: 'ereen' }
];

const NAMED = Object.fromEntries(BRANCHES.map((b) => [fold(b.name), b.slug]));

const CYR = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'i',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', ө: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ү: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
};

function fold(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/салбар/g, '')
    .replace(/төв\s*агуулах/g, '')
    .replace(/[\s._]+/g, '')
    .replace(/–|—/g, '-');
}

export function normalizeSlug(raw, loose = false) {
  let s = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/g, '');
  if (!loose) s = s.replace(/-+$/g, '');
  return s.slice(0, 48);
}

export function slugFromName(name) {
  const key = fold(name);
  if (!key) return '';
  if (NAMED[key]) return NAMED[key];
  let out = '';
  const src = String(name || '').trim().toLowerCase().replace(/салбар/g, ' ').replace(/төв\s*агуулах/g, ' ');
  for (const ch of src) {
    if (ch >= 'a' && ch <= 'z') out += ch;
    else if (ch >= '0' && ch <= '9') out += ch;
    else if (ch === '-' || ch === ' ' || ch === '_' || ch === '.' || ch === '–' || ch === '—') out += '-';
    else if (CYR[ch]) out += CYR[ch];
  }
  return normalizeSlug(out);
}

export function shortUrl(slug) {
  const s = normalizeSlug(slug);
  if (!s) return '';
  return SHORT_ORIGIN + s;
}

export function qrModel(text) {
  const url = String(text || '').trim();
  if (!url) throw new Error('QR text is empty');
  const qr = QRCode.create(url, { errorCorrectionLevel: QR_ECL });
  const n = qr.modules.size;
  const cells = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) if (qr.modules.get(r, c)) cells.push([c, r]);
  }
  // node-qrcode stores the level as a bit: M=0, L=1, H=2, Q=3
  const bit = qr.errorCorrectionLevel && qr.errorCorrectionLevel.bit;
  const eclName = { 0: 'M', 1: 'L', 2: 'H', 3: 'Q' }[bit] || '';
  return { url, n, cells, ecl: QR_ECL, level: eclName, version: qr.version };
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/** SVG tile: white rounded quiet zone, navy modules. Safe to inline in HTML. */
export function qrSvg(text) {
  const { url, n, cells } = qrModel(text);
  const q = QUIET_MODULES;
  const size = n + q * 2;
  const rx = Math.min(size * 0.08, 1.6).toFixed(2);
  const d = cells.map(([c, r]) => `M${c + q} ${r + q}h1v1h-1z`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="${esc(url)}"><rect width="${size}" height="${size}" rx="${rx}" fill="${QR_LIGHT}"/><path fill="${QR_DARK}" d="${d}"/></svg>`;
}
