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
const { getAIProgress, runAIProgress } = require('../Controllers/AIProgressController');

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
   TEAMS (Assigned to Teacher)
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
   🌍 GLOBAL PROJECTS (ALL TEAMS - READ ONLY)
   GET /api/teacher/global-projects
====================================================== */
router.get('/global-projects', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const { semester } = req.query; // optional filter

    const teams = await Team.find()
      .populate('teamMembers', 'name semester')
      .populate('assignedTeacher', 'name')
      .lean();

    const teamIds = teams.map(t => t._id);

    const projects = await Project.find({ teamId: { $in: teamIds } }).lean();

    const projectMap = {};
    projects.forEach(p => {
      if (p.teamId) projectMap[p.teamId.toString()] = p;
    });

    const rows = [];

    teams.forEach(team => {
      const project = projectMap[team._id.toString()];

      team.teamMembers.forEach(student => {
        // ✅ semester filter
        if (semester && student.semester !== semester) return;

        rows.push({
          studentId: student._id,
          studentName: student.name,
          semester: student.semester || 'N/A',
          projectTitle: project?.title || 'Not Assigned',
          teamName: team.teamName,
          currentPhase: project?.currentPhase || 'Idea',
          teacherName: team.assignedTeacher?.name || 'Not Assigned'
        });
      });
    });

    res.json({ success: true, projects: rows });
  } catch (error) {
    console.error('Global projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch global projects'
    });
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
   RUBRIC: GET SAVED EVALUATION
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
    });

    res.json({ success: true, evaluation: evaluation || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch evaluation' });
  }
});

/* ======================================================
   AI PROGRESS
====================================================== */
router.get('/ai-progress', verifyToken, verifyRole('teacher'), getAIProgress);
router.post('/ai-progress/run', verifyToken, verifyRole('teacher'), runAIProgress);

/* ======================================================
   PROFILE
====================================================== */
router.get('/profile', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user: teacher });
  } catch {
    res.status(500).json({ success: false, message: 'Error fetching profile' });
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
  } catch {
    res.status(500).json({ success: false, message: 'Profile update failed' });
  }
});

module.exports = router;