const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// Middleware to enforce tenant isolation
const tenantMiddleware = async (req, res, next) => {
  try {
    // 1. Extract tenant identifier from headers (e.g. x-tenant-id) or subdomain
    const tenantId = req.headers['x-tenant-id'];
    
    // For local dev, allow bypassing if no tenant is specified but warn
    if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant ID is required in headers (x-tenant-id).' });
    }

    // Attach tenant_id to the request object for use in controllers
    req.tenant_id = tenantId;

    // Optional: Validate that the user belongs to this tenant if logged in
    if (req.user) {
        let userRecord;
        if (req.user.role === 'admin') userRecord = await Admin.findById(req.user.id);
        else if (req.user.role === 'teacher') userRecord = await Teacher.findById(req.user.id);
        else if (req.user.role === 'student') userRecord = await Student.findById(req.user.id);

        if (userRecord) {
            const userTenantId = userRecord.tenant_id ? userRecord.tenant_id.toString() : null;
            if (userTenantId && tenantId !== 'default-tenant' && userTenantId !== tenantId) {
                return res.status(403).json({ success: false, message: 'Access denied. You do not belong to this tenant.' });
            }
        }

    next();
  } catch (error) {
    console.error('Tenant Middleware Error:', error);
    res.status(500).json({ success: false, message: 'Server Error in tenant resolution.' });
  }
};

module.exports = tenantMiddleware;
