let token=localStorage.getItem('candy_admin_token')||'';
let dailyChart,modelChart;

async function api(p,o={}){const h={'Content-Type':'application/json'};if(token)h['Authorization']='Bearer '+token;return fetch(p,{...o,headers:{...h,...o.headers}});}
function esc(s){return s?s.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''}
function formatTime(t){
  if(!t)return '';
  if(t instanceof Date)return t.toLocaleString();
  const iso=t.includes('T')?(t.endsWith('Z')?t:t+'Z'):(t.replace(' ','T')+'Z');
  const d=new Date(iso);
  return isNaN(d.getTime())?t:d.toLocaleString();
}
function msg(id,t,ok){const e=document.getElementById(id);e.textContent=t;e.className='text-sm text-center '+(ok?'text-green-600':'text-red-500');e.classList.remove('hidden');setTimeout(()=>e.classList.add('hidden'),3000)}

async function doLogin(){
  const r=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:document.getElementById('login-email').value.trim(),password:document.getElementById('login-pass').value})});
  const d=await r.json();
  if(!r.ok||d.user?.role!=='admin'){document.getElementById('login-error').textContent=d.error||'非管理员';document.getElementById('login-error').classList.remove('hidden');return}
  token=d.token;localStorage.setItem('candy_admin_token',token);showDashboard(d.user);
}
function doLogout(){token='';localStorage.removeItem('candy_admin_token');location.reload()}
async function showDashboard(u){document.getElementById('login-page').classList.add('hidden');document.getElementById('admin-page').classList.remove('hidden');document.getElementById('admin-name').textContent=u?.email||'Admin';switchTab('overview')}
async function checkLogin(){if(!token)return;try{const r=await api('/api/user/profile');if(r.ok){const u=await r.json();if(u.role==='admin')return showDashboard(u)}}catch{}token='';localStorage.removeItem('candy_admin_token')}

// ── Stats + Charts ──
async function loadStats(){
  try{
    const r=await api('/api/admin/stats');if(!r.ok)return;const d=await r.json();
    document.getElementById('stats-grid').innerHTML=[
      {l:'用户总数',v:d.userCount,c:'blue'},{l:'总调用(成功)',v:d.totalCalls,c:'green'},{l:'今日调用',v:d.todayCalls,c:'purple'},{l:'今日消耗',v:d.todayCost?.toFixed(2),c:'orange'}
    ].map(s=>`<div class="stat-card card p-4"><div class="text-[10px] text-gray-400 mb-1">${s.l}</div><div class="text-xl font-bold text-${s.c}-600">${s.v}</div></div>`).join('');

    const days=(d.dailyStats||[]).map(r=>r.day?.substring(5)||'');
    const counts=(d.dailyStats||[]).map(r=>parseInt(r.count));
    const costs=(d.dailyStats||[]).map(r=>parseFloat(r.cost));
    if(dailyChart)dailyChart.destroy();
    dailyChart=new Chart(document.getElementById('chart-daily'),{type:'line',data:{labels:days,datasets:[{label:'调用次数',data:counts,borderColor:'#22c55e',tension:.3,fill:false},{label:'算力消耗',data:costs,borderColor:'#f97316',tension:.3,fill:false,yAxisID:'y1'}]},options:{responsive:true,plugins:{legend:{position:'bottom',labels:{font:{size:10}}}},scales:{y:{beginAtZero:true},y1:{position:'right',beginAtZero:true,grid:{display:false}}}}});

    const mLabels=(d.modelStats||[]).map(r=>r.model?.replace('gemini-3.1-flash-image-preview','Nano Banana 2')||'');
    const mCounts=(d.modelStats||[]).map(r=>parseInt(r.count));
    if(modelChart)modelChart.destroy();
    modelChart=new Chart(document.getElementById('chart-model'),{type:'doughnut',data:{labels:mLabels,datasets:[{data:mCounts,backgroundColor:['#22c55e','#3b82f6','#f97316','#8b5cf6','#ef4444','#06b6d4']}]},options:{responsive:true,plugins:{legend:{position:'bottom',labels:{font:{size:10}}}}}});
  }catch{}
}

