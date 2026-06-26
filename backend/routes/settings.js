const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const { authenticate, authorize } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// GET /api/settings/tenant
router.get('/tenant', authenticate, tenantMiddleware, async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ subdomain: req.tenant_id }).select('id_prefix custom_theme');
    res.json({ success: true, data: tenant });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch tenant settings' });
  }
});

// PUT /api/settings/tenant
router.put('/tenant', authenticate, authorize('admin'), tenantMiddleware, async (req, res) => {
  try {
    const { id_prefix } = req.body;
    await Tenant.findOneAndUpdate({ subdomain: req.tenant_id }, { id_prefix });
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update tenant settings' });
  }
});

module.exports = router;
