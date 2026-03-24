const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    courseCode: { type: Number, required: true, unique: true, index: true }
  },
  { timestamps: true }
);

module.exports = { courseSchema };

