const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    languageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true },
    text: { type: String, required: true },
    options: { type: [String], validate: (v) => Array.isArray(v) && v.length === 4 },
    correctIndex: { type: Number, min: 0, max: 3, required: true }
  },
  { timestamps: true }
);

module.exports = { questionSchema };

