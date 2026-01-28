const mongoose = require('mongoose');

const AIProgressEvaluationSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Keep same phases as your rubric
    phase: { type: String, enum: ['phase1', 'phase2', 'final'], required: true },

    progressScore: { type: Number, min: 0, max: 100, required: true },
    phaseFit: { type: String, enum: ['phase1', 'phase2', 'final'], required: true },

    summary: { type: String, default: '' },
    strengths: [{ type: String }],
    risks: [{ type: String }],
    nextActions: [{ type: String }],
    missingInfo: [{ type: String }],

    // Evidence is optional but useful
    evidence: {
      updateIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectUpdate' }],
      docNames: [{ type: String }],
      links: [{ type: String }]
    },

    rawModel: { type: String, default: '' },
    rawPromptVersion: { type: String, default: 'v1' }
  },
  { timestamps: true }
);

// One evaluation per team+teacher+phase (upsert overwrite)
AIProgressEvaluationSchema.index({ teamId: 1, teacherId: 1, phase: 1 }, { unique: true });

module.exports = mongoose.model('AIProgressEvaluation', AIProgressEvaluationSchema);