// ── Users ──
async function loadUsers(){
  const s=document.getElementById('user-search')?.value||'';
  const r=await api('/api/admin/users?search='+encodeURIComponent(s));if(!r.ok)return;
  const users=await r.json();
  document.getElementById('users-table').innerHTML=users.map(u=>`<tr class="border-b border-gray-50 hover:bg-gray-50">
    <td class="py-2 pr-3 text-gray-400 text-xs">${u.id}</td>
    <td class="py-2 pr-3 text-xs">${esc(u.email)}</td>
    <td class="py-2 pr-3 text-xs">${esc(u.nickname)}</td>
    <td class="py-2 pr-3 font-bold text-green-600 text-xs">${parseFloat(u.points).toFixed(2)}</td>
    <td class="py-2 pr-3"><span class="text-[10px] font-bold px-2 py-0.5 rounded ${u.role==='admin'?'bg-purple-100 text-purple-600':'bg-gray-100 text-gray-500'}">${u.role}</span></td>
    <td class="py-2 pr-3 text-gray-400 text-[10px]">${formatTime(u.created_at)}</td>
    <td class="py-2 text-xs space-x-1">
      <button onclick="editUser(${u.id})" class="text-blue-500 hover:underline">编辑</button>
      <button onclick="quickRecharge(${u.id})" class="text-green-500 hover:underline">充值</button>
      ${u.role!=='admin'?`<button onclick="deleteUser(${u.id},'${esc(u.email)}')" class="text-red-400 hover:underline">删除</button>`:''}
    </td>
  </tr>`).join('');
}
function quickRecharge(id){document.getElementById('rc-user-id').value=id;switchTab('recharge')}
async function doRecharge(){
  const uid=parseInt(document.getElementById('rc-user-id').value),amt=parseFloat(document.getElementById('rc-amount').value),desc=document.getElementById('rc-desc').value;
  if(!uid||isNaN(amt)||amt===0)return msg('rc-result','请填写有效数据',false);
  const r=await api(`/api/admin/user/${uid}/points`,{method:'PUT',body:JSON.stringify({amount:amt,description:desc})});
  const d=await r.json();
  r.ok?msg('rc-result',`成功！余额: ${d.balance?.toFixed(2)}`,true):msg('rc-result',d.error,false);
  loadUsers();loadStats();
}

function showCreateUser(){
  document.getElementById('modal-title').textContent='新增用户';
  document.getElementById('modal-id').value='';
  document.getElementById('modal-email').value='';document.getElementById('modal-nickname').value='';
  document.getElementById('modal-role').value='user';document.getElementById('modal-password').value='';
  document.getElementById('modal-password').placeholder='设置密码';
  document.getElementById('user-modal').classList.remove('hidden');
}
async function editUser(id){
  const r=await api(`/api/admin/user/${id}`);if(!r.ok)return;const u=await r.json();
  document.getElementById('modal-title').textContent=`编辑用户 #${id}`;
  document.getElementById('modal-id').value=id;
  document.getElementById('modal-email').value=u.email;document.getElementById('modal-nickname').value=u.nickname;
  document.getElementById('modal-role').value=u.role;document.getElementById('modal-password').value='';
  document.getElementById('modal-password').placeholder='留空不修改';
  document.getElementById('user-modal').classList.remove('hidden');
}
async function saveUser(){
  const id=document.getElementById('modal-id').value;
  const data={email:document.getElementById('modal-email').value.trim(),nickname:document.getElementById('modal-nickname').value.trim(),role:document.getElementById('modal-role').value,password:document.getElementById('modal-password').value||undefined};
  let r;
  if(id){r=await api(`/api/admin/user/${id}`,{method:'PUT',body:JSON.stringify(data)})}
  else{if(!data.password){alert('新用户必须设置密码');return}r=await api('/api/admin/user',{method:'POST',body:JSON.stringify(data)})}
  if(r.ok){closeUserModal();loadUsers()}else{const d=await r.json();alert(d.error)}
}
async function deleteUser(id,email){if(!confirm(`确定删除用户 ${email}？\n将删除该用户所有数据！`))return;const r=await api(`/api/admin/user/${id}`,{method:'DELETE'});if(r.ok)loadUsers();else{const d=await r.json();alert(d.error)}}
function closeUserModal(){document.getElementById('user-modal').classList.add('hidden')}

