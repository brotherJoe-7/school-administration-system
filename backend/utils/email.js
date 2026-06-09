const nodemailer = require('nodemailer');

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"School Administration System" <noreply@schooladmin.edu>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  passwordReset: (name, resetLink) => ({
    subject: 'Password Reset Request',
    text: `Hello ${name},\n\nYou requested a password reset for your School Administration System account.\n\nClick the following link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you did not request this password reset, please ignore this email.\n\nBest regards,\nSchool Administration System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>You requested a password reset for your School Administration System account.</p>
        <p>Click the following link to reset your password:</p>
        <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p>Best regards,<br>School Administration System</p>
      </div>
    `
  }),
  
  registrationApproved: (name, program) => ({
    subject: 'Registration Approved',
    text: `Hello ${name},\n\nCongratulations! Your registration for the ${program} program has been approved.\n\nYou can now log in to the School Administration System to access your student portal.\n\nBest regards,\nSchool Administration System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Registration Approved</h2>
        <p>Hello ${name},</p>
        <p>Congratulations! Your registration for the <strong>${program}</strong> program has been approved.</p>
        <p>You can now log in to the School Administration System to access your student portal.</p>
        <p>Best regards,<br>School Administration System</p>
      </div>
    `
  }),
  
  registrationRejected: (name, reason) => ({
    subject: 'Registration Update',
    text: `Hello ${name},\n\nWe regret to inform you that your registration has been reviewed.\n\n${reason ? `Reason: ${reason}` : ''}\n\nIf you have any questions, please contact the administration office.\n\nBest regards,\nSchool Administration System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Registration Update</h2>
        <p>Hello ${name},</p>
        <p>We regret to inform you that your registration has been reviewed.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you have any questions, please contact the administration office.</p>
        <p>Best regards,<br>School Administration System</p>
      </div>
    `
  }),
  
  gradePosted: (name, className, grade) => ({
    subject: 'Grade Posted',
    text: `Hello ${name},\n\nYour grade for ${className} has been posted.\n\nGrade: ${grade}\n\nLog in to the School Administration System to view your full transcript.\n\nBest regards,\nSchool Administration System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Grade Posted</h2>
        <p>Hello ${name},</p>
        <p>Your grade for <strong>${className}</strong> has been posted.</p>
        <p><strong>Grade:</strong> ${grade}</p>
        <p>Log in to the School Administration System to view your full transcript.</p>
        <p>Best regards,<br>School Administration System</p>
      </div>
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates
};
