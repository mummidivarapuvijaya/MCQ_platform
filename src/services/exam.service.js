const mongoose = require('mongoose');
const { Course, Language, Question, Exam, CheatEvent } = require('../models');

async function getNextExamCode() {
  const max = await Exam.findOne().sort({ examCode: -1 }).select('examCode');
  return max?.examCode ? max.examCode + 1 : 50001;
}
async function startExam({ userId, courseId, courseCode, languageIds, languageCodes }) {
  let course = null;
  if (courseCode !== undefined) {
    course = await Course.findOne({ courseCode });
  } else if (typeof courseId === 'string' && mongoose.Types.ObjectId.isValid(courseId)) {
    course = await Course.findById(courseId);
  }
  if (!course) {
    return { error: { code: 400, message: 'Invalid course' } };
  }

  let resolvedLanguageIds = languageIds ?? [];
  if (languageCodes && languageCodes.length > 0) {
    const langsByCode = await Language.find({ languageCode: { $in: languageCodes } }).select('_id languageCode courseId');
    if (langsByCode.length !== languageCodes.length) {
      return { error: { code: 400, message: 'Invalid language codes' } };
    }
    if (langsByCode.some((l) => String(l.courseId) !== String(course._id))) {
      return { error: { code: 400, message: 'Invalid languages for course' } };
    }
    resolvedLanguageIds = langsByCode.map((l) => String(l._id));
  }

  const uniqueLangIds = [...new Set(resolvedLanguageIds)];
  if (uniqueLangIds.length !== resolvedLanguageIds.length) {
    return { error: { code: 400, message: 'Duplicate languages not allowed' } };
  }

  const langs = await Language.find({ _id: { $in: uniqueLangIds }, courseId: course._id });
  if (langs.length !== uniqueLangIds.length) {
    return { error: { code: 400, message: 'Invalid languages for course' } };
  }

  const selectedQuestions = [];
  for (const languageId of uniqueLangIds) {
    const perLanguage = await Question.aggregate([
      { $match: { languageId: new mongoose.Types.ObjectId(languageId) } },
      { $sample: { size: 5 } }
    ]);
    if (perLanguage.length < 5) {
      return { error: { code: 400, message: 'Each language must have at least 5 questions' } };
    }
    selectedQuestions.push(...perLanguage.map((q) => ({ questionId: q._id, selectedIndex: null })));
  }

  if (selectedQuestions.length !== 30) {
    return { error: { code: 400, message: 'Total questions must be 30 (6 languages x 5 questions)' } };
  }

  const exam = await Exam.create({
    userId,
    courseId: course._id,
    examCode: await getNextExamCode(),
    questions: selectedQuestions
  });
  const questionIds = selectedQuestions.map((q) => q.questionId);
  const fullQuestions = await Question.find({ _id: { $in: questionIds } });
  const questionMap = new Map(fullQuestions.map((q) => [String(q._id), q]));
  const languageMap = new Map(langs.map((l) => [String(l._id), l]));
  const payload = exam.questions.map((eq) => {
    const q = questionMap.get(String(eq.questionId));
    const lang = languageMap.get(String(q.languageId));
    return {
      examQuestionId: String(eq._id),
      questionId: String(q._id),
      text: q.text,
      options: q.options,
      languageId: String(q.languageId),
      languageCode: lang?.languageCode
    };
  });

  return { examId: exam._id, examCode: exam.examCode, questions: payload };
}

async function submitExam({ userId, examId, examCode, answers }) {
  let exam = null;
  if (examCode !== undefined) {
    exam = await Exam.findOne({ examCode });
  } else if (typeof examId === 'string' && mongoose.Types.ObjectId.isValid(examId)) {
    exam = await Exam.findById(examId);
  }
  if (!exam || String(exam.userId) !== userId) return { error: { code: 404, message: 'Exam not found' } };
  if (exam.status === 'submitted') return { error: { code: 400, message: 'Exam already submitted' } };

  const ansMap = new Map(answers.map((a) => [String(a.examQuestionId), a.selectedIndex]));
  const questionIds = exam.questions.map((q) => q.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } });
  const qMap = new Map(questions.map((q) => [String(q._id), q]));

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  for (const item of exam.questions) {
    const selectedIndex = ansMap.has(String(item._id)) ? ansMap.get(String(item._id)) : null;
    item.selectedIndex = selectedIndex;
    if (selectedIndex === null || selectedIndex === undefined) {
      unanswered += 1;
      continue;
    }
    const q = qMap.get(String(item.questionId));
    if (!q) return { error: { code: 400, message: 'Invalid exam data' } };
    if (selectedIndex === q.correctIndex) correct += 1;
    else wrong += 1;
  }

  const total = exam.questions.length;
  exam.status = 'submitted';
  exam.result = {
    correct,
    wrong,
    unanswered,
    percentage: Math.round((correct / total) * 100),
    pass: Math.round((correct / total) * 100) >= 40
  };
  await exam.save();
  return exam.result;
}

async function reportCheat({ userId, examId, examCode, event }) {
  let exam = null;
  if (examCode !== undefined) {
    exam = await Exam.findOne({ examCode });
  } else if (typeof examId === 'string' && mongoose.Types.ObjectId.isValid(examId)) {
    exam = await Exam.findById(examId);
  }
  if (!exam || String(exam.userId) !== userId) return { error: { code: 404, message: 'Exam not found' } };

  await CheatEvent.create({ examId: exam._id, userId, event });
  const totalCheats = await CheatEvent.countDocuments({ examId: exam._id, userId });

  if (totalCheats >= 3 && exam.status === 'ongoing') {
    const questionIds = exam.questions.map((q) => q.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const qMap = new Map(questions.map((q) => [String(q._id), q]));
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    for (const item of exam.questions) {
      if (item.selectedIndex === null || item.selectedIndex === undefined) unanswered += 1;
      else if (item.selectedIndex === qMap.get(String(item.questionId)).correctIndex) correct += 1;
      else wrong += 1;
    }
    const percentage = Math.round((correct / exam.questions.length) * 100);
    exam.status = 'submitted';
    exam.autoSubmitted = true;
    exam.result = { correct, wrong, unanswered, percentage, pass: percentage >= 40 };
    await exam.save();
    return { autoSubmitted: true, result: exam.result };
  }

  return { recorded: true, count: totalCheats };
}

module.exports = { startExam, submitExam, reportCheat };

