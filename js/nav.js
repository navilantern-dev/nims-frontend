<script>
// Base URL of your static site (works with custom domain or GitHub Pages)
const FRONT_BASE = (() => {
  const { origin, pathname } = location;
  return origin + pathname.replace(/\/[^/]*$/, '');
})();

// Map a page name to its file
function pageToHtml(name) {
  return `${name}.html`;
}

// Navigate to another page with query params
function goTo(page, params = {}) {
  const url = new URL(`${FRONT_BASE}/${pageToHtml(page)}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  location.href = url.toString();
}

// Quick access to current query params and token
const Q = new URLSearchParams(location.search);
const token = Q.get('token') || localStorage.getItem('navi_token') || '';

// ---- Legacy link auto-fixer ----------------------------------------------
// Converts hrefs like "?page=client_list&token=..." or "...?page=dashboard"
// into "client_list.html?token=..."
function rewriteLegacyLinks() {
  const anchors = document.querySelectorAll('a[href]');
  anchors.forEach(a => {
    try {
      const href = a.getAttribute('href');
      if (!href) return;

      // 1) Handle links that start with ?page=foo
      if (/^\?page=/.test(href)) {
        const u = new URL(href, location.href);
        const p = u.searchParams.get('page');
        if (p) {
          u.searchParams.delete('page');
          a.setAttribute('href', `${pageToHtml(p)}${u.search}`);
        }
        return;
      }

      // 2) Handle links that contain ?page=foo somewhere
      if (href.includes('?page=')) {
        const u = new URL(href, location.href);
        const p = u.searchParams.get('page');
        if (p) {
          u.searchParams.delete('page');
          a.setAttribute('href', `${pageToHtml(p)}${u.search}`);
        }
        return;
      }

      // 3) Handle extensionless local links like "./dashboard"
      if (!/^[a-z]+:\/\//i.test(href) && !/\.[a-z0-9]+$/i.test(href)) {
        // keep absolute/relative prefix if any
        const cleaned = href.replace(/\/+$/, '');
        if (cleaned && cleaned !== '#') {
          a.setAttribute('href', `${cleaned}.html`);
        }
      }
    } catch (_) { /* ignore malformed URLs */ }
  });
}

// Auto-run on load
document.addEventListener('DOMContentLoaded', rewriteLegacyLinks);

// Optional: expose for manual use in pages
window.goTo = goTo;
window.Q = Q;
window.FRONT_BASE = FRONT_BASE;
window.pageToHtml = pageToHtml;
</script>
