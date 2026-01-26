const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { verifyToken, verifyRole } = require('../Middlewares/AuthMiddleware');
const upload = require('../Middlewares/UploadMiddleware');

const Project = require('../Models/Project');
const Documentation = require('../Models/Documentation');
const Fund = require('../Models/Fund');
const User = require('../Models/User');
const Team = require('../Models/Team');
const ProjectUpdate = require('../Models/ProjectUpdate');
const RubricEvaluation = require('../Models/RubricEvaluation');

/* ======================================================
   DASHBOARD
====================================================== */
router.get('/dashboard', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const projects = await Project.find({ teacherId: req.user._id })
      .populate('studentId', 'name email')
      .populate('teamId', 'teamName');

    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
  }
});

/* ======================================================
   TEAMS
====================================================== */
router.get('/teams', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const teams = await Team.find({ assignedTeacher: req.user._id })
      .populate('teamMembers', 'name email')
      .populate('assignedTeacher', 'name email');

    res.json({ success: true, teams });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching teams' });
  }
});

/* ======================================================
   TEAM WORKSPACE
====================================================== */
router.get('/team-workspace', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) return res.status(400).json({ success: false, message: 'teamId is required' });

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

    res.json({ success: true, team, project, docs, updates });
  } catch (error) {
    console.error('Error fetching team workspace:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch team workspace' });
  }
});

/* ======================================================
   ✅ RUBRIC: GET SAVED EVALUATION
   GET /api/teacher/rubric-evaluation?teamId=...&phase=phase1
====================================================== */
router.get('/rubric-evaluation', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const { teamId, phase } = req.query;
    if (!teamId) return res.status(400).json({ success: false, message: 'teamId is required' });
    if (!['phase1', 'phase2', 'final'].includes(phase)) {
      return res.status(400).json({ success: false, message: 'Invalid phase' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (String(team.assignedTeacher) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const evaluation = await RubricEvaluation.findOne({
      teamId,
      teacherId: req.user._id,
      phase
    }).sort({ updatedAt: -1 });

    res.json({ success: true, evaluation: evaluation || null });
  } catch (error) {
    console.error('Error fetching rubric evaluation:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch evaluation' });
  }
});

/* ======================================================
   ✅ RUBRIC: SAVE (UPSERT) EVALUATION
   POST /api/teacher/rubric-evaluation
====================================================== */
router.post('/rubric-evaluation', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const { teamId, phase, criteria, remarks } = req.body;

    if (!teamId) return res.status(400).json({ success: false, message: 'teamId is required' });
    if (!['phase1', 'phase2', 'final'].includes(phase)) {
      return res.status(400).json({ success: false, message: 'Invalid phase' });
    }
    if (!Array.isArray(criteria)) {
      return res.status(400).json({ success: false, message: 'criteria must be an array' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (String(team.assignedTeacher) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // ✅ If old duplicates exist, block save with a clear message
    const dupCount = await RubricEvaluation.countDocuments({
      teamId,
      teacherId: req.user._id,
      phase
    });

    if (dupCount > 1) {
      return res.status(409).json({
        success: false,
        message:
          'Duplicate evaluation already exists in DB for this team/phase. Delete old duplicates once and try again.'
      });
    }

    // sanitize numbers
    const cleaned = criteria.map(c => {
      const max = Number(c.max ?? 10);
      let score = Number(c.score ?? 0);
      if (Number.isNaN(score)) score = 0;
      if (score < 0) score = 0;
      if (score > max) score = max;

      return {
        key: String(c.key),
        label: String(c.label),
        max,
        score
      };
    });

    const total = cleaned.reduce((sum, c) => sum + (Number(c.score) || 0), 0);
    const maxTotal = cleaned.reduce((sum, c) => sum + (Number(c.max) || 0), 0);

    const evaluation = await RubricEvaluation.findOneAndUpdate(
      { teamId, teacherId: req.user._id, phase },
      {
        teamId,
        teacherId: req.user._id,
        phase,
        criteria: cleaned,
        total,
        maxTotal,
        remarks: remarks || '',
        isSubmitted: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'Evaluation saved', evaluation });
  } catch (error) {
    console.error('Error saving rubric evaluation:', error);

    // ✅ unique index conflict
    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          'Duplicate evaluation already exists in DB for this team/phase. Delete old duplicates once and try again.'
      });
    }

    res.status(500).json({ success: false, message: 'Failed to save evaluation' });
  }
});

