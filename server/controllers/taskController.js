const Task = require('../models/Task');
const vertexAIService = require('../services/ai/vertexAIService');

class TaskController {
  // Get all tasks
  async getAllTasks(req, res) {
    try {
      const { status, category, priority, page = 1, limit = 20 } = req.query;
      
      const filter = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;

      const skip = (page - 1) * limit;
      
      const tasks = await Task.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Task.countDocuments(filter);

      res.json({
        success: true,
        data: tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tasks',
        error: error.message
      });
    }
  }

  // Get tasks by status
  async getTasksByStatus(req, res) {
    try {
      const { status } = req.params;
      
      if (!['backlog', 'planned', 'in_progress', 'review', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const tasks = await Task.getByStatus(status);
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Get tasks by status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tasks by status',
        error: error.message
      });
    }
  }

  // Get overdue tasks
  async getOverdueTasks(req, res) {
    try {
      const tasks = await Task.getOverdueTasks();
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Get overdue tasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve overdue tasks',
        error: error.message
      });
    }
  }

  // Create task
  async createTask(req, res) {
    try {
      const {
        title,
        description,
        type,
        priority,
        effort,
        timeline,
        assignee,
        dependencies,
        tags,
        category
      } = req.body;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: 'Title and description are required'
        });
      }

      const taskData = {
        title,
        description,
        type: type || 'feature',
        priority: priority || 'medium',
        effort: effort || 'medium',
        timeline: timeline || {},
        assignee: assignee || {},
        dependencies: dependencies || [],
        tags: tags || [],
        category: category || 'company_goal'
      };

      const task = new Task(taskData);
      await task.save();

      res.json({
        success: true,
        message: 'Task created successfully',
        data: task
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create task',
        error: error.message
      });
    }
  }

  // Create task with AI suggestions
  async createTaskWithAI(req, res) {
    try {
      const {
        title,
        description,
        type,
        priority,
        effort,
        timeline,
        assignee,
        dependencies,
        tags,
        category
      } = req.body;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: 'Title and description are required'
        });
      }

      // Get AI suggestions
      const Project = require('../models/Project');
      const Feedback = require('../models/Feedback');
      
      const [project, activeFeedback] = await Promise.all([
        Project.findOne().sort({ createdAt: -1 }),
        Feedback.getActiveFeedback()
      ]);

      const projectContext = project ? project.aiContext : '';
      
      let feedbackContext = 'No active customer feedback available.';
      if (activeFeedback.length > 0) {
        const feedbackSummaries = activeFeedback.slice(0, 10).map(f => 
          `${f.category.toUpperCase()}: ${f.content.substring(0, 100)}... (${f.priority} priority)`
        );
        feedbackContext = `Active Customer Feedback (${activeFeedback.length} items):\n${feedbackSummaries.join('\n')}`;
      }

      const aiResult = await vertexAIService.suggestTaskEnhancements(description, projectContext, feedbackContext);

      const taskData = {
        title,
        description: aiResult.success ? aiResult.suggestions.enhancedDescription : description,
        type: type || 'feature',
        priority: aiResult.success ? aiResult.suggestions.priority : (priority || 'medium'),
        effort: aiResult.success ? aiResult.suggestions.estimatedEffort : (effort || 'medium'),
        timeline: timeline || {},
        assignee: assignee || {},
        dependencies: dependencies || [],
        tags: aiResult.success ? aiResult.suggestions.suggestedTags : (tags || []),
        category: aiResult.success ? aiResult.suggestions.category : (category || 'company_goal'),
        aiSuggestions: aiResult.success ? {
          originalDescription: description,
          enhancedDescription: aiResult.suggestions.enhancedDescription,
          suggestedTags: aiResult.suggestions.suggestedTags,
          estimatedEffort: aiResult.suggestions.estimatedEffort,
          relatedFeedback: aiResult.suggestions.relatedFeedback,
          reasoning: aiResult.suggestions.reasoning
        } : {}
      };

      const task = new Task(taskData);
      await task.save();

      res.json({
        success: true,
        message: 'Task created successfully with AI suggestions',
        data: task,
        aiSuggestions: aiResult.success ? aiResult.suggestions : null
      });
    } catch (error) {
      console.error('Create task with AI error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create task with AI suggestions',
        error: error.message
      });
    }
  }

  // Update task
  async updateTask(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const task = await Task.findById(id);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Update allowed fields
      const allowedFields = [
        'title', 'description', 'type', 'priority', 'status', 'effort',
        'timeline', 'assignee', 'dependencies', 'tags', 'category'
      ];
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          task[field] = updateData[field];
        }
      });

      await task.save();

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: task
      });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task',
        error: error.message
      });
    }
  }

  // Update task status
  async updateTaskStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['backlog', 'planned', 'in_progress', 'review', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const task = await Task.findById(id);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      await task.updateStatus(status);

      res.json({
        success: true,
        message: 'Task status updated successfully',
        data: task
      });
    } catch (error) {
      console.error('Update task status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task status',
        error: error.message
      });
    }
  }

  // Add comment to task
  async addComment(req, res) {
    try {
      const { id } = req.params;
      const { author, content } = req.body;

      if (!author || !content) {
        return res.status(400).json({
          success: false,
          message: 'Author and content are required'
        });
      }

      const task = await Task.findById(id);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      await task.addComment(author, content);

      res.json({
        success: true,
        message: 'Comment added successfully',
        data: task
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment',
        error: error.message
      });
    }
  }

  // Delete task
  async deleteTask(req, res) {
    try {
      const { id } = req.params;

      const task = await Task.findById(id);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      await Task.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete task',
        error: error.message
      });
    }
  }

  // Get task statistics
  async getTaskStats(req, res) {
    try {
      let stats = [{ inProgress: 0, critical: 0 }], categoryStats = [], typeStats = [];
      try {
        stats = await Task.aggregate([
          { $group: {
            _id: null,
            inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
            critical: { $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] } }
          }}
        ]);
        categoryStats = await Task.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);
        typeStats = await Task.aggregate([
          { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);
      } catch (dbError) {
        console.error('Database connection error:', dbError);
        return res.json({
          success: true,
          data: {
            overview: { inProgress: 0, critical: 0 },
            categories: [],
            types: [],
            connectionIssue: true
          }
        });
      }
      if (!stats || stats.length === 0) {
        return res.json({
          success: true,
          data: {
            overview: { inProgress: 0, critical: 0 },
            categories: [],
            types: [],
            noData: true
          }
        });
      }
      res.json({
        success: true,
        data: {
          overview: stats[0] || {},
          categories: categoryStats,
          types: typeStats
        }
      });
    } catch (error) {
      console.error('Get task stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get task statistics',
        error: error.message
      });
    }
  }

  // Bulk update task status
  async bulkUpdateStatus(req, res) {
    try {
      const { taskIds, status } = req.body;

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Task IDs array is required'
        });
      }

      if (!['backlog', 'planned', 'in_progress', 'review', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const result = await Task.updateMany(
        { _id: { $in: taskIds } },
        { $set: { status } }
      );

      res.json({
        success: true,
        message: `Updated ${result.modifiedCount} tasks`,
        data: {
          modifiedCount: result.modifiedCount
        }
      });
    } catch (error) {
      console.error('Bulk update task status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update task status',
        error: error.message
      });
    }
  }
}

module.exports = new TaskController(); 