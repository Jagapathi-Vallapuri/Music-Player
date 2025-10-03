const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const SENDGRID_KEY = process.env.SENDGRID_API_KEY;

let smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});



if (SENDGRID_KEY) {
    sgMail.setApiKey(SENDGRID_KEY);
    console.log('SendGrid API key present — will attempt SendGrid first');
}

async function sendViaSMTP(email, from, subject, text) {
    const mailOptions = { from, to: email, subject, text };
    try {
        const info = await smtpTransporter.sendMail(mailOptions);
        console.log(`2FA email sent via SMTP to ${email}: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error(`SMTP send failed for ${email}:`, err);
        throw err;
    }
}

async function sendViaSendGrid(email, from, subject, text) {
    const msg = { to: email, from, subject, text };
    try {
        const res = await sgMail.send(msg);
        console.log(`2FA email sent via SendGrid to ${email}`);
        return res;
    } catch (err) {
        console.error(`SendGrid send failed for ${email}:`, err?.response?.body || err);
        throw err;
    }
}

async function send2FACode(email, code) {
    const from = process.env.SENDGRID_FROM || process.env.SMTP_FROM || 'no-reply@example.com';
    const subject = 'Your Two-Factor Authentication Code for Pulse';
    const text = `Hello,\n\nYour two-factor authentication code for Pulse is: ${code}\n\nThis code will expire in 10 minutes. Please do not share it with anyone.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nPulse Team`;

    if (SENDGRID_KEY) {
        try {
            return await sendViaSendGrid(email, from, subject, text);
        } catch (sendGridErr) {
            console.warn('SendGrid failed — falling back to SMTP', sendGridErr?.message || sendGridErr);
        }
    }

    smtpTransporter.verify()
        .then(() => console.log('SMTP transporter is ready'))
        .catch(err => console.error('SMTP transporter verification failed:', err));

    return await sendViaSMTP(email, from, subject, text);
}

module.exports = { send2FACode, smtpTransporter };
