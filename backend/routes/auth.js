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
  const { email, password } = req.body;

  try {
    let user = await Admin.findOne({ email });
    let userRole = 'admin';

    if (!user) {
      user = await Teacher.findOne({ email });
      userRole = user ? 'teacher' : userRole;
    }
    if (!user) {
      user = await Student.findOne({ email });
      userRole = user ? 'student' : userRole;
    }

    if (!user) {
      console.error(`Login failed: User not found for email=${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (userRole !== 'admin' && (user.status === 'inactive' || user.status === 'suspended')) {
      console.error(`Login failed: Account status restricted for email=${email}, status=${user.status}`);
      return res.status(403).json({ success: false, message: 'Account status restricted' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.error(`Login failed: Invalid password for email=${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const tokenPayload = {
      id: user.id || user._id.toString(),
      email: user.email,
      role: userRole,
      name: user.full_name || `${user.first_name} ${user.last_name}`,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    // Audit log
    await AuditLog.create({
      user_id: user._id,
      user_role: userRole,
      action: 'LOGIN'
    }).catch(() => {}); // Don't fail login if audit logging fails

    console.log(`Login successful: email=${email}, role=${userRole}`);
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
    // For now, log the token to the server console only
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://school-administration-system.vercel.app' 
      : 'http://localhost:5173';
    console.log(`[SECURE] Password reset link for ${email}: ${frontendUrl}/reset-password?token=${resetToken}`);
    
    res.json({ 
      success: true, 
      message: 'If the email exists, a reset link will be sent'
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

// GET /api/auth/export-data (GDPR Compliance)
router.get('/export-data', require('../middleware/auth').authenticate, async (req, res) => {
  try {
    const { id, role } = req.user;
    const data = { user: req.user, generated_at: new Date() };

    if (role === 'admin') {
      const profile = await Admin.findById(id).select('-password_hash');
      const audits = await AuditLog.find({ user_id: id });
      data.profile = profile;
      data.audit_logs = audits;
    } else if (role === 'teacher') {
      const profile = await Teacher.findById(id).select('-password_hash');
      const audits = await AuditLog.find({ user_id: id });
      data.profile = profile;
      data.audit_logs = audits;
    } else if (role === 'student') {
      const profile = await Student.findById(id).select('-password_hash');
      const audits = await AuditLog.find({ user_id: id });
      data.profile = profile;
      data.audit_logs = audits;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
});

// POST /api/auth/student-setup (WhatsApp Link Flow)
router.post('/student-setup', async (req, res) => {
  const { student_number } = req.body;
  if (!student_number || !/^90500\d{3,5}$/.test(student_number)) {
    return res.status(400).json({ success: false, message: 'Invalid Student ID. Must start with 90500.' });
  }

  try {
    let student = await Student.findOne({ student_number });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student ID not found. Please contact administration.' });
    }

    if (student.password_hash && student.password_hash !== 'pending') {
      return res.status(400).json({ success: false, message: 'Account already set up. Please use the standard Login page.' });
    }

    const tokenPayload = {
      id: student._id.toString(),
      email: student.email,
      role: 'student',
      name: student.student_number,
      needs_setup: true
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '1h', // Setup token is short-lived
    });

    res.json({
      success: true,
      message: 'Setup session initiated',
      token,
      user: tokenPayload,
    });
  } catch (error) {
    console.error('Student setup error:', error);
    res.status(500).json({ success: false, message: 'Server error during setup' });
  }
});

module.exports = router;
