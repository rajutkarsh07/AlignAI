const express = require('express');
const {
  upload,
  getProjectFeedback,
  getFeedbackById,
  createFeedback,
  createFeedbackFromUpload,
  enhanceFeedback,
  updateFeedback,
  toggleFeedbackItemIgnore,
  deleteFeedback,
  getFeedbackAnalytics,
  getAllFeedback, // <-- import the new controller
} = require('../controllers/feedbackController');

const router = express.Router();

// @route   GET /api/feedback
// @desc    Get all feedback items across all projects
// @access  Public
router.get('/', getAllFeedback);

// @route   GET /api/feedback/project/:projectId
// @desc    Get all feedback for a project
// @access  Public
router.get('/project/:projectId', getProjectFeedback);

// @route   GET /api/feedback/:id
// @desc    Get feedback by ID
// @access  Public
router.get('/:id', getFeedbackById);

// @route   POST /api/feedback
// @desc    Create new feedback collection
// @access  Public
router.post('/', createFeedback);

// @route   POST /api/feedback/upload
// @desc    Create feedback from uploaded document
// @access  Public
router.post('/upload', upload.single('document'), createFeedbackFromUpload);

// @route   POST /api/feedback/enhance
// @desc    Enhance raw feedback text with AI analysis
// @access  Public
router.post('/enhance', enhanceFeedback);

// @route   PUT /api/feedback/:id
// @desc    Update feedback collection
// @access  Public
router.put('/:id', updateFeedback);

// @route   PUT /api/feedback/:id/items/:itemId/ignore
// @desc    Toggle ignore status of feedback item
// @access  Public
router.put('/:id/items/:itemId/ignore', toggleFeedbackItemIgnore);

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback collection (soft delete)
// @access  Public
router.delete('/:id', deleteFeedback);

// @route   GET /api/feedback/project/:projectId/analytics
// @desc    Get feedback analytics for a project
// @access  Public
router.get('/project/:projectId/analytics', getFeedbackAnalytics);

module.exports = router;
