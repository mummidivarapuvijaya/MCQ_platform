const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { User, Otp, Course } = require('../models');
const { signToken } = require('../auth');
const { getTransport } = require('../mailer');

function hasEmailConfig() {
  const hasHostConfig = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;
  const hasServiceConfig = process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS;
  return Boolean(hasHostConfig || hasServiceConfig);
}

async function register(data) {
  const { name, email, password, role, education, courseId, courseCode, termsAccepted } = data;
  const exists = await User.findOne({ email });
  if (exists) return { error: { code: 409, message: 'Email already registered' } };

  let course = null;
  if (courseCode !== undefined) {
    course = await Course.findOne({ courseCode });
  } else if (typeof courseId === 'string' && mongoose.Types.ObjectId.isValid(courseId)) {
    course = await Course.findById(courseId);
  }
  if (!course) return { error: { code: 400, message: 'Invalid course' } };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role, education, courseId: course._id, termsAccepted });
  return { token: signToken(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) return { error: { code: 401, message: 'Invalid credentials' } };
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: { code: 401, message: 'Invalid credentials' } };
  return { token: signToken(user) };
}

async function sendOtp({ email }) {
  const user = await User.findOne({ email });
  if (!user) return { error: { code: 404, message: 'User not found' } };
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await Otp.findOneAndUpdate({ email }, { email, code, expiresAt, verified: false }, { upsert: true, new: true });
  if (hasEmailConfig()) {
    const transport = await getTransport();
    const info = await transport.sendMail({
      from: process.env.MAIL_FROM || process.env.EMAIL_USER || 'no-reply@mcq.local',
      to: email,
      subject: 'Your OTP',
      text: `OTP: ${code}`
    });
    return {
      sent: true,
      messageId: info.messageId,
      otp: process.env.NODE_ENV === 'production' ? undefined : code
    };
  }

  if (process.env.NODE_ENV === 'production') {
    return { error: { code: 500, message: 'SMTP not configured in production' } };
  }

  return {
    sent: true,
    message: 'SMTP not configured. OTP returned in response for local development.',
    otp: code
  };
}

async function verifyOtp({ email, code }) {
  const otp = await Otp.findOne({ email });
  if (!otp || otp.code !== code || otp.expiresAt < new Date()) {
    return { error: { code: 400, message: 'Invalid or expired OTP' } };
  }
  otp.verified = true;
  await otp.save();
  return { verified: true };
}

module.exports = { register, login, sendOtp, verifyOtp };

