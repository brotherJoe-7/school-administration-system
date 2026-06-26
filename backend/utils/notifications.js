// Communication & Notifications Service
// Integrates with Nodemailer, Twilio (SMS/WhatsApp)

const nodemailer = require('nodemailer');

// Simulated notification transport
const sendEmail = async ({ to, subject, html, tenant_id }) => {
  console.log(`[Email via Tenant ${tenant_id}] To: ${to} | Subject: ${subject}`);
  // In production, instantiate transporter per tenant using their custom SMTP settings
  return true;
};

const sendSMS = async ({ to, message, tenant_id }) => {
  console.log(`[SMS via Tenant ${tenant_id}] To: ${to} | Message: ${message}`);
  // In production, integrate Twilio API here
  return true;
};

const sendWhatsApp = async ({ to, message, tenant_id }) => {
  console.log(`[WhatsApp via Tenant ${tenant_id}] To: ${to} | Message: ${message}`);
  // In production, integrate WhatsApp Business API here
  return true;
};

// Pre-defined templates
const templates = {
  registrationApproval: (studentName) => ({
    subject: 'Your Registration is Approved!',
    html: `<h3>Welcome, ${studentName}!</h3><p>Your enrollment has been approved. You can now login to your student portal.</p>`
  }),
  tuitionReminder: (studentName, amountDue) => ({
    subject: 'Tuition Payment Reminder',
    html: `<p>Dear ${studentName}, please be reminded that you have an outstanding tuition balance of Le ${amountDue.toLocaleString()}.</p>`
  }),
  attendanceAlert: (studentName, courseName) => ({
    subject: 'Low Attendance Alert',
    html: `<p>Warning: ${studentName}'s attendance in ${courseName} has dropped below the required threshold.</p>`
  })
};

const notifyUser = async ({ type, user, data, channels = ['email'], tenant_id }) => {
  try {
    const template = templates[type](...data);
    
    if (channels.includes('email') && user.email) {
      await sendEmail({ to: user.email, subject: template.subject, html: template.html, tenant_id });
    }
    
    if (channels.includes('sms') && user.phone) {
      // Strip HTML for SMS
      const textMsg = template.html.replace(/<[^>]*>?/gm, '');
      await sendSMS({ to: user.phone, message: textMsg, tenant_id });
    }

    if (channels.includes('whatsapp') && user.phone) {
      const textMsg = template.html.replace(/<[^>]*>?/gm, '');
      await sendWhatsApp({ to: user.phone, message: textMsg, tenant_id });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Notification failed:', error);
    return { success: false, error };
  }
};

module.exports = { notifyUser };
