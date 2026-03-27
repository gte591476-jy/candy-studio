// Candy Studio: Application State
// Central state object and persistence functions

(function() {
  window.CS = window.CS || {};

  CS.API_DIRECT = 'https://ai.comfly.chat';
  CS.useBackend = false;

  CS.getStoredAuthToken = function() {
    const sessionToken = sessionStorage.getItem('candy_token');
    if (sessionToken) return sessionToken;

    const legacyToken = localStorage.getItem('candy_token');
    if (legacyToken) {
      sessionStorage.setItem('candy_token', legacyToken);
      localStorage.removeItem('candy_token');
      return legacyToken;
    }

    return '';
  };

  CS.setStoredAuthToken = function(token) {
    if (token) sessionStorage.setItem('candy_token', token);
    else sessionStorage.removeItem('candy_token');

    // Remove legacy shared-token storage to avoid cross-tab account bleed.
    localStorage.removeItem('candy_token');
  };

  CS.authToken = CS.getStoredAuthToken();
  CS.blobCache = {};

  // User-specific storage prefix
  CS._storagePrefix = '';

  CS.setStoragePrefix = function(userId) {
    CS._storagePrefix = userId ? '_' + userId : '';
  };

  function skey(base) {
    return base + CS._storagePrefix;
  }

  CS.S = {
    currentMode: 'image',
    model: 'gemini-3.1-flash-image-preview',
    ratio: 'auto',
    res: '2K',
    batch: 1,
    imgs: [],
    history: [],
    tasks: [],
    cfg: { apiKey: '' },
    user: null
  };

  CS.costLog = {};

  CS.addCostLog = function(cost) {
    const d = new Date().toLocaleDateString();
    CS.costLog[d] = (CS.costLog[d] || 0) + cost;
    try { localStorage.setItem(skey('candy_cost_log'), JSON.stringify(CS.costLog)); } catch {}
  };

  CS.getDayCost = function(date) {
    return CS.costLog[date] || 0;
  };

  CS.saveHistory = function() {
    try { localStorage.setItem(skey('cf_hist'), JSON.stringify(CS.S.history.slice(0, 200))); } catch {}
  };

  CS.saveTasks = function() {
    try {
      const safe = CS.S.tasks.map(t => ({ ...t, inputImages: [] }));
      localStorage.setItem(skey('cf_tasks'), JSON.stringify(safe));
    } catch {}
  };

  CS.loadHistory = function() {
    try { CS.S.history = JSON.parse(localStorage.getItem(skey('cf_hist')) || '[]'); } catch { CS.S.history = []; }
  };

  CS.loadTasks = function() {
    try { CS.S.tasks = JSON.parse(localStorage.getItem(skey('cf_tasks')) || '[]'); } catch { CS.S.tasks = []; }
  };

  CS.loadCostLog = function() {
    try { CS.costLog = JSON.parse(localStorage.getItem(skey('candy_cost_log')) || '{}'); } catch { CS.costLog = {}; }
  };

  // Clear in-memory data (called on logout or account switch)
  CS.clearUserData = function() {
    CS.S.history = [];
    CS.S.tasks = [];
    CS.S.imgs = [];
    CS.costLog = {};
    CS._storagePrefix = '';
  };

  CS.switchUserContext = function(user) {
    const nextPrefix = user?.id ? '_' + user.id : '';
    if (CS._storagePrefix && CS._storagePrefix !== nextPrefix) {
      CS.clearUserData();
    }

    CS.S.user = user || null;
    CS.setStoragePrefix(user?.id);
    CS.loadHistory();
    CS.loadTasks();
    CS.loadCostLog();
  };
})();
