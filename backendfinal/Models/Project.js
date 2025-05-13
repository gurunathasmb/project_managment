const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  projectTitle: String,
  message: String,
  status: { type: String, default: 'pending' },
  comments: [{
    text: String,
    sender: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
