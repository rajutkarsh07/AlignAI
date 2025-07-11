const Feedback = require('../models/Feedback');
const documentProcessor = require('../services/fileProcessing/documentProcessor');
const vertexAIService = require('../services/ai/vertexAIService');

class FeedbackController {
  // Get all feedback
  async getAllFeedback(req, res) {
    try {
      const { status, category, priority, page = 1, limit = 20 } = req.query;
      
      const filter = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;

      const skip = (page - 1) * limit;
      
      const feedback = await Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Feedback.countDocuments(filter);

      res.json({
        success: true,
        data: feedback,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve feedback',
        error: error.message
      });
    }
  }

  // Get active feedback only
  async getActiveFeedback(req, res) {
    try {
      const feedback = await Feedback.getActiveFeedback();
      
      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      console.error('Get active feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active feedback',
        error: error.message
      });
    }
  }

  // Add feedback manually
  async addFeedback(req, res) {
    try {
      const {
        content,
        source,
        category,
        priority,
        sentiment,
        tags,
        customerInfo
      } = req.body;

      if (!content || !source) {
        return res.status(400).json({
          success: false,
          message: 'Content and source are required'
        });
      }

      // Get project context for AI analysis
      const Project = require('../models/Project');
      const project = await Project.findOne().sort({ createdAt: -1 });
      const projectContext = project ? project.aiContext : '';

      // Analyze feedback with AI
      const aiAnalysis = await vertexAIService.analyzeFeedback(content, projectContext);
      
      const feedbackData = {
        content,
        source,
        category: category || (aiAnalysis.success ? aiAnalysis.analysis.category : 'suggestion'),
        priority: priority || (aiAnalysis.success ? aiAnalysis.analysis.priority : 'medium'),
        sentiment: sentiment || (aiAnalysis.success ? aiAnalysis.analysis.sentiment : 'neutral'),
        tags: tags || (aiAnalysis.success ? aiAnalysis.analysis.tags : []),
        customerInfo: customerInfo || {},
        aiAnalysis: aiAnalysis.success ? {
          summary: aiAnalysis.analysis.summary,
          keyPoints: aiAnalysis.analysis.keyPoints,
          suggestedActions: aiAnalysis.analysis.suggestedActions,
          impactScore: aiAnalysis.analysis.impactScore
        } : {}
      };

      const feedback = new Feedback(feedbackData);
      await feedback.save();

      res.json({
        success: true,
        message: 'Feedback added successfully',
        data: feedback,
        aiAnalysis: aiAnalysis.success ? aiAnalysis.analysis : null
      });
    } catch (error) {
      console.error('Add feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add feedback',
        error: error.message
      });
    }
  }

  // Upload feedback document
  async uploadFeedbackDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { originalname, path, size } = req.file;

      // Validate file
      if (!documentProcessor.validateFileType(originalname)) {
        return res.status(400).json({
          success: false,
          message: 'Unsupported file format. Please upload PDF, DOCX, DOC, or TXT files.'
        });
      }

      if (!documentProcessor.validateFileSize(size)) {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB.'
        });
      }

      // Process document
      const processResult = await documentProcessor.processDocument(path, originalname);
      
      if (!processResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process document',
          error: processResult.error
        });
      }

      // Extract key information
      const keyInfo = await documentProcessor.extractKeyInformation(processResult.content, 'feedback');

      // Get project context for AI analysis
      const Project = require('../models/Project');
      const project = await Project.findOne().sort({ createdAt: -1 });
      const projectContext = project ? project.aiContext : '';

      // Analyze feedback with AI
      const aiAnalysis = await vertexAIService.analyzeFeedback(processResult.content, projectContext);

      // Create feedback entry
      const feedbackData = {
        content: processResult.content,
        source: 'document_upload',
        category: aiAnalysis.success ? aiAnalysis.analysis.category : 'suggestion',
        priority: aiAnalysis.success ? aiAnalysis.analysis.priority : 'medium',
        sentiment: aiAnalysis.success ? aiAnalysis.analysis.sentiment : 'neutral',
        tags: aiAnalysis.success ? aiAnalysis.analysis.tags : keyInfo.keyPoints.slice(0, 5),
        attachments: [{
          filename: originalname,
          originalName: originalname,
          path: path,
          size: size
        }],
        aiAnalysis: aiAnalysis.success ? {
          summary: aiAnalysis.analysis.summary,
          keyPoints: aiAnalysis.analysis.keyPoints,
          suggestedActions: aiAnalysis.analysis.suggestedActions,
          impactScore: aiAnalysis.analysis.impactScore
        } : {
          summary: keyInfo.summary,
          keyPoints: keyInfo.keyPoints,
          suggestedActions: [],
          impactScore: keyInfo.sentiment === 'negative' ? 7 : 5
        }
      };

      const feedback = new Feedback(feedbackData);
      await feedback.save();

      res.json({
        success: true,
        message: 'Feedback document uploaded and processed successfully',
        data: {
          feedback,
          documentInfo: {
            content: processResult.content,
            keyInfo,
            metadata: processResult.metadata
          },
          aiAnalysis: aiAnalysis.success ? aiAnalysis.analysis : null
        }
      });
    } catch (error) {
      console.error('Upload feedback document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload and process feedback document',
        error: error.message
      });
    }
  }

  // Update feedback status
  async updateFeedbackStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'ignored', 'addressed', 'planned'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: active, ignored, addressed, planned'
        });
      }

      const feedback = await Feedback.findById(id);
      
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      feedback.status = status;
      await feedback.save();

      res.json({
        success: true,
        message: 'Feedback status updated successfully',
        data: feedback
      });
    } catch (error) {
      console.error('Update feedback status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update feedback status',
        error: error.message
      });
    }
  }

  // Update feedback
  async updateFeedback(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const feedback = await Feedback.findById(id);
      
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      // Update allowed fields
      const allowedFields = ['content', 'category', 'priority', 'sentiment', 'tags', 'customerInfo'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          feedback[field] = updateData[field];
        }
      });

      await feedback.save();

      res.json({
        success: true,
        message: 'Feedback updated successfully',
        data: feedback
      });
    } catch (error) {
      console.error('Update feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update feedback',
        error: error.message
      });
    }
  }

  // Delete feedback
  async deleteFeedback(req, res) {
    try {
      const { id } = req.params;

      const feedback = await Feedback.findById(id);
      
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      await Feedback.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Feedback deleted successfully'
      });
    } catch (error) {
      console.error('Delete feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete feedback',
        error: error.message
      });
    }
  }

  // Get feedback statistics
  async getFeedbackStats(req, res) {
    try {
      let stats = [{ active: 0, critical: 0 }], categoryStats = [], sourceStats = [];
      try {
        stats = await Feedback.aggregate([
          { $group: {
            _id: null,
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            critical: { $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] } }
          }}
        ]);
        categoryStats = await Feedback.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);
        sourceStats = await Feedback.aggregate([
          { $group: { _id: "$source", count: { $sum: 1 } } }
        ]);
      } catch (dbError) {
        console.error('Database connection error:', dbError);
        return res.json({
          success: true,
          data: {
            overview: { active: 0, critical: 0 },
            categories: [],
            sources: [],
            connectionIssue: true
          }
        });
      }
      if (!stats || stats.length === 0) {
        return res.json({
          success: true,
          data: {
            overview: { active: 0, critical: 0 },
            categories: [],
            sources: [],
            noData: true
          }
        });
      }
      res.json({
        success: true,
        data: {
          overview: stats[0] || {},
          categories: categoryStats,
          sources: sourceStats
        }
      });
    } catch (error) {
      console.error('Get feedback stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feedback statistics',
        error: error.message
      });
    }
  }

  // Get feedback context for AI
  async getFeedbackContext(req, res) {
    try {
      const activeFeedback = await Feedback.getActiveFeedback();
      
      if (activeFeedback.length === 0) {
        return res.json({
          success: true,
          context: 'No active customer feedback available.',
          feedback: []
        });
      }

      // Build context string from active feedback
      const feedbackSummaries = activeFeedback.map(f => 
        `${f.category.toUpperCase()}: ${f.content.substring(0, 100)}... (${f.priority} priority, ${f.sentiment} sentiment)`
      );

      const context = [
        `Active Customer Feedback (${activeFeedback.length} items):`,
        ...feedbackSummaries.slice(0, 10) // Limit to first 10 for context
      ].join('\n');

      res.json({
        success: true,
        context,
        feedback: activeFeedback
      });
    } catch (error) {
      console.error('Get feedback context error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feedback context',
        error: error.message
      });
    }
  }

  // Bulk update feedback status
  async bulkUpdateStatus(req, res) {
    try {
      const { feedbackIds, status } = req.body;

      if (!Array.isArray(feedbackIds) || feedbackIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Feedback IDs array is required'
        });
      }

      if (!['active', 'ignored', 'addressed', 'planned'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const result = await Feedback.updateMany(
        { _id: { $in: feedbackIds } },
        { $set: { status } }
      );

      res.json({
        success: true,
        message: `Updated ${result.modifiedCount} feedback items`,
        data: {
          modifiedCount: result.modifiedCount
        }
      });
    } catch (error) {
      console.error('Bulk update feedback status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update feedback status',
        error: error.message
      });
    }
  }
}

module.exports = new FeedbackController(); 