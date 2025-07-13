const Roadmap = require('../models/Roadmap');
const Project = require('../models/Project');
const Task = require('../models/Task');
const agentService = require('../services/agentService');

// Get all roadmaps for a project
const getProjectRoadmaps = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      timeHorizon,
      isActive = true,
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
    const query = { projectId: req.params.projectId, isActive };
    if (type) query.type = type;
    if (timeHorizon) query.timeHorizon = timeHorizon;

    const roadmaps = await Roadmap.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('items.taskId', 'title status priority category')
      .populate('items.relatedFeedback.feedbackId', 'name');

    const total = await Roadmap.countDocuments(query);

    res.json({
      success: true,
      data: roadmaps,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roadmaps',
    });
  }
};

// Get roadmap by ID
const getRoadmapById = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id)
      .populate('projectId', 'name description')
      .populate(
        'items.taskId',
        'title status priority category estimatedEffort'
      )
      .populate('items.relatedFeedback.feedbackId', 'name description');

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap not found',
      });
    }

    res.json({
      success: true,
      data: roadmap,
    });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roadmap',
    });
  }
};

// Generate roadmap using AI
const generateRoadmap = async (req, res) => {
  try {
    const {
      projectId,
      name,
      description = '',
      type = 'balanced',
      timeHorizon = 'quarter',
      customAllocation,
      focusAreas = [],
      constraints = [],
    } = req.body;

    // Validate required fields
    if (!projectId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and name are required',
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
      // Determine allocation strategy
      let allocationStrategy;
      if (type === 'custom' && customAllocation) {
        allocationStrategy = customAllocation;
      } else {
        const strategies = {
          'strategic-only': {
            strategic: 70,
            customerDriven: 20,
            maintenance: 10,
          },
          'customer-only': {
            strategic: 20,
            customerDriven: 70,
            maintenance: 10,
          },
          balanced: { strategic: 60, customerDriven: 30, maintenance: 10 },
        };
        allocationStrategy = strategies[type] || strategies['balanced'];
      }

      // Generate comprehensive roadmap with AI
      const contextQuery = `Generate a detailed ${timeHorizon} roadmap for project "${project.name}": ${project.description}. 
      Roadmap Name: ${name}
      Description: ${description}
      Type: ${type}
      Allocation Strategy: ${allocationStrategy.strategic}% Strategic, ${allocationStrategy.customerDriven}% Customer-driven, ${allocationStrategy.maintenance}% Maintenance`;

      let roadmapData;
      try {
        roadmapData = await agentService.processQuery(
          'roadmap',
          contextQuery,
          projectId,
          {
            timeHorizon,
            allocationType: type,
            focusAreas,
            constraints,
            customAllocation: allocationStrategy,
          }
        );
      } catch (aiError) {
        console.warn(
          'AI roadmap generation failed, creating structured fallback:',
          aiError
        );
        // Create a comprehensive fallback roadmap
        roadmapData = generateFallbackRoadmap({
          name,
          description,
          type,
          timeHorizon,
          allocationStrategy,
          project,
        });
      }

      // Normalize and validate roadmap data
      const normalizedItems = (roadmapData.items || []).map((item) => {
        // Normalize time unit (AI sometimes generates singular forms)
        if (item.timeframe && item.timeframe.estimatedDuration) {
          const unit = item.timeframe.estimatedDuration.unit;
          if (unit === 'day') item.timeframe.estimatedDuration.unit = 'days';
          if (unit === 'week') item.timeframe.estimatedDuration.unit = 'weeks';
          if (unit === 'month')
            item.timeframe.estimatedDuration.unit = 'months';
        }

        // Ensure all required fields have valid values
        return {
          ...item,
          category: [
            'strategic',
            'customer-driven',
            'maintenance',
            'innovation',
          ].includes(item.category)
            ? item.category
            : 'strategic',
          priority: ['critical', 'high', 'medium', 'low'].includes(
            item.priority
          )
            ? item.priority
            : 'medium',
          businessJustification: {
            ...item.businessJustification,
            riskLevel: ['low', 'medium', 'high'].includes(
              item.businessJustification?.riskLevel
            )
              ? item.businessJustification.riskLevel
              : 'medium',
          },
          status: [
            'proposed',
            'approved',
            'in-progress',
            'completed',
            'cancelled',
          ].includes(item.status)
            ? item.status
            : 'proposed',
        };
      });

      // Create roadmap document
      const roadmap = new Roadmap({
        projectId,
        name: roadmapData.name || name,
        description: roadmapData.description || description,
        type: roadmapData.type || type,
        timeHorizon: roadmapData.timeHorizon || timeHorizon,
        allocationStrategy:
          roadmapData.allocationStrategy || allocationStrategy,
        items: normalizedItems,
        generationContext: {
          userQuery: contextQuery,
          aiModel: 'gemini-2.0-flash-exp',
          parameters: {
            focusAreas,
            constraints,
            timeHorizon,
            allocationType: type,
          },
        },
      });

      const savedRoadmap = await roadmap.save();

      // Emit real-time update via Socket.io (optional)
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(projectId).emit('roadmap-generated', {
            roadmapId: savedRoadmap._id,
            name: savedRoadmap.name,
          });
        }
      } catch (socketError) {
        console.warn('Socket.io not available:', socketError);
      }

      res.status(201).json({
        success: true,
        data: savedRoadmap,
        rationale:
          roadmapData.rationale ||
          'Roadmap generated successfully with balanced allocation strategy',
        message: 'Roadmap generated successfully',
      });
    } catch (aiError) {
      console.error('AI roadmap generation error:', aiError);
      res.status(500).json({
        success: false,
        error: 'Failed to generate roadmap with AI',
        details: aiError.message,
      });
    }
  } catch (error) {
    console.error('Error generating roadmap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate roadmap',
    });
  }
};

