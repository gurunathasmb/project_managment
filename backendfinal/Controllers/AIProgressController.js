// Controllers/AIProgressController.js
const Team = require('../Models/Team');
const Project = require('../Models/Project');
const Documentation = require('../Models/Documentation');
const ProjectUpdate = require('../Models/ProjectUpdate');

const AIProgressEvaluation = require('../Models/AIProgressEvaluation');
const { evaluateProgressWithAI } = require('../services/aiProgressEvaluator');
const VALID_PHASES = ['phase1', 'phase2', 'final'];

const getAIProgress = async (req, res) => {
  try {
    const { teamId, phase } = req.query;

    if (!teamId) return res.status(400).json({ success: false, message: 'teamId is required' });
    if (!VALID_PHASES.includes(phase)) {
      return res.status(400).json({ success: false, message: 'Invalid phase' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (String(team.assignedTeacher) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const evaluation = await AIProgressEvaluation.findOne({
      teamId,
      teacherId: req.user._id,
      phase
    }).sort({ updatedAt: -1 });

    return res.json({ success: true, evaluation: evaluation || null });
  } catch (error) {
    console.error('Error fetching AI progress:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch AI progress' });
  }
};

const runAIProgress = async (req, res) => {
  try {
    const { teamId, phase } = req.body;

    if (!teamId) return res.status(400).json({ success: false, message: 'teamId is required' });
    if (!VALID_PHASES.includes(phase)) {
      return res.status(400).json({ success: false, message: 'Invalid phase' });
    }

    const team = await Team.findById(teamId)
      .populate('teamMembers', 'name email')
      .populate('assignedTeacher', 'name email');

    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (String(team.assignedTeacher?._id || team.assignedTeacher) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const project = await Project.findOne({ teamId: team._id })
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email')
      .populate('teamId', 'teamName');

    const memberIds = team.teamMembers.map(m => m._id);

    const docs = await Documentation.find({
      sharedWithTeachers: req.user._id,
      studentId: { $in: memberIds }
    })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    const updates = await ProjectUpdate.find({
      teacherId: req.user._id,
      studentId: { $in: memberIds }
    })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    const workspace = { team, project, docs, updates };

    // ✅ Call AI
    const ai = await evaluateProgressWithAI({ phase, workspace });

    // ✅ Save (upsert)
    const saved = await AIProgressEvaluation.findOneAndUpdate(
      { teamId, teacherId: req.user._id, phase },
      {
        teamId,
        teacherId: req.user._id,
        phase,
        progressScore: ai.progressScore,
        phaseFit: ai.phaseFit || phase,
        summary: ai.summary || '',
        strengths: ai.strengths || [],
        risks: ai.risks || [],
        nextActions: ai.nextActions || [],
        missingInfo: ai.missingInfo || [],
        evidence: {
          updateIds: (ai.evidence?.updateIds || []).filter(Boolean),
          docNames: ai.evidence?.docNames || [],
          links: ai.evidence?.links || []
        },
        rawModel: ai.rawModel || ''
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, message: 'AI progress generated', evaluation: saved });
  } catch (error) {
    console.error('Error running AI progress:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to generate AI progress'
    });
  }
};

module.exports = { getAIProgress, runAIProgress };