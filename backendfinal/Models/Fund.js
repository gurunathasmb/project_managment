// Fund.js
const mongoose = require('mongoose');

const fundSchema = new mongoose.Schema({
  teamName: String,
  assignedTeacher: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  reason: String,
  status: { type: String, default: 'Pending' },
  teacherComments: { type: String },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Fund', fundSchema);
