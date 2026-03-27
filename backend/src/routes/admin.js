const express = require('express');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');
const db = require('../config/db');
const points = require('../services/points');
const router = express.Router();

// ── Check API Key Quota (Upstream) ──
router.post('/check-key-quota', async (req, res) => {
  try {
    const { key, baseUrl } = req.body;
    if (!key) return res.status(400).json({ error: '缺少 API Key' });
    const base = baseUrl || 'https://ai.comfly.chat';
    const r = await fetch(`${base}/v1/token/quota`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` }
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || d.message || `HTTP ${r.status}`);
    res.json(d);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stats with chart data ──
router.get('/stats', async (req, res) => {
  try {
    // Basic counts
    const users = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    const calls = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(cost),0) as total_cost FROM api_calls WHERE status = 'success'");
    const todayCalls = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(cost),0) as total_cost FROM api_calls WHERE status = 'success' AND created_at >= CURRENT_DATE");
    const totalRecharge = await db.query("SELECT COALESCE(SUM(amount),0) as total FROM point_transactions WHERE type = 'recharge'");
    const failedCalls = await db.query("SELECT COUNT(*) as count FROM api_calls WHERE status = 'failed'");
    const todayNewUsers = await db.query("SELECT COUNT(*) as count FROM users WHERE created_at >= CURRENT_DATE AND role = 'user'");
    const activeMembers = await db.query("SELECT COUNT(*) as count FROM users WHERE membership_tier IS NOT NULL AND membership_tier != '' AND membership_expire_at > NOW()");
    const totalRevenue = await db.query("SELECT COALESCE(SUM(pay_amount),0) as total FROM orders WHERE status = 'paid'");
    const totalCostConsumed = await db.query("SELECT COALESCE(SUM(ABS(amount)),0) as total FROM point_transactions WHERE type = 'consume'");

    // 7-day daily stats
    const daily = await db.query(`SELECT DATE(created_at) as day, COUNT(*) as count, COALESCE(SUM(cost),0) as cost FROM api_calls WHERE status = 'success' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY day`);

    // 30-day daily stats (for trend chart)
    const daily30 = await db.query(`SELECT DATE(created_at) as day, COUNT(*) as count, COALESCE(SUM(cost),0) as cost FROM api_calls WHERE status = 'success' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY day`);

    // Model distribution (all time)
    const models = await db.query(`SELECT model, COUNT(*) as count FROM api_calls WHERE status = 'success' GROUP BY model ORDER BY count DESC LIMIT 15`);

    // Task type distribution (image vs video)
    const taskTypes = await db.query(`
      SELECT 
        CASE 
          WHEN model LIKE 'veo%' THEN 'video'
          ELSE 'image'
        END as task_type,
        COUNT(*) as count
      FROM api_calls WHERE status = 'success'
      GROUP BY task_type ORDER BY count DESC
    `);

    // Daily model breakdown (7 days, stacked bar)
    const dailyModels = await db.query(`
      SELECT DATE(created_at) as day, model, COUNT(*) as count
      FROM api_calls WHERE status = 'success' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at), model ORDER BY day, count DESC
    `);

    // Hourly distribution (all time)
    const hourly = await db.query(`
      SELECT HOUR(created_at) as hour, COUNT(*) as count
      FROM api_calls WHERE status = 'success'
      GROUP BY hour ORDER BY hour
    `);

    // Top users by call count (top 10)
    const topUsers = await db.query(`
      SELECT a.user_id, u.nickname, u.email, COUNT(*) as calls, COALESCE(SUM(a.cost),0) as cost
      FROM api_calls a LEFT JOIN users u ON a.user_id = u.id
      WHERE a.status = 'success'
      GROUP BY a.user_id, u.nickname, u.email
      ORDER BY calls DESC LIMIT 10
    `);

    // Top user + model breakdown (for stacked bar)
    const userModels = await db.query(`
      SELECT a.user_id, u.nickname, u.email, a.model, COUNT(*) as count
      FROM api_calls a LEFT JOIN users u ON a.user_id = u.id
      WHERE a.status = 'success'
      GROUP BY a.user_id, u.nickname, u.email, a.model
      ORDER BY count DESC LIMIT 80
    `);

    res.json({
      userCount: parseInt(users.rows[0].count),
      totalCalls: parseInt(calls.rows[0].count),
      totalCost: parseFloat(calls.rows[0].total_cost),
      todayCalls: parseInt(todayCalls.rows[0].count),
      todayCost: parseFloat(todayCalls.rows[0].total_cost),
      totalRecharge: parseFloat(totalRecharge.rows[0].total),
      failedCalls: parseInt(failedCalls.rows[0].count),
      todayNewUsers: parseInt(todayNewUsers.rows[0].count),
      activeMembers: parseInt(activeMembers.rows[0].count),
      totalRevenue: parseFloat(totalRevenue.rows[0].total),
      totalCostConsumed: parseFloat(totalCostConsumed.rows[0].total),
      dailyStats: daily.rows,
      daily30Stats: daily30.rows,
      modelStats: models.rows,
      taskTypeStats: taskTypes.rows,
      dailyModelStats: dailyModels.rows,
      hourlyStats: hourly.rows,
      topUsers: topUsers.rows,
      userModelStats: userModels.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Users list ──
router.get('/users', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit)||50, 200);
    const offset = parseInt(req.query.offset)||0;
    const search = req.query.search||'';
    let q = 'SELECT id, email, nickname, points, role, membership_tier, membership_expire_at, created_at, updated_at FROM users';
    const params = [];
    if (search) { q += ' WHERE email LIKE $1 OR nickname LIKE $1'; params.push(`%${search}%`); }
    q += ` ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(limit, offset);
    const r = await db.query(q, params);
    r.rows.forEach(u => u.points = parseFloat(u.points));
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── User detail ──
router.get('/user/:id', async (req, res) => {
  try {
    const r = await db.query('SELECT id, email, nickname, points, role, membership_tier, membership_expire_at, created_at, updated_at FROM users WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: '用户不存在' });
    const user = r.rows[0]; user.points = parseFloat(user.points);
    const consumed = await db.query("SELECT COALESCE(SUM(ABS(amount)),0) as total FROM point_transactions WHERE user_id=$1 AND type='consume'", [req.params.id]);
    const recharged = await db.query("SELECT COALESCE(SUM(amount),0) as total FROM point_transactions WHERE user_id=$1 AND type='recharge'", [req.params.id]);
    const callCount = await db.query("SELECT COUNT(*) as count FROM api_calls WHERE user_id=$1", [req.params.id]);
    user.totalConsumed = parseFloat(consumed.rows[0].total);
    user.totalRecharged = parseFloat(recharged.rows[0].total);
    user.callCount = parseInt(callCount.rows[0].count);
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Create user ──
router.post('/user', async (req, res) => {
  try {
    const { email, password, nickname, role, points: pts } = req.body;
    if (!email || !password) return res.status(400).json({ error: '邮箱和密码必填' });
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(400).json({ error: '邮箱已存在' });
    const hash = await bcrypt.hash(password, 12);
    const r = await db.query('INSERT INTO users (email, password_hash, nickname, role, points) VALUES ($1,$2,$3,$4,$5) RETURNING id', [email, hash, nickname||email.split('@')[0], role||'user', pts||0]);
    res.json({ success: true, id: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Edit user ──
router.put('/user/:id', async (req, res) => {
  try {
    const { email, nickname, role, password, membership_tier, membership_expire_at } = req.body;
    const id = parseInt(req.params.id);
    if (email) await db.query('UPDATE users SET email=$1 WHERE id=$2', [email, id]);
    if (nickname !== undefined) await db.query('UPDATE users SET nickname=$1 WHERE id=$2', [nickname, id]);
    if (role) await db.query('UPDATE users SET role=$1 WHERE id=$2', [role, id]);
    if (password) { const hash = await bcrypt.hash(password, 12); await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, id]); }
    // Membership assignment: allow setting tier and expiry directly
    if (membership_tier !== undefined) {
      await db.query('UPDATE users SET membership_tier=$1 WHERE id=$2', [membership_tier || null, id]);
    }
    if (membership_expire_at !== undefined) {
      await db.query('UPDATE users SET membership_expire_at=$1 WHERE id=$2', [membership_expire_at || null, id]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Delete user ──
router.delete('/user/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.id) return res.status(400).json({ error: '不能删除自己' });
    await db.query('DELETE FROM point_transactions WHERE user_id=$1', [id]);
    await db.query('DELETE FROM api_calls WHERE user_id=$1', [id]);
    await db.query('DELETE FROM orders WHERE user_id=$1', [id]);
    await db.query('DELETE FROM users WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── User points ──
router.put('/user/:id/points', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { amount, description } = req.body;
    if (!amount || isNaN(amount)) return res.status(400).json({ error: '金额无效' });
    const newBalance = amount > 0 ? await points.recharge(userId, amount, description||`管理员充值 ${amount}`) : await points.consume(userId, Math.abs(amount), description||`管理员扣减 ${Math.abs(amount)}`);
    res.json({ success: true, balance: newBalance });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── Calls ──
router.get('/calls', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit)||50, 200);
    const offset = parseInt(req.query.offset)||0;
    const r = await db.query(`SELECT a.*, u.email, u.nickname FROM api_calls a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Orders ──
router.get('/orders', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit)||100, 500);
    const offset = parseInt(req.query.offset)||0;
    const r = await db.query(`SELECT o.*, u.email, u.nickname FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Config get/put ──
router.get('/config', async (req, res) => {
  try {
    const r = await db.query('SELECT config_key, config_value FROM admin_configs');
    const config = {};
    r.rows.forEach(row => config[row.config_key] = row.config_value);
    res.json(config);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/config', async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: '缺少键名' });
    const existing = await db.query('SELECT id FROM admin_configs WHERE config_key = $1', [key]);
    if (existing.rows.length) await db.query('UPDATE admin_configs SET config_value = $1 WHERE config_key = $2', [value, key]);
    else await db.query('INSERT INTO admin_configs (config_key, config_value) VALUES ($1, $2)', [key, value]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Change admin password ──
router.put('/password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: '新密码至少6位' });
    const r = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (oldPassword) { const valid = await bcrypt.compare(oldPassword, r.rows[0].password_hash); if (!valid) return res.status(400).json({ error: '旧密码错误' }); }
    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
