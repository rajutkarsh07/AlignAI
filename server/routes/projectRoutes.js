const express = require('express');
const {
  upload,
  getProjects,
  getProjectById,
  createProject,
  createProjectFromUpload,
  updateProject,
  deleteProject,
  addGoal,
  updateGoal,
  deleteGoal,
} = require('../controllers/projectController');

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects
// @access  Public
router.get('/', getProjects);

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Public
router.get('/:id', getProjectById);

// @route   POST /api/projects
// @desc    Create new project
// @access  Public
router.post('/', createProject);

// @route   POST /api/projects/upload
// @desc    Create project from uploaded document
// @access  Public
router.post('/upload', upload.single('document'), createProjectFromUpload);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Public
router.put('/:id', updateProject);

// @route   DELETE /api/projects/:id
// @desc    Delete project (soft delete)
// @access  Public
router.delete('/:id', deleteProject);

// @route   POST /api/projects/:id/goals
// @desc    Add goal to project
// @access  Public
router.post('/:id/goals', addGoal);

// @route   PUT /api/projects/:id/goals/:goalId
// @desc    Update project goal
// @access  Public
router.put('/:id/goals/:goalId', updateGoal);

// @route   DELETE /api/projects/:id/goals/:goalId
// @desc    Delete project goal
// @access  Public
router.delete('/:id/goals/:goalId', deleteGoal);

module.exports = router;
