const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// Middleware to enforce tenant isolation (non-blocking version)
const tenantMiddleware = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    // Attach tenant_id to the request — can be null/undefined, we won't block the request
    req.tenant_id = tenantId || null;

    // Superadmin bypass — no tenant validation needed
    if (req.user && req.user.role === 'superadmin') {
      return next();
    }

    // If a tenant was specified, validate the user belongs to it
    if (req.user && tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      let userRecord;
      if (req.user.role === 'admin') userRecord = await Admin.findById(req.user.id).select('tenant_id').lean();
      else if (req.user.role === 'teacher') userRecord = await Teacher.findById(req.user.id).select('tenant_id').lean();
      else if (req.user.role === 'student') userRecord = await Student.findById(req.user.id).select('tenant_id').lean();

      if (userRecord && userRecord.tenant_id) {
        const userTenantId = userRecord.tenant_id.toString();
        if (userTenantId !== tenantId) {
          return res.status(403).json({ success: false, message: 'Access denied. You do not belong to this tenant.' });
        }
      }
    }

    next();
  } catch (error) {
    console.error('Tenant Middleware Error:', error);
    // Don't block the request on middleware errors — just pass through
    next();
  }
};

module.exports = tenantMiddleware;
