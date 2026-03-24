const mongoose = require('mongoose');

const cheatEventSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: {
      type: String,
      enum: ['tab_switch', 'window_blur', 'back_navigation', 'screenshot', 'devtools', 'screenshare', 'no_camera'],
      required: true
    }
  },
  { timestamps: true }
);

module.exports = { cheatEventSchema };

