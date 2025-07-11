const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['feature', 'bug_fix', 'improvement', 'research', 'maintenance'],
    default: 'feature'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['backlog', 'planned', 'in_progress', 'review', 'completed', 'cancelled'],
    default: 'backlog'
  },
  effort: {
    type: String,
    enum: ['small', 'medium', 'large', 'epic'],
    default: 'medium'
  },
  timeline: {
    estimatedHours: Number,
    startDate: Date,
    dueDate: Date,
    completedDate: Date
  },
  assignee: {
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
      enum: ['blocks', 'blocked_by', 'related'],
      default: 'blocks'
    }
  }],
  tags: [String],
  category: {
    type: String,
    enum: ['company_goal', 'customer_feedback', 'technical_debt', 'innovation'],
    default: 'company_goal'
  },
  aiSuggestions: {
    originalDescription: String,
    enhancedDescription: String,
    suggestedTags: [String],
    estimatedEffort: String,
    relatedFeedback: [{
      feedbackId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback'
      },
      relevance: Number
    }],
    reasoning: String
  },
  metrics: {
    customerImpact: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    businessValue: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    technicalComplexity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    }
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    author: String,
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ category: 1, type: 1 });
taskSchema.index({ 'timeline.dueDate': 1 });
taskSchema.index({ tags: 1 });

// Pre-save middleware to update timestamps
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for formatted due date
taskSchema.virtual('formattedDueDate').get(function() {
  return this.timeline.dueDate ? this.timeline.dueDate.toLocaleDateString() : 'Not set';
});

// Virtual for progress percentage
taskSchema.virtual('progress').get(function() {
  const statusProgress = {
    'backlog': 0,
    'planned': 25,
    'in_progress': 50,
    'review': 75,
    'completed': 100,
    'cancelled': 0
  };
  return statusProgress[this.status] || 0;
});

// Method to update status
taskSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  if (newStatus === 'completed') {
    this.timeline.completedDate = new Date();
  }
  return this.save();
};

// Method to add comment
taskSchema.methods.addComment = function(author, content) {
  this.comments.push({ author, content });
  return this.save();
};

// Static method to get tasks by status
taskSchema.statics.getByStatus = function(status) {
  return this.find({ status }).sort({ priority: -1, 'timeline.dueDate': 1 });
};

// Static method to get tasks by category
taskSchema.statics.getByCategory = function(category) {
  return this.find({ category }).sort({ priority: -1 });
};

// Static method to get overdue tasks
taskSchema.statics.getOverdueTasks = function() {
  return this.find({
    'timeline.dueDate': { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  }).sort({ 'timeline.dueDate': 1 });
};

module.exports = mongoose.model('Task', taskSchema); 