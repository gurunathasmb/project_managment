const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // 🔹 Core project details (NEW)
  title: { type: String, required: true },
  domain: { type: String },
  techStack: [{ type: String }],
  description: { type: String },
  currentPhase: {
    type: String,
    enum: ['Idea', 'Design', 'Development', 'Testing', 'Completed'],
    default: 'Idea'
  },

  // 🔹 Status used by teacher
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
