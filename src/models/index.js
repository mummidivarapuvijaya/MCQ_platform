const mongoose = require('mongoose');
const { userSchema } = require('../schemas/user.schema');
const { otpSchema } = require('../schemas/otp.schema');
const { courseSchema } = require('../schemas/course.schema');
const { languageSchema } = require('../schemas/language.schema');
const { questionSchema } = require('../schemas/question.schema');
const { examSchema } = require('../schemas/exam.schema');
const { cheatEventSchema } = require('../schemas/cheat-event.schema');

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
const Language = mongoose.models.Language || mongoose.model('Language', languageSchema);
const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
const Exam = mongoose.models.Exam || mongoose.model('Exam', examSchema);
const CheatEvent = mongoose.models.CheatEvent || mongoose.model('CheatEvent', cheatEventSchema);

module.exports = {
  User,
  Otp,
  Course,
  Language,
  Question,
  Exam,
  CheatEvent
};

