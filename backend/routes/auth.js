const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
require('dotenv').config();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Email, password and role are required' });
  }

  try {
    let user = null;

    if (role === 'admin') {
      user = await Admin.findOne({ email });
    } else if (role === 'teacher') {
      user = await Teacher.findOne({ email });
    } else if (role === 'student') {
      user = await Student.findOne({ email });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check status (for teacher/student, ignore for admin unless we want to)
    if (user.status === 'inactive' || user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account status restricted' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const tokenPayload = {
      id: user.id || user._id.toString(),
      email: user.email,
      role: role,
      name: user.full_name || `${user.first_name} ${user.last_name}`,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    // Audit log
    await AuditLog.create({
      user_id: user._id,
      user_role: role,
      action: 'LOGIN'
    }).catch(() => {}); // Don't fail login if audit logging fails

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: tokenPayload,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// POST /api/auth/register-admin (first-time setup)
router.post('/register-admin', async (req, res) => {
  const { email, password, full_name } = req.body;

  try {
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }

    const hash = await bcrypt.hash(password, 12);
    await Admin.create({
      full_name,
      email,
      password_hash: hash,
      status: 'active'
    });

    res.status(201).json({ success: true, message: 'Admin registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
