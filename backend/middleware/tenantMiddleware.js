const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// Middleware to enforce tenant isolation (non-blocking version)
const tenantMiddleware = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    // Superadmin bypass — no tenant validation needed
    if (req.user && req.user.role === 'superadmin') {
      req.tenant_id = null;
      return next();
    }

    // If header contains a valid ObjectId, use it directly
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      req.tenant_id = tenantId;
      return next();
    }

    // Otherwise, look up the user's actual tenant_id from the DB
    // This handles cases where the header is 'default-tenant' or missing
    if (req.user) {
      let userRecord;
      if (req.user.role === 'admin') {
        userRecord = await Admin.findById(req.user.id).select('tenant_id').lean();
      } else if (req.user.role === 'teacher') {
        userRecord = await Teacher.findById(req.user.id).select('tenant_id').lean();
      } else if (req.user.role === 'student') {
        userRecord = await Student.findById(req.user.id).select('tenant_id').lean();
      }

      if (userRecord && userRecord.tenant_id) {
        req.tenant_id = userRecord.tenant_id;
        return next();
      }
    }

    // Fallback — allow through without tenant filtering (e.g. fresh installs)
    req.tenant_id = null;
    next();
  } catch (error) {
    console.error('Tenant Middleware Error:', error);
    // Don't block the request on middleware errors — just pass through
    req.tenant_id = null;
    next();
  }
};

module.exports = tenantMiddleware;
