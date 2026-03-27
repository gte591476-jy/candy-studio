const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    if (!email || !password) return res.status(400).json({ error: '邮箱和密码不能为空' });
    if (password.length < 6) return res.status(400).json({ error: '密码至少6位' });

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: '该邮箱已注册' });

    const hash = await bcrypt.hash(password, 12);
    const initialPoints = parseFloat(process.env.INITIAL_POINTS || '5');
    const nick = nickname || email.split('@')[0];
    const result = await db.query(
      'INSERT INTO users (email, password_hash, nickname, points) VALUES ($1, $2, $3, $4)',
      [email, hash, nick, initialPoints]
    );
    const userId = result.insertId;

    if (initialPoints > 0) {
      await db.query(
        'INSERT INTO point_transactions (user_id, type, amount, balance_after, description) VALUES ($1, $2, $3, $4, $5)',
        [userId, 'gift', initialPoints, initialPoints, '注册赠送']
      );
    }

    const token = jwt.sign({ id: userId, email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: userId, email, nickname: nick, points: initialPoints, role: 'user' } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: '邮箱和密码不能为空' });

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: '邮箱或密码错误' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: '邮箱或密码错误' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, nickname: user.nickname, points: parseFloat(user.points), role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

module.exports = router;
