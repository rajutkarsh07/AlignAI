const express = require('express');
const {
  getProjectSessions,
  getSessionById,
  createSession,
  sendMessage,
  updateSession,
  deleteSession,
  clearSession,
  exportSession,
} = require('../controllers/chatController');

const router = express.Router();

// @route   GET /api/chat/project/:projectId/sessions
// @desc    Get all chat sessions for a project
// @access  Public
router.get('/project/:projectId/sessions', getProjectSessions);

// @route   GET /api/chat/sessions/:sessionId
// @desc    Get chat session by ID
// @access  Public
router.get('/sessions/:sessionId', getSessionById);

// @route   POST /api/chat/sessions
// @desc    Create new chat session
// @access  Public
router.post('/sessions', createSession);

// @route   POST /api/chat/sessions/:sessionId/messages
// @desc    Send message to chat session
// @access  Public
router.post('/sessions/:sessionId/messages', sendMessage);

// @route   PUT /api/chat/sessions/:sessionId
// @desc    Update chat session
// @access  Public
router.put('/sessions/:sessionId', updateSession);

// @route   DELETE /api/chat/sessions/:sessionId
// @desc    Delete chat session (soft delete)
// @access  Public
router.delete('/sessions/:sessionId', deleteSession);

// @route   POST /api/chat/sessions/:sessionId/clear
// @desc    Clear chat session messages
// @access  Public
router.post('/sessions/:sessionId/clear', clearSession);

// @route   GET /api/chat/sessions/:sessionId/export
// @desc    Export chat session
// @access  Public
router.get('/sessions/:sessionId/export', exportSession);

module.exports = router;
