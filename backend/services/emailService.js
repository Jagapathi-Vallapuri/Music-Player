const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function send2FACode(email, code) {
    const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to: email,
    subject: 'Your Two-Factor Authentication Code for Pulse',
        text: `Hello,

Your two-factor authentication code for Pulse is: ${code}

This code will expire in 10 minutes. Please do not share it with anyone.

If you didn't request this code, please ignore this email.

Best regards,
Pulse Team`
    };
    await transporter.sendMail(mailOptions);
}

module.exports = { send2FACode };
