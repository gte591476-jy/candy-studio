function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '无管理员权限' });
  }
  next();
}

module.exports = adminMiddleware;
