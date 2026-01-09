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

/* ======================================================
   DASHBOARD
====================================================== */
router.get('/dashboard', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const projects = await Project.find({ teacherId: req.user._id })
      .populate('studentId', 'name email');
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
   STUDENT PROJECT STATUS UPDATES (MAIN FEATURE)
====================================================== */
router.get('/student-updates', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const updates = await ProjectUpdate.find({
      teacherId: req.user._id
    })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, updates });
  } catch (error) {
    console.error('Error fetching student updates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student updates'
    });
  }
});

/* ======================================================
   SEND COMMENT TO STUDENT (REFLECTS TO STUDENT SIDE)
====================================================== */
router.post('/send-comment', verifyToken, verifyRole('teacher'), async (req, res) => {
  const { updateId, comment } = req.body;

  if (!updateId || !comment) {
    return res.status(400).json({
      success: false,
      message: 'Update ID and comment are required'
    });
  }

  try {
    const update = await ProjectUpdate.findById(updateId);
    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Project update not found'
      });
    }

    update.comments.push({
      sender: 'teacher',
      text: comment,
      timestamp: new Date()
    });

    await update.save();

    const populatedUpdate = await ProjectUpdate.findById(updateId)
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email');

    res.json({
      success: true,
      message: 'Comment added successfully',
      update: populatedUpdate
    });
  } catch (error) {
    console.error('Error sending comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send comment'
    });
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
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

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
    const docs = await Documentation.find({
      sharedWithTeachers: req.user._id
    })
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

// GET route - Fetch all fund requests for the teacher
router.get('/funds', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const funds = await Fund.find({ assignedTeacher: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, funds });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching fund requests' });
  }
});

// PUT route - Update fund request status (Approve/Reject)
router.put('/funds/:fundId', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const { fundId } = req.params;
    const { status, teacherComments } = req.body;
    
    // Find the fund request
    const fund = await Fund.findById(fundId);
    
    if (!fund) {
      return res.status(404).json({ success: false, message: 'Fund request not found' });
    }
    
    // Verify this teacher is assigned to this fund request
    if (fund.assignedTeacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    // Update the fund request
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

router.post('/profile/update', verifyToken, verifyRole('teacher'), upload.single('profilePic'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updateData = { name, email };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      updateData.profilePic = req.file.filename;
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({ success: true, message: 'Profile updated', user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Profile update failed' });
  }
});

module.exports = router;
