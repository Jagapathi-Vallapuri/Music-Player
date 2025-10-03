const { send2FACode } = require('../services/emailService');
require('dotenv').config();

(async () => {
  try {
    const to = process.argv[2] || process.env.TEST_EMAIL_TO;
    if (!to) {
      console.error('Usage: node scripts/test-email.js <recipient-email>');
      process.exit(2);
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Sending test 2FA to ${to} with code ${code}`);
    await send2FACode(to, code);
    console.log('Test email sent successfully');
    process.exit(0);
  } catch (err) {
    console.error('Test email failed:', err);
    process.exit(1);
  }
})();