// ── Candy Studio Admin: Main Entry Point ──
// Tab switching, login, logout, initialization

(function() {
  window.CA = window.CA || {};

  // Global function aliases for HTML onclick handlers
  window.doLogin = CA.doLogin = async function() {
    const r = await CA.api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: document.getElementById('login-email').value.trim(), password: document.getElementById('login-pass').value }) });
    const d = await r.json();
    if (!r.ok || d.user?.role !== 'admin') { document.getElementById('login-error').textContent = d.error || '非管理员'; document.getElementById('login-error').classList.remove('hidden'); return; }
    CA.token = d.token; localStorage.setItem('candy_admin_token', CA.token); showDashboard(d.user);
  };

  window.doLogout = CA.doLogout = function() { CA.token = ''; localStorage.removeItem('candy_admin_token'); location.reload(); };

  async function showDashboard(u) {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('admin-page').classList.remove('hidden');
    document.getElementById('admin-name').textContent = u?.email || 'Admin';
    CA.switchTab('overview');
  }

  async function checkLogin() {
    if (!CA.token) return;
    try {
      const r = await CA.api('/api/user/profile');
      if (r.ok) { const u = await r.json(); if (u.role === 'admin') return showDashboard(u); }
    } catch {}
    CA.token = ''; localStorage.removeItem('candy_admin_token');
  }

  CA.switchTab = window.switchTab = function(name) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('tab-active'));
    document.getElementById('tab-' + name)?.classList.remove('hidden');
    document.querySelector(`[data-tab="${name}"]`)?.classList.add('tab-active');
    if (name === 'overview') CA.loadStats();
    if (name === 'users') CA.loadUsers();
    if (name === 'calls') CA.loadCalls();
    if (name === 'membership') CA.loadMemberships();
    if (name === 'modelprices') CA.loadModelPrices();
    if (name === 'apikeys') CA.loadApiKeys();
    if (name === 'pay') CA.loadPayConfig();
    if (name === 'orders') CA.loadOrders();
    if (name === 'announce') CA.loadAnnouncement();
    if (name === 'site') CA.loadSiteConfig();
    if (name === 'system') CA.loadSystemSettings();
  };

  // Global aliases for HTML onclick handlers
  window.showCreateUser = CA.showCreateUser;
  window.saveUser = CA.saveUser;
  window.closeUserModal = CA.closeUserModal;
  window.doRecharge = CA.doRecharge;
  window.addApiKey = CA.addApiKey;
  window.saveBaseUrl = CA.saveBaseUrl;
  window.savePayConfig = CA.savePayConfig;
  window.saveAnnouncement = CA.saveAnnouncement;
  window.saveSiteConfig = CA.saveSiteConfig;
  window.changePassword = CA.changePassword;
  window.loadUsers = CA.loadUsers;

  checkLogin();
})();
