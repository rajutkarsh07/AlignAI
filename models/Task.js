const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  enhancedDescription: {
    type: String,
    maxlength: 3000
  },
  category: {
    type: String,
    enum: ['feature', 'bug-fix', 'improvement', 'research', 'maintenance', 'design', 'testing'],
    default: 'feature'
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['backlog', 'planned', 'in-progress', 'review', 'testing', 'completed', 'cancelled'],
    default: 'backlog'
  },
  estimatedEffort: {
    value: Number,
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months'],
      default: 'days'
    }
  },
  actualEffort: {
    value: Number,
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months'],
      default: 'days'
    }
  },
  assignedTo: {
    name: String,
    email: String,
    role: String
  },
  dependencies: [{
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    type: {
      type: String,
      enum: ['blocks', 'blocked-by', 'related'],
      default: 'related'
    }
  }],
  tags: [String],
  relatedFeedback: [{
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback'
    },
    feedbackItemId: String,
    relevanceScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 5
    }
  }],
  timeline: {
    plannedStartDate: Date,
    plannedEndDate: Date,
    actualStartDate: Date,
    actualEndDate: Date
  },
  businessValue: {
    customerImpact: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    revenueImpact: {
      type: String,
      enum: ['high', 'medium', 'low', 'none'],
      default: 'none'
    },
    strategicAlignment: {
      type: Number,
      min: 0,
      max: 10,
      default: 5
    }
  },
  aiSuggestions: {
    enhancementRecommendations: [String],
    riskAssessment: String,
    resourceRequirements: [String],
    successMetrics: [String]
  },
  acceptanceCriteria: [String],
  notes: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate task completion percentage
taskSchema.virtual('completionPercentage').get(function() {
  const statusWeights = {
    'backlog': 0,
    'planned': 10,
    'in-progress': 50,
    'review': 80,
    'testing': 90,
    'completed': 100,
    'cancelled': 0
  };
  return statusWeights[this.status] || 0;
});

// Get task urgency score based on priority and timeline
taskSchema.virtual('urgencyScore').get(function() {
  let score = 0;
  
  // Priority score
  const priorityScores = { 'critical': 10, 'high': 7, 'medium': 4, 'low': 1 };
  score += priorityScores[this.priority] || 0;
  
  // Timeline urgency
  if (this.timeline.plannedEndDate) {
    const daysUntilDeadline = Math.ceil((this.timeline.plannedEndDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDeadline <= 7) score += 5;
    else if (daysUntilDeadline <= 30) score += 3;
    else if (daysUntilDeadline <= 90) score += 1;
  }
  
  return Math.min(score, 15); // Cap at 15
});

// Indexes for better query performance
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ priority: 1, status: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ 'timeline.plannedEndDate': 1 });

module.exports = mongoose.model('Task', taskSchema);
