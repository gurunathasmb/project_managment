const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Discussion', discussionSchema);
