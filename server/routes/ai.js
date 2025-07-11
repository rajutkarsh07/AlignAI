const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Chat with AI assistant
router.post('/chat', aiController.chatWithAI);

// Generate roadmap
router.post('/roadmap', aiController.generateRoadmap);

// Suggest task enhancements
router.post('/suggest-task', aiController.suggestTaskEnhancements);

// Analyze feedback with AI
router.post('/analyze-feedback', aiController.analyzeFeedback);

// Get AI insights
router.get('/insights', aiController.getAIInsights);

// Generate task from feedback
router.get('/feedback/:feedbackId/task', aiController.generateTaskFromFeedback);

module.exports = router; 