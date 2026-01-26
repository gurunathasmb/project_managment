const mongoose = require('mongoose');

const rubricItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    score: { type: Number, default: 0 },
    max: { type: Number, default: 10 }
  },
  { _id: false }
);

const rubricEvaluationSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    phase: {
      type: String,
      enum: ['phase1', 'phase2', 'final'],
      required: true,
      index: true
    },
    criteria: { type: [rubricItemSchema], default: [] },
    total: { type: Number, default: 0 },
    maxTotal: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
    isSubmitted: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// One evaluation per team+teacher+phase
rubricEvaluationSchema.index({ teamId: 1, teacherId: 1, phase: 1 }, { unique: true });

module.exports = mongoose.model('RubricEvaluation', rubricEvaluationSchema);