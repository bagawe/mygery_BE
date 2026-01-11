export function authorizeRole(requiredRoles) {
  return function (req, res, next) {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    // Get user roles (support both array of strings and array of objects)
    let userRoles = [];
    if (Array.isArray(user.roles)) {
      userRoles = user.roles.map(r => typeof r === 'object' ? r.role : r);
    }
    
    // Support single role or array of roles
    const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Check if user has any of the required roles
    const hasRole = required.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient privileges' });
    }
    
    next();
  };
}
