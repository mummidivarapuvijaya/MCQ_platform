const express = require('express');
const { authenticate, requireRole } = require('./auth');
const authController = require('./controllers/auth.controller');
const adminController = require('./controllers/admin.controller');
const examController = require('./controllers/exam.controller');
const userController = require('./controllers/user.controller');

const router = express.Router();

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/verify-otp', authController.verifyOtp);

router.use(authenticate);

router.get('/user/profile', userController.getProfile);

router.post('/admin/courses', requireRole(['admin']), adminController.createCourse);
router.post('/admin/languages', requireRole(['admin']), adminController.createLanguage);
router.post('/admin/questions', requireRole(['admin']), adminController.createQuestion);
router.get('/admin/exams/report', requireRole(['admin']), adminController.getExamReport);
router.post('/exam/start', examController.startExam);
router.post('/exam/submit', examController.submitExam);
router.post('/exam/anti-cheat', examController.reportCheat);

module.exports = { router };

