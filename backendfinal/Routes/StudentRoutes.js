const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    const { teacherId, message, projectName } = req.body;
    console.log('Received status update:', { teacherId, message, projectName }); // Debug log
    
    if (!teacherId || !message || !projectName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Teacher, message, and project name are required' 
      });
    }

    const update = await ProjectUpdate.create({
      studentId: req.user._id,
      teacherId,
      projectName,
      message,
      comments: []
    });
    
    console.log('Created update:', update); // Debug log
    
    res.json({ 
      success: true, 
      message: 'Status update sent', 
      updateId: update._id 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send status update' 
    });
  }
});

// -------------------- Get Project Updates --------------------
router.get('/project-updates', studentAccess, async (req, res) => {
  try {
    const updates = await ProjectUpdate.find({ studentId: req.user._id })
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
    
    const formatted = updates.map(update => ({
      _id: update._id,
      message: update.message,
      projectName: update.projectName || 'Untitled Project',
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

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer upload settings
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, JPG, and PNG files are allowed.'));
    }
  }
}).single('file'); // 'file' is the field name in formData

// Upload documentation route
router.post('/documentation/upload', studentAccess, (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file to upload'
      });
    }

    // Check if teacherId is provided
    const { teacherId } = req.body;
    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required'
      });
    }

    try {
      // Create new documentation record
      const doc = new Documentation({
        studentId: req.user._id,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        filePath: req.file.path,
        sharedWithTeachers: [teacherId]
      });

      await doc.save();

      // Populate teacher information
      const populatedDoc = await Documentation.findById(doc._id)
        .populate('sharedWithTeachers', 'name email');

      res.json({
        success: true,
        message: 'File uploaded successfully',
        doc: populatedDoc
      });
    } catch (error) {
      console.error('Documentation save error:', error);
      res.status(500).json({
        success: false,
        message: 'Error saving documentation details'
      });
    }
  });
});

router.get('/documentation', studentAccess, async (req, res) => {
  try {
    const docs = await Documentation.find({ studentId: req.user._id })
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
});

router.get('/teammember', studentAccess, async (req, res) => {
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

// Search users by name or email
router.get('/search-users', studentAccess, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search for users by name or email, excluding the current user
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name email role');

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
});

module.exports = router;
