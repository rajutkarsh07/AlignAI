const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, DOCX, DOC, or TXT files.'), false);
    }
  }
});

// Get current project
router.get('/', projectController.getCurrentProject);

// Create or update project
router.post('/', projectController.createOrUpdateProject);

// Upload project document
router.post('/upload', upload.single('document'), projectController.uploadProjectDocument);

// Get project context for AI
router.get('/context', projectController.getProjectContext);

// Update project goals
router.put('/goals', projectController.updateProjectGoals);

// Update project timeline
router.put('/timeline', projectController.updateProjectTimeline);

// Get project statistics
router.get('/stats', projectController.getProjectStats);

// Delete project
router.delete('/', projectController.deleteProject);

module.exports = router; 