// Create roadmap manually
const createRoadmap = async (req, res) => {
  try {
    const {
      projectId,
      name,
      description,
      type = 'custom',
      timeHorizon = 'quarter',
      allocationStrategy,
      items = [],
    } = req.body;

    // Validate required fields
    if (!projectId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and name are required',
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

    // Validate allocation strategy if provided
    if (allocationStrategy) {
      const total =
        allocationStrategy.strategic +
        allocationStrategy.customerDriven +
        allocationStrategy.maintenance;
      if (Math.abs(total - 100) > 0.01) {
        return res.status(400).json({
          success: false,
          error: 'Allocation strategy must total 100%',
        });
      }
    }

    const roadmap = new Roadmap({
      projectId,
      name,
      description,
      type,
      timeHorizon,
      allocationStrategy: allocationStrategy || {
        strategic: 60,
        customerDriven: 30,
        maintenance: 10,
      },
      items,
    });

    const savedRoadmap = await roadmap.save();

    res.status(201).json({
      success: true,
      data: savedRoadmap,
      message: 'Roadmap created successfully',
    });
  } catch (error) {
    console.error('Error creating roadmap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create roadmap',
    });
  }
};

// Update roadmap
const updateRoadmap = async (req, res) => {
  try {
    const { name, description, type, timeHorizon, allocationStrategy, items } =
      req.body;

    const roadmap = await Roadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap not found',
      });
    }

    // Update fields
    if (name) roadmap.name = name;
    if (description) roadmap.description = description;
    if (type) roadmap.type = type;
    if (timeHorizon) roadmap.timeHorizon = timeHorizon;
    if (allocationStrategy) {
      // Validate allocation strategy
      const total =
        allocationStrategy.strategic +
        allocationStrategy.customerDriven +
        allocationStrategy.maintenance;
      if (Math.abs(total - 100) > 0.01) {
        return res.status(400).json({
          success: false,
          error: 'Allocation strategy must total 100%',
        });
      }
      roadmap.allocationStrategy = allocationStrategy;
    }
    if (items) roadmap.items = items;

    roadmap.version += 1;
    const updatedRoadmap = await roadmap.save();

    res.json({
      success: true,
      data: updatedRoadmap,
      message: 'Roadmap updated successfully',
    });
  } catch (error) {
    console.error('Error updating roadmap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update roadmap',
    });
  }
};

