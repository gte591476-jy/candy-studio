// ── Candy Studio Admin: Configuration Management ──
// API Keys, Pay Config, Announcement, Site Config, System Settings, Orders

(function() {
  window.CA = window.CA || {};

  // ── API Keys ──
  CA.loadApiKeys = async function() {
    const r = await CA.api('/api/admin/config'); if (!r.ok) return;
    const cfg = await r.json();
    const keys = cfg.api_keys ? JSON.parse(cfg.api_keys) : [];
    document.getElementById('api-base-url').value = cfg.api_base_url || '';
    const list = document.getElementById('apikey-list');
    if (!keys.length) { list.innerHTML = '<p class="text-xs text-gray-400">暂未配置</p>'; return; }
    list.innerHTML = keys.map((k, i) => `<div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
    <div class="flex-1 min-w-0">
      <div class="text-xs font-mono text-gray-600 truncate">${CA.esc(k.key.substring(0, 8))}****${CA.esc(k.key.slice(-4))}</div>
      <div class="flex items-center gap-2">
        <div class="text-[10px] text-gray-400">${CA.esc(k.name || '')}</div>
        ${k.url ? `<div class="text-[10px] text-blue-500 truncate max-w-[150px]">${CA.esc(k.url)}</div>` : ''}
        <span id="quota-${i}" class="text-[10px] ml-1"></span>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="CA.checkKeyQuota(${i}, '${CA.esc(k.key)}', '${CA.esc(k.url || '')}')" class="text-[10px] text-blue-500 hover:underline">查询余额</button>
      <button onclick="CA.deleteApiKey(${i})" class="text-[10px] text-red-500 hover:underline">删除</button>
    </div>
  </div>`).join('');
  };

  CA.checkKeyQuota = async function(i, key, baseUrl) {
    const el = document.getElementById(`quota-${i}`);
    const btn = event.target;
    const oldText = btn.textContent;
    btn.disabled = true; btn.textContent = '...'; el.textContent = '';
    try {
      const r = await CA.api('/api/admin/check-key-quota', { method: 'POST', body: JSON.stringify({ key, baseUrl }) });
      const d = await r.json();
      if (r.ok) {
        el.textContent = `余额: ${typeof d.quota === 'number' ? d.quota.toFixed(2) : d.quota}`;
        el.className = 'text-[10px] text-green-600 font-bold ml-1';
      } else {
        el.textContent = d.error || '失败';
        el.className = 'text-[10px] text-red-500 ml-1';
      }
    } catch (e) {
      el.textContent = '错误';
      el.className = 'text-[10px] text-red-500 ml-1';
    } finally {
      btn.disabled = false; btn.textContent = oldText;
    }
  };

  CA.addApiKey = async function() {
    const key = document.getElementById('new-apikey').value.trim(), name = document.getElementById('new-apikey-name').value.trim(), url = document.getElementById('new-apikey-url').value.trim();
    if (!key) return;
    const r = await CA.api('/api/admin/config'); const cfg = await r.json();
    const keys = cfg.api_keys ? JSON.parse(cfg.api_keys) : [];
    keys.push({ key, name: name || 'Key-' + (keys.length + 1), url: url || undefined, addedAt: new Date().toLocaleDateString() });
    await CA.api('/api/admin/config', { method: 'PUT', body: JSON.stringify({ key: 'api_keys', value: JSON.stringify(keys) }) });
    document.getElementById('new-apikey').value = ''; document.getElementById('new-apikey-name').value = ''; document.getElementById('new-apikey-url').value = '';
    CA.msg('apikey-result', '已添加', true); CA.loadApiKeys();
  };

  CA.deleteApiKey = async function(i) {
    const r = await CA.api('/api/admin/config'); const cfg = await r.json();
    const keys = cfg.api_keys ? JSON.parse(cfg.api_keys) : [];
    keys.splice(i, 1);
    await CA.api('/api/admin/config', { method: 'PUT', body: JSON.stringify({ key: 'api_keys', value: JSON.stringify(keys) }) });
    CA.loadApiKeys();
  };

  CA.saveBaseUrl = async function() {
    await CA.api('/api/admin/config', { method: 'PUT', body: JSON.stringify({ key: 'api_base_url', value: document.getElementById('api-base-url').value.trim() }) });
    CA.msg('apikey-result', '已保存', true);
  };

  // ── Memberships ──
  CA.loadMemberships = async function() {
    const r = await CA.api('/api/admin/config'); if (!r.ok) return;
    const cfg = await r.json();
    const ms = cfg.memberships ? JSON.parse(cfg.memberships) : [];
    const list = document.getElementById('membership-list');
    const empty = document.getElementById('membership-empty');
    if (!ms.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    list.innerHTML = ms.map((m, i) => `<tr class="border-b border-gray-50">
      <td class="py-2 pr-2 text-xs font-mono">${CA.esc(m.id)}</td>
      <td class="py-2 pr-2"><input type="text" class="inp py-1 px-2 text-xs" id="mem-name-${i}" value="${CA.esc(m.name)}"></td>
      <td class="py-2 pr-2"><input type="number" step="0.01" class="inp py-1 px-2 text-xs w-20" id="mem-price-${i}" value="${parseFloat(m.price)}"></td>
      <td class="py-2 pr-2"><input type="number" step="0.01" class="inp py-1 px-2 text-xs w-20" id="mem-points-${i}" value="${m.points}"></td>
      <td class="py-2 pr-2"><input type="number" class="inp py-1 px-2 text-xs w-16" id="mem-duration-${i}" value="${m.duration}"></td>
      <td class="py-2 pr-2"><input type="number" step="0.01" class="inp py-1 px-2 text-xs w-16" id="mem-discount-${i}" value="${m.discountRate}"></td>
      <td class="py-2 space-x-1">
        <button onclick="CA.saveMembership(${i})" class="text-[10px] text-green-600 hover:underline font-bold">保存</button>
        <button onclick="CA.deleteMembership(${i})" class="text-[10px] text-red-500 hover:underline">删除</button>
      </td>
    </tr>`).join('');
  };

  CA.saveMembership = async function(i) {
    const r = await CA.api('/api/admin/config'); const cfg = await r.json();
    const ms = cfg.memberships ? JSON.parse(cfg.memberships) : [];
    if (i >= ms.length) return;
    const name = document.getElementById(`mem-name-${i}`).value.trim();
    const price = parseFloat(document.getElementById(`mem-price-${i}`).value);
    const pts = parseFloat(document.getElementById(`mem-points-${i}`).value);
    const duration = parseInt(document.getElementById(`mem-duration-${i}`).value);
    const discountRate = parseFloat(document.getElementById(`mem-discount-${i}`).value);
    if (!name || isNaN(price) || isNaN(pts) || isNaN(duration) || isNaN(discountRate)) {
      return CA.msg('membership-result', '请填写完整且格式正确', false);
    }
    ms[i] = { ...ms[i], name, price, points: pts, duration, discountRate };
    await CA.api('/api/admin/config', { method: 'PUT', body: JSON.stringify({ key: 'memberships', value: JSON.stringify(ms) }) });
    CA.msg('membership-result', `${name} 已保存`, true);
    CA.loadMemberships();
  };

  CA.addMembership = async function() {
    const id = document.getElementById('new-mem-id').value.trim();
    const name = document.getElementById('new-mem-name').value.trim();
    const price = parseFloat(document.getElementById('new-mem-price').value);
    const points = parseFloat(document.getElementById('new-mem-points').value) || price;
    const duration = parseInt(document.getElementById('new-mem-duration').value);
    const discountRate = parseFloat(document.getElementById('new-mem-discount').value);

    if (!id || !name || isNaN(price) || isNaN(duration) || isNaN(discountRate) || isNaN(points)) {
      return CA.msg('membership-result', '请填写完整参数且格式正确', false);
    }

    const r = await CA.api('/api/admin/config'); const cfg = await r.json();
    const ms = cfg.memberships ? JSON.parse(cfg.memberships) : [];
    if (ms.find(m => m.id === id)) return CA.msg('membership-result', 'ID 已存在', false);

    ms.push({ id, name, price, points, duration, discountRate });
    await CA.api('/api/admin/config', { method: 'PUT', body: JSON.stringify({ key: 'memberships', value: JSON.stringify(ms) }) });
    
    document.getElementById('new-mem-id').value = ''; 
    document.getElementById('new-mem-name').value = ''; 
    document.getElementById('new-mem-price').value = ''; 
    document.getElementById('new-mem-points').value = ''; 
    document.getElementById('new-mem-duration').value = ''; 
    document.getElementById('new-mem-discount').value = '';
    
    CA.msg('membership-result', '配置已添加', true); 
    CA.loadMemberships();
  };

  CA.deleteMembership = async function(i) {
    if (!confirm('确定删除该会员套餐吗？')) return;
    const r = await CA.api('/api/admin/config'); const cfg = await r.json();
    const ms = cfg.memberships ? JSON.parse(cfg.memberships) : [];
    ms.splice(i, 1);
    await CA.api('/api/admin/config', { method: 'PUT', body: JSON.stringify({ key: 'memberships', value: JSON.stringify(ms) }) });
    CA.loadMemberships();
  };

  // ── Pay Config ──
  CA.loadPayConfig = async function() {
    const r = await CA.api('/api/admin/config'); if (!r.ok) return; const c = await r.json();
    document.getElementById('xunhu-appid').value = c.xunhu_appid || '';
    document.getElementById('xunhu-appsecret').value = c.xunhu_appsecret || '';
    document.getElementById('xunhu-notify-url').value = c.xunhu_notify_url || '';
    document.getElementById('xunhu-api-url').value = c.xunhu_api_url || 'https://api.xunhupay.com/payment/do.html';
  };

  CA.savePayConfig = async function() {
    const items = [['xunhu_appid', document.getElementById('xunhu-appid').value.trim()], ['xunhu_appsecret', document.getElementById('xunhu-appsecret').value.trim()], ['xunhu_notify_url', document.getElementById('xunhu-notify-url').value.trim()], ['xunhu_api_url', document.getElementById('xunhu-api-url').value]];
    for (const [k, v] of items) await CA.api('/api/admin/config', { method: 'PUT', body: JSON.stringify({ key: k, value: v }) });
    CA.msg('pay-result', '已保存', true);
  };

  // ── Orders ──
  CA.loadOrders = async function() {
    const r = await CA.api('/api/admin/orders'); if (!r.ok) return; const o = await r.json();
    document.getElementById('orders-table').innerHTML = o.map(o => `<tr class="border-b border-gray-50"><td class="py-2 pr-3 text-[10px] font-mono">${CA.esc(o.order_no)}</td><td class="py-2 pr-3 text-xs">${CA.esc(o.email || '')}</td><td class="py-2 pr-3 font-bold text-green-600 text-xs">${parseFloat(o.amount).toFixed(2)}</td><td class="py-2 pr-3 text-orange-500 text-xs">¥${parseFloat(o.pay_amount).toFixed(2)}</td><td class="py-2 pr-3"><span class="text-[10px] font-bold px-2 py-0.5 rounded ${o.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}">${o.status === 'paid' ? '已支付' : '待支付'}</span></td><td class="py-2 pr-3 text-[10px] text-gray-400 font-mono">${CA.esc(o.trade_no || '-')}</td><td class="py-2 text-[10px] text-gray-400">${CA.formatTime(o.created_at)}</td></tr>`).join('');
  };

  // ── Announcement ──
  CA.loadAnnouncement = async function() {
    const r = await CA.api('/api/admin/config'); if (!r.ok) return; const c = await r.json();
    document.getElementById('ann-enabled').checked = c.announcement_enabled === 'true';
    document.getElementById('ann-title').value = c.announcement_title || '';
    document.getElementById('ann-content').value = c.announcement_content || '';
  };

  CA.saveAnnouncement = async function() {
    const items = [['announcement_enabled', document.getElementById('ann-enabled').checked ? 'true' : 'false'], ['announcement_title', document.getElementById('ann-title').value], ['announcement_content', document.getElementById('ann-content').value]];
    for (const [k, v] of items) await CA.api('/api/admin/config', { method: 'PUT', body: JSON.stringify({ key: k, value: v }) });
    CA.msg('ann-result', '公告已保存', true);
  };

  // ── Site Config ──
  CA.loadSiteConfig = async function() {
    const r = await CA.api('/api/admin/config'); if (!r.ok) return; const c = await r.json();
    document.getElementById('site-name').value = c.site_name || '';
    document.getElementById('site-subtitle').value = c.site_subtitle || '';
    document.getElementById('site-logo').value = c.site_logo || '';
    document.getElementById('site-seo-title').value = c.site_seo_title || '';
    document.getElementById('site-seo-desc').value = c.site_seo_desc || '';
    document.getElementById('site-seo-keywords').value = c.site_seo_keywords || '';
  };

  CA.saveSiteConfig = async function() {
    const items = [['site_name', document.getElementById('site-name').value], ['site_subtitle', document.getElementById('site-subtitle').value], ['site_logo', document.getElementById('site-logo').value], ['site_seo_title', document.getElementById('site-seo-title').value], ['site_seo_desc', document.getElementById('site-seo-desc').value], ['site_seo_keywords', document.getElementById('site-seo-keywords').value]];
    for (const [k, v] of items) await CA.api('/api/admin/config', { method: 'PUT', body: JSON.stringify({ key: k, value: v }) });
    CA.msg('site-result', '已保存', true);
  };

  // ── System Settings ──
  CA.changePassword = async function() {
    const old = document.getElementById('sys-old-pass').value, nw = document.getElementById('sys-new-pass').value;
    if (!nw || nw.length < 6) return CA.msg('sys-result', '新密码至少6位', false);
    const r = await CA.api('/api/admin/password', { method: 'PUT', body: JSON.stringify({ oldPassword: old, newPassword: nw }) });
    const d = await r.json(); r.ok ? CA.msg('sys-result', '密码已修改', true) : CA.msg('sys-result', d.error, false);
  };

  CA.loadSystemSettings = async function() {
    // No specific settings to load in current version
  };

  // ── Model Prices ──
  CA.loadModelPrices = async function() {
    const r = await CA.api('/api/admin/config'); if (!r.ok) return;
    const cfg = await r.json();
    const loadedCosts = cfg.model_costs ? JSON.parse(cfg.model_costs) : {};
    
    if (!window.CS) return;
    
    const list = document.getElementById('modelprices-list');

    // Build category groups with prefixed keys
    const categories = [
      { prefix: 'image', label: '图片生成 (Banana API)', models: CS.MODELS || [] },
      { prefix: 'video', label: '视频生成 (Banana API)', models: CS.VIDEO_MODELS || [] },
    ];

    let html = '';
    for (const cat of categories) {
      if (!cat.models.length) continue;
      html += `<tr><td colspan="3" class="pt-5 pb-2 text-xs font-bold text-orange-500 uppercase tracking-wider border-b-2 border-orange-200">${cat.label}</td></tr>`;
      for (const m of cat.models) {
        const prefixedKey = cat.prefix + ':' + m.id;
        // Prefer prefixed key, fallback to legacy unprefixed key, then hardcoded default
        const currentCost = loadedCosts[prefixedKey] !== undefined ? loadedCosts[prefixedKey]
                          : loadedCosts[m.id] !== undefined ? loadedCosts[m.id]
                          : m.cost;
        html += `<tr class="border-b border-gray-50">
          <td class="py-2 pr-2 text-xs font-mono">${CA.esc(m.id)}</td>
          <td class="py-2 pr-2 text-xs">${CA.esc(m.name)}</td>
          <td class="py-2 pr-2">
            <input type="number" step="0.01" class="inp py-1 px-2 text-xs model-cost-input" data-model-id="${CA.esc(prefixedKey)}" value="${currentCost}">
          </td>
        </tr>`;
      }
    }
    list.innerHTML = html || '<tr><td colspan="3" class="py-2 text-xs text-center text-gray-400">未找到模型数据</td></tr>';
  };

  CA.saveModelPrices = async function() {
    const inputs = document.querySelectorAll('.model-cost-input');
    const modelCosts = {};
    inputs.forEach(inp => {
      const id = inp.getAttribute('data-model-id');
      const val = parseFloat(inp.value);
      if (!isNaN(val)) modelCosts[id] = val;
    });
    
    const resp = await CA.api('/api/admin/config', { method: 'PUT', body: JSON.stringify({ key: 'model_costs', value: JSON.stringify(modelCosts) }) });
    if (resp.ok) {
      CA.msg('modelprices-result', '基础算力价格已保存，实时生效', true);
    } else {
      CA.msg('modelprices-result', '保存失败，请检查登录状态', false);
    }
  };

})();
