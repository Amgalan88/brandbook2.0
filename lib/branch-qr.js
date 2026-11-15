// Local QR for branch short links. No network call at render time.
// The short link 302-redirects to the branch site (built in another repo).
import QRCode from 'qrcode';

export const SHORT_ORIGIN = 'https://www.ereeneesmglcargo.mn/q/';
export const QR_DARK = '#002D72';
export const QR_LIGHT = '#FFFFFF';
export const QR_CAPTION = 'Уншуулаад сайт руу орно';
export const QR_ECL = 'M';
export const QUIET_MODULES = 4;

/** Branch names and the exact slugs used by www.ereeneesmglcargo.mn (mgl.branches). /q/<slug> only resolves these. */
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
