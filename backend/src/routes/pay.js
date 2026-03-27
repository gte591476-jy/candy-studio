const express = require('express');
const crypto = require('crypto');
const fetch = require('node-fetch');
const db = require('../config/db');
const points = require('../services/points');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

function genOrderNo() {
  const d = new Date();
  const ts = d.getFullYear().toString() + (d.getMonth()+1).toString().padStart(2,'0') +
    d.getDate().toString().padStart(2,'0') + d.getHours().toString().padStart(2,'0') +
    d.getMinutes().toString().padStart(2,'0') + d.getSeconds().toString().padStart(2,'0');
  return 'CS' + ts + Math.random().toString(36).substr(2,8).toUpperCase();
}

async function getConfig(key) {
  const r = await db.query("SELECT config_value FROM admin_configs WHERE config_key = $1", [key]);
  return r.rows.length ? r.rows[0].config_value : '';
}

function xunhuSign(params, appSecret) {
  const keys = Object.keys(params).filter(k => k !== 'hash' && params[k] !== '' && params[k] != null).sort();
  const str = keys.map(k => `${k}=${params[k]}`).join('&') + appSecret;
  return crypto.createHash('md5').update(str).digest('hex');
}

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, packageId, isMembership } = req.body;
    let numAmount = parseFloat(amount) || 0;
    let payAmount = 0;
    let orderTitle = '';

    if (isMembership && packageId) {
      const msStr = await getConfig('memberships');
      const memberships = msStr ? JSON.parse(msStr) : [];
      const ms = memberships.find(m => m.id === packageId);
      if (!ms) return res.status(400).json({ error: '会员套餐不存在' });
      payAmount = parseFloat(ms.price);
      numAmount = 0;
      orderTitle = `Candy Studio 开通 ${ms.name}`;
    } else {
      if (!numAmount || numAmount <= 0) return res.status(400).json({ error: '充值金额无效' });
      payAmount = +(numAmount * 1.1).toFixed(2);
      orderTitle = `Candy Studio 充值 ${numAmount} 算力`;
    }

    const orderNo = genOrderNo();
    await db.query('INSERT INTO orders (user_id, order_no, amount, pay_amount, package_id, status) VALUES ($1,$2,$3,$4,$5,$6)', [userId, orderNo, numAmount, payAmount, packageId || null, 'pending']);

    const appid = await getConfig('xunhu_appid');
    const appSecret = await getConfig('xunhu_appsecret');
    const notifyUrl = await getConfig('xunhu_notify_url');
    const apiUrl = (await getConfig('xunhu_api_url')) || 'https://api.xunhupay.com/payment/do.html';
    if (!appid || !appSecret) {
      await db.query("UPDATE orders SET status = 'failed' WHERE order_no = $1", [orderNo]);
      return res.status(500).json({ error: '支付未配置，请管理员在后台配置虎皮椒' });
    }

    const params = { version:'1.1', appid, trade_order_id:orderNo, total_fee:(payAmount).toFixed(2), title:orderTitle, time:Math.floor(Date.now()/1000).toString(), notify_url:notifyUrl||'', nonce_str:crypto.randomBytes(16).toString('hex'), type:'wechat' };
    params.hash = xunhuSign(params, appSecret);
    const resp = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams(params).toString() });
    const data = await resp.json();
    if (data.errcode !== 0 && data.errcode !== '0') {
      await db.query("UPDATE orders SET status = 'failed' WHERE order_no = $1", [orderNo]);
      throw new Error(data.errmsg || '创建支付订单失败');
    }
    res.json({ orderNo, qrCode: data.url_qrcode||data.url||'', payUrl: data.url||'', amount: numAmount, payAmount });
  } catch (err) { console.error('Pay create error:', err); res.status(500).json({ error: err.message }); }
});

