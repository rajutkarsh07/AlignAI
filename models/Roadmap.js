const mongoose = require('mongoose');

const roadmapItemSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['strategic', 'customer-driven', 'maintenance', 'innovation'],
    default: 'strategic'
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  timeframe: {
    quarter: String,
    startDate: Date,
    endDate: Date,
    estimatedDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months'],
        default: 'weeks'
      }
    }
  },
  resourceAllocation: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    teamMembers: Number,
    estimatedCost: Number
  },
  dependencies: [String],
  relatedFeedback: [{
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback'
    },
    relevanceScore: Number,
    customerQuotes: [String]
  }],
  businessJustification: {
    strategicAlignment: Number,
    customerImpact: Number,
    revenueImpact: Number,
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  successMetrics: [String],
  status: {
    type: String,
    enum: ['proposed', 'approved', 'in-progress', 'completed', 'cancelled'],
    default: 'proposed'
  }
});

const roadmapSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['strategic-only', 'customer-only', 'balanced', 'custom'],
    default: 'balanced'
  },
  timeHorizon: {
    type: String,
    enum: ['quarter', 'half-year', 'year', 'multi-year'],
    default: 'quarter'
  },
  allocationStrategy: {
    strategic: {
      type: Number,
      min: 0,
      max: 100,
      default: 60
    },
    customerDriven: {
      type: Number,
      min: 0,
      max: 100,
      default: 30
    },
    maintenance: {
      type: Number,
      min: 0,
      max: 100,
      default: 10
    }
  },
  items: [roadmapItemSchema],
  generationContext: {
    userQuery: String,
    aiModel: String,
    generationTime: {
      type: Date,
      default: Date.now
    },
    parameters: {
      focusAreas: [String],
      constraints: [String],
      priorities: [String]
    }
  },
  analytics: {
    totalItems: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 5
    },
    customerSatisfactionPotential: {
      type: Number,
      min: 0,
      max: 10,
      default: 5
    }
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field and recalculate analytics before saving
roadmapSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.calculateAnalytics();
  next();
});

// Method to calculate roadmap analytics
roadmapSchema.methods.calculateAnalytics = function() {
  this.analytics.totalItems = this.items.length;
  
  if (this.items.length > 0) {
    // Calculate completion rate
    const completedItems = this.items.filter(item => item.status === 'completed').length;
    this.analytics.completionRate = (completedItems / this.items.length) * 100;
    
    // Calculate risk score (average of all item risk levels)
    const riskScores = { 'low': 2, 'medium': 5, 'high': 8 };
    const avgRisk = this.items.reduce((sum, item) => sum + riskScores[item.businessJustification.riskLevel], 0) / this.items.length;
    this.analytics.riskScore = Math.round(avgRisk);
    
    // Calculate customer satisfaction potential (average of customer impact scores)
    const avgCustomerImpact = this.items.reduce((sum, item) => sum + (item.businessJustification.customerImpact || 5), 0) / this.items.length;
    this.analytics.customerSatisfactionPotential = Math.round(avgCustomerImpact);
  }
};

// Method to validate allocation strategy totals 100%
roadmapSchema.methods.validateAllocation = function() {
  const total = this.allocationStrategy.strategic + this.allocationStrategy.customerDriven + this.allocationStrategy.maintenance;
  return Math.abs(total - 100) < 0.01; // Allow for floating point precision
};

// Get roadmap timeline view
roadmapSchema.virtual('timeline').get(function() {
  const quarters = {};
  
  this.items.forEach(item => {
    if (item.timeframe.quarter) {
      if (!quarters[item.timeframe.quarter]) {
        quarters[item.timeframe.quarter] = [];
      }
      quarters[item.timeframe.quarter].push({
        title: item.title,
        priority: item.priority,
        category: item.category,
        status: item.status
      });
    }
  });
  
  return quarters;
});

// Indexes for better query performance
roadmapSchema.index({ projectId: 1, isActive: 1 });
roadmapSchema.index({ type: 1, timeHorizon: 1 });
roadmapSchema.index({ createdAt: -1 });
roadmapSchema.index({ 'items.status': 1 });

module.exports = mongoose.model('Roadmap', roadmapSchema);
