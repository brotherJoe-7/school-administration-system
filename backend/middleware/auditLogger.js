const AuditLog = require('../models/AuditLog');

const auditLogger = (req, res, next) => {
  // We only want to auto-log state-changing requests (POST, PUT, DELETE, PATCH)
  if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
    return next();
  }

  res.on('finish', () => {
    // Only log if the request was successful and a user is authenticated
    if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
      
      // Determine action name from the route (e.g. /api/students -> CREATE_STUDENTS)
      const pathParts = (req.baseUrl + req.path).split('/').filter(Boolean);
      const entity = pathParts[1] ? pathParts[1].toUpperCase() : 'RECORD'; // e.g. 'STUDENTS'
      
      let actionType = 'ACTION';
      if (req.method === 'POST') actionType = 'CREATE';
      if (req.method === 'PUT' || req.method === 'PATCH') actionType = 'UPDATE';
      if (req.method === 'DELETE') actionType = 'DELETE';

      let actionName = `${actionType}_${entity}`;

      // Clean up plural/singular naming nicely if possible
      if (actionName.endsWith('S')) {
        actionName = actionName.slice(0, -1);
      }

      // Avoid double logging if the route already did a manual AuditLog (like LOGIN)
      if (pathParts.includes('auth') && req.method === 'POST') return; 

      AuditLog.create({
        tenant_id: req.tenant_id || req.headers['x-tenant-id'] || null,
        user_id: req.user.id,
        user_role: req.user.role,
        action: actionName,
        entity_type: entity,
        notes: `${req.method} request to /${pathParts.join('/')}`
      }).catch(err => console.error('Failed to write auto-audit log:', err));
    }
  });

  next();
};

module.exports = auditLogger;
