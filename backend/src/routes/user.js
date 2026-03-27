const express = require('express');
const db = require('../config/db');
const points = require('../services/points');
const router = express.Router();

/**
 * Check if user's membership has expired. If so, clear their points to 0
 * and reset their membership tier.
 */
async function checkMembershipExpiry(userId) {
  try {
    const r = await db.query('SELECT membership_tier, membership_expire_at, points FROM users WHERE id = $1', [userId]);
    if (!r.rows.length) return;
    const u = r.rows[0];
    if (u.membership_tier && u.membership_tier !== 'none' && u.membership_expire_at) {
      const expDate = new Date(u.membership_expire_at);
      if (expDate < new Date()) {
        // Membership expired — clear points and reset tier
        const currentPoints = parseFloat(u.points);
        if (currentPoints > 0) {
          await db.query('UPDATE users SET points = 0, membership_tier = NULL, membership_expire_at = NULL, updated_at = NOW() WHERE id = $1', [userId]);
          await db.query(
            'INSERT INTO point_transactions (user_id, type, amount, balance_after, description) VALUES ($1,$2,$3,$4,$5)',
            [userId, 'consume', -currentPoints, 0, `会员到期，算力清零`]
          );
        } else {
          await db.query('UPDATE users SET membership_tier = NULL, membership_expire_at = NULL, updated_at = NOW() WHERE id = $1', [userId]);
        }
        console.log(`[MembershipExpiry] User ${userId} membership expired, points cleared to 0`);
      }
    }
  } catch (err) {
    console.error('checkMembershipExpiry error:', err);
  }
}

router.get('/profile', async (req, res) => {
  try {
    // Check membership expiry first
    await checkMembershipExpiry(req.user.id);
    const r = await db.query('SELECT id, email, nickname, points, role, membership_tier, membership_expire_at, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!r.rows.length) return res.status(404).json({ error: '用户不存在' });
    const u = r.rows[0];
    u.points = parseFloat(u.points);
    res.json(u);
  } catch (err) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

router.get('/records', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const txns = await points.getTransactions(req.user.id, limit, offset);
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: '获取记录失败' });
  }
});

router.get('/calls', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const r = await db.query(
      'SELECT id, model, prompt, cost, status, result_urls, duration_ms, created_at FROM api_calls WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: '获取调用记录失败' });
  }
});

router.get('/usage-stats', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Calculate boundaries in UTC based on a +8 offset (Beijing Time)
    const offset = 8;
    const now = new Date();
    // localNow effectively shifts the UTC time to represent the local day/hour
    const localNow = new Date(now.getTime() + offset * 3600000);
    const y = localNow.getUTCFullYear(), m = localNow.getUTCMonth(), d = localNow.getUTCDate();
    
    // Define the UTC start points for the last 3 "local days"
    const t0 = new Date(Date.UTC(y, m, d) - offset * 3600000); // Today local start (UTC)
    const t1 = new Date(t0.getTime() - 86400000); // Yesterday local start (UTC)
    const t2 = new Date(t1.getTime() - 86400000); // Before local start (UTC)
    const t_end = new Date(t0.getTime() + 86400000); // Today local end (UTC)

    const fmt = (dt) => dt.toISOString().replace('T', ' ').substring(0, 19);

    const stats = await db.query(`
      SELECT 
        SUM(CASE WHEN created_at >= $2 AND created_at < $3 THEN amount ELSE 0 END) as today,
        SUM(CASE WHEN created_at >= $4 AND created_at < $5 THEN amount ELSE 0 END) as yesterday,
        SUM(CASE WHEN created_at >= $6 AND created_at < $7 THEN amount ELSE 0 END) as before_yesterday
      FROM point_transactions 
      WHERE user_id = $1 AND type = 'consume'
    `, [userId, fmt(t0), fmt(t_end), fmt(t1), fmt(t0), fmt(t2), fmt(t1)]);
    
    const s = stats.rows[0];
    res.json({
      today: Math.abs(parseFloat(s.today || 0)).toFixed(2),
      yesterday: Math.abs(parseFloat(s.yesterday || 0)).toFixed(2),
      before_yesterday: Math.abs(parseFloat(s.before_yesterday || 0)).toFixed(2)
    });
  } catch (err) {
    console.error('Usage stats error:', err);
    res.status(500).json({ error: '获取使用统计失败' });
  }
});

module.exports = router;
