const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const SENDGRID_KEY = process.env.SENDGRID_API_KEY;

let smtpTransporter = null;

if (!SENDGRID_KEY) {
    smtpTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    smtpTransporter.verify()
        .then(() => console.log('SMTP transporter is ready'))
        .catch(err => console.error('SMTP transporter verification failed:', err));
} else {
    sgMail.setApiKey(SENDGRID_KEY);
    console.log('SendGrid configured for outgoing email');
}

async function send2FACode(email, code) {
    const from = process.env.SMTP_FROM || process.env.SENDGRID_FROM || 'no-reply@example.com';
    const subject = 'Your Two-Factor Authentication Code for Pulse';
    const text = `Hello,\n\nYour two-factor authentication code for Pulse is: ${code}\n\nThis code will expire in 10 minutes. Please do not share it with anyone.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nPulse Team`;

    if (SENDGRID_KEY) {
        const msg = {
            to: email,
            from,
            subject,
            text
        };
        try {
            const res = await sgMail.send(msg);
            console.log(`2FA email sent via SendGrid to ${email}`);
            return res;
        } catch (err) {
            console.error(`SendGrid send failed for ${email}:`, err);
            throw err;
        }
    }

    const mailOptions = { from, to: email, subject, text };
    try {
        const info = await smtpTransporter.sendMail(mailOptions);
        console.log(`2FA email sent to ${email}: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error(`Failed to send 2FA email to ${email}:`, err);
        throw err;
    }
}

module.exports = { send2FACode, transporter: smtpTransporter };
