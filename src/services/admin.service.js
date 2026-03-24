const { Course, Language, Question, Exam } = require('../models');
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

async function getExamReport() {
  const exams = await Exam.find({})
    .sort({ createdAt: -1 })
    .populate('userId', 'name email')
    .populate('courseId', 'name courseCode')
    .lean();

  let submittedExams = 0;
  let ongoingExams = 0;
  let passedCount = 0;
  let failedCount = 0;
  let percentageSum = 0;

  const records = exams.map((exam) => {
    const result = exam.result || {};
    const percentage = typeof result.percentage === 'number' ? result.percentage : 0;
    const pass = Boolean(result.pass);

    if (exam.status === 'submitted') {
      submittedExams += 1;
      percentageSum += percentage;
      if (pass) passedCount += 1;
      else failedCount += 1;
    } else {
      ongoingExams += 1;
    }

    return {
      examId: String(exam._id),
      examCode: exam.examCode ?? null,
      status: exam.status,
      autoSubmitted: Boolean(exam.autoSubmitted),
      student: {
        id: exam.userId?._id ? String(exam.userId._id) : null,
        name: exam.userId?.name || '-',
        email: exam.userId?.email || '-'
      },
      course: {
        id: exam.courseId?._id ? String(exam.courseId._id) : null,
        name: exam.courseId?.name || '-',
        courseCode: exam.courseId?.courseCode ?? null
      },
      result: {
        correct: result.correct ?? 0,
        wrong: result.wrong ?? 0,
        unanswered: result.unanswered ?? 0,
        percentage,
        pass
      },
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt
    };
  });

  return {
    summary: {
      totalExams: exams.length,
      submittedExams,
      ongoingExams,
      passedCount,
      failedCount,
      averagePercentage: submittedExams > 0 ? Math.round(percentageSum / submittedExams) : 0
    },
    records
  };
}

module.exports = { createCourse, createLanguage, createQuestion, getExamReport };

