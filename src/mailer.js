const nodemailer = require('nodemailer');

async function getTransport() {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: String(process.env.EMAIL_SECURE || 'false') === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }

  if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }

  throw new Error(
    'SMTP not configured. Set EMAIL_SERVICE/EMAIL_USER/EMAIL_PASS or EMAIL_HOST/EMAIL_PORT/EMAIL_SECURE/EMAIL_USER/EMAIL_PASS'
  );
}

module.exports = { getTransport };

