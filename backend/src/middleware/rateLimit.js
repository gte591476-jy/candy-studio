const rateLimit = require('express-rate-limit');

function isLocalRequest(req) {
  const ip = req.ip || req.socket?.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5000,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalRequest,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: '登录尝试过多，请15分钟后再试' },
  skip: isLocalRequest,
});

module.exports = { apiLimiter, authLimiter };
