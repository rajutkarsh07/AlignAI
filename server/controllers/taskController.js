const Task = require('../models/Task');
const Project = require('../models/Project');
const agentService = require('../services/agentService');

// Get all tasks for a project
const getProjectTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Verify project exists
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Build query
    const query = { projectId: req.params.projectId };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query['assignedTo.email'] = assignedTo;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const tasks = await Task.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('dependencies.taskId', 'title status priority')
      .populate('relatedFeedback.feedbackId', 'name');

    const total = await Task.countDocuments(query);

    // Calculate summary statistics
    const summary = await calculateTaskSummary(req.params.projectId);

    res.json({
      success: true,
      data: {
        tasks,
        summary,
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
    });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('projectId', 'name description')
      .populate('dependencies.taskId', 'title status priority')
      .populate('relatedFeedback.feedbackId', 'name description');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
    });
  }
};

// Create new task
const createTask = async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      category,
      priority,
      estimatedEffort,
      assignedTo,
      timeline,
      businessValue,
      acceptanceCriteria,
      tags,
    } = req.body;

    // Validate required fields
    if (!projectId || !title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, title, and description are required',
      });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const task = new Task({
      projectId,
      title,
      description,
      category: category || 'feature',
      priority: priority || 'medium',
      estimatedEffort,
      assignedTo,
      timeline,
      businessValue,
      acceptanceCriteria: acceptanceCriteria || [],
      tags: tags || [],
    });

    const savedTask = await task.save();

    res.status(201).json({
      success: true,
      data: savedTask,
      message: 'Task created successfully',
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
    });
  }
};

// Enhance task description using AI
const enhanceTask = async (req, res) => {
  try {
    const { projectId, title, description } = req.body;

    // Validate required fields
    if (!projectId || !title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, title, and description are required',
      });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    try {
      // Use AI agent to enhance the task
      const enhancement = await agentService.processQuery(
        'taskEnhancer',
        `Enhance this task for project "${project.name}": ${project.description}\n\nTask Title: ${title}\nDescription: ${description}`,
        projectId,
        { title, description }
      );

      // Return enhancement suggestions (don't create task yet)
      res.json({
        success: true,
        data: {
          enhancedDescription: enhancement.enhancedDescription || description,
          priority: enhancement.priority || 'medium',
          category: enhancement.category || 'feature',
          acceptanceCriteria: enhancement.acceptanceCriteria || [],
          estimatedEffort: enhancement.estimatedEffort || {
            value: 1,
            unit: 'weeks',
          },
          businessValue: enhancement.businessValue || {
            customerImpact: 'medium',
            revenueImpact: 'low',
            strategicAlignment: 5,
          },
          aiSuggestions: enhancement.aiSuggestions || {
            enhancementRecommendations: [
              'Consider user experience impact',
              'Plan for testing phase',
            ],
            riskAssessment: 'Medium risk - standard development task',
            resourceRequirements: ['Developer time', 'QA testing'],
            successMetrics: ['Feature completion', 'User acceptance'],
          },
          tags: enhancement.tags || [],
        },
        message: 'Task enhanced successfully',
      });
    } catch (aiError) {
      console.warn(
        'AI enhancement failed, providing structured fallback:',
        aiError
      );

      // Provide intelligent fallback based on task content
      const fallbackEnhancement = generateTaskFallback(title, description);

      res.json({
        success: true,
        data: fallbackEnhancement,
        message: 'Task enhanced with fallback suggestions',
      });
    }
  } catch (error) {
    console.error('Error enhancing task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enhance task',
    });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    // Update task fields
    const allowedUpdates = [
      'title',
      'description',
      'enhancedDescription',
      'category',
      'priority',
      'status',
      'estimatedEffort',
      'actualEffort',
      'assignedTo',
      'dependencies',
      'tags',
      'timeline',
      'businessValue',
      'acceptanceCriteria',
      'notes',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    // Update actual dates based on status changes
    if (req.body.status) {
      if (req.body.status === 'in-progress' && !task.timeline.actualStartDate) {
        task.timeline.actualStartDate = new Date();
      } else if (
        ['completed', 'cancelled'].includes(req.body.status) &&
        !task.timeline.actualEndDate
      ) {
        task.timeline.actualEndDate = new Date();
      }
    }

    const updatedTask = await task.save();

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully',
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
    });
  }
};

// Add dependency to task
const addDependency = async (req, res) => {
  try {
    const { taskId, type } = req.body;

    if (!taskId || !type) {
      return res.status(400).json({
        success: false,
        error: 'Task ID and dependency type are required',
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    // Verify dependent task exists
    const dependentTask = await Task.findById(taskId);
    if (!dependentTask) {
      return res.status(404).json({
        success: false,
        error: 'Dependent task not found',
      });
    }

    // Check if dependency already exists
    const existingDependency = task.dependencies.find(
      (dep) => dep.taskId.toString() === taskId
    );

    if (existingDependency) {
      return res.status(400).json({
        success: false,
        error: 'Dependency already exists',
      });
    }

    task.dependencies.push({ taskId, type });
    const updatedTask = await task.save();

    res.json({
      success: true,
      data: updatedTask,
      message: 'Dependency added successfully',
    });
  } catch (error) {
    console.error('Error adding dependency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add dependency',
    });
  }
};

// Remove dependency from task
const removeDependency = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    task.dependencies.id(req.params.dependencyId).remove();
    const updatedTask = await task.save();

    res.json({
      success: true,
      data: updatedTask,
      message: 'Dependency removed successfully',
    });
  } catch (error) {
    console.error('Error removing dependency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove dependency',
    });
  }
};