router.get('/status/:orderNo', authMiddleware, async (req, res) => {
  try {
    const r = await db.query('SELECT order_no, amount, pay_amount, status, created_at, paid_at FROM orders WHERE order_no = $1 AND user_id = $2', [req.params.orderNo, req.user.id]);
    if (!r.rows.length) return res.status(404).json({ error: '订单不存在' });
    const order = r.rows[0];
    const balance = await points.getBalance(req.user.id);
    res.json({ ...order, amount: parseFloat(order.amount), payAmount: parseFloat(order.pay_amount), balance });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/notify', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const appSecret = await getConfig('xunhu_appsecret');
    if (!appSecret) return res.send('fail');
    const { hash, trade_order_id, status, open_order_id } = req.body;
    if (hash !== xunhuSign(req.body, appSecret)) return res.send('fail');
    if (status === 'OD') await completeOrder(trade_order_id, open_order_id || '');
    res.send('success');
  } catch (err) { console.error('Notify error:', err); res.send('fail'); }
});

async function completeOrder(orderNo, tradeNo) {
  const client = await db.getClient();
  try {
    if (client.beginTransaction) await client.beginTransaction();
    const r = await client.query("SELECT * FROM orders WHERE order_no = $1 AND status = 'pending'", [orderNo]);
    if (!r.rows.length) { if (client.commit) await client.commit(); return; }
    const order = r.rows[0];
    await client.query("UPDATE orders SET status = 'paid', trade_no = $1, paid_at = NOW() WHERE order_no = $2", [tradeNo, orderNo]);
    const userR = await client.query('SELECT points, membership_expire_at, membership_tier FROM users WHERE id = $1', [order.user_id]);
    let current = parseFloat(userR.rows[0].points);
    const amount = parseFloat(order.amount);

    if (order.package_id) {
      const msStr = await client.query("SELECT config_value FROM admin_configs WHERE config_key = 'memberships'");
      const memberships = msStr.rows.length ? JSON.parse(msStr.rows[0].config_value) : [];
      const ms = memberships.find(m => m.id === order.package_id);
      if (ms) {
        const currentExpire = userR.rows[0].membership_expire_at;
        const now = new Date();
        const durationDays = parseInt(ms.duration) || 30;
        let newExpire;
        
        if (currentExpire && new Date(currentExpire) > now) {
          newExpire = new Date(new Date(currentExpire).getTime() + durationDays * 24 * 60 * 60 * 1000);
        } else {
          newExpire = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
        }
        
        const formatDt = (dt) => dt.toISOString().replace('T', ' ').substring(0, 19);
        
        // Add points
        const grantedPoints = parseFloat(ms.points || 0);
        const afterPoints = +(current + grantedPoints).toFixed(4);
        
        await client.query('UPDATE users SET membership_tier = $1, membership_expire_at = $2, points = $3, updated_at = NOW() WHERE id = $4', 
          [ms.id, formatDt(newExpire), afterPoints, order.user_id]);
          
        if (grantedPoints > 0) {
          await client.query('INSERT INTO point_transactions (user_id, type, amount, balance_after, description) VALUES ($1,$2,$3,$4,$5)', 
            [order.user_id, 'recharge', grantedPoints, afterPoints, `开通会员 ${ms.name} 获赠算力 [${orderNo}]`]);
        }
      }
    } else if (amount > 0) {
      const after = +(current + amount).toFixed(4);
      await client.query('UPDATE users SET points = $1, updated_at = NOW() WHERE id = $2', [after, order.user_id]);
      await client.query('INSERT INTO point_transactions (user_id, type, amount, balance_after, description) VALUES ($1,$2,$3,$4,$5)', [order.user_id, 'recharge', amount, after, `微信充值 ${amount} 算力 [${orderNo}]`]);
    }

    if (client.commit) await client.commit();
    console.log(`Order ${orderNo} paid: package ${order.package_id || 'none'}, +${amount} for user ${order.user_id}`);
  } catch (err) { if (client.rollback) try{await client.rollback();}catch{} console.error('CompleteOrder error:', err); }
  finally { client.release(); }
}

module.exports = router;
