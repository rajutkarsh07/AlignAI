const express = require('express');
const {
  getProjectRoadmaps,
  getRoadmapById,
  generateRoadmap,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  addRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
  convertToTasks,
  getRoadmapTimeline,
  getRoadmapAnalytics,
  getAllRoadmaps, // <-- import the new controller
} = require('../controllers/roadmapController');

const router = express.Router();

// @route   GET /api/roadmap
// @desc    Get all roadmaps across all projects
// @access  Public
router.get('/', getAllRoadmaps);

// @route   GET /api/roadmap/project/:projectId
// @desc    Get all roadmaps for a project
// @access  Public
router.get('/project/:projectId', getProjectRoadmaps);

// @route   GET /api/roadmap/:id
// @desc    Get roadmap by ID
// @access  Public
router.get('/:id', getRoadmapById);

// @route   POST /api/roadmap/generate
// @desc    Generate roadmap using AI
// @access  Public
router.post('/generate', generateRoadmap);

// @route   POST /api/roadmap
// @desc    Create roadmap manually
// @access  Public
router.post('/', createRoadmap);

// @route   PUT /api/roadmap/:id
// @desc    Update roadmap
// @access  Public
router.put('/:id', updateRoadmap);

// @route   DELETE /api/roadmap/:id
// @desc    Delete roadmap (soft delete)
// @access  Public
router.delete('/:id', deleteRoadmap);

// @route   POST /api/roadmap/:id/items
// @desc    Add item to roadmap
// @access  Public
router.post('/:id/items', addRoadmapItem);

// @route   PUT /api/roadmap/:id/items/:itemId
// @desc    Update roadmap item
// @access  Public
router.put('/:id/items/:itemId', updateRoadmapItem);

// @route   DELETE /api/roadmap/:id/items/:itemId
// @desc    Delete roadmap item
// @access  Public
router.delete('/:id/items/:itemId', deleteRoadmapItem);

// @route   POST /api/roadmap/:id/convert-to-tasks
// @desc    Convert roadmap items to tasks
// @access  Public
router.post('/:id/convert-to-tasks', convertToTasks);

// @route   GET /api/roadmap/:id/timeline
// @desc    Get roadmap timeline view
// @access  Public
router.get('/:id/timeline', getRoadmapTimeline);

// @route   GET /api/roadmap/project/:projectId/analytics
// @desc    Get roadmap analytics for a project
// @access  Public
router.get('/project/:projectId/analytics', getRoadmapAnalytics);

module.exports = router;
