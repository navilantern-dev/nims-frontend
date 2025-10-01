/**
 * google.script.run shim for static hosting.
 * It proxies calls to window.API[method](...args) and triggers the
 * configured success/failure handlers just like Apps Script HtmlService.
 *
 * Load order: api.js -> nav.js (optional) -> shim.google.run.js
 */
(function(){
  if (window.google && window.google.script && window.google.script.run) return; // already present (e.g., inside GAS)

  if (!window.API) {
    console.error('shim.google.run: window.API not found. Load js/api.js first.');
    return;
  }

  function createRunner() {
    let onSuccess = null;
    let onFailure = null;
    let runner = null;

    const handler = {
      get(_target, prop) {
        // Chainable handlers
        if (prop === 'withSuccessHandler') {
          return function(fn) { onSuccess = (typeof fn === 'function') ? fn : null; return runner; };
        }
        if (prop === 'withFailureHandler') {
          return function(fn) { onFailure = (typeof fn === 'function') ? fn : null; return runner; };
        }

        // Any other property is treated as an API method name
        return async function(...args) {
          try {
            const fn = window.API[prop];
            if (typeof fn !== 'function') {
              const err = new Error('google.script.run: method not mapped: ' + String(prop));
              throw err;
            }
            const res = await fn(...args);
            if (onSuccess) try { onSuccess(res); } catch (cbErr) { console.error(cbErr); }
            return res;
          } catch (err) {
            if (onFailure) {
              try { onFailure(err); } catch (cbErr) { console.error(cbErr); }
            } else {
              console.error(err);
            }
            return undefined;
          }
        };
      }
    };

    runner = new Proxy({}, handler);
    return runner;
  }

  // Expose google.script.run lookalike
  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = createRunner();
})();