const mongoose = require('mongoose');

const feedbackItemSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  source: {
    type: String,
    enum: [
      'app-store',
      'email',
      'social-media',
      'survey',
      'support-ticket',
      'user-interview',
      'manual',
      'document-upload',
      'document-upload-enhanced',
    ],
    default: 'manual',
  },
  category: {
    type: String,
    enum: [
      'bug-report',
      'feature-request',
      'improvement',
      'complaint',
      'praise',
      'question',
      'other',
    ],
    default: 'other',
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral',
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium',
  },
  tags: [String],
  isIgnored: {
    type: Boolean,
    default: false,
  },
  customerInfo: {
    userId: String,
    email: String,
    name: String,
    segment: String,
  },
  extractedKeywords: [String],
  aiAnalysis: {
    summary: String,
    actionableItems: [String],
    relatedFeatures: [String],
    urgencyScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 5,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const feedbackSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  feedbackItems: [feedbackItemSchema],
  summary: {
    totalItems: {
      type: Number,
      default: 0,
    },
    categoryBreakdown: {
      bugReports: { type: Number, default: 0 },
      featureRequests: { type: Number, default: 0 },
      improvements: { type: Number, default: 0 },
      complaints: { type: Number, default: 0 },
      praise: { type: Number, default: 0 },
      questions: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    sentimentBreakdown: {
      positive: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
    },
    topKeywords: [
      {
        keyword: String,
        frequency: Number,
      },
    ],
    actionableInsights: [String],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  version: {
    type: Number,
    default: 1,
  },
});

// Update the updatedAt field and recalculate summary before saving
feedbackSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  this.calculateSummary();
  next();
});

// Method to calculate summary statistics
feedbackSchema.methods.calculateSummary = function () {
  const activeFeedback = this.feedbackItems.filter((item) => !item.isIgnored);

  this.summary.totalItems = activeFeedback.length;

  // Reset counters
  const categoryBreakdown = {
    bugReports: 0,
    featureRequests: 0,
    improvements: 0,
    complaints: 0,
    praise: 0,
    questions: 0,
    other: 0,
  };

  const sentimentBreakdown = {
    positive: 0,
    negative: 0,
    neutral: 0,
  };

  const keywordFreq = {};

  activeFeedback.forEach((item) => {
    // Count categories
    const categoryKey =
      item.category.replace('-', '').charAt(0).toUpperCase() +
      item.category
        .replace('-', '')
        .slice(1)
        .replace(/([A-Z])/g, '$1');
    if (item.category === 'bug-report') categoryBreakdown.bugReports++;
    else if (item.category === 'feature-request')
      categoryBreakdown.featureRequests++;
    else if (item.category === 'improvement') categoryBreakdown.improvements++;
    else if (item.category === 'complaint') categoryBreakdown.complaints++;
    else if (item.category === 'praise') categoryBreakdown.praise++;
    else if (item.category === 'question') categoryBreakdown.questions++;
    else categoryBreakdown.other++;

    // Count sentiment
    sentimentBreakdown[item.sentiment]++;

    // Count keywords
    item.extractedKeywords.forEach((keyword) => {
      keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
    });
  });

  this.summary.categoryBreakdown = categoryBreakdown;
  this.summary.sentimentBreakdown = sentimentBreakdown;

  // Top 10 keywords
  this.summary.topKeywords = Object.entries(keywordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([keyword, frequency]) => ({ keyword, frequency }));
};

// Indexes for better query performance
feedbackSchema.index({ projectId: 1, isActive: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ 'feedbackItems.category': 1 });
feedbackSchema.index({ 'feedbackItems.priority': 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
