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
router.get('/documentation', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const docs = await Documentation.find({
      sharedWithTeachers: req.user._id
    })
    .populate('studentId', 'name email')
    .populate('sharedWithTeachers', 'name email')
    .sort({ createdAt: -1 });

    res.json({ success: true, docs });
  } catch (err) {
    console.error('Fetch docs error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch documentation' 
    });
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

// Add comment to project update
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

    // Add the new comment
    update.comments.push({
      sender: 'teacher',
      text: comment,
      timestamp: new Date()
    });

    await update.save();

    // Return the updated project with populated fields
    const updatedProject = await ProjectUpdate.findById(updateId)
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email');

    res.json({ 
      success: true, 
      message: 'Comment added successfully',
      update: updatedProject
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding comment to project update' 
    });
  }
});

// Download document
router.get('/documentation/download/:id', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const doc = await Documentation.findOne({
      _id: req.params.id,
      sharedWithTeachers: req.user._id
    });

    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    res.download(doc.filePath, doc.fileName);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to download file' 
    });
  }
});

// Add comment to document
router.post('/documentation/comment/:id', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment is required' 
      });
    }

    const doc = await Documentation.findOne({
      _id: req.params.id,
      sharedWithTeachers: req.user._id
    });

    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    doc.teacherComments.push({
      teacherId: req.user._id,
      comment,
      timestamp: new Date()
    });

    await doc.save();

    res.json({ 
      success: true, 
      message: 'Comment added successfully' 
    });
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add comment' 
    });
  }
});

// Update document status
router.put('/documentation/status/:id', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['pending', 'reviewed', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const doc = await Documentation.findOne({
      _id: req.params.id,
      sharedWithTeachers: req.user._id
    });

    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    doc.status = status;
    await doc.save();

    res.json({ 
      success: true, 
      message: 'Status updated successfully' 
    });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update status' 
    });
  }
});

module.exports = router;
