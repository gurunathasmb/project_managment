const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    // Existing (kept as-is)
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // ✅ NEW: Link project to team (for workspace + teacher view)
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },

    // 🔹 Core project details (existing)
    title: { type: String, required: true },
    domain: { type: String },
    techStack: [{ type: String }],
    description: { type: String },

    // ✅ NEW: Workspace fields (needed for AI + evaluation)
    problemStatement: { type: String, default: '' },
    objectives: [{ type: String }],

    repoUrl: { type: String, default: '' },
    demoUrl: { type: String, default: '' },

    startDate: { type: Date },
    endDate: { type: Date },

    // ✅ NEW: Milestones (fastest implementation)
    milestones: [
      {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        dueDate: { type: Date },
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'done'],
          default: 'pending'
        },
        progress: { type: Number, default: 0 } // 0-100
      }
    ],

    currentPhase: {
      type: String,
      enum: ['Idea', 'Design', 'Development', 'Testing', 'Completed'],
      default: 'Idea'
    },

    // 🔹 Status used by teacher (existing)
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
