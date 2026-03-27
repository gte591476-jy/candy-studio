// ── Candy Studio: Main Entry Point ──
// Initializes all modules and starts the application

(function() {
  // Global function aliases for HTML onclick handlers
  // These map the old global function names to their CS namespace equivalents
  window.doLogin = CS.doLogin;
  window.doRegister = CS.doRegister;
  window.doLogout = CS.doLogout;
  window.refreshProfile = CS.refreshProfile;
  window.openUsage = CS.openUsage;
  window.openRecharge = CS.openRecharge;
  window.setMode = CS.setMode;
  window.toggleModelDropdown = CS.toggleModelDropdown;
  window.selModel = CS.selModel;
  window.setRatio = CS.setRatio;
  window.setRes = CS.setRes;
  window.setBatch = CS.setBatch;
  window.generate = CS.generate;
  window.clearAllUploads = CS.clearAllUploads;
  window.handleFileUpload = CS.handleFileUpload;
  window.handleDrop = CS.handleDrop;
  window.clearHistory = CS.clearHistory;
  window.clearDoneTasks = CS.clearDoneTasks;
  window.closePreview = CS.closePreview;
  window.downloadPreview = CS.downloadPreview;
  window.closeRecharge = CS.closeRecharge;
  window.confirmRecharge = CS.confirmRecharge;
  window.updateRechargePrice = CS.updateRechargePrice;
  window.closeUsage = CS.closeUsage;
  window.changeUsagePage = CS.changeUsagePage;

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { CS.closePreview(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') CS.generate();
  });

  // ── Init ──
  async function init() {
    await CS.checkBackend();
    CS.setMode(CS.S.currentMode);

    if (CS.authToken) {
      CS.S.cfg.apiKey = CS.authToken;
      await CS.refreshProfile();
      // refreshProfile sets prefix + loads user data + renders
      if (CS.S.user) CS.showUserInfo(); else CS.showLoginForm();
    } else {
      CS.loadHistory(); CS.loadTasks(); CS.loadCostLog();
      CS.renderTasks();
      CS.showLoginForm();
    }

    for (const item of CS.S.history) {
      if (item.status === 'success' && item.url) await CS.loadCachedUrl(item.id, item.url);
    }
    CS.saveHistory(); CS.renderResults();
    CS.resumeInterruptedTasks();

    // Fetch Public Config (API Base URL, Site Branding, Model Costs, Memberships)
    try {
      const r = await fetch('/api/public-config');
      if (r.ok) {
        const cfg = await r.json();
        console.log('[PublicConfig] Raw response:', JSON.stringify(cfg));
        if (cfg.api_base_url) {
          CS.API_DIRECT = cfg.api_base_url;
          const apiInfo = document.getElementById('api-base-info');
          if (apiInfo) apiInfo.textContent = CS.API_DIRECT.replace('https://', '').replace('http://', '');
        }
        if (cfg.site_name) {
          document.querySelectorAll('.site-name-text').forEach(el => el.textContent = cfg.site_name);
          document.title = `${cfg.site_name} | AI Creative Suite`;
        }
        if (cfg.site_subtitle) {
          document.querySelectorAll('.site-subtitle-text').forEach(el => el.textContent = cfg.site_subtitle);
        }
        // Apply model costs from admin config
        if (cfg.model_costs) {
          try {
            const loadedCosts = (typeof cfg.model_costs === 'string') ? JSON.parse(cfg.model_costs) : cfg.model_costs;
            console.log('[PublicConfig] model_costs:', loadedCosts);
            const applyCosts = (list, prefix) => {
              if (list) list.forEach(m => {
                const prefixedKey = prefix + ':' + m.id;
                // Prefer category-prefixed key, fallback to legacy unprefixed key
                const val = loadedCosts[prefixedKey] !== undefined ? loadedCosts[prefixedKey]
                          : loadedCosts[m.id] !== undefined ? loadedCosts[m.id]
                          : undefined;
                if (val !== undefined) {
                  m.cost = parseFloat(val);
                }
              });
            };
            applyCosts(CS.MODELS, 'image');
            applyCosts(CS.VIDEO_MODELS, 'video');
          } catch(e) { console.error('[PublicConfig] Error applying model costs:', e); }
        } else {
          console.log('[PublicConfig] No model_costs in response');
        }
        // Apply memberships from admin config
        if (cfg.memberships) {
          try {
            CS.memberships = (typeof cfg.memberships === 'string') ? JSON.parse(cfg.memberships) : cfg.memberships;
            console.log('[PublicConfig] memberships loaded:', CS.memberships);
          } catch(e) { console.error('[PublicConfig] Error applying memberships:', e); }
        } else {
          console.log('[PublicConfig] No memberships in response');
        }
        CS.renderModels();
        CS.updateCostPreview();
      }
    } catch (e) { console.error('[PublicConfig] Fetch error:', e); }

    // Announcements
    try {
      const r = await fetch('/api/announcement');
      if (r.ok) {
        const d = await r.json();
        if (d.enabled && d.content) {
          const hash = btoa(encodeURIComponent(d.title + d.content)).substring(0, 20);
          if (localStorage.getItem('candy_ann_read') !== hash) {
            document.getElementById('ann-popup-title').textContent = d.title || '公告';
            document.getElementById('ann-popup-content').textContent = d.content;
            document.getElementById('announcement-modal').classList.remove('hidden');
            document.getElementById('announcement-modal').querySelector('button').onclick = () => {
              document.getElementById('announcement-modal').classList.add('hidden');
              localStorage.setItem('candy_ann_read', hash);
            };
          }
        }
      }
    } catch {}
  }

  init();
})();
