// ── Candy Studio Admin: API & Utilities ──

(function() {
  window.CA = window.CA || {};

  CA.token = localStorage.getItem('candy_admin_token') || '';

  CA.api = async function(p, o = {}) {
    const h = { 'Content-Type': 'application/json' };
    if (CA.token) h['Authorization'] = 'Bearer ' + CA.token;
    return fetch(p, { ...o, headers: { ...h, ...o.headers } });
  };

  CA.esc = function(s) { return s ? s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; };

  CA.formatTime = function(t) {
    if (!t) return '';
    if (t instanceof Date) return t.toLocaleString();
    const iso = t.includes('T') ? (t.endsWith('Z') ? t : t + 'Z') : (t.replace(' ', 'T') + 'Z');
    const d = new Date(iso);
    return isNaN(d.getTime()) ? t : d.toLocaleString();
  };

  CA.msg = function(id, t, ok) {
    const e = document.getElementById(id);
    e.textContent = t;
    e.className = 'text-sm text-center ' + (ok ? 'text-green-600' : 'text-red-500');
    e.classList.remove('hidden');
    setTimeout(() => e.classList.add('hidden'), 3000);
  };
})();
