const express = require('express');
const {
  getProjectTasks,
  getTaskById,
  createTask,
  enhanceTask,
  updateTask,
  deleteTask,
  addDependency,
  removeDependency,
  getTaskAnalytics,
  getKanbanData,
  getAllTasks,
} = require('../controllers/taskController');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks across all projects
// @access  Public
router.get('/', getAllTasks);

// @route   GET /api/tasks/project/:projectId
// @desc    Get all tasks for a project
// @access  Public
router.get('/project/:projectId', getProjectTasks);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Public
router.get('/:id', getTaskById);

// @route   POST /api/tasks
// @desc    Create new task
// @access  Public
router.post('/', createTask);

// @route   POST /api/tasks/enhance
// @desc    Enhance task description using AI (doesn't create task)
// @access  Public
router.post('/enhance', enhanceTask);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Public
router.put('/:id', updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Public
router.delete('/:id', deleteTask);

// @route   POST /api/tasks/:id/dependencies
// @desc    Add dependency to task
// @access  Public
router.post('/:id/dependencies', addDependency);

// @route   DELETE /api/tasks/:id/dependencies/:dependencyId
// @desc    Remove dependency from task
// @access  Public
router.delete('/:id/dependencies/:dependencyId', removeDependency);

// @route   GET /api/tasks/project/:projectId/analytics
// @desc    Get task analytics for a project
// @access  Public
router.get('/project/:projectId/analytics', getTaskAnalytics);

// @route   GET /api/tasks/project/:projectId/kanban
// @desc    Get tasks organized by status (Kanban view)
// @access  Public
router.get('/project/:projectId/kanban', getKanbanData);

module.exports = router;
