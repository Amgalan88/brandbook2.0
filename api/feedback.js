// Санал хүсэлт: бичвэр + зураг (4 хүртэл) хүлээн авч Vercel Blob-д хадгална, ирсэн саналын жагсаалтыг буцаана.
// middleware.js нэвтрэх кодыг шалгадаг тул энд зөвхөн нэвтэрсэн хүн хүрнэ. Зургийг ч энэ функцээр
// дамжуулж үзүүлдэг тул private store дээр зураг кодгүйгээр нээгдэхгүй.
// Тохиргоо: Vercel → Storage → Blob → Create (Private) → энэ project-д Connect. BLOB_READ_WRITE_TOKEN автоматаар нэмэгдэнэ.
import { put, list, get } from '@vercel/blob';

const KINDS = ['Санал', 'Алдаа', 'Хүсэлт'];
const IMG_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_IMGS = 4;
const MAX_IMG = 3 * 1024 * 1024;
const MAX_TEXT = 3000;
const ENTRIES = 'feedback/entries/';
const IMAGES = 'feedback/img/';

const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
const clean = (v, n) => String(v ?? '').replace(/\r\n?/g, '\n').trim().slice(0, n);

// Store нь private эсвэл public байж болно — эхлээд private-ээр оролдоод, болохгүй бол public
let access = null;
async function withAccess(fn) {
  if (access) return fn(access);
  try {
    const r = await fn('private');
    access = 'private';
    return r;
  } catch (e) {
    const r = await fn('public').catch(() => { throw e; });
    access = 'public';
    return r;
  }
}
const store = (pathname, body, contentType) =>
  withAccess((a) => put(pathname, body, { access: a, contentType, addRandomSuffix: true }));
const read = (pathname) => withAccess((a) => get(pathname, { access: a }));

const imgUrl = (pathname) => '/api/feedback?img=' + encodeURIComponent(pathname);
const view = (e) => ({ id: e.id, at: e.at, kind: e.kind, branch: e.branch, name: e.name, text: e.text, images: e.images.map(imgUrl) });

export async function GET(request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return json({ entries: [], setup: true });
  const img = new URL(request.url).searchParams.get('img');
  if (img) {
    if (!img.startsWith(IMAGES) || img.includes('..')) return new Response('Олдсонгүй', { status: 404 });
    const r = await read(img).catch(() => null);
    if (!r || r.statusCode !== 200) return new Response('Олдсонгүй', { status: 404 });
    return new Response(r.stream, {
      headers: { 'content-type': r.blob.contentType, 'cache-control': 'private, max-age=31536000, immutable' },
    });
  }
  const { blobs } = await list({ prefix: ENTRIES, limit: 1000 });
  const recent = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(0, 100);
  const entries = await Promise.all(
    recent.map((b) => read(b.pathname).then((r) => (r && r.statusCode === 200 ? new Response(r.stream).json() : null)).catch(() => null))
  );
  return json({ entries: entries.filter(Boolean).map(view) });
}

export async function POST(request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return json({ error: 'Санал хадгалах сан хараахан тохируулаагүй байна.' }, 503);
  const form = await request.formData().catch(() => null);
  if (!form) return json({ error: 'Хүсэлт буруу байна.' }, 400);

  const text = clean(form.get('text'), MAX_TEXT);
  if (!text) return json({ error: 'Саналаа бичнэ үү.' }, 400);
  const files = form.getAll('img').filter((f) => typeof f === 'object' && f.size);
  if (files.length > MAX_IMGS) return json({ error: `Зураг ${MAX_IMGS} хүртэл хавсаргана.` }, 400);
  if (files.some((f) => !IMG_TYPES[f.type] || f.size > MAX_IMG)) return json({ error: 'Зураг JPG, PNG, WEBP, 3 МБ хүртэл байна.' }, 400);

  const at = new Date().toISOString();
  const id = at.replace(/\D/g, '').slice(0, 14) + '-' + crypto.randomUUID().slice(0, 8);
  const images = [];
  for (const [i, f] of files.entries()) {
    const r = await store(`${IMAGES}${id}-${i + 1}.${IMG_TYPES[f.type]}`, f, f.type);
    images.push(r.pathname);
  }
  const kind = clean(form.get('kind'), 20);
  const entry = {
    id,
    at,
    kind: KINDS.includes(kind) ? kind : KINDS[0],
    branch: clean(form.get('branch'), 60),
    name: clean(form.get('name'), 60),
    text,
    images,
  };
  await store(`${ENTRIES}${id}.json`, JSON.stringify(entry), 'application/json');
  return json({ ok: true, entry: view(entry) }, 201);
}
