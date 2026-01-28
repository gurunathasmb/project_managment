const mongoose = require('mongoose');

/* ---------- Rubric Item ---------- */
const rubricItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    score: { type: Number, default: 0 },
    max: { type: Number, default: 10 }
  },
  { _id: false }
);

/* ---------- Rubric Evaluation ---------- */
const rubricEvaluationSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    phase: {
      type: String,
      enum: ['phase1', 'phase2', 'final'],
      required: true
    },

    criteria: {
      type: [rubricItemSchema],
      default: []
    },

    total: {
      type: Number,
      default: 0
    },
    maxTotal: {
      type: Number,
      default: 0
    },

    remarks: {
      type: String,
      default: ''
    },

    // useful later if you want "lock after submit"
    isSubmitted: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/* ---------- IMPORTANT UNIQUE INDEX ---------- */
/**
 * One rubric per:
 * team + teacher + phase
 */
rubricEvaluationSchema.index(
  { teamId: 1, teacherId: 1, phase: 1 },
  { unique: true }
);

module.exports = mongoose.model('RubricEvaluation', rubricEvaluationSchema);