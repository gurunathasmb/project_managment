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


// ========================== DASHBOARD ==========================
router.get('/dashboard', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const projects = await Project.find().populate('studentId', 'name email');
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
  }
});

// ========================== TEAMS ==========================
router.get('/teams', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const { _id: teacherId } = req.user;
    const teams = await Team.find({ assignedTeacher: teacherId })
      .populate('teamMembers', 'name email')
      .populate('assignedTeacher', 'name email');
    res.json({ success: true, teams });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching teams' });
  }
});

// ========================== PROJECT STATUS ==========================
router.get('/project-status', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const projects = await ProjectUpdate.find({ teacherId }).populate('studentId'); // Fetch updates only assigned to this teacher
    res.json({ success: true, updates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching project statuses' });
  }
});

router.post('/project-status/update', verifyToken, verifyRole('teacher'), async (req, res) => {
  const { projectId, status } = req.body;
  try {
    const project = await Project.findByIdAndUpdate(projectId, { status }, { new: true });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Status updated', project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating project status' });
  }
});

// ========================== DOCUMENTATION ==========================
router.get('/documents', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const docs = await Documentation.find({ sharedWithTeachers: req.user._id });
    res.json({ success: true, docs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching documents' });
  }
});

router.post('/documents/upload', verifyToken, verifyRole('teacher'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { filename, mimetype, path: filePath } = req.file;
    const doc = new Documentation({
      teacherId: req.user._id,
      fileName: filename,
      fileType: mimetype,
      filePath,
      isTeacherFile: true,
      sharedWithTeachers: [req.user._id]
    });

    await doc.save();
    res.json({ success: true, message: 'File uploaded', doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

router.delete('/documents/:id', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const doc = await Documentation.findById(req.params.id);
    if (!doc || String(doc.teacherId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await doc.deleteOne();
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Deletion error' });
  }
});

// ========================== FUNDS ==========================
router.get('/funds', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const funds = await Fund.find({ assignedTeacher: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, funds });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching fund requests' });
  }
});

router.post('/funds/assign', verifyToken, verifyRole('teacher'), async (req, res) => {
  const { fundId, status, teacherComments } = req.body;

  try {
    const fund = await Fund.findById(fundId);
    if (!fund) return res.status(404).json({ success: false, message: 'Fund request not found' });

    if (String(fund.assignedTeacher) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    fund.status = status;
    fund.teacherComments = teacherComments;
    await fund.save();

    res.json({ success: true, message: 'Decision updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating fund status' });
  }
});

// ========================== PROFILE ==========================
router.get('/profile', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

router.post('/profile/update', verifyToken, verifyRole('teacher'), upload.single('profilePic'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updateData = { name, email };

    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (req.file) updateData.profilePic = req.file.filename;

    const updated = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
    res.json({ success: true, message: 'Profile updated', user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update error' });
  }
});

// ========================== STUDENTS ==========================
router.get('/students', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('_id name email');
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching students' });
  }
});
router.get('/student-updates', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    
    // Fetch updates for the teacher
    const projects = await ProjectUpdate.find({ teacherId: req.user.id })
      .populate('studentId');  // Populate the studentId to get the student data
    // If no updates are found, return a message
    if (projects.length === 0) {
      return res.json({ success: true, message: 'No updates found for this teacher' });
    }

    res.json({ success: true, updates: projects });
  } catch (error) {
    // Log the error for debugging
    console.error('Error fetching updates:', error);
    res.status(500).json({ success: false, message: 'Error fetching updates', error: error.message });
  }
});



router.post('/send-comment', verifyToken, verifyRole('teacher'), async (req, res) => {
  const { updateId, comment } = req.body;

  try {
    const project = await ProjectUpdate.findById(updateId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    project.comments.push({
      text: comment,
      sender: 'teacher',
      timestamp: new Date()
    });

    await project.save();
    res.json({ success: true, message: 'Comment added' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Comment failed' });
  }
});

module.exports = router;
