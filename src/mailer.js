const nodemailer = require('nodemailer');

async function getTransport() {
  if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: process.env.ETHEREAL_USER, pass: process.env.ETHEREAL_PASS }
    });
  }
  const account = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: account.user, pass: account.pass }
  });
}

module.exports = { getTransport };

