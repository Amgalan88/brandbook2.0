// Vercel Routing Middleware: брэндбүүкийн бүх файлыг (HTML, зураг, видео, PDF) нэвтрэх кодоор хаана.
// Код серверт шалгагдана — хуудасны эх кодонд харагдахгүй. Кодыг Vercel → Settings →
// Environment Variables дээр BRANDBOOK_CODE нэрээр сольж болно.
import { next } from '@vercel/functions';

const CODE = (process.env.BRANDBOOK_CODE || 'BB0808').trim().toUpperCase();
const COOKIE = 'bb_pass';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 хоног

async function tokenFor(code) {
  const data = new TextEncoder().encode('brandbook2.0:' + code);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

// Зөвхөн энэ сайтын дотоод зам руу буцаана (//evil.com гэх мэт гадаад холбоосыг хаана)
function safePath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : '/';
}

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const ICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#002D72"/><path fill="#FF8200" d="M10 50a12.48 12.48 0 1 0 24.96 0a12.48 12.48 0 1 0 -24.96 0ZM17.58 50a4.9 4.9 0 1 1 9.79 0a4.9 4.9 0 1 1 -9.79 0ZM41.68 46.4H69.86V34.64L90 50L69.86 65.36V53.6H41.68Z"/></svg>'
  );

function gatePage(nextPath, error) {
  const html = `<!doctype html>
<html lang="mn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#002D72">
<meta name="robots" content="noindex,nofollow">
<link rel="icon" type="image/svg+xml" href="${ICON}">
<title>Брэндбүүк — нэвтрэх</title>
<style>
:root{--ground:#F6EFE3;--surface:#FFFFFF;--ink:#002D72;--ink-2:#36507E;--line:rgba(0,45,114,.16);--signal:#FF8200;--no:#D62839;--shadow:0 18px 40px -26px rgba(0,30,80,.55);--f:'Noto Sans','Segoe UI',system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root{--ground:#041E42;--surface:#0B2A5B;--ink:#F6EFE3;--ink-2:#BCD0F0;--line:rgba(188,208,240,.2);--no:#FF6B78;--shadow:0 18px 40px -26px rgba(0,0,0,.8);color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;min-height:100dvh;display:grid;grid-template-columns:minmax(0,380px);justify-content:center;align-content:center;padding:24px 16px;background:var(--ground);color:var(--ink);font:400 16px/1.5 var(--f);-webkit-font-smoothing:antialiased}
.card{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:32px 28px 28px;box-shadow:var(--shadow)}
.logo{width:56px;height:56px;display:block;margin-bottom:20px}
.cap{font:700 12px/1.3 var(--f);letter-spacing:.2em;text-transform:uppercase;color:var(--signal);margin:0 0 6px}
h1{font-size:26px;line-height:1.15;font-weight:900;margin:0 0 8px}
p{margin:0 0 22px;color:var(--ink-2);font-size:15px}
label{display:block;font-weight:700;font-size:14px;margin-bottom:8px}
input{width:100%;font:800 22px/1 var(--f);letter-spacing:.18em;text-transform:uppercase;text-align:center;color:var(--ink);background:transparent;border:2px solid var(--line);border-radius:12px;padding:14px 12px}
input:focus{outline:none;border-color:var(--signal)}
input[aria-invalid="true"]{border-color:var(--no)}
.err{color:var(--no);font-size:14px;font-weight:600;margin:10px 0 0}
button{margin-top:18px;width:100%;font:800 16px/1 var(--f);color:#002D72;background:var(--signal);border:0;border-radius:12px;padding:16px;cursor:pointer}
button:hover{filter:brightness(1.06)}
button:focus-visible{outline:3px solid var(--ink);outline-offset:2px}
.foot{margin:20px 0 0;font-size:13px;text-align:center}
</style>
</head>
<body>
<main class="card">
<img class="logo" src="${ICON}" alt="">
<p class="cap">Эрээнээс MGL карго</p>
<h1>Брэндбүүк 2.0</h1>
<p>Энэ хуудас зөвхөн дотоод хэрэглээнд зориулагдсан. Үргэлжлүүлэхийн тулд нэвтрэх кодоо оруулна уу.</p>
<form method="post" action="/__unlock">
<input type="hidden" name="next" value="${escapeAttr(nextPath)}">
<label for="code">Нэвтрэх код</label>
<input id="code" name="code" type="password" autocomplete="current-password" autocapitalize="characters" spellcheck="false" required autofocus${error ? ' aria-invalid="true" aria-describedby="err"' : ''}>
${error ? '<p class="err" id="err" role="alert">Код буруу байна. Дахин оролдоно уу.</p>' : ''}
<button type="submit">Нэвтрэх</button>
</form>
<p class="foot">Код мэдэхгүй бол брэнд хариуцсан ажилтнаас асууна уу.</p>
</main>
</body>
</html>`;
  return new Response(html, {
    status: 401,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const token = await tokenFor(CODE);

  if (url.pathname === '/__unlock' && request.method === 'POST') {
    const form = await request.formData().catch(() => null);
    const entered = String(form?.get('code') || '').trim().toUpperCase();
    const nextPath = safePath(String(form?.get('next') || '/'));
    if ((await tokenFor(entered)) !== token) {
      await new Promise((r) => setTimeout(r, 700)); // таах оролдлогыг удаашруулна
      return gatePage(nextPath, true);
    }
    return new Response(null, {
      status: 303,
      headers: {
        location: nextPath,
        'cache-control': 'no-store',
        'set-cookie': `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  if (url.pathname === '/__lock') {
    return new Response(null, {
      status: 303,
      headers: { location: '/', 'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` },
    });
  }

  if (readCookie(request, COOKIE) === token) return next();

  const wantsPage = request.method === 'GET' && (request.headers.get('accept') || '').includes('text/html');
  if (wantsPage) return gatePage(safePath(url.pathname + url.search), false);
  return new Response('Нэвтрэх код шаардлагатай', {
    status: 401,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}
