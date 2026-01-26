const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { verifyToken, verifyRole } = require('../Middlewares/AuthMiddleware');

const User = require('../Models/User');
const Project = require('../Models/Project');
const ProjectUpdate = require('../Models/ProjectUpdate');
const Documentation = require('../Models/Documentation');
const Fund = require('../Models/Fund');
const Team = require('../Models/Team');

const studentAccess = [verifyToken, verifyRole('student')];

/* ================= TEACHERS ================= */
router.get('/teacher', studentAccess, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('_id name email');
    res.json({ success: true, teachers });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch teachers' });
  }
});

/* ================= PROFILE ================= */
router.get('/profile', studentAccess, (req, res) => {
  res.json({ success: true, user: req.user });
});

/* ================= PROJECT (legacy - kept) =================
   Returns student's project by studentId (your old flow)
*/
router.get('/project', studentAccess, async (req, res) => {
  try {
    const project = await Project.findOne({ studentId: req.user._id })
      .populate('teacherId', 'name email')
      .populate('teamId', 'teamName');

    res.json({ success: true, project });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch project' });
  }
});

/* ============================================================
   ✅ NEW: WORKSPACE (TEAM-BASED)
   GET /api/student/workspace
   - Returns team + workspace project + teacher
============================================================ */
router.get('/workspace', studentAccess, async (req, res) => {
  try {
    const team = await Team.findOne({
      $or: [{ createdBy: req.user._id }, { teamMembers: req.user._id }]
    }).populate('assignedTeacher teamMembers', 'name email role');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const project = await Project.findOne({ teamId: team._id })
      .populate('teacherId', 'name email')
      .populate('studentId', 'name email');

    const isLeader = String(team.createdBy) === String(req.user._id);

    res.json({ success: true, team, project, isLeader });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch workspace' });
  }
});

/* ============================================================
   ✅ NEW: WORKSPACE SAVE (ONLY TEAM LEADER)
   POST /api/student/workspace
   - Upserts project for the team
============================================================ */
router.post('/workspace', studentAccess, async (req, res) => {
  try {
    const team = await Team.findOne({
      $or: [{ createdBy: req.user._id }, { teamMembers: req.user._id }]
    });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Only leader can edit workspace
    if (String(team.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only team leader can update workspace' });
    }

    // Teacher is from team assignment
    const teacherId = team.assignedTeacher;

    const {
      title,
      domain,
      techStack,
      description,
      currentPhase,
      problemStatement,
      objectives,
      repoUrl,
      demoUrl,
      startDate,
      endDate,
      milestones
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const updateDoc = {
      studentId: req.user._id,      // leader (owner)
      teacherId,
      teamId: team._id,

      title: title.trim(),
      domain: domain || '',
      techStack: Array.isArray(techStack) ? techStack : [],
      description: description || '',

      currentPhase: currentPhase || 'Idea',

      problemStatement: problemStatement || '',
      objectives: Array.isArray(objectives) ? objectives : [],

      repoUrl: repoUrl || '',
      demoUrl: demoUrl || '',

      startDate: startDate || undefined,
      endDate: endDate || undefined,

      milestones: Array.isArray(milestones) ? milestones : []
    };

    const project = await Project.findOneAndUpdate(
      { teamId: team._id },
      updateDoc,
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'Workspace saved', project });
  } catch (e) {
    console.error('Workspace save error:', e);
    res.status(500).json({ success: false, message: 'Failed to save workspace' });
  }
});

/* ================= STATUS UPDATE ================= */
router.post('/send-status-update', studentAccess, async (req, res) => {
  try {
    const { teacherId, projectName, message } = req.body;
    if (!teacherId || !message) {
      return res.status(400).json({ success: false, message: 'Teacher and message required' });
    }

    const update = await ProjectUpdate.create({
      studentId: req.user._id,
      teacherId,
      projectName,
      message,
      comments: []
    });

    res.json({ success: true, update });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to send update' });
  }
});

/* ================= PROJECT UPDATES ================= */
router.get('/project-updates', studentAccess, async (req, res) => {
  try {
    const updates = await ProjectUpdate.find({ studentId: req.user._id })
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, updates });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch updates' });
  }
});

/* ================= TEAM ================= */
router.get('/teammember', studentAccess, async (req, res) => {
  try {
    const team = await Team.findOne({
      $or: [{ createdBy: req.user._id }, { teamMembers: req.user._id }]
    }).populate('assignedTeacher teamMembers', 'name email');

    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    res.json({ success: true, team });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch team' });
  }
});

router.post('/team', studentAccess, async (req, res) => {
  try {
    const { teamName, teamMembers, assignedTeacher, createdBy } = req.body;

    const team = await Team.findOneAndUpdate(
      { createdBy },
      { teamName, teamMembers, assignedTeacher, createdBy },
      { upsert: true, new: true }
    );

    res.json({ success: true, team });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to save team' });
  }
});

/* ================= MEMBERS ================= */
router.get('/members', studentAccess, async (req, res) => {
  try {
    const members = await User.find({ role: 'student' }).select('_id name email');
    res.json({ success: true, members });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
});

/* ================= FUNDS ================= */
router.post('/fund-request', studentAccess, async (req, res) => {
  try {
    const team = await Team.findOne({
      $or: [{ createdBy: req.user._id }, { teamMembers: req.user._id }]
    }).populate('assignedTeacher');

    if (!team) return res.status(400).json({ success: false, message: 'Team not found' });

    const fund = await Fund.create({
      teamName: team.teamName,
      amount: Number(req.body.amount),
      reason: req.body.reason,
      assignedTeacher: team.assignedTeacher._id,
      studentId: req.user._id
    });

    res.json({ success: true, fund });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to create fund request' });
  }
});

router.get('/fund-requests', studentAccess, async (req, res) => {
  try {
    const funds = await Fund.find({ studentId: req.user._id })
      .populate('assignedTeacher', 'name')
      .sort({ createdAt: -1 });

    res.json(funds);
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch fund requests' });
  }
});

/* ================= DOCUMENTATION ================= */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.post('/documentation/upload', studentAccess, upload.single('file'), async (req, res) => {
  try {
    const team = await Team.findOne({
      $or: [{ createdBy: req.user._id }, { teamMembers: req.user._id }]
    });

    const doc = await Documentation.create({
      studentId: req.user._id,
      fileName: req.file.filename,
      fileType: req.file.mimetype,
      filePath: req.file.path,
      sharedWithTeachers: team?.assignedTeacher ? [team.assignedTeacher] : []
    });

    res.json({ success: true, doc });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

router.get('/documentation', studentAccess, async (req, res) => {
  try {
    const docs = await Documentation.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, docs });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch docs' });
  }
});

router.delete('/documentation/:id', studentAccess, async (req, res) => {
  try {
    await Documentation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

module.exports = router;