// ── Calls ──
async function loadCalls(){
  const r=await api('/api/admin/calls');
  if(!r.ok)return;
  const rawCalls=await r.json();
  
  // Grouping logic
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
        email: c.email||'',
        nickname: c.nickname||'',
        model: c.model,
        prompt: c.prompt||'',
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
      if(g.successCount) statusHtml.push(`<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-600">成功 ${g.successCount}</span>`);
      if(g.failCount) statusHtml.push(`<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-500">失败 ${g.failCount}</span>`);
      if(g.otherCount) statusHtml.push(`<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-600">进行中 ${g.otherCount}</span>`);
      
      return `<tr class="border-b border-gray-50 bg-blue-50/30">
        <td class="py-2 pr-3 text-gray-400 text-[10px] font-bold">BATCH</td>
        <td class="py-2 pr-3 text-xs">${esc(g.email)}</td>
        <td class="py-2 pr-3 text-xs">${esc(g.model)} <span class="text-gray-400">×${g.items.length}</span></td>
        <td class="py-2 pr-3 text-xs text-gray-500 max-w-[200px] truncate">${esc(g.prompt)}</td>
        <td class="py-2 pr-3 font-bold text-orange-500 text-xs">${g.totalCost.toFixed(2)}</td>
        <td class="py-2 pr-3 flex flex-wrap gap-1">${statusHtml.join('')}</td>
        <td class="py-2 text-gray-400 text-[10px]">${formatTime(g.createdAt)}</td>
      </tr>`;
    } else {
      const c = g.items[0];
      return `<tr class="border-b border-gray-50 hover:bg-gray-50">
        <td class="py-2 pr-3 text-gray-400 text-xs">${c.id}</td>
        <td class="py-2 pr-3 text-xs">${esc(c.email||'')}</td>
        <td class="py-2 pr-3 text-xs">${esc(c.model)}</td>
        <td class="py-2 pr-3 text-xs text-gray-500 max-w-[200px] truncate">${esc(c.prompt||'')}</td>
        <td class="py-2 pr-3 font-bold text-orange-500 text-xs">${parseFloat(c.cost).toFixed(2)}</td>
        <td class="py-2 pr-3"><span class="text-[10px] font-bold px-2 py-0.5 rounded ${c.status==='success'?'bg-green-100 text-green-600':c.status==='failed'?'bg-red-100 text-red-500':'bg-yellow-100 text-yellow-600'}">${c.status}</span></td>
        <td class="py-2 text-gray-400 text-[10px]">${formatTime(c.created_at)}</td>
      </tr>`;
    }
  }).join('');
}

