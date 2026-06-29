const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Tenant = require('../models/Tenant');
const { authenticate, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');

// GET /api/superadmin/admins - list all school admins
router.get('/admins', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const admins = await Admin.find().select('-password_hash').lean();
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch admins' });
  }
});

// POST /api/superadmin/admins - create a new school admin
router.post('/admins', authenticate, authorize('superadmin'), async (req, res) => {
  const { full_name, email, password, school_name } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ success: false, message: 'full_name, email, and password are required' });
  }

  try {
    // Check if email already exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An admin with this email already exists' });
    }

    // Find or create a tenant for this school
    let tenant = null;
    if (school_name) {
      tenant = await Tenant.findOne({ name: school_name });
      if (!tenant) {
        const subdomain = school_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        tenant = await Tenant.create({
          name: school_name,
          subdomain,
          db_name: `${subdomain}_db`,
        }).catch(() => null);
      }
    }

    // Use the first available tenant if no specific one
    if (!tenant) {
      tenant = await Tenant.findOne();
    }

    const password_hash = await bcrypt.hash(password, 12);
    const admin = await Admin.create({
      full_name,
      email,
      password_hash,
      status: 'active',
      tenant_id: tenant ? tenant._id : new mongoose.Types.ObjectId(),
      school_name: school_name || undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: { id: admin._id, full_name, email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create admin account' });
  }
});

// PUT /api/superadmin/admins/:id - update admin status
router.put('/admins/:id', authenticate, authorize('superadmin'), async (req, res) => {
  const { status } = req.body;
  try {
    await Admin.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true, message: `Admin ${status === 'active' ? 'activated' : 'suspended'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update admin' });
  }
});

module.exports = router;
