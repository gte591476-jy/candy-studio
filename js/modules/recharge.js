// ── Candy Studio: Recharge (Membership-only) ──
// Payment modal, QR code, and polling

(function() {
  window.CS = window.CS || {};

  let rechargePackageId = null;
  let memberships = [];
  let rechargePolling = null;

  CS.openRecharge = async function() {
    rechargePackageId = null;
    document.getElementById('recharge-modal').classList.remove('hidden');
    document.getElementById('recharge-qr-area').classList.add('hidden');
    document.getElementById('membership-selected-info').textContent = '';
    document.getElementById('recharge-submit-btn').disabled = false;
    document.getElementById('recharge-submit-btn').textContent = '开通会员';

    // Fetch membership plans from backend
    try {
      const r = await fetch('/api/public-config');
      if (r.ok) {
        const d = await r.json();
        memberships = d.memberships || [];
        const grid = document.getElementById('membership-purchase-grid');
        if (memberships.length === 0) {
          grid.innerHTML = '<p class="text-xs text-gray-400 col-span-2 text-center py-4">暂无可用的会员套餐</p>';
        } else {
          grid.innerHTML = memberships.map(m => `
            <button onclick="CS.selectMembership('${m.id}')" class="mem-opt border border-gray-200 rounded-xl p-3 text-left hover:border-orange-400 hover:bg-orange-50 transition cursor-pointer" data-id="${m.id}">
              <div class="text-sm font-bold text-gray-800">${m.name}</div>
              <div class="text-[10px] text-gray-400 mb-1">${m.duration}天有效 · 模型${m.discountRate}x扣费</div>
              <div class="text-lg font-bold text-orange-500">¥${parseFloat(m.price).toFixed(2)}</div>
            </button>
          `).join('');
        }
      }
    } catch (e) { console.error('Error loading memberships', e); }
  };

  CS.selectMembership = function(id) {
    rechargePackageId = id;
    const m = memberships.find(x => x.id === id);
    if (!m) return;
    document.getElementById('membership-selected-info').textContent = `支付 ¥${parseFloat(m.price).toFixed(2)} 开通 ${m.name}`;
    document.querySelectorAll('.mem-opt').forEach(el => { 
      el.classList.toggle('border-orange-400', el.dataset.id === id); 
      el.classList.toggle('bg-orange-50', el.dataset.id === id); 
    });
  };

  CS.confirmRecharge = async function() {
    if (!rechargePackageId) { alert('请选择会员套餐'); return; }
    if (!CS.useBackend || !CS.authToken) { alert('请先登录'); return; }
    const btn = document.getElementById('recharge-submit-btn');
    btn.disabled = true; btn.textContent = '请求中...';
    try {
      const body = { packageId: rechargePackageId, isMembership: true };
      const r = await fetch('/api/pay/create', { method: 'POST', headers: { 'Content-Type': 'application/json', ...CS.authHeaders() }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '创建订单失败');
      showRechargeQR(d.qrCode, d.orderNo, d.amount, d.payAmount);
    } catch (e) { alert(e.message); btn.disabled = false; btn.textContent = '开通会员'; }
  };

  function showRechargeQR(qrUrl, orderNo, amount, payAmount) {
    document.getElementById('recharge-qr-area').classList.remove('hidden');
    document.getElementById('recharge-qr-info').textContent = `订单 ${orderNo} · ¥${payAmount}`;
    document.getElementById('recharge-qr-status').textContent = '等待支付... 付款后请勿关闭此页面，等待回调';
    document.getElementById('recharge-qr-status').className = 'text-xs font-bold text-orange-500 mt-2';
    drawQR(document.getElementById('recharge-qr-canvas'), qrUrl);
    document.getElementById('recharge-submit-btn').textContent = '等待支付...';
    if (rechargePolling) clearInterval(rechargePolling);
    rechargePolling = setInterval(async () => {
      try {
        const r = await fetch(`/api/pay/status/${orderNo}`, { headers: CS.authHeaders() });
        if (!r.ok) return;
        const d = await r.json();
        if (d.status === 'paid') {
          clearInterval(rechargePolling); rechargePolling = null;
          document.getElementById('recharge-qr-status').textContent = '支付成功！';
          document.getElementById('recharge-qr-status').className = 'text-sm font-bold text-green-600 mt-2';
          if (CS.S.user) CS.S.user.points = d.balance;
          CS.showUserInfo(); CS.refreshProfile();
          setTimeout(CS.closeRecharge, 2000);
        }
      } catch {}
    }, 3000);
  }

  function drawQR(canvas, text) {
    const size = 200, modules = 21 + 4 * Math.floor((text.length + 20) / 15);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('正在加载二维码...', size / 2, size / 2 - 10);
    ctx.fillText('请稍候，或使用微信扫码', size / 2, size / 2 + 10);

    const isHttp = text.startsWith('http://') || text.startsWith('https://');

    if (isHttp) {
      const directImg = new Image();
      directImg.onload = () => {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(directImg, 0, 0, size, size);
      };
      directImg.onerror = () => generateQRFallback(canvas, text, size, ctx);
      directImg.src = text;
    } else {
      generateQRFallback(canvas, text, size, ctx);
    }
  }

  function generateQRFallback(canvas, text, size, ctx) {
    if (typeof QRCode !== 'undefined') { 
      try { QRCode.toCanvas(canvas, text, { width: size, margin: 2 }); } catch {} 
    } else {
      const img = new Image();
      img.onload = () => { ctx.clearRect(0, 0, size, size); ctx.drawImage(img, 0, 0, size, size); };
      img.onerror = () => {
        ctx.clearRect(0, 0, size, size);
        ctx.fillText('二维码图片加载失败', size / 2, size / 2 - 10);
      };
      // Use a domestic stable API instead of blocked api.qrserver.com
      img.src = `https://api.pwmqr.com/qrcode/create/?url=${encodeURIComponent(text)}`;
    }
  }

  CS.closeRecharge = function() {
    document.getElementById('recharge-modal').classList.add('hidden');
    document.getElementById('recharge-qr-area').classList.add('hidden');
    document.getElementById('recharge-submit-btn').disabled = false;
    document.getElementById('recharge-submit-btn').textContent = '开通会员';
    if (rechargePolling) { clearInterval(rechargePolling); rechargePolling = null; }
  };
})();
