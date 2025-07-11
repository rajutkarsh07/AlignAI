const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Get all tasks with pagination and filters
router.get('/', taskController.getAllTasks);

// Get tasks by status
router.get('/status/:status', taskController.getTasksByStatus);

// Get overdue tasks
router.get('/overdue', taskController.getOverdueTasks);

// Get task statistics
router.get('/stats', taskController.getTaskStats);

// Create task
router.post('/', taskController.createTask);

// Create task with AI suggestions
router.post('/with-ai', taskController.createTaskWithAI);

// Bulk update task status
router.put('/bulk-status', taskController.bulkUpdateStatus);

// Update task status
router.put('/:id/status', taskController.updateTaskStatus);

// Add comment to task
router.post('/:id/comments', taskController.addComment);

// Update task
router.put('/:id', taskController.updateTask);

// Delete task
router.delete('/:id', taskController.deleteTask);

module.exports = router; 