// ----- token helpers -------------------------------------------------
function getToken() {
  const q = new URLSearchParams(location.search);
  const t = q.get('token') || localStorage.getItem('navi_token') || '';
  if (q.get('token') && localStorage.getItem('navi_token') !== q.get('token')) {
    localStorage.setItem('navi_token', q.get('token'));
  }
  return t;
}
function requireAuth() {
  const t = getToken();
  if (!t) location.replace('login.html?err=' + encodeURIComponent('Session expired'));
  return t;
}

// ----- base + routing ------------------------------------------------
const FRONT_BASE = (() => {
  const { origin, pathname } = location;
  return origin + pathname.replace(/\/[^/]*$/, '');
})();
function pageToHtml(name) { return `${name}.html`; }

function goTo(page, params = {}) {
  const url = new URL(`${FRONT_BASE}/${pageToHtml(page)}`);
  const t = getToken();
  const merged = { token: t, ...params };
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  location.href = url.toString();
}

// ----- link rewriter -------------------------------------------------
// 1) ?page=foo   -> foo.html
// 2) ./dashboard -> ./dashboard.html
// 3) add ?token=... to internal *.html links if missing
function rewriteLinks() {
  const t = getToken();
  const anchors = document.querySelectorAll('a[href]');

  anchors.forEach(a => {
    let href = a.getAttribute('href');
    if (!href || href === '#') return;

    try {
      // handle "?page=foo"
      if (/^\?page=/.test(href) || href.includes('?page=')) {
        const u = new URL(href, location.href);
        const p = u.searchParams.get('page');
        if (p) {
          u.searchParams.delete('page');
          href = `${pageToHtml(p)}${u.search}`;
          a.setAttribute('href', href);
        }
      }

      // add .html if extensionless local link
      if (!/^[a-z]+:\/\//i.test(href) && !/\.[a-z0-9]+$/i.test(href)) {
        const cleaned = href.replace(/\/+$/, '');
        if (cleaned) {
          href = `${cleaned}.html`;
          a.setAttribute('href', href);
        }
      }

      // append token to same-origin html links if missing
      const u2 = new URL(a.getAttribute('href'), location.href);
      const sameOrigin = u2.origin === location.origin;
      const looksHtml = /\.html$/i.test(u2.pathname);
      if (sameOrigin && looksHtml && t && !u2.searchParams.get('token')) {
        u2.searchParams.set('token', t);
        a.setAttribute('href', u2.toString());
      }
    } catch (e) {
      // ignore malformed URLs
    }
  });
}

// expose
window.goTo = goTo;
window.requireAuth = requireAuth;
window.getToken = getToken;
window.Q = new URLSearchParams(location.search);

// run after DOM is ready
document.addEventListener('DOMContentLoaded', rewriteLinks);