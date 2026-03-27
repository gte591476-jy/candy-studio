require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { initDB } = require('./config/db');
const authMiddleware = require('./middleware/auth');
const adminMiddleware = require('./middleware/admin');
const { apiLimiter, authLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const generateRoutes = require('./routes/generate');
const adminRoutes = require('./routes/admin');
const payRoutes = require('./routes/pay');
const configRoutes = require('./routes/config');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  const varyValues = new Set(
    String(res.getHeader('Vary') || '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
  );
  varyValues.add('Authorization');
  varyValues.add('Origin');
  res.setHeader('Vary', Array.from(varyValues).join(', '));
  next();
});
app.use(express.static(path.join(__dirname, '../../')));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', apiLimiter, authMiddleware, userRoutes);
app.use('/api/generate', apiLimiter, authMiddleware, generateRoutes);
app.use('/api/admin', apiLimiter, authMiddleware, adminMiddleware, adminRoutes);
app.use('/api/pay', apiLimiter, payRoutes);
app.use('/api', configRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const ADMIN_PATH = process.env.ADMIN_PATH || 'admin';
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE || '';

app.get('/' + ADMIN_PATH, (req, res) => {
  if (ADMIN_ACCESS_CODE && req.query.code !== ADMIN_ACCESS_CODE) {
    return res.status(403).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>访问验证</title>
<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f1f5f9}
.box{background:#fff;padding:40px;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,.06);text-align:center;max-width:360px;width:90%}
h3{margin:0 0 8px;color:#1a1a2e}p{font-size:13px;color:#999;margin:0 0 20px}
input{width:100%;border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px;font-size:14px;box-sizing:border-box;margin-bottom:12px;outline:none}
input:focus{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.15)}
button{width:100%;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:600;font-size:14px;cursor:pointer}
</style></head><body><div class="box"><h3>管理后台</h3><p>请输入访问密码</p>
<form onsubmit="location.href=location.pathname+'?code='+document.getElementById('c').value;return false">
<input id="c" type="password" placeholder="访问密码" autofocus/><button type="submit">验证</button></form></div></body></html>`);
  }

  res.sendFile(path.join(__dirname, '../../admin.html'));
});

app.get('/admin', (req, res) => res.status(404).send('Not Found'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

const PORT = process.env.PORT || 3001;

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Candy Studio running on http://localhost:${PORT}`);
    console.log(`Admin: http://localhost:${PORT}/${ADMIN_PATH}${ADMIN_ACCESS_CODE ? '?code=' + ADMIN_ACCESS_CODE : ''}`);
  });
}

start().catch(console.error);