// Get task analytics for a project
const getTaskAnalytics = async (req, res) => {
  try {
    const analytics = await calculateTaskAnalytics(req.params.projectId);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error calculating task analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate task analytics',
    });
  }
};

// Get tasks organized by status (Kanban view)
const getKanbanData = async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assignedTo')
      .sort({ priority: -1, createdAt: -1 });

    const kanbanBoard = {
      backlog: tasks.filter((task) => task.status === 'backlog'),
      planned: tasks.filter((task) => task.status === 'planned'),
      'in-progress': tasks.filter((task) => task.status === 'in-progress'),
      review: tasks.filter((task) => task.status === 'review'),
      testing: tasks.filter((task) => task.status === 'testing'),
      completed: tasks.filter((task) => task.status === 'completed'),
      cancelled: tasks.filter((task) => task.status === 'cancelled'),
    };

    res.json({
      success: true,
      data: kanbanBoard,
    });
  } catch (error) {
    console.error('Error fetching kanban data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch kanban data',
    });
  }
};

// Helper method to calculate task summary
const calculateTaskSummary = async (projectId) => {
  try {
    const tasks = await Task.find({ projectId });

    const summary = {
      total: tasks.length,
      byStatus: {},
      byPriority: {},
      byCategory: {},
      completionRate: 0,
      averageUrgencyScore: 0,
      overdueTasks: 0,
      totalEstimatedEffort: 0,
      totalActualEffort: 0,
    };

    // Initialize counters
    const statuses = [
      'backlog',
      'planned',
      'in-progress',
      'review',
      'testing',
      'completed',
      'cancelled',
    ];
    const priorities = ['critical', 'high', 'medium', 'low'];
    const categories = [
      'feature',
      'bug-fix',
      'improvement',
      'research',
      'maintenance',
      'design',
      'testing',
    ];

    statuses.forEach((status) => (summary.byStatus[status] = 0));
    priorities.forEach((priority) => (summary.byPriority[priority] = 0));
    categories.forEach((category) => (summary.byCategory[category] = 0));

    let totalUrgencyScore = 0;
    let totalEffortValue = 0;
    let totalActualEffortValue = 0;

    tasks.forEach((task) => {
      // Count by status
      summary.byStatus[task.status]++;

      // Count by priority
      summary.byPriority[task.priority]++;

      // Count by category
      summary.byCategory[task.category]++;

      // Calculate urgency score
      totalUrgencyScore += task.urgencyScore || 0;

      // Check if overdue
      if (
        task.timeline.plannedEndDate &&
        task.timeline.plannedEndDate < new Date() &&
        task.status !== 'completed'
      ) {
        summary.overdueTasks++;
      }

      // Sum effort
      if (task.estimatedEffort && task.estimatedEffort.value) {
        totalEffortValue += task.estimatedEffort.value;
      }

      if (task.actualEffort && task.actualEffort.value) {
        totalActualEffortValue += task.actualEffort.value;
      }
    });

    // Calculate completion rate
    summary.completionRate =
      tasks.length > 0 ? (summary.byStatus.completed / tasks.length) * 100 : 0;

    // Calculate average urgency score
    summary.averageUrgencyScore =
      tasks.length > 0 ? totalUrgencyScore / tasks.length : 0;

    summary.totalEstimatedEffort = totalEffortValue;
    summary.totalActualEffort = totalActualEffortValue;

    return summary;
  } catch (error) {
    console.error('Error calculating task summary:', error);
    return {};
  }
};

// Helper method to calculate detailed task analytics
const calculateTaskAnalytics = async (projectId) => {
  try {
    const summary = await calculateTaskSummary(projectId);
    const tasks = await Task.find({ projectId });

    return {
      summary,
      productivity: {
        velocityTrend: calculateVelocityTrend(tasks),
        burndownData: calculateBurndownData(tasks),
        effortAccuracy: calculateEffortAccuracy(tasks),
      },
      quality: {
        defectRate: calculateDefectRate(tasks),
        reworkRate: calculateReworkRate(tasks),
        testCoverage: calculateTestCoverage(tasks),
      },
      timeline: {
        onTimeDelivery: calculateOnTimeDelivery(tasks),
        averageCycleTime: calculateAverageCycleTime(tasks),
        bottlenecks: identifyBottlenecks(tasks),
      },
    };
  } catch (error) {
    console.error('Error calculating detailed analytics:', error);
    return {};
  }
};

