export function authorizeRole(requiredRole) {
  return function (req, res, next) {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const roles = Array.isArray(user.roles) ? user.roles : [];
    if (!roles.includes(requiredRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient privileges' });
    }
    next();
  };
}
