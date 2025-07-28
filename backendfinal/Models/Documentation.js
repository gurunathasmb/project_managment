// Models/Documentation.js
const mongoose = require('mongoose');

const documentationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: true
  },
  fileName: { // Changed from fileUrl to fileName
    type: String,
    required: true
  },
  fileType: { // Added fileType to store type information
    type: String,
    required: true
  },
  filePath: { // Added filePath to store the path to file
    type: String,
    required: true
  },
  sharedWithTeachers: [{  // store the teachers whom file is shared to
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
  }],
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'rejected'],
    default: 'pending'
  },
  teacherComments: [{
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Documentation', documentationSchema);
