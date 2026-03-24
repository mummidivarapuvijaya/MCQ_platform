const jwt = require('jsonwebtoken');

function signToken(user) {
  return jwt.sign(
    { userId: String(user._id), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (_e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
}

module.exports = { signToken, authenticate, requireRole };

