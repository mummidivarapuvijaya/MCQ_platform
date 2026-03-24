const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    languageCode: { type: Number, required: true, unique: true, index: true }
  },
  { timestamps: true }
);

module.exports = { languageSchema };

