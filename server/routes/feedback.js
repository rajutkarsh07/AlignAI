const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
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

// Get all feedback with pagination and filters
router.get('/', feedbackController.getAllFeedback);

// Get active feedback only
router.get('/active', feedbackController.getActiveFeedback);

// Add feedback manually
router.post('/', feedbackController.addFeedback);

// Upload feedback document
router.post('/upload', upload.single('document'), feedbackController.uploadFeedbackDocument);

// Get feedback context for AI
router.get('/context', feedbackController.getFeedbackContext);

// Get feedback statistics
router.get('/stats', feedbackController.getFeedbackStats);

// Bulk update feedback status
router.put('/bulk-status', feedbackController.bulkUpdateStatus);

// Update feedback status
router.put('/:id/status', feedbackController.updateFeedbackStatus);

// Update feedback
router.put('/:id', feedbackController.updateFeedback);

// Delete feedback
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router; 