// Delete roadmap (soft delete)
const deleteRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap not found',
      });
    }

    roadmap.isActive = false;
    await roadmap.save();

    res.json({
      success: true,
      message: 'Roadmap deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete roadmap',
    });
  }
};

// Add item to roadmap
const addRoadmapItem = async (req, res) => {
  try {
    const {
      title,
      description,
      category = 'strategic',
      priority = 'medium',
      timeframe,
      resourceAllocation,
      businessJustification,
      successMetrics = [],
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required for roadmap items',
      });
    }

    const roadmap = await Roadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap not found',
      });
    }

    roadmap.items.push({
      title,
      description,
      category,
      priority,
      timeframe,
      resourceAllocation,
      businessJustification,
      successMetrics,
    });

    const updatedRoadmap = await roadmap.save();

    res.json({
      success: true,
      data: updatedRoadmap,
      message: 'Roadmap item added successfully',
    });
  } catch (error) {
    console.error('Error adding roadmap item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add roadmap item',
    });
  }
};

// Update roadmap item
const updateRoadmapItem = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap not found',
      });
    }

    const item = roadmap.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap item not found',
      });
    }

    // Update item fields
    Object.assign(item, req.body);

    const updatedRoadmap = await roadmap.save();

    res.json({
      success: true,
      data: updatedRoadmap,
      message: 'Roadmap item updated successfully',
    });
  } catch (error) {
    console.error('Error updating roadmap item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update roadmap item',
    });
  }
};

// Delete roadmap item
const deleteRoadmapItem = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap not found',
      });
    }

    roadmap.items.id(req.params.itemId).remove();
    const updatedRoadmap = await roadmap.save();

    res.json({
      success: true,
      data: updatedRoadmap,
      message: 'Roadmap item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting roadmap item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete roadmap item',
    });
  }
};

// Convert roadmap items to tasks
const convertToTasks = async (req, res) => {
  try {
    const { itemIds = [] } = req.body;

    const roadmap = await Roadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap not found',
      });
    }

    const convertedTasks = [];
    const itemsToConvert =
      itemIds.length > 0
        ? roadmap.items.filter((item) => itemIds.includes(item._id.toString()))
        : roadmap.items;

    for (const item of itemsToConvert) {
      // Skip if already linked to a task
      if (item.taskId) continue;

      const task = new Task({
        projectId: roadmap.projectId,
        title: item.title,
        description: item.description,
        category: mapRoadmapCategoryToTask(item.category),
        priority: item.priority,
        estimatedEffort: item.timeframe.estimatedDuration,
        timeline: {
          plannedStartDate: item.timeframe.startDate,
          plannedEndDate: item.timeframe.endDate,
        },
        businessValue: {
          customerImpact: scoreToLevel(
            item.businessJustification.customerImpact
          ),
          revenueImpact: scoreToLevel(item.businessJustification.revenueImpact),
          strategicAlignment: item.businessJustification.strategicAlignment,
        },
        acceptanceCriteria: item.successMetrics,
        tags: [item.category, 'roadmap-generated'],
      });

      const savedTask = await task.save();

      // Link the task to the roadmap item
      item.taskId = savedTask._id;

      convertedTasks.push(savedTask);
    }

    await roadmap.save();

    res.json({
      success: true,
      data: {
        roadmap,
        convertedTasks,
      },
      message: `${convertedTasks.length} tasks created from roadmap items`,
    });
  } catch (error) {
    console.error('Error converting roadmap to tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert roadmap items to tasks',
    });
  }
};

