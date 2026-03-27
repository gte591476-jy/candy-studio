// ── Candy Studio Admin: Call Records ──

(function() {
  window.CA = window.CA || {};

  CA.loadCalls = async function() {
    const r = await CA.api('/api/admin/calls');
    if (!r.ok) return;
    const rawCalls = await r.json();

    const groups = [];
    let currentGroup = null;
    rawCalls.forEach(c => {
      if (c.group_id && currentGroup && currentGroup.group_id === c.group_id) {
        currentGroup.items.push(c);
        if (c.status === 'success') currentGroup.successCount++;
        else if (c.status === 'failed') currentGroup.failCount++;
        else currentGroup.otherCount++;
        currentGroup.totalCost += parseFloat(c.cost);
      } else {
        currentGroup = {
          group_id: c.group_id,
          items: [c],
          email: c.email || '',
          nickname: c.nickname || '',
          model: c.model,
          prompt: c.prompt || '',
          totalCost: parseFloat(c.cost),
          successCount: c.status === 'success' ? 1 : 0,
          failCount: c.status === 'failed' ? 1 : 0,
          otherCount: (c.status !== 'success' && c.status !== 'failed') ? 1 : 0,
          createdAt: c.created_at,
          isGroup: !!c.group_id
        };
        groups.push(currentGroup);
      }
    });

    document.getElementById('calls-table').innerHTML = groups.map(g => {
      if (g.isGroup && g.items.length > 1) {
        const statusHtml = [];
        if (g.successCount) statusHtml.push(`<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-600">成功 ${g.successCount}</span>`);
        if (g.failCount) statusHtml.push(`<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-500">失败 ${g.failCount}</span>`);
        if (g.otherCount) statusHtml.push(`<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-600">进行中 ${g.otherCount}</span>`);

        return `<tr class="border-b border-gray-50 bg-blue-50/30">
        <td class="py-2 pr-3 text-gray-400 text-[10px] font-bold">BATCH</td>
        <td class="py-2 pr-3 text-xs">${CA.esc(g.email)}</td>
        <td class="py-2 pr-3 text-xs">${CA.esc(g.model)} <span class="text-gray-400">×${g.items.length}</span></td>
        <td class="py-2 pr-3 text-xs text-gray-500 max-w-[200px] truncate">${CA.esc(g.prompt)}</td>
        <td class="py-2 pr-3 font-bold text-orange-500 text-xs">${g.totalCost.toFixed(2)}</td>
        <td class="py-2 pr-3 flex flex-wrap gap-1">${statusHtml.join('')}</td>
        <td class="py-2 text-gray-400 text-[10px]">${CA.formatTime(g.createdAt)}</td>
      </tr>`;
      } else {
        const c = g.items[0];
        return `<tr class="border-b border-gray-50 hover:bg-gray-50">
        <td class="py-2 pr-3 text-gray-400 text-xs">${c.id}</td>
        <td class="py-2 pr-3 text-xs">${CA.esc(c.email || '')}</td>
        <td class="py-2 pr-3 text-xs">${CA.esc(c.model)}</td>
        <td class="py-2 pr-3 text-xs text-gray-500 max-w-[200px] truncate">${CA.esc(c.prompt || '')}</td>
        <td class="py-2 pr-3 font-bold text-orange-500 text-xs">${parseFloat(c.cost).toFixed(2)}</td>
        <td class="py-2 pr-3"><span class="text-[10px] font-bold px-2 py-0.5 rounded ${c.status === 'success' ? 'bg-green-100 text-green-600' : c.status === 'failed' ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-600'}">${c.status}</span></td>
        <td class="py-2 text-gray-400 text-[10px]">${CA.formatTime(c.created_at)}</td>
      </tr>`;
      }
    }).join('');
  };
})();
