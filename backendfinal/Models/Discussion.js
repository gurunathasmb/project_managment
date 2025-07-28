const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const discussionSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [messageSchema],
  lastMessage: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
discussionSchema.index({ participants: 1 });
discussionSchema.index({ lastMessage: -1 });

module.exports = mongoose.model('Discussion', discussionSchema);
