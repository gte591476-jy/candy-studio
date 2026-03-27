// ── Candy Studio: Utility Functions ──
// Pure helper functions used across modules

(function() {
  window.CS = window.CS || {};

  CS.uid = function() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  };

  CS.esc = function(s) {
    return s ? s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/'/g, '&#39;') : '';
  };

  CS.fmtSize = function(bytes) {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + 'MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + 'KB';
    return bytes + 'B';
  };

  CS.formatTime = function(t) {
    if (!t) return '';
    if (t instanceof Date) return t.toLocaleString();
    const iso = t.includes('T') ? (t.endsWith('Z') ? t : t + 'Z') : (t.replace(' ', 'T') + 'Z');
    const d = new Date(iso);
    return isNaN(d.getTime()) ? t : d.toLocaleString();
  };
})();
