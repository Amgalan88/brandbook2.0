// Local QR for a website URL the user types. No network call at render time.
// Branch names fill the card text only. They do not choose the QR target.
import QRCode from 'qrcode';

export const QR_DARK = '#002D72';
export const QR_LIGHT = '#FFFFFF';
export const QR_CAPTION = 'Уншуулаад сайт руу орно';
export const QR_PLACEHOLDER = 'Холбоос оруулна уу';
export const SITE_ERROR = 'Зөв вэб холбоос бичнэ үү. Жишээ: https://erdenet.aicargo.mn';
export const QR_ECL = 'M';
export const QUIET_MODULES = 4;

/** Branch names for the studio picker. The QR does not use these slugs. */
export const BRANCHES = [
  { name: 'Дархан', slug: 'darhan' },
  { name: 'Эрдэнэт', slug: 'erdenet' },
  { name: 'Эрдэнэт Шуурхай карго', slug: 'erdenethot' },
  { name: 'Эрдэнэт 4-р хороолол', slug: 'erdenet4' },
  { name: 'Багануур', slug: 'baganuur' },
  { name: 'Булган Хутаг-Өндөр', slug: 'bulgan-hutag-undur' },
  { name: 'Ховд', slug: 'hovd' },
  { name: 'Нисэх', slug: 'niseh' },
  { name: 'Нисэх Гарден хотхон', slug: 'niseh-garden-hothon' },
  { name: 'Нисэх Яармаг', slug: 'niseh-yarmag' },
  { name: 'Яармаг Хангарди Сити 2', slug: 'yarmag-han-garvd-siti-2' },
  { name: '100 айл', slug: '100-ail' },
  { name: '10-р хороолол', slug: '10-r-horoolol' },
  { name: '1-р хороолол', slug: '1-r-horoolol' },
  { name: 'Хороолол 3, 4 Дүүхээ', slug: 'horoolol-3-4-duuhee' },
  { name: 'Хорооллын хойд тал', slug: 'horoollyn-hoid-tal' },
  { name: '21', slug: '21' },
  { name: '22-ын товчоо', slug: '22-yn-tovchoo' },
  { name: '5-р сургууль', slug: '5-r-surguul' },
  { name: '805', slug: '805' },
  { name: 'Батоник', slug: 'batonik' },
  { name: 'Баруун салаа 4', slug: 'baruun-salaa-4' },
  { name: 'Дөлгөөн нуур', slug: 'dulguun-nuur' },
  { name: 'Жуков', slug: 'jukov' },
  { name: 'Кино үйлдвэр', slug: 'kino-uildver' },
  { name: 'Моносын уулзвар', slug: 'monosyn-uulzvar' },
  { name: 'Модны 2', slug: 'modnii-2' },
  { name: 'Налайх', slug: 'nalaih' },
  { name: 'Натур', slug: 'natur' },
  { name: 'Улиастай', slug: 'uliastai' },
  { name: 'Урт цагаан', slug: 'urt-tsagaan' },
  { name: 'Хан-Уул 19', slug: 'han-uul-19' },
  { name: 'ТБД Андууд', slug: 'tbd-anduud' },
  { name: 'Төмөр зам', slug: 'tumur-zam' },
  { name: 'Төмөр зам Ганзам', slug: 'tumur-zam-ganzam' },
  { name: 'Толгойт Их Наран', slug: 'tolgoit-ih-naran' },
  { name: 'Цайз', slug: 'tsaiz' },
  { name: 'Цирк', slug: 'tsirk' },
  { name: 'Чулуун-Овоо', slug: 'chuluun-ovoo' }
];

const NAMED = Object.fromEntries(BRANCHES.map((b) => [fold(b.name), b.slug]));

const CYR = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'i',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', ө: 'u', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ү: 'u',
  ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
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

function invalidSite() {
  return { ok: false, empty: false, url: '', display: '', error: SITE_ERROR };
}

/** Trim, add https:// when the scheme is missing, and accept only http(s) URLs. */
export function normalizeWebsite(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return { ok: false, empty: true, url: '', display: '', error: '' };
  if (/[\s\u0000-\u001f]/.test(trimmed) || trimmed.startsWith('//')) return invalidSite();

  let scheme = 'https';
  let body = trimmed;
  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  if (schemeMatch) {
    scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') return invalidSite();
    body = trimmed.slice(schemeMatch[0].length);
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return invalidSite();
  }
  if (!body || body.startsWith('/') || body.startsWith('.')) return invalidSite();

  const url = scheme + '://' + body;
  let parsed;
  try { parsed = new URL(url); } catch { return invalidSite(); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return invalidSite();
  if (parsed.username || parsed.password) return invalidSite();
  const host = parsed.hostname;
  if (!host || host.startsWith('.') || host.endsWith('.')) return invalidSite();
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
  if (ipv4) {
    if (host.split('.').some((n) => Number(n) > 255)) return invalidSite();
  } else if (host !== 'localhost' && !host.includes(':')) {
    if (!/^(?:[a-z0-9-]{1,63}\.)+[a-z0-9-]{2,63}$/i.test(host)) return invalidSite();
  }
  return { ok: true, empty: false, url, display: websiteCaption(url), error: '' };
}

/** URL shown under the QR: no protocol, one trailing slash dropped, long text cut in the middle. */
export function websiteCaption(url, max = 36) {
  const s = String(url || '').replace(/^https?:\/\//i, '').replace(/\/$/, '');
  const limit = Number(max) > 0 ? Number(max) : s.length;
  if (s.length <= limit) return s;
  if (limit <= 1) return '…';
  const keep = limit - 1;
  const head = Math.max(1, Math.ceil(keep * 0.62));
  const tail = Math.max(0, keep - head);
  return s.slice(0, head) + '…' + (tail ? s.slice(-tail) : '');
}

/** Normalized URL for a QR, or a throw when the field is empty or not an http(s) URL. */
export function websiteQrText(raw) {
  const site = normalizeWebsite(raw);
  if (!site.ok) {
    const err = new Error(site.empty ? QR_PLACEHOLDER : site.error);
    err.code = site.empty ? 'empty' : 'invalid';
    throw err;
  }
  return site.url;
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