// Get roadmap timeline view
const getRoadmapTimeline = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id).populate(
      'items.taskId',
      'title status priority completionPercentage'
    );

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        error: 'Roadmap not found',
      });
    }

    // Group items by quarter/timeframe
    const timeline = roadmap.timeline;

    // Add progress information
    const timelineWithProgress = {};
    Object.keys(timeline).forEach((period) => {
      timelineWithProgress[period] = {
        items: timeline[period],
        summary: {
          totalItems: timeline[period].length,
          completedItems: timeline[period].filter(
            (item) => item.status === 'completed'
          ).length,
          inProgressItems: timeline[period].filter(
            (item) => item.status === 'in-progress'
          ).length,
          proposedItems: timeline[period].filter(
            (item) => item.status === 'proposed'
          ).length,
        },
      };
    });

    res.json({
      success: true,
      data: {
        roadmap,
        timeline: timelineWithProgress,
        analytics: roadmap.analytics,
      },
    });
  } catch (error) {
    console.error('Error fetching roadmap timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roadmap timeline',
    });
  }
};

// Get roadmap analytics for a project
const getRoadmapAnalytics = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({
      projectId: req.params.projectId,
      isActive: true,
    });

    const analytics = calculateRoadmapAnalytics(roadmaps);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error calculating roadmap analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate roadmap analytics',
    });
  }
};

// Helper method to map roadmap category to task category
const mapRoadmapCategoryToTask = (roadmapCategory) => {
  const mapping = {
    strategic: 'feature',
    'customer-driven': 'improvement',
    maintenance: 'maintenance',
    innovation: 'research',
  };
  return mapping[roadmapCategory] || 'feature';
};

// Helper method to convert score to level
const scoreToLevel = (score) => {
  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
};

// Helper method to generate fallback roadmap
const generateFallbackRoadmap = ({
  name,
  description,
  type,
  timeHorizon,
  allocationStrategy,
  project,
}) => {
  const quarters =
    timeHorizon === 'year'
      ? ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024']
      : timeHorizon === 'half-year'
      ? ['Q1 2024', 'Q2 2024']
      : ['Q1 2024'];

  const categories = ['strategic', 'customer-driven', 'maintenance'];
  const priorities = ['high', 'medium', 'low'];

  const fallbackItems = [];

  // Generate strategic items based on allocation
  const strategicCount = Math.ceil(allocationStrategy.strategic / 20); // 1 item per 20%
  for (let i = 0; i < strategicCount; i++) {
    fallbackItems.push({
      title: `Strategic Initiative ${i + 1}`,
      description: `Key strategic objective to advance ${project.name} goals and market position`,
      category: 'strategic',
      priority: priorities[i % priorities.length],
      timeframe: {
        quarter: quarters[i % quarters.length],
        estimatedDuration: { value: 6, unit: 'weeks' },
      },
      resourceAllocation: {
        percentage: 15,
        teamMembers: 3,
        estimatedCost: 50000,
      },
      businessJustification: {
        strategicAlignment: 9,
        customerImpact: 7,
        revenueImpact: 8,
        riskLevel: 'medium',
      },
      successMetrics: [
        'Achieve target KPIs',
        'Positive stakeholder feedback',
        'On-time delivery',
      ],
      status: 'proposed',
    });
  }

  // Generate customer-driven items
  const customerCount = Math.ceil(allocationStrategy.customerDriven / 15); // 1 item per 15%
  for (let i = 0; i < customerCount; i++) {
    fallbackItems.push({
      title: `Customer Feature ${i + 1}`,
      description: `Feature requested by customers to improve user experience and satisfaction`,
      category: 'customer-driven',
      priority: priorities[i % priorities.length],
      timeframe: {
        quarter: quarters[i % quarters.length],
        estimatedDuration: { value: 4, unit: 'weeks' },
      },
      resourceAllocation: {
        percentage: 10,
        teamMembers: 2,
        estimatedCost: 30000,
      },
      businessJustification: {
        strategicAlignment: 7,
        customerImpact: 9,
        revenueImpact: 6,
        riskLevel: 'low',
      },
      successMetrics: [
        'User adoption > 70%',
        'Customer satisfaction improvement',
        'Reduced support tickets',
      ],
      status: 'proposed',
    });
  }

  // Generate maintenance items
  const maintenanceCount = Math.ceil(allocationStrategy.maintenance / 10); // 1 item per 10%
  for (let i = 0; i < maintenanceCount; i++) {
    fallbackItems.push({
      title: `System Maintenance ${i + 1}`,
      description: `Critical maintenance and technical debt resolution to ensure system stability`,
      category: 'maintenance',
      priority: i === 0 ? 'high' : 'medium',
      timeframe: {
        quarter: quarters[i % quarters.length],
        estimatedDuration: { value: 2, unit: 'weeks' },
      },
      resourceAllocation: {
        percentage: 5,
        teamMembers: 1,
        estimatedCost: 15000,
      },
      businessJustification: {
        strategicAlignment: 5,
        customerImpact: 6,
        revenueImpact: 4,
        riskLevel: 'low',
      },
      successMetrics: [
        'System performance improved',
        'Technical debt reduced',
        'Zero critical bugs',
      ],
      status: 'proposed',
    });
  }

  return {
    name,
    description:
      description || `Comprehensive ${type} roadmap for ${project.name}`,
    type,
    timeHorizon,
    allocationStrategy,
    items: fallbackItems,
    rationale: `Generated ${type} roadmap with ${fallbackItems.length} items across ${quarters.length} quarters, following ${allocationStrategy.strategic}% strategic, ${allocationStrategy.customerDriven}% customer-driven, and ${allocationStrategy.maintenance}% maintenance allocation.`,
  };
};

