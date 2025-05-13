const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { verifyToken, verifyRole } = require('../Middlewares/AuthMiddleware');
const Project = require('../Models/Project');
const Documentation = require('../Models/Documentation');
const Fund = require('../Models/Fund');
const Discussion = require('../Models/Discussion');
const User = require('../Models/User');
const Team = require('../Models/Team');
const ProjectUpdate = require('../Models/ProjectUpdate');

const studentAccess = [verifyToken, verifyRole('student')];

// -------------------- GET Teacher List --------------------
router.get('/teacher', studentAccess, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('_id name email');
    res.json({ success: true, teachers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch teachers' });
  }
});

// -------------------- Submit Project --------------------
router.post('/projects/submit', verifyToken, async (req, res) => {
  const { title, description, teacherId, studentId } = req.body;

  if (!title || !description || !teacherId || !studentId) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const newProject = new Project({
      title,
      description,
      student: studentId,
      teacher: teacherId
    });
    await newProject.save();

    const update = new ProjectUpdate({
      studentId,
      teacherId,
      projectTitle: title,
      message: `Project "${title}" submitted. Description: ${description}`,
      comments: []
    });
    await update.save();

    res.json({ success: true, message: "Project submitted", project: newProject, updateId: update._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error while submitting project" });
  }
});

// -------------------- Get Project Status --------------------
router.get('/project-status', studentAccess, async (req, res) => {
  try {
    const project = await Project.findOne({ student: req.user._id });
    res.json({ success: true, status: project?.status || 'Not started' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch project status' });
  }
});

// -------------------- Send Status Update --------------------
router.post('/send-status-update', studentAccess, async (req, res) => {
  try {
    const { teacherId, message, projectTitle } = req.body;
    const update = await ProjectUpdate.create({
      studentId: req.user._id,
      teacherId,
      projectTitle,
      message,
      comments: []
    });
    res.json({ success: true, message: 'Status update sent', updateId: update._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to send status update' });
  }
});

// -------------------- Get Project Updates --------------------
router.get('/project-updates', studentAccess, async (req, res) => {
  try {
    const updates = await ProjectUpdate.find({ studentId: req.user._id }).populate('teacherId', 'name email');
    const formatted = updates.map(update => ({
      _id: update._id,
      message: update.message,
      projectTitle: update.projectTitle,
      teacherName: update.teacherId.name,
      teacherId: update.teacherId._id,
      comments: update.comments,
      createdAt: update.createdAt
    }));
    res.json({ success: true, updates: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch updates' });
  }
});

// -------------------- Upload Documentation --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/documentation/upload', studentAccess, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { filename, mimetype, path: filePath } = req.file;
    const user = await User.findById(req.user._id);
    const team = await Team.findOne({ createdBy: req.user._id });

    const doc = new Documentation({
      studentId: req.user._id,
      fileName: filename,
      fileType: mimetype,
      filePath,
      sharedWithTeachers: team?.assignedTeacher || []
    });

    await doc.save();
    res.json({ success: true, message: 'Documentation uploaded', doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to upload documentation' });
  }
});

router.get('/documentation', studentAccess, async (req, res) => {
  try {
    const docs = await Documentation.find({ studentId: req.user._id }).populate('sharedWithTeachers', 'name email');
    res.json({ success: true, docs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch documentation' });
  }
});

// -------------------- Discussions --------------------
router.get('/discussions', studentAccess, async (req, res) => {
  try {
    const discussions = await Discussion.find({ studentId: req.user._id });
    res.json({ success: true, discussions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch discussions' });
  }
});

router.post('/discussions', studentAccess, async (req, res) => {
  try {
    const { message } = req.body;
    const newMsg = await Discussion.create({ studentId: req.user._id, message });
    res.json({ success: true, message: 'Message added', newMsg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add message' });
  }
});

// -------------------- Fund Requests --------------------
router.post('/fund-request', studentAccess, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const team = await Team.findOne({
      $or: [{ createdBy: req.user._id }, { teamMembers: req.user._id }]
    }).populate('assignedTeacher');

    if (!team) return res.status(400).json({ message: 'Student not in a team' });

    const fund = await Fund.create({
      teamName: team.teamName,
      amount: Number(amount),
      reason,
      assignedTeacher: team.assignedTeacher._id,
      studentId: req.user._id
    });

    res.status(201).json({ message: 'Fund request submitted', fund });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit fund request' });
  }
});

router.get('/fund-requests', studentAccess, async (req, res) => {
  try {
    const funds = await Fund.find({ studentId: req.user._id }).sort({ createdAt: -1 }).populate('assignedTeacher', 'name');
    res.json(funds);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// -------------------- Profile --------------------
router.get('/profile', studentAccess, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.post('/profile/update', studentAccess, async (req, res) => {
  try {
    const { name } = req.body;
    req.user.name = name;
    await req.user.save();
    res.json({ success: true, message: 'Profile updated', user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// -------------------- Team Management --------------------
router.post('/team', async (req, res) => {
  try {
    const { teamName, teamMembers, assignedTeacher, createdBy } = req.body;

    if (!teamName || !teamMembers || !assignedTeacher || !createdBy) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { createdBy }, // find by user ID
      {
        $set: {
          teamName,
          teamMembers,
          assignedTeacher,
        }
      },
      {
        upsert: true, // create if not found
        new: true,    // return the new document
      }
    );

    const message = updatedTeam.isNew ? 'Team created successfully' : 'Team updated successfully';

    res.status(201).json({ message, team: updatedTeam });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to save team data' });
  }
});

router.get('/team', studentAccess, async (req, res) => {
  try {
    const studentId = req.user.id;

    const team = await Team.findOne({
      $or: [
        { createdBy: studentId },
        { teamMembers: studentId }
      ]
    })
    .populate('teamMembers', 'name email') // Optional: get team member names/emails
    .populate('assignedTeacher', 'name email subject');

    if (!team) {
      return res.status(404).json({ message: 'No team found for this student.' });
    }

    res.status(200).json({ team });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});router.get('/teammember', studentAccess, async (req, res) => {
  const studentId = req.user._id; // ✅ Use correct variable name

  try {
    const team = await Team.findOne({
      $or: [
        { createdBy: studentId },
        { teamMembers: studentId }
      ]
    }).populate('assignedTeacher teamMembers');

    if (team) {
      return res.json({ success: true, team });
    } else {
      return res.status(404).json({ success: false, message: 'No team found' });
    }
  } catch (error) {
    console.error('Error fetching team:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve team info' });
  }
});



// -------------------- Team Members --------------------
router.get('/members', studentAccess, async (req, res) => {
  try {
    const members = await User.find({ role: 'student', teamName: req.user.teamName });
    res.json({ success: true, members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch team members' });
  }
});

module.exports = router;
