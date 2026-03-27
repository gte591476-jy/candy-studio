// ── Candy Studio: Usage History ──
// Usage history modal and pagination

(function() {
  window.CS = window.CS || {};

  let usagePage = 0;

  CS.openUsage = async function() {
    if (!CS.useBackend) { alert('请先登录以查看历史记录'); return; }
    document.getElementById('usage-modal').classList.remove('hidden');
    usagePage = 0;
    await fetchUsageLogs();
  };

  CS.closeUsage = function() {
    document.getElementById('usage-modal').classList.add('hidden');
  };

  async function fetchUsageLogs() {
    const limit = 10;
    const offset = usagePage * limit;
    try {
      const r = await fetch(`/api/user/records?limit=${limit}&offset=${offset}`, { headers: CS.authHeaders() });
      const logs = await r.json();
      const list = document.getElementById('usage-list');
      list.innerHTML = logs.map(l => {
        const isConsume = l.type === 'consume';
        const isRefund = l.type === 'refund';
        const isRecharge = l.type === 'recharge';
        let color = 'text-gray-500';
        let sign = '';
        if (isConsume) { color = 'text-red-500'; sign = '-'; }
        else if (isRefund || isRecharge) { color = 'text-green-500'; sign = '+'; }

        return `<div class="bg-gray-50/50 rounded-xl p-3 flex items-center justify-between border border-gray-100 hover:bg-gray-50 transition">
        <div class="min-w-0 flex-1">
          <div class="text-[11px] font-bold text-gray-800 truncate">${l.description || '无描述'}</div>
          <div class="text-[9px] text-gray-400 mt-0.5">${CS.formatTime(l.created_at)}</div>
        </div>
        <div class="text-right ml-4">
          <div class="text-[12px] font-bold ${color}">${sign}${Math.abs(l.amount).toFixed(2)}</div>
          <div class="text-[9px] text-gray-400">余额: ${parseFloat(l.balance_after).toFixed(2)}</div>
        </div>
      </div>`;
      }).join('') || '<div class="text-center py-8 text-xs text-gray-400">暂无使用记录</div>';
      document.getElementById('usage-page-info').textContent = `第 ${usagePage + 1} 页`;
      document.getElementById('usage-prev').disabled = usagePage === 0;
      document.getElementById('usage-next').disabled = logs.length < limit;
    } catch {}
  }

  CS.changeUsagePage = async function(delta) {
    usagePage += delta;
    if (usagePage < 0) usagePage = 0;
    await fetchUsageLogs();
  };
})();
