const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    status: { type: String, enum: ['ongoing', 'submitted'], default: 'ongoing' },
    examCode: { type: Number, required: true, unique: true, index: true },
    questions: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedIndex: { type: Number, min: 0, max: 3, default: null }
      }
    ],
    result: {
      correct: { type: Number, default: 0 },
      wrong: { type: Number, default: 0 },
      unanswered: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      pass: { type: Boolean, default: false }
    },
    autoSubmitted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = { examSchema };

