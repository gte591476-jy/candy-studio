// ── Candy Studio: Task Queue ──
// Task queue rendering, management, and interaction

(function() {
  window.CS = window.CS || {};

  // ── Stopwatch helpers ──
  CS.formatElapsed = function(ms) {
    if (!ms || ms < 0) return '0:00';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min + ':' + (sec < 10 ? '0' : '') + sec;
  };

  // Live timer interval — updates active task timers every second
  if (window._taskTimerInterval) clearInterval(window._taskTimerInterval);
  window._taskTimerInterval = setInterval(function() {
    document.querySelectorAll('[data-timer-start]').forEach(function(el) {
      const start = parseInt(el.dataset.timerStart, 10);
      if (start) el.textContent = '⏱ ' + CS.formatElapsed(Date.now() - start);
    });
  }, 1000);

  CS.renderTasks = function() {
    const today = new Date().toLocaleDateString();
    const run = CS.S.tasks.filter(t => t.status === 'processing' || t.status === 'queued').length;
    const done = CS.S.tasks.filter(t => t.status === 'success').length;
    const fail = CS.S.tasks.filter(t => t.status === 'failed' || t.status === 'interrupted').length;
    const todayCost = CS.getDayCost(today);
    const yesterday = new Date(Date.now() - 864e5).toLocaleDateString();
    const yesterdayCost = CS.getDayCost(yesterday);
    document.getElementById('task-summary').textContent = CS.S.tasks.length === 0 ? '暂无任务' : `运行 ${run} · 完成 ${done} · 失败 ${fail}`;
    document.getElementById('today-cost').textContent = `今日算力: ${todayCost % 1 === 0 ? todayCost : todayCost.toFixed(2)}`;
    document.getElementById('yesterday-cost').textContent = yesterdayCost ? `昨日算力: ${yesterdayCost % 1 === 0 ? yesterdayCost : yesterdayCost.toFixed(2)}` : '';
    const icons = {
      queued: '<svg class="w-3.5 h-3.5 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      processing: '<svg class="w-3.5 h-3.5 text-blue-500 spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>',
      success: '<svg class="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
      failed: '<svg class="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      interrupted: '<svg class="w-3.5 h-3.5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    };
    const colors = { queued: 'bg-yellow-50 border-yellow-200', processing: 'bg-blue-50 border-blue-200', success: 'bg-green-50 border-green-200', failed: 'bg-red-50 border-red-200', interrupted: 'bg-orange-50 border-orange-200' };
    const labels = { queued: '排队中', processing: '生成中', success: '已完成', failed: '失败', interrupted: '已中断' };
    const txtc = { queued: 'text-yellow-600', processing: 'text-blue-600', success: 'text-green-600', failed: 'text-red-500', interrupted: 'text-orange-500' };
    const groups = {};
    CS.S.tasks.forEach(t => { const d = t.startDate || today; if (!groups[d]) groups[d] = []; groups[d].push(t); });
    const dateLabel = d => d === today ? '今天' : d === new Date(Date.now() - 864e5).toLocaleDateString() ? '昨天' : d;
    if (!window._collapsed) window._collapsed = {};
    let html = '';
    for (const date of Object.keys(groups)) {
      const items = groups[date];
      const dayCost = CS.getDayCost(date) || items.reduce((s, t) => s + (t.cost || 0), 0);
      const open = !window._collapsed[date];
      const cnt = items.length;
      html += `<div class="mt-2 mb-1 border border-gray-200 rounded-xl overflow-hidden">
      <div class="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer select-none hover:bg-gray-100 transition" onclick="CS.toggleGroup('${date}')">
        <div class="flex items-center gap-2">
          <svg class="w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>
          <span class="text-[11px] font-bold text-gray-600">${dateLabel(date)}</span>
          <span class="text-[10px] text-gray-400">${cnt}个任务</span>
        </div>
        <span class="text-[10px] font-bold text-orange-500">${dayCost % 1 === 0 ? dayCost : dayCost.toFixed(2)} 算力</span>
      </div>
      <div class="${open ? '' : 'hidden'} p-2 space-y-1.5" id="group-${date}">`;
      items.forEach(t => {
        html += `<div class="${colors[t.status] || ''} border rounded-lg p-2.5 hover:shadow-sm transition">
        <div class="flex items-center gap-1.5 mb-1">${icons[t.status] || ''}<span class="text-[10px] font-bold ${txtc[t.status] || ''}">${labels[t.status] || t.status}</span>
        ${t.startTimestamp ? ((t.status === 'processing' || t.status === 'queued') ? `<span class="text-[10px] font-bold text-blue-400 ml-1" data-timer-start="${t.startTimestamp}">⏱ ${CS.formatElapsed(Date.now() - t.startTimestamp)}</span>` : (t.endTimestamp ? `<span class="text-[10px] font-semibold text-gray-400 ml-1">⏱ ${CS.formatElapsed(t.endTimestamp - t.startTimestamp)}</span>` : '')) : ''}
        <span class="text-[10px] text-gray-300 ml-auto">${t.startTime}</span></div>
        <p class="text-[11px] text-gray-600 truncate mb-1" title="${CS.esc(t.prompt)}">${CS.esc(t.prompt)}</p>
        <div class="flex items-center gap-1.5 flex-wrap"><span class="text-[10px] text-gray-400">${t.modelName}</span>${t.ratio ? `<span class="text-[9px] font-semibold text-green-600 bg-green-50 px-1 py-0.5 rounded">${t.ratio}</span>` : ''}${t.cost ? `<span class="text-[9px] font-semibold text-orange-500 bg-orange-50 px-1 py-0.5 rounded">${t.cost}算力</span>` : ''}
        ${t.status === 'processing' || t.status === 'queued' ? `<span class="text-[10px] font-bold text-blue-500 ml-auto">${t.progress}</span>` : ''}</div>
        ${t.error ? `<p class="text-[9px] text-red-400 mt-1 truncate" title="${CS.esc(t.error)}">${CS.esc(t.error)}</p>` : ''}
        ${t.status === 'success' ? `<div class="flex gap-1.5 mt-2"><button onclick="CS.scrollToResult('${t.id}')" class="flex-1 text-[9px] font-semibold text-green-600 bg-green-100 hover:bg-green-200 rounded px-2 py-1 transition text-center">定位图片</button><button data-copy="${t.id}" onclick="CS.copyPrompt('${t.id}')" class="flex-1 text-[9px] font-semibold text-purple-600 bg-purple-100 hover:bg-purple-200 rounded px-2 py-1 transition text-center">复制提示词</button><button onclick="CS.deleteTask('${t.id}')" class="flex-1 text-[9px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded px-2 py-1 transition text-center">删除</button></div>` : ''}
        ${t.status === 'failed' || t.status === 'interrupted' ? `<div class="flex gap-1.5 mt-2"><button data-copy="${t.id}" onclick="CS.copyPrompt('${t.id}')" class="flex-1 text-[9px] font-semibold text-purple-600 bg-purple-100 hover:bg-purple-200 rounded px-2 py-1 transition text-center">复制提示词</button><button onclick="CS.deleteTask('${t.id}')" class="flex-1 text-[9px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded px-2 py-1 transition text-center">删除</button></div>` : ''}
      </div>`;
      });
      html += `</div></div>`;
    }
    document.getElementById('task-list').innerHTML = html;
  };

  CS.toggleGroup = function(date) { window._collapsed[date] = !window._collapsed[date]; CS.renderTasks(); };

  CS.copyPrompt = function(taskId) {
    const t = CS.S.tasks.find(x => x.id === taskId); if (!t) return;
    const ta = document.createElement('textarea');
    ta.value = t.prompt; ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    const btn = document.querySelector(`[data-copy="${taskId}"]`);
    if (btn) { btn.textContent = '已复制!'; setTimeout(() => { btn.textContent = '复制提示词'; }, 1000); }
  };

  CS.scrollToResult = function(taskId) {
    const task = CS.S.tasks.find(t => t.id === taskId);
    if (!task || !task.resultUrls?.length) return;
    // Use stored resultIds for precise matching (fixes concurrent tasks with same prompt)
    const ids = task.resultIds || [];
    if (ids.length > 0) {
      const el = document.querySelector(`[data-rid="${ids[0]}"]`);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); ids.forEach(rid => { const e = document.querySelector(`[data-rid="${rid}"]`); if (e) { e.classList.add('ring-2', 'ring-green-500'); setTimeout(() => e.classList.remove('ring-2', 'ring-green-500'), 2000); } }); return; }
    }
    // Fallback: match by prompt+model (for old tasks without resultIds)
    const resultItem = CS.S.history.find(h => h.status === 'success' && h.prompt === task.prompt && h.model === task.model && h.time);
    if (!resultItem) return;
    const el = document.querySelector(`[data-rid="${resultItem.id}"]`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-2', 'ring-green-500'); setTimeout(() => el.classList.remove('ring-2', 'ring-green-500'), 2000); }
  };

  CS.deleteTask = function(taskId) {
    const t = CS.S.tasks.find(x => x.id === taskId); if (!t) return;
    CS.S.tasks = CS.S.tasks.filter(x => x.id !== taskId);
    if (t.status === 'success') {
      const related = CS.S.history.filter(h => h.prompt === t.prompt && h.model === t.model);
      related.forEach(async h => { CS.S.history = CS.S.history.filter(x => x.id !== h.id); if (CS.blobCache[h.id]) { URL.revokeObjectURL(CS.blobCache[h.id]); delete CS.blobCache[h.id]; } try { await CS.dbDel(h.id); } catch {} });
      CS.saveHistory(); CS.renderResults();
    }
    CS.saveTasks(); CS.renderTasks();
  };

  CS.clearDoneTasks = function() {
    CS.S.tasks = CS.S.tasks.filter(t => t.status === 'processing' || t.status === 'queued');
    CS.saveTasks(); CS.renderTasks();
  };
})();