// ── API Keys ──
async function loadApiKeys(){
  const r=await api('/api/admin/config');if(!r.ok)return;
  const cfg=await r.json();
  const keys=cfg.api_keys?JSON.parse(cfg.api_keys):[];
  document.getElementById('api-base-url').value=cfg.api_base_url||'';
  const list=document.getElementById('apikey-list');
  if(!keys.length){list.innerHTML='<p class="text-xs text-gray-400">暂未配置</p>';return}
  list.innerHTML=keys.map((k,i)=>`<div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
    <div class="flex-1 min-w-0">
      <div class="text-xs font-mono text-gray-600 truncate">${esc(k.key.substring(0,8))}****${esc(k.key.slice(-4))}</div>
      <div class="flex items-center gap-2">
        <div class="text-[10px] text-gray-400">${esc(k.name||'')}</div>
        ${k.url?`<div class="text-[10px] text-blue-500 truncate max-w-[150px]">${esc(k.url)}</div>`:''}
        <span id="quota-${i}" class="text-[10px] ml-1"></span>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="checkKeyQuota(${i}, '${esc(k.key)}', '${esc(k.url||'')}')" class="text-[10px] text-blue-500 hover:underline">查询余额</button>
      <button onclick="deleteApiKey(${i})" class="text-[10px] text-red-500 hover:underline">删除</button>
    </div>
  </div>`).join('');
}
async function checkKeyQuota(i, key, baseUrl) {
  const el = document.getElementById(`quota-${i}`);
  const btn = event.target;
  const oldText = btn.textContent;
  btn.disabled = true; btn.textContent = '...'; el.textContent = '';
  try {
    const r = await api('/api/admin/check-key-quota', {
      method: 'POST',
      body: JSON.stringify({ key, baseUrl })
    });
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
}
async function addApiKey(){const key=document.getElementById('new-apikey').value.trim(),name=document.getElementById('new-apikey-name').value.trim(),url=document.getElementById('new-apikey-url').value.trim();if(!key)return;const r=await api('/api/admin/config');const cfg=await r.json();const keys=cfg.api_keys?JSON.parse(cfg.api_keys):[];keys.push({key,name:name||'Key-'+(keys.length+1),url:url||undefined,addedAt:new Date().toLocaleDateString()});await api('/api/admin/config',{method:'PUT',body:JSON.stringify({key:'api_keys',value:JSON.stringify(keys)})});document.getElementById('new-apikey').value='';document.getElementById('new-apikey-name').value='';document.getElementById('new-apikey-url').value='';msg('apikey-result','已添加',true);loadApiKeys()}
async function deleteApiKey(i){const r=await api('/api/admin/config');const cfg=await r.json();const keys=cfg.api_keys?JSON.parse(cfg.api_keys):[];keys.splice(i,1);await api('/api/admin/config',{method:'PUT',body:JSON.stringify({key:'api_keys',value:JSON.stringify(keys)})});loadApiKeys()}
async function saveBaseUrl(){await api('/api/admin/config',{method:'PUT',body:JSON.stringify({key:'api_base_url',value:document.getElementById('api-base-url').value.trim()})});msg('apikey-result','已保存',true)}

// ── Pay Config ──
async function loadPayConfig(){const r=await api('/api/admin/config');if(!r.ok)return;const c=await r.json();document.getElementById('xunhu-appid').value=c.xunhu_appid||'';document.getElementById('xunhu-appsecret').value=c.xunhu_appsecret||'';document.getElementById('xunhu-notify-url').value=c.xunhu_notify_url||'';document.getElementById('xunhu-api-url').value=c.xunhu_api_url||'https://api.xunhupay.com/payment/do.html'}
async function savePayConfig(){const items=[['xunhu_appid',document.getElementById('xunhu-appid').value.trim()],['xunhu_appsecret',document.getElementById('xunhu-appsecret').value.trim()],['xunhu_notify_url',document.getElementById('xunhu-notify-url').value.trim()],['xunhu_api_url',document.getElementById('xunhu-api-url').value]];for(const[k,v]of items)await api('/api/admin/config',{method:'PUT',body:JSON.stringify({key:k,value:v})});msg('pay-result','已保存',true)}

// ── Orders ──
async function loadOrders(){const r=await api('/api/admin/orders');if(!r.ok)return;const o=await r.json();document.getElementById('orders-table').innerHTML=o.map(o=>`<tr class="border-b border-gray-50"><td class="py-2 pr-3 text-[10px] font-mono">${esc(o.order_no)}</td><td class="py-2 pr-3 text-xs">${esc(o.email||'')}</td><td class="py-2 pr-3 font-bold text-green-600 text-xs">${parseFloat(o.amount).toFixed(2)}</td><td class="py-2 pr-3 text-orange-500 text-xs">¥${parseFloat(o.pay_amount).toFixed(2)}</td><td class="py-2 pr-3"><span class="text-[10px] font-bold px-2 py-0.5 rounded ${o.status==='paid'?'bg-green-100 text-green-600':'bg-yellow-100 text-yellow-600'}">${o.status==='paid'?'已支付':'待支付'}</span></td><td class="py-2 pr-3 text-[10px] text-gray-400 font-mono">${esc(o.trade_no||'-')}</td><td class="py-2 text-[10px] text-gray-400">${formatTime(o.created_at)}</td></tr>`).join('')}

// ── Announcement ──
async function loadAnnouncement(){const r=await api('/api/admin/config');if(!r.ok)return;const c=await r.json();document.getElementById('ann-enabled').checked=c.announcement_enabled==='true';document.getElementById('ann-title').value=c.announcement_title||'';document.getElementById('ann-content').value=c.announcement_content||''}
async function saveAnnouncement(){const items=[['announcement_enabled',document.getElementById('ann-enabled').checked?'true':'false'],['announcement_title',document.getElementById('ann-title').value],['announcement_content',document.getElementById('ann-content').value]];for(const[k,v]of items)await api('/api/admin/config',{method:'PUT',body:JSON.stringify({key:k,value:v})});msg('ann-result','公告已保存',true)}

// ── Site Config ──
async function loadSiteConfig(){const r=await api('/api/admin/config');if(!r.ok)return;const c=await r.json();document.getElementById('site-name').value=c.site_name||'';document.getElementById('site-subtitle').value=c.site_subtitle||'';document.getElementById('site-logo').value=c.site_logo||'';document.getElementById('site-seo-title').value=c.site_seo_title||'';document.getElementById('site-seo-desc').value=c.site_seo_desc||'';document.getElementById('site-seo-keywords').value=c.site_seo_keywords||''}
async function saveSiteConfig(){const items=[['site_name',document.getElementById('site-name').value],['site_subtitle',document.getElementById('site-subtitle').value],['site_logo',document.getElementById('site-logo').value],['site_seo_title',document.getElementById('site-seo-title').value],['site_seo_desc',document.getElementById('site-seo-desc').value],['site_seo_keywords',document.getElementById('site-seo-keywords').value]];for(const[k,v]of items)await api('/api/admin/config',{method:'PUT',body:JSON.stringify({key:k,value:v})});msg('site-result','已保存',true)}

// ── System Settings ──
async function changePassword(){
  const old=document.getElementById('sys-old-pass').value,nw=document.getElementById('sys-new-pass').value;
  if(!nw||nw.length<6)return msg('sys-result','新密码至少6位',false);
  const r=await api('/api/admin/password',{method:'PUT',body:JSON.stringify({oldPassword:old,newPassword:nw})});
  const d=await r.json();r.ok?msg('sys-result','密码已修改',true):msg('sys-result',d.error,false);
}
async function saveAccessCode(){
  const code=document.getElementById('sys-access-code').value.trim();
  await api('/api/admin/config',{method:'PUT',body:JSON.stringify({key:'admin_access_code',value:code})});
  msg('sys-result','已保存。请同时修改 .env 中的 ADMIN_ACCESS_CODE',true);
}
async function loadSystemSettings(){const r=await api('/api/admin/config');if(!r.ok)return;const c=await r.json();document.getElementById('sys-access-code').value=c.admin_access_code||''}

function switchTab(name){
  document.querySelectorAll('.tab-content').forEach(el=>el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(el=>el.classList.remove('tab-active'));
  document.getElementById('tab-'+name)?.classList.remove('hidden');
  document.querySelector(`[data-tab="${name}"]`)?.classList.add('tab-active');
  if(name==='overview')loadStats();if(name==='users')loadUsers();if(name==='calls')loadCalls();if(name==='apikeys')loadApiKeys();if(name==='pay')loadPayConfig();
  if(name==='orders')loadOrders();if(name==='announce')loadAnnouncement();if(name==='site')loadSiteConfig();
  if(name==='system')loadSystemSettings();
}

checkLogin();