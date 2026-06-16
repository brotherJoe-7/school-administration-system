const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Common validation rules
const emailValidation = body('email')
  .trim()
  .notEmpty()
  .withMessage('Email is required')
  .isEmail()
  .withMessage('Invalid email format')
  .normalizeEmail();

const passwordValidation = body('password')
  .notEmpty()
  .withMessage('Password is required')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');

// Auth validations
const loginValidation = [
  emailValidation,
  passwordValidation,
  validate
];

const registerAdminValidation = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  validate
];

// Student validations
const studentValidation = [
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('nationality').optional().trim(),
  validate
];

// Teacher validations
const teacherValidation = [
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('specialization').optional().trim(),
  validate
];

// Class validations
const classValidation = [
  body('class_name').trim().notEmpty().withMessage('Class name is required'),
  body('program').trim().notEmpty().withMessage('Program is required'),
  body('teacher_id').optional().isMongoId().withMessage('Invalid teacher ID'),
  validate
];

// Attendance validations
const attendanceValidation = [
  body('class_id').notEmpty().withMessage('Class ID is required').isMongoId().withMessage('Invalid class ID'),
  body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Invalid date format'),
  body('attendance').isArray().withMessage('Attendance must be an array'),
  body('attendance.*.student_id').notEmpty().withMessage('Student ID is required').isMongoId().withMessage('Invalid student ID'),
  body('attendance.*.status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status'),
  validate
];

// Payment validations
const paymentValidation = [
  body('amount_paid').isFloat({ min: 0 }).withMessage('Amount paid must be a positive number'),
  body('amount_due').isFloat({ min: 0 }).withMessage('Amount due must be a positive number'),
  body('payment_date').optional().isISO8601().withMessage('Invalid date format'),
  body('payment_method').optional().trim(),
  body('reference').optional().trim(),
  body('semester').optional().trim(),
  validate
];

// Grade validations
const gradeValidation = [
  body('student_id').notEmpty().withMessage('Student ID is required').isMongoId().withMessage('Invalid student ID'),
  body('class_id').notEmpty().withMessage('Class ID is required').isMongoId().withMessage('Invalid class ID'),
  body('semester').trim().notEmpty().withMessage('Semester is required'),
  body('grade').isIn(['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F']).withMessage('Invalid grade'),
  body('score').optional().isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('comments').optional().trim(),
  validate
];

module.exports = {
  validate,
  loginValidation,
  registerAdminValidation,
  studentValidation,
  teacherValidation,
  classValidation,
  attendanceValidation,
  paymentValidation,
  gradeValidation,
  emailValidation,
  passwordValidation
};
