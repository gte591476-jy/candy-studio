const db = require('../config/db');

async function getBalance(userId) {
  const r = await db.query('SELECT points FROM users WHERE id = $1', [userId]);
  return r.rows.length ? parseFloat(r.rows[0].points) : 0;
}

async function consume(userId, amount, description) {
  const client = await db.getClient();
  try {
    if (client.beginTransaction) await client.beginTransaction();
    const r = await client.query('SELECT points FROM users WHERE id = $1 FOR UPDATE', [userId]);
    if (!r.rows.length) throw new Error('用户不存在');
    const current = parseFloat(r.rows[0].points);
    const roundedAmount = +amount.toFixed(2);
    if (+(current - roundedAmount).toFixed(2) < 0) throw new Error('积分不足');
    const after = Math.max(0, +(current - roundedAmount).toFixed(2));
    await client.query('UPDATE users SET points = $1, updated_at = NOW() WHERE id = $2', [after, userId]);
    await client.query('INSERT INTO point_transactions (user_id, type, amount, balance_after, description) VALUES ($1,$2,$3,$4,$5)', [userId, 'consume', -amount, after, description]);
    if (client.commit) await client.commit();
    return after;
  } catch (err) {
    if (client.rollback) try { await client.rollback(); } catch {}
    throw err;
  } finally { client.release(); }
}

async function refund(userId, amount, description) {
  const client = await db.getClient();
  try {
    if (client.beginTransaction) await client.beginTransaction();
    const r = await client.query('SELECT points FROM users WHERE id = $1 FOR UPDATE', [userId]);
    const current = parseFloat(r.rows[0].points);
    const after = +(current + amount).toFixed(4);
    await client.query('UPDATE users SET points = $1, updated_at = NOW() WHERE id = $2', [after, userId]);
    await client.query('INSERT INTO point_transactions (user_id, type, amount, balance_after, description) VALUES ($1,$2,$3,$4,$5)', [userId, 'refund', amount, after, description]);
    if (client.commit) await client.commit();
    return after;
  } catch (err) {
    if (client.rollback) try { await client.rollback(); } catch {}
    throw err;
  } finally { client.release(); }
}

async function recharge(userId, amount, description) {
  const client = await db.getClient();
  try {
    if (client.beginTransaction) await client.beginTransaction();
    const r = await client.query('SELECT points FROM users WHERE id = $1 FOR UPDATE', [userId]);
    if (!r.rows.length) throw new Error('用户不存在');
    const current = parseFloat(r.rows[0].points);
    const after = +(current + amount).toFixed(4);
    await client.query('UPDATE users SET points = $1, updated_at = NOW() WHERE id = $2', [after, userId]);
    await client.query('INSERT INTO point_transactions (user_id, type, amount, balance_after, description) VALUES ($1,$2,$3,$4,$5)', [userId, 'recharge', amount, after, description || `充值 ${amount} 算力`]);
    if (client.commit) await client.commit();
    return after;
  } catch (err) {
    if (client.rollback) try { await client.rollback(); } catch {}
    throw err;
  } finally { client.release(); }
}

async function getTransactions(userId, limit = 50, offset = 0) {
  const r = await db.query('SELECT * FROM point_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset]);
  return r.rows;
}

module.exports = { getBalance, consume, refund, recharge, getTransactions };