/* ======================================================
   STUDENT PROJECT STATUS UPDATES
====================================================== */
router.get('/student-updates', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const updates = await ProjectUpdate.find({ teacherId: req.user._id })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, updates });
  } catch (error) {
    console.error('Error fetching student updates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student updates' });
  }
});

/* ======================================================
   SEND COMMENT TO STUDENT
====================================================== */
router.post('/send-comment', verifyToken, verifyRole('teacher'), async (req, res) => {
  const { updateId, comment } = req.body;

  if (!updateId || !comment) {
    return res.status(400).json({ success: false, message: 'Update ID and comment are required' });
  }

  try {
    const update = await ProjectUpdate.findById(updateId);
    if (!update) return res.status(404).json({ success: false, message: 'Project update not found' });

    update.comments.push({
      sender: 'teacher',
      text: comment,
      timestamp: new Date()
    });

    await update.save();

    const populatedUpdate = await ProjectUpdate.findById(updateId)
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email');

    res.json({ success: true, message: 'Comment added successfully', update: populatedUpdate });
  } catch (error) {
    console.error('Error sending comment:', error);
    res.status(500).json({ success: false, message: 'Failed to send comment' });
  }
});

/* ======================================================
   PROJECT APPROVE / REJECT
====================================================== */
router.post('/project-status/update', verifyToken, verifyRole('teacher'), async (req, res) => {
  const { projectId, status } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (String(project.teacherId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    project.status = status;
    await project.save();

    res.json({ success: true, message: 'Project status updated', project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating project status' });
  }
});

/* ======================================================
   DOCUMENTATION (TEACHER VIEW)
====================================================== */
router.get('/documentation', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const docs = await Documentation.find({ sharedWithTeachers: req.user._id })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, docs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch documentation' });
  }
});

/* ======================================================
   FUND REQUESTS
====================================================== */
router.get('/funds', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const funds = await Fund.find({ assignedTeacher: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, funds });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching fund requests' });
  }
});

router.put('/funds/:fundId', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const { fundId } = req.params;
    const { status, teacherComments } = req.body;

    const fund = await Fund.findById(fundId);
    if (!fund) return res.status(404).json({ success: false, message: 'Fund request not found' });

    if (fund.assignedTeacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    fund.status = status;
    fund.teacherComments = teacherComments || '';
    await fund.save();

    res.json({ success: true, message: 'Fund request updated', fund });
  } catch (error) {
    console.error('Error updating fund request:', error);
    res.status(500).json({ success: false, message: 'Error updating fund request' });
  }
});

/* ======================================================
   TEACHER PROFILE
====================================================== */
router.get('/profile', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

router.post('/profile/update-info', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const { name, department, phone, skills, designation, employeeId } = req.body;

    const updateData = {
      ...(name !== undefined && { name }),
      ...(department !== undefined && { department }),
      ...(phone !== undefined && { phone }),
      ...(skills !== undefined && { skills }),
      ...(designation !== undefined && { designation }),
      ...(employeeId !== undefined && { employeeId })
    };

    const updated = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select('-password');

    res.json({ success: true, message: 'Profile updated', user: updated });
  } catch (error) {
    console.error('Teacher profile update-info failed:', error);
    res.status(500).json({ success: false, message: 'Profile update failed' });
  }
});

router.post('/profile/update', verifyToken, verifyRole('teacher'), upload.single('profilePic'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updateData = { name, email };

    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (req.file) updateData.profilePic = req.file.filename;

    const updated = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select('-password');
    res.json({ success: true, message: 'Profile updated', user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Profile update failed' });
  }
});

module.exports = router;