// Helper method to generate task fallback enhancement
const generateTaskFallback = (title, description) => {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();

  // Determine category based on keywords
  let category = 'feature';
  if (
    titleLower.includes('bug') ||
    titleLower.includes('fix') ||
    titleLower.includes('error')
  ) {
    category = 'bug-fix';
  } else if (
    titleLower.includes('improve') ||
    titleLower.includes('enhance') ||
    titleLower.includes('optimize')
  ) {
    category = 'improvement';
  } else if (
    titleLower.includes('research') ||
    titleLower.includes('investigate') ||
    titleLower.includes('explore')
  ) {
    category = 'research';
  } else if (
    titleLower.includes('maintain') ||
    titleLower.includes('update') ||
    titleLower.includes('upgrade')
  ) {
    category = 'maintenance';
  } else if (
    titleLower.includes('design') ||
    titleLower.includes('ui') ||
    titleLower.includes('ux')
  ) {
    category = 'design';
  } else if (titleLower.includes('test') || titleLower.includes('qa')) {
    category = 'testing';
  }

  // Determine priority based on urgency keywords
  let priority = 'medium';
  if (
    titleLower.includes('critical') ||
    titleLower.includes('urgent') ||
    titleLower.includes('immediate')
  ) {
    priority = 'critical';
  } else if (
    titleLower.includes('high') ||
    titleLower.includes('important') ||
    titleLower.includes('priority')
  ) {
    priority = 'high';
  } else if (
    titleLower.includes('low') ||
    titleLower.includes('minor') ||
    titleLower.includes('nice')
  ) {
    priority = 'low';
  }

  // Generate estimated effort based on complexity indicators
  let effortValue = 1;
  let effortUnit = 'weeks';

  if (
    descLower.includes('complex') ||
    descLower.includes('major') ||
    descLower.includes('significant')
  ) {
    effortValue = 3;
  } else if (
    descLower.includes('simple') ||
    descLower.includes('minor') ||
    descLower.includes('quick')
  ) {
    effortValue = 1;
    effortUnit = 'days';
  } else if (descLower.includes('medium') || descLower.includes('moderate')) {
    effortValue = 2;
  }

  // Generate acceptance criteria based on task type
  const acceptanceCriteria = [];
  if (category === 'feature') {
    acceptanceCriteria.push('Feature functionality works as expected');
    acceptanceCriteria.push('User interface is intuitive and responsive');
    acceptanceCriteria.push('Integration with existing systems successful');
  } else if (category === 'bug-fix') {
    acceptanceCriteria.push('Bug is completely resolved');
    acceptanceCriteria.push('No regression in existing functionality');
    acceptanceCriteria.push('Fix is tested across different scenarios');
  } else if (category === 'improvement') {
    acceptanceCriteria.push('Performance improvement is measurable');
    acceptanceCriteria.push('User experience is enhanced');
    acceptanceCriteria.push('Change is backward compatible');
  } else {
    acceptanceCriteria.push('Task objectives are fully met');
    acceptanceCriteria.push('Quality standards are maintained');
    acceptanceCriteria.push('Documentation is updated if needed');
  }

  return {
    enhancedDescription:
      description +
      '\n\n**Additional Considerations:**\n- Ensure compatibility with existing systems\n- Plan for proper testing and validation\n- Consider user impact and training needs',
    priority,
    category,
    acceptanceCriteria,
    estimatedEffort: { value: effortValue, unit: effortUnit },
    businessValue: {
      customerImpact:
        priority === 'critical'
          ? 'high'
          : priority === 'high'
          ? 'medium'
          : 'low',
      revenueImpact: category === 'feature' ? 'medium' : 'low',
      strategicAlignment:
        priority === 'critical' ? 9 : priority === 'high' ? 7 : 5,
    },
    aiSuggestions: {
      enhancementRecommendations: [
        'Consider breaking down into smaller sub-tasks if complex',
        'Plan for proper testing and quality assurance',
        'Document any architectural decisions',
        'Ensure stakeholder alignment before starting',
      ],
      riskAssessment:
        priority === 'critical'
          ? 'High risk - requires careful planning'
          : priority === 'high'
          ? 'Medium risk - standard precautions needed'
          : 'Low risk - routine development task',
      resourceRequirements: [
        category === 'design' ? 'Design expertise' : 'Development time',
        'Testing and QA support',
        category === 'research'
          ? 'Research and analysis time'
          : 'Implementation resources',
      ],
      successMetrics: [
        'Task completion within estimated timeframe',
        'Quality gates passed successfully',
        'Stakeholder acceptance achieved',
      ],
    },
    tags: [category, priority, 'ai-enhanced'],
  };
};

// Placeholder methods for analytics calculations
const calculateVelocityTrend = (tasks) => {
  return [];
};

const calculateBurndownData = (tasks) => {
  return [];
};

const calculateEffortAccuracy = (tasks) => {
  return 0;
};

const calculateDefectRate = (tasks) => {
  return 0;
};

const calculateReworkRate = (tasks) => {
  return 0;
};

const calculateTestCoverage = (tasks) => {
  return 0;
};

const calculateOnTimeDelivery = (tasks) => {
  return 0;
};

const calculateAverageCycleTime = (tasks) => {
  return 0;
};

const identifyBottlenecks = (tasks) => {
  return [];
};

module.exports = {
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
};
