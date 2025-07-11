const vertexAIService = require('../services/ai/vertexAIService');
const Project = require('../models/Project');
const Feedback = require('../models/Feedback');
const Task = require('../models/Task');

class AIController {
  // Chat with AI assistant
  async chatWithAI(req, res) {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Messages array is required'
        });
      }

      // Get project and feedback context
      const [project, activeFeedback] = await Promise.all([
        Project.findOne().sort({ createdAt: -1 }),
        Feedback.getActiveFeedback()
      ]);

      const projectContext = project ? project.aiContext : '';
      
      let feedbackContext = 'No active customer feedback available.';
      if (activeFeedback.length > 0) {
        const feedbackSummaries = activeFeedback.slice(0, 10).map(f => 
          `${f.category.toUpperCase()}: ${f.content.substring(0, 100)}... (${f.priority} priority)`
        );
        feedbackContext = `Active Customer Feedback (${activeFeedback.length} items):\n${feedbackSummaries.join('\n')}`;
      }

      // Chat with AI
      const result = await vertexAIService.chatWithAgent(messages, projectContext, feedbackContext);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get AI response',
          error: result.error
        });
      }

      res.json({
        success: true,
        response: result.response,
        usage: result.usage
      });
    } catch (error) {
      console.error('Chat with AI error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process chat request',
        error: error.message
      });
    }
  }

  // Generate roadmap
  async generateRoadmap(req, res) {
    try {
      const { request } = req.body;

      if (!request) {
        return res.status(400).json({
          success: false,
          message: 'Roadmap request is required'
        });
      }

      // Get project and feedback context
      const [project, activeFeedback] = await Promise.all([
        Project.findOne().sort({ createdAt: -1 }),
        Feedback.getActiveFeedback()
      ]);

      const projectContext = project ? project.aiContext : '';
      
      let feedbackContext = 'No active customer feedback available.';
      if (activeFeedback.length > 0) {
        const feedbackSummaries = activeFeedback.slice(0, 10).map(f => 
          `${f.category.toUpperCase()}: ${f.content.substring(0, 100)}... (${f.priority} priority)`
        );
        feedbackContext = `Active Customer Feedback (${activeFeedback.length} items):\n${feedbackSummaries.join('\n')}`;
      }

      // Generate roadmap
      const result = await vertexAIService.generateRoadmap(request, projectContext, feedbackContext);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate roadmap',
          error: result.error
        });
      }

      res.json({
        success: true,
        data: result.data,
        usage: result.usage
      });
    } catch (error) {
      console.error('Generate roadmap error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate roadmap',
        error: error.message
      });
    }
  }

  // Suggest task enhancements
  async suggestTaskEnhancements(req, res) {
    try {
      const { taskDescription } = req.body;

      if (!taskDescription) {
        return res.status(400).json({
          success: false,
          message: 'Task description is required'
        });
      }

      // Get project and feedback context
      const [project, activeFeedback] = await Promise.all([
        Project.findOne().sort({ createdAt: -1 }),
        Feedback.getActiveFeedback()
      ]);

      const projectContext = project ? project.aiContext : '';
      
      let feedbackContext = 'No active customer feedback available.';
      if (activeFeedback.length > 0) {
        const feedbackSummaries = activeFeedback.slice(0, 10).map(f => 
          `${f.category.toUpperCase()}: ${f.content.substring(0, 100)}... (${f.priority} priority)`
        );
        feedbackContext = `Active Customer Feedback (${activeFeedback.length} items):\n${feedbackSummaries.join('\n')}`;
      }

      // Get task suggestions
      const result = await vertexAIService.suggestTaskEnhancements(taskDescription, projectContext, feedbackContext);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get task suggestions',
          error: result.error
        });
      }

      res.json({
        success: true,
        suggestions: result.suggestions,
        usage: result.usage
      });
    } catch (error) {
      console.error('Suggest task enhancements error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get task suggestions',
        error: error.message
      });
    }
  }

  // Analyze feedback with AI
  async analyzeFeedback(req, res) {
    try {
      const { feedbackContent } = req.body;

      if (!feedbackContent) {
        return res.status(400).json({
          success: false,
          message: 'Feedback content is required'
        });
      }

      // Get project context
      const project = await Project.findOne().sort({ createdAt: -1 });
      const projectContext = project ? project.aiContext : '';

      // Analyze feedback
      const result = await vertexAIService.analyzeFeedback(feedbackContent, projectContext);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to analyze feedback',
          error: result.error
        });
      }

      res.json({
        success: true,
        analysis: result.analysis,
        usage: result.usage
      });
    } catch (error) {
      console.error('Analyze feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze feedback',
        error: error.message
      });
    }
  }

  // Get AI insights
  async getAIInsights(req, res) {
    try {
      // Get project and feedback data
      let project, activeFeedback, tasks;
      
      try {
        [project, activeFeedback, tasks] = await Promise.all([
          Project.findOne().sort({ createdAt: -1 }),
          Feedback.getActiveFeedback(),
          Task.find().sort({ createdAt: -1 }).limit(20)
        ]);
      } catch (dbError) {
        console.error('Database connection error:', dbError);
        // Return a friendly message when database is not available
        return res.json({
          success: true,
          data: {
            insights: ['Database connection is being established. Please try again in a moment.'],
            recommendations: ['Ensure your MongoDB Atlas connection is properly configured.'],
            risks: ['Data persistence may be affected until connection is restored.'],
            opportunities: ['Once connected, you can use all AI features.'],
            roadmapAdjustments: ['Create your first project to get started.'],
            resourceRecommendations: ['Check your environment configuration.']
          },
          connectionIssue: true
        });
      }

      if (!project) {
        return res.json({
          success: true,
          data: {
            insights: ['No project found. Create your first project to get started.'],
            recommendations: ['Go to the Project page and add your company goals and objectives.'],
            risks: ['Without project context, AI insights will be limited.'],
            opportunities: ['Setting up a project will enable full AI-powered analysis.'],
            roadmapAdjustments: ['Define your project scope and timeline.'],
            resourceRecommendations: ['Start with basic project setup.']
          },
          noProject: true
        });
      }

      // Build context for AI analysis
      const projectContext = project.aiContext;
      
      let feedbackContext = 'No active customer feedback available.';
      if (activeFeedback.length > 0) {
        const feedbackSummaries = activeFeedback.slice(0, 10).map(f => 
          `${f.category.toUpperCase()}: ${f.content.substring(0, 100)}... (${f.priority} priority)`
        );
        feedbackContext = `Active Customer Feedback (${activeFeedback.length} items):\n${feedbackSummaries.join('\n')}`;
      }

      const taskContext = tasks.length > 0 ? 
        `Current Tasks (${tasks.length}):\n${tasks.map(t => `${t.title} (${t.status})`).join('\n')}` : 
        'No tasks created yet.';

      // Generate insights prompt
      const insightsPrompt = `
Based on the following information, provide strategic insights and recommendations:

PROJECT CONTEXT:
${projectContext}

CUSTOMER FEEDBACK:
${feedbackContext}

CURRENT TASKS:
${taskContext}

Please provide:
1. Key insights about customer needs vs company goals
2. Priority recommendations for the next quarter
3. Potential risks and opportunities
4. Suggested roadmap adjustments
5. Resource allocation recommendations

Format as JSON:
{
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"],
  "risks": ["risk1", "risk2"],
  "opportunities": ["opp1", "opp2"],
  "roadmapAdjustments": ["adj1", "adj2"],
  "resourceRecommendations": ["res1", "res2"]
}
`;

      // Get AI insights
      try {
        const result = await vertexAIService.model.generateContent(insightsPrompt);
        const response = await result.response;
        const text = response.text();

        try {
          const insights = JSON.parse(text);
          res.json({
            success: true,
            data: insights,
            usage: {
              promptTokens: response.usageMetadata?.promptTokenCount || 0,
              responseTokens: response.usageMetadata?.candidatesTokenCount || 0,
            }
          });
        } catch (parseError) {
          res.json({
            success: true,
            data: {
              insights: ['AI analysis completed'],
              recommendations: ['Review the detailed analysis'],
              risks: ['Consider all factors'],
              opportunities: ['Explore potential improvements'],
              roadmapAdjustments: ['Adjust based on insights'],
              resourceRecommendations: ['Optimize resource allocation']
            },
            rawResponse: text,
            usage: {
              promptTokens: response.usageMetadata?.promptTokenCount || 0,
              responseTokens: response.usageMetadata?.candidatesTokenCount || 0,
            }
          });
        }
      } catch (aiError) {
        console.error('AI service error:', aiError);
        // Provide fallback insights when AI service is not available
        res.json({
          success: true,
          data: {
            insights: [
              'Project goals are well-defined with clear priorities',
              'Customer feedback integration will improve product-market fit',
              'Task management system is ready for implementation'
            ],
            recommendations: [
              'Continue gathering customer feedback regularly',
              'Prioritize high-impact tasks based on business value',
              'Set up regular roadmap review cycles'
            ],
            risks: [
              'Limited customer feedback may lead to misaligned priorities',
              'Resource constraints could delay high-priority tasks'
            ],
            opportunities: [
              'AI-powered insights will enhance decision making',
              'Real-time feedback integration can improve responsiveness'
            ],
            roadmapAdjustments: [
              'Consider quarterly roadmap reviews',
              'Balance technical debt with new features'
            ],
            resourceRecommendations: [
              'Allocate resources based on priority and effort',
              'Consider team capacity when planning sprints'
            ]
          },
          aiServiceUnavailable: true,
          message: 'AI insights are currently limited. Set up Google Vertex AI for enhanced analysis.'
        });
      }
    } catch (error) {
      console.error('Get AI insights error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get AI insights',
        error: error.message
      });
    }
  }

  // Generate task from feedback
  async generateTaskFromFeedback(req, res) {
    try {
      const { feedbackId } = req.params;

      const feedback = await Feedback.findById(feedbackId);
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      // Get project context
      const project = await Project.findOne().sort({ createdAt: -1 });
      const projectContext = project ? project.aiContext : '';

      // Generate task suggestion
      const taskPrompt = `
Based on this customer feedback, suggest a task to address it:

FEEDBACK:
${feedback.content}
Category: ${feedback.category}
Priority: ${feedback.priority}
Sentiment: ${feedback.sentiment}

PROJECT CONTEXT:
${projectContext}

Please suggest a task with:
1. Clear title and description
2. Appropriate priority and effort
3. Timeline estimate
4. Category (company_goal, customer_feedback, technical_debt, innovation)
5. Related metrics

Format as JSON:
{
  "title": "Task title",
  "description": "Detailed description",
  "priority": "low|medium|high|critical",
  "effort": "small|medium|large|epic",
  "estimatedHours": number,
  "category": "company_goal|customer_feedback|technical_debt|innovation",
  "tags": ["tag1", "tag2"],
  "timeline": {
    "startDate": "YYYY-MM-DD",
    "dueDate": "YYYY-MM-DD"
  },
  "metrics": {
    "customerImpact": 1-10,
    "businessValue": 1-10,
    "technicalComplexity": 1-10
  },
  "reasoning": "Why this task addresses the feedback"
}
`;

      const result = await vertexAIService.model.generateContent(taskPrompt);
      const response = await result.response;
      const text = response.text();

      try {
        const taskSuggestion = JSON.parse(text);
        res.json({
          success: true,
          data: taskSuggestion,
          feedback: feedback,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            responseTokens: response.usageMetadata?.candidatesTokenCount || 0,
          }
        });
      } catch (parseError) {
        res.json({
          success: true,
          data: {
            title: `Address ${feedback.category} feedback`,
            description: `Task to address: ${feedback.content}`,
            priority: feedback.priority,
            effort: 'medium',
            estimatedHours: 8,
            category: 'customer_feedback',
            tags: [feedback.category],
            timeline: {
              startDate: new Date().toISOString().split('T')[0],
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            metrics: {
              customerImpact: 7,
              businessValue: 6,
              technicalComplexity: 5
            },
            reasoning: 'Generated from customer feedback'
          },
          feedback: feedback,
          rawResponse: text,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            responseTokens: response.usageMetadata?.candidatesTokenCount || 0,
          }
        });
      }
    } catch (error) {
      console.error('Generate task from feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate task from feedback',
        error: error.message
      });
    }
  }
}

module.exports = new AIController(); 