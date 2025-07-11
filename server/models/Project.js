const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  goals: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  }],
  timeline: {
    startDate: Date,
    endDate: Date,
    quarter: String
  },
  stakeholders: [{
    name: String,
    role: String,
    email: String
  }],
  budget: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'on-hold'],
    default: 'planning'
  },
  tags: [String],
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
  aiContext: {
    type: String,
    default: ''
  },
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

// Index for better query performance
projectSchema.index({ name: 1, status: 1 });
projectSchema.index({ 'timeline.quarter': 1 });

// Pre-save middleware to update aiContext
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Generate AI context from project data
  const contextParts = [
    `Project: ${this.name}`,
    `Description: ${this.description}`,
    `Goals: ${this.goals.map(g => `${g.title} (${g.priority} priority): ${g.description}`).join('; ')}`,
    `Timeline: ${this.timeline.quarter || 'Not specified'}`,
    `Status: ${this.status}`
  ];
  
  this.aiContext = contextParts.join('\n');
  next();
});

module.exports = mongoose.model('Project', projectSchema); 