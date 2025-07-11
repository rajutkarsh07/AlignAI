const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['app_store', 'email', 'social_media', 'survey', 'support_ticket', 'manual'],
    required: true
  },
  category: {
    type: String,
    enum: ['bug', 'feature_request', 'complaint', 'praise', 'suggestion', 'question'],
    default: 'suggestion'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  status: {
    type: String,
    enum: ['active', 'ignored', 'addressed', 'planned'],
    default: 'active'
  },
  tags: [String],
  customerInfo: {
    name: String,
    email: String,
    userId: String,
    platform: String,
    appVersion: String
  },
  metadata: {
    originalText: String,
    processedText: String,
    keywords: [String],
    entities: [String],
    confidence: Number
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
  aiAnalysis: {
    summary: String,
    keyPoints: [String],
    suggestedActions: [String],
    impactScore: Number
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

// Indexes for better query performance
feedbackSchema.index({ status: 1, priority: 1 });
feedbackSchema.index({ category: 1, sentiment: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ tags: 1 });

// Pre-save middleware to update timestamps
feedbackSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for formatted date
feedbackSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Method to mark as ignored
feedbackSchema.methods.markAsIgnored = function() {
  this.status = 'ignored';
  return this.save();
};

// Method to mark as addressed
feedbackSchema.methods.markAsAddressed = function() {
  this.status = 'addressed';
  return this.save();
};

// Static method to get active feedback
feedbackSchema.statics.getActiveFeedback = function() {
  return this.find({ status: 'active' }).sort({ priority: -1, createdAt: -1 });
};

// Static method to get feedback by category
feedbackSchema.statics.getByCategory = function(category) {
  return this.find({ category, status: 'active' }).sort({ priority: -1 });
};

module.exports = mongoose.model('Feedback', feedbackSchema); 