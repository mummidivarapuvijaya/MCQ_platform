const { Course, Language, Question } = require('../models');
const mongoose = require('mongoose');

function isObjectId(value) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

async function resolveCourseId({ courseId, courseCode }) {
  if (courseCode !== undefined) {
    const course = await Course.findOne({ courseCode });
    return course ? String(course._id) : null;
  }
  if (isObjectId(courseId)) {
    const course = await Course.findById(courseId);
    return course ? String(course._id) : null;
  }
  return null;
}

async function getNextCourseCode() {
  const max = await Course.findOne().sort({ courseCode: -1 }).select('courseCode');
  return max?.courseCode ? max.courseCode + 1 : 101;
}

async function getNextLanguageCode() {
  const max = await Language.findOne().sort({ languageCode: -1 }).select('languageCode');
  return max?.languageCode ? max.languageCode + 1 : 1001;
}

async function createCourse({ name, courseCode }) {
  const finalCode = courseCode ?? (await getNextCourseCode());
  return Course.create({ name, courseCode: finalCode });
}

async function createLanguage({ name, courseId, courseCode, languageCode }) {
  const resolvedCourseId = await resolveCourseId({ courseId, courseCode });
  if (!resolvedCourseId) return { error: { code: 400, message: 'Invalid course' } };
  const finalLanguageCode = languageCode ?? (await getNextLanguageCode());
  return Language.create({ name, courseId: resolvedCourseId, languageCode: finalLanguageCode });
}

async function createQuestion(data) {
  let lang = null;
  if (data.languageCode !== undefined) {
    lang = await Language.findOne({ languageCode: data.languageCode });
  } else if (isObjectId(data.languageId)) {
    lang = await Language.findById(data.languageId);
  }
  if (!lang) return { error: { code: 400, message: 'Invalid language' } };
  return Question.create({
    languageId: lang._id,
    text: data.text,
    options: data.options,
    correctIndex: data.correctIndex
  });
}

module.exports = { createCourse, createLanguage, createQuestion };

