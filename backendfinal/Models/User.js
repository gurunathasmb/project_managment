const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },

  // Common Profile Fields
  department: { type: String },
  phone: { type: String },
  skills: { type: String }, // ✅ add this

  // Student-only
  semester: { type: String },
  usn: { type: String },

  // Teacher-only (optional)
  designation: { type: String },
  employeeId: { type: String }
});

module.exports = mongoose.model('User', UserSchema);
