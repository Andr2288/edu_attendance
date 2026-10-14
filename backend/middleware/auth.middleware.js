const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/app.constants');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      message: 'Потрібен токен авторизації',
    });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      fullName: payload.fullName,
      groupId: payload.groupId ?? null,
    };
    return next();
  } catch (_error) {
    return res.status(401).json({
      ok: false,
      message: 'Недійсний або прострочений токен',
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: 'Потрібен токен авторизації',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        message: 'Немає доступу для цієї ролі',
      });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
