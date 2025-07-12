const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  officialPlan: {
    type: String,
    required: true,
    maxlength: 10000
  },
  formattedPlan: {
    type: String,
    maxlength: 15000
  },
  goals: [{
    title: String,
    description: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    targetQuarter: String,
    status: {
      type: String,
      enum: ['planned', 'in-progress', 'completed', 'on-hold'],
      default: 'planned'
    }
  }],
  metadata: {
    industry: String,
    teamSize: Number,
    budget: String,
    timeline: String,
    stakeholders: [String]
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
  },
  version: {
    type: Number,
    default: 1
  }
});

// Update the updatedAt field before saving
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
projectSchema.index({ name: 1, isActive: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
