// Models/Documentation.js
const mongoose = require('mongoose');

const DocumentationSchema = new mongoose.Schema({
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
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  sharedWithTeachers: [{  // store the teachers whom file is shared to
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
  }]
});

module.exports = mongoose.model('Documentation', DocumentationSchema);
