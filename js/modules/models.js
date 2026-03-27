// ── Candy Studio: Model Selection ──
// Model dropdown rendering, selection, and ratio controls

(function() {
  window.CS = window.CS || {};

  function getModelList() {
    if (CS.S.currentMode === 'video') return CS.VIDEO_MODELS;
    return CS.MODELS;
  }

  CS.getDiscountedCost = function(baseCost) {
    let rate = 1.0;
    if (CS.memberships && CS.memberships.length > 0 && CS.S.user) {
      const tier = CS.S.user.membership_tier;
      const expire = CS.S.user.membership_expire_at;
      if (tier && tier !== 'none' && expire && new Date(expire) > new Date()) {
        const ms = CS.memberships.find(m => m.id === tier);
        if (ms && ms.discountRate) rate = parseFloat(ms.discountRate);
      }
      // Non-members or expired members keep rate = 1.0 (no discount)
    }
    const cost = baseCost * rate;
    return +(cost.toFixed(4));
  };

  CS.setMode = function(mode) {
    CS.S.currentMode = mode;
    document.getElementById('side-image').classList.toggle('active', mode === 'image');
    document.getElementById('side-video').classList.toggle('active', mode === 'video');

    const mList = getModelList();
    CS.S.model = mList[0].id;
    CS.S.ratio = mList[0].ratios[0];

    // Show resolution for image mode, hide for video
    document.getElementById('resolution-section').classList.toggle('hidden', mode === 'video');

    CS.renderModels(); CS.renderRatios(); CS.updateCostPreview();
  };

  CS.renderModels = function() {
    const mList = getModelList();
    const m = mList.find(m => m.id === CS.S.model) || mList[0];
    document.getElementById('sel-model-name').textContent = m.name;
    document.getElementById('sel-model-desc').textContent = m.desc;
    document.getElementById('sel-model-cost').textContent = CS.getDiscountedCost(m.cost) + '算力';
    document.getElementById('sel-model-badge').innerHTML = m.badge === 'new' ? '<span class="badge-new">NEW</span>' : m.badge === 'hot' ? '<span class="badge-hot">HOT</span>' : m.badge === 'pro' ? '<span class="badge-hot" style="background:linear-gradient(135deg,#8B5CF6,#6366F1)">PRO</span>' : '';
    document.getElementById('model-dropdown').innerHTML = mList.map(o => {
      const on = CS.S.model === o.id;
      const b = o.badge === 'new' ? '<span class="badge-new">NEW</span>' : o.badge === 'hot' ? '<span class="badge-hot">HOT</span>' : o.badge === 'pro' ? '<span class="badge-hot" style="background:linear-gradient(135deg,#8B5CF6,#6366F1)">PRO</span>' : '';
      const isImg = CS.S.currentMode !== 'video';
      const icon = isImg ?
        '<svg class="w-3.5 h-3.5 ' + (on ? 'text-white' : 'text-gray-400') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' :
        '<svg class="w-3.5 h-3.5 ' + (on ? 'text-white' : 'text-gray-400') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>';
      return `<div class="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition ${on ? 'bg-green-50' : 'hover:bg-gray-50'}" onclick="CS.selModel('${o.id}')">
      <div class="w-7 h-7 rounded-lg ${on ? 'bg-green-500' : 'bg-gray-100'} flex items-center justify-center shrink-0">${icon}</div>
      <div class="flex-1 min-w-0"><div class="flex items-center gap-2"><span class="text-xs font-bold ${on ? 'text-green-700' : 'text-gray-800'}">${o.name}</span>${b}</div>
        <div class="text-[10px] text-gray-400">${o.desc}</div></div>
      <span class="text-xs font-bold ${on ? 'text-green-600' : 'text-orange-500'} shrink-0">${CS.getDiscountedCost(o.cost)}算力</span>
      ${on ? '<svg class="w-4 h-4 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
    </div>`;
    }).join('');
  };

  CS.toggleModelDropdown = function() {
    const dd = document.getElementById('model-dropdown');
    const arrow = document.getElementById('model-arrow');
    dd.classList.toggle('hidden');
    arrow.classList.toggle('rotate-180');
  };

  CS.selModel = function(id) {
    CS.S.model = id;
    document.getElementById('model-dropdown').classList.add('hidden');
    document.getElementById('model-arrow').classList.remove('rotate-180');
    CS.renderModels();
    const mList = getModelList();
    const mc = mList.find(x => x.id === id);
    const showRes = CS.S.currentMode === 'image' && (id === 'nano-banana-2' || id === 'gemini-3.1-flash-image-preview');
    document.getElementById('resolution-section').classList.toggle('hidden', !showRes);
    if (mc && !mc.ratios.includes(CS.S.ratio)) { CS.S.ratio = mc.ratios[0]; }
    CS.renderRatios(); CS.updateCostPreview();
  };

  CS.renderRatios = function() {
    const mList = getModelList();
    const m = mList.find(m => m.id === CS.S.model);
    const allowed = m ? m.ratios : [];
    document.getElementById('ratio-grid').innerHTML = allowed.map(v => {
      const label = v === 'auto' ? 'Auto' : v;
      return `<button class="ratio-btn ${CS.S.ratio === v ? 'active' : ''} px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-gray-200 text-gray-500 cursor-pointer" onclick="CS.setRatio('${v}')">${label}</button>`;
    }).join('');
  };

  CS.setRatio = function(v) { CS.S.ratio = v; CS.renderRatios(); };

  CS.setRes = function(v) {
    CS.S.res = v;
    document.querySelectorAll('.res-btn[data-res]').forEach(b => b.classList.toggle('active', b.dataset.res === v));
  };

  CS.setBatch = function(d) {
    CS.S.batch = Math.max(1, Math.min(8, CS.S.batch + d));
    document.getElementById('batch-count').textContent = CS.S.batch;
    CS.updateCostPreview();
  };

  CS.updateCostPreview = function() {
    const mList = getModelList();
    const m = mList.find(m => m.id === CS.S.model);
    const c = m ? CS.getDiscountedCost(m.cost) : 0;
    const total = (c * CS.S.batch);
    document.getElementById('cost-preview').textContent = `消耗 ${total % 1 === 0 ? total : total.toFixed(2)} 算力`;
  };

  // Close dropdown when clicking outside
  document.addEventListener('click', e => {
    if (!document.getElementById('model-selector').contains(e.target)) {
      document.getElementById('model-dropdown').classList.add('hidden');
      document.getElementById('model-arrow').classList.remove('rotate-180');
    }
  });
})();
