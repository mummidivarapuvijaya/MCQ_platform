require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { connectDb } = require('./db');
const { User, Course, Language, Question } = require('./models');

const LANGUAGE_NAMES = ['JavaScript', 'Python', 'Java', 'C++', 'SQL', 'Aptitude'];
const QUESTIONS_PER_LANGUAGE = 6;

async function ensureCourse(name, courseCode) {
  const existing = await Course.findOne({ name });
  if (existing) {
    if (!existing.courseCode) {
      existing.courseCode = courseCode;
      await existing.save();
    }
    return existing;
  }
  return Course.create({ name, courseCode });
}

async function ensureLanguage(courseId, name, languageCode) {
  const existing = await Language.findOne({ courseId, name });
  if (existing) {
    if (!existing.languageCode) {
      existing.languageCode = languageCode;
      await existing.save();
    }
    return existing;
  }
  return Language.create({ courseId, name, languageCode });
}

async function ensureAdmin(courseId) {
  const email = 'admin@mcq.local';
  const existing = await User.findOne({ email });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  return User.create({
    name: 'Admin User',
    email,
    passwordHash,
    role: 'admin',
    education: 'MCA',
    courseId,
    termsAccepted: true
  });
}

function buildQuestion(languageName, index) {
  return {
    text: `${languageName} Question ${index + 1}`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: index % 4
  };
}

async function ensureQuestions(language) {
  const existingCount = await Question.countDocuments({ languageId: language._id });
  if (existingCount >= QUESTIONS_PER_LANGUAGE) return existingCount;

  const toCreate = [];
  for (let i = existingCount; i < QUESTIONS_PER_LANGUAGE; i += 1) {
    const q = buildQuestion(language.name, i);
    toCreate.push({
      languageId: language._id,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex
    });
  }
  if (toCreate.length > 0) {
    await Question.insertMany(toCreate);
  }
  return QUESTIONS_PER_LANGUAGE;
}

async function seed() {
  await connectDb();

  const course = await ensureCourse('Computer Science', 101);
  const admin = await ensureAdmin(course._id);

  const languages = [];
  for (let i = 0; i < LANGUAGE_NAMES.length; i += 1) {
    const name = LANGUAGE_NAMES[i];
    const language = await ensureLanguage(course._id, name, 1001 + i);
    languages.push(language);
    await ensureQuestions(language);
  }

  console.log('Seed completed');
  console.log(`Course Code: ${course.courseCode}`);
  console.log(`Course ID: ${course._id}`);
  console.log(`Admin email: ${admin.email}`);
  console.log('Admin password: Admin@123');
  console.log(`Languages created/verified: ${languages.length}`);
  console.log('Language codes:');
  languages.forEach((l) => console.log(`- ${l.name}: ${l.languageCode}`));
  console.log(`Questions per language ensured: ${QUESTIONS_PER_LANGUAGE}`);
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });

