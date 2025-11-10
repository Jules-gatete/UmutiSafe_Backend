const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For development, use ethereal email (fake SMTP service)
  // For production, use real SMTP service (Gmail, SendGrid, etc.)
  
  if (process.env.NODE_ENV === 'production') {
    const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missing = requiredEnv.filter((key) => !process.env[key]);

    if (missing.length) {
      console.error(
        `❌ Email transporter misconfigured. Missing environment variables: ${missing.join(', ')}. ` +
          'Set the SMTP_* variables in your deployment to enable production emails.'
      );
      throw new Error('SMTP configuration missing');
    }

    const smtpPort = Number(process.env.SMTP_PORT);
    if (Number.isNaN(smtpPort)) {
      console.error(`❌ SMTP_PORT must be a number. Received: ${process.env.SMTP_PORT}`);
      throw new Error('Invalid SMTP_PORT');
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development mode - log emails to console
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'test@umutisafe.rw',
        pass: process.env.SMTP_PASS || 'testpassword'
      },
      // For development, we'll just log
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }
};

/**
 * Send account approval email
 */
const sendApprovalEmail = async (user) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'UmutiSafe <noreply@umutisafe.rw>',
      to: user.email,
      subject: 'Your UmutiSafe Account Has Been Approved! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #0EA5E9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Account Approved!</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.name},</h2>
              <p>Great news! Your UmutiSafe account has been approved by our administrator.</p>
              <p>You can now log in and start using the platform to safely dispose of your unused medicines.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">
                  Login to Your Account
                </a>
              </div>
              
              <h3>What you can do now:</h3>
              <ul>
                <li>✅ Scan or enter medicine information</li>
                <li>✅ Get disposal guidance based on risk level</li>
                <li>✅ Request pickup from Community Health Workers</li>
                <li>✅ Access educational resources</li>
                <li>✅ Track your disposal history</li>
              </ul>
              
              <p><strong>Your Login Credentials:</strong></p>
              <p>Email: <strong>${user.email}</strong><br>
              Password: <em>Use the password you created during registration</em></p>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
              
              <p>Thank you for joining UmutiSafe and helping keep our community safe!</p>
              
              <p>Best regards,<br>
              <strong>The UmutiSafe Team</strong></p>
            </div>
            <div class="footer">
              <p>UmutiSafe - Safe Medicine Disposal Platform</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${user.name},

Great news! Your UmutiSafe account has been approved by our administrator.

You can now log in and start using the platform to safely dispose of your unused medicines.

Your Login Credentials:
Email: ${user.email}
Password: Use the password you created during registration

Login at: ${process.env.FRONTEND_URL || 'http://localhost:5173','https://umuti-safe-app.vercel.app/login'}/login

What you can do now:
- Scan or enter medicine information
- Get disposal guidance based on risk level
- Request pickup from Community Health Workers
- Access educational resources
- Track your disposal history

If you have any questions or need assistance, please don't hesitate to contact us.

Thank you for joining UmutiSafe and helping keep our community safe!

Best regards,
The UmutiSafe Team

---
UmutiSafe - Safe Medicine Disposal Platform
This is an automated message. Please do not reply to this email.
      `
    };

    // In development, just log the email
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 EMAIL SENT (Development Mode):');
      console.log('To:', user.email);
      console.log('Subject:', mailOptions.subject);
      console.log('---');
      return { success: true, messageId: 'dev-mode', preview: 'Email logged to console' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Approval email sent to:', user.email);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
    // Don't throw error - email failure shouldn't block approval
    return { success: false, error: error.message };
  }
};

/**
 * Send registration confirmation email (pending approval)
 */
const sendRegistrationEmail = async (user) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'UmutiSafe <noreply@umutisafe.rw>',
      to: user.email,
      subject: 'Welcome to UmutiSafe - Account Pending Approval',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to UmutiSafe!</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.name},</h2>
              <p>Thank you for registering with UmutiSafe, Rwanda's Safe Medicine Disposal Platform.</p>
              
              <p><strong>Your account has been created successfully!</strong></p>
              
              <p>⏳ Your account is currently <strong>pending approval</strong> by our administrator. You will receive another email once your account has been approved and you can start using the platform.</p>
              
              <p>This approval process helps us ensure the security and safety of our community.</p>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our admin team will review your registration</li>
                <li>You'll receive an approval email (usually within 24 hours)</li>
                <li>Once approved, you can log in and start using UmutiSafe</li>
              </ul>
              
              <p>If you have any questions, please contact us at <a href="tel:+250788000000">+250 788 000 000</a>.</p>
              
              <p>Thank you for your patience!</p>
              
              <p>Best regards,<br>
              <strong>The UmutiSafe Team</strong></p>
            </div>
            <div class="footer">
              <p>UmutiSafe - Safe Medicine Disposal Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${user.name},

Thank you for registering with UmutiSafe, Rwanda's Safe Medicine Disposal Platform.

Your account has been created successfully!

Your account is currently pending approval by our administrator. You will receive another email once your account has been approved and you can start using the platform.

This approval process helps us ensure the security and safety of our community.

What happens next?
- Our admin team will review your registration
- You'll receive an approval email (usually within 24 hours)
- Once approved, you can log in and start using UmutiSafe

If you have any questions, please contact us at +250 788 000 000.

Thank you for your patience!

Best regards,
The UmutiSafe Team

---
UmutiSafe - Safe Medicine Disposal Platform
      `
    };

    // In development, just log the email
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 EMAIL SENT (Development Mode):');
      console.log('To:', user.email);
      console.log('Subject:', mailOptions.subject);
      console.log('---');
      return { success: true, messageId: 'dev-mode', preview: 'Email logged to console' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Registration email sent to:', user.email);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending registration email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendApprovalEmail,
  sendRegistrationEmail
};

