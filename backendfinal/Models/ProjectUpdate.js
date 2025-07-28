const mongoose = require('mongoose');

const projectUpdateSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectName: { type: String, required: true },
  message: { type: String, required: true },
  comments: [
    {
      sender: { type: String, enum: ['teacher', 'student'], required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('ProjectUpdate', projectUpdateSchema);
