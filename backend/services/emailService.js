const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

transporter.verify()
    .then(() => console.log('SMTP transporter is ready'))
    .catch(err => console.error('SMTP transporter verification failed:', err));

async function send2FACode(email, code) {
    const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to: email,
        subject: 'Your Two-Factor Authentication Code for Pulse',
        text: `Hello,\n\nYour two-factor authentication code for Pulse is: ${code}\n\nThis code will expire in 10 minutes. Please do not share it with anyone.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nPulse Team`
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`2FA email sent to ${email}: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error(`Failed to send 2FA email to ${email}:`, err);
        throw err;
    }
}

module.exports = { send2FACode, transporter };
