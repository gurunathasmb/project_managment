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
  const teachers = await User.find({ role: 'teacher' }).select('_id name email');
  res.json({ success: true, teachers });
});

/* ================= PROFILE ================= */
router.get('/profile', studentAccess, (req, res) => {
  res.json({ success: true, user: req.user });
});

/* ================= PROJECT ================= */
router.get('/project', studentAccess, async (req, res) => {
  const project = await Project.findOne({ studentId: req.user._id })
    .populate('teacherId', 'name email');
  res.json({ success: true, project });
});

/* ================= STATUS UPDATE ================= */
router.post('/send-status-update', studentAccess, async (req, res) => {
  const { teacherId, projectName, message } = req.body;
  if (!teacherId || !message) {
    return res.status(400).json({ success: false });
  }

  const update = await ProjectUpdate.create({
    studentId: req.user._id,
    teacherId,
    projectName,
    message,
    comments: []
  });

  res.json({ success: true, update });
});

/* ================= PROJECT UPDATES ================= */
router.get('/project-updates', studentAccess, async (req, res) => {
  const updates = await ProjectUpdate.find({ studentId: req.user._id })
    .populate('teacherId', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, updates });
});

/* ================= TEAM ================= */
router.get('/teammember', studentAccess, async (req, res) => {
  const team = await Team.findOne({
    $or: [{ createdBy: req.user._id }, { teamMembers: req.user._id }]
  }).populate('assignedTeacher teamMembers', 'name email');

  if (!team) return res.status(404).json({ success: false });
  res.json({ success: true, team });
});

router.post('/team', studentAccess, async (req, res) => {
  const { teamName, teamMembers, assignedTeacher, createdBy } = req.body;

  const team = await Team.findOneAndUpdate(
    { createdBy },
    { teamName, teamMembers, assignedTeacher, createdBy },
    { upsert: true, new: true }
  );

  res.json({ success: true, team });
});

/* ================= MEMBERS ================= */
router.get('/members', studentAccess, async (req, res) => {
  const members = await User.find({ role: 'student' })
    .select('_id name email teamName');
  res.json({ success: true, members });
});

/* ================= FUNDS ================= */
router.post('/fund-request', studentAccess, async (req, res) => {
  const team = await Team.findOne({
    $or: [{ createdBy: req.user._id }, { teamMembers: req.user._id }]
  }).populate('assignedTeacher');

  if (!team) return res.status(400).json({ success: false });

  const fund = await Fund.create({
    teamName: team.teamName,
    amount: Number(req.body.amount),
    reason: req.body.reason,
    assignedTeacher: team.assignedTeacher._id,
    studentId: req.user._id
  });

  res.json({ success: true, fund });
});

router.get('/fund-requests', studentAccess, async (req, res) => {
  const funds = await Fund.find({ studentId: req.user._id })
    .populate('assignedTeacher', 'name')
    .sort({ createdAt: -1 });

  res.json(funds);
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
});

router.get('/documentation', studentAccess, async (req, res) => {
  const docs = await Documentation.find({ studentId: req.user._id })
    .sort({ createdAt: -1 });

  res.json({ success: true, docs });
});

router.delete('/documentation/:id', studentAccess, async (req, res) => {
  await Documentation.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
