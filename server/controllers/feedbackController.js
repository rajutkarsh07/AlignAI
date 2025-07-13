const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Feedback = require('../models/Feedback');
const Project = require('../models/Project');
const aiService = require('../services/aiService');

// Configure multer for feedback file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = 'uploads/feedback';
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/csv',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only PDF, DOCX, DOC, TXT, and CSV files are allowed.'
        )
      );
    }
  },
});

// Get all feedback for a project
const getProjectFeedback = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      priority,
      sentiment,
      search,
    } = req.query;

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const query = { projectId: req.params.projectId, isActive: true };

    const feedbackDocs = await Feedback.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter feedback items if needed
    let allFeedbackItems = [];
    feedbackDocs.forEach((doc) => {
      let items = doc.feedbackItems.filter((item) => !item.isIgnored);

      if (category) items = items.filter((item) => item.category === category);
      if (priority) items = items.filter((item) => item.priority === priority);
      if (sentiment)
        items = items.filter((item) => item.sentiment === sentiment);
      if (search) {
        items = items.filter(
          (item) =>
            item.content.toLowerCase().includes(search.toLowerCase()) ||
            item.extractedKeywords.some((keyword) =>
              keyword.toLowerCase().includes(search.toLowerCase())
            )
        );
      }

      allFeedbackItems.push(
        ...items.map((item) => ({
          ...item.toObject(),
          feedbackDocId: doc._id,
          feedbackDocName: doc.name,
        }))
      );
    });

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      data: allFeedbackItems, // Return the flattened items directly
      meta: {
        feedbackDocs,
        summary: calculateOverallSummary(feedbackDocs),
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback',
    });
  }
};

// Get feedback by ID
const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate(
      'projectId',
      'name description'
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found',
      });
    }

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback',
    });
  }
};

// Create new feedback collection
const createFeedback = async (req, res) => {
  try {
    const { projectId, name, description, feedbackItems } = req.body;

    // Validate required fields
    if (
      !projectId ||
      !name ||
      !feedbackItems ||
      !Array.isArray(feedbackItems)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, name, and feedback items array are required',
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

    // Process feedback items with AI analysis
    const processedItems = [];
    for (const item of feedbackItems) {
      if (!item.content) continue;

      // Normalize source value
      const normalizedSource = normalizeSourceValue(item.source || 'manual');

      try {
        const analysis = await aiService.analyzeFeedback(item.content);
        processedItems.push({
          content: item.content,
          source: normalizedSource,
          category: analysis.category,
          sentiment: analysis.sentiment,
          priority: analysis.priority,
          extractedKeywords: analysis.extractedKeywords,
          aiAnalysis: {
            summary: analysis.summary,
            actionableItems: analysis.actionableItems,
            relatedFeatures: analysis.relatedFeatures,
            urgencyScore: analysis.urgencyScore,
          },
          customerInfo: item.customerInfo || {},
          tags: item.tags || [],
        });
      } catch (analysisError) {
        console.warn(
          'AI analysis failed for feedback item, using defaults:',
          analysisError
        );
        processedItems.push({
          content: item.content,
          source: normalizedSource,
          category: 'other',
          sentiment: 'neutral',
          priority: 'medium',
          extractedKeywords: [],
          aiAnalysis: {
            summary: item.content.substring(0, 100) + '...',
            actionableItems: [],
            relatedFeatures: [],
            urgencyScore: 5,
          },
          customerInfo: item.customerInfo || {},
          tags: item.tags || [],
        });
      }
    }

    const feedback = new Feedback({
      projectId,
      name,
      description,
      feedbackItems: processedItems,
    });

    const savedFeedback = await feedback.save();

    res.status(201).json({
      success: true,
      data: savedFeedback,
      message: 'Feedback collection created successfully',
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create feedback collection',
    });
  }
};

// Create feedback from uploaded document
const createFeedbackFromUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { projectId, name, description } = req.body;

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

    // Extract text from uploaded document
    const fileBuffer = await fs.readFile(req.file.path);
    const extractedText = await aiService.extractTextFromDocument(
      fileBuffer,
      req.file.mimetype
    );

    // Use enhanced document processing
    const processedDocument = await aiService.processDocumentFeedback(
      extractedText,
      project.description || ''
    );

    // Process each feedback item with AI analysis
    const processedItems = [];
    for (const item of processedDocument.feedbackItems.slice(0, 100)) {
      // Limit to 100 items
      try {
        const analysis = await aiService.analyzeFeedback(item.content);
        processedItems.push({
          content: item.content,
          source: 'document-upload',
          category: analysis.category,
          sentiment: analysis.sentiment,
          priority: analysis.priority,
          extractedKeywords: analysis.extractedKeywords,
          aiAnalysis: {
            summary: analysis.summary,
            actionableItems: analysis.actionableItems,
            relatedFeatures: analysis.relatedFeatures,
            urgencyScore: analysis.urgencyScore,
          },
          tags: item.type ? [item.type] : [],
        });
      } catch (analysisError) {
        console.warn('AI analysis failed for feedback item:', analysisError);
        processedItems.push({
          content: item.content,
          source: 'document-upload',
          category: 'other',
          sentiment: 'neutral',
          priority: 'medium',
          extractedKeywords: [],
          aiAnalysis: {
            summary: item.content.substring(0, 100) + '...',
            actionableItems: [],
            relatedFeatures: [],
            urgencyScore: 5,
          },
          tags: item.type ? [item.type] : [],
        });
      }
    }

    const feedback = new Feedback({
      projectId,
      name,
      description:
        description || `Feedback extracted from ${req.file.originalname}`,
      feedbackItems: processedItems,
    });

    const savedFeedback = await feedback.save();

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.status(201).json({
      success: true,
      data: savedFeedback,
      message: `Feedback collection created with ${processedItems.length} items`,
      extractedText: extractedText.substring(0, 500) + '...', // Return preview for enhancement
    });
  } catch (error) {
    console.error('Error creating feedback from upload:', error);

    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up uploaded file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create feedback from document',
    });
  }
};

