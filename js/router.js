/* Routes: / home, /guide view-only, /studio workspace. Old hashes redirect. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var STUDIO = {
    gen: 'tpl',
    tpl: 'tpl',
    logos: 'logos',
    bl: 'logo-branch',
    sg: 'sign',
    door: 'khaalga',
    fb: 'feedback',
    feedback: 'feedback',
    anim: 'anim',
    files: 'files',
    icons: 'icons',
    branch: 'branch',
    check: 'check'
  };

  function norm(p) {
    p = p || '/';
    p = p.replace(/\/index\.html$/, '') || '/';
    if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
    return p || '/';
  }

  function isGuideHash(hash) {
    return /^(ch\d+|type-|top|symbol|comp|vehicles|motion)/.test(hash);
  }

  function areaFor(path, hash) {
    path = norm(path);
    hash = hash || '';
    if (path === '/' && hash) {
      if (STUDIO[hash]) return { path: '/studio', hash: STUDIO[hash], area: 'studio', redirect: true };
      return { path: '/guide', hash: hash, area: 'guide', redirect: true };
    }
    if (path === '/guide' && STUDIO[hash] && !isGuideHash(hash)) {
      return { path: '/studio', hash: STUDIO[hash], area: 'studio', redirect: true };
    }
    if (path === '/studio') return { path: '/studio', hash: hash, area: 'studio', redirect: false };
    if (path === '/guide') return { path: '/guide', hash: hash, area: 'guide', redirect: false };
    return { path: '/', hash: '', area: 'home', redirect: false };
  }

  function relocate() {
    $$('[data-relocate]').forEach(function (el) {
      var mount = document.querySelector('[data-mount="' + el.getAttribute('data-relocate') + '"]');
      if (mount) mount.appendChild(el);
    });
    var src = document.getElementById('icon-lib');
    var mount = document.querySelector('[data-mount="icons"]');
    if (src && mount && !mount.getAttribute('data-filled')) {
      var clone = src.cloneNode(true);
      clone.removeAttribute('id');
      var clonedZip = clone.querySelector('#zip-icons');
      if (clonedZip) clonedZip.remove();
      src.querySelectorAll('[data-icon-dl]').forEach(function (b) {
        b.removeAttribute('data-icon-dl');
        b.removeAttribute('title');
      });
      var zip = document.getElementById('zip-icons');
      mount.appendChild(clone);
      if (zip) mount.appendChild(zip);
      mount.setAttribute('data-filled', '1');
    }
  }

  function show(area, hash) {
    document.documentElement.setAttribute('data-boot', area);
    document.body.setAttribute('data-area', area);
    document.body.classList.toggle('is-studio', area === 'studio');
    document.body.classList.toggle('is-guide', area === 'guide');
    document.body.classList.toggle('is-home', area === 'home');
    var home = $('#view-home');
    var guide = $('#view-guide');
    var studio = $('#view-studio');
    if (home) home.hidden = area !== 'home';
    if (guide) guide.hidden = area !== 'guide';
    if (studio) studio.hidden = area !== 'studio';
    $$('[data-nav]').forEach(function (a) {
      a.setAttribute('aria-current', a.getAttribute('data-nav') === area ? 'page' : 'false');
    });
    if (area === 'home' || !hash) {
      window.scrollTo(0, 0);
      return;
    }
    var el = document.getElementById(hash);
    if (el) el.scrollIntoView({ block: 'start' });
  }

  function apply() {
    var hash = (location.hash || '').replace(/^#/, '');
    var next = areaFor(location.pathname, hash);
    if (next.redirect) {
      history.replaceState({ bb: 1 }, '', next.path + (next.hash ? '#' + next.hash : ''));
    }
    show(next.area, next.redirect ? next.hash : hash);
  }

  function rewriteAnchors() {
    $$('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      if (STUDIO[id]) a.setAttribute('href', '/studio#' + STUDIO[id]);
      else a.setAttribute('href', '/guide#' + id);
    });
  }

  rewriteAnchors();
  relocate();
  apply();

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.hasAttribute('data-open-tpl')) return;
    if (a.hasAttribute('data-logout')) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('/__') === 0) return;
    var url;
    try { url = new URL(href, location.origin); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    var path = norm(url.pathname);
    if (path !== '/' && path !== '/guide' && path !== '/studio') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    e.preventDefault();
    history.pushState({ bb: 1 }, '', path + url.hash);
    var hash = url.hash.replace(/^#/, '');
    var next = areaFor(path, hash);
    show(next.area, hash);
  });

  window.addEventListener('popstate', apply);
  window.BBRoute = {
    apply: apply,
    show: show,
    toStudio: function (hash) {
      history.pushState({ bb: 1 }, '', '/studio' + (hash ? '#' + hash : ''));
      show('studio', hash || '');
    }
  };
})();
