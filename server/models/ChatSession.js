const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  metadata: {
    agent: {
      type: String,
      enum: ['general', 'roadmap', 'task-enhancer'],
      default: 'general'
    },
    generatedRoadmap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap'
    },
    relatedTasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }],
    searchResults: [String],
    processingTime: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSessionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false // Allow null for global chat sessions
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    maxlength: 200,
    default: 'New Chat Session'
  },
  messages: [messageSchema],
  context: {
    currentAgent: {
      type: String,
      enum: ['general', 'roadmap', 'task-enhancer'],
      default: 'general'
    },
    lastQuery: String,
    activeFilters: {
      priority: [String],
      category: [String],
      timeframe: String
    }
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

// Update the updatedAt field before saving
chatSessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Auto-generate title based on first user message
chatSessionSchema.methods.generateTitle = function() {
  const firstUserMessage = this.messages.find(msg => msg.role === 'user');
  if (firstUserMessage) {
    const content = firstUserMessage.content;
    this.title = content.length > 50 ? content.substring(0, 47) + '...' : content;
  }
};

// Get conversation summary
chatSessionSchema.virtual('summary').get(function() {
  return {
    messageCount: this.messages.length,
    userMessages: this.messages.filter(msg => msg.role === 'user').length,
    assistantMessages: this.messages.filter(msg => msg.role === 'assistant').length,
    lastActivity: this.updatedAt,
    duration: this.updatedAt - this.createdAt
  };
});

// Indexes for better query performance
chatSessionSchema.index({ projectId: 1, isActive: 1 });
chatSessionSchema.index({ sessionId: 1 });
chatSessionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