// Enhance raw feedback text with AI analysis
const enhanceFeedback = async (req, res) => {
  try {
    const { projectId, rawText, fileName } = req.body;

    if (!projectId || !rawText) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and raw text are required',
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

    // Split text into individual feedback items (improved splitting)
    const feedbackLines = rawText
      .split(/\n\s*\n|\r\n\s*\r\n|\.\s*\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 20); // Filter out very short lines

    // Process each feedback item with enhanced AI analysis
    const processedItems = [];
    for (const content of feedbackLines.slice(0, 50)) {
      // Limit to 50 items for performance
      try {
        const analysis = await aiService.analyzeFeedback(content);
        processedItems.push({
          content,
          source: 'document-upload-enhanced',
          category: analysis.category,
          sentiment: analysis.sentiment,
          priority: analysis.priority,
          extractedKeywords: analysis.extractedKeywords,
          aiAnalysis: {
            summary: analysis.summary,
            actionableItems: analysis.actionableItems,
            relatedFeatures: analysis.relatedFeatures,
            urgencyScore: analysis.urgencyScore,
          },
        });
      } catch (analysisError) {
        console.warn('AI analysis failed for feedback item:', analysisError);
        processedItems.push({
          content,
          source: 'document-upload-enhanced',
          category: 'other',
          sentiment: 'neutral',
          priority: 'medium',
          extractedKeywords: [],
          aiAnalysis: {
            summary: content.substring(0, 100) + '...',
            actionableItems: [],
            relatedFeatures: [],
            urgencyScore: 5,
          },
        });
      }
    }

    const feedback = new Feedback({
      projectId,
      name: `Enhanced Feedback from ${fileName || 'Document'}`,
      description: `AI-enhanced feedback extracted from ${
        fileName || 'uploaded document'
      }`,
      feedbackItems: processedItems,
    });

    const savedFeedback = await feedback.save();

    res.status(201).json({
      success: true,
      data: savedFeedback,
      message: `Enhanced feedback collection created with ${processedItems.length} items`,
    });
  } catch (error) {
    console.error('Error enhancing feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enhance feedback',
    });
  }
};

// Update feedback collection
const updateFeedback = async (req, res) => {
  try {
    const { name, description, feedbackItems } = req.body;

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found',
      });
    }

    // Update basic fields
    if (name) feedback.name = name;
    if (description) feedback.description = description;

    // Update feedback items if provided
    if (feedbackItems && Array.isArray(feedbackItems)) {
      feedback.feedbackItems = feedbackItems;
    }

    feedback.version += 1;
    const updatedFeedback = await feedback.save();

    res.json({
      success: true,
      data: updatedFeedback,
      message: 'Feedback updated successfully',
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback',
    });
  }
};

// Toggle ignore status of feedback item
const toggleFeedbackItemIgnore = async (req, res) => {
  try {
    const { isIgnored } = req.body;

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found',
      });
    }

    const feedbackItem = feedback.feedbackItems.id(req.params.itemId);

    if (!feedbackItem) {
      return res.status(404).json({
        success: false,
        error: 'Feedback item not found',
      });
    }

    feedbackItem.isIgnored =
      isIgnored !== undefined ? isIgnored : !feedbackItem.isIgnored;

    const updatedFeedback = await feedback.save();

    res.json({
      success: true,
      data: updatedFeedback,
      message: `Feedback item ${
        feedbackItem.isIgnored ? 'ignored' : 'unignored'
      } successfully`,
    });
  } catch (error) {
    console.error('Error toggling feedback item ignore status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback item',
    });
  }
};

