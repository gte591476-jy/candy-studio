// ── Candy Studio Admin: User Management ──

(function() {
  window.CA = window.CA || {};

  // Cache memberships from admin config for the dropdown
  let _memberships = [];

  async function loadMemberships() {
    if (_memberships.length) return _memberships;
    try {
      const r = await CA.api('/api/admin/config');
      if (r.ok) {
        const cfg = await r.json();
        _memberships = cfg.memberships ? JSON.parse(cfg.memberships) : [];
      }
    } catch (e) { console.error('loadMemberships error', e); }
    return _memberships;
  }

  function membershipLabel(tier, expire) {
    if (!tier) return '<span class="text-gray-300 text-[10px]">—</span>';
    const now = new Date();
    const exp = expire ? new Date(expire) : null;
    const expired = exp && exp < now;
    const color = expired ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-600';
    const suffix = expired ? ' (已过期)' : '';
    return `<span class="text-[10px] font-bold px-2 py-0.5 rounded ${color}">${CA.esc(tier)}${suffix}</span>`;
  }

  function formatExpireDate(expire) {
    if (!expire) return '<span class="text-gray-300 text-[10px]">—</span>';
    const d = new Date(expire);
    const now = new Date();
    const expired = d < now;
    const dateStr = d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    return `<span class="text-[10px] ${expired ? 'text-red-400' : 'text-gray-400'}">${dateStr}</span>`;
  }

  CA.loadUsers = async function() {
    const s = document.getElementById('user-search')?.value || '';
    const r = await CA.api('/api/admin/users?search=' + encodeURIComponent(s)); if (!r.ok) return;
    const users = await r.json();
    document.getElementById('users-table').innerHTML = users.map(u => `<tr class="border-b border-gray-50 hover:bg-gray-50">
    <td class="py-2 pr-3 text-gray-400 text-xs">${u.id}</td>
    <td class="py-2 pr-3 text-xs">${CA.esc(u.email)}</td>
    <td class="py-2 pr-3 text-xs">${CA.esc(u.nickname)}</td>
    <td class="py-2 pr-3 font-bold text-green-600 text-xs">${parseFloat(u.points).toFixed(2)}</td>
    <td class="py-2 pr-3"><span class="text-[10px] font-bold px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}">${u.role}</span></td>
    <td class="py-2 pr-3">${membershipLabel(u.membership_tier, u.membership_expire_at)}</td>
    <td class="py-2 pr-3">${formatExpireDate(u.membership_expire_at)}</td>
    <td class="py-2 pr-3 text-gray-400 text-[10px]">${CA.formatTime(u.created_at)}</td>
    <td class="py-2 text-xs space-x-1">
      <button onclick="CA.editUser(${u.id})" class="text-blue-500 hover:underline">编辑</button>
      <button onclick="CA.quickRecharge(${u.id})" class="text-green-500 hover:underline">充值</button>
      ${u.role !== 'admin' ? `<button onclick="CA.deleteUser(${u.id},'${CA.esc(u.email)}')" class="text-red-400 hover:underline">删除</button>` : ''}
    </td>
  </tr>`).join('');
  };

  CA.quickRecharge = function(id) { document.getElementById('rc-user-id').value = id; CA.switchTab('recharge'); };

  CA.doRecharge = async function() {
    const uid = parseInt(document.getElementById('rc-user-id').value), amt = parseFloat(document.getElementById('rc-amount').value), desc = document.getElementById('rc-desc').value;
    if (!uid || isNaN(amt) || amt === 0) return CA.msg('rc-result', '请填写有效数据', false);
    const r = await CA.api(`/api/admin/user/${uid}/points`, { method: 'PUT', body: JSON.stringify({ amount: amt, description: desc }) });
    const d = await r.json();
    r.ok ? CA.msg('rc-result', `成功！余额: ${d.balance?.toFixed(2)}`, true) : CA.msg('rc-result', d.error, false);
    CA.loadUsers(); CA.loadStats();
  };

  async function populateMembershipDropdown(selectedTier) {
    const memberships = await loadMemberships();
    const select = document.getElementById('modal-membership-tier');
    select.innerHTML = '<option value="">无会员</option>' + memberships.map(m =>
      `<option value="${CA.esc(m.id)}" ${m.id === selectedTier ? 'selected' : ''}>${CA.esc(m.name)} (${m.id})</option>`
    ).join('');
    if (selectedTier) select.value = selectedTier;
  }

  CA.showCreateUser = function() {
    document.getElementById('modal-title').textContent = '新增用户';
    document.getElementById('modal-id').value = '';
    document.getElementById('modal-email').value = ''; document.getElementById('modal-nickname').value = '';
    document.getElementById('modal-role').value = 'user'; document.getElementById('modal-password').value = '';
    document.getElementById('modal-password').placeholder = '设置密码';
    document.getElementById('modal-membership-tier').value = '';
    document.getElementById('modal-membership-expire').value = '';
    populateMembershipDropdown('');
    document.getElementById('user-modal').classList.remove('hidden');
  };

  CA.editUser = async function(id) {
    const r = await CA.api(`/api/admin/user/${id}`); if (!r.ok) return; const u = await r.json();
    document.getElementById('modal-title').textContent = `编辑用户 #${id}`;
    document.getElementById('modal-id').value = id;
    document.getElementById('modal-email').value = u.email; document.getElementById('modal-nickname').value = u.nickname;
    document.getElementById('modal-role').value = u.role; document.getElementById('modal-password').value = '';
    document.getElementById('modal-password').placeholder = '留空不修改';
    // Populate membership fields
    await populateMembershipDropdown(u.membership_tier || '');
    if (u.membership_expire_at) {
      const d = new Date(u.membership_expire_at);
      // Format for datetime-local input: YYYY-MM-DDTHH:MM
      const pad = n => String(n).padStart(2, '0');
      document.getElementById('modal-membership-expire').value = 
        `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } else {
      document.getElementById('modal-membership-expire').value = '';
    }
    document.getElementById('user-modal').classList.remove('hidden');
  };

  CA.saveUser = async function() {
    const id = document.getElementById('modal-id').value;
    const membershipTier = document.getElementById('modal-membership-tier').value;
    const membershipExpire = document.getElementById('modal-membership-expire').value;
    const data = {
      email: document.getElementById('modal-email').value.trim(),
      nickname: document.getElementById('modal-nickname').value.trim(),
      role: document.getElementById('modal-role').value,
      password: document.getElementById('modal-password').value || undefined,
      membership_tier: membershipTier || '',
      membership_expire_at: membershipExpire || ''
    };
    let r;
    if (id) { r = await CA.api(`/api/admin/user/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
    else { if (!data.password) { alert('新用户必须设置密码'); return; } r = await CA.api('/api/admin/user', { method: 'POST', body: JSON.stringify(data) }); }
    if (r.ok) { CA.closeUserModal(); CA.loadUsers(); } else { const d = await r.json(); alert(d.error); }
  };

  CA.deleteUser = async function(id, email) {
    if (!confirm(`确定删除用户 ${email}？\n将删除该用户所有数据！`)) return;
    const r = await CA.api(`/api/admin/user/${id}`, { method: 'DELETE' });
    if (r.ok) CA.loadUsers(); else { const d = await r.json(); alert(d.error); }
  };

  CA.closeUserModal = function() { document.getElementById('user-modal').classList.add('hidden'); };
})();

