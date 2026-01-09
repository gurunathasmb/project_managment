const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },

  // 🔽 NEW PROFILE FIELDS
  department: { type: String },
  semester: { type: String },
  phone: { type: String },
  usn: { type: String }
});

module.exports = mongoose.model('User', UserSchema);