// Helper method to calculate roadmap analytics
const calculateRoadmapAnalytics = (roadmaps) => {
  const analytics = {
    totalRoadmaps: roadmaps.length,
    byType: {},
    byTimeHorizon: {},
    averageCompletionRate: 0,
    averageRiskScore: 0,
    averageCustomerSatisfactionPotential: 0,
    allocationTrends: {
      strategic: 0,
      customerDriven: 0,
      maintenance: 0,
    },
  };

  if (roadmaps.length === 0) return analytics;

  roadmaps.forEach((roadmap) => {
    // Count by type
    analytics.byType[roadmap.type] = (analytics.byType[roadmap.type] || 0) + 1;

    // Count by time horizon
    analytics.byTimeHorizon[roadmap.timeHorizon] =
      (analytics.byTimeHorizon[roadmap.timeHorizon] || 0) + 1;

    // Aggregate metrics
    analytics.averageCompletionRate += roadmap.analytics.completionRate;
    analytics.averageRiskScore += roadmap.analytics.riskScore;
    analytics.averageCustomerSatisfactionPotential +=
      roadmap.analytics.customerSatisfactionPotential;

    // Allocation trends
    analytics.allocationTrends.strategic +=
      roadmap.allocationStrategy.strategic;
    analytics.allocationTrends.customerDriven +=
      roadmap.allocationStrategy.customerDriven;
    analytics.allocationTrends.maintenance +=
      roadmap.allocationStrategy.maintenance;
  });

  // Calculate averages
  analytics.averageCompletionRate /= roadmaps.length;
  analytics.averageRiskScore /= roadmaps.length;
  analytics.averageCustomerSatisfactionPotential /= roadmaps.length;

  analytics.allocationTrends.strategic /= roadmaps.length;
  analytics.allocationTrends.customerDriven /= roadmaps.length;
  analytics.allocationTrends.maintenance /= roadmaps.length;

  return analytics;
};

module.exports = {
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
};