// Delete feedback collection (soft delete)
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found',
      });
    }

    feedback.isActive = false;
    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback collection deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete feedback collection',
    });
  }
};

// Get feedback analytics for a project
const getFeedbackAnalytics = async (req, res) => {
  try {
    const feedbackDocs = await Feedback.find({
      projectId: req.params.projectId,
      isActive: true,
    });

    const analytics = calculateDetailedAnalytics(feedbackDocs);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error calculating feedback analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate feedback analytics',
    });
  }
};

// Helper method to calculate overall summary
const calculateOverallSummary = (feedbackDocs) => {
  const allItems = feedbackDocs.flatMap((doc) =>
    doc.feedbackItems.filter((item) => !item.isIgnored)
  );

  const summary = {
    totalItems: allItems.length,
    totalCollections: feedbackDocs.length,
    categoryBreakdown: {},
    sentimentBreakdown: {},
    priorityBreakdown: {},
    topKeywords: {},
    averageUrgencyScore: 0,
  };

  allItems.forEach((item) => {
    // Categories
    summary.categoryBreakdown[item.category] =
      (summary.categoryBreakdown[item.category] || 0) + 1;

    // Sentiment
    summary.sentimentBreakdown[item.sentiment] =
      (summary.sentimentBreakdown[item.sentiment] || 0) + 1;

    // Priority
    summary.priorityBreakdown[item.priority] =
      (summary.priorityBreakdown[item.priority] || 0) + 1;

    // Keywords
    item.extractedKeywords.forEach((keyword) => {
      summary.topKeywords[keyword] = (summary.topKeywords[keyword] || 0) + 1;
    });
  });

  // Calculate average urgency score
  if (allItems.length > 0) {
    summary.averageUrgencyScore =
      allItems.reduce(
        (sum, item) => sum + (item.aiAnalysis?.urgencyScore || 5),
        0
      ) / allItems.length;
  }

  // Convert keywords to sorted array
  summary.topKeywords = Object.entries(summary.topKeywords)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([keyword, frequency]) => ({ keyword, frequency }));

  return summary;
};

// Helper method for detailed analytics
const calculateDetailedAnalytics = (feedbackDocs) => {
  const allItems = feedbackDocs.flatMap((doc) =>
    doc.feedbackItems.filter((item) => !item.isIgnored)
  );

  return {
    overview: calculateOverallSummary(feedbackDocs),
    trends: {
      weeklyVolume: calculateWeeklyVolume(allItems),
      sentimentTrend: calculateSentimentTrend(allItems),
      categoryTrend: calculateCategoryTrend(allItems),
    },
    insights: {
      criticalIssues: allItems.filter((item) => item.priority === 'critical')
        .length,
      highImpactFeatures: allItems.filter(
        (item) =>
          item.category === 'feature-request' && item.priority === 'high'
      ).length,
      commonPainPoints: identifyCommonPainPoints(allItems),
    },
  };
};

// Helper methods for trend analysis
const calculateWeeklyVolume = (items) => {
  // Implementation for weekly volume calculation
  return [];
};

const calculateSentimentTrend = (items) => {
  // Implementation for sentiment trend calculation
  return [];
};

const calculateCategoryTrend = (items) => {
  // Implementation for category trend calculation
  return [];
};

const identifyCommonPainPoints = (items) => {
  // Implementation for identifying common pain points
  return [];
};

// Helper method to normalize source values
const normalizeSourceValue = (source) => {
  // Handle common variations and normalize to valid enum values
  const sourceMapping = {
    'Manual Entry': 'manual',
    'manual entry': 'manual',
    Manual: 'manual',
    MANUAL: 'manual',
    'App Store': 'app-store',
    'app store': 'app-store',
    appstore: 'app-store',
    Email: 'email',
    EMAIL: 'email',
    'Social Media': 'social-media',
    'social media': 'social-media',
    socialmedia: 'social-media',
    Survey: 'survey',
    SURVEY: 'survey',
    'Support Ticket': 'support-ticket',
    'support ticket': 'support-ticket',
    support: 'support-ticket',
    'User Interview': 'user-interview',
    'user interview': 'user-interview',
    interview: 'user-interview',
    'Document Upload': 'manual',
    'document upload': 'manual',
  };

  // Return mapped value or default to 'manual' if not found
  return sourceMapping[source] || 'manual';
};

module.exports = {
  upload,
  getProjectFeedback,
  getFeedbackById,
  createFeedback,
  createFeedbackFromUpload,
  enhanceFeedback,
  updateFeedback,
  toggleFeedbackItemIgnore,
  deleteFeedback,
  getFeedbackAnalytics,
};
