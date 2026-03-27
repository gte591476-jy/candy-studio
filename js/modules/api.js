// ── Candy Studio: API Helpers ──
// Request utilities and backend detection

(function() {
  window.CS = window.CS || {};

  CS.API_URL = function() {
    return CS.useBackend ? '' : CS.API_DIRECT;
  };

  CS.authHeaders = function() {
    return CS.useBackend && CS.authToken ? { Authorization: 'Bearer ' + CS.authToken } : {};
  };

  CS.checkBackend = async function() {
    try {
      const r = await fetch('/api/health');
      if (r.ok) { CS.useBackend = true; return true; }
    } catch {}
    return false;
  };
})();
