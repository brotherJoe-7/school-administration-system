const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { loginValidation, registerAdminValidation } = require('../middleware/validation');
require('dotenv').config();

// POST /api/auth/login
router.post('/login', loginValidation, async (req, res) => {
  const { email, password, role } = req.body;

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
      console.error(`Login failed: User not found for email=${email}, role=${role}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check status (for teacher/student, ignore for admin unless we want to)
    if (user.status === 'inactive' || user.status === 'suspended') {
      console.error(`Login failed: Account status restricted for email=${email}, status=${user.status}`);
      return res.status(403).json({ success: false, message: 'Account status restricted' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.error(`Login failed: Invalid password for email=${email}, role=${role}`);
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

    console.log(`Login successful: email=${email}, role=${role}`);
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
router.post('/register-admin', registerAdminValidation, async (req, res) => {
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ success: false, message: 'Email and role are required' });
  }

  try {
    let user = null;
    if (role === 'admin') {
      user = await Admin.findOne({ email });
    } else if (role === 'teacher') {
      user = await Teacher.findOne({ email });
    } else if (role === 'student') {
      user = await Student.findOne({ email });
    }

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ success: true, message: 'If the email exists, a reset link will be sent' });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // In production, send email with reset link
    // For now, return the token (this is for demo purposes only)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    res.json({ 
      success: true, 
      message: 'If the email exists, a reset link will be sent',
      resetToken // Remove this in production
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, role } = decoded;

    // Hash new password
    const hash = await bcrypt.hash(newPassword, 12);

    // Update password based on role
    if (role === 'admin') {
      await Admin.findByIdAndUpdate(id, { password_hash: hash });
    } else if (role === 'teacher') {
      await Teacher.findByIdAndUpdate(id, { password_hash: hash });
    } else if (role === 'student') {
      await Student.findByIdAndUpdate(id, { password_hash: hash });
    }

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
});

module.exports